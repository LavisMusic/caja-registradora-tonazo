-- Deuda técnica de la Fase 1: categorias.nombre es único en TODA la
-- base (de antes de la Fase 0), no por negocio — dos negocios
-- distintos no podían tener ambos una categoría llamada, por ejemplo,
-- "Bebidas". Además, productos.categoria referencia a categorias por
-- NOMBRE (no por id) vía una FK real (productos_categoria_fkey) — para
-- que la nueva unicidad compuesta (nombre, negocio_id) pueda seguir
-- siendo el target de esa FK, la FK también pasa a ser compuesta
-- (categoria, negocio_id) -> categorias(nombre, negocio_id).
--
-- Los DO blocks buscan las restricciones existentes por su FORMA (no
-- por nombre fijo) antes de tocarlas, para no asumir a ciegas cómo se
-- llaman exactamente (predatan las migraciones locales, se crearon a
-- mano en Studio).

do $$
declare
  r record;
begin
  -- 1) Soltar cualquier FK de productos.categoria -> categorias(nombre)
  --    de una sola columna, sea cual sea su nombre real.
  for r in
    select con.conname
    from pg_constraint con
    join pg_class relp on relp.oid = con.conrelid
    where relp.relname = 'productos'
      and con.contype = 'f'
      and con.confrelid = 'public.categorias'::regclass
      and array_length(con.conkey, 1) = 1
      and con.conkey = (
        select array_agg(attnum) from pg_attribute
        where attrelid = relp.oid and attname = 'categoria'
      )
  loop
    execute format('alter table public.productos drop constraint %I', r.conname);
  end loop;

  -- 2) Soltar cualquier UNIQUE/PK de categorias sobre 'nombre' sola.
  for r in
    select con.conname
    from pg_constraint con
    join pg_class relc on relc.oid = con.conrelid
    where relc.relname = 'categorias'
      and con.contype in ('u', 'p')
      and array_length(con.conkey, 1) = 1
      and con.conkey = (
        select array_agg(attnum) from pg_attribute
        where attrelid = relc.oid and attname = 'nombre'
      )
  loop
    execute format('alter table public.categorias drop constraint %I', r.conname);
  end loop;
end $$;

-- 3) Unicidad compuesta nueva: dos negocios distintos ya pueden tener
--    una categoría con el mismo nombre; el mismo negocio sigue sin
--    poder repetirlo.
alter table public.categorias
  add constraint categorias_nombre_negocio_key unique (nombre, negocio_id);

-- 4) FK compuesta nueva, apuntando a esa misma unicidad.
alter table public.productos
  add constraint productos_categoria_negocio_fkey
  foreign key (categoria, negocio_id)
  references public.categorias (nombre, negocio_id);
