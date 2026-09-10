-- Pulido de UX — Filtro Público de Sucursales (catálogo público, sin
-- login): el selector de Localidad/Sucursal en la cabecera necesita
-- poder leer 'localidades' como visitante anónimo, igual que ya se
-- habilitó para 'sucursales'/'inventario_sucursales' en la migración
-- 0051 (mismo criterio: es información pública, nunca la vieron
-- restringida las tablas de catálogo "stock"/"productos"/"categorias").

drop policy if exists "localidades_public_select" on public.localidades;
create policy "localidades_public_select" on public.localidades
  for select using (activo = true);
