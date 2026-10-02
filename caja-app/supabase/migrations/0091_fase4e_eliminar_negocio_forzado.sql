-- Fase 4 (bloque C) — borrado FORZADO de un negocio desde el Gestor de
-- negocios del super admin. Antes, si el negocio tenía localidades,
-- cajas, ventas, productos… el borrado fallaba por las llaves foráneas
-- (a propósito, para no perder datos por error). Ahora, con
-- confirmación explícita (hay que escribir el nombre del negocio), se
-- borra TODO lo suyo de la base:
--   1) Los CLIENTES no se borran (su cuenta es compartida entre
--      negocios): solo se desvinculan; sus filas de clientes_fiado de
--      ESTE negocio sí se borran.
--   2) Los deliveries en curso se cancelan en Taxi-PE (mismo webhook que
--      al cancelar un pedido; Taxi-PE ignora los que ya terminaron).
--   3) Se borra el negocio con todas sus filas dependientes, recorriendo
--      las llaves foráneas reales de la base (no una lista fija, así no
--      se escapa ninguna tabla).
--   4) Se borran las cuentas de admin y cajeros de ese negocio.
-- Todo en UNA transacción: si algo falla, no se borra nada.
-- Los negocios EXENTOS (ej. Tonazo) no se pueden borrar: hay que pasarlos
-- antes a "Automático" (protección contra un borrado accidental).
-- Idempotente. Correr en el SQL Editor de Caja Tonazo.

-- Borra las filas de p_tabla que cumplen p_filtro, borrando ANTES (de
-- forma recursiva) las filas de otras tablas que las referencian con
-- llaves foráneas que no se limpian solas (NO ACTION / RESTRICT /
-- CASCADE). Las de SET NULL / SET DEFAULT las resuelve Postgres.
create or replace function public.fn_borrar_con_dependientes(p_tabla regclass, p_filtro text, p_nivel int default 0)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  fk record;
begin
  if p_nivel > 10 then
    raise exception 'Demasiados niveles de dependencias al borrar %', p_tabla;
  end if;
  for fk in
    select c.conrelid::regclass as hijo,
           (select a.attname from pg_attribute a where a.attrelid = c.conrelid and a.attnum = c.conkey[1]) as col_hijo,
           (select a.attname from pg_attribute a where a.attrelid = c.confrelid and a.attnum = c.confkey[1]) as col_padre
    from pg_constraint c
    where c.contype = 'f'
      and c.confrelid = p_tabla
      and c.conrelid <> p_tabla
      and array_length(c.conkey, 1) = 1
      and c.confdeltype in ('a', 'r', 'c')
  loop
    perform public.fn_borrar_con_dependientes(
      fk.hijo,
      format('%I in (select %I from %s where %s)', fk.col_hijo, fk.col_padre, p_tabla, p_filtro),
      p_nivel + 1
    );
  end loop;
  execute format('delete from %s where %s', p_tabla, p_filtro);
end;
$$;

revoke all on function public.fn_borrar_con_dependientes(regclass, text, int) from public, anon, authenticated;

-- Resumen para el modal de confirmación.
create or replace function public.resumen_negocio_para_borrar(p_negocio_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v jsonb;
begin
  if not public.is_super_admin() then
    raise exception 'Solo el super admin.';
  end if;
  with suc as (
    select s.id from public.sucursales s
    join public.localidades l on l.id = s.localidad_id
    where l.negocio_id = p_negocio_id
  )
  select jsonb_build_object(
    'localidades', (select count(*) from public.localidades where negocio_id = p_negocio_id),
    'sucursales', (select count(*) from suc),
    'cajas', (select count(*) from public.cajas where sucursal_id in (select id from suc)),
    'cajas_abiertas', (select count(*) from public.cajas where sucursal_id in (select id from suc) and estado = 'abierta'),
    'productos', (select count(*) from public.productos where negocio_id = p_negocio_id),
    'ventas', (select count(distinct purchase_id) from public.historial where sucursal_id in (select id from suc)),
    'pedidos', (select count(*) from public.pedidos where sucursal_id in (select id from suc)),
    'deliveries_en_curso', (
      select count(*) from public.pedidos
      where sucursal_id in (select id from suc) and entrega_id is not null and estado <> 'cancelado'
    ),
    'clientes_con_fiado', (select count(*) from public.clientes_fiado where negocio_id = p_negocio_id),
    'cuentas_staff', (select count(*) from public.profiles where negocio_id = p_negocio_id and role in ('admin', 'cajero'))
  ) into v;
  return v;
end;
$$;

create or replace function public.eliminar_negocio_forzado(p_negocio_id uuid, p_confirmacion text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  n public.negocios%rowtype;
  v_staff uuid[];
  v_sucursales uuid[];
begin
  if not public.is_super_admin() then
    raise exception 'Solo el super admin puede eliminar negocios.';
  end if;

  select * into n from public.negocios where id = p_negocio_id for update;
  if not found then
    raise exception 'Negocio no encontrado.';
  end if;
  if n.plan_exento then
    raise exception 'El negocio % es exento: pásalo a "Automático" antes de eliminarlo.', n.nombre;
  end if;
  if lower(trim(coalesce(p_confirmacion, ''))) <> lower(trim(n.nombre)) then
    raise exception 'El nombre escrito no coincide con el del negocio.';
  end if;

  select coalesce(array_agg(s.id), '{}') into v_sucursales
    from public.sucursales s
    join public.localidades l on l.id = s.localidad_id
    where l.negocio_id = p_negocio_id;

  -- 1) Clientes: se desvinculan, no se borran.
  update public.profiles
    set negocio_id = null, sucursal_id = null, caja_id = null
    where role = 'cliente'
      and (negocio_id = p_negocio_id or sucursal_id = any(v_sucursales));

  -- Cuentas de admin/cajeros a borrar al final.
  select coalesce(array_agg(id), '{}') into v_staff
    from public.profiles
    where role in ('admin', 'cajero')
      and (negocio_id = p_negocio_id or sucursal_id = any(v_sucursales));

  -- 2) Cancelar deliveries en Taxi-PE (trigger de pedidos → webhook).
  update public.pedidos
    set estado = 'cancelado'
    where sucursal_id = any(v_sucursales)
      and entrega_id is not null
      and estado <> 'cancelado';

  -- 3) El negocio y todo lo que cuelga de él.
  perform public.fn_borrar_con_dependientes('public.negocios'::regclass, format('id = %L', p_negocio_id));

  -- 4) Cuentas de admin/cajeros (su fila de profiles ya se borró arriba).
  delete from auth.users where id = any(v_staff);
end;
$$;

notify pgrst, 'reload schema';
