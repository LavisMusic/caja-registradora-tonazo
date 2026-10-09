-- Temas temáticos LIBRES: cualquier negocio puede usar el temático de
-- cualquier rubro (Perfil → Tema → "Temas por rubros").
--   * actualizar_tema_negocio ya no exige que el temático sea del rubro
--     del negocio (0097): solo valida la forma { tematico, rubro }.
--   * Se quita el trigger de 0098 que devolvía el tema al original al
--     cambiar el rubro del negocio.
-- Idempotente. Correr en el SQL Editor de Caja Tonazo.

create or replace function public.actualizar_tema_negocio(p_tema jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_negocio uuid := public.mi_negocio_id();
begin
  if v_negocio is null or not public.is_admin() then
    raise exception 'Solo el admin del negocio puede cambiar su tema.';
  end if;
  if p_tema is not null and p_tema ? 'tematico' then
    if jsonb_typeof(p_tema->'tematico') <> 'string' or char_length(p_tema->>'tematico') > 40
       or jsonb_typeof(coalesce(p_tema->'rubro', '""'::jsonb)) <> 'string' or char_length(coalesce(p_tema->>'rubro', '')) > 60 then
      raise exception 'Tema temático inválido.';
    end if;
  elsif p_tema is not null and not (
    (p_tema ? 'preset' and jsonb_typeof(p_tema->'preset') = 'string' and char_length(p_tema->>'preset') <= 30)
    or (
      p_tema ? 'principal'
      and (p_tema->>'principal') ~ '^#[0-9a-fA-F]{6}$'
      and coalesce(p_tema->>'modo', 'oscuro') in ('oscuro', 'claro')
    )
  ) then
    raise exception 'Tema inválido.';
  end if;
  update public.negocios set tema = p_tema where id = v_negocio;
end;
$$;

drop trigger if exists trg_negocio_rubro_tema on public.negocios;
drop function if exists public.fn_negocio_rubro_tema();

notify pgrst, 'reload schema';
