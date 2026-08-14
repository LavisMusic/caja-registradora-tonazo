-- 'precio_costo' (migración 0023) es el Costo Promedio Ponderado
-- acumulado — no sirve para responder "¿cuánto pagué la ÚLTIMA vez
-- que compré esto?", que es un dato distinto y útil para negociar con
-- proveedores / detectar subidas de precio. Se guarda aparte, se
-- SOBRESCRIBE (no se promedia) en cada ingreso de stock (Agregar
-- Unidades al Stock y Gastos/Ingreso de Mercadería).
alter table public.stock
  add column if not exists ultimo_costo_compra numeric;
