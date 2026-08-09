-- Causa real de "la categoría vieja no se borró y quedaron
-- categorías fantasma/duplicadas": 'categorias' nunca tuvo política de
-- DELETE (solo SELECT en 0002, INSERT en 0020, UPDATE en 0021). Sin
-- una política que lo permita, Postgres no devuelve error — el DELETE
-- simplemente afecta 0 filas y responde 200 OK, el mismo patrón de
-- fallo silencioso que ya pasó antes con productos/UPDATE (migración
-- 0004). El código JS ahora además verifica filas afectadas después
-- del delete, pero sin esta política nunca iba a poder borrar nada.
--
-- is_admin() (no is_staff()): borrar categorías es una decisión
-- estructural del catálogo, igual que renombrarlas (0021) y el resto
-- de "Visibilidad en catálogo público".

drop policy if exists "categorias_admin_delete" on public.categorias;
create policy "categorias_admin_delete" on public.categorias
  for delete using (public.is_admin());
