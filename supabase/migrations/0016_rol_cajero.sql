-- Nuevo rol "cajero": personal operativo que vende y cobra fiados pero
-- no ve información financiera (ganancias, márgenes, tickets).
--
-- profiles.role solo permitía 'admin' | 'cliente' — hay que ampliar el
-- CHECK constraint para aceptar 'cajero' también. Como no sabemos el
-- nombre exacto del constraint (fue creado en 0001 sin nombre
-- explícito), lo buscamos dinámicamente antes de recrearlo, igual que
-- ya hicimos con el de 'historial.metodo_pago'.
do $$
declare
  r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_attribute att on att.attrelid = rel.oid and att.attnum = any(con.conkey)
    where rel.relname = 'profiles' and att.attname = 'role' and con.contype = 'c'
  loop
    execute format('alter table public.profiles drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.profiles
  add constraint profiles_role_check check (role in ('admin', 'cliente', 'cajero'));

-- profiles no guardaba nombre (el de 'cliente' vive en
-- clientes_fiado.nombre) — para un cajero no hay una tabla de negocio
-- asociada, así que necesita su propio nombre acá para que el admin
-- pueda identificar "cuál cajero es cuál" al gestionarlos.
alter table public.profiles
  add column if not exists nombre text;
