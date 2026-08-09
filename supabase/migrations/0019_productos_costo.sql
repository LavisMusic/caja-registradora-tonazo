-- Costo real por producto, para calcular la Ganancia Neta del Turno
-- con el costo de mercadería verdadero en vez de la estimación del
-- 55% del precio de venta (DEFAULT_COST_RATIO en App.jsx, que sigue
-- siendo el respaldo para productos sin costo cargado todavía).
alter table public.productos
  add column if not exists costo numeric;
