-- Fix: "No se pudo guardar en Supabase" al crear un Gasto o cerrar Caja.
--
-- Causa (misma familia que el bug de 'productos' en 0002/0004): estas 4
-- tablas nunca fueron tocadas por nuestras migraciones de auth, pero ya
-- tenían RLS habilitado con políticas viejas escritas para el rol
-- "anon" (de antes de que /admin tuviera login real). Desde que el
-- admin usa una sesión real de Supabase Auth, supabase-js manda el JWT
-- en cada consulta y PostgREST evalúa como "authenticated" en vez de
-- "anon" — si esas políticas viejas nunca cubrieron "authenticated",
-- los INSERT quedan bloqueados (y a veces ni siquiera el SELECT).
--
-- Fix: RLS habilitado + control total para el admin (is_admin(), de
-- 0001) en las 4 tablas. Nadie más necesita tocar estas tablas: no son
-- públicas ni las usa el cliente.

alter table public.gastos enable row level security;
alter table public.gasto_items enable row level security;
alter table public.proveedores enable row level security;
alter table public.cierres_caja enable row level security;

drop policy if exists "gastos_admin_all" on public.gastos;
create policy "gastos_admin_all" on public.gastos
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "gasto_items_admin_all" on public.gasto_items;
create policy "gasto_items_admin_all" on public.gasto_items
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "proveedores_admin_all" on public.proveedores;
create policy "proveedores_admin_all" on public.proveedores
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "cierres_caja_admin_all" on public.cierres_caja;
create policy "cierres_caja_admin_all" on public.cierres_caja
  for all using (public.is_admin()) with check (public.is_admin());
