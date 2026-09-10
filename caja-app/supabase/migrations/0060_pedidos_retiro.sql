-- =========================================================================
-- Retiro en tienda: el cliente adjunta un comprobante de pago (Yape/Plin/
-- Otros — nunca efectivo) al hacer el pedido. El admin/cajero lo verifica
-- y acepta o rechaza la petición antes de separar los productos.
-- La imagen va al bucket `comprobantes-fotos` (público); acá solo se
-- guarda su URL.
-- Idempotente.
-- =========================================================================

alter table public.pedidos
  add column if not exists comprobante_url text;
