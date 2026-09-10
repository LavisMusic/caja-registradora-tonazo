-- Agrega 'cierres_caja' a la publicación 'supabase_realtime' — sin
-- esto, el nuevo channel de App.jsx (suscripción a INSERT en
-- 'cierres_caja', para que el Historial de Cierres del admin muestre
-- la tarjeta nueva apenas un cajero cierra su turno) se conecta sin
-- error pero JAMÁS recibe eventos, en silencio. Mismo gotcha que
-- 'productos'/'stock'/'categorias' (migración 0045) y 'estado_caja'
-- (migración 0046).
do $$
begin
  begin
    alter publication supabase_realtime add table public.cierres_caja;
  exception when duplicate_object then
    null;
  end;
end $$;

-- Verificación rápida (correr aparte, en el SQL Editor):
--   select schemaname, tablename
--   from pg_publication_tables
--   where pubname = 'supabase_realtime' and tablename = 'cierres_caja';
