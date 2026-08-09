-- Permite a un cliente ver SUS PROPIOS pagos_pendientes (antes solo el
-- admin podía hacer SELECT). Necesario para que la vista del cliente
-- pueda chequear si ya tiene un comprobante en revisión y así bloquear
-- el envío de un segundo pago mientras el primero no se resuelve.
-- Se combina (OR) con la política de admin ya existente — el admin
-- sigue viendo todo, el cliente ahora ve además lo suyo.

drop policy if exists "pagos_pendientes_cliente_select_own" on public.pagos_pendientes;
create policy "pagos_pendientes_cliente_select_own" on public.pagos_pendientes
  for select
  using (
    exists (
      select 1 from public.clientes_fiado c
      where c.id = pagos_pendientes.cliente_id and c.auth_user_id = auth.uid()
    )
  );
