-- Fix: el toggle de "Visibilidad en catálogo público" cambiaba en
-- pantalla pero no se guardaba en Supabase.
--
-- Causa real: en 0002_public_catalog_read.sql habilitamos RLS en
-- 'productos' (alter table ... enable row level security) para poder
-- leerla, pero solo agregamos una política de SELECT
-- (productos_public_read). Sin una política de UPDATE, Postgres no
-- deniega con un error — el UPDATE simplemente afecta 0 filas y
-- responde 200 OK, por eso no aparecía ningún error en consola ni se
-- veía como un fallo obvio.

drop policy if exists "productos_admin_update" on public.productos;
create policy "productos_admin_update" on public.productos
  for update using (public.is_admin()) with check (public.is_admin());
