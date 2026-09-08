-- Fase 1 "Pedidos Delivery": carrito de cliente + Gestor de Pedidos de
-- admin/cajero + chat por pedido. Vive en el proyecto PROPIO de
-- caja-registradora-tonazo (xaerfywydzwifohjsvwa) — ya NO se unifica
-- con taxi-pe-app; la conexión entre ambas apps se hace por
-- webhooks/Edge Functions, no por una base de datos compartida.
--
-- Reutiliza lo que ya existe en este proyecto (profiles, is_admin(),
-- is_staff(), sucursales) — no hace falta recrearlo.

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references auth.users(id),
  sucursal_id uuid references public.sucursales(id) not null,
  estado text not null default 'nuevo' check (estado in ('nuevo', 'en_atencion', 'confirmado', 'cancelado')),
  metodo_pago text not null check (metodo_pago in ('YAPE', 'PLIN', 'OTROS', 'EFECTIVO', 'FIADO')),
  monto_recibido numeric,
  vuelto numeric,
  total numeric not null,
  created_at timestamptz not null default now()
);

create table if not exists public.pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid references public.pedidos(id) on delete cascade,
  producto_id uuid references public.productos(id),
  nombre text not null,
  cantidad numeric not null,
  precio_unitario numeric not null,
  subtotal numeric not null,
  venta_por_peso boolean not null default false
);

create table if not exists public.pedido_mensajes (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid references public.pedidos(id) on delete cascade,
  remitente text not null check (remitente in ('cliente', 'cajero', 'sistema')),
  mensaje text not null,
  leido boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.pedidos enable row level security;
alter table public.pedido_items enable row level security;
alter table public.pedido_mensajes enable row level security;

-- Cliente: solo sus propios pedidos. Cajero: solo los de su sucursal
-- asignada (profiles.sucursal_id). Admin: todos.
drop policy if exists "pedidos_select" on public.pedidos;
create policy "pedidos_select" on public.pedidos
  for select using (
    cliente_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'cajero' and p.sucursal_id = pedidos.sucursal_id
    )
  );

drop policy if exists "pedidos_cliente_insert" on public.pedidos;
create policy "pedidos_cliente_insert" on public.pedidos
  for insert with check (cliente_id = auth.uid());

drop policy if exists "pedidos_update" on public.pedidos;
create policy "pedidos_update" on public.pedidos
  for update using (
    cliente_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'cajero' and p.sucursal_id = pedidos.sucursal_id
    )
  );

drop policy if exists "pedido_items_select" on public.pedido_items;
create policy "pedido_items_select" on public.pedido_items
  for select using (
    exists (
      select 1 from public.pedidos ped
      where ped.id = pedido_items.pedido_id
        and (
          ped.cliente_id = auth.uid()
          or public.is_admin()
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'cajero' and p.sucursal_id = ped.sucursal_id
          )
        )
    )
  );
drop policy if exists "pedido_items_insert" on public.pedido_items;
create policy "pedido_items_insert" on public.pedido_items
  for insert with check (
    exists (
      select 1 from public.pedidos ped
      where ped.id = pedido_items.pedido_id and ped.cliente_id = auth.uid()
    )
  );

drop policy if exists "pedido_mensajes_select" on public.pedido_mensajes;
create policy "pedido_mensajes_select" on public.pedido_mensajes
  for select using (
    exists (
      select 1 from public.pedidos ped
      where ped.id = pedido_mensajes.pedido_id
        and (
          ped.cliente_id = auth.uid()
          or public.is_admin()
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'cajero' and p.sucursal_id = ped.sucursal_id
          )
        )
    )
  );
drop policy if exists "pedido_mensajes_insert" on public.pedido_mensajes;
create policy "pedido_mensajes_insert" on public.pedido_mensajes
  for insert with check (
    exists (
      select 1 from public.pedidos ped
      where ped.id = pedido_mensajes.pedido_id
        and (
          ped.cliente_id = auth.uid()
          or public.is_admin()
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'cajero' and p.sucursal_id = ped.sucursal_id
          )
        )
    )
  );

-- Realtime: para que useCatalog/usePedidos/usePedidoMensajes reciban
-- los eventos en vivo.
do $$
declare
  t text;
begin
  foreach t in array array['pedidos', 'pedido_items', 'pedido_mensajes']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
