-- Fase 4 — Monetización: planes de suscripción por negocio + gestor de
-- contacto de la plataforma (compartido con Taxi-PE).
-- =====================================================================
-- Reglas acordadas con el usuario (2026-09-30):
--   * Suscripción mensual por negocio. Planes por tamaño (límite de
--     sucursales activas — hoy cada sucursal tiene UNA caja y no hay
--     forma de agregar más, así que el límite real es de sucursales).
--   * 30 días de prueba al crear el negocio (los que ya existían: desde
--     hoy). Tonazo queda EXENTO (sin vencimiento ni límites).
--   * Estados, calculados contra now() — no hace falta ningún cron:
--       exento | prueba | activo     → todo funciona
--       gracia (días 1-5 vencido)    → fuera del directorio, NO recibe
--                                      pedidos online; la caja sigue
--       suspendido (día 6 en más)    → tampoco puede vender en caja
--   * El cobro es manual (Yape/transferencia): el super admin registra
--     el pago y eso extiende el vencimiento (registrar_pago_plan).
--   * Los bloqueos viven ACÁ (triggers), no solo en la UI.
--
-- ORDEN: correr ANTES la migración de Taxi-PE
-- 20260930100000_plataforma_contacto.sql (y tener desplegada la función
-- webhook-caja-contacto), porque al final de esta migración se envía el
-- contacto inicial a Taxi-PE. Si se corre al revés no se rompe nada: el
-- envío queda pendiente y fn_webhook_reconciliar lo reintenta.
--
-- Idempotente.

-- =====================================================================
-- 1) Planes
-- =====================================================================
create table if not exists public.planes (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null unique,
  precio_mensual  numeric not null default 0 check (precio_mensual >= 0),
  -- null = sin límite
  max_sucursales  int check (max_sucursales is null or max_sucursales >= 1),
  orden           int not null default 0,
  activo          boolean not null default true,
  created_at      timestamptz not null default now()
);

alter table public.planes enable row level security;

-- Lectura pública: el admin de cada negocio ve el nombre/límite de su
-- plan, y no es información sensible.
drop policy if exists "planes_select" on public.planes;
create policy "planes_select" on public.planes
  for select using (true);

drop policy if exists "planes_super_admin_all" on public.planes;
create policy "planes_super_admin_all" on public.planes
  for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Planes de ejemplo — el super admin edita nombres/precios/límites.
insert into public.planes (nombre, precio_mensual, max_sucursales, orden) values
  ('Básico', 0, 1, 0),
  ('Crecimiento', 0, 3, 1),
  ('Pro', 0, null, 2)
on conflict (nombre) do nothing;

-- =====================================================================
-- 2) Plan de cada negocio
-- =====================================================================
alter table public.negocios add column if not exists plan_id uuid references public.planes(id) on delete set null;
alter table public.negocios add column if not exists plan_vence_at timestamptz;
alter table public.negocios add column if not exists plan_exento boolean not null default false;
-- true hasta el primer pago registrado: distingue 'prueba' de 'activo'.
alter table public.negocios add column if not exists plan_en_prueba boolean not null default true;

update public.negocios set plan_exento = true where slug = 'tonazo';

update public.negocios
  set plan_id = (select id from public.planes where nombre = 'Básico')
  where plan_id is null;

-- Los negocios que ya existían arrancan su prueba de 30 días HOY.
update public.negocios
  set plan_vence_at = now() + interval '30 days'
  where plan_vence_at is null and not plan_exento;

-- Negocios nuevos: 30 días de prueba + plan Básico por defecto.
create or replace function public.fn_negocio_plan_defaults()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if NEW.plan_vence_at is null and not coalesce(NEW.plan_exento, false) then
    NEW.plan_vence_at := now() + interval '30 days';
  end if;
  if NEW.plan_id is null then
    NEW.plan_id := (select id from public.planes where nombre = 'Básico');
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_negocio_plan_defaults on public.negocios;
create trigger trg_negocio_plan_defaults
  before insert on public.negocios
  for each row execute function public.fn_negocio_plan_defaults();

-- =====================================================================
-- 3) Estado del plan
-- =====================================================================
-- "Columna calculada" de PostgREST: select('*, plan_estado') la trae
-- junto con la fila, sin guardar nada que pueda quedar desactualizado.
create or replace function public.plan_estado(n public.negocios)
returns text
language sql
stable
as $$
  select case
    when n.plan_exento then 'exento'
    when n.plan_vence_at is null then 'activo'
    when now() < n.plan_vence_at then
      case when n.plan_en_prueba then 'prueba' else 'activo' end
    when now() < n.plan_vence_at + interval '5 days' then 'gracia'
    else 'suspendido'
  end;
$$;

-- Lo mismo por id (para los triggers de abajo, que corren con el rol
-- del que inserta y podrían no ver la fila del negocio por RLS).
create or replace function public.negocio_plan_estado(p_negocio_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select public.plan_estado(n) from public.negocios n where n.id = p_negocio_id),
    'activo'
  );
$$;

create or replace function public.negocio_de_sucursal(p_sucursal_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select l.negocio_id
  from public.sucursales s
  join public.localidades l on l.id = s.localidad_id
  where s.id = p_sucursal_id;
$$;

-- =====================================================================
-- 4) Bloqueos
-- =====================================================================
-- 4a) Pedidos online: solo con el plan al día (no en gracia/suspendido).
create or replace function public.fn_pedido_requiere_plan()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_estado text;
begin
  v_estado := public.negocio_plan_estado(public.negocio_de_sucursal(NEW.sucursal_id));
  if v_estado in ('gracia', 'suspendido') then
    raise exception 'Este negocio no está recibiendo pedidos online en este momento.'
      using errcode = 'P0001', hint = 'PLAN_VENCIDO';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_pedido_requiere_plan on public.pedidos;
create trigger trg_pedido_requiere_plan
  before insert on public.pedidos
  for each row execute function public.fn_pedido_requiere_plan();

-- 4b) Ventas en caja (historial, lo que escribe registrar_venta):
-- bloqueadas recién con el plan SUSPENDIDO (la gracia deja vender).
create or replace function public.fn_venta_requiere_plan()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if NEW.sucursal_id is not null
     and public.negocio_plan_estado(public.negocio_de_sucursal(NEW.sucursal_id)) = 'suspendido' then
    raise exception 'El plan de este negocio está suspendido. Regulariza el pago para seguir vendiendo.'
      using errcode = 'P0001', hint = 'PLAN_SUSPENDIDO';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_venta_requiere_plan on public.historial;
create trigger trg_venta_requiere_plan
  before insert on public.historial
  for each row execute function public.fn_venta_requiere_plan();

-- 4c) Límite de sucursales activas según el plan. Se revisa al crear
-- una sucursal y al reactivar una desactivada. Las que ya existen
-- nunca se tocan. El super admin y los negocios exentos no tienen
-- límite.
create or replace function public.fn_sucursal_limite_plan()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_negocio_id uuid;
  v_exento boolean;
  v_max int;
  v_plan text;
  v_activas int;
begin
  if not coalesce(NEW.activo, true) then return NEW; end if;
  if TG_OP = 'UPDATE' and coalesce(OLD.activo, false) then return NEW; end if;
  if public.is_super_admin() then return NEW; end if;

  select l.negocio_id into v_negocio_id from public.localidades l where l.id = NEW.localidad_id;
  select n.plan_exento, p.max_sucursales, p.nombre
    into v_exento, v_max, v_plan
    from public.negocios n
    left join public.planes p on p.id = n.plan_id
    where n.id = v_negocio_id;

  if coalesce(v_exento, false) or v_max is null then return NEW; end if;

  select count(*) into v_activas
    from public.sucursales s
    join public.localidades l on l.id = s.localidad_id
    where l.negocio_id = v_negocio_id
      and coalesce(s.activo, true)
      and s.id <> NEW.id;

  if v_activas >= v_max then
    raise exception 'Tu plan % permite hasta % sucursal(es) activa(s). Para agregar más, mejora tu plan.',
      v_plan, v_max
      using errcode = 'P0001', hint = 'PLAN_LIMITE_SUCURSALES';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_sucursal_limite_plan on public.sucursales;
create trigger trg_sucursal_limite_plan
  before insert or update of activo on public.sucursales
  for each row execute function public.fn_sucursal_limite_plan();

-- =====================================================================
-- 5) Pagos a la plataforma
-- =====================================================================
create table if not exists public.pagos_plataforma (
  id              uuid primary key default gen_random_uuid(),
  negocio_id      uuid not null references public.negocios(id) on delete cascade,
  plan_id         uuid references public.planes(id) on delete set null,
  meses           int not null check (meses between 1 and 24),
  monto           numeric not null default 0 check (monto >= 0),
  metodo          text,
  nota            text,
  vence_anterior  timestamptz,
  vence_nuevo     timestamptz not null,
  registrado_por  uuid default auth.uid(),
  created_at      timestamptz not null default now()
);

create index if not exists pagos_plataforma_negocio_idx on public.pagos_plataforma (negocio_id, created_at desc);

alter table public.pagos_plataforma enable row level security;

drop policy if exists "pagos_plataforma_super_admin_select" on public.pagos_plataforma;
create policy "pagos_plataforma_super_admin_select" on public.pagos_plataforma
  for select using (public.is_super_admin());

-- El vencimiento nuevo se cuenta desde el vencimiento actual si todavía
-- no pasó, o desde HOY si ya venció (gracia/suspendido): el negocio
-- siempre recibe los meses completos que pagó.
create or replace function public.registrar_pago_plan(
  p_negocio_id uuid,
  p_meses int,
  p_monto numeric,
  p_metodo text default null,
  p_nota text default null
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
  if p_meses is null or p_meses < 1 or p_meses > 24 then
    raise exception 'Cantidad de meses inválida.';
  end if;

  select plan_vence_at, plan_id into v_anterior, v_plan_id
    from public.negocios where id = p_negocio_id for update;
  if not found then
    raise exception 'Negocio no encontrado.';
  end if;

  v_nuevo := greatest(coalesce(v_anterior, now()), now()) + make_interval(months => p_meses);

  update public.negocios
    set plan_vence_at = v_nuevo, plan_en_prueba = false
    where id = p_negocio_id;

  insert into public.pagos_plataforma (negocio_id, plan_id, meses, monto, metodo, nota, vence_anterior, vence_nuevo)
  values (p_negocio_id, v_plan_id, p_meses, coalesce(p_monto, 0), nullif(trim(p_metodo), ''), nullif(trim(p_nota), ''), v_anterior, v_nuevo);

  return v_nuevo;
end;
$$;

-- =====================================================================
-- 6) Contacto de la plataforma (una sola fila) — se copia a Taxi-PE
-- =====================================================================
create table if not exists public.plataforma_contacto (
  id                   int primary key default 1 check (id = 1),
  whatsapp_pagos       text,
  whatsapp_soporte     text,
  whatsapp_afiliacion  text,
  updated_at           timestamptz not null default now()
);

alter table public.plataforma_contacto enable row level security;

drop policy if exists "plataforma_contacto_select" on public.plataforma_contacto;
create policy "plataforma_contacto_select" on public.plataforma_contacto
  for select using (true);

drop policy if exists "plataforma_contacto_super_admin_write" on public.plataforma_contacto;
create policy "plataforma_contacto_super_admin_write" on public.plataforma_contacto
  for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Arranca con el número de pagos en los tres (editable en el gestor).
insert into public.plataforma_contacto (id, whatsapp_pagos, whatsapp_soporte, whatsapp_afiliacion)
values (1, '914964330', '914964330', '914964330')
on conflict (id) do nothing;

-- URL del receptor en Taxi-PE (no es un secreto, pero el routing de
-- fn_webhook_emitir lee las URLs del Vault — mismo patrón que el resto).
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'webhook_url_taxi_contacto') then
    perform vault.create_secret(
      'https://silfhbdmfdryjdzpwzvh.supabase.co/functions/v1/webhook-caja-contacto',
      'webhook_url_taxi_contacto'
    );
  end if;
end $$;

-- Routing del nuevo evento (misma función de 0065 + 'caja.contacto_plataforma').
create or replace function public.fn_webhook_emitir(
  p_event_type text, p_destino text, p_data jsonb
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_event_id uuid := gen_random_uuid();
  v_url text;
  v_sobre jsonb;
begin
  v_url := case p_event_type
    when 'caja.venta_fiado_conductor' then public.fn_webhook_secret('webhook_url_taxi_fiado')
    when 'caja.pedido_delivery'       then public.fn_webhook_secret('webhook_url_taxi_pedido')
    when 'caja.entrega_cancelar'      then public.fn_webhook_secret('webhook_url_taxi_entrega_cancelar')
    when 'caja.contacto_plataforma'   then public.fn_webhook_secret('webhook_url_taxi_contacto')
    else null
  end;
  if v_url is null then
    raise exception 'fn_webhook_emitir: sin URL para event_type %', p_event_type;
  end if;

  v_sobre := jsonb_build_object(
    'event_id', v_event_id,
    'event_type', p_event_type,
    'occurred_at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'source', 'caja',
    'data', p_data
  );

  insert into public.webhook_outbox (event_id, event_type, destino, url, payload)
  values (v_event_id, p_event_type, p_destino, v_url, v_sobre);

  perform public.fn_webhook_despachar(
    (select id from public.webhook_outbox where event_id = v_event_id)
  );
  return v_event_id;
end;
$$;

-- Cada cambio del contacto se manda a Taxi-PE. Si el envío falla, NO se
-- deshace el guardado: queda en el outbox y se reintenta solo.
create or replace function public.fn_contacto_avisar_taxi()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    perform public.fn_webhook_emitir(
      'caja.contacto_plataforma',
      'taxi',
      jsonb_build_object(
        'whatsapp_pagos', NEW.whatsapp_pagos,
        'whatsapp_soporte', NEW.whatsapp_soporte,
        'whatsapp_afiliacion', NEW.whatsapp_afiliacion
      )
    );
  exception when others then
    raise warning 'fn_contacto_avisar_taxi: %', sqlerrm;
  end;
  return NEW;
end;
$$;

drop trigger if exists trg_contacto_avisar_taxi on public.plataforma_contacto;
create trigger trg_contacto_avisar_taxi
  after insert or update on public.plataforma_contacto
  for each row execute function public.fn_contacto_avisar_taxi();

-- Envío inicial a Taxi-PE.
update public.plataforma_contacto set updated_at = now() where id = 1;

-- PostgREST: que vea la columna calculada plan_estado y las tablas nuevas.
notify pgrst, 'reload schema';
