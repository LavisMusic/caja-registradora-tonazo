-- Fix: "No se pudo registrar la venta" al vender con método EFECTIVO.
--
-- Causa más probable: la columna historial.metodo_pago tiene un CHECK
-- constraint (o un tipo ENUM) con la lista de métodos válidos, creado
-- antes de que existiera 'EFECTIVO' como método — Postgres rechaza el
-- INSERT porque 'EFECTIVO' no está en la lista permitida. No es un
-- tema de RLS ni de Storage: el INSERT a 'historial' nunca subió
-- imágenes (esa es la tabla 'comprobantes', aparte).
--
-- Este script no asume el nombre exacto del constraint (puede variar
-- según cómo se creó la tabla) — lo busca dinámicamente.

-- Caso A: metodo_pago es un ENUM de Postgres.
do $$
declare
  enum_type text;
begin
  select t.typname into enum_type
  from pg_type t
  join pg_attribute a on a.atttypid = t.oid
  join pg_class c on c.oid = a.attrelid
  where c.relname = 'historial' and a.attname = 'metodo_pago' and t.typtype = 'e';

  if enum_type is not null then
    execute format('alter type %I add value if not exists ''EFECTIVO''', enum_type);
  end if;
end $$;

-- Caso B: metodo_pago tiene un CHECK constraint con la lista de
-- valores permitidos — lo encuentra y lo recrea incluyendo 'EFECTIVO'.
do $$
declare
  r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_attribute att on att.attrelid = rel.oid and att.attnum = any(con.conkey)
    where rel.relname = 'historial' and att.attname = 'metodo_pago' and con.contype = 'c'
  loop
    execute format('alter table public.historial drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.historial
  add constraint historial_metodo_pago_check
  check (metodo_pago in ('YAPE', 'PLIN', 'OTROS', 'FIADO', 'EFECTIVO'));
