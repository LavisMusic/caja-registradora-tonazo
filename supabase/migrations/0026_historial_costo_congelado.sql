-- "Congelamiento del Costo (Fotografía)": el Dashboard NO debe volver
-- a calcular el costo de una venta ya hecha consultando el costo
-- ACTUAL de 'stock'/'productos' — si el costo promedio ponderado
-- cambia mañana (nuevo ingreso de mercadería), las ventas de HOY no
-- deben moverse retroactivamente. Por eso el costo se graba como dato
-- estático en el momento exacto de la venta, igual que ya se hace con
-- 'precio' (precio de venta congelado).
--
-- Nullable: las filas de 'historial' anteriores a esta migración no
-- tienen forma de reconstruir retroactivamente cuál era el costo en
-- ese momento — quedan en NULL a propósito (no se inventa un valor).
alter table public.historial
  add column if not exists costo_unitario numeric,
  add column if not exists costo_total numeric;
