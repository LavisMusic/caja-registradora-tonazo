-- Fase 4 (bloque A) — planes con meses y descuento, eliminar planes,
-- suspensión manual, límite también para localidades, datos de pago de
-- la plataforma y TIEMPO REAL (antes había que recargar la página para
-- ver un cambio de plan, de vencimiento o de contacto).
-- =====================================================================
-- Idempotente. Correr en el SQL Editor de Caja Tonazo.

-- 1) Planes: cuántos meses cubre y % de descuento.
--    Precio del plan = precio_mensual × meses × (1 − descuento_pct/100)
--    (se calcula en la app; acá solo se guardan los datos).
alter table public.planes add column if not exists meses int not null default 1;
alter table public.planes add column if not exists descuento_pct numeric not null default 0;
do $$
begin
  alter table public.planes add constraint planes_meses_chk check (meses between 1 and 36);
exception when duplicate_object then null;
end $$;
do $$
begin
  alter table public.planes add constraint planes_descuento_chk check (descuento_pct >= 0 and descuento_pct < 100);
exception when duplicate_object then null;
end $$;

-- 2) Negocio: suspensión manual (ej. fraude) y color propio (tarjetas del
--    super admin; base de la temática por negocio que viene al final).
alter table public.negocios add column if not exists plan_suspendido_manual boolean not null default false;
alter table public.negocios add column if not exists color text;

-- La suspensión manual gana a todo lo demás.
create or replace function public.plan_estado(n public.negocios)
returns text
language sql
stable
as $$
  select case
    when n.plan_suspendido_manual then 'suspendido'
    when n.plan_exento then 'exento'
    when n.plan_vence_at is null then 'activo'
    when now() < n.plan_vence_at then
      case when n.plan_en_prueba then 'prueba' else 'activo' end
    when now() < n.plan_vence_at + interval '5 days' then 'gracia'
    else 'suspendido'
  end;
$$;

-- 3) Registrar pago indicando QUÉ plan se pagó: el negocio pasa a ese
--    plan y se extienden sus meses. (Reemplaza la versión de 0087.)
drop function if exists public.registrar_pago_plan(uuid, int, numeric, text, text);
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

-- 4) Eliminar un plan: los negocios que lo usan pasan al plan de
--    reemplazo (obligatorio si hay alguno).
create or replace function public.eliminar_plan(p_plan_id uuid, p_reemplazo uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_en_uso int;
begin
  if not public.is_super_admin() then
    raise exception 'Solo el super admin puede eliminar planes.';
  end if;
  select count(*) into v_en_uso from public.negocios where plan_id = p_plan_id;
  if v_en_uso > 0 then
    if p_reemplazo is null or p_reemplazo = p_plan_id then
      raise exception 'Hay % negocio(s) con este plan: elige a qué plan pasarlos.', v_en_uso;
    end if;
    update public.negocios set plan_id = p_reemplazo where plan_id = p_plan_id;
  end if;
  delete from public.planes where id = p_plan_id;
end;
$$;

-- 5) Localidades: si el negocio ya llegó a su límite de sucursales, no
--    tiene sentido crear localidades nuevas (no podría ponerles ninguna
--    sucursal). Mismas excepciones: super admin y negocios exentos.
create or replace function public.fn_localidad_limite_plan()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_exento boolean;
  v_max int;
  v_plan text;
  v_activas int;
begin
  if public.is_super_admin() then return NEW; end if;

  select n.plan_exento, p.max_sucursales, p.nombre
    into v_exento, v_max, v_plan
    from public.negocios n
    left join public.planes p on p.id = n.plan_id
    where n.id = NEW.negocio_id;

  if coalesce(v_exento, false) or v_max is null then return NEW; end if;

  select count(*) into v_activas
    from public.sucursales s
    join public.localidades l on l.id = s.localidad_id
    where l.negocio_id = NEW.negocio_id
      and coalesce(s.activo, true);

  if v_activas >= v_max then
    raise exception 'Tu plan % permite hasta % sucursal(es) y ya las tienes: no puedes crear más localidades. Para agregar más, mejora tu plan.',
      v_plan, v_max
      using errcode = 'P0001', hint = 'PLAN_LIMITE_LOCALIDADES';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_localidad_limite_plan on public.localidades;
create trigger trg_localidad_limite_plan
  before insert on public.localidades
  for each row execute function public.fn_localidad_limite_plan();

-- 6) Datos de pago de la plataforma (el negocio los copia desde el
--    modal de pago para pagar en su app de Yape/Plin o del banco).
alter table public.plataforma_contacto add column if not exists yape_plin text;
alter table public.plataforma_contacto add column if not exists cuenta_bancaria text;
alter table public.plataforma_contacto add column if not exists titular text;

-- 7) Tiempo real: las apps escuchan estos cambios y se actualizan sin
--    recargar (estado/vencimiento del plan, planes, contacto, pagos).
do $$
declare
  t text;
begin
  foreach t in array array['negocios', 'planes', 'plataforma_contacto', 'pagos_plataforma'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

notify pgrst, 'reload schema';
