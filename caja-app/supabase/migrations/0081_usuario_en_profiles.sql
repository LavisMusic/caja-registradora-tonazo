-- Gestor de Cuentas del super-admin: necesita mostrar el "usuario" de
-- login de cada admin/cajero, pero eso hoy solo vive escondido en el
-- email dummy de Auth (usuario@tonazo.staff, ver create-cliente) — no
-- hay forma de leerlo desde el cliente sin service_role. Se agrega una
-- columna espejo en 'profiles' (create-cliente la va a llenar desde
-- ahora en adelante) y se hace un backfill único de las cuentas que ya
-- existen, leyendo directo de auth.users (esta migración corre como
-- 'postgres', que sí tiene acceso al esquema auth).

alter table public.profiles add column if not exists usuario text;

update public.profiles p
set usuario = split_part(u.email, '@', 1)
from auth.users u
where u.id = p.id
  and p.role in ('admin', 'cajero')
  and p.usuario is null
  and u.email like '%@tonazo.staff';

-- Lectura para el super-admin: filtrar/ver admins y cajeros de
-- cualquier negocio (Gestor de Cuentas). Solo SELECT — altas/bajas/
-- reset de PIN siguen yendo por las Edge Functions existentes
-- (create-cliente / manage-usuario), no por acá.
drop policy if exists "profiles_super_admin_select" on public.profiles;
create policy "profiles_super_admin_select" on public.profiles
  for select
  using (public.is_super_admin());
