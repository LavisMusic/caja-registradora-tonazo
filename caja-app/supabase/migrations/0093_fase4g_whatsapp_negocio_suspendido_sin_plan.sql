-- Fase 4 — dos reglas nuevas del gestor de negocios del super admin:
--   1) WhatsApp del negocio: número al que se le mandan el resumen y la
--      boleta de cada pago de plan (Recarga rápida).
--   2) Negocio SUSPENDIDO => queda "Sin plan" (plan_id = null), sea
--      suspendido a mano o por vencimiento (5 días de gracia vencidos).
--      Al renovar (Recarga rápida o petición aprobada) vuelve a quedar
--      con el plan que pagó — registrar_pago_plan ya asigna el plan.
-- Idempotente. Correr en el SQL Editor de Caja Tonazo.

-- 1) WhatsApp del negocio
alter table public.negocios add column if not exists whatsapp text;

-- 2a) Suspensión manual: en el mismo momento en que se suspende, se le
--     quita el plan.
create or replace function public.fn_negocio_suspendido_sin_plan()
returns trigger
language plpgsql
as $$
begin
  if new.plan_suspendido_manual and not coalesce(old.plan_suspendido_manual, false) then
    new.plan_id := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_negocio_suspendido_sin_plan on public.negocios;
create trigger trg_negocio_suspendido_sin_plan
  before update of plan_suspendido_manual on public.negocios
  for each row execute function public.fn_negocio_suspendido_sin_plan();

-- 2b) Suspensión por vencimiento: no hay un "momento" en que se escriba
--     algo (el estado se calcula con la fecha), así que una tarea
--     programada revisa cada 15 minutos y les quita el plan.
create or replace function public.fn_quitar_plan_a_suspendidos()
returns void
language sql
security definer
set search_path = public
as $$
  update public.negocios n
    set plan_id = null
    where n.plan_id is not null
      and public.plan_estado(n) = 'suspendido';
$$;

select public.fn_quitar_plan_a_suspendidos();

select cron.unschedule('negocios-suspendidos-sin-plan')
where exists (select 1 from cron.job where jobname = 'negocios-suspendidos-sin-plan');
select cron.schedule('negocios-suspendidos-sin-plan', '*/15 * * * *', $$select public.fn_quitar_plan_a_suspendidos()$$);

notify pgrst, 'reload schema';
