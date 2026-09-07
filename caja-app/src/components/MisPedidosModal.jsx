import { useCallback, useEffect, useState } from "react";
import { X, MessageCircle, Loader2, Ban } from "lucide-react";
import { supabase } from "../supabaseClient";
import ChatPedidoModal from "./ChatPedidoModal";
import { formatSoles, formatDate, formatTime } from "../utils/format";

const ESTADO_LABELS = {
  nuevo: "Nuevo",
  en_atencion: "En atención",
  confirmado: "Entregado",
  cancelado: "Cancelado",
};

// "Mis Pedidos" del cliente: sus propios pedidos (RLS ya garantiza que
// solo vea los suyos), con acceso directo al chat de cada uno — así el
// cliente puede seguir hablando con la tienda incluso después de haber
// cerrado la pantalla de confirmación del checkout.
export default function MisPedidosModal({ session, onClose }) {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatPedidoId, setChatPedidoId] = useState(null);
  const [cancelandoId, setCancelandoId] = useState(null);

  const load = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("pedidos")
      .select("*, pedido_items(*)")
      .eq("cliente_id", session.user.id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[MisPedidosModal] Error cargando pedidos:", error);
    }
    setPedidos(data || []);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  const cancelarPedido = async (pedidoId) => {
    setCancelandoId(pedidoId);
    const { error } = await supabase.from("pedidos").update({ estado: "cancelado" }).eq("id", pedidoId);
    if (error) {
      console.error("[MisPedidosModal] Error cancelando pedido:", error);
    } else {
      await supabase
        .from("pedido_mensajes")
        .insert([{ pedido_id: pedidoId, remitente: "sistema", mensaje: "❌ Cancelaste este pedido." }]);
      load();
    }
    setCancelandoId(null);
  };

  useEffect(() => {
    if (!session?.user?.id) return undefined;
    const channel = supabase
      .channel(`mis-pedidos-${session.user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos", filter: `cliente_id=eq.${session.user.id}` },
        load
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, load]);

  return (
    <div className="tz-modal-backdrop">
      <div className="tz-modal tz-modal-wide" onClick={(e) => e.stopPropagation()}>
        <button className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <h2>Mis Pedidos</h2>

        {loading ? (
          <p className="tz-stock-editor-sub">
            <Loader2 className="tz-spin" size={16} /> Cargando...
          </p>
        ) : pedidos.length === 0 ? (
          <p className="tz-stock-editor-sub">Todavía no has hecho ningún pedido.</p>
        ) : (
          <div className="tz-pedidos-list">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="tz-pedido-card">
                <div className="tz-pedido-card-head">
                  <span className="tz-pedido-cliente-nombre">
                    {formatDate(pedido.created_at)} {formatTime(pedido.created_at)}
                  </span>
                  <span className={`tz-pedido-estado tz-pedido-estado-${pedido.estado}`}>
                    {ESTADO_LABELS[pedido.estado] || pedido.estado}
                  </span>
                </div>
                <ul className="tz-pedido-items-list">
                  {(pedido.pedido_items || []).map((it) => (
                    <li key={it.id}>
                      {it.cantidad}x {it.nombre} — {formatSoles(it.subtotal)}
                    </li>
                  ))}
                </ul>
                <div className="tz-pedido-card-total">Total: {formatSoles(pedido.total)}</div>
                <div className="tz-pedido-card-actions">
                  <button
                    type="button"
                    className="tz-pedido-action-btn"
                    onClick={() => setChatPedidoId(pedido.id)}
                  >
                    <MessageCircle size={14} /> Chat con la tienda
                  </button>
                  {(pedido.estado === "nuevo" || pedido.estado === "en_atencion") && (
                    <button
                      type="button"
                      className="tz-pedido-action-btn tz-pedido-action-cancelar"
                      onClick={() => cancelarPedido(pedido.id)}
                      disabled={cancelandoId === pedido.id}
                    >
                      {cancelandoId === pedido.id ? (
                        <Loader2 size={14} className="tz-spin" />
                      ) : (
                        <Ban size={14} />
                      )}
                      Cancelar pedido
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {chatPedidoId && (
        <ChatPedidoModal
          pedidoId={chatPedidoId}
          remitentePropio="cliente"
          tituloChat="Chat con la tienda"
          onClose={() => setChatPedidoId(null)}
        />
      )}
    </div>
  );
}
