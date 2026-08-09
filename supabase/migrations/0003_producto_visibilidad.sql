-- Permite al admin marcar productos como ocultos del catálogo público
-- (siguen disponibles para vender desde /admin, solo se esconden en "/").
alter table public.productos
  add column if not exists visible_publico boolean not null default true;
