-- Flujo de aprobación de pagos: el cliente sube su comprobante y queda
-- "pendiente"; solo cuando el admin aprueba se descuenta la deuda real
-- (fiado_items/movimientos_fiado). Nada de esto toca el saldo del
-- cliente hasta la aprobación.

-- =========================================================================
-- 1) Storage: bucket privado para los comprobantes que suben los clientes.
--    Privado (public = false) porque solo el admin debe poder verlos.
-- =========================================================================

insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', false)
on conflict (id) do nothing;

-- El cliente autenticado solo puede subir DENTRO de su propia carpeta
-- (prefijo = su auth.uid()), para que un cliente no pueda escribir en la
-- carpeta de otro.
drop policy if exists "comprobantes_cliente_insert" on storage.objects;
create policy "comprobantes_cliente_insert" on storage.objects
  for insert
  with check (
    bucket_id = 'comprobantes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Solo el admin puede leer/listar los comprobantes.
drop policy if exists "comprobantes_admin_select" on storage.objects;
create policy "comprobantes_admin_select" on storage.objects
  for select
  using (bucket_id = 'comprobantes' and public.is_admin());

-- =========================================================================
-- 2) Tabla pagos_pendientes
-- =========================================================================

create table if not exists public.pagos_pendientes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes_fiado(id) on delete cascade,
  monto numeric(10,2) not null check (monto > 0),
  tipo text not null check (tipo in ('restar', 'cancelar')),
  url_comprobante text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobado', 'rechazado')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id)
);
-- Confirmado: clientes_fiado.id es uuid en este proyecto (no bigint).

create index if not exists pagos_pendientes_cliente_id_idx on public.pagos_pendientes (cliente_id);
create index if not exists pagos_pendientes_estado_idx on public.pagos_pendientes (estado);

alter table public.pagos_pendientes enable row level security;

-- Cliente: solo puede insertar pagos para SU PROPIO cliente_id (verificado
-- por join con clientes_fiado.auth_user_id), siempre en estado
-- 'pendiente' y sin poder autoasignarse una resolución.
drop policy if exists "pagos_pendientes_cliente_insert" on public.pagos_pendientes;
create policy "pagos_pendientes_cliente_insert" on public.pagos_pendientes
  for insert
  with check (
    estado = 'pendiente'
    and resolved_at is null
    and resolved_by is null
    and exists (
      select 1 from public.clientes_fiado c
      where c.id = pagos_pendientes.cliente_id and c.auth_user_id = auth.uid()
    )
  );

-- Admin: control total (ver todos los pendientes/históricos, aprobar o
-- rechazar). El cliente NO puede leer esta tabla (ni siquiera sus propios
-- pagos) — su saldo actualizado ya se refleja solo en clientes_fiado /
-- fiado_items / movimientos_fiado una vez aprobado.
drop policy if exists "pagos_pendientes_admin_select" on public.pagos_pendientes;
create policy "pagos_pendientes_admin_select" on public.pagos_pendientes
  for select using (public.is_admin());

drop policy if exists "pagos_pendientes_admin_update" on public.pagos_pendientes;
create policy "pagos_pendientes_admin_update" on public.pagos_pendientes
  for update using (public.is_admin()) with check (public.is_admin());
