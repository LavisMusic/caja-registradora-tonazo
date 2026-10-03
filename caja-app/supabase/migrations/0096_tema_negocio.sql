-- Tema por negocio (Perfil → Tema): colores de SU caja (admin y
-- cajero) y de SU tienda pública. Se guarda en negocios.tema (jsonb):
--   { "preset": "neon" }                              → paleta armada
--   { "modo": "oscuro"|"claro", "principal": "#rrggbb" } → color libre
-- null = tema original "Neón Tonazo". Los colores finales los calcula
-- la app (src/lib/tema.js), que además corrige el contraste.
-- La lectura es pública (la tienda la necesita sin sesión): la política
-- negocios_public_select ya cubre la columna nueva.
-- Idempotente. Correr en el SQL Editor de Caja Tonazo.

alter table public.negocios add column if not exists tema jsonb;

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
  if p_tema is not null and not (
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

grant execute on function public.actualizar_tema_negocio(jsonb) to authenticated;

notify pgrst, 'reload schema';
