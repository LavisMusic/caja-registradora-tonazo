-- ============================================================================
-- ⚠️  AVISO CRÍTICO — LEE ESTO ANTES DE CORRER ESTE ARCHIVO  ⚠️
--
-- Este archivo hace CUMPLIR (a nivel de base de datos, con RLS) que un
-- cajero solo pueda leer/escribir en las filas de SU PROPIA caja. Eso
-- significa que, a partir de que corras esto, cualquier INSERT/UPDATE
-- que un cajero haga y que NO incluya su 'caja_id' correcto será
-- RECHAZADO por Postgres.
--
-- El frontend nuevo (App.jsx) ya manda 'caja_id'/'sucursal_id' en cada
-- escritura relevante (venta, fiado, comprobante, abono). El frontend
-- VIEJO (el que está en producción ahora mismo, antes de que despliegues
-- este cambio) NO lo hace.
--
-- ⚠️  NO CORRAS ESTE ARCHIVO hasta haber desplegado el frontend nuevo
--     y confirmado que el cajero real puede vender con normalidad. Si
--     corres esto ANTES de desplegar el frontend, el cajero real queda
--     bloqueado para registrar ventas/fiados/comprobantes hasta que el
--     frontend nuevo esté en línea.
--
-- Orden correcto:
--   1. Corre 0049_segregacion_columnas_y_venta.sql (aditivo, sin riesgo).
--   2. Despliega el frontend nuevo (este mensaje de chat).
--   3. Confirma que el cajero real puede vender con normalidad.
--   4. RECIÉN AHÍ corre este archivo (0050).
-- ============================================================================

-- 'mi_caja_id()'/'mi_sucursal_id()': lee la caja/sucursal asignada al
-- usuario autenticado actual desde su propio perfil. security definer
-- porque 'profiles' no tiene una policy que deje a cualquiera leer la
-- fila de cualquier otro — pero acá cada quien solo puede terminar
-- comparándose contra SU PROPIO id (auth.uid()), así que no expone nada.
create or replace function public.mi_caja_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select caja_id from public.profiles where id = auth.uid();
$$;

create or replace function public.mi_sucursal_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select sucursal_id from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------
-- historial (ventas): admin ve/edita TODO (elige su sucursal activa
-- desde la UI, no desde RLS); un cajero solo su propia caja.
-- ---------------------------------------------------------------------
drop policy if exists "historial_staff_all" on public.historial;
create policy "historial_staff_all" on public.historial
  for all
  using (public.is_admin() or (public.is_staff() and caja_id = public.mi_caja_id()))
  with check (public.is_admin() or (public.is_staff() and caja_id = public.mi_caja_id()));

-- ---------------------------------------------------------------------
-- cierres_caja: mismo criterio — el cajero solo ve/crea cierres de su
-- propia caja.
-- ---------------------------------------------------------------------
drop policy if exists "cierres_caja_admin_all" on public.cierres_caja;
create policy "cierres_caja_admin_all" on public.cierres_caja
  for all
  using (public.is_admin() or (public.is_staff() and caja_id = public.mi_caja_id()))
  with check (public.is_admin() or (public.is_staff() and caja_id = public.mi_caja_id()));

-- ---------------------------------------------------------------------
-- comprobantes (tabla, vouchers de venta Yape/Plin/Otros): igual.
-- ---------------------------------------------------------------------
drop policy if exists "comprobantes_tabla_admin_all" on public.comprobantes;
create policy "comprobantes_tabla_admin_all" on public.comprobantes
  for all
  using (public.is_admin() or (public.is_staff() and caja_id = public.mi_caja_id()))
  with check (public.is_admin() or (public.is_staff() and caja_id = public.mi_caja_id()));

-- ---------------------------------------------------------------------
-- clientes_fiado: un CLIENTE sigue pudiendo leer su propia fila
-- (auth_user_id = auth.uid(), sin cambios); un cajero solo ve/gestiona
-- clientes de SU sucursal (no de su caja específica — un cliente
-- pertenece a la sucursal, no a una caja puntual dentro de ella).
-- ---------------------------------------------------------------------
drop policy if exists "clientes_fiado_select" on public.clientes_fiado;
create policy "clientes_fiado_select" on public.clientes_fiado
  for select using (
    public.is_admin()
    or (public.is_staff() and sucursal_id = public.mi_sucursal_id())
    or auth_user_id = auth.uid()
  );

drop policy if exists "clientes_fiado_admin_write" on public.clientes_fiado;
create policy "clientes_fiado_admin_write" on public.clientes_fiado
  for all
  using (public.is_admin() or (public.is_staff() and sucursal_id = public.mi_sucursal_id()))
  with check (public.is_admin() or (public.is_staff() and sucursal_id = public.mi_sucursal_id()));

-- ---------------------------------------------------------------------
-- fiado_items: el cliente sigue viendo sus propias líneas de deuda
-- (por join a clientes_fiado.auth_user_id, sin cambios); un cajero solo
-- las de su propia caja.
-- ---------------------------------------------------------------------
drop policy if exists "fiado_items_select" on public.fiado_items;
create policy "fiado_items_select" on public.fiado_items
  for select using (
    public.is_admin()
    or (public.is_staff() and caja_id = public.mi_caja_id())
    or exists (
      select 1 from public.clientes_fiado c
      where c.id = fiado_items.cliente_id and c.auth_user_id = auth.uid()
    )
  );

drop policy if exists "fiado_items_admin_write" on public.fiado_items;
create policy "fiado_items_admin_write" on public.fiado_items
  for all
  using (public.is_admin() or (public.is_staff() and caja_id = public.mi_caja_id()))
  with check (public.is_admin() or (public.is_staff() and caja_id = public.mi_caja_id()));

-- ---------------------------------------------------------------------
-- movimientos_fiado: mismo criterio que fiado_items.
-- ---------------------------------------------------------------------
drop policy if exists "movimientos_fiado_select" on public.movimientos_fiado;
create policy "movimientos_fiado_select" on public.movimientos_fiado
  for select using (
    public.is_admin()
    or (public.is_staff() and caja_id = public.mi_caja_id())
    or exists (
      select 1 from public.clientes_fiado c
      where c.id = movimientos_fiado.cliente_id and c.auth_user_id = auth.uid()
    )
  );

drop policy if exists "movimientos_fiado_admin_write" on public.movimientos_fiado;
create policy "movimientos_fiado_admin_write" on public.movimientos_fiado
  for all
  using (public.is_admin() or (public.is_staff() and caja_id = public.mi_caja_id()))
  with check (public.is_admin() or (public.is_staff() and caja_id = public.mi_caja_id()));

-- pagos_pendientes NO se toca acá: sigue siendo exclusivo del admin
-- (aprobar/rechazar comprobantes de clientes nunca fue tarea del
-- cajero — ver 0005/0017). La segregación de esa lista para el admin
-- es un filtro de UI (dropdown activo), no de RLS.
