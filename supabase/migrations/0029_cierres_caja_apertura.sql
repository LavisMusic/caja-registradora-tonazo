-- El nuevo export "Historial de Cierres" pide fechas de apertura Y
-- cierre + fondo inicial "con el mayor detalle posible". 'cierres_caja'
-- ya guardaba 'turno_inicio' (el corte usado para las estadísticas de
-- "hoy"), pero no el fondo inicial contado por el admin al abrir caja
-- (eso vive en 'estado_caja', que es solo el estado ACTUAL, sin
-- historial). Estas columnas son la fotografía de esos datos al
-- momento exacto de cerrar, tomada desde estado_caja en ejecutarCierre.
alter table public.cierres_caja
  add column if not exists fondo_inicial numeric,
  add column if not exists abierta_en bigint;
