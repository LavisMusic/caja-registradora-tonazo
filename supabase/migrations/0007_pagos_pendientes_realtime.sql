-- Habilita Supabase Realtime (postgres_changes) para pagos_pendientes,
-- así el cliente recibe al toque el UPDATE cuando el admin aprueba o
-- rechaza su comprobante, sin tener que refrescar la página. Realtime
-- respeta RLS con el JWT del cliente, así que solo le llegan los
-- eventos de SUS PROPIAS filas (gracias a la policy de 0006).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'pagos_pendientes'
  ) then
    alter publication supabase_realtime add table public.pagos_pendientes;
  end if;
end $$;
