-- "Visibilidad en catálogo público" ahora permite renombrar una
-- Categoría al vuelo (botón de lápiz) — hace un UPDATE a
-- 'categorias.nombre' además del UPDATE masivo a 'productos.categoria'.
-- 'categorias' nunca tuvo política de UPDATE (solo SELECT en 0002 e
-- INSERT en 0020), así que ese primer UPDATE se cortaba en seco por
-- RLS. Igual que el resto de "Visibilidad en catálogo" (toggle de
-- visible_publico, eliminar producto), esto queda exclusivo del admin
-- — is_admin(), no is_staff() — porque decidir la estructura del
-- catálogo público sigue siendo una decisión administrativa, como ya
-- quedó documentado en 0017.

drop policy if exists "categorias_admin_update" on public.categorias;
create policy "categorias_admin_update" on public.categorias
  for update using (public.is_admin()) with check (public.is_admin());
