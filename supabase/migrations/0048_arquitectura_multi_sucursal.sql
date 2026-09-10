-- =====================================================================
-- Arquitectura Multi-Sucursal — PARTE 1 (fundamento de datos)
-- =====================================================================
-- Jerarquía estricta: localidades -> sucursales -> cajas.
--
-- IMPORTANTE — alcance real de esta migración: esto crea y puebla la
-- estructura nueva, y la CONECTA a 'profiles' (para que el cajero real
-- ya quede asignado) y dos columnas nuevas en 'historial'/'cierres_caja'
-- (para poder empezar a taguear ventas/cierres por caja). Lo que
-- NO hace todavía (a propósito, ver la respuesta larga fuera de este
-- archivo): reemplazar 'stock'/'estado_caja' como fuente de verdad del
-- frontend, ni filtrar ventas/fiados/comprobantes/dashboard por
-- sucursal — eso es Partes 2-5, una reescritura real de la capa de
-- datos de App.jsx (checkout, Gestor de Productos, Fiados, Cierre de
-- Caja, Realtime) que hay que secuenciar aparte para no romper una caja
-- registradora que ahora mismo procesa ventas reales.

-- ---------------------------------------------------------------------
-- 1) JERARQUÍA: localidades -> sucursales -> cajas
-- ---------------------------------------------------------------------
create table if not exists public.localidades (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.sucursales (
  id uuid primary key default gen_random_uuid(),
  localidad_id uuid not null references public.localidades(id) on delete restrict,
  nombre text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (localidad_id, nombre)
);

-- 'estado'/'monto_inicial'/'abierta_por'/'abierta_en'/'cerrada_en'
-- amplían lo pedido ("id, sucursal_id, nombre, estado, monto_inicial")
-- con el resto de campos que ya tiene 'estado_caja' hoy — el Gestor de
-- Cajas (Parte 3) necesita "quién y cuándo abrió" para mostrarlo, igual
-- que ya lo muestra la pantalla de apertura actual.
create table if not exists public.cajas (
  id uuid primary key default gen_random_uuid(),
  sucursal_id uuid not null references public.sucursales(id) on delete restrict,
  nombre text not null,
  estado text not null default 'cerrada' check (estado in ('abierta', 'cerrada')),
  monto_inicial numeric not null default 0,
  abierta_por text,
  abierta_en bigint,
  cerrada_en bigint,
  created_at timestamptz not null default now(),
  unique (sucursal_id, nombre)
);

-- Semilla: San Ramón -> {Santa Rosa 6.50, Paucartambo} -> Caja 1 c/u.
-- 'on conflict do nothing' hace esto seguro de correr más de una vez.
insert into public.localidades (nombre) values ('San Ramón')
on conflict (nombre) do nothing;

insert into public.sucursales (localidad_id, nombre)
select l.id, s.nombre
from public.localidades l
cross join (values ('Santa Rosa 6.50'), ('Paucartambo')) as s(nombre)
where l.nombre = 'San Ramón'
on conflict (localidad_id, nombre) do nothing;

insert into public.cajas (sucursal_id, nombre)
select s.id, 'Caja 1'
from public.sucursales s
where s.nombre in ('Santa Rosa 6.50', 'Paucartambo')
on conflict (sucursal_id, nombre) do nothing;

-- ---------------------------------------------------------------------
-- 2) AISLAMIENTO DE STOCK: inventario_sucursales
-- ---------------------------------------------------------------------
-- Se pidió (producto_id, sucursal_id, stock) explícitamente — OJO con
-- una diferencia real de arquitectura: hoy el stock NO vive en
-- 'productos' ni está indexado por producto_id. Vive en la tabla
-- 'stock', indexada por una CLAVE de texto ('stock.nombre') que un
-- producto simple consume 1:1, pero un COMBO consume de VARIAS a la
-- vez (ver 'productos.consumos', un jsonb [{key, qty}]) — un combo
-- nunca tuvo (ni debía tener) su propia fila de stock independiente,
-- su disponibilidad siempre se calculó sumando la de sus ingredientes.
--
-- Esta tabla mantiene esa misma regla: es por PRODUCTO (no por combo),
-- y la migración de abajo solo copia productos con exactamente UNA
-- clave de consumo (el mismo criterio que ya usa "Agregar Unidades al
-- Stock"/el Gestor de Productos para decidir qué es editable
-- directamente) — un combo sigue derivándose de sus ingredientes, ahora
-- por sucursal, el día que el frontend se actualice para leer de acá.
create table if not exists public.inventario_sucursales (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos(id) on delete cascade,
  sucursal_id uuid not null references public.sucursales(id) on delete cascade,
  stock numeric not null default 0,
  -- Mismos dos campos de costo que ya tiene 'stock' hoy, para no perder
  -- el modelo "Costo de Reposición/Último Costo" al aislar por sucursal.
  precio_costo numeric,
  ultimo_costo_compra numeric,
  updated_at timestamptz not null default now(),
  unique (producto_id, sucursal_id)
);

-- Migración de datos: por cada producto NO-combo con exactamente una
-- clave de consumo, duplica su stock/costo ACTUAL hacia las dos
-- sucursales de San Ramón — mismos productos y cantidades, pero de
-- ahora en más independientes entre sí (mover uno no mueve el otro).
do $$
declare
  r record;
  v_sucursal record;
  v_key text;
  v_qty numeric;
  v_consumos jsonb;
  v_stock_row record;
begin
  for r in select id, consumos, es_combo from public.productos where activo = true
  loop
    if r.es_combo then
      continue; -- un combo no tiene stock propio, ver comentario arriba
    end if;

    v_consumos := coalesce(r.consumos, '[]'::jsonb);
    if jsonb_typeof(v_consumos) <> 'array' or jsonb_array_length(v_consumos) <> 1 then
      continue; -- 0 o 2+ claves: mismo caso "no editable directo" de siempre
    end if;

    v_key := v_consumos->0->>'key';
    v_qty := coalesce((v_consumos->0->>'qty')::numeric, 1);
    if v_key is null then
      continue;
    end if;

    select cantidad, precio_costo, ultimo_costo_compra
      into v_stock_row
      from public.stock
      where nombre = v_key;
    if not found then
      continue; -- clave sin fila propia en 'stock' todavía (caso ya conocido)
    end if;

    for v_sucursal in
      select id from public.sucursales where nombre in ('Santa Rosa 6.50', 'Paucartambo')
    loop
      insert into public.inventario_sucursales
        (producto_id, sucursal_id, stock, precio_costo, ultimo_costo_compra)
      values (
        r.id,
        v_sucursal.id,
        coalesce(v_stock_row.cantidad, 0) / v_qty,
        v_stock_row.precio_costo,
        v_stock_row.ultimo_costo_compra
      )
      on conflict (producto_id, sucursal_id) do update
        set stock = excluded.stock,
            precio_costo = excluded.precio_costo,
            ultimo_costo_compra = excluded.ultimo_costo_compra,
            updated_at = now();
    end loop;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 3) USUARIOS/SESIONES/VENTAS: conectar cajeros y taguear registros
-- ---------------------------------------------------------------------
-- 'profiles' es la tabla real de usuarios (admin/cajero/cliente) — no
-- existe una tabla separada "de cajeros".
alter table public.profiles
  add column if not exists sucursal_id uuid references public.sucursales(id),
  add column if not exists caja_id uuid references public.cajas(id);

-- Asigna al ÚNICO cajero real a San Ramón -> Santa Rosa 6.50 -> Caja 1.
-- Asume (como se confirmó) que hoy existe exactamente un profile con
-- role='cajero' — si en el futuro hay más de uno, esta migración ya
-- habrá corrido una sola vez y no se vuelve a ejecutar, así que no hace
-- falta un guard adicional acá.
update public.profiles
set
  sucursal_id = (select id from public.sucursales where nombre = 'Santa Rosa 6.50'),
  caja_id = (
    select c.id from public.cajas c
    join public.sucursales s on s.id = c.sucursal_id
    where s.nombre = 'Santa Rosa 6.50' and c.nombre = 'Caja 1'
  )
where role = 'cajero';

-- 'caja_sesiones' (como lo nombró el pedido) es, en este código,
-- 'cierres_caja' — y "ventas" es 'historial'. Nullable a propósito:
-- las filas YA EXISTENTES no tienen forma de saber retroactivamente de
-- qué sucursal/caja vinieron (el sistema era de una sola ubicación
-- hasta ahora), así que quedan sin taguear en vez de asignarles algo
-- inventado.
alter table public.cierres_caja
  add column if not exists caja_id uuid references public.cajas(id),
  add column if not exists sucursal_id uuid references public.sucursales(id);

alter table public.historial
  add column if not exists caja_id uuid references public.cajas(id),
  add column if not exists sucursal_id uuid references public.sucursales(id);

-- ---------------------------------------------------------------------
-- 4) RLS — mismo patrón is_admin()/is_staff() que el resto del sistema
-- ---------------------------------------------------------------------
alter table public.localidades enable row level security;
alter table public.sucursales enable row level security;
alter table public.cajas enable row level security;
alter table public.inventario_sucursales enable row level security;

-- Lectura: cualquier staff (admin o cajero) necesita ver la jerarquía
-- completa para los selects en cascada del formulario de cajeros y
-- para el Gestor de Cajas.
drop policy if exists "localidades_staff_select" on public.localidades;
create policy "localidades_staff_select" on public.localidades
  for select using (public.is_staff());

drop policy if exists "sucursales_staff_select" on public.sucursales;
create policy "sucursales_staff_select" on public.sucursales
  for select using (public.is_staff());

drop policy if exists "cajas_staff_select" on public.cajas;
create policy "cajas_staff_select" on public.cajas
  for select using (public.is_staff());

drop policy if exists "inventario_sucursales_staff_select" on public.inventario_sucursales;
create policy "inventario_sucursales_staff_select" on public.inventario_sucursales
  for select using (public.is_staff());

-- Escritura de la JERARQUÍA (crear/editar localidades y sucursales):
-- exclusivo de admin, es decisión de negocio, no operativa del día a
-- día.
drop policy if exists "localidades_admin_write" on public.localidades;
create policy "localidades_admin_write" on public.localidades
  for insert with check (public.is_admin());
drop policy if exists "localidades_admin_update" on public.localidades;
create policy "localidades_admin_update" on public.localidades
  for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "localidades_admin_delete" on public.localidades;
create policy "localidades_admin_delete" on public.localidades
  for delete using (public.is_admin());

drop policy if exists "sucursales_admin_write" on public.sucursales;
create policy "sucursales_admin_write" on public.sucursales
  for insert with check (public.is_admin());
drop policy if exists "sucursales_admin_update" on public.sucursales;
create policy "sucursales_admin_update" on public.sucursales
  for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "sucursales_admin_delete" on public.sucursales;
create policy "sucursales_admin_delete" on public.sucursales
  for delete using (public.is_admin());

-- Escritura de CAJAS: abrir/cerrar es operativo (cualquier staff —
-- mismo criterio que 'estado_caja' hoy), pero crear/borrar una caja
-- nueva es decisión de admin.
drop policy if exists "cajas_admin_insert" on public.cajas;
create policy "cajas_admin_insert" on public.cajas
  for insert with check (public.is_admin());
drop policy if exists "cajas_staff_update" on public.cajas;
create policy "cajas_staff_update" on public.cajas
  for update using (public.is_staff()) with check (public.is_staff());
drop policy if exists "cajas_admin_delete" on public.cajas;
create policy "cajas_admin_delete" on public.cajas
  for delete using (public.is_admin());

-- inventario_sucursales: cualquier staff descuenta/ajusta stock al
-- vender o al editar desde el Gestor de Productos — mismo criterio que
-- ya rige 'stock' hoy (stock_admin_write/stock_admin_update, migración
-- 0017, ambas ya usan is_staff() pese al nombre).
drop policy if exists "inventario_sucursales_staff_write" on public.inventario_sucursales;
create policy "inventario_sucursales_staff_write" on public.inventario_sucursales
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------
-- 5) Realtime — mismo gotcha ya resuelto en 0045/0046/0047: el Gestor
-- de Cajas (Parte 3) necesita enterarse en vivo si un cajero cierra su
-- caja desde otra pestaña, y eso requiere que 'cajas' esté en la
-- publicación, no solo que el proyecto tenga Realtime "activado".
-- ---------------------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table public.cajas;
  exception when duplicate_object then
    null;
  end;
  begin
    alter publication supabase_realtime add table public.inventario_sucursales;
  exception when duplicate_object then
    null;
  end;
end $$;
