-- Fix: catálogo (categorias/productos) dejó de cargar en /admin apenas
-- el admin inició sesión real con Supabase Auth.
--
-- Causa: supabase-js adjunta el JWT de la sesión a TODAS las consultas
-- una vez que hay un usuario logueado, así que PostgREST pasa de
-- evaluar las políticas RLS con el rol "anon" a evaluarlas con el rol
-- "authenticated". Si la política de SELECT de 'categorias'/'productos'
-- solo estaba otorgada a "anon" (típico cuando se creó con el botón
-- "Enable read access" del Table Editor sin revisar el "TO"), las
-- lecturas se cortan en seco apenas alguien se loguea — el catálogo
-- público (sin sesión) nunca lo notó porque siempre corrió como anon.
--
-- Esto NO tiene que ver con las políticas de fiado que agregamos en
-- 0001 (esas tablas son otras). Es un problema previo, ya latente,
-- que recién se hizo visible con el primer login real de la app.

alter table public.categorias enable row level security;
alter table public.productos enable row level security;
alter table public.stock enable row level security;

-- Política amplia de lectura (sin "to", aplica a TODOS los roles:
-- anon, authenticated, etc.) — el catálogo es información pública.
-- Si ya existía una política de SELECT más angosta, esta la
-- complementa (las políticas permisivas de Postgres se combinan con
-- OR), no hace falta borrarla.
drop policy if exists "categorias_public_read" on public.categorias;
create policy "categorias_public_read" on public.categorias
  for select using (true);

drop policy if exists "productos_public_read" on public.productos;
create policy "productos_public_read" on public.productos
  for select using (true);

drop policy if exists "stock_public_read" on public.stock;
create policy "stock_public_read" on public.stock
  for select using (true);

-- 'stock' además se ESCRIBE desde /admin (checkout descuenta stock,
-- "Editar Stock" suma unidades) — ambas acciones ahora corren con la
-- sesión real del admin, así que necesitan su propia política de
-- escritura (usa is_admin(), creada en 0001).
drop policy if exists "stock_admin_write" on public.stock;
create policy "stock_admin_write" on public.stock
  for insert with check (public.is_admin());

drop policy if exists "stock_admin_update" on public.stock;
create policy "stock_admin_update" on public.stock
  for update using (public.is_admin()) with check (public.is_admin());
