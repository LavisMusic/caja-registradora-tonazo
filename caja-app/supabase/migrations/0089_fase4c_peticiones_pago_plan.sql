-- Fase 4 (bloque B) — el negocio paga su plan como el recolector de
-- Taxi-PE recarga su paquete: elige plan, paga por Yape/Plin/transfe-
-- rencia, sube el comprobante y queda una PETICIÓN pendiente que el
-- super admin aprueba (se extiende el vencimiento) o rechaza (con
-- motivo) desde su Centro de Peticiones.
-- =====================================================================
-- Idempotente. Correr en el SQL Editor de Caja Tonazo.

create table if not exists public.peticiones_plan (
  id              uuid primary key default gen_random_uuid(),
  negocio_id      uuid not null references public.negocios(id) on delete cascade,
  plan_id         uuid references public.planes(id) on delete set null,
  plan_nombre     text,           -- copia, por si el plan se renombra/borra
  meses           int not null check (meses between 1 and 36),
  monto           numeric not null default 0 check (monto >= 0),
  metodo          text not null,
  comprobante_url text not null,
  estado          text not null default 'pendiente'
                  check (estado in ('pendiente', 'aprobado', 'rechazado')),
  motivo_rechazo  text,
  solicitado_por  uuid default auth.uid(),
  resuelto_por    uuid,
  created_at      timestamptz not null default now(),
  resuelto_at     timestamptz
);

create index if not exists peticiones_plan_negocio_idx on public.peticiones_plan (negocio_id, created_at desc);
create index if not exists peticiones_plan_pendientes_idx on public.peticiones_plan (created_at) where estado = 'pendiente';

alter table public.peticiones_plan enable row level security;

-- El admin del negocio crea y ve las de SU negocio; el super admin, todas.
drop policy if exists "peticiones_plan_admin_insert" on public.peticiones_plan;
create policy "peticiones_plan_admin_insert" on public.peticiones_plan
  for insert to authenticated
  with check (public.is_admin() and negocio_id = public.mi_negocio_id() and estado = 'pendiente');

drop policy if exists "peticiones_plan_select" on public.peticiones_plan;
create policy "peticiones_plan_select" on public.peticiones_plan
  for select to authenticated
  using (public.is_super_admin() or (public.is_admin() and negocio_id = public.mi_negocio_id()));

-- Una sola petición pendiente por negocio a la vez.
create unique index if not exists peticiones_plan_una_pendiente
  on public.peticiones_plan (negocio_id) where estado = 'pendiente';

-- Aprobar: registra el pago (extiende el vencimiento y pasa el negocio
-- al plan pedido) y marca la petición como aprobada.
create or replace function public.aprobar_peticion_plan(p_peticion_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.peticiones_plan%rowtype;
  v_vence timestamptz;
begin
  if not public.is_super_admin() then
    raise exception 'Solo el super admin puede aprobar pagos.';
  end if;
  select * into r from public.peticiones_plan where id = p_peticion_id for update;
  if not found then
    raise exception 'Petición no encontrada.';
  end if;
  if r.estado <> 'pendiente' then
    raise exception 'Esta petición ya fue resuelta.';
  end if;

  v_vence := public.registrar_pago_plan(
    r.negocio_id, r.meses, r.monto, r.metodo,
    'Petición de pago (comprobante adjunto)', r.plan_id
  );

  update public.peticiones_plan
    set estado = 'aprobado', resuelto_por = auth.uid(), resuelto_at = now()
    where id = p_peticion_id;
  return v_vence;
end;
$$;

create or replace function public.rechazar_peticion_plan(p_peticion_id uuid, p_motivo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Solo el super admin puede rechazar pagos.';
  end if;
  if coalesce(trim(p_motivo), '') = '' then
    raise exception 'Escribe el motivo del rechazo.';
  end if;
  update public.peticiones_plan
    set estado = 'rechazado', motivo_rechazo = trim(p_motivo), resuelto_por = auth.uid(), resuelto_at = now()
    where id = p_peticion_id and estado = 'pendiente';
  if not found then
    raise exception 'La petición no existe o ya fue resuelta.';
  end if;
end;
$$;

-- Comprobantes: mismo bucket público que el resto de comprobantes de la
-- app, en la carpeta planes/<negocio_id>/ — solo el admin de ese negocio
-- puede subir ahí.
drop policy if exists "comprobantes_fotos_planes_insert" on storage.objects;
create policy "comprobantes_fotos_planes_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'comprobantes-fotos'
    and (storage.foldername(name))[1] = 'planes'
    and (storage.foldername(name))[2] = public.mi_negocio_id()::text
    and public.is_admin()
  );

-- Tiempo real: contador del Centro de Peticiones y estado de la
-- petición en la caja del negocio.
do $$
begin
  alter publication supabase_realtime add table public.peticiones_plan;
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
