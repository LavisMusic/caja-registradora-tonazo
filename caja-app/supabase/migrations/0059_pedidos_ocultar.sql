-- =========================================================================
-- Historiales de pedidos INDEPENDIENTES cliente ↔ caja.
--
-- Hasta ahora "eliminar del historial" hacía un DELETE de la fila → se
-- borraba para los dos lados. Ahora cada lado tiene su propio flag de
-- "oculto": el cliente oculta de SU historial, la caja del SUYO, sin
-- afectar al otro. La fila sigue viva mientras alguno la quiera ver.
--
-- La política `pedidos_update` (migración 0054) ya permite que el
-- cliente actualice sus propias filas y el cajero/admin las de su
-- sucursal, así que no hace falta política nueva.
-- Idempotente.
-- =========================================================================

alter table public.pedidos
  add column if not exists oculto_cliente boolean not null default false,
  add column if not exists oculto_caja    boolean not null default false;
