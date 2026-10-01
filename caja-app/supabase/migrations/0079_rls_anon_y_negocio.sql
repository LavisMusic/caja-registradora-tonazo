-- Refuerzo de RLS (deuda técnica de la Fase 1), en dos partes.
--
-- PARTE A — cierra un agujero SERIO y anterior a esta sesión: varias
-- tablas tenían una política "Permitir lectura/insertar anon en X" con
-- qual/with_check = true, sin ninguna condición — cualquiera con la
-- anon key (pública, viaja en el bundle del sitio) podía leer y hasta
-- ESCRIBIR esas tablas directo por la API de Supabase, sin sesión ni
-- pasar por la app. Se eliminan esas políticas; las políticas
-- "_admin_write"/"_admin_all" que ya existían siguen dando acceso
-- real a admin/cajero autenticados, así que nada que dependía de una
-- sesión real se rompe. NO se tocan las políticas "public_read"/
-- "public_select" de productos/categorias/stock/sucursales/localidades
-- /inventario_sucursales — esas son a propósito (catálogo público de
-- la tienda, de solo lectura).
--
-- PARTE B — cierra la separación por negocio a nivel de base de datos:
-- is_admin()/is_staff() (definidas fuera de las migraciones locales)
-- no miran negocio_id para nada, así que hoy el admin de CUALQUIER
-- negocio pasa esas políticas para datos de OTRO negocio — la
-- separación real hasta ahora es solo la que agrega el código de la
-- app. Se agregan funciones helper (mi_negocio_id(), y dos de
-- conveniencia para las tablas que llegan a negocio_id por cadena de
-- FK) y se reescribe cada política que dependía de is_admin()/
-- is_staff() sin acotar, agregando esa condición. Las partes de esas
-- políticas que YA comparan contra mi_sucursal_id()/mi_caja_id() (el
-- cajero) no se tocan — un cajero solo puede pertenecer a UNA
-- sucursal, que ya está adentro de UN solo negocio, así que esa
-- comparación ya es negocio-correcta de por sí.

-- =========================================================================
-- PARTE A: eliminar las políticas anon-abiertas.
-- =========================================================================

drop policy if exists "Permitir insertar anon en clientes_fiado" on public.clientes_fiado;
drop policy if exists "Permitir lectura anon en clientes_fiado" on public.clientes_fiado;

drop policy if exists "Permitir insertar anon en comprobantes" on public.comprobantes;
drop policy if exists "Permitir lectura anon en comprobantes" on public.comprobantes;

drop policy if exists "Permitir actualizar anon en fiado_items" on public.fiado_items;
drop policy if exists "Permitir insertar anon en fiado_items" on public.fiado_items;
drop policy if exists "Permitir lectura anon en fiado_items" on public.fiado_items;

drop policy if exists "Permitir insertar anon en movimientos_fiado" on public.movimientos_fiado;
drop policy if exists "Permitir lectura anon en movimientos_fiado" on public.movimientos_fiado;

drop policy if exists "Permitir insertar anon en gastos" on public.gastos;
drop policy if exists "Permitir lectura anon en gastos" on public.gastos;

drop policy if exists "Permitir insertar anon en gasto_items" on public.gasto_items;
drop policy if exists "Permitir lectura anon en gasto_items" on public.gasto_items;

drop policy if exists "Permitir insertar anon en proveedores" on public.proveedores;
drop policy if exists "Permitir lectura anon en proveedores" on public.proveedores;

drop policy if exists "Permitir insertar anon en cierres_caja" on public.cierres_caja;
drop policy if exists "Permitir lectura anon en cierres_caja" on public.cierres_caja;

-- =========================================================================
-- PARTE B: funciones helper para "esto pertenece a mi negocio".
-- =========================================================================

create or replace function public.mi_negocio_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select negocio_id from public.profiles where id = auth.uid();
$$;

create or replace function public.sucursal_en_mi_negocio(p_sucursal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.sucursales s
    join public.localidades l on l.id = s.localidad_id
    where s.id = p_sucursal_id and l.negocio_id = public.mi_negocio_id()
  );
$$;

create or replace function public.caja_en_mi_negocio(p_caja_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cajas c
    join public.sucursales s on s.id = c.sucursal_id
    join public.localidades l on l.id = s.localidad_id
    where c.id = p_caja_id and l.negocio_id = public.mi_negocio_id()
  );
$$;

-- =========================================================================
-- PARTE B: tablas con negocio_id propio.
-- =========================================================================

drop policy if exists "clientes_fiado_admin_write" on public.clientes_fiado;
create policy "clientes_fiado_admin_write" on public.clientes_fiado
  for all
  using ((is_admin() and negocio_id = mi_negocio_id()) or (is_staff() and sucursal_id = mi_sucursal_id()))
  with check ((is_admin() and negocio_id = mi_negocio_id()) or (is_staff() and sucursal_id = mi_sucursal_id()));

drop policy if exists "clientes_fiado_select" on public.clientes_fiado;
create policy "clientes_fiado_select" on public.clientes_fiado
  for select
  using (
    (is_admin() and negocio_id = mi_negocio_id())
    or (is_staff() and sucursal_id = mi_sucursal_id())
    or (auth_user_id = auth.uid())
  );

drop policy if exists "gastos_admin_all" on public.gastos;
create policy "gastos_admin_all" on public.gastos
  for all
  using (is_staff() and negocio_id = mi_negocio_id())
  with check (is_staff() and negocio_id = mi_negocio_id());

drop policy if exists "gasto_items_admin_all" on public.gasto_items;
create policy "gasto_items_admin_all" on public.gasto_items
  for all
  using (is_staff() and exists (select 1 from public.gastos g where g.id = gasto_items.gasto_id and g.negocio_id = mi_negocio_id()))
  with check (is_staff() and exists (select 1 from public.gastos g where g.id = gasto_items.gasto_id and g.negocio_id = mi_negocio_id()));

drop policy if exists "proveedores_admin_all" on public.proveedores;
create policy "proveedores_admin_all" on public.proveedores
  for all
  using (is_staff() and negocio_id = mi_negocio_id())
  with check (is_staff() and negocio_id = mi_negocio_id());

drop policy if exists "productos_admin_update" on public.productos;
create policy "productos_admin_update" on public.productos
  for update
  using (is_admin() and negocio_id = mi_negocio_id())
  with check (is_admin() and negocio_id = mi_negocio_id());

drop policy if exists "productos_staff_insert" on public.productos;
create policy "productos_staff_insert" on public.productos
  for insert
  with check (is_staff() and negocio_id = mi_negocio_id());

drop policy if exists "categorias_admin_update" on public.categorias;
create policy "categorias_admin_update" on public.categorias
  for update
  using (is_admin() and negocio_id = mi_negocio_id())
  with check (is_admin() and negocio_id = mi_negocio_id());

drop policy if exists "categorias_staff_insert" on public.categorias;
create policy "categorias_staff_insert" on public.categorias
  for insert
  with check (is_staff() and negocio_id = mi_negocio_id());

drop policy if exists "stock_admin_update" on public.stock;
create policy "stock_admin_update" on public.stock
  for update
  using (is_staff() and negocio_id = mi_negocio_id())
  with check (is_staff() and negocio_id = mi_negocio_id());

drop policy if exists "stock_admin_write" on public.stock;
create policy "stock_admin_write" on public.stock
  for insert
  with check (is_staff() and negocio_id = mi_negocio_id());

drop policy if exists "localidades_admin_delete" on public.localidades;
create policy "localidades_admin_delete" on public.localidades
  for delete
  using (is_admin() and negocio_id = mi_negocio_id());

drop policy if exists "localidades_admin_update" on public.localidades;
create policy "localidades_admin_update" on public.localidades
  for update
  using (is_admin() and negocio_id = mi_negocio_id())
  with check (is_admin() and negocio_id = mi_negocio_id());

drop policy if exists "localidades_admin_write" on public.localidades;
create policy "localidades_admin_write" on public.localidades
  for insert
  with check (is_admin() and negocio_id = mi_negocio_id());

drop policy if exists "localidades_staff_select" on public.localidades;
create policy "localidades_staff_select" on public.localidades
  for select
  using (is_staff() and negocio_id = mi_negocio_id());

-- =========================================================================
-- PARTE B: tablas sin negocio_id propio, acotadas por cadena de FK.
-- =========================================================================

drop policy if exists "sucursales_admin_delete" on public.sucursales;
create policy "sucursales_admin_delete" on public.sucursales
  for delete
  using (is_admin() and sucursal_en_mi_negocio(id));

drop policy if exists "sucursales_admin_update" on public.sucursales;
create policy "sucursales_admin_update" on public.sucursales
  for update
  using (is_admin() and sucursal_en_mi_negocio(id))
  with check (is_admin() and sucursal_en_mi_negocio(id));

drop policy if exists "sucursales_admin_write" on public.sucursales;
create policy "sucursales_admin_write" on public.sucursales
  for insert
  with check (is_admin() and sucursal_en_mi_negocio(id));

drop policy if exists "sucursales_staff_select" on public.sucursales;
create policy "sucursales_staff_select" on public.sucursales
  for select
  using (is_staff() and sucursal_en_mi_negocio(id));

drop policy if exists "cajas_admin_delete" on public.cajas;
create policy "cajas_admin_delete" on public.cajas
  for delete
  using (is_admin() and sucursal_en_mi_negocio(sucursal_id));

drop policy if exists "cajas_admin_insert" on public.cajas;
create policy "cajas_admin_insert" on public.cajas
  for insert
  with check (is_admin() and sucursal_en_mi_negocio(sucursal_id));

drop policy if exists "cajas_staff_select" on public.cajas;
create policy "cajas_staff_select" on public.cajas
  for select
  using (is_staff() and sucursal_en_mi_negocio(sucursal_id));

drop policy if exists "cajas_staff_update" on public.cajas;
create policy "cajas_staff_update" on public.cajas
  for update
  using (is_staff() and sucursal_en_mi_negocio(sucursal_id))
  with check (is_staff() and sucursal_en_mi_negocio(sucursal_id));

drop policy if exists "inventario_sucursales_staff_select" on public.inventario_sucursales;
create policy "inventario_sucursales_staff_select" on public.inventario_sucursales
  for select
  using (is_staff() and sucursal_en_mi_negocio(sucursal_id));

drop policy if exists "inventario_sucursales_staff_write" on public.inventario_sucursales;
create policy "inventario_sucursales_staff_write" on public.inventario_sucursales
  for all
  using ((is_admin() and sucursal_en_mi_negocio(sucursal_id)) or (is_staff() and sucursal_id = mi_sucursal_id()))
  with check ((is_admin() and sucursal_en_mi_negocio(sucursal_id)) or (is_staff() and sucursal_id = mi_sucursal_id()));

drop policy if exists "cierres_caja_admin_all" on public.cierres_caja;
create policy "cierres_caja_admin_all" on public.cierres_caja
  for all
  using ((is_admin() and caja_en_mi_negocio(caja_id)) or (is_staff() and caja_id = mi_caja_id()))
  with check ((is_admin() and caja_en_mi_negocio(caja_id)) or (is_staff() and caja_id = mi_caja_id()));

drop policy if exists "comprobantes_tabla_admin_all" on public.comprobantes;
create policy "comprobantes_tabla_admin_all" on public.comprobantes
  for all
  using ((is_admin() and caja_en_mi_negocio(caja_id)) or (is_staff() and caja_id = mi_caja_id()))
  with check ((is_admin() and caja_en_mi_negocio(caja_id)) or (is_staff() and caja_id = mi_caja_id()));

drop policy if exists "fiado_items_admin_write" on public.fiado_items;
create policy "fiado_items_admin_write" on public.fiado_items
  for all
  using ((is_admin() and caja_en_mi_negocio(caja_id)) or (is_staff() and caja_id = mi_caja_id()))
  with check ((is_admin() and caja_en_mi_negocio(caja_id)) or (is_staff() and caja_id = mi_caja_id()));

drop policy if exists "fiado_items_select" on public.fiado_items;
create policy "fiado_items_select" on public.fiado_items
  for select
  using (
    (is_admin() and caja_en_mi_negocio(caja_id))
    or (is_staff() and caja_id = mi_caja_id())
    or (exists (select 1 from public.clientes_fiado c where c.id = fiado_items.cliente_id and c.auth_user_id = auth.uid()))
  );

drop policy if exists "movimientos_fiado_admin_write" on public.movimientos_fiado;
create policy "movimientos_fiado_admin_write" on public.movimientos_fiado
  for all
  using ((is_admin() and caja_en_mi_negocio(caja_id)) or (is_staff() and caja_id = mi_caja_id()))
  with check ((is_admin() and caja_en_mi_negocio(caja_id)) or (is_staff() and caja_id = mi_caja_id()));

drop policy if exists "movimientos_fiado_select" on public.movimientos_fiado;
create policy "movimientos_fiado_select" on public.movimientos_fiado
  for select
  using (
    (is_admin() and caja_en_mi_negocio(caja_id))
    or (is_staff() and caja_id = mi_caja_id())
    or (exists (select 1 from public.clientes_fiado c where c.id = movimientos_fiado.cliente_id and c.auth_user_id = auth.uid()))
  );

drop policy if exists "historial_staff_all" on public.historial;
create policy "historial_staff_all" on public.historial
  for all
  using ((is_admin() and caja_en_mi_negocio(caja_id)) or (is_staff() and caja_id = mi_caja_id()))
  with check ((is_admin() and caja_en_mi_negocio(caja_id)) or (is_staff() and caja_id = mi_caja_id()));

-- =========================================================================
-- PARTE B: profiles — is_admin() veía TODOS los perfiles de TODOS los
-- negocios. El rol 'cliente' queda afuera de la condición de negocio a
-- propósito (negocio_id es NULL para clientes, identidad compartida)
-- para no romper el panel "Usuarios > Clientes" que sí necesita verlos.
-- =========================================================================

drop policy if exists "profiles_admin_select_all" on public.profiles;
create policy "profiles_admin_select_all" on public.profiles
  for select
  using (is_admin() and (role = 'cliente' or negocio_id = mi_negocio_id()));

-- =========================================================================
-- PARTE B: pedidos/pedido_items/pedido_mensajes/pagos_pendientes — el
-- bypass de is_admin() no miraba a qué sucursal/negocio pertenecía el
-- pedido/cliente.
-- =========================================================================

drop policy if exists "pedidos_select" on public.pedidos;
create policy "pedidos_select" on public.pedidos
  for select
  using (
    (cliente_id = auth.uid())
    or (is_admin() and sucursal_en_mi_negocio(sucursal_id))
    or (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'cajero' and p.sucursal_id = pedidos.sucursal_id))
  );

drop policy if exists "pedidos_update" on public.pedidos;
create policy "pedidos_update" on public.pedidos
  for update
  using (
    (cliente_id = auth.uid())
    or (is_admin() and sucursal_en_mi_negocio(sucursal_id))
    or (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'cajero' and p.sucursal_id = pedidos.sucursal_id))
  );

drop policy if exists "pedidos_delete" on public.pedidos;
create policy "pedidos_delete" on public.pedidos
  for delete
  using (
    (estado = any (array['cancelado'::text, 'confirmado'::text]))
    and (
      (cliente_id = auth.uid())
      or (is_admin() and sucursal_en_mi_negocio(sucursal_id))
      or (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'cajero' and p.sucursal_id = pedidos.sucursal_id))
    )
  );

drop policy if exists "pedido_items_select" on public.pedido_items;
create policy "pedido_items_select" on public.pedido_items
  for select
  using (
    exists (
      select 1 from public.pedidos ped
      where ped.id = pedido_items.pedido_id
        and (
          (ped.cliente_id = auth.uid())
          or (is_admin() and sucursal_en_mi_negocio(ped.sucursal_id))
          or (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'cajero' and p.sucursal_id = ped.sucursal_id))
        )
    )
  );

drop policy if exists "pedido_mensajes_select" on public.pedido_mensajes;
create policy "pedido_mensajes_select" on public.pedido_mensajes
  for select
  using (
    exists (
      select 1 from public.pedidos ped
      where ped.id = pedido_mensajes.pedido_id
        and (
          (ped.cliente_id = auth.uid())
          or (is_admin() and sucursal_en_mi_negocio(ped.sucursal_id))
          or (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'cajero' and p.sucursal_id = ped.sucursal_id))
        )
    )
  );

drop policy if exists "pedido_mensajes_insert" on public.pedido_mensajes;
create policy "pedido_mensajes_insert" on public.pedido_mensajes
  for insert
  with check (
    exists (
      select 1 from public.pedidos ped
      where ped.id = pedido_mensajes.pedido_id
        and (
          (ped.cliente_id = auth.uid())
          or (is_admin() and sucursal_en_mi_negocio(ped.sucursal_id))
          or (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'cajero' and p.sucursal_id = ped.sucursal_id))
        )
    )
  );

drop policy if exists "pagos_pendientes_admin_select" on public.pagos_pendientes;
create policy "pagos_pendientes_admin_select" on public.pagos_pendientes
  for select
  using (is_admin() and exists (select 1 from public.clientes_fiado c where c.id = pagos_pendientes.cliente_id and c.negocio_id = mi_negocio_id()));

drop policy if exists "pagos_pendientes_admin_update" on public.pagos_pendientes;
create policy "pagos_pendientes_admin_update" on public.pagos_pendientes
  for update
  using (is_admin() and exists (select 1 from public.clientes_fiado c where c.id = pagos_pendientes.cliente_id and c.negocio_id = mi_negocio_id()))
  with check (is_admin() and exists (select 1 from public.clientes_fiado c where c.id = pagos_pendientes.cliente_id and c.negocio_id = mi_negocio_id()));
