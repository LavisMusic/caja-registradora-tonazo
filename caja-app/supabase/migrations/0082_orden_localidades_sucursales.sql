-- Gestor de Localidades/Sucursales (botón del pie de página): admin
-- quiere poder ORDENAR localidades y sucursales a mano, no solo
-- alfabéticamente. Se agrega 'orden' a ambas tablas, con un backfill
-- que preserva el orden alfabético actual (nombre) como punto de
-- partida — nadie ve sus listas "revueltas" de un día para el otro.

alter table public.localidades add column if not exists orden integer;
alter table public.sucursales add column if not exists orden integer;

with numeradas as (
  select id, row_number() over (partition by negocio_id order by nombre) - 1 as rn
  from public.localidades
)
update public.localidades l
set orden = numeradas.rn
from numeradas
where numeradas.id = l.id and l.orden is null;

with numeradas as (
  select id, row_number() over (partition by localidad_id order by nombre) - 1 as rn
  from public.sucursales
)
update public.sucursales s
set orden = numeradas.rn
from numeradas
where numeradas.id = s.id and s.orden is null;
