import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export const REMITENTE_CLIENTE = "cliente";
export const REMITENTE_CAJERO = "cajero";
export const REMITENTE_SISTEMA = "sistema";

// Chat de un pedido puntual (cliente <-> cajero/admin de la sucursal
// que recibió el pedido) — mismo patrón de carga + Realtime que
// useCatalog/usePedidos: carga el historial una vez, luego se
// suscribe a nuevos INSERT/UPDATE filtrados por 'pedido_id' (Realtime
// sí soporta filtrar por una sola columna, a diferencia del caso de
// 'pedido_items' en usePedidos).
export function usePedidoMensajes(pedidoId) {
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!pedidoId) {
      setMensajes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("pedido_mensajes")
      .select("*")
      .eq("pedido_id", pedidoId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[usePedidoMensajes] Error cargando mensajes:", error);
    }

    setMensajes(
      (data || []).map((row) => ({
        id: row.id,
        pedidoId: row.pedido_id,
        remitente: row.remitente,
        mensaje: row.mensaje,
        leido: row.leido,
        createdAt: row.created_at,
      }))
    );
    setLoading(false);
  }, [pedidoId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!pedidoId) return undefined;

    const channel = supabase
      .channel(`pedido-mensajes-${pedidoId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pedido_mensajes", filter: `pedido_id=eq.${pedidoId}` },
        (payload) => {
          const row = payload.new;
          setMensajes((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [
              ...prev,
              {
                id: row.id,
                pedidoId: row.pedido_id,
                remitente: row.remitente,
                mensaje: row.mensaje,
                leido: row.leido,
                createdAt: row.created_at,
              },
            ];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "pedido_mensajes", filter: `pedido_id=eq.${pedidoId}` },
        (payload) => {
          const row = payload.new;
          setMensajes((prev) => prev.map((m) => (m.id === row.id ? { ...m, leido: row.leido } : m)));
        }
      )
      .subscribe((status, err) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("[usePedidoMensajes] Realtime no se pudo conectar:", status, err || "");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pedidoId]);

  const marcarLeidos = useCallback(
    async (miRol) => {
      if (!pedidoId || !miRol) return;
      // Optimista: marca en el estado local los del OTRO lado. No recargamos
      // (un load() con su spinner reiniciaría el scroll del chat al tope).
      setMensajes((prev) =>
        prev.map((m) =>
          m.leido || m.remitente === miRol || m.remitente === REMITENTE_SISTEMA
            ? m
            : { ...m, leido: true }
        )
      );
      const { error } = await supabase.rpc("rpc_pedido_mensajes_marcar_leidos", {
        p_pedido_id: pedidoId,
        p_mi_rol: miRol,
      });
      if (error) {
        console.error("[usePedidoMensajes] rpc_pedido_mensajes_marcar_leidos:", error.message);
      }
    },
    [pedidoId]
  );

  const enviarMensaje = useCallback(
    async (remitente, mensaje) => {
      if (!pedidoId || !mensaje.trim()) return { error: null };
      const { error } = await supabase
        .from("pedido_mensajes")
        .insert([{ pedido_id: pedidoId, remitente, mensaje: mensaje.trim() }]);
      if (error) {
        console.error("[usePedidoMensajes] Error enviando mensaje:", error);
      }
      return { error };
    },
    [pedidoId]
  );

  return { mensajes, loading, enviarMensaje, marcarLeidos, recargar: load };
}
