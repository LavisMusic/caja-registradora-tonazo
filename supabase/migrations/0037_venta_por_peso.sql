-- "Venta a Granel / Por Peso": productos que se venden por kilogramos
-- (ej. golosinas sueltas, frutos secos) en vez de por unidad entera.
-- Reutiliza TODA la maquinaria de stock/costo ya existente (stock,
-- consumos, Costo Promedio Ponderado) — la única diferencia real es
-- que la "cantidad" deja de ser un entero para pasar a ser un
-- decimal (kilos), así que las columnas que hoy son integer necesitan
-- ensancharse a numeric. ALTER COLUMN ... TYPE numeric es seguro
-- correrlo aunque la columna ya sea numeric/decimal (no-op).

alter table public.productos
  add column if not exists venta_por_peso boolean not null default false;

alter table public.stock
  alter column cantidad type numeric using cantidad::numeric;

alter table public.historial
  alter column cantidad type numeric using cantidad::numeric;

alter table public.fiado_items
  alter column cantidad type numeric using cantidad::numeric;

-- Freeze de si la línea vendida era "por peso" al momento de la venta
-- — mismo criterio que ya se usa para costo_unitario/precio en
-- 'historial' (nunca depender de que el producto siga existiendo o
-- sin cambios para poder re-renderizar una boleta/reporte pasado).
alter table public.historial
  add column if not exists venta_por_peso boolean not null default false;

alter table public.fiado_items
  add column if not exists venta_por_peso boolean not null default false;
