-- =========================================================================
-- Caché local del saldo de Taxi-PE (unificación pasajero/cliente): el
-- crédito/membresía real vive en la base de Taxi-PE, esto es solo una
-- COPIA que Taxi-PE empuja por webhook cada vez que cambia — Caja no
-- puede suscribirse por Realtime a un proyecto de Supabase ajeno, así
-- que sin esta copia local el header del cliente nunca podía
-- actualizarse solo (la primera versión solo consultaba una vez al
-- montar la tienda). Con la copia acá, el frontend escucha el UPDATE de
-- 'clientes_fiado' con el Realtime nativo de este mismo proyecto — ya
-- en la publicación desde la migración 0069.
--
-- Ver webhook-taxi-mirror-cuenta (evento 'taxi.saldo_pasajero') y
-- 20260924100000_saldo_pasajero_realtime.sql en taxi-pe-app.
--
-- Idempotente.
-- =========================================================================

alter table public.clientes_fiado
  add column if not exists creditos_disponibles integer not null default 0,
  add column if not exists membresia_vencimiento timestamptz;
