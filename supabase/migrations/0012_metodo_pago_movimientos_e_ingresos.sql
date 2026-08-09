-- 1) movimientos_fiado necesita saber CON QUÉ MÉTODO se cobró cada
--    pago para poder separar efectivo físico de dinero digital en el
--    arqueo de caja. Sin esto, un cobro de fiado es indistinguible de
--    otro sin importar si el cliente pagó en billetes o por Yape.
alter table public.movimientos_fiado
  add column if not exists metodo_pago text
  check (metodo_pago is null or metodo_pago in ('EFECTIVO', 'DIGITAL'));

-- 2) cierres_caja: persistir el desglose para que el historial y el
--    CSV puedan mostrar Efectivo vs Digital de cierres pasados (los
--    cierres guardados antes de esta migración quedan con estas dos
--    columnas en null — no se puede reconstruir el dato retroactivo).
alter table public.cierres_caja
  add column if not exists ingreso_efectivo numeric(10,2),
  add column if not exists ingreso_digital numeric(10,2);
