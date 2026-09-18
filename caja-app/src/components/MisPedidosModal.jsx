import { useCallback, useEffect, useRef, useState } from "react";
import { X, MessageCircle, Loader2, Ban, Trash2, Bike, Store, Copy } from "lucide-react";
import { supabase } from "../supabaseClient";
import { supabaseTaxi } from "../lib/supabaseTaxi";
import ChatPedidoModal from "./ChatPedidoModal";
import EntregaCajaModal from "./delivery/EntregaCajaModal";
import TicketBoleta from "./TicketBoleta";
import { formatSoles, formatDate, formatTime } from "../utils/format";
import { buildWhatsappLink } from "../lib/whatsapp";
import { copiarBoletaAlPortapapeles } from "../lib/boleta";
import { usePedidosNoLeidos } from "../hooks/usePedidosNoLeidos";

const METODO_LABELS = { YAPE: "Yape", PLIN: "Plin", OTROS: "Otros", EFECTIVO: "Efectivo", FIADO: "Fiado" };

const ESTADO_LABELS = {
  nuevo: "Nuevo",
  en_atencion: "En atención",
  confirmado: "Entregado",
  cancelado: "Cancelado",
};

// Mismo agrupamiento de 3 baldes que el filtro del Gestor de Pedidos
// (GestorPedidosModal.jsx) — "en carrera" junta nuevo/en_atencion.
function estadoGrupo(pedido) {
  if (pedido.estado === "confirmado") return "entregado";
  if (pedido.estado === "cancelado") return "cancelado";
  return "en_carrera";
}

// "Mis Pedidos" del cliente: sus propios pedidos (RLS ya garantiza que
// solo vea los suyos), con acceso directo al chat de cada uno — así el
// cliente puede seguir hablando con la tienda incluso después de haber
// cerrado la pantalla de confirmación del checkout.
export default function MisPedidosModal({ session, onClose }) {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatPedidoId, setChatPedidoId] = useState(null);
  const [cancelandoId, setCancelandoId] = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [entregaToken, setEntregaToken] = useState(null);
  const [misDatos, setMisDatos] = useState(null);
  const [boletaPedido, setBoletaPedido] = useState(null);
  const [boletaExtra, setBoletaExtra] = useState(null); // { sede, entrega }
  const [boletaMsg, setBoletaMsg] = useState("");
  const [filtroEstado, setFiltroEstado] = useState(null); // 'en_carrera' | 'entregado' | 'cancelado' | null
  const boletaRef = useRef(null);
  // Ventana de WhatsApp abierta EN BLANCO de forma síncrona en el click
  // (ver el botón "Enviar boleta por WhatsApp") y redirigida recién al
  // terminar el trabajo async — si se llama window.open() después de un
  // await, mobile Chrome lo bloquea como popup.
  const whatsappWinRef = useRef(null);
  const { counts: noLeidos, refrescar: refrescarNoLeidos } = usePedidosNoLeidos(
    pedidos.map((p) => p.id),
    "cliente"
  );

  useEffect(() => {
    if (!session?.user?.id) return;
    supabase
      .from("clientes_fiado")
      .select("nombre, whatsapp")
      .eq("auth_user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setMisDatos(data || null));
  }, [session]);

  // Copiar boleta → abrir WhatsApp propio (o descargar si el navegador no deja copiar).
  // Antes de rasterizar, carga los datos de entrega (sede, repartidor,
  // dirección) desde la sesión de entrega en Taxi-PE + la sede de la Caja.
  useEffect(() => {
    if (!boletaPedido) return;
    let alive = true;
    (async () => {
      const extra = { sede: "", entrega: null };
      try {
        if (boletaPedido.sucursal_id) {
          const { data: suc } = await supabase
            .from("sucursales")
            .select("nombre")
            .eq("id", boletaPedido.sucursal_id)
            .maybeSingle();
          if (suc?.nombre) extra.sede = suc.nombre;
        }
        if (boletaPedido.entrega_session_token) {
          const { data: est } = await supabaseTaxi.rpc("rpc_entrega_estado", {
            p_session_token: boletaPedido.entrega_session_token,
          });
          const e = Array.isArray(est) ? est[0] : est;
          if (e) {
            extra.entrega = {
              repartidor: e.conductor_nombre || "",
              direccion: e.direccion_entrega || boletaPedido.direccion_entrega || "",
              tarifa: e.tarifa != null ? Number(e.tarifa) : null,
            };
            if (e.caja_sucursal && !extra.sede) extra.sede = e.caja_sucursal;
          }
        } else if (boletaPedido.requiere_delivery) {
          extra.entrega = { repartidor: "", direccion: boletaPedido.direccion_entrega || "" };
        }
      } catch {
        /* si falla, la boleta igual sale sin esos datos */
      }
      if (!alive) return;
      setBoletaExtra(extra);
      await new Promise((r) => setTimeout(r, 60)); // dejar repintar TicketBoleta
      if (!alive) return;
      try {
        const res = await copiarBoletaAlPortapapeles(boletaRef);
        setBoletaMsg(res?.descargado ? "Se descargó la boleta — adjuntala en tu chat." : "Boleta copiada. Pegala en tu chat.");
        const link = buildWhatsappLink(misDatos?.whatsapp, "Aquí está mi boleta");
        const win = whatsappWinRef.current;
        if (link) {
          if (win && !win.closed) win.location.href = link;
          else window.open(link, "_blank");
        } else if (win && !win.closed) {
          win.close();
        }
      } catch (err) {
        setBoletaMsg(err?.message || "No se pudo generar la boleta.");
        if (whatsappWinRef.current && !whatsappWinRef.current.closed) whatsappWinRef.current.close();
      } finally {
        whatsappWinRef.current = null;
        if (alive) {
          setBoletaPedido(null);
          setBoletaExtra(null);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [boletaPedido, misDatos]);

  const load = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("pedidos")
      .select("*, pedido_items(*)")
      .eq("cliente_id", session.user.id)
      .eq("oculto_cliente", false)
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
    }
    await load();
    setCancelandoId(null);
  };

  // Solo lo saca de MI historial — la tienda lo sigue viendo en el suyo.
  const eliminarPedido = async (pedidoId) => {
    if (!confirm("¿Sacar este pedido de tu historial?")) return;
    setEliminandoId(pedidoId);
    setPedidos((prev) => prev.filter((p) => p.id !== pedidoId));
    const { error } = await supabase.from("pedidos").update({ oculto_cliente: true }).eq("id", pedidoId);
    if (error) {
      console.error("[MisPedidosModal] Error ocultando pedido:", error);
      load();
    }
    setEliminandoId(null);
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

  const pedidosVisibles = filtroEstado ? pedidos.filter((p) => estadoGrupo(p) === filtroEstado) : pedidos;

  return (
    <div className="tz-modal-backdrop">
      <div className="tz-modal tz-modal-wide" onClick={(e) => e.stopPropagation()}>
        <button className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <h2>Mis Pedidos</h2>

        {pedidos.length > 0 && (
          <div className="tz-gasto-tipo-buttons" style={{ margin: "0 0 12px", gap: 6 }}>
            {[
              ["en_carrera", "En carrera"],
              ["entregado", "Entregado"],
              ["cancelado", "Cancelado"],
            ].map(([k, txt]) => (
              <button
                key={k}
                type="button"
                className={`tz-filtro-estado-chip tz-filtro-estado-chip-${k} ${
                  filtroEstado === k ? "tz-filtro-estado-chip-activo" : ""
                }`}
                onClick={() => setFiltroEstado((prev) => (prev === k ? null : k))}
              >
                {txt}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="tz-stock-editor-sub">
            <Loader2 className="tz-spin" size={16} /> Cargando...
          </p>
        ) : pedidos.length === 0 ? (
          <p className="tz-stock-editor-sub">Todavía no has hecho ningún pedido.</p>
        ) : pedidosVisibles.length === 0 ? (
          <p className="tz-stock-editor-sub">Ningún pedido coincide con ese filtro.</p>
        ) : (
          <div className="tz-pedidos-list">
            {pedidosVisibles.map((pedido) => (
              <div key={pedido.id} className="tz-pedido-card">
                <div className="tz-pedido-card-head">
                  <span className="tz-pedido-cliente-nombre">
                    {formatDate(pedido.created_at)} {formatTime(pedido.created_at)}
                  </span>
                  <span className={`tz-pedido-modo-tag ${pedido.requiere_delivery ? "tz-pedido-modo-delivery" : "tz-pedido-modo-tienda"}`}>
                    {pedido.requiere_delivery ? <Bike size={12} /> : <Store size={12} />}
                    {pedido.requiere_delivery ? "Delivery" : "Retiro en tienda"}
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
                  {pedido.entrega_session_token ? (
                    <button
                      type="button"
                      className="tz-pedido-action-btn"
                      onClick={() => setEntregaToken(pedido.entrega_session_token)}
                    >
                      <Bike size={14} /> {["confirmado", "cancelado"].includes(pedido.estado) ? "Ver entrega" : "Seguir mi pedido"}
                    </button>
                  ) : (
                    pedido.estado !== "confirmado" && pedido.estado !== "cancelado" && (
                      <button
                        type="button"
                        className="tz-pedido-action-btn"
                        style={{ position: "relative" }}
                        onClick={() => setChatPedidoId(pedido.id)}
                      >
                        <MessageCircle size={14} /> Chat con la tienda
                        {noLeidos[pedido.id] > 0 && (
                          <span className="tz-badge-dot">{noLeidos[pedido.id] > 9 ? "9+" : noLeidos[pedido.id]}</span>
                        )}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    className="tz-pedido-action-btn"
                    onClick={() => {
                      whatsappWinRef.current = window.open("", "_blank");
                      setBoletaMsg("");
                      setBoletaPedido(pedido);
                    }}
                    disabled={boletaPedido?.id === pedido.id}
                  >
                    {boletaPedido?.id === pedido.id ? <Loader2 size={14} className="tz-spin" /> : <Copy size={14} />}
                    Enviar boleta por WhatsApp
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
                  {(pedido.estado === "confirmado" || pedido.estado === "cancelado") && (
                    <button
                      type="button"
                      className="tz-pedido-action-btn tz-pedido-action-cancelar"
                      onClick={() => eliminarPedido(pedido.id)}
                      disabled={eliminandoId === pedido.id}
                    >
                      {eliminandoId === pedido.id ? <Loader2 size={14} className="tz-spin" /> : <Trash2 size={14} />}
                      Eliminar del historial
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {boletaMsg && <p className="tz-stock-editor-sub" style={{ marginTop: 6 }}>{boletaMsg}</p>}
      </div>

      {chatPedidoId && (
        <ChatPedidoModal
          pedidoId={chatPedidoId}
          remitentePropio="cliente"
          tituloChat="Chat con la tienda"
          onClose={() => {
            setChatPedidoId(null);
            refrescarNoLeidos();
          }}
        />
      )}

      {/* TicketBoleta oculto para rasterizar al enviar por WhatsApp */}
      {boletaPedido && (
        <div style={{ position: "fixed", top: 0, left: "-9999px" }}>
          <div ref={boletaRef}>
            <TicketBoleta
              orden={{
                id: boletaPedido.id.slice(0, 8),
                fecha: formatDate(boletaPedido.created_at),
                hora: formatTime(boletaPedido.created_at),
                cajero: "-",
              }}
              cliente={{ nombre: misDatos?.nombre || "" }}
              sede={boletaExtra?.sede || ""}
              entrega={boletaExtra?.entrega || null}
              productos={(boletaPedido.pedido_items || []).map((it) => ({
                cantidad: it.cantidad,
                nombre: it.nombre,
                precioUnitario: it.precio_unitario,
                subtotal: it.subtotal,
                ventaPorPeso: it.venta_por_peso,
              }))}
              totales={{
                metodoPago: METODO_LABELS[boletaPedido.metodo_pago] || boletaPedido.metodo_pago,
                totalPagar: boletaPedido.total,
                efectivoRecibido: boletaPedido.metodo_pago === "EFECTIVO" ? boletaPedido.monto_recibido : null,
                vuelto: boletaPedido.vuelto,
              }}
            />
          </div>
        </div>
      )}

      {entregaToken && (
        <EntregaCajaModal
          sessionToken={entregaToken}
          rol="cliente"
          esAdmin={false}
          onClose={() => {
            setEntregaToken(null);
            load();
          }}
        />
      )}
    </div>
  );
}
