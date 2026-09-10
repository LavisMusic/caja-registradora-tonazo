import { useEffect, useRef, useState } from "react";
import { X, Send, Loader2, Check, CheckCheck } from "lucide-react";
import { usePedidoMensajes, REMITENTE_SISTEMA } from "../hooks/usePedidoMensajes";

// Chat de un pedido puntual. Lo usan cliente y cajero/admin — mismo
// estilo que el chat de la entrega (burbujas, acento rosa a la derecha,
// hora + checks de leído).
export default function ChatPedidoModal({ pedidoId, remitentePropio, tituloChat, onClose }) {
  const { mensajes, loading, enviarMensaje, marcarLeidos } = usePedidoMensajes(pedidoId);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const listRef = useRef(null);

  const ultimoId = mensajes.length ? mensajes[mensajes.length - 1].id : null;
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [ultimoId, loading]);

  // Marca leídos los del otro lado al abrir y cuando llegan nuevos.
  const noLeidosDeOtro = mensajes.filter(
    (m) => m.remitente !== remitentePropio && m.remitente !== REMITENTE_SISTEMA && !m.leido
  ).length;
  useEffect(() => {
    if (noLeidosDeOtro > 0) marcarLeidos(remitentePropio);
  }, [noLeidosDeOtro, remitentePropio, marcarLeidos]);

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
          <div className="tz-dlv-chat-scroll" ref={listRef} style={{ borderRadius: 12, marginTop: 8 }}>
            {mensajes.length === 0 && <p className="tz-dlv-chat-empty">Todavía no hay mensajes en este pedido.</p>}
            {mensajes.map((m) => {
              const hora = m.createdAt
                ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "";
              if (m.remitente === REMITENTE_SISTEMA) {
                return <p key={m.id} className="tz-dlv-msg-sys">{m.mensaje}</p>;
              }
              const mine = m.remitente === remitentePropio;
              return (
                <div key={m.id} className={`tz-dlv-bubble ${mine ? "tz-dlv-bubble-mine" : ""}`}>
                  <p>{m.mensaje}</p>
                  <span className="tz-dlv-bubble-time">
                    {hora}
                    {mine &&
                      (m.leido ? (
                        <CheckCheck size={12} className="tz-dlv-check tz-dlv-check-leido" />
                      ) : (
                        <Check size={12} className="tz-dlv-check" />
                      ))}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="tz-dlv-chat-input">
          <input
            type="text"
            className="tz-input"
            placeholder="Escribe un mensaje…"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEnviar()}
            disabled={enviando}
          />
          <button
            type="button"
            className="tz-dlv-send"
            onClick={handleEnviar}
            disabled={enviando || !texto.trim()}
            aria-label="Enviar mensaje"
          >
            {enviando ? <Loader2 size={16} className="tz-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
