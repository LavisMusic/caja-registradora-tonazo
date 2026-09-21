-- =========================================================================
-- Fix: el Realtime de fiado_habilitado (AuthContext del lado cliente,
-- Gestor de Usuarios del lado admin) no disparaba NUNCA — ninguna
-- tabla emite eventos de postgres_changes a menos que esté agregada
-- explícitamente a la publicación 'supabase_realtime' (no es
-- automático solo por tener RLS/políticas). 'clientes_fiado' nunca se
-- había agregado.
--
-- Proyecto: Caja Tonazo. Idempotente.
-- =========================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'clientes_fiado'
  ) then
    execute 'alter publication supabase_realtime add table public.clientes_fiado';
  end if;
end $$;
