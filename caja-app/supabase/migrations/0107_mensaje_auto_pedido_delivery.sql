-- =========================================================================
-- Mensaje automático de la tienda al cliente cuando hace un pedido con
-- delivery: aparece en el chat con la tienda apenas se crea el pedido.
-- (El de "retiro en tienda" lo manda la app al aceptar la petición.)
--
-- Proyecto: Caja Tonazo. Idempotente.
-- =========================================================================

create or replace function public.fn_pedido_delivery_mensaje_auto()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.requiere_delivery, false) then
    insert into public.pedido_mensajes (pedido_id, remitente, mensaje)
    values (
      new.id, 'cajero',
      '🛵 Estamos buscando un repartidor para asignar tu pedido, espera por favor.'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_pedido_delivery_mensaje_auto on public.pedidos;
create trigger trg_pedido_delivery_mensaje_auto
  after insert on public.pedidos
  for each row execute function public.fn_pedido_delivery_mensaje_auto();

notify pgrst, 'reload schema';
