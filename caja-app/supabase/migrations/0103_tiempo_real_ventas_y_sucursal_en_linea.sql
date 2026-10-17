-- =========================================================================
-- Tiempo real de ventas entre cajero y admin, horario en vivo, y "en
-- línea" de la sucursal para el cliente.
--
--   * historial, gastos, inventario_sucursales y sucursales entran a la
--     publicación de Realtime: el admin ve al toque lo que registra el
--     cajero (y al revés), y el horario de atención nuevo le llega a la
--     caja del cajero sin recargar.
--   * caja_sucursal_en_linea(sucursal): la tienda pregunta si la sucursal
--     tiene una caja abierta. El cliente no puede leer la tabla 'cajas'
--     (solo el personal), así que antes siempre la veía "cerrada". Solo
--     responde sí o no.
--
-- Idempotente.
-- =========================================================================
do $$
declare
  t text;
begin
  foreach t in array array['historial', 'gastos', 'inventario_sucursales', 'sucursales'] loop
    if to_regclass('public.' || t) is not null and not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

create or replace function public.caja_sucursal_en_linea(p_sucursal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.cajas where sucursal_id = p_sucursal_id and estado = 'abierta'
  );
$$;
grant execute on function public.caja_sucursal_en_linea(uuid) to anon, authenticated;
