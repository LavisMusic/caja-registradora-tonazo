-- Desglosa la Ganancia Neta del Cierre de Caja en dos rubros:
--   ganancia_ventas: margen de las ventas frescas del turno (pagadas al
--     momento, no fiadas) — antes ESTA era la única "Ganancia Neta".
--   ganancia_fiados: dinero recuperado en este turno por cobros de
--     deudas (fiado_items/movimientos_fiado), tratado como ganancia
--     realizada al momento del cobro, no de la venta original.
-- ganancia_neta se mantiene como el total combinado (ganancia_ventas +
-- ganancia_fiados) para no romper nada que ya lo lea.
alter table public.cierres_caja
  add column if not exists ganancia_ventas numeric(10,2),
  add column if not exists ganancia_fiados numeric(10,2);
