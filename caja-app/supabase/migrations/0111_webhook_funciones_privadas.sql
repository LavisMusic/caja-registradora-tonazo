-- =========================================================================
-- Las funciones internas de los webhooks (fn_webhook_*) ya no se pueden
-- llamar desde la app.
--
-- Estaban abiertas a anon y authenticated: con la clave pública de la web
-- cualquiera podía llamar fn_webhook_secret y leer los secretos del Vault
-- (la clave que firma los avisos Caja -> Taxi-PE y las URLs), o
-- fn_webhook_emitir y mandar avisos firmados a Taxi-PE.
--
-- Solo las usan otras funciones de la base (security definer, corren como
-- postgres) y el cron de reconciliación, así que no se rompe nada.
-- service_role conserva el permiso.
--
-- Proyecto: Caja Tonazo. Idempotente.
-- =========================================================================

do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as firma
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace and p.proname like 'fn\_webhook\_%'
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.firma);
    execute format('grant execute on function %s to service_role', r.firma);
  end loop;
end $$;

notify pgrst, 'reload schema';
