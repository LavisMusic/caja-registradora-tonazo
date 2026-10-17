-- =========================================================================
-- Arreglo de 0108: la guarda "nadie entrega un retiro sin verificar" leía
-- pedido_retiros con los permisos del cajero, y esa tabla está cerrada a
-- propósito → "permission denied for table pedido_retiros" al pasar el
-- pedido a 'confirmado' (la venta sí se registraba, una sola vez). Ahora la
-- consulta va por una función con permisos propios.
--
-- Proyecto: Caja Tonazo. Idempotente.
-- =========================================================================

create or replace function public.caja_retiro_verificado(p_pedido_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pedido_retiros
    where pedido_id = p_pedido_id and verificado_at is not null
  );
$$;
revoke execute on function public.caja_retiro_verificado(uuid) from public, anon;
grant execute on function public.caja_retiro_verificado(uuid) to authenticated;

create or replace function public.fn_pedidos_retiro_verificado()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('anon', 'authenticated')
     and new.estado = 'confirmado'
     and old.estado is distinct from 'confirmado'
     and not coalesce(new.requiere_delivery, false) then
    if not public.caja_retiro_verificado(new.id) then
      raise exception 'Para entregar un retiro hay que verificar el PIN o el QR del cliente.'
        using errcode = '22023';
    end if;
  end if;
  return new;
end;
$$;

-- Retiros que quedaron verificados y con su venta registrada pero sin
-- cerrar por este error: se cierran ahora.
update public.pedidos p
  set estado = 'confirmado'
  where not coalesce(p.requiere_delivery, false)
    and p.estado = 'en_atencion'
    and p.venta_purchase_id is not null
    and exists (
      select 1 from public.pedido_retiros r
      where r.pedido_id = p.id and r.verificado_at is not null
    );

notify pgrst, 'reload schema';
