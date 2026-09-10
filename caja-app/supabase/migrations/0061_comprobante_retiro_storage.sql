-- =========================================================================
-- El cliente (usuario logueado, rol 'cliente') sube su comprobante de
-- pago de RETIRO EN TIENDA al bucket público `comprobantes-fotos`, pero
-- SOLO bajo su propia carpeta: retiro/<auth.uid()>/archivo.jpg
--
-- Las políticas existentes de ese bucket (comprobantes_fotos_*_insert)
-- exigen is_staff() → por eso el cliente choca con la RLS. Esta política
-- lo habilita, acotado a su carpeta.
--
-- La lectura ya está cubierta por "Lectura publica comprobantes-fotos".
-- Idempotente.
-- =========================================================================

drop policy if exists "comprobantes_fotos_cliente_retiro_insert" on storage.objects;
create policy "comprobantes_fotos_cliente_retiro_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'comprobantes-fotos'
    and (storage.foldername(name))[1] = 'retiro'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
