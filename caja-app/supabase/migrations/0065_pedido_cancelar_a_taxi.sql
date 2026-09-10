-- Cancelar pedido con entrega en curso → avisar a Taxi-PE
-- =======================================================
-- Si un pedido que tiene entrega asignada (entrega_id) pasa a 'cancelado'
-- —lo cancele el cliente o el cajero— hay que cerrar esa entrega en
-- Taxi-PE, si no el conductor la sigue viendo activa. Va por webhook
-- firmado (misma infra que caja.venta_fiado_conductor).
--
-- Requiere en el Vault de Caja:
--   select vault.create_secret(
--     'https://silfhbdmfdryjdzpwzvh.supabase.co/functions/v1/webhook-caja-entrega-cancelar',
--     'webhook_url_taxi_entrega_cancelar');
--
-- Idempotente.

-- 1) Routing del nuevo evento.
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

-- 2) Trigger: al cancelar un pedido con entrega, emitir el aviso.
create or replace function public.fn_pedido_cancelar_avisar_taxi()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if NEW.estado = 'cancelado'
     and coalesce(OLD.estado, '') <> 'cancelado'
     and NEW.entrega_id is not null then
    begin
      perform public.fn_webhook_emitir(
        'caja.entrega_cancelar', 'taxi',
        jsonb_build_object('entrega_id', NEW.entrega_id, 'motivo', 'cancelado desde la Caja')
      );
    exception when others then
      raise warning 'fn_pedido_cancelar_avisar_taxi: webhook no emitido: %', sqlerrm;
    end;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_pedido_cancelar_avisar_taxi on public.pedidos;
create trigger trg_pedido_cancelar_avisar_taxi
  after update of estado on public.pedidos
  for each row execute function public.fn_pedido_cancelar_avisar_taxi();
