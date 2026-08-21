-- Corrige la apertura de caja del admin: el frontend hacía
-- estado_caja.update().eq('id',1), que es un no-op SILENCIOSO (sin
-- error) si la fila id=1 no existe todavía — típicamente porque esta
-- migración (antes 0028) nunca se llegó a correr. El código ya se
-- cambió a upsert(), pero upsert() hace un INSERT por debajo cuando no
-- hay fila que hacer match, y no existía ninguna policy de INSERT en
-- estado_caja — así que además de asegurar que la tabla y el seed
-- existan, hace falta la policy para que ese insert no quede
-- bloqueado por RLS.

-- Por si 0028 nunca se corrió: crea la tabla si hace falta (idéntica).
create table if not exists public.estado_caja (
  id integer primary key default 1,
  estado text not null default 'cerrada' check (estado in ('abierta', 'cerrada')),
  fondo_inicial numeric,
  abierta_por text,
  abierta_en bigint,
  cerrada_en bigint,
  constraint estado_caja_singleton check (id = 1)
);

-- Asegura que la fila singleton exista, sin pisar datos si ya existía.
insert into public.estado_caja (id, estado)
values (1, 'cerrada')
on conflict (id) do nothing;

alter table public.estado_caja enable row level security;

-- Policy de INSERT que faltaba: is_staff() (mismo criterio que ya
-- usa la policy de UPDATE) para que el upsert() del frontend pueda
-- crear la fila si por algún motivo no existiera.
drop policy if exists "estado_caja_insert" on public.estado_caja;
create policy "estado_caja_insert" on public.estado_caja
  for insert with check (public.is_staff());
