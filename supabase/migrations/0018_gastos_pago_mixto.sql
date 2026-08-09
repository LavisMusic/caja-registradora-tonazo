-- Gastos con pago mixto (Efectivo + Digital simultáneos, ej. parte en
-- billetes y parte por Yape para completar una compra). Se agregan dos
-- columnas para registrar cuánto salió exactamente de cada origen, y
-- se amplía el CHECK de metodo_pago (agregado en 0014 como constraint
-- sin nombre fijo) para aceptar el nuevo valor 'MIXTO'. Mismo patrón
-- dinámico de búsqueda de constraint usado en 0013/0016.

alter table public.gastos
  add column if not exists monto_efectivo numeric,
  add column if not exists monto_digital numeric;

do $$
declare
  cname text;
begin
  select con.conname into cname
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_attribute att on att.attrelid = rel.oid and att.attnum = any(con.conkey)
  where rel.relname = 'gastos' and att.attname = 'metodo_pago' and con.contype = 'c';

  if cname is not null then
    execute format('alter table public.gastos drop constraint %I', cname);
  end if;
end $$;

alter table public.gastos
  add constraint gastos_metodo_pago_check
  check (metodo_pago is null or metodo_pago in ('EFECTIVO', 'DIGITAL', 'MIXTO'));

-- monto_efectivo/monto_digital solo se usan cuando metodo_pago =
-- 'MIXTO' (ver App.jsx: para EFECTIVO/DIGITAL/null el split del
-- arqueo sigue el criterio binario legacy de metodo_pago).
