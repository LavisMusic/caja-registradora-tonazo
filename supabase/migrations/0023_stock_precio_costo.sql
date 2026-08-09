-- Costo Promedio Ponderado por clave de inventario (no por producto):
-- "Agregar Unidades al Stock" ya opera sobre 'stock' (una fila por
-- clave física, no por producto) — un producto normal consume 1 clave
-- 1:1, pero un combo consume VARIAS a la vez, y nada impide que dos
-- productos distintos compartan la misma clave física. El costo real
-- de la mercadería es un atributo de la clave de inventario, no de
-- cada listing de producto que la vende, así que vive acá.
--
-- 'productos.costo' (migración 0019) queda como override manual
-- opcional para casos que no se puedan derivar de 'stock' (ver
-- unitCostFor en App.jsx) — no se elimina ni se reemplaza.
alter table public.stock
  add column if not exists precio_costo numeric;
