-- =========================================================================
-- Retiro en tienda verificado con PIN o QR (mismo sistema que el delivery):
--
--   * Al aceptar la petición de retiro el pedido tiene un PIN de 4 dígitos
--     (pedido_retiros). Solo el CLIENTE lo puede leer (caja_retiro_mio):
--     el cajero no lo ve aunque tenga acceso al pedido.
--   * "Ver entrega": el cliente comparte su ubicación en vivo mientras
--     tiene la ventana abierta (caja_retiro_ubicacion); el cajero/admin la
--     ve junto a la sede en su mapa (caja_retiro_estado).
--   * El cajero/admin confirma escaneando el QR o escribiendo el PIN
--     (caja_retiro_verificar). 5 intentos fallidos → bloqueado 10 minutos.
--   * Recién verificado se registra la venta y el pedido pasa a
--     'confirmado' (la app). La base no deja marcar un retiro como
--     'confirmado' sin verificar (trigger).
--
-- Proyecto: Caja Tonazo. Idempotente.
-- =========================================================================

create table if not exists public.pedido_retiros (
  pedido_id       uuid primary key references public.pedidos (id) on delete cascade,
  pin             text not null,
  intentos        integer not null default 0,
  bloqueado_hasta timestamptz,
  verificado_at   timestamptz,
  verificado_por  uuid,
  cliente_lat     numeric,
  cliente_lng     numeric,
  cliente_pos_at  timestamptz,
  created_at      timestamptz not null default now()
);
alter table public.pedido_retiros enable row level security;
-- Sin acceso directo: todo pasa por las funciones de abajo.
revoke all on public.pedido_retiros from anon, authenticated;

-- ¿Quien pregunta atiende la sucursal de este pedido? (cajero: la suya;
-- admin: las de su negocio).
create or replace function public.caja_puede_atender_pedido(p_pedido_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pedidos p
    left join public.sucursales s on s.id = p.sucursal_id
    left join public.localidades l on l.id = s.localidad_id
    where p.id = p_pedido_id
      and (
        (public.is_staff() and p.sucursal_id = public.mi_sucursal_id())
        or (public.is_admin() and l.negocio_id = public.mi_negocio_id())
      )
  );
$$;
revoke execute on function public.caja_puede_atender_pedido(uuid) from public, anon;

-- Crea el PIN del retiro si todavía no tiene (retiros aceptados antes de
-- esta migración incluidos). Solo para retiros aceptados o confirmados.
create or replace function public.caja_retiro_asegurar(p_pedido_id uuid)
returns public.pedido_retiros
language plpgsql
security definer
set search_path = public
as $$
declare
  v_r public.pedido_retiros;
begin
  select * into v_r from public.pedido_retiros where pedido_id = p_pedido_id;
  if found then
    return v_r;
  end if;
  if not exists (
    select 1 from public.pedidos
    where id = p_pedido_id
      and not coalesce(requiere_delivery, false)
      and estado in ('en_atencion', 'confirmado')
  ) then
    return null;
  end if;
  insert into public.pedido_retiros (pedido_id, pin)
  values (p_pedido_id, lpad(floor(random() * 10000)::integer::text, 4, '0'))
  on conflict (pedido_id) do nothing;
  select * into v_r from public.pedido_retiros where pedido_id = p_pedido_id;
  return v_r;
end;
$$;
revoke execute on function public.caja_retiro_asegurar(uuid) from public, anon, authenticated;

-- ---------- Cliente ----------------------------------------------------------
create or replace function public.caja_retiro_mio(p_pedido_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p public.pedidos;
  v_r public.pedido_retiros;
  v_s public.sucursales;
begin
  select * into v_p from public.pedidos where id = p_pedido_id and cliente_id = auth.uid();
  if not found then
    return jsonb_build_object('estado', 'sin_permiso');
  end if;
  v_r := public.caja_retiro_asegurar(p_pedido_id);
  if v_r.pedido_id is null then
    return jsonb_build_object('estado', 'no_disponible');
  end if;
  select * into v_s from public.sucursales where id = v_p.sucursal_id;
  return jsonb_build_object(
    'estado', 'ok',
    'pin', v_r.pin,
    'verificado', v_r.verificado_at is not null,
    'pedido_estado', v_p.estado,
    'sucursal_nombre', v_s.nombre,
    'sucursal_lat', v_s.lat,
    'sucursal_lng', v_s.lng
  );
end;
$$;
revoke execute on function public.caja_retiro_mio(uuid) from public, anon;
grant execute on function public.caja_retiro_mio(uuid) to authenticated;

create or replace function public.caja_retiro_ubicacion(p_pedido_id uuid, p_lat numeric, p_lng numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_lat is null or p_lng is null or abs(p_lat) > 90 or abs(p_lng) > 180 then
    return;
  end if;
  if not exists (select 1 from public.pedidos where id = p_pedido_id and cliente_id = auth.uid()) then
    return;
  end if;
  perform public.caja_retiro_asegurar(p_pedido_id);
  update public.pedido_retiros
    set cliente_lat = p_lat, cliente_lng = p_lng, cliente_pos_at = now()
    where pedido_id = p_pedido_id and verificado_at is null;
end;
$$;
revoke execute on function public.caja_retiro_ubicacion(uuid, numeric, numeric) from public, anon;
grant execute on function public.caja_retiro_ubicacion(uuid, numeric, numeric) to authenticated;

-- ---------- Cajero / admin ---------------------------------------------------
create or replace function public.caja_retiro_estado(p_pedido_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p public.pedidos;
  v_r public.pedido_retiros;
  v_s public.sucursales;
begin
  if not public.caja_puede_atender_pedido(p_pedido_id) then
    return jsonb_build_object('estado', 'sin_permiso');
  end if;
  select * into v_p from public.pedidos where id = p_pedido_id;
  v_r := public.caja_retiro_asegurar(p_pedido_id);
  if v_r.pedido_id is null then
    return jsonb_build_object('estado', 'no_disponible');
  end if;
  select * into v_s from public.sucursales where id = v_p.sucursal_id;
  return jsonb_build_object(
    'estado', 'ok',
    'verificado', v_r.verificado_at is not null,
    'bloqueado_hasta', case when v_r.bloqueado_hasta > now() then v_r.bloqueado_hasta end,
    'cliente_lat', v_r.cliente_lat,
    'cliente_lng', v_r.cliente_lng,
    'cliente_pos_at', v_r.cliente_pos_at,
    'sucursal_nombre', v_s.nombre,
    'sucursal_lat', v_s.lat,
    'sucursal_lng', v_s.lng
  );
end;
$$;
revoke execute on function public.caja_retiro_estado(uuid) from public, anon;
grant execute on function public.caja_retiro_estado(uuid) to authenticated;

-- p_codigo: el PIN escrito o el texto del QR (el QR lleva el mismo PIN).
create or replace function public.caja_retiro_verificar(p_pedido_id uuid, p_codigo text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_r public.pedido_retiros;
begin
  if not public.caja_puede_atender_pedido(p_pedido_id) then
    return jsonb_build_object('estado', 'sin_permiso');
  end if;
  perform public.caja_retiro_asegurar(p_pedido_id);
  select * into v_r from public.pedido_retiros where pedido_id = p_pedido_id for update;
  if not found then
    return jsonb_build_object('estado', 'no_disponible');
  end if;
  if v_r.verificado_at is not null then
    return jsonb_build_object('estado', 'ok');
  end if;
  if v_r.bloqueado_hasta > now() then
    return jsonb_build_object('estado', 'bloqueado', 'hasta', v_r.bloqueado_hasta);
  end if;
  if trim(coalesce(p_codigo, '')) = v_r.pin then
    update public.pedido_retiros
      set verificado_at = now(), verificado_por = auth.uid(), intentos = 0, bloqueado_hasta = null
      where pedido_id = p_pedido_id;
    return jsonb_build_object('estado', 'ok');
  end if;
  if v_r.intentos + 1 >= 5 then
    update public.pedido_retiros
      set intentos = 0, bloqueado_hasta = now() + interval '10 minutes'
      where pedido_id = p_pedido_id;
    return jsonb_build_object('estado', 'bloqueado', 'hasta', now() + interval '10 minutes');
  end if;
  update public.pedido_retiros set intentos = v_r.intentos + 1 where pedido_id = p_pedido_id;
  return jsonb_build_object('estado', 'pin_incorrecto', 'restantes', 5 - (v_r.intentos + 1));
end;
$$;
revoke execute on function public.caja_retiro_verificar(uuid, text) from public, anon;
grant execute on function public.caja_retiro_verificar(uuid, text) to authenticated;

-- ---------- Nadie entrega un retiro sin verificar -----------------------------
create or replace function public.fn_pedidos_retiro_verificado()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('anon', 'authenticated')
     and new.estado = 'confirmado'
     and old.estado is distinct from 'confirmado'
     and not coalesce(new.requiere_delivery, false)
     and not exists (
       select 1 from public.pedido_retiros r
       where r.pedido_id = new.id and r.verificado_at is not null
     ) then
    raise exception 'Para entregar un retiro hay que verificar el PIN o el QR del cliente.'
      using errcode = '22023';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_pedidos_retiro_verificado on public.pedidos;
create trigger trg_pedidos_retiro_verificado
  before update on public.pedidos
  for each row execute function public.fn_pedidos_retiro_verificado();

notify pgrst, 'reload schema';
