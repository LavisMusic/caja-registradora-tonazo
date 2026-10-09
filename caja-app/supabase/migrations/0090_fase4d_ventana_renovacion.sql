-- Fase 4 — ventana de renovación: igual que en Taxi-PE (no se vende una
-- membresía nueva mientras la actual sigue vigente), pero con los
-- últimos 3 días antes del vencimiento habilitados para renovar, así el
-- negocio que paga a tiempo nunca sale del directorio.
--   * Aplica a TODOS: a la petición del negocio y al pago que registra
--     el super admin (Recarga rápida / Registrar pago / aprobar).
--   * Sin fecha de vencimiento, o ya vencido (gracia/suspendido): se
--     puede pagar siempre.
-- Idempotente. Correr en el SQL Editor de Caja Tonazo.

create or replace function public.plan_puede_renovar(p_vence timestamptz)
returns boolean
language sql
stable
as $$
  select p_vence is null or now() >= p_vence - interval '3 days';
$$;

-- registrar_pago_plan (de 0088) + la regla de la ventana.
create or replace function public.registrar_pago_plan(
  p_negocio_id uuid,
  p_meses int,
  p_monto numeric,
  p_metodo text default null,
  p_nota text default null,
  p_plan_id uuid default null
)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_anterior timestamptz;
  v_nuevo timestamptz;
  v_plan_id uuid;
begin
  if not public.is_super_admin() then
    raise exception 'Solo el super admin puede registrar pagos.';
  end if;
  if p_meses is null or p_meses < 1 or p_meses > 36 then
    raise exception 'Cantidad de meses inválida.';
  end if;

  select plan_vence_at, plan_id into v_anterior, v_plan_id
    from public.negocios where id = p_negocio_id for update;
  if not found then
    raise exception 'Negocio no encontrado.';
  end if;

  if not public.plan_puede_renovar(v_anterior) then
    raise exception 'Este negocio tiene su plan vigente hasta el %: solo se puede renovar en los últimos 3 días antes de que venza (desde el %).',
      to_char(v_anterior at time zone 'America/Lima', 'DD/MM/YYYY'),
      to_char((v_anterior - interval '3 days') at time zone 'America/Lima', 'DD/MM/YYYY')
      using errcode = 'P0001', hint = 'PLAN_VIGENTE';
  end if;

  v_plan_id := coalesce(p_plan_id, v_plan_id);
  v_nuevo := greatest(coalesce(v_anterior, now()), now()) + make_interval(months => p_meses);

  update public.negocios
    set plan_vence_at = v_nuevo, plan_en_prueba = false, plan_id = v_plan_id
    where id = p_negocio_id;

  insert into public.pagos_plataforma (negocio_id, plan_id, meses, monto, metodo, nota, vence_anterior, vence_nuevo)
  values (p_negocio_id, v_plan_id, p_meses, coalesce(p_monto, 0), nullif(trim(p_metodo), ''), nullif(trim(p_nota), ''), v_anterior, v_nuevo);

  return v_nuevo;
end;
$$;

-- El negocio tampoco puede MANDAR una petición de pago fuera de la
-- ventana (se rechaza en la base aunque alguien se salte el botón).
create or replace function public.fn_peticion_plan_ventana()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_vence timestamptz;
begin
  select plan_vence_at into v_vence from public.negocios where id = NEW.negocio_id;
  if not public.plan_puede_renovar(v_vence) then
    raise exception 'Tu plan está vigente hasta el %: podrás renovarlo desde el % (3 días antes de que venza).',
      to_char(v_vence at time zone 'America/Lima', 'DD/MM/YYYY'),
      to_char((v_vence - interval '3 days') at time zone 'America/Lima', 'DD/MM/YYYY')
      using errcode = 'P0001', hint = 'PLAN_VIGENTE';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_peticion_plan_ventana on public.peticiones_plan;
create trigger trg_peticion_plan_ventana
  before insert on public.peticiones_plan
  for each row execute function public.fn_peticion_plan_ventana();

notify pgrst, 'reload schema';
