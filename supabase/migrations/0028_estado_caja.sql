-- Fase 1 "Control de Dinero y Flujo de Sesión": estado global de la
-- caja (una sola fila, id=1 — no es un historial, es "el estado
-- actual"; el historial de cortes de turno ya vive en 'cierres_caja').
--
-- Flujo: el admin abre la caja (estado='abierta', fondo_inicial =
-- lo que contó a mano) -> ambos roles pueden vender -> al cerrar caja
-- (ejecutarCierre en App.jsx) esta fila vuelve a 'cerrada'. Mientras
-- está 'cerrada', un cajero no puede vender (pantalla de bloqueo); un
-- admin ve un modal obligatorio para volver a abrirla.
create table if not exists public.estado_caja (
  id integer primary key default 1,
  estado text not null default 'cerrada' check (estado in ('abierta', 'cerrada')),
  fondo_inicial numeric,
  abierta_por text,
  abierta_en bigint,
  cerrada_en bigint,
  constraint estado_caja_singleton check (id = 1)
);

insert into public.estado_caja (id, estado)
values (1, 'cerrada')
on conflict (id) do nothing;

alter table public.estado_caja enable row level security;

-- Leer el estado (para decidir qué pantalla mostrar) lo necesita
-- cualquier staff logueado, no solo admin.
drop policy if exists "estado_caja_select" on public.estado_caja;
create policy "estado_caja_select" on public.estado_caja
  for select using (public.is_staff());

-- Actualizar: is_staff() en vez de is_admin() porque tanto admin como
-- cajero pueden CERRAR caja (ejecutarCierre, ya accesible a ambos
-- roles). La restricción de que SOLO el admin puede ABRIRLA (cargar
-- fondo_inicial) es a nivel de UI en App.jsx, no de RLS — igual que
-- el resto de los controles "solo admin" de esta app.
drop policy if exists "estado_caja_update" on public.estado_caja;
create policy "estado_caja_update" on public.estado_caja
  for update using (public.is_staff()) with check (public.is_staff());
