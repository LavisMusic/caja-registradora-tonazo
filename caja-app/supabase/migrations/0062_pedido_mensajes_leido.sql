-- =========================================================================
-- Checks de lectura en el chat de un pedido. `pedido_mensajes.leido`
-- existe desde 0054 pero nada lo seteaba, y no hay política de UPDATE
-- (0054 solo tiene select/insert). Este RPC security definer marca como
-- leídos los mensajes del OTRO lado cuando alguien abre el chat.
--
--   p_mi_rol ∈ 'cliente' | 'cajero'
-- Idempotente.
-- =========================================================================

create or replace function public.rpc_pedido_mensajes_marcar_leidos(p_pedido_id uuid, p_mi_rol text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_n integer;
begin
  update public.pedido_mensajes
    set leido = true
  where pedido_id = p_pedido_id
    and leido = false
    and remitente <> 'sistema'
    and remitente <> p_mi_rol;
  get diagnostics v_n = row_count;
  return jsonb_build_object('status', 'ok', 'marcados', v_n);
end;
$$;

grant execute on function public.rpc_pedido_mensajes_marcar_leidos(uuid, text) to anon, authenticated;
