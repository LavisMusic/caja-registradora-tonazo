-- =========================================================================
-- Nombre y WhatsApp de los clientes que hicieron un pedido, para el
-- Gestor de Pedidos. El cajero solo puede leer los clientes registrados en
-- SU sucursal (RLS de clientes_fiado), así que el que pedía online desde
-- otra sucursal le salía como "Cliente". Esta función devuelve solo esos
-- dos datos y solo de clientes con pedidos en una sucursal que quien
-- pregunta puede ver (cajero: la suya; admin: las de su negocio).
--
-- Proyecto: Caja Tonazo. Idempotente.
-- =========================================================================

create or replace function public.caja_clientes_de_pedidos(p_ids uuid[])
returns table (auth_user_id uuid, nombre text, whatsapp text)
language sql
stable
security definer
set search_path = public
as $$
  select distinct on (c.auth_user_id) c.auth_user_id, c.nombre, c.whatsapp
  from public.clientes_fiado c
  where c.auth_user_id = any(p_ids)
    and exists (
      select 1
      from public.pedidos p
      left join public.sucursales s on s.id = p.sucursal_id
      left join public.localidades l on l.id = s.localidad_id
      where p.cliente_id = c.auth_user_id
        and (
          (public.is_staff() and p.sucursal_id = public.mi_sucursal_id())
          or (public.is_admin() and l.negocio_id = public.mi_negocio_id())
        )
    )
  order by c.auth_user_id, c.creado_en desc nulls last;
$$;
revoke execute on function public.caja_clientes_de_pedidos(uuid[]) from public, anon;
grant execute on function public.caja_clientes_de_pedidos(uuid[]) to authenticated;

notify pgrst, 'reload schema';
