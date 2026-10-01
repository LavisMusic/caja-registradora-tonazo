-- Fase 1 del super-admin: acceso al panel + CRUD de rubros/negocios.
--
-- is_super_admin(): mismo patrón que is_admin()/is_staff() (definidas
-- directo en Supabase, no en una migración local) — SECURITY DEFINER
-- para poder leer 'profiles' sin depender de que 'profiles' tenga su
-- propia política de SELECT que cubra este caso.
--
-- rubros/negocios: hasta ahora RLS estaba habilitado SIN políticas
-- (solo service_role, ver 0073) — acá se abre nada más que al
-- super_admin, para que el panel pueda leer/escribir desde el cliente
-- con su propia sesión en vez de necesitar una Edge Function.
--
-- Bucket 'negocio-logos': público en lectura (se muestra en el
-- directorio Y en las boletas de cada negocio), escritura solo
-- super_admin — mismo esquema que 'productos-imagenes'/
-- 'comprobantes-fotos' (bucket creado acá porque esos dos se crearon a
-- mano en Studio, sin migración local que lo documente).

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'super_admin'
  );
$$;

drop policy if exists "rubros_super_admin_all" on public.rubros;
create policy "rubros_super_admin_all" on public.rubros
  for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "negocios_super_admin_all" on public.negocios;
create policy "negocios_super_admin_all" on public.negocios
  for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

insert into storage.buckets (id, name, public)
values ('negocio-logos', 'negocio-logos', true)
on conflict (id) do nothing;

drop policy if exists "negocio_logos_public_select" on storage.objects;
create policy "negocio_logos_public_select" on storage.objects
  for select
  using (bucket_id = 'negocio-logos');

drop policy if exists "negocio_logos_super_admin_insert" on storage.objects;
create policy "negocio_logos_super_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'negocio-logos' and public.is_super_admin());

drop policy if exists "negocio_logos_super_admin_update" on storage.objects;
create policy "negocio_logos_super_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'negocio-logos' and public.is_super_admin());

drop policy if exists "negocio_logos_super_admin_delete" on storage.objects;
create policy "negocio_logos_super_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'negocio-logos' and public.is_super_admin());
