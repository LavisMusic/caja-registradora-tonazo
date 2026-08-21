-- Limpieza profunda de "usuarios fantasma": profiles.id YA tiene
-- "references auth.users(id) on delete cascade" (migración 0001), o
-- sea que borrar de auth.users SIEMPRE se lleva puesto el profile —
-- ese es el camino que ya usa manage-usuario (admin.auth.admin.
-- deleteUser). Pero el camino INVERSO no existía: si alguien borra una
-- fila de public.profiles directamente (SQL Editor, un DELETE manual,
-- cualquier código que no pase por esa Edge Function), la cuenta de
-- auth.users queda huérfana para siempre — un "usuario fantasma" que
-- ni siquiera aparece en la lista de Usuarios de la app (esa lista sí
-- lee de 'profiles'), pero sigue existiendo en Auth, pudiendo
-- loguearse con su password viejo.
--
-- Esta función + trigger cierran ese otro sentido: borrar de profiles
-- ahora TAMBIÉN borra el auth.users correspondiente.
--
-- SECURITY DEFINER es obligatorio acá: el rol que dispara el DELETE
-- sobre 'profiles' (ej. un admin autenticado vía RLS normal) no tiene
-- permisos para tocar el schema 'auth' directamente — la función corre
-- con los privilegios de quien la CREÓ (el dueño de la base, con
-- permiso sobre 'auth'), no de quien la invoca. 'set search_path' fijo
-- es la mitigación estándar contra "search_path hijacking" en
-- funciones SECURITY DEFINER (alguien creando un objeto con el mismo
-- nombre en otro schema para que la función lo resuelva por error).
create or replace function public.handle_deleted_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Por si esta fila de auth.users YA se estaba borrando en cascada
  -- (el camino normal, auth.users -> profiles) este DELETE no
  -- encuentra nada que borrar y no hace nada — no es un error, no es
  -- un loop infinito, es exactamente el comportamiento esperado.
  delete from auth.users where id = old.id;
  return old;
end;
$$;

drop trigger if exists on_profile_deleted on public.profiles;

create trigger on_profile_deleted
  after delete on public.profiles
  for each row
  execute function public.handle_deleted_profile();
