-- Arqueo de caja: guarda el efectivo físico contado por el admin al
-- cerrar turno y la diferencia contra lo que el sistema esperaba
-- recaudar (positivo = sobrante, negativo = faltante). Nullable porque
-- los cierres ya guardados antes de este cambio no tienen este dato.
alter table public.cierres_caja
  add column if not exists efectivo_real numeric(10,2),
  add column if not exists diferencia numeric(10,2);
