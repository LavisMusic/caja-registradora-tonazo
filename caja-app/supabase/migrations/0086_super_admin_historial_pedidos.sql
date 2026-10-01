-- Panel de Estadísticas del super-admin: necesita ventas (historial) y
-- pedidos (para contar repartos = pedidos con requiere_delivery=true)
-- de TODOS los negocios. Solo lectura — el super-admin no opera ventas
-- ni pedidos desde acá, solo mide movimiento.

drop policy if exists "historial_super_admin_select" on public.historial;
create policy "historial_super_admin_select" on public.historial
  for select
  using (public.is_super_admin());

drop policy if exists "pedidos_super_admin_select" on public.pedidos;
create policy "pedidos_super_admin_select" on public.pedidos
  for select
  using (public.is_super_admin());
