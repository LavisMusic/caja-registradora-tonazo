-- El rol 'cajero' necesita acceso operativo a las mismas tablas que ya
-- usaba el admin (ventas, stock, gastos, fiados) pero NO a lo
-- exclusivamente administrativo (aprobar pagos_pendientes, ocultar
-- productos del catálogo). is_admin() se queda tal cual (solo admin);
-- is_staff() es la versión ampliada (admin O cajero) para todo lo
-- operativo.

create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'cajero')
  );
$$;

-- ---------------------------------------------------------------------
-- stock: leer es público (ya lo era); escribir (checkout + Editar
-- Stock) ahora es de cualquier staff, no solo admin.
-- ---------------------------------------------------------------------
drop policy if exists "stock_admin_write" on public.stock;
create policy "stock_admin_write" on public.stock
  for insert with check (public.is_staff());

drop policy if exists "stock_admin_update" on public.stock;
create policy "stock_admin_update" on public.stock
  for update using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------
-- gastos / gasto_items / proveedores: "Registrar Gasto" es una función
-- explícita del cajero.
-- ---------------------------------------------------------------------
drop policy if exists "gastos_admin_all" on public.gastos;
create policy "gastos_admin_all" on public.gastos
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "gasto_items_admin_all" on public.gasto_items;
create policy "gasto_items_admin_all" on public.gasto_items
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "proveedores_admin_all" on public.proveedores;
create policy "proveedores_admin_all" on public.proveedores
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------
-- cierres_caja: el cajero cierra su propio turno. La UI (App.jsx) es
-- la que le oculta la Ganancia Neta al renderizar — a nivel de datos,
-- cualquier staff puede leer/crear cierres, igual que ya pasa con el
-- resto de tablas operativas de este sistema.
-- ---------------------------------------------------------------------
drop policy if exists "cierres_caja_admin_all" on public.cierres_caja;
create policy "cierres_caja_admin_all" on public.cierres_caja
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------
-- comprobantes (tabla) + bucket comprobantes-fotos: el cajero escanea
-- comprobantes Yape/Plin igual que el admin durante el checkout.
-- ---------------------------------------------------------------------
drop policy if exists "comprobantes_tabla_admin_all" on public.comprobantes;
create policy "comprobantes_tabla_admin_all" on public.comprobantes
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "comprobantes_fotos_admin_insert" on storage.objects;
create policy "comprobantes_fotos_admin_insert" on storage.objects
  for insert
  with check (bucket_id = 'comprobantes-fotos' and public.is_staff());

-- ---------------------------------------------------------------------
-- clientes_fiado / fiado_items / movimientos_fiado: "Fiados" (anotar
-- deuda nueva y cobrar deuda vieja) es una función explícita del
-- cajero.
-- ---------------------------------------------------------------------
drop policy if exists "clientes_fiado_select" on public.clientes_fiado;
create policy "clientes_fiado_select" on public.clientes_fiado
  for select using (public.is_staff() or auth_user_id = auth.uid());

drop policy if exists "clientes_fiado_admin_write" on public.clientes_fiado;
create policy "clientes_fiado_admin_write" on public.clientes_fiado
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "fiado_items_select" on public.fiado_items;
create policy "fiado_items_select" on public.fiado_items
  for select using (
    public.is_staff() or exists (
      select 1 from public.clientes_fiado c
      where c.id = fiado_items.cliente_id and c.auth_user_id = auth.uid()
    )
  );

drop policy if exists "fiado_items_admin_write" on public.fiado_items;
create policy "fiado_items_admin_write" on public.fiado_items
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "movimientos_fiado_select" on public.movimientos_fiado;
create policy "movimientos_fiado_select" on public.movimientos_fiado
  for select using (
    public.is_staff() or exists (
      select 1 from public.clientes_fiado c
      where c.id = movimientos_fiado.cliente_id and c.auth_user_id = auth.uid()
    )
  );

drop policy if exists "movimientos_fiado_admin_write" on public.movimientos_fiado;
create policy "movimientos_fiado_admin_write" on public.movimientos_fiado
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------
-- historial (ventas): necesario para que el cajero venda y para la
-- nueva función "Anular Venta" (borra sus propias filas del turno).
-- Se habilita RLS por primera vez acá — antes nunca se había tocado,
-- así que de paso queda protegida en vez de abierta a cualquiera con
-- la key anon.
-- ---------------------------------------------------------------------
alter table public.historial enable row level security;

drop policy if exists "historial_staff_all" on public.historial;
create policy "historial_staff_all" on public.historial
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------
-- profiles: el admin necesita poder LISTAR los cajeros existentes
-- (nombre + rol) para gestionarlos — antes cada quien solo podía leer
-- su propia fila.
-- ---------------------------------------------------------------------
drop policy if exists "profiles_admin_select_all" on public.profiles;
create policy "profiles_admin_select_all" on public.profiles
  for select using (public.is_admin());

-- pagos_pendientes y productos.visible_publico NO se tocan: aprobar
-- comprobantes de clientes y decidir qué se muestra en el catálogo
-- público siguen siendo exclusivos del admin.
