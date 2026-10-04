-- Cambio de rubro de un negocio ↔ tema temático.
-- Los temas temáticos son de UN rubro (0097). Si el super admin cambia
-- el rubro de un negocio que tiene puesto un temático de otro rubro, el
-- tema vuelve al original (null = "Neón Tonazo"). Las paletas normales y
-- el color libre valen para cualquier rubro, así que se mantienen.
-- Como es un UPDATE sobre negocios, la caja (admin/cajero), el Perfil y
-- la tienda pública lo reciben en tiempo real.
-- Idempotente. Correr en el SQL Editor de Caja Tonazo.

create or replace function public.fn_negocio_rubro_tema()
returns trigger
language plpgsql
as $$
declare
  v_clave text;
begin
  if new.rubro_id is distinct from old.rubro_id
     and new.tema is not null and new.tema ? 'tematico' then
    select clave into v_clave from public.rubros where id = new.rubro_id;
    if coalesce(new.tema->>'rubro', '') <> coalesce(v_clave, '') then
      new.tema := null;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_negocio_rubro_tema on public.negocios;
create trigger trg_negocio_rubro_tema
  before update of rubro_id on public.negocios
  for each row execute function public.fn_negocio_rubro_tema();

-- Por si ya quedó alguno desalineado antes de esta regla.
update public.negocios n
  set tema = null
  where n.tema ? 'tematico'
    and coalesce(n.tema->>'rubro', '') <> coalesce((select r.clave from public.rubros r where r.id = n.rubro_id), '');
