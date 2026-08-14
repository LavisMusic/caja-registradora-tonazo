-- Calculadora de Vuelto (Efectivo): igual que 'costo_unitario'/
-- 'costo_total' (migración 0026), estos son datos CONGELADOS al
-- momento exacto de la venta — cuánto entregó el cliente y cuánto se
-- le devolvió. Nullable: solo se llenan para ventas en EFECTIVO;
-- Yape/Plin/Otros/Fiado no manejan vuelto físico.
alter table public.historial
  add column if not exists monto_recibido numeric,
  add column if not exists vuelto numeric;
