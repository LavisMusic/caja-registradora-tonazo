-- =========================================================================
-- Permitir BORRAR un pedido ya cerrado (cancelado) para sacarlo del
-- historial — tanto el cliente (los suyos) como admin/cajero (los de su
-- sucursal). pedido_items / pedido_mensajes se van solos por el
-- `on delete cascade` que ya tienen (migración 0054).
--
-- Solo estados cerrados: un pedido activo NO se puede borrar.
-- Idempotente.
-- =========================================================================

drop policy if exists "pedidos_delete" on public.pedidos;
create policy "pedidos_delete" on public.pedidos
  for delete using (
    estado in ('cancelado', 'confirmado')
    and (
      cliente_id = auth.uid()
      or public.is_admin()
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
          and p.role = 'cajero'
          and p.sucursal_id = pedidos.sucursal_id
      )
    )
  );
