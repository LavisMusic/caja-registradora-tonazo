-- =========================================================================
-- Regla de los 3 meses (calendario): lo más antiguo se borra solo, todos
-- los días a las 3:30 a. m. (hora de Perú).
--
--   Se borra (más de 3 meses), por negocio:
--     * historial (ventas)  — nunca una venta al fiado.
--     * cierres_caja.
--     * pedido_mensajes     — solo de pedidos ya cerrados (no 'nuevo' y
--                             sin un reparto en curso).
--   Excepto los negocios con "Historial sin límite": el plan lo tiene
--   marcado (planes.historial_ilimitado, lo marca el super admin en
--   Planes) o el negocio está exento de plan. Si una venta/cierre/pedido
--   no se puede ligar a un negocio, se guarda.
--   Nunca se toca la libreta (clientes_fiado, fiado_items,
--   movimientos_fiado), los gastos ni los pedidos en sí.
--
--   Cada pasada queda anotada en caja_limpiezas (cuántas filas por tabla).
--   Se puede correr a mano: select public.caja_limpiar_historial_3_meses();
--
-- Proyecto: Caja Tonazo. Idempotente.
-- =========================================================================

alter table public.planes add column if not exists historial_ilimitado boolean not null default false;

create table if not exists public.caja_limpiezas (
  id            bigserial primary key,
  ejecutada_at  timestamptz not null default now(),
  corte         timestamptz not null,
  detalle       jsonb not null
);
alter table public.caja_limpiezas enable row level security;
revoke all on public.caja_limpiezas from anon, authenticated;

-- ¿El negocio de esta sucursal guarda su historial para siempre?
create or replace function public.caja_historial_ilimitado(p_sucursal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select coalesce(n.plan_exento, false) or coalesce(pl.historial_ilimitado, false)
    from public.sucursales s
    join public.localidades l on l.id = s.localidad_id
    join public.negocios n on n.id = l.negocio_id
    left join public.planes pl on pl.id = n.plan_id
    where s.id = p_sucursal_id
  ), true);
$$;
revoke execute on function public.caja_historial_ilimitado(uuid) from public, anon, authenticated;

create or replace function public.caja_limpiar_historial_3_meses()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_corte    timestamptz := now() - interval '3 months';
  -- historial.fecha y cierres_caja.fecha están en milisegundos (Date.now()).
  v_corte_ms bigint := (extract(epoch from now() - interval '3 months') * 1000)::bigint;
  v_ventas   integer;
  v_cierres  integer;
  v_chats    integer;
  v_detalle  jsonb;
begin
  delete from public.historial h
  where h.fecha < v_corte_ms
    and coalesce(h.metodo_pago, '') <> 'fiado'
    and h.sucursal_id is not null
    and not public.caja_historial_ilimitado(h.sucursal_id);
  get diagnostics v_ventas = row_count;

  delete from public.cierres_caja c
  where c.fecha < v_corte_ms
    and c.sucursal_id is not null
    and not public.caja_historial_ilimitado(c.sucursal_id);
  get diagnostics v_cierres = row_count;

  delete from public.pedido_mensajes m
  using public.pedidos p
  where p.id = m.pedido_id
    and m.created_at < v_corte
    and p.created_at < v_corte
    and p.estado <> 'nuevo'
    and (p.entrega_estado is null or p.entrega_estado in ('entregado', 'cancelado', 'no_entregado'))
    and p.sucursal_id is not null
    and not public.caja_historial_ilimitado(p.sucursal_id);
  get diagnostics v_chats = row_count;

  v_detalle := jsonb_build_object('ventas', v_ventas, 'cierres', v_cierres, 'chats_pedidos', v_chats);
  insert into public.caja_limpiezas (corte, detalle) values (v_corte, v_detalle);
  return v_detalle;
end;
$$;
revoke execute on function public.caja_limpiar_historial_3_meses() from public, anon, authenticated;

select cron.unschedule('borrar-historial-3-meses')
where exists (select 1 from cron.job where jobname = 'borrar-historial-3-meses');
-- 08:30 UTC = 3:30 a. m. en Perú.
select cron.schedule('borrar-historial-3-meses', '30 8 * * *', $$select public.caja_limpiar_historial_3_meses()$$);

notify pgrst, 'reload schema';
