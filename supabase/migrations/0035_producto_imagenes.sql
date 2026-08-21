-- Módulo de Imágenes: cada producto (simple, variante o combo) puede
-- tener una foto propia, mostrada en su tarjeta del catálogo (Admin,
-- Cajero y vista pública). Solo el Admin puede subirla/reemplazarla —
-- ver ProductImageManagerModal en App.jsx.

alter table public.productos
  add column if not exists imagen_url text;

insert into storage.buckets (id, name, public)
values ('productos-imagenes', 'productos-imagenes', true)
on conflict (id) do nothing;

-- 1) INSERT/UPDATE/DELETE: solo el admin autenticado gestiona fotos de
-- productos (mismo criterio que 'comprobantes-fotos' en 0011, pero acá
-- además se permite reemplazar/borrar porque una foto de producto SÍ
-- se corrige con el tiempo, a diferencia de un comprobante de venta).
drop policy if exists "productos_imagenes_admin_insert" on storage.objects;
create policy "productos_imagenes_admin_insert" on storage.objects
  for insert
  with check (bucket_id = 'productos-imagenes' and public.is_admin());

drop policy if exists "productos_imagenes_admin_update" on storage.objects;
create policy "productos_imagenes_admin_update" on storage.objects
  for update
  using (bucket_id = 'productos-imagenes' and public.is_admin())
  with check (bucket_id = 'productos-imagenes' and public.is_admin());

drop policy if exists "productos_imagenes_admin_delete" on storage.objects;
create policy "productos_imagenes_admin_delete" on storage.objects
  for delete
  using (bucket_id = 'productos-imagenes' and public.is_admin());

-- 2) SELECT (leer): público — el bucket es público y se comparte la
-- URL directamente en las tarjetas del catálogo (Admin, Cajero y "/").
drop policy if exists "productos_imagenes_public_select" on storage.objects;
create policy "productos_imagenes_public_select" on storage.objects
  for select
  using (bucket_id = 'productos-imagenes');
