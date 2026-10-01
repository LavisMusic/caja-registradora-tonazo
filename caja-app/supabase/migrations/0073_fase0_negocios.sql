-- Fase 0 del super-admin multi-negocio: fundación de datos.
--
-- Alcance DELIBERADAMENTE acotado a "agregar columnas + backfill", sin
-- tocar ninguna política RLS ni ninguna restricción (constraint)
-- existente:
--   - Hoy is_admin()/is_staff() (usadas en las políticas de pedidos,
--     ver 0054/0057) están definidas directo en Supabase Studio, no en
--     una migración local — no se pueden extender a ciegas sin verlas.
--   - Hoy solo existe UN negocio (Tonazo), así que no hay nada que
--     "filtrar" todavía: no hay ventana de fuga real que tapar.
-- El scoping por negocio en RLS + el arreglo de un par de
-- restricciones que asumen un solo negocio (unicidad de
-- categorias.nombre, unicidad de clientes_fiado.auth_user_id) quedan
-- para la Fase 1, cuando el panel super-admin cree de verdad un
-- segundo negocio y esas restricciones empiecen a importar.
--
-- Jerarquía existente reusada tal cual: localidades → sucursales →
-- cajas. negocio_id se agrega en localidades (la cabeza) y en las
-- tablas que hoy son GLOBALES sin ningún scoping (productos,
-- categorias, stock, gastos) y en clientes_fiado/profiles. historial,
-- comprobantes, fiado_items, movimientos_fiado e inventario_sucursales
-- YA tienen sucursal_id/caja_id — su negocio_id se deriva
-- transitivamente vía sucursal→localidad, no hace falta duplicarlo acá.

create table if not exists public.rubros (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  orden int not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.negocios (
  id uuid primary key default gen_random_uuid(),
  rubro_id uuid not null references public.rubros(id),
  nombre text not null,
  logo_url text,
  activo boolean not null default true,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

-- RLS habilitado sin políticas todavía = solo service_role puede
-- leer/escribir (mismo patrón que webhook_outbox/webhook_inbox en
-- 0055). El panel super-admin (Fase 1) trae sus propias políticas.
alter table public.rubros enable row level security;
alter table public.negocios enable row level security;

do $$
declare
  v_rubro_id uuid;
  v_negocio_id uuid;
begin
  insert into public.rubros (nombre, orden)
    values ('Abarrotes', 0)
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into v_rubro_id;

  insert into public.negocios (rubro_id, nombre, orden)
    values (v_rubro_id, 'Tonazo', 0)
    returning id into v_negocio_id;

  -- localidades: cabeza de la jerarquía existente.
  alter table public.localidades add column if not exists negocio_id uuid references public.negocios(id);
  update public.localidades set negocio_id = v_negocio_id where negocio_id is null;
  alter table public.localidades alter column negocio_id set not null;

  -- Catálogo — hoy global, pasa a ser por negocio.
  alter table public.productos add column if not exists negocio_id uuid references public.negocios(id);
  update public.productos set negocio_id = v_negocio_id where negocio_id is null;
  alter table public.productos alter column negocio_id set not null;

  alter table public.categorias add column if not exists negocio_id uuid references public.negocios(id);
  update public.categorias set negocio_id = v_negocio_id where negocio_id is null;
  alter table public.categorias alter column negocio_id set not null;

  alter table public.stock add column if not exists negocio_id uuid references public.negocios(id);
  update public.stock set negocio_id = v_negocio_id where negocio_id is null;
  alter table public.stock alter column negocio_id set not null;

  -- gastos: no tenía ningún scoping (ni sucursal_id).
  alter table public.gastos add column if not exists negocio_id uuid references public.negocios(id);
  update public.gastos set negocio_id = v_negocio_id where negocio_id is null;
  alter table public.gastos alter column negocio_id set not null;

  -- clientes_fiado: identidad de login compartida entre negocios, pero
  -- el saldo/fiado se lleva por separado en cada uno (decidido con el
  -- usuario) — una fila nueva por (persona, negocio) de acá en más.
  -- La restricción de unicidad sobre auth_user_id solo se ajusta en
  -- Fase 1, cuando exista un segundo negocio real donde probarlo.
  alter table public.clientes_fiado add column if not exists negocio_id uuid references public.negocios(id);
  update public.clientes_fiado set negocio_id = v_negocio_id where negocio_id is null;
  alter table public.clientes_fiado alter column negocio_id set not null;

  -- profiles: admin/cajero/cliente existentes pertenecen a Tonazo.
  -- Nulo queda reservado para el futuro rol 'super_admin' (no
  -- pertenece a ningún negocio en particular). No hay constraint de
  -- rol que ampliar: 'role' es texto libre, sin check.
  alter table public.profiles add column if not exists negocio_id uuid references public.negocios(id);
  update public.profiles set negocio_id = v_negocio_id where negocio_id is null and role in ('admin', 'cajero', 'cliente');
end $$;
