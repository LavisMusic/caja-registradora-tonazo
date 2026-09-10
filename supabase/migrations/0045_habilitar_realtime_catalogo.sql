-- Habilita Supabase Realtime para las tablas que useCatalog.js escucha
-- (ver el channel "catalogo-realtime-*" en useCatalog.js).
--
-- Esto es LO QUE MÁS PROBABLEMENTE está fallando si "funciona para el
-- admin pero no para cajero/cliente": ese síntoma es engañoso — cuando
-- el admin edita algo desde el Gestor de Productos o el botón "%", su
-- PROPIA pantalla se actualiza porque guardarFilaProducto/
-- saveDiscountModal llaman a refetchCatalog() directo apenas guardan
-- con éxito — eso SIEMPRE funcionó y no depende de Realtime para nada.
-- La prueba real de Realtime es si OTRA pestaña/dispositivo (que no
-- hizo el cambio) lo ve sin recargar — y eso solo puede pasar si estas
-- tres tablas están agregadas a la publicación 'supabase_realtime'.
-- Sin este paso, el .subscribe() del frontend nunca tira un error:
-- simplemente no llegan eventos, en silencio.
--
-- 'add table' es seguro de correr aunque una tabla ya esté agregada:
-- Postgres tira un error de "already member of publication" en ese
-- caso puntual, así que cada ADD va envuelto en su propio DO block que
-- lo ignora si ya estaba.
do $$
begin
  begin
    alter publication supabase_realtime add table public.productos;
  exception when duplicate_object then
    null;
  end;

  begin
    alter publication supabase_realtime add table public.stock;
  exception when duplicate_object then
    null;
  end;

  begin
    alter publication supabase_realtime add table public.categorias;
  exception when duplicate_object then
    null;
  end;
end $$;

-- Verificación rápida (correr aparte, en el SQL Editor, para confirmar
-- que las tres tablas quedaron adentro):
--   select schemaname, tablename
--   from pg_publication_tables
--   where pubname = 'supabase_realtime'
--     and tablename in ('productos', 'stock', 'categorias');
