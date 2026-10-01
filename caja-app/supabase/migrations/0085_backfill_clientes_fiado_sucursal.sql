-- Bug encontrado en create-cliente: sucursalId/cajaId SIEMPRE viajaban
-- en el body (tanto desde "Añadir Cliente" en Usuarios como desde
-- "+ nueva cuenta" en el checkout de Fiado) pero la función nunca los
-- guardaba en clientes_fiado — la columna quedaba SIEMPRE en null. Eso
-- rompía en silencio el selector de "elegir cliente existente" del
-- checkout de Fiado (clientesVisibles exige sucursal_id === sucursal
-- activa) para TODO cliente creado alguna vez por esa función — y de
-- paso, la RLS de un cajero (is_staff() and sucursal_id =
-- mi_sucursal_id()) tampoco lo dejaba ver ni escribir el fiado de
-- alguien que él mismo acababa de crear.
--
-- La función ya está corregida (guarda sucursal_id/caja_id desde
-- ahora); esto backfillea lo que ya existe, infiriendo la sucursal del
-- primer fiado_item o movimiento_fiado real de cada cliente (son las
-- únicas tablas que sí tenían esa columna bien puesta desde siempre).
-- Un cliente sin ningún fiado_item/movimiento todavía (nunca compró
-- fiado) se queda en null — no hay de dónde inferirlo, y no importa:
-- no tiene historial que proteger todavía.

update public.clientes_fiado c
set sucursal_id = fi.sucursal_id, caja_id = fi.caja_id
from (
  select distinct on (cliente_id) cliente_id, sucursal_id, caja_id
  from public.fiado_items
  where sucursal_id is not null
  order by cliente_id, fecha asc
) fi
where c.id = fi.cliente_id and c.sucursal_id is null;

update public.clientes_fiado c
set sucursal_id = mv.sucursal_id, caja_id = mv.caja_id
from (
  select distinct on (cliente_id) cliente_id, sucursal_id, caja_id
  from public.movimientos_fiado
  where sucursal_id is not null
  order by cliente_id, fecha asc
) mv
where c.id = mv.cliente_id and c.sucursal_id is null;
