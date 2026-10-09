-- Rubros: lista completa + clave para los TEMAS TEMÁTICOS.
--   * rubros.clave: identificador fijo del rubro (ej. 'ferreteria'). Los
--     temas temáticos (src/lib/tematicos.js) se atan a esta clave: un
--     negocio solo puede usar los temáticos de SU rubro. Si el super
--     admin crea un rubro nuevo, la clave se genera sola del nombre.
--   * "SEXO" pasa a llamarse "Sex Shop" (sus negocios no cambian).
--   * Se agregan los rubros que faltan; los existentes no se tocan.
--   * actualizar_tema_negocio acepta { "tematico": "...", "rubro": "..." }
--     y verifica que el rubro sea el del negocio.
-- Idempotente. Correr en el SQL Editor de Caja Tonazo.

-- 1) Clave del rubro
create or replace function public.fn_slug(p text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(
    lower(translate(coalesce(p, ''), 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun')),
    '[^a-z0-9]+', '-', 'g'
  ));
$$;

alter table public.rubros add column if not exists clave text;

create or replace function public.fn_rubro_clave()
returns trigger
language plpgsql
as $$
begin
  if coalesce(trim(new.clave), '') = '' then
    new.clave := public.fn_slug(new.nombre);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_rubro_clave on public.rubros;
create trigger trg_rubro_clave
  before insert or update on public.rubros
  for each row execute function public.fn_rubro_clave();

-- 2) "SEXO" → "Sex Shop"
update public.rubros set nombre = 'Sex Shop', clave = 'sex-shop'
  where upper(trim(nombre)) = 'SEXO';

-- Claves de los rubros que ya existían (Abarrotes, etc.)
update public.rubros set clave = public.fn_slug(nombre) where clave is null;

-- 3) Lista completa (solo agrega los que faltan, por nombre)
insert into public.rubros (nombre, clave, orden)
select v.nombre, v.clave, v.orden
from (values
  ('Abarrotes', 'abarrotes', 0),
  ('Minimarket', 'minimarket', 1),
  ('Restaurante', 'restaurante', 2),
  ('Pollería', 'polleria', 3),
  ('Cevichería', 'cevicheria', 4),
  ('Chifa', 'chifa', 5),
  ('Pizzería', 'pizzeria', 6),
  ('Panadería y Pastelería', 'panaderia', 7),
  ('Cafetería', 'cafeteria', 8),
  ('Juguería', 'jugueria', 9),
  ('Heladería', 'heladeria', 10),
  ('Carnicería', 'carniceria', 11),
  ('Frutas y Verduras', 'frutas-verduras', 12),
  ('Licorería', 'licoreria', 13),
  ('Bar y Discoteca', 'bar-discoteca', 14),
  ('Ferretería', 'ferreteria', 15),
  ('Materiales de Construcción', 'materiales-construccion', 16),
  ('Electrodomésticos', 'electrodomesticos', 17),
  ('Mueblería', 'muebleria', 18),
  ('Botica y Farmacia', 'botica', 19),
  ('Veterinaria y Pet Shop', 'veterinaria', 20),
  ('Barbería', 'barberia', 21),
  ('Salón de Belleza', 'salon-belleza', 22),
  ('Spa', 'spa', 23),
  ('Ropa y Moda', 'ropa-moda', 24),
  ('Calzado', 'calzado', 25),
  ('Joyería y Accesorios', 'joyeria', 26),
  ('Celulares y Tecnología', 'celulares-tecnologia', 27),
  ('Cabinas e Impresiones', 'cabinas-impresiones', 28),
  ('Repuestos y Lubricantes', 'repuestos', 29),
  ('Taller Mecánico', 'taller-mecanico', 30),
  ('Lavado de Autos', 'lavado-autos', 31),
  ('Librería y Bazar', 'libreria-bazar', 32),
  ('Juguetería', 'jugueteria', 33),
  ('Florería', 'floreria', 34),
  ('Agroveterinaria', 'agroveterinaria', 35),
  ('Lavandería', 'lavanderia', 36),
  ('Sex Shop', 'sex-shop', 37)
) as v(nombre, clave, orden)
where not exists (select 1 from public.rubros r where lower(r.nombre) = lower(v.nombre));

-- Orden de la lista para los que ya existían
update public.rubros r set orden = v.orden
from (values ('abarrotes', 0), ('sex-shop', 37)) as v(clave, orden)
where r.clave = v.clave;

create unique index if not exists rubros_clave_uidx on public.rubros (clave);

-- 4) Temas temáticos en actualizar_tema_negocio
create or replace function public.actualizar_tema_negocio(p_tema jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_negocio uuid := public.mi_negocio_id();
  v_rubro text;
begin
  if v_negocio is null or not public.is_admin() then
    raise exception 'Solo el admin del negocio puede cambiar su tema.';
  end if;
  if p_tema is not null and p_tema ? 'tematico' then
    select r.clave into v_rubro
      from public.negocios n join public.rubros r on r.id = n.rubro_id
      where n.id = v_negocio;
    if jsonb_typeof(p_tema->'tematico') <> 'string' or char_length(p_tema->>'tematico') > 40
       or coalesce(p_tema->>'rubro', '') <> coalesce(v_rubro, '') then
      raise exception 'Ese tema temático es de otro rubro.';
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

notify pgrst, 'reload schema';
