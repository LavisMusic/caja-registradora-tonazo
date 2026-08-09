-- Migración: Supabase Auth (Celular+PIN para clientes, clave secreta para
-- admin) + RLS sobre las tablas de fiado.
--
-- IMPORTANTE — orden de ejecución recomendado (ver plan de implementación):
--   1) Ejecutar TODO este archivo EXCEPTO los bloques "ENABLE ROW LEVEL
--      SECURITY" y las políticas (sección "PASO 2" más abajo) primero.
--   2) Crear manualmente el usuario admin en el Dashboard (Authentication →
--      Users → Add user, email admin@tonazo.com, Auto Confirm activado) y
--      correr el UPDATE de profiles.role='admin' al final de este archivo.
--   3) Confirmar que /admin ya loguea de verdad con Supabase Auth antes de
--      correr la sección "PASO 2" (habilitar RLS). Antes de ese punto, la
--      key anon sigue pudiendo leer/escribir estas 3 tablas sin problema;
--      después de habilitar RLS, YA NO — solo admin autenticado o el dueño
--      de la fila.

-- =========================================================================
-- PASO 1: columnas/tablas nuevas, no rompen nada (no habilita RLS todavía)
-- =========================================================================

-- Vincula clientes_fiado a una cuenta real de Supabase Auth. Nullable:
-- los fiados creados antes de esta migración no tienen cuenta y siguen
-- funcionando igual (solo visibles para el admin).
alter table public.clientes_fiado
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create index if not exists clientes_fiado_auth_user_id_idx
  on public.clientes_fiado (auth_user_id);

-- profiles: solo guarda el rol. El nombre del cliente ya vive en
-- clientes_fiado.nombre — no lo duplicamos aquí.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'cliente' check (role in ('admin', 'cliente')),
  created_at timestamptz not null default now()
);

-- is_admin(): SECURITY DEFINER para poder usarse desde las políticas de
-- OTRAS tablas sin recursión sobre las propias políticas de profiles.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- =========================================================================
-- PASO 2: habilitar RLS — correr esto SOLO después de confirmar que el
-- admin ya puede loguearse de verdad en /admin (ver nota arriba).
-- =========================================================================

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
-- Sin política de insert/update/delete para anon/authenticated: solo la
-- Edge Function create-cliente (con service_role, que bypassea RLS) o el
-- SQL editor del Dashboard pueden escribir en profiles.

alter table public.clientes_fiado enable row level security;
alter table public.fiado_items enable row level security;
alter table public.movimientos_fiado enable row level security;

-- clientes_fiado: el admin ve todo; un cliente ve solo su propia fila.
create policy "clientes_fiado_select" on public.clientes_fiado
  for select using (public.is_admin() or auth_user_id = auth.uid());

create policy "clientes_fiado_admin_write" on public.clientes_fiado
  for all using (public.is_admin()) with check (public.is_admin());

-- fiado_items: unido a través de clientes_fiado.cliente_id
create policy "fiado_items_select" on public.fiado_items
  for select using (
    public.is_admin() or exists (
      select 1 from public.clientes_fiado c
      where c.id = fiado_items.cliente_id and c.auth_user_id = auth.uid()
    )
  );

create policy "fiado_items_admin_write" on public.fiado_items
  for all using (public.is_admin()) with check (public.is_admin());

-- movimientos_fiado: mismo patrón de join
create policy "movimientos_fiado_select" on public.movimientos_fiado
  for select using (
    public.is_admin() or exists (
      select 1 from public.clientes_fiado c
      where c.id = movimientos_fiado.cliente_id and c.auth_user_id = auth.uid()
    )
  );

create policy "movimientos_fiado_admin_write" on public.movimientos_fiado
  for all using (public.is_admin()) with check (public.is_admin());

-- =========================================================================
-- PASO 3 (manual, una sola vez): después de crear el usuario admin desde
-- el Dashboard (Authentication → Users → Add user →
-- email: admin@tonazo.com, password: la clave secreta elegida,
-- Auto Confirm User: activado), correr:
-- =========================================================================

-- insert into public.profiles (id, role)
-- select id, 'admin' from auth.users where email = 'admin@tonazo.com'
-- on conflict (id) do update set role = 'admin';
