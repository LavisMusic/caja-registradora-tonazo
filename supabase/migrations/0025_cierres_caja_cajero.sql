-- El reporte "Historial de Boletas y Cierres" (Excel) necesita saber
-- quién cerró cada turno — dato que nunca se guardó hasta ahora.
-- Cierres viejos van a quedar con este campo en NULL (no hay forma de
-- reconstruirlo retroactivamente); a partir de esta migración,
-- ejecutarCierre() lo completa con el nombre de quien está logueado.
alter table public.cierres_caja
  add column if not exists cajero_nombre text;
