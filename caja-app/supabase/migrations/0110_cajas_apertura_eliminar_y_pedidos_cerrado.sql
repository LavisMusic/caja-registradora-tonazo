-- =========================================================================
-- Cajas: monto inicial guardado + apertura automática, eliminar una
-- sucursal con todo lo suyo, y nada de pedidos con la caja cerrada.
--
--   1. cajas.monto_inicial_predeterminado: el fondo que escribe el admin en
--      el Gestor de Cajas queda guardado. A la hora de apertura de la
--      sucursal (sucursales.horario, hora de Perú) la caja se abre sola con
--      ese monto. Sin monto guardado no se abre sola; si el admin la cerró
--      después de la hora de apertura, tampoco se vuelve a abrir ese día.
--   2. caja_eliminar_sucursal: el admin elimina una sucursal y con ella
--      TODO lo suyo (pedidos y sus chats, ventas, cierres, comprobantes,
--      pagos pendientes, fiados de esa sucursal, inventario y su caja).
--      Sus cajeros quedan sin sucursal para reasignarlos; los clientes no
--      se borran (solo dejan de estar ligados a esa sucursal).
--   3. Pedidos: la base rechaza un pedido nuevo a una sucursal sin caja
--      abierta (la tienda ya lo muestra cerrado y no deja pedir).
--
-- Proyecto: Caja Tonazo. Idempotente.
-- =========================================================================

-- ---------- 1. Monto inicial guardado y apertura automática -------------------
alter table public.cajas add column if not exists monto_inicial_predeterminado numeric(10, 2)
  check (monto_inicial_predeterminado is null or monto_inicial_predeterminado >= 0);

create or replace function public.caja_apertura_automatica()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ahora   timestamp := now() at time zone 'America/Lima';
  v_dia     text := (array['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'])[extract(isodow from v_ahora)::integer];
  v_c       record;
  v_abre_ts timestamptz;
  v_n       integer := 0;
begin
  for v_c in
    select c.id, c.monto_inicial_predeterminado, c.cerrada_en, s.horario -> v_dia ->> 'abre' as abre
    from public.cajas c
    join public.sucursales s on s.id = c.sucursal_id
    where c.estado = 'cerrada'
      and c.monto_inicial_predeterminado is not null
      and s.activo
      and s.horario -> v_dia ->> 'abre' is not null
  loop
    begin
      v_abre_ts := (v_ahora::date + v_c.abre::time) at time zone 'America/Lima';
    exception when others then
      continue;
    end;
    -- Ventana de 5 minutos desde la hora de apertura, y no la cerraron a
    -- mano después de esa hora.
    if now() >= v_abre_ts and now() < v_abre_ts + interval '5 minutes'
       and coalesce(v_c.cerrada_en, 0) < (extract(epoch from v_abre_ts) * 1000)::bigint then
      update public.cajas
        set estado = 'abierta',
            monto_inicial = v_c.monto_inicial_predeterminado,
            abierta_por = 'Apertura automática',
            abierta_en = (extract(epoch from now()) * 1000)::bigint,
            cerrada_en = null,
            extendida_hasta = null
        where id = v_c.id and estado = 'cerrada';
      v_n := v_n + 1;
    end if;
  end loop;
  return v_n;
end;
$$;
revoke execute on function public.caja_apertura_automatica() from public, anon, authenticated;

select cron.unschedule('cajas-apertura-automatica')
where exists (select 1 from cron.job where jobname = 'cajas-apertura-automatica');
select cron.schedule('cajas-apertura-automatica', '* * * * *', $$select public.caja_apertura_automatica()$$);

-- ---------- 2. Eliminar una sucursal con todo lo suyo -------------------------
create or replace function public.caja_eliminar_sucursal(p_sucursal_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cajas    uuid[];
  v_pedidos  integer;
  v_ventas   integer;
  v_cierres  integer;
  v_fiados   integer;
begin
  if not (
    public.is_admin()
    and exists (
      select 1 from public.sucursales s
      join public.localidades l on l.id = s.localidad_id
      where s.id = p_sucursal_id and l.negocio_id = public.mi_negocio_id()
    )
  ) then
    return jsonb_build_object('estado', 'sin_permiso');
  end if;

  v_cajas := array(select id from public.cajas where sucursal_id = p_sucursal_id);

  delete from public.pedidos where sucursal_id = p_sucursal_id; -- + ítems, chats y retiros
  get diagnostics v_pedidos = row_count;
  delete from public.historial where sucursal_id = p_sucursal_id or caja_id = any(v_cajas);
  get diagnostics v_ventas = row_count;
  delete from public.cierres_caja where sucursal_id = p_sucursal_id or caja_id = any(v_cajas);
  get diagnostics v_cierres = row_count;
  delete from public.comprobantes where sucursal_id = p_sucursal_id or caja_id = any(v_cajas);
  delete from public.pagos_pendientes where sucursal_id = p_sucursal_id or caja_id = any(v_cajas);
  delete from public.movimientos_fiado where sucursal_id = p_sucursal_id or caja_id = any(v_cajas);
  delete from public.fiado_items where sucursal_id = p_sucursal_id or caja_id = any(v_cajas);
  get diagnostics v_fiados = row_count;
  update public.clientes_fiado set sucursal_id = null, caja_id = null
    where sucursal_id = p_sucursal_id or caja_id = any(v_cajas);
  update public.profiles set sucursal_id = null, caja_id = null
    where sucursal_id = p_sucursal_id or caja_id = any(v_cajas);
  delete from public.cajas where sucursal_id = p_sucursal_id;
  delete from public.sucursales where id = p_sucursal_id; -- + inventario

  return jsonb_build_object(
    'estado', 'ok', 'pedidos', v_pedidos, 'ventas', v_ventas, 'cierres', v_cierres, 'fiados', v_fiados
  );
end;
$$;
revoke execute on function public.caja_eliminar_sucursal(uuid) from public, anon;
grant execute on function public.caja_eliminar_sucursal(uuid) to authenticated;

-- ---------- 3. Sin pedidos con la caja cerrada --------------------------------
create or replace function public.fn_pedidos_requiere_caja_abierta()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('anon', 'authenticated')
     and not public.caja_sucursal_en_linea(new.sucursal_id) then
    raise exception 'La tienda está cerrada en este momento: vuelve a pedir cuando abra.'
      using errcode = '22023';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_pedidos_requiere_caja_abierta on public.pedidos;
create trigger trg_pedidos_requiere_caja_abierta
  before insert on public.pedidos
  for each row execute function public.fn_pedidos_requiere_caja_abierta();

notify pgrst, 'reload schema';
