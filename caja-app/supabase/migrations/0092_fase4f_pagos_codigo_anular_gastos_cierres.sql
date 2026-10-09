-- Fase 4 — pagos de planes como "ventas" del super admin:
--   * código de operación automático (PL-000001, PL-000002…),
--   * método, comprobante (foto) y efectivo recibido/vuelto en cada pago,
--   * ANULAR un pago revierte el vencimiento (solo el último pago vigente
--     de cada negocio, para que las fechas no se crucen),
--   * gastos y cierres de caja propios del super admin (como las cajas
--     de los negocios: el cierre guarda una instantánea descargable).
-- Idempotente. Correr en el SQL Editor de Caja Tonazo.

-- 1) Columnas nuevas de pagos_plataforma
create sequence if not exists public.pagos_plataforma_codigo_seq;
alter table public.pagos_plataforma add column if not exists codigo text;
alter table public.pagos_plataforma alter column codigo set default ('PL-' || lpad(nextval('public.pagos_plataforma_codigo_seq')::text, 6, '0'));
-- Los pagos que ya existían reciben su código en orden de fecha.
update public.pagos_plataforma p
  set codigo = 'PL-' || lpad(x.n::text, 6, '0')
  from (
    select id, row_number() over (order by created_at, id) as n
    from public.pagos_plataforma where codigo is null
  ) x
  where p.id = x.id;
select setval(
  'public.pagos_plataforma_codigo_seq',
  greatest(1, coalesce((select max(substring(codigo from 4)::int) from public.pagos_plataforma where codigo ~ '^PL-[0-9]+$'), 0)),
  (select count(*) > 0 from public.pagos_plataforma where codigo ~ '^PL-[0-9]+$')
);
create unique index if not exists pagos_plataforma_codigo_uidx on public.pagos_plataforma (codigo);

alter table public.pagos_plataforma add column if not exists comprobante_url text;
alter table public.pagos_plataforma add column if not exists monto_recibido numeric;
alter table public.pagos_plataforma add column if not exists vuelto numeric;
alter table public.pagos_plataforma add column if not exists anulado boolean not null default false;
alter table public.pagos_plataforma add column if not exists anulado_at timestamptz;

-- 2) registrar_pago_plan: + comprobante, efectivo recibido y vuelto.
--    Reemplaza la versión de 0090 (misma ventana de renovación).
drop function if exists public.registrar_pago_plan(uuid, int, numeric, text, text, uuid);
create or replace function public.registrar_pago_plan(
  p_negocio_id uuid,
  p_meses int,
  p_monto numeric,
  p_metodo text default null,
  p_nota text default null,
  p_plan_id uuid default null,
  p_comprobante_url text default null,
  p_monto_recibido numeric default null
)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_anterior timestamptz;
  v_nuevo timestamptz;
  v_plan_id uuid;
begin
  if not public.is_super_admin() then
    raise exception 'Solo el super admin puede registrar pagos.';
  end if;
  if p_meses is null or p_meses < 1 or p_meses > 36 then
    raise exception 'Cantidad de meses inválida.';
  end if;
  if lower(coalesce(p_metodo, '')) in ('yape', 'plin', 'otros', 'transferencia') and coalesce(p_comprobante_url, '') = '' then
    raise exception 'Con un pago digital (Yape/Plin/Otros) el comprobante es obligatorio.';
  end if;
  if lower(coalesce(p_metodo, '')) = 'efectivo' and p_monto_recibido is not null and p_monto_recibido < coalesce(p_monto, 0) then
    raise exception 'El efectivo recibido es menor al monto.';
  end if;

  select plan_vence_at, plan_id into v_anterior, v_plan_id
    from public.negocios where id = p_negocio_id for update;
  if not found then
    raise exception 'Negocio no encontrado.';
  end if;

  if not public.plan_puede_renovar(v_anterior) then
    raise exception 'Este negocio tiene su plan vigente hasta el %: solo se puede renovar en los últimos 3 días antes de que venza (desde el %).',
      to_char(v_anterior at time zone 'America/Lima', 'DD/MM/YYYY'),
      to_char((v_anterior - interval '3 days') at time zone 'America/Lima', 'DD/MM/YYYY')
      using errcode = 'P0001', hint = 'PLAN_VIGENTE';
  end if;

  v_plan_id := coalesce(p_plan_id, v_plan_id);
  v_nuevo := greatest(coalesce(v_anterior, now()), now()) + make_interval(months => p_meses);

  update public.negocios
    set plan_vence_at = v_nuevo, plan_en_prueba = false, plan_id = v_plan_id
    where id = p_negocio_id;

  insert into public.pagos_plataforma (
    negocio_id, plan_id, meses, monto, metodo, nota, vence_anterior, vence_nuevo,
    comprobante_url, monto_recibido, vuelto
  )
  values (
    p_negocio_id, v_plan_id, p_meses, coalesce(p_monto, 0), nullif(trim(p_metodo), ''), nullif(trim(p_nota), ''),
    v_anterior, v_nuevo, nullif(trim(p_comprobante_url), ''), p_monto_recibido,
    case when p_monto_recibido is not null then p_monto_recibido - coalesce(p_monto, 0) end
  );

  return v_nuevo;
end;
$$;

-- 3) Aprobar petición: ahora también guarda el comprobante en el pago.
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
    'Petición de pago del negocio', r.plan_id, r.comprobante_url, null
  );

  update public.peticiones_plan
    set estado = 'aprobado', resuelto_por = auth.uid(), resuelto_at = now()
    where id = p_peticion_id;
  return v_vence;
end;
$$;

-- 4) Anular un pago: vuelve el vencimiento a como estaba antes de ese
--    pago. Solo el ÚLTIMO pago no anulado de cada negocio.
create or replace function public.anular_pago_plan(p_pago_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.pagos_plataforma%rowtype;
  v_ultimo uuid;
begin
  if not public.is_super_admin() then
    raise exception 'Solo el super admin puede anular pagos.';
  end if;
  select * into p from public.pagos_plataforma where id = p_pago_id for update;
  if not found then
    raise exception 'Pago no encontrado.';
  end if;
  if p.anulado then
    raise exception 'Este pago ya está anulado.';
  end if;
  select id into v_ultimo from public.pagos_plataforma
    where negocio_id = p.negocio_id and not anulado
    order by created_at desc limit 1;
  if v_ultimo <> p.id then
    raise exception 'Solo se puede anular el último pago de este negocio (anula primero los posteriores).';
  end if;

  update public.negocios
    set plan_vence_at = p.vence_anterior,
        -- Si ya no le queda ningún otro pago válido, vuelve a "prueba".
        plan_en_prueba = not exists (
          select 1 from public.pagos_plataforma
          where negocio_id = p.negocio_id and not anulado and id <> p.id
        )
    where id = p.negocio_id;

  update public.pagos_plataforma set anulado = true, anulado_at = now() where id = p.id;
end;
$$;

-- 5) Gastos del super admin (gestor de gastos manual).
create table if not exists public.gastos_plataforma (
  id          uuid primary key default gen_random_uuid(),
  descripcion text not null,
  monto       numeric not null check (monto > 0),
  categoria   text,
  fecha       timestamptz not null default now(),
  creado_por  uuid default auth.uid()
);
alter table public.gastos_plataforma enable row level security;
drop policy if exists "gastos_plataforma_super_admin_all" on public.gastos_plataforma;
create policy "gastos_plataforma_super_admin_all" on public.gastos_plataforma
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- 6) Cierres de caja del super admin: instantánea de lo cobrado y gastado
--    desde el cierre anterior (como las cajas de los negocios). El
--    detalle completo va en 'detalle' para volver a descargarlo en Excel.
create table if not exists public.cierres_plataforma (
  id             uuid primary key default gen_random_uuid(),
  desde          timestamptz,
  hasta          timestamptz not null default now(),
  total_cobrado  numeric not null default 0,
  total_gastos   numeric not null default 0,
  balance        numeric not null default 0,
  por_metodo     jsonb not null default '{}'::jsonb,
  cantidad_pagos int not null default 0,
  detalle        jsonb not null default '{}'::jsonb,
  cerrado_por    uuid default auth.uid(),
  created_at     timestamptz not null default now()
);
alter table public.cierres_plataforma enable row level security;
drop policy if exists "cierres_plataforma_super_admin_all" on public.cierres_plataforma;
create policy "cierres_plataforma_super_admin_all" on public.cierres_plataforma
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- 7) El super admin sube los comprobantes de la Recarga rápida a
--    comprobantes-fotos/plataforma/<negocio>/…
drop policy if exists "comprobantes_fotos_plataforma_insert" on storage.objects;
create policy "comprobantes_fotos_plataforma_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'comprobantes-fotos'
    and (storage.foldername(name))[1] = 'plataforma'
    and public.is_super_admin()
  );

do $$
declare
  t text;
begin
  foreach t in array array['gastos_plataforma', 'cierres_plataforma'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

notify pgrst, 'reload schema';
