import { useEffect, useRef, useState } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { usePedidoMensajes, REMITENTE_SISTEMA } from "../hooks/usePedidoMensajes";

// Chat de un pedido puntual. Lo usan los dos lados:
//   - el cliente (remitentePropio="cliente"), montado desde CatalogPage
//   - el cajero/admin (remitentePropio="cajero"), montado desde
//     GestorPedidosModal
// Ambos comparten esta misma tabla ('pedido_mensajes') y este mismo
// componente — el rol solo cambia qué burbuja se pinta como "propia".
export default function ChatPedidoModal({ pedidoId, remitentePropio, tituloChat, onClose }) {
  const { mensajes, loading, enviarMensaje } = usePedidoMensajes(pedidoId);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [mensajes.length]);

  const handleEnviar = async () => {
    const valor = texto.trim();
    if (!valor || enviando) return;
    setEnviando(true);
    const { error } = await enviarMensaje(remitentePropio, valor);
    setEnviando(false);
    if (!error) setTexto("");
  };

  return (
    <div className="tz-modal-backdrop tz-modal-backdrop-nested">
      <div className="tz-modal tz-modal-chat" onClick={(e) => e.stopPropagation()}>
        <button className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <h2>{tituloChat || "Chat del pedido"}</h2>

        {loading ? (
          <p className="tz-stock-editor-sub">
            <Loader2 className="tz-spin" size={16} /> Cargando mensajes...
          </p>
        ) : (
          <div className="tz-chat-messages" ref={listRef}>
            {mensajes.length === 0 && (
              <p className="tz-chat-empty">Todavía no hay mensajes en este pedido.</p>
            )}
            {mensajes.map((m) => {
              const esSistema = m.remitente === REMITENTE_SISTEMA;
              const esPropio = m.remitente === remitentePropio;
              return (
                <div
                  key={m.id}
                  className={`tz-chat-bubble-row ${
                    esSistema ? "tz-chat-bubble-row-sistema" : esPropio ? "tz-chat-bubble-row-own" : ""
                  }`}
                >
                  <div
                    className={`tz-chat-bubble ${
                      esSistema
                        ? "tz-chat-bubble-sistema"
                        : esPropio
                        ? "tz-chat-bubble-own"
                        : "tz-chat-bubble-other"
                    }`}
                  >
                    {m.mensaje}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="tz-chat-input-row">
          <input
            type="text"
            className="tz-chat-input"
            placeholder="Escribe un mensaje…"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleEnviar();
            }}
            disabled={enviando}
          />
          <button
            type="button"
            className="tz-chat-send-btn"
            onClick={handleEnviar}
            disabled={enviando || !texto.trim()}
            aria-label="Enviar mensaje"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
