-- =========================================================================
-- Delivery — puente (Fase 3). Proyecto: Caja Tonazo (xaerfywydzwifohjsvwa).
-- Ver DELIVERY.md §2 / §8 en el repo de taxi-pe-app.
--
--   0) Baja del emisor 3.2 (`caja.pedido_delivery`): el delivery dejó de
--      ser un webhook fire-and-forget → ahora es una sesión en vivo cuyo
--      handshake es la Edge Function `entrega-iniciar`. Las COLUMNAS de
--      `pedidos` (requiere_delivery, dirección, coords, contacto) se
--      MANTIENEN — las sigue usando el flujo nuevo.
--   1) Columnas en `pedidos` para enlazar el pedido con su entrega en
--      Taxi-PE (id + session_token + pin que devuelve `entrega-iniciar`).
--
-- Idempotente.
-- =========================================================================

-- 0) Emisor 3.2 fuera.
drop trigger  if exists trg_emitir_pedido_delivery on public.pedidos;
drop function if exists public.fn_emitir_pedido_delivery();
drop function if exists public.fn_emitir_pedido_delivery_por_id(uuid);

-- 1) Enlace pedido ↔ entrega (Taxi-PE). Los llena el frontend con lo que
--    devuelve la Edge Function `entrega-iniciar`.
alter table public.pedidos
  add column if not exists entrega_id            text,
  add column if not exists entrega_session_token text,
  add column if not exists entrega_pin           text;

create index if not exists pedidos_entrega_id_idx
  on public.pedidos (entrega_id) where entrega_id is not null;
