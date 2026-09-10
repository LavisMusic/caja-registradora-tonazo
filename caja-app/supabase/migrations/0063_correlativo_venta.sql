-- Correlativo de venta para pedidos (retiro / delivery)
-- =====================================================
-- Al confirmar una entrega o aceptar una petición de retiro en el
-- Gestor de Pedidos, la venta se registra en 'historial' con
-- 'purchase_id' = pedido.id (un UUID) — y ese UUID termina mostrándose
-- como "ID COMPRA" en el historial, rompiendo la numeración V-000X que
-- usan todas las ventas normales del POS.
--
-- Solución: mismo esquema que nextPurchaseId() del front (App.jsx):
-- el correlativo es global de negocio (no por sucursal) y sale del
-- máximo V-<n> ya registrado en 'historial'. Se calcula acá para no
-- traer toda la tabla al cliente, y se guarda en el pedido para que
-- reintentos usen SIEMPRE el mismo número (idempotencia por pedido).

alter table public.pedidos
  add column if not exists venta_purchase_id text;

create or replace function public.rpc_siguiente_correlativo_venta()
returns text
language sql
security definer
set search_path = public
as $$
  select 'V-' || lpad((
    coalesce(
      max((substring(purchase_id from '^V-(\d+)$'))::int),
      0
    ) + 1
  )::text, 4, '0')
  from public.historial
  where purchase_id ~ '^V-\d+$';
$$;

grant execute on function public.rpc_siguiente_correlativo_venta() to anon, authenticated;
