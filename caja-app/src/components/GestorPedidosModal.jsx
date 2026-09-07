import { useEffect, useRef, useState } from "react";
import { X, MessageCircle, Check, Ban, Copy, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "../supabaseClient";
import { usePedidos } from "../hooks/usePedidos";
import ChatPedidoModal from "./ChatPedidoModal";
import TicketBoleta from "./TicketBoleta";
import { formatSoles, formatDate, formatTime } from "../utils/format";
import { buildWhatsappLink } from "../lib/whatsapp";
import { copiarBoletaAlPortapapeles } from "../lib/boleta";

const ESTADO_LABELS = {
  nuevo: "Nuevo",
  en_atencion: "En atención",
  confirmado: "Entregado",
  cancelado: "Cancelado",
};

const METODO_LABELS = {
  YAPE: "Yape",
  PLIN: "Plin",
  OTROS: "Otros",
  EFECTIVO: "Efectivo",
  FIADO: "Fiado",
};

// Gestor de Pedidos (Fase 1): modal en la cabecera de admin/cajero que
// lista los pedidos hechos por clientes desde la tienda pública,
// filtrados por la sucursal operativa (misma que ya usa el resto de la
// app — RLS además lo garantiza del lado del servidor). El punto
// celeste antes de cada fila marca que es un chat de un CLIENTE de la
// tienda (a futuro, cuando existan chats de conductores en este mismo
// modal, ese punto es lo que los va a distinguir).
export default function GestorPedidosModal({ sucursalId, cajaId, vendedorLabel, onClose }) {
  const { pedidos, loading, error, refetch } = usePedidos(sucursalId);
  const [clientesInfo, setClientesInfo] = useState({}); // { [authUserId]: {nombre, whatsapp} }
  const [chatPedido, setChatPedido] = useState(null);
  const [procesandoId, setProcesandoId] = useState(null);
  const [accionError, setAccionError] = useState("");
  const [boletaPedido, setBoletaPedido] = useState(null);
  const boletaRef = useRef(null);

  // Nombre/whatsapp del cliente de cada pedido: 'pedidos.cliente_id' es
  // el auth.users.id (mismo que usa la sesión de Supabase Auth del
  // cliente) — se resuelve contra 'clientes_fiado.auth_user_id', igual
  // patrón que ClienteFiadoView.jsx usa a la inversa.
  useEffect(() => {
    const ids = [...new Set(pedidos.map((p) => p.clienteId).filter(Boolean))];
    if (ids.length === 0) return;
    let active = true;
    supabase
      .from("clientes_fiado")
      .select("auth_user_id, nombre, whatsapp")
      .in("auth_user_id", ids)
      .then(({ data, error: err }) => {
        if (!active) return;
        if (err) {
          console.error("[GestorPedidosModal] Error cargando datos de clientes:", err);
          return;
        }
        const map = {};
        (data || []).forEach((row) => {
          map[row.auth_user_id] = { nombre: row.nombre, whatsapp: row.whatsapp };
        });
        setClientesInfo(map);
      });
    return () => {
      active = false;
    };
  }, [pedidos]);

  const confirmarEntrega = async (pedido) => {
    setAccionError("");
    setProcesandoId(pedido.id);
    try {
      const { error: rpcError } = await supabase.rpc("registrar_venta", {
        p_purchase_id: pedido.id,
        p_items: pedido.items.map((it) => ({
          producto_id: it.productoId,
          nombre: it.nombre,
          detalle: "",
          cantidad: it.cantidad,
          precio: it.precioUnitario,
          total: it.subtotal,
          costo_unitario: null,
          costo_total: null,
          venta_por_peso: it.ventaPorPeso,
        })),
        p_metodo_pago: pedido.metodoPago,
        p_vendedor: vendedorLabel,
        p_fecha: Date.now(),
        p_monto_recibido: pedido.montoRecibido,
        p_vuelto: pedido.vuelto,
        p_ruc: null,
        p_caja_id: cajaId,
        p_sucursal_id: sucursalId,
      });
      if (rpcError) throw rpcError;

      const { error: updateError } = await supabase
        .from("pedidos")
        .update({ estado: "confirmado" })
        .eq("id", pedido.id);
      if (updateError) throw updateError;

      await supabase.from("pedido_mensajes").insert([
        {
          pedido_id: pedido.id,
          remitente: "sistema",
          mensaje: "✅ Tu pedido fue entregado. ¡Gracias por tu compra!",
        },
      ]);

      refetch();
    } catch (err) {
      console.error("[GestorPedidosModal] Error confirmando entrega:", err);
      setAccionError(err?.message || "No se pudo registrar la venta. Intenta de nuevo.");
    } finally {
      setProcesandoId(null);
    }
  };

  const cancelarPedido = async (pedido) => {
    setAccionError("");
    setProcesandoId(pedido.id);
    const { error: updateError } = await supabase
      .from("pedidos")
      .update({ estado: "cancelado" })
      .eq("id", pedido.id);
    if (updateError) {
      console.error("[GestorPedidosModal] Error cancelando pedido:", updateError);
      setAccionError("No se pudo cancelar el pedido.");
    } else {
      await supabase.from("pedido_mensajes").insert([
        { pedido_id: pedido.id, remitente: "sistema", mensaje: "❌ El pedido fue cancelado." },
      ]);
      refetch();
    }
    setProcesandoId(null);
  };

  // Copiar boleta + abrir WhatsApp: monta TicketBoleta oculto con los
  // datos de ESTE pedido, espera a que pinte, la copia al portapapeles
  // y recién ahí abre el chat de WhatsApp del cliente — mismo patrón de
  // "copiar y pegar a mano" que ya usa App.jsx (wa.me no admite adjuntar
  // una imagen directo).
  useEffect(() => {
    if (!boletaPedido) return;
    const cliente = clientesInfo[boletaPedido.clienteId];
    const timer = setTimeout(async () => {
      try {
        await copiarBoletaAlPortapapeles(boletaRef);
        const link = buildWhatsappLink(
          cliente?.whatsapp,
          "Atento tu pedido está en camino! Aquí está tu boleta"
        );
        if (link) {
          window.open(link, "_blank");
        } else {
          setAccionError("Este cliente no tiene un WhatsApp válido registrado.");
        }
      } catch (err) {
        console.error("[GestorPedidosModal] Error copiando boleta:", err);
        setAccionError(err?.message || "No se pudo copiar la boleta.");
      } finally {
        setBoletaPedido(null);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [boletaPedido, clientesInfo]);

  return (
    <div className="tz-modal-backdrop">
      <div className="tz-modal tz-modal-wide" onClick={(e) => e.stopPropagation()}>
        <button className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <h2>Gestor de Pedidos</h2>

        {accionError && (
          <p className="tz-error">
            <AlertTriangle size={14} /> {accionError}
          </p>
        )}

        {loading ? (
          <p className="tz-stock-editor-sub">
            <Loader2 className="tz-spin" size={16} /> Cargando pedidos...
          </p>
        ) : error ? (
          <p className="tz-error">{error}</p>
        ) : pedidos.length === 0 ? (
          <p className="tz-stock-editor-sub">Todavía no hay pedidos en esta sucursal.</p>
        ) : (
          <div className="tz-pedidos-list">
            {pedidos.map((pedido) => {
              const cliente = clientesInfo[pedido.clienteId];
              const procesando = procesandoId === pedido.id;
              const activo = pedido.estado === "nuevo" || pedido.estado === "en_atencion";
              return (
                <div key={pedido.id} className="tz-pedido-card">
                  <div className="tz-pedido-card-head">
                    <span className={`tz-chat-dot ${activo ? "tz-chat-dot-activo" : ""}`} />
                    <span className="tz-pedido-cliente-nombre">
                      {cliente?.nombre || "Cliente"}
                    </span>
                    <span className={`tz-pedido-estado tz-pedido-estado-${pedido.estado}`}>
                      {ESTADO_LABELS[pedido.estado] || pedido.estado}
                    </span>
                  </div>
                  <div className="tz-pedido-card-meta">
                    {formatDate(pedido.createdAt)} {formatTime(pedido.createdAt)} ·{" "}
                    {METODO_LABELS[pedido.metodoPago] || pedido.metodoPago}
                    {pedido.metodoPago === "EFECTIVO" && pedido.montoRecibido != null && (
                      <> · Paga con {formatSoles(pedido.montoRecibido)} (vuelto {formatSoles(pedido.vuelto || 0)})</>
                    )}
                  </div>
                  <ul className="tz-pedido-items-list">
                    {pedido.items.map((it) => (
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
                      onClick={() => setChatPedido(pedido)}
                    >
                      <MessageCircle size={14} /> Ver chat
                    </button>
                    <button
                      type="button"
                      className="tz-pedido-action-btn"
                      onClick={() => setBoletaPedido(pedido)}
                      disabled={boletaPedido?.id === pedido.id}
                    >
                      <Copy size={14} /> Copiar boleta y WhatsApp
                    </button>
                    {activo && (
                      <>
                        <button
                          type="button"
                          className="tz-pedido-action-btn tz-pedido-action-confirmar"
                          onClick={() => confirmarEntrega(pedido)}
                          disabled={procesando}
                        >
                          {procesando ? <Loader2 size={14} className="tz-spin" /> : <Check size={14} />}
                          Confirmar entregado
                        </button>
                        <button
                          type="button"
                          className="tz-pedido-action-btn tz-pedido-action-cancelar"
                          onClick={() => cancelarPedido(pedido)}
                          disabled={procesando}
                        >
                          <Ban size={14} /> Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {chatPedido && (
        <ChatPedidoModal
          pedidoId={chatPedido.id}
          remitentePropio="cajero"
          tituloChat={`Chat con ${clientesInfo[chatPedido.clienteId]?.nombre || "cliente"}`}
          onClose={() => setChatPedido(null)}
        />
      )}

      {boletaPedido && (
        <div style={{ position: "fixed", top: 0, left: "-9999px" }}>
          <div ref={boletaRef}>
            <TicketBoleta
              orden={{
                id: boletaPedido.id.slice(0, 8),
                fecha: formatDate(boletaPedido.createdAt),
                hora: formatTime(boletaPedido.createdAt),
                cajero: vendedorLabel,
              }}
              cliente={{ nombre: clientesInfo[boletaPedido.clienteId]?.nombre || "" }}
              productos={boletaPedido.items.map((it) => ({
                cantidad: it.cantidad,
                nombre: it.nombre,
                precioUnitario: it.precioUnitario,
                subtotal: it.subtotal,
                ventaPorPeso: it.ventaPorPeso,
              }))}
              totales={{
                metodoPago: METODO_LABELS[boletaPedido.metodoPago] || boletaPedido.metodoPago,
                totalPagar: boletaPedido.total,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
