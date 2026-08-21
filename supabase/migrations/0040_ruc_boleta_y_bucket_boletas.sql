-- Boleta con RUC (checkout) + bucket para compartir la boleta por
-- WhatsApp con un link directo al chat del cliente.

-- 1) RUC del cliente en la venta — mismo criterio que 'vendedor'/
-- 'metodo_pago' ya existentes en 'historial': se duplica en cada
-- línea del mismo purchase_id (no hay una fila de "cabecera" propia
-- por venta). Nullable: la gran mayoría de las ventas no lo usan.
alter table public.historial
  add column if not exists ruc text;

-- 2) Bucket 'boletas-imagenes': la imagen renderizada de la boleta
-- (TicketBoleta + html2canvas) se sube acá ANTES de compartirla, para
-- poder abrir el chat de WhatsApp de un número específico
-- (wa.me/{numero}?text=...) con el link de la imagen en el texto —
-- wa.me no admite adjuntar un archivo directo, solo texto. Público
-- (igual que 'productos-imagenes'/'comprobantes-fotos'): el
-- destinatario tiene que poder ver la imagen sin sesión.
insert into storage.buckets (id, name, public)
values ('boletas-imagenes', 'boletas-imagenes', true)
on conflict (id) do nothing;

-- INSERT: admin o cajero (cualquiera que procese una venta puede
-- enviar su boleta) — mismo criterio que 'comprobantes-fotos'
-- (is_staff(), no is_admin(), porque el cajero también cobra).
drop policy if exists "boletas_imagenes_staff_insert" on storage.objects;
create policy "boletas_imagenes_staff_insert" on storage.objects
  for insert
  with check (bucket_id = 'boletas-imagenes' and public.is_staff());

-- SELECT: público — el cliente (y WhatsApp, para la vista previa del
-- link) tienen que poder abrir la imagen sin estar logueados.
drop policy if exists "boletas_imagenes_public_select" on storage.objects;
create policy "boletas_imagenes_public_select" on storage.objects
  for select
  using (bucket_id = 'boletas-imagenes');
