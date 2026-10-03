-- 1) "Mis ventas" de las cajas: ANULAR ya no borra la venta de
--    'historial', la MARCA como anulada (repone el stock y revierte el
--    fiado/comprobante igual que antes). Así queda visible con el filtro
--    Todas / Registradas / Anuladas. Las anuladas NO cuentan en
--    recaudado, cierres, estadísticas ni top clientes (la app las separa
--    al cargar).
-- 2) La tarea que deja "Sin plan" a los negocios suspendidos por
--    vencimiento corre CADA MINUTO (antes cada 15). La suspensión en sí
--    ya era inmediata: el estado se calcula con la fecha.
-- Idempotente. Correr en el SQL Editor de Caja Tonazo.

alter table public.historial add column if not exists anulado boolean not null default false;
alter table public.historial add column if not exists anulado_at timestamptz;
alter table public.historial add column if not exists anulado_por text;
create index if not exists historial_anulado_idx on public.historial (anulado) where anulado;

select cron.unschedule('negocios-suspendidos-sin-plan')
where exists (select 1 from cron.job where jobname = 'negocios-suspendidos-sin-plan');
select cron.schedule('negocios-suspendidos-sin-plan', '* * * * *', $$select public.fn_quitar_plan_a_suspendidos()$$);

notify pgrst, 'reload schema';
