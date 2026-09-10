import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

// Mensajes sin leer por pedido, para el círculo de aviso del botón de
// chat. Usa `pedido_mensajes.leido` (lo setea rpc_pedido_mensajes_marcar_leidos
// al abrir el chat). `miRol`: 'cajero' | 'cliente' — cuenta los del OTRO lado.
export function usePedidosNoLeidos(pedidoIds, miRol) {
  const [counts, setCounts] = useState({});
  const idsKey = (pedidoIds || []).filter(Boolean).join(",");

  const load = useCallback(async () => {
    const ids = idsKey ? idsKey.split(",") : [];
    if (ids.length === 0) {
      setCounts({});
      return;
    }
    const { data } = await supabase
      .from("pedido_mensajes")
      .select("pedido_id, remitente")
      .in("pedido_id", ids)
      .eq("leido", false)
      .neq("remitente", "sistema");

    const c = {};
    for (const m of data || []) {
      if (m.remitente === miRol) continue;
      c[m.pedido_id] = (c[m.pedido_id] || 0) + 1;
    }
    setCounts(c);
  }, [idsKey, miRol]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`pmsg-badge-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "pedido_mensajes" }, load)
      .subscribe();
    const poll = setInterval(load, 15000);
    return () => {
      supabase.removeChannel(ch);
      clearInterval(poll);
    };
  }, [load]);

  return { counts, refrescar: load };
}
