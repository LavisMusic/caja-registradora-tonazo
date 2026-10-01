-- =========================================================================
-- Fix: "Database error deleting user" al eliminar CUALQUIER cliente que
-- ya hizo al menos un pedido desde la tienda.
--
-- pedidos.cliente_id referencia auth.users(id) SIN 'on delete' — a
-- diferencia de profiles.id (cascade) y clientes_fiado.auth_user_id
-- (set null, ver comentario de manage-usuario), esta FK no tenía
-- ninguna acción definida, así que Postgres rechazaba el DELETE de
-- auth.users con una violación de llave foránea en cuanto ese cliente
-- tenía algún pedido — GoTrue lo reporta como el genérico "Database
-- error deleting user", sin detalle.
--
-- Mismo criterio que clientes_fiado: el pedido (historial real de
-- ventas/entregas) NUNCA se borra — 'cliente_id' simplemente queda en
-- NULL, la cuenta de login es lo único que desaparece.
--
-- Proyecto: Caja Tonazo. Idempotente (el bloque busca el nombre real
-- de la constraint en vez de asumirlo).
-- =========================================================================

alter table public.pedidos alter column cliente_id drop not null;

do $$
declare
  v_conname text;
begin
  select tc.constraint_name into v_conname
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name
   and tc.table_schema = kcu.table_schema
  where tc.table_schema = 'public'
    and tc.table_name = 'pedidos'
    and tc.constraint_type = 'FOREIGN KEY'
    and kcu.column_name = 'cliente_id'
  limit 1;

  if v_conname is not null then
    execute format('alter table public.pedidos drop constraint %I', v_conname);
  end if;

  alter table public.pedidos
    add constraint pedidos_cliente_id_fkey
    foreign key (cliente_id) references auth.users(id) on delete set null;
end $$;
