-- Fase 1 del super-admin: cada negocio tiene su propia URL de login
-- (/:slug), con su logo — reemplaza la ruta genérica /admin de 3
-- pestañas (ver comentario largo en NegocioAccessPage.jsx).
--
-- slug: identifica al negocio en la URL (ej. 'tonazo' -> /tonazo).
-- Tonazo ya existe desde la Fase 0 (backfill) — se le asigna acá; los
-- negocios NUEVOS le ponen el suyo desde el panel super-admin.
--
-- Política de lectura pública: /:slug necesita mostrar el logo del
-- negocio ANTES de loguearse (todavía no hay sesión) — nombre/logo/slug
-- de un negocio activo no es información sensible (van a estar en el
-- directorio público de la Fase 2 de todos modos).

alter table public.negocios add column if not exists slug text;

update public.negocios set slug = 'tonazo' where slug is null and nombre = 'Tonazo';

create unique index if not exists negocios_slug_uidx on public.negocios (slug) where slug is not null;

drop policy if exists "negocios_public_select_activos" on public.negocios;
create policy "negocios_public_select_activos" on public.negocios
  for select
  using (activo = true);
