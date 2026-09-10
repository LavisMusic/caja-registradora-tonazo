-- Agrega 'estado_caja' a la publicación 'supabase_realtime' — sin esto,
-- el nuevo channel de App.jsx (suscripción a UPDATE en 'estado_caja',
-- para que el admin se entere al instante cuando un cajero cierra su
-- turno) se conecta sin error pero JAMÁS recibe eventos, en silencio.
-- Mismo gotcha que ya se resolvió para productos/stock/categorias en
-- la migración 0045 — ver ese archivo para más contexto.
do $$
begin
  begin
    alter publication supabase_realtime add table public.estado_caja;
  exception when duplicate_object then
    null;
  end;
end $$;

-- Verificación rápida (correr aparte, en el SQL Editor):
--   select schemaname, tablename
--   from pg_publication_tables
--   where pubname = 'supabase_realtime' and tablename = 'estado_caja';
