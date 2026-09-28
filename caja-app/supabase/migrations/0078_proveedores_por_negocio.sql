-- Deuda técnica de la Fase 1: 'proveedores' quedó afuera cuando se
-- acotó 'gastos' por negocio (migración 0073) — todos los negocios
-- compartían la misma lista de proveedores sin que nadie lo pidiera
-- así.

alter table public.proveedores add column if not exists negocio_id uuid references public.negocios(id);

do $$
declare
  v_negocio_id uuid;
begin
  select id into v_negocio_id from public.negocios where slug = 'tonazo';
  update public.proveedores set negocio_id = v_negocio_id where negocio_id is null;
end $$;

alter table public.proveedores alter column negocio_id set not null;

-- Si 'ruc' tenía una restricción UNIQUE de una sola columna (dos
-- negocios comprándole al mismo proveedor real, mismo RUC, no debería
-- chocar entre sí), se reemplaza por una compuesta (ruc, negocio_id).
do $$
declare
  r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class relp on relp.oid = con.conrelid
    where relp.relname = 'proveedores'
      and con.contype in ('u', 'p')
      and array_length(con.conkey, 1) = 1
      and con.conkey = (
        select array_agg(attnum) from pg_attribute
        where attrelid = relp.oid and attname = 'ruc'
      )
  loop
    execute format('alter table public.proveedores drop constraint %I', r.conname);
  end loop;
end $$;

create unique index if not exists proveedores_ruc_negocio_uidx on public.proveedores (ruc, negocio_id) where ruc is not null;
