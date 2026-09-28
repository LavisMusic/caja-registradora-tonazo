-- El Gestor de Cuentas necesita mostrar, para cada cajero, en qué
-- sucursal/caja está — pero el super-admin no es ni is_admin() ni
-- is_staff() (es un rol aparte), así que las políticas de
-- localidades/sucursales/cajas (todas negocio-scoped a partir de la
-- migración 0079) no lo dejaban leer nada de estas 3 tablas. Solo
-- SELECT: crear/renombrar/eliminar sigue siendo trabajo del admin de
-- cada negocio desde su propio Gestor de Localidades.

drop policy if exists "localidades_super_admin_select" on public.localidades;
create policy "localidades_super_admin_select" on public.localidades
  for select
  using (public.is_super_admin());

drop policy if exists "sucursales_super_admin_select" on public.sucursales;
create policy "sucursales_super_admin_select" on public.sucursales
  for select
  using (public.is_super_admin());

drop policy if exists "cajas_super_admin_select" on public.cajas;
create policy "cajas_super_admin_select" on public.cajas
  for select
  using (public.is_super_admin());
