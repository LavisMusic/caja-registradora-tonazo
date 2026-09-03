-- Columna 'orden' para el Drag & Drop de "Visibilidad en catálogo
-- público" (categorías/productos) — IDEMPOTENTE a propósito ('ADD
-- COLUMN IF NOT EXISTS'), segura de correr sin importar el estado
-- real de la base:
--
-- El código del frontend (moverProducto/reorderCategorias en
-- App.jsx/useCatalog.js, y useCatalog.js's load() que hace
-- '.order("orden", { ascending: true })' sobre 'productos' Y
-- 'categorias') YA ASUME que estas dos columnas existen desde hace
-- varias fases de este proyecto — y como el catálogo carga y se
-- reordena correctamente en producción hoy, la evidencia es que YA
-- EXISTEN en la base real (create/alter de estas tablas no vive en
-- esta carpeta de migraciones — son parte del esquema base, creado
-- antes de que este flujo de migraciones numeradas arrancara). Esta
-- migración es un respaldo defensivo: si por lo que sea faltaran en
-- algún ambiente, las agrega con un valor por defecto sano; si ya
-- existen, no hace nada (sin error).
--
-- 'subgrupo' NO tiene columna de orden propia y a propósito: no tiene
-- tabla maestra, así que su posición vive codificada en el PREFIJO
-- NUMÉRICO del propio string (ej. "01 Ron Cartavio") — moverSubgrupo
-- ya renumera ese prefijo directo, no hace falta ninguna columna
-- nueva para eso.
alter table public.productos
  add column if not exists orden integer not null default 0;

alter table public.categorias
  add column if not exists orden integer not null default 0;

-- Índices para que el '.order("orden")' de cada carga del catálogo
-- (useCatalog.js) no dependa de un sort en memoria sobre la tabla
-- entera a medida que crece el catálogo.
create index if not exists idx_productos_orden on public.productos (categoria, orden);
create index if not exists idx_categorias_orden on public.categorias (orden);
