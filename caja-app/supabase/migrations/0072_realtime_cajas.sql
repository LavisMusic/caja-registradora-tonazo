-- =========================================================================
-- Etiqueta "En línea" por sucursal en la tienda pública: el cliente
-- necesita saber en vivo si hay una caja abierta ahora mismo en la
-- sucursal que eligió — sin esto, CatalogPage.jsx puede suscribirse
-- por Realtime a 'cajas' sin que nunca le llegue ningún evento.
--
-- Mismo patrón ya usado para clientes_fiado/profiles (migraciones
-- 0069/0070).
--
-- Proyecto: Caja Tonazo. Idempotente.
-- =========================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'cajas'
  ) then
    execute 'alter publication supabase_realtime add table public.cajas';
  end if;
end $$;
