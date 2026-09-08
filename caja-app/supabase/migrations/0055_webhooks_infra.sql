-- =========================================================================
-- Infraestructura de webhooks Caja-Registradora ↔ Taxi-PE.
--   Proyecto: Caja Tonazo (xaerfywydzwifohjsvwa)
--   Espejo de taxi-pe-app/supabase/migrations/20260908120000_webhooks_infra.sql
--   Contrato completo: WEBHOOKS.md en el repo de taxi-pe-app.
--
-- Trae:
--   1) Extensiones (pg_net, pg_cron, pgcrypto, supabase_vault)
--   2) Tablas outbox / inbox (idénticas a las de Taxi-PE)
--   3) Helpers de emisión con routing a los 2 endpoints de Taxi-PE
--   4) pg_cron de reconciliación cada minuto
--   5) Columnas nuevas:
--        clientes_fiado.taxi_conductor_dni
--        movimientos_fiado.origen / .origen_ref (+ índice único)
--        pedidos.requiere_delivery / .direccion_entrega / .entrega_lat /
--               .entrega_lng / .contacto_nombre / .contacto_telefono
--   6) Triggers EMISORES 3.1 (venta fiado conductor) y 3.2 (pedido delivery)
--   7) RPC RECEPTOR 3.3 (pago de fiado de conductor desde Taxi-PE)
--
-- ⚠️  VERIFICAR ANTES DE APLICAR — nombres de columna inferidos del código
--     de caja-app/src/App.jsx (fiado_items, movimientos_fiado). Correr:
--
--       select column_name, data_type from information_schema.columns
--       where table_schema='public'
--         and table_name in ('fiado_items','movimientos_fiado','clientes_fiado','pedidos','pedido_items')
--       order by table_name, ordinal_position;
--
--     y ajustar los INSERT de §7 / los triggers de §6 si algún nombre no calza.
--
-- Idempotente: create ... if not exists / create or replace / drop ... if exists.
-- =========================================================================

create extension if not exists pg_net;
create extension if not exists pg_cron;
create extension if not exists pgcrypto;
create extension if not exists supabase_vault;

-- =========================================================================
-- 1) OUTBOX / 2) INBOX  (idénticas a Taxi-PE)
-- =========================================================================

create table if not exists public.webhook_outbox (
  id                 uuid primary key default gen_random_uuid(),
  event_id           uuid not null unique,
  event_type         text not null,
  destino            text not null,                 -- 'taxi'
  url                text not null,
  payload            jsonb not null,
  intentos           int  not null default 0,
  max_intentos       int  not null default 8,
  estado             text not null default 'pendiente'
                     check (estado in ('pendiente', 'enviado', 'fallido')),
  ultimo_request_id  bigint,
  ultimo_error       text,
  proximo_intento_at timestamptz not null default now(),
  created_at         timestamptz not null default now(),
  enviado_at         timestamptz
);

create index if not exists webhook_outbox_pendientes_idx
  on public.webhook_outbox (proximo_intento_at)
  where estado = 'pendiente';

alter table public.webhook_outbox enable row level security;

create table if not exists public.webhook_inbox (
  event_id     uuid primary key,
  event_type   text not null,
  payload      jsonb not null,
  estado       text not null default 'recibido'
               check (estado in ('recibido', 'procesado', 'sin_match', 'error')),
  nota         text,
  recibido_at  timestamptz not null default now(),
  procesado_at timestamptz
);

alter table public.webhook_inbox enable row level security;

-- =========================================================================
-- 3) HELPERS DE EMISIÓN
-- =========================================================================

create or replace function public.fn_webhook_secret(p_nombre text)
returns text
language sql
security definer
set search_path = public, vault
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = p_nombre
  limit 1;
$$;

-- hmac() viene de pgcrypto, que en Supabase vive en el schema `extensions`.
create or replace function public.fn_webhook_firmar(p_ts bigint, p_body text, p_secret text)
returns text
language sql
immutable
set search_path = extensions, public, pg_catalog
as $$
  select encode(extensions.hmac(p_ts::text || '.' || p_body, p_secret, 'sha256'), 'base64');
$$;

create or replace function public.fn_webhook_despachar(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r        public.webhook_outbox%rowtype;
  v_secret text;
  v_ts     bigint := floor(extract(epoch from now()));
  v_body   text;
  v_sig    text;
  v_req_id bigint;
begin
  select * into r from public.webhook_outbox where id = p_id for update;
  if not found then return; end if;

  v_secret := public.fn_webhook_secret('webhook_secret_caja_to_taxi');
  if v_secret is null then
    update public.webhook_outbox
      set ultimo_error = 'falta vault secret webhook_secret_caja_to_taxi',
          proximo_intento_at = now() + interval '5 min'
      where id = p_id;
    return;
  end if;

  v_body := r.payload::text;
  v_sig  := public.fn_webhook_firmar(v_ts, v_body, v_secret);

  select net.http_post(
    url     := r.url,
    body    := r.payload,
    params  := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type',        'application/json',
      'X-Webhook-Id',        r.event_id::text,
      'X-Webhook-Timestamp', v_ts::text,
      'X-Webhook-Signature', v_sig
    )
  ) into v_req_id;

  update public.webhook_outbox
    set intentos = intentos + 1, ultimo_request_id = v_req_id, ultimo_error = null
    where id = p_id;
end;
$$;

create or replace function public.fn_webhook_emitir(
  p_event_type text,
  p_destino    text,
  p_data       jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid := gen_random_uuid();
  v_url      text;
  v_sobre    jsonb;
begin
  v_url := case p_event_type
    when 'caja.venta_fiado_conductor' then public.fn_webhook_secret('webhook_url_taxi_fiado')
    when 'caja.pedido_delivery'       then public.fn_webhook_secret('webhook_url_taxi_pedido')
    else null
  end;
  if v_url is null then
    raise exception 'fn_webhook_emitir: sin URL para event_type %', p_event_type;
  end if;

  v_sobre := jsonb_build_object(
    'event_id',    v_event_id,
    'event_type',  p_event_type,
    'occurred_at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'source',      'caja',
    'data',        p_data
  );

  insert into public.webhook_outbox (event_id, event_type, destino, url, payload)
  values (v_event_id, p_event_type, p_destino, v_url, v_sobre);

  perform public.fn_webhook_despachar(
    (select id from public.webhook_outbox where event_id = v_event_id)
  );
  return v_event_id;
end;
$$;

create or replace function public.fn_webhook_reconciliar()
returns void
language plpgsql
security definer
set search_path = public, net
as $$
declare
  r        public.webhook_outbox%rowtype;
  v_status int;
begin
  for r in
    select * from public.webhook_outbox
    where estado = 'pendiente'
    order by proximo_intento_at
    limit 100
  loop
    v_status := null;
    if r.ultimo_request_id is not null then
      select status_code into v_status
      from net._http_response
      where id = r.ultimo_request_id;
    end if;

    if v_status between 200 and 299 then
      update public.webhook_outbox
        set estado = 'enviado', enviado_at = now(), ultimo_error = null
        where id = r.id;
    elsif r.intentos >= r.max_intentos then
      update public.webhook_outbox
        set estado = 'fallido',
            ultimo_error = coalesce('HTTP ' || v_status, 'sin respuesta tras max_intentos')
        where id = r.id;
    elsif now() >= r.proximo_intento_at then
      update public.webhook_outbox
        set proximo_intento_at = now() + (interval '1 minute' * power(2, r.intentos)),
            ultimo_error = coalesce('HTTP ' || v_status, 'sin respuesta, reintentando')
        where id = r.id;
      perform public.fn_webhook_despachar(r.id);
    end if;
  end loop;
end;
$$;

-- =========================================================================
-- 4) pg_cron
-- =========================================================================

select cron.unschedule('webhook-reconciliar')
where exists (select 1 from cron.job where jobname = 'webhook-reconciliar');

select cron.schedule('webhook-reconciliar', '* * * * *', $$select public.fn_webhook_reconciliar()$$);

-- =========================================================================
-- 5) COLUMNAS NUEVAS
-- =========================================================================

-- El cajero marca a mano qué cliente fiado es un conductor de Taxi-PE
-- poniéndole su DNI acá (WEBHOOKS.md §6.4). Solo esas cuentas emiten 3.1.
alter table public.clientes_fiado
  add column if not exists taxi_conductor_dni text;

create index if not exists clientes_fiado_taxi_conductor_dni_idx
  on public.clientes_fiado (taxi_conductor_dni)
  where taxi_conductor_dni is not null;

-- Dedupe + anti-bucle para pagos que llegan desde Taxi-PE (3.3).
alter table public.movimientos_fiado
  add column if not exists origen     text not null default 'local',
  add column if not exists origen_ref text;

create unique index if not exists movimientos_fiado_origen_ref_uidx
  on public.movimientos_fiado (origen, origen_ref)
  where origen <> 'local';

-- Delivery en pedidos (la tabla no tenía nada de esto — 0054 solo trae
-- estado/metodo_pago/total).
alter table public.pedidos
  add column if not exists requiere_delivery  boolean not null default false,
  add column if not exists direccion_entrega  text,
  add column if not exists entrega_lat        numeric,
  add column if not exists entrega_lng        numeric,
  add column if not exists contacto_nombre    text,
  add column if not exists contacto_telefono  text;

-- =========================================================================
-- 6) EMISORES
-- =========================================================================

-- 3.1  Venta FIADO a conductor. Se dispara por CADA fila de fiado_items
--      cuyo cliente tenga taxi_conductor_dni. Taxi-PE crea un cargo por
--      ítem (origen_ref = fiado_items.id) → idempotente y sin agregación
--      frágil en un trigger de fila.
create or replace function public.fn_emitir_venta_fiado_conductor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cli record;
begin
  select nombre, whatsapp, taxi_conductor_dni
    into v_cli
  from public.clientes_fiado
  where id = new.cliente_id;

  if not found or v_cli.taxi_conductor_dni is null then
    return new;  -- el cliente fiado no está marcado como conductor de taxi
  end if;

  perform public.fn_webhook_emitir(
    'caja.venta_fiado_conductor',
    'taxi',
    jsonb_build_object(
      'identidad', jsonb_build_object('dni', v_cli.taxi_conductor_dni, 'telefono', v_cli.whatsapp),
      'cargo', jsonb_build_object(
        'caja_ref', new.id,                                   -- fiado_items.id
        'concepto', coalesce(new.producto_nombre, 'Venta fiado (Caja)'),
        'monto',    new.monto,
        'fecha',    to_char(to_timestamp(coalesce(new.fecha, floor(extract(epoch from now()) * 1000)) / 1000.0)
                            at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
      )
    )
  );
  return new;
end;
$$;

drop trigger if exists trg_emitir_venta_fiado_conductor on public.fiado_items;
create trigger trg_emitir_venta_fiado_conductor
  after insert on public.fiado_items
  for each row execute function public.fn_emitir_venta_fiado_conductor();

-- 3.2  Pedido con delivery. Se dispara cuando `requiere_delivery` pasa a
--      true (en el INSERT o en un UPDATE posterior — el carrito puede
--      marcar el pedido como delivery después de cargar los ítems).
--      Los ítems se leen de pedido_items en ese momento; si el flujo de
--      la app inserta los ítems DESPUÉS de setear requiere_delivery,
--      llamar en su lugar a  select public.fn_emitir_pedido_delivery('<uuid>')
--      al final del checkout.
create or replace function public.fn_emitir_pedido_delivery_por_id(p_pedido_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  p       record;
  v_items jsonb;
begin
  select ped.*, s.nombre as sucursal_nombre
    into p
  from public.pedidos ped
  left join public.sucursales s on s.id = ped.sucursal_id
  where ped.id = p_pedido_id;
  if not found then return null; end if;

  select coalesce(jsonb_agg(jsonb_build_object('nombre', pi.nombre, 'cantidad', pi.cantidad)), '[]'::jsonb)
    into v_items
  from public.pedido_items pi
  where pi.pedido_id = p_pedido_id;

  return public.fn_webhook_emitir(
    'caja.pedido_delivery',
    'taxi',
    jsonb_build_object(
      'pedido', jsonb_build_object(
        'caja_ref',         p.id,
        'sucursal',         p.sucursal_nombre,
        'origen_texto',     p.direccion_entrega,
        'origen_lat',       p.entrega_lat,
        'origen_lng',       p.entrega_lng,
        'cliente_nombre',   p.contacto_nombre,
        'cliente_telefono', p.contacto_telefono,
        'items',            v_items,
        'total',            p.total,
        'metodo_pago',      p.metodo_pago
      )
    )
  );
end;
$$;

create or replace function public.fn_emitir_pedido_delivery()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.requiere_delivery
     and (tg_op = 'INSERT' or coalesce(old.requiere_delivery, false) = false) then
    perform public.fn_emitir_pedido_delivery_por_id(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_emitir_pedido_delivery on public.pedidos;
create trigger trg_emitir_pedido_delivery
  after insert or update of requiere_delivery on public.pedidos
  for each row execute function public.fn_emitir_pedido_delivery();

-- =========================================================================
-- 7) RECEPTOR 3.3 — pago de fiado de conductor (Taxi-PE → Caja).
--    Lo llama la Edge Function webhook-taxi-pago-fiado con service_role
--    DESPUÉS de validar el HMAC.
--
--    Decisión de negocio (WEBHOOKS.md §6.1): NO entra al arqueo de caja.
--    Se inserta con caja_id / sucursal_id = NULL y origen='webhook:taxi'.
--    ⚠️  El cálculo de cierre/arqueo en caja-app (App.jsx) debe EXCLUIR
--        los movimientos con origen='webhook:taxi' (o con caja_id null)
--        para que este pago baje la deuda del cliente pero no infle el
--        efectivo/digital del turno. Ese ajuste va aparte, en el frontend.
-- =========================================================================

create or replace function public.rpc_webhook_taxi_pago_fiado(p_event_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nuevo     integer;
  v_data      jsonb := p_payload -> 'data';
  v_dni       text  := v_data #>> '{identidad,dni}';
  v_telefono  text  := v_data #>> '{identidad,telefono}';
  v_taxi_ref  text  := v_data #>> '{pago,taxi_ref}';
  v_metodo    text  := lower(coalesce(v_data #>> '{pago,metodo_pago}', ''));
  v_metodo_caja text;
  v_cliente   uuid;
begin
  insert into public.webhook_inbox (event_id, event_type, payload)
  values (p_event_id, p_payload ->> 'event_type', p_payload)
  on conflict (event_id) do nothing;
  get diagnostics v_nuevo = row_count;
  if v_nuevo = 0 then
    return jsonb_build_object('status', 'duplicado');
  end if;

  -- Resolver cliente fiado: primero por DNI marcado, luego por whatsapp.
  select id into v_cliente
  from public.clientes_fiado
  where (v_dni is not null and taxi_conductor_dni = v_dni)
     or (v_telefono is not null and whatsapp = v_telefono)
  order by (v_dni is not null and taxi_conductor_dni = v_dni) desc
  limit 1;

  if v_cliente is null then
    update public.webhook_inbox
      set estado = 'sin_match', nota = 'cliente fiado no encontrado', procesado_at = now()
      where event_id = p_event_id;
    return jsonb_build_object('status', 'sin_match');
  end if;

  v_metodo_caja := case when v_metodo = 'efectivo' then 'EFECTIVO' else 'DIGITAL' end;

  insert into public.movimientos_fiado
    (cliente_id, tipo, monto, descripcion, foto_url, metodo_pago, fecha,
     sucursal_id, caja_id, origen, origen_ref)
  values
    (v_cliente,
     'PAGO',
     (v_data #>> '{pago,monto}')::numeric,
     'Pago desde Taxi-PE',
     v_data #>> '{pago,comprobante_url}',
     v_metodo_caja,
     floor(extract(epoch from coalesce((v_data #>> '{pago,fecha}')::timestamptz, now())) * 1000),
     null, null,                         -- §6.1: fuera del arqueo
     'webhook:taxi', v_taxi_ref)
  on conflict (origen, origen_ref) do nothing;

  update public.webhook_inbox
    set estado = 'procesado', procesado_at = now()
    where event_id = p_event_id;

  return jsonb_build_object('status', 'ok', 'cliente_id', v_cliente);
end;
$$;
