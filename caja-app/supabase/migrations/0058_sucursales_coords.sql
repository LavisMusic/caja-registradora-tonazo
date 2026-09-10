-- =========================================================================
-- Coordenadas precisas de cada sucursal (punto A del delivery). El admin
-- las fija desde el Gestor de Cajas; quedan permanentes hasta que se
-- editen. Cada entrega usa estas coords como origen en el mapa.
-- Idempotente.
-- =========================================================================

alter table public.sucursales
  add column if not exists lat numeric,
  add column if not exists lng numeric;
