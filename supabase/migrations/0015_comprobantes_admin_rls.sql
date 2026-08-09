-- Fix: los modales de Pagos → YAPE/PLIN/OTROS se ven vacíos ("S/ 0",
-- "Aún no hay ingresos...") aunque los registros existen en la base.
--
-- Revisé el código y descarté las dos causas que se sospechaban:
--   1) El SELECT a 'comprobantes' es `select("*")` sin ningún filtro
--      de imagen/comprobante_id — trae TODAS las filas siempre.
--   2) El .map() que arma la lista no tiene ningún `return null`; una
--      fila sin foto/opId igual se renderiza (cae a un texto de
--      fallback "Ingreso manual", ver siguiente commit del frontend).
--
-- La causa real es la misma de siempre en este proyecto: 'comprobantes'
-- nunca fue tocada por nuestras migraciones de auth, pero ya tenía RLS
-- habilitado con una política vieja pensada para el rol "anon" (de
-- antes de que /admin tuviera login real). Desde que el admin usa una
-- sesión real, esas consultas se evalúan como "authenticated" — sin una
-- política que cubra ese rol, el SELECT no da error, simplemente
-- devuelve 0 filas (por eso "Aún no hay ingresos" en vez de un error
-- en pantalla).

alter table public.comprobantes enable row level security;

drop policy if exists "comprobantes_tabla_admin_all" on public.comprobantes;
create policy "comprobantes_tabla_admin_all" on public.comprobantes
  for all using (public.is_admin()) with check (public.is_admin());
