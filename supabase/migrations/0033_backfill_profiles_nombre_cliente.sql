-- La Edge Function create-cliente guardaba profiles.nombre = NULL para
-- todo cliente (solo lo llenaba para cajero) — ya se corrigió el
-- código, pero los clientes creados ANTES de ese fix se quedaron con
-- nombre NULL en 'profiles'. Esto los deja sin nombre visible en el
-- nuevo panel de administración de usuarios (que lista cajeros y
-- clientes desde 'profiles' en una sola consulta). Se rescata el
-- nombre real desde clientes_fiado.nombre (vía auth_user_id, la FK que
-- ya vincula ambas tablas) para las filas que quedaron huérfanas.
update public.profiles p
set nombre = c.nombre
from public.clientes_fiado c
where p.role = 'cliente'
  and p.nombre is null
  and c.auth_user_id = p.id;
