-- "Crear producto al vuelo" (escaneo de un código no encontrado, en
-- Editar Stock) rompía con "new row violates row-level security
-- policy for table 'productos'". Causa: 'productos' y 'categorias'
-- solo tenían política de SELECT (0002_public_catalog_read.sql) y
-- 'productos' además una de UPDATE admin-only (0004, para el toggle
-- de visibilidad) — pero NUNCA existió una política de INSERT en
-- ninguna de las dos tablas. Como Editar Stock es una pantalla
-- operativa que también usa el rol 'cajero' (igual que Gastos/Stock),
-- se usa is_staff() (admin O cajero), no is_admin().
--
-- No se toca la política de UPDATE de 'productos' (0004): decidir qué
-- se oculta del catálogo público sigue siendo exclusivo del admin,
-- como quedó documentado en 0017.

drop policy if exists "productos_staff_insert" on public.productos;
create policy "productos_staff_insert" on public.productos
  for insert with check (public.is_staff());

drop policy if exists "categorias_staff_insert" on public.categorias;
create policy "categorias_staff_insert" on public.categorias
  for insert with check (public.is_staff());
