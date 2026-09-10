-- Delivery Fase 5 — plata + no-show
-- ==================================
-- El webhook 'taxi.entrega_estado' ahora también llega con estado
-- 'en_ruta' (el repartidor recogió y pagó en el mostrador). Guardamos
-- ese estado en el pedido para que el Gestor le muestre al cajero el
-- botón "Confirmar recojo y cobro" (registra la venta del día), y para
-- distinguir un cierre normal ('entregado') de una devolución
-- ('no_entregado') que hay que revertir. Ver DELIVERY.md §5.

alter table public.pedidos
  add column if not exists entrega_estado text;

-- Marca de que la venta del día de este pedido ya fue revertida por una
-- devolución (no-show) — evita que el Gestor la revierta dos veces.
alter table public.pedidos
  add column if not exists venta_revertida boolean not null default false;
