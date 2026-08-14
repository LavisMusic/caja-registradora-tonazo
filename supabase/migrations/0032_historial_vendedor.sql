-- Auditoría: qué usuario (Admin o cajero puntual) procesó cada venta.
-- Se guarda como texto libre en el momento de la venta (igual criterio
-- que costo_unitario/costo_total: una "fotografía", no un FK a
-- profiles) porque un cajero puede ser eliminado después sin que eso
-- deba borrar ni volver anónimo el rastro de auditoría de sus ventas
-- pasadas.
alter table public.historial
  add column if not exists vendedor text;
