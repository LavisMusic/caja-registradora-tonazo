-- Perfil del negocio (botón "Perfil" de la cabecera del admin):
--   * descripciones: frases cortas (máx. 6, de 1 a 20 caracteres cada
--     una) que se muestran en la tienda pública debajo del logo, en
--     secuencia con efecto de escritura.
--   * horario por sucursal (sucursales.horario, jsonb):
--       { "lun": {"abre":"08:00","cierra":"20:00"}, ..., "dom": null }
--     null en un día = cerrado; columna null = sin horario cargado.
--     El admin ya puede editar sus sucursales (RLS de 0079).
--   * actualizar_perfil_negocio: el admin cambia SOLO nombre, color,
--     WhatsApp, descripciones y logo de SU negocio (no el slug ni nada
--     del plan).
--   * logo: el admin sube a negocio-logos/<su negocio_id>/…
--   * REGLA: sin WhatsApp registrado no se puede recargar el plan (ni
--     Recarga rápida del super admin ni petición del negocio).
-- Idempotente. Correr en el SQL Editor de Caja Tonazo.

-- 1) Descripciones
create or replace function public.fn_descripciones_validas(p text[])
returns boolean
language sql
immutable
as $$
  select coalesce(array_length(p, 1), 0) <= 6
     and coalesce((select bool_and(char_length(d) between 1 and 20) from unnest(p) d), true);
$$;

alter table public.negocios add column if not exists descripciones text[] not null default '{}';
alter table public.negocios drop constraint if exists negocios_descripciones_validas;
alter table public.negocios add constraint negocios_descripciones_validas
  check (public.fn_descripciones_validas(descripciones));

-- 2) Horario por sucursal
alter table public.sucursales add column if not exists horario jsonb;

-- 3) RPC de perfil
create or replace function public.actualizar_perfil_negocio(
  p_nombre text,
  p_color text,
  p_whatsapp text,
  p_descripciones text[],
  p_logo_url text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_negocio uuid := public.mi_negocio_id();
  v_whatsapp text := nullif(regexp_replace(coalesce(p_whatsapp, ''), '[^0-9+]', '', 'g'), '');
  v_descripciones text[];
begin
  if v_negocio is null or not public.is_admin() then
    raise exception 'Solo el admin del negocio puede editar su perfil.';
  end if;
  if coalesce(trim(p_nombre), '') = '' then
    raise exception 'El nombre no puede quedar vacío.';
  end if;
  if v_whatsapp is not null and char_length(regexp_replace(v_whatsapp, '[^0-9]', '', 'g')) < 9 then
    raise exception 'El WhatsApp debe tener al menos 9 dígitos.';
  end if;
  select coalesce(array_agg(trim(d)) filter (where trim(d) <> ''), '{}')
    into v_descripciones
    from unnest(coalesce(p_descripciones, '{}')) d;
  if not public.fn_descripciones_validas(v_descripciones) then
    raise exception 'Máximo 6 descripciones de hasta 20 caracteres cada una.';
  end if;

  update public.negocios
    set nombre = trim(p_nombre),
        color = coalesce(nullif(trim(p_color), ''), color),
        whatsapp = v_whatsapp,
        descripciones = v_descripciones,
        logo_url = coalesce(nullif(trim(p_logo_url), ''), logo_url)
    where id = v_negocio;
end;
$$;

grant execute on function public.actualizar_perfil_negocio(text, text, text, text[], text) to authenticated;

-- 4) Logo: el admin sube a su propia carpeta
drop policy if exists "negocio_logos_admin_insert" on storage.objects;
create policy "negocio_logos_admin_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'negocio-logos'
    and public.is_admin()
    and (storage.foldername(name))[1] = public.mi_negocio_id()::text
  );

-- 5) Regla: sin WhatsApp no hay recarga
create or replace function public.fn_recarga_requiere_whatsapp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.negocios
    where id = new.negocio_id and coalesce(trim(whatsapp), '') <> ''
  ) then
    raise exception 'El negocio tiene que tener un número de WhatsApp registrado en su perfil para poder recargar su plan.'
      using hint = 'SIN_WHATSAPP';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_pago_requiere_whatsapp on public.pagos_plataforma;
create trigger trg_pago_requiere_whatsapp
  before insert on public.pagos_plataforma
  for each row execute function public.fn_recarga_requiere_whatsapp();

drop trigger if exists trg_peticion_requiere_whatsapp on public.peticiones_plan;
create trigger trg_peticion_requiere_whatsapp
  before insert on public.peticiones_plan
  for each row execute function public.fn_recarga_requiere_whatsapp();

notify pgrst, 'reload schema';
