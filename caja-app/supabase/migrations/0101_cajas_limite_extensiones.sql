-- =========================================================================
-- Turno de caja: límite de extensiones.
--
-- Cada extensión corre el cierre 30 minutos. Por turno (desde que se abre
-- la caja hasta que se cierra): el cajero puede extender hasta 3 veces y
-- el admin del negocio hasta 5 (contando las del cajero). Agotadas, al
-- cajero solo le queda cerrar el turno.
--
-- Las extensiones pasan por caja_extender_turno(caja): la app ya no puede
-- escribir extendida_hasta ni extensiones directo (solo limpiarlas al
-- abrir o cerrar la caja, que además reinicia el conteo).
--
-- Idempotente.
-- =========================================================================
alter table public.cajas add column if not exists extensiones integer not null default 0;

create or replace function public.fn_cajas_extension_protegida()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Abrir o cerrar la caja reinicia el turno.
  if new.estado is distinct from old.estado then
    new.extensiones := 0;
    new.extendida_hasta := null;
    return new;
  end if;
  if current_user in ('anon', 'authenticated')
     and (new.extensiones is distinct from old.extensiones
          or (new.extendida_hasta is not null and new.extendida_hasta is distinct from old.extendida_hasta)) then
    raise exception 'La extensión del turno va por caja_extender_turno.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_cajas_extension_protegida on public.cajas;
create trigger trg_cajas_extension_protegida
  before update on public.cajas
  for each row execute function public.fn_cajas_extension_protegida();

create or replace function public.caja_extender_turno(p_caja_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_c     public.cajas;
  v_max   integer := case when public.is_admin() then 5 else 3 end;
  v_ahora bigint := (extract(epoch from now()) * 1000)::bigint;
  v_hasta bigint;
begin
  if not (public.is_staff() and public.caja_en_mi_negocio(p_caja_id)) then
    return jsonb_build_object('estado', 'sin_permiso');
  end if;
  select * into v_c from public.cajas where id = p_caja_id for update;
  if not found or v_c.estado <> 'abierta' then
    return jsonb_build_object('estado', 'cerrada');
  end if;
  if coalesce(v_c.extensiones, 0) >= v_max then
    return jsonb_build_object('estado', 'limite', 'extensiones', v_c.extensiones, 'max_extensiones', v_max);
  end if;
  v_hasta := greatest(v_ahora, coalesce(v_c.extendida_hasta, 0)) + 30 * 60 * 1000;
  update public.cajas
    set extendida_hasta = v_hasta, extensiones = coalesce(extensiones, 0) + 1
    where id = p_caja_id;
  return jsonb_build_object(
    'estado', 'ok',
    'extendida_hasta', v_hasta,
    'extensiones', coalesce(v_c.extensiones, 0) + 1,
    'max_extensiones', v_max
  );
end;
$$;
revoke execute on function public.caja_extender_turno(uuid) from public, anon;
grant execute on function public.caja_extender_turno(uuid) to authenticated;
