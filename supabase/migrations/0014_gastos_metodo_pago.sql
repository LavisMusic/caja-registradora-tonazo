-- Para el arqueo de caja, un gasto con origen 'CAJA' pero pagado por
-- Yape/transferencia NO debe restarse del efectivo físico esperado —
-- solo afecta la Ganancia Neta. Se necesita saber CÓMO se pagó cada
-- gasto, no solo si salió (o no) de la caja del negocio.
alter table public.gastos
  add column if not exists metodo_pago text
  check (metodo_pago is null or metodo_pago in ('EFECTIVO', 'DIGITAL'));
