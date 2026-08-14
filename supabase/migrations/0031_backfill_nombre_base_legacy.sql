-- Bug reportado: "Hey FIT - Golden" y "Hey FIT - Fresa" seguían
-- saliendo como 2 tarjetas separadas en el POS pese a agrupar por
-- 'nombre_base'. Causa raíz: la migración 0030 hizo
-- "nombre_base = nombre" para TODO producto preexistente (backfill
-- genérico), incluidos los que YA seguían la convención vieja
-- "Base - Variante" desde antes de este refactor. Eso dejó a cada
-- variante vieja con su propio nombre_base ÚNICO ("Hey FIT - Golden" y
-- "Hey FIT - Fresa" nunca coinciden entre sí), así que la agrupación
-- estricta del POS jamás las unía, aunque a simple vista se vean como
-- sabores del mismo producto.
--
-- Esta migración re-parsea SOLO las filas que todavía nadie tocó desde
-- el nuevo formulario (nombre_base = nombre, sin editar) y que siguen
-- el patrón "Base - Variante", separándolas en nombre_base + variante
-- reales — mismo criterio que groupProductsForDisplay ya usaba en la
-- Fase 2 original (heurística de separador " - "), pero aplicado UNA
-- VEZ a los datos en vez de recalculado en cada render.
update public.productos
set
  nombre_base = trim(split_part(nombre, ' - ', 1)),
  variante = coalesce(nullif(trim(variante), ''), trim(substring(nombre from position(' - ' in nombre) + 3)))
where nombre_base = nombre
  and nombre like '% - %';
