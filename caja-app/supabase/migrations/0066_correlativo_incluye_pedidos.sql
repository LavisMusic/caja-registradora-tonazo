-- Correlativo de venta: contar también los ya reclamados en pedidos
-- ================================================================
-- rpc_siguiente_correlativo_venta miraba solo 'historial'. Si un cobro
-- reclama un V-000X en pedidos.venta_purchase_id pero registrar_venta
-- todavía no escribió en historial (o falló), el siguiente cobro vuelve
-- a obtener el MISMO número. Ahora se toma el máximo entre ambos.

create or replace function public.rpc_siguiente_correlativo_venta()
returns text
language sql
security definer
set search_path = public
as $$
  select 'V-' || lpad((coalesce(max(n), 0) + 1)::text, 4, '0')
  from (
    select (substring(purchase_id from '^V-(\d+)$'))::int as n
    from public.historial
    where purchase_id ~ '^V-\d+$'
    union all
    select (substring(venta_purchase_id from '^V-(\d+)$'))::int as n
    from public.pedidos
    where venta_purchase_id ~ '^V-\d+$'
  ) t;
$$;

grant execute on function public.rpc_siguiente_correlativo_venta() to anon, authenticated;

-- Limpia los reclamos huérfanos: pedidos con venta_purchase_id pero sin
-- ninguna fila en historial (la venta nunca se concretó). Así vuelven a
-- poder cobrarse con un número nuevo.
update public.pedidos p
set venta_purchase_id = null, venta_revertida = false
where p.venta_purchase_id is not null
  and not exists (
    select 1 from public.historial h where h.purchase_id = p.venta_purchase_id
  );
