-- =========================================================================
-- Créditos, fase B: puntos por compras online (Caja → Taxi-PE).
--
-- Cuando un pedido online termina ('confirmado': entregado por el
-- repartidor o retirado en tienda), se avisa a Taxi-PE con el teléfono del
-- cliente y los puntos = total del pedido redondeado (el total no incluye
-- el envío: ese se le paga aparte al repartidor). Si después se cancela o
-- se revierte la venta, se avisa para restarlos. Taxi-PE los suma a la
-- cuenta del cliente (un pedido nunca suma dos veces) y, por el espejo de
-- saldo de siempre, vuelven a clientes_fiado.creditos_disponibles.
--
-- Mismo sistema de avisos firmados (outbox + HMAC) que los fiados y los
-- repartos. Idempotente.
-- =========================================================================

-- URL del receptor en Taxi-PE.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'webhook_url_taxi_puntos') then
    perform vault.create_secret(
      'https://silfhbdmfdryjdzpwzvh.supabase.co/functions/v1/webhook-caja-puntos',
      'webhook_url_taxi_puntos'
    );
  end if;
end $$;

-- Routing (misma función de 0087 + 'caja.puntos_cliente').
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
    when 'caja.puntos_cliente'        then public.fn_webhook_secret('webhook_url_taxi_puntos')
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

-- Teléfono del cliente de un pedido: su ficha (clientes_fiado.whatsapp) o,
-- si no tiene, el de su login (celular@tonazo.app).
create or replace function public.fn_telefono_cliente(p_auth_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(
    (select nullif(trim(cf.whatsapp), '') from public.clientes_fiado cf
      where cf.auth_user_id = p_auth_user_id and nullif(trim(cf.whatsapp), '') is not null
      limit 1),
    (select split_part(u.email, '@', 1) from auth.users u
      where u.id = p_auth_user_id and u.email like '%@tonazo.app')
  );
$$;
revoke execute on function public.fn_telefono_cliente(uuid) from public, anon, authenticated;

create or replace function public.fn_pedido_puntos_avisar_taxi()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mov      text := null;
  v_puntos   integer := round(coalesce(new.total, 0))::integer;
  v_telefono text;
begin
  if new.estado = 'confirmado' and old.estado is distinct from 'confirmado'
     and not coalesce(new.venta_revertida, false) then
    v_mov := 'suma';
  elsif (old.estado = 'confirmado' and new.estado = 'cancelado' and not coalesce(old.venta_revertida, false))
     or (new.estado = 'confirmado' and coalesce(new.venta_revertida, false) and not coalesce(old.venta_revertida, false)) then
    v_mov := 'resta';
  end if;
  if v_mov is null or v_puntos <= 0 or new.cliente_id is null then
    return new;
  end if;

  v_telefono := public.fn_telefono_cliente(new.cliente_id);
  if v_telefono is null then
    return new;
  end if;

  -- Si el envío falla, el pedido igual se guarda: queda en el outbox y se
  -- reintenta solo.
  begin
    perform public.fn_webhook_emitir(
      'caja.puntos_cliente',
      'taxi',
      jsonb_build_object(
        'caja_pedido_id', new.id,
        'telefono', v_telefono,
        'movimiento', v_mov,
        'puntos', v_puntos,
        'total', new.total
      )
    );
  exception when others then
    raise warning 'fn_pedido_puntos_avisar_taxi: %', sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists trg_pedido_puntos_avisar_taxi on public.pedidos;
create trigger trg_pedido_puntos_avisar_taxi
  after update of estado, venta_revertida on public.pedidos
  for each row execute function public.fn_pedido_puntos_avisar_taxi();
