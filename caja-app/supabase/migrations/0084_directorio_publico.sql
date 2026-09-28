-- Fase 2: directorio público (grilla estilo Friv de rubros/negocios en
-- "/", cada tarjeta lleva al catálogo de ESE negocio en /:slug/tienda).
-- 'rubros'/'negocios' hasta ahora solo tenían política para
-- super_admin (migración 0074) — un visitante anónimo no podía leer
-- ninguna de las dos, así que el directorio no tenía de dónde sacar
-- la lista. Solo lectura, y solo lo 'activo' (un negocio/rubro oculto
-- por el super-admin no debe aparecer en la vidriera pública).

drop policy if exists "rubros_public_select" on public.rubros;
create policy "rubros_public_select" on public.rubros
  for select
  using (activo = true);

drop policy if exists "negocios_public_select" on public.negocios;
create policy "negocios_public_select" on public.negocios
  for select
  using (activo = true);
