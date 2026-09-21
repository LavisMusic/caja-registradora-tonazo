-- =========================================================================
-- Aviso en tiempo real al eliminar una cuenta (cliente o cajero)
-- mientras sigue con sesión abierta — mismo patrón que ya se armó para
-- Taxi-PE (TaxiAuthContext). 'profiles' nunca se había agregado a la
-- publicación 'supabase_realtime' (mismo motivo por el que
-- clientes_fiado tampoco disparaba, ver migración 0069): sin esto,
-- postgres_changes no dispara NUNCA para esa tabla.
--
-- Proyecto: Caja Tonazo. Idempotente.
-- =========================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'profiles'
  ) then
    execute 'alter publication supabase_realtime add table public.profiles';
  end if;
end $$;
