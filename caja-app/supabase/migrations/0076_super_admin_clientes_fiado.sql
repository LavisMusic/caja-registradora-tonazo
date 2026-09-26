-- Fase 1 del super-admin: lectura de clientes_fiado/fiado_items/
-- movimientos_fiado para el super-admin (NegocioClientesModal.jsx) —
-- solo lectura, ninguna de estas políticas toca INSERT/UPDATE/DELETE,
-- que siguen siendo exclusivos de las Edge Functions/admin de cada
-- negocio como hasta ahora. is_super_admin() ya existe (migración
-- 0074).

drop policy if exists "clientes_fiado_super_admin_select" on public.clientes_fiado;
create policy "clientes_fiado_super_admin_select" on public.clientes_fiado
  for select
  using (public.is_super_admin());

drop policy if exists "fiado_items_super_admin_select" on public.fiado_items;
create policy "fiado_items_super_admin_select" on public.fiado_items
  for select
  using (public.is_super_admin());

drop policy if exists "movimientos_fiado_super_admin_select" on public.movimientos_fiado;
create policy "movimientos_fiado_super_admin_select" on public.movimientos_fiado
  for select
  using (public.is_super_admin());
