import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

// Contador para el círculo de aviso del botón de pedidos:
//  - caja (sucursalId): pedidos 'nuevo' sin ocultar → "hay pedidos por atender"
//  - cliente (clienteId): pedidos 'nuevo'/'en_atencion' sin ocultar → "tenés pedidos en curso"
// Se refresca en tiempo real ante cualquier cambio en `pedidos`.
export function usePedidosBadge({ sucursalId = null, clienteId = null }) {
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    let q = supabase.from("pedidos").select("id", { count: "exact", head: true });
    if (sucursalId) {
      q = q.eq("sucursal_id", sucursalId).eq("oculto_caja", false).eq("estado", "nuevo");
    } else if (clienteId) {
      q = q.eq("cliente_id", clienteId).eq("oculto_cliente", false).in("estado", ["nuevo", "en_atencion"]);
    } else {
      setCount(0);
      return;
    }
    const { count: c } = await q;
    setCount(c || 0);
  }, [sucursalId, clienteId]);

  useEffect(() => {
    load();
    const key = sucursalId || clienteId;
    if (!key) return undefined;

    const filter = sucursalId ? `sucursal_id=eq.${sucursalId}` : `cliente_id=eq.${clienteId}`;
    const ch = supabase
      .channel(`pedidos-badge-${key}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "pedidos", filter }, load)
      .subscribe();

    // Fallback ante realtime intermitente: re-consulta cada 15 s y al
    // volver la pestaña a primer plano.
    const poll = setInterval(load, 15000);
    const onVis = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVis);

    return () => {
      supabase.removeChannel(ch);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load, sucursalId, clienteId]);

  return count;
}
