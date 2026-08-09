-- Fix: "new row violates row-level security policy" al escanear/subir
-- un comprobante de pago desde el checkout (Yape/Plin/Otros).
--
-- El bucket que usa el código de React es 'comprobantes-fotos'
-- (ver uploadReceiptImage en caja-app/src/App.jsx, que llama a
-- supabase.storage.from("comprobantes-fotos")). Es DISTINTO del bucket
-- 'comprobantes' que ya tiene políticas (ese es el de los comprobantes
-- que suben los CLIENTES para pagar fiado, desde EnviarComprobanteModal
-- — bucket privado). Este otro es el que usa el ADMIN al registrar una
-- venta, y siempre fue pensado como público (el código usa
-- getPublicUrl(), no signed URLs).
--
-- Misma causa que los bugs anteriores: el bucket ya existía con una
-- política de INSERT vieja pensada para "anon" (antes de que /admin
-- tuviera login real); ahora que el admin usa una sesión real, esa
-- política nunca cubrió "authenticated" y el INSERT queda bloqueado.

insert into storage.buckets (id, name, public)
values ('comprobantes-fotos', 'comprobantes-fotos', true)
on conflict (id) do nothing;

-- 1) INSERT (subir): solo el admin autenticado sube fotos de comprobantes.
drop policy if exists "comprobantes_fotos_admin_insert" on storage.objects;
create policy "comprobantes_fotos_admin_insert" on storage.objects
  for insert
  with check (bucket_id = 'comprobantes-fotos' and public.is_admin());

-- 2) SELECT (leer): público, porque el bucket es público y el código
-- comparte esa URL directamente (ej. en el resumen de venta / WhatsApp).
drop policy if exists "comprobantes_fotos_public_select" on storage.objects;
create policy "comprobantes_fotos_public_select" on storage.objects
  for select
  using (bucket_id = 'comprobantes-fotos');
