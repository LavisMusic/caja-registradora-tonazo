import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Bike, MapPin, Send, Loader2, Ban, QrCode, Check, CheckCheck, PackageX } from "lucide-react";
import QRCode from "qrcode";
import { useEntregaCaja } from "../../hooks/useEntregaCaja";
import { useRadarReparto } from "../../hooks/useRadarReparto";
import { supabaseTaxi } from "../../lib/supabaseTaxi";
import MapaEntregaCaja from "./MapaEntregaCaja";
import { formatSoles } from "../../utils/format";

// Modal único de una entrega delivery en la app de Caja — lo usan el
// cajero/admin (desde el Gestor de Pedidos) y el cliente (desde Mis
// Pedidos). El contenido cambia según el estado:
//   buscando  → radar: ofrecer a repartidores en línea + verificados
//   aceptado/en_ruta → vista en vivo: mapa + chats + cancelar + PIN/QR
//   entregado/cancelado/no_entregado → cierre
// Ver DELIVERY.md §7.

function QrVisorModal({ pin, onClose }) {
  const [dataUrl, setDataUrl] = useState("");
  useEffect(() => {
    QRCode.toDataURL(String(pin), { width: 420, margin: 2 }).then(setDataUrl).catch(() => {});
  }, [pin]);
  // Portal a <body>: así no queda dentro del stacking-context del mapa
  // Leaflet (que se filtraba por encima).
  return createPortal(
    <div className="tz-modal-backdrop" style={{ zIndex: 3000 }} onClick={onClose}>
      <div className="tz-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360, textAlign: "center" }}>
        <button className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <h2>Código de la entrega</h2>
        <p className="tz-stock-editor-sub">Mostrá este QR al repartidor para confirmar la entrega.</p>
        {dataUrl ? (
          <img src={dataUrl} alt="QR de la entrega" style={{ width: "100%", maxWidth: 280, margin: "8px auto", borderRadius: 12, background: "#fff", padding: 8 }} />
        ) : (
          <Loader2 size={22} className="tz-spin" />
        )}
        <p className="tz-dlv-pin" style={{ justifyContent: "center", marginTop: 6 }}>
          PIN <b>{String(pin).split("").join(" ")}</b>
        </p>
      </div>
    </div>,
    document.body
  );
}

function Chat({ hilos, mensajes, enviarMensaje, marcarLeido, propioRol }) {
  const [hilo, setHilo] = useState(hilos[0].key);
  const [texto, setTexto] = useState("");
  const [busy, setBusy] = useState(false);
  const delHilo = mensajes.filter((m) => m.hilo === hilo);
  const noLeidosDeOtro = delHilo.filter(
    (m) => !["sistema"].includes(m.emisor_rol) && m.emisor_rol !== propioRol && !m.leido
  ).length;

  useEffect(() => {
    if (noLeidosDeOtro > 0) marcarLeido?.(hilo);
  }, [hilo, noLeidosDeOtro, marcarLeido]);

  const onEnviar = async () => {
    const t = texto.trim();
    if (!t) return;
    setTexto("");
    setBusy(true);
    await enviarMensaje(hilo, t);
    setBusy(false);
  };

  return (
    <>
      <div className="tz-dlv-chat-tabs">
        {hilos.map((h) => (
          <button
            key={h.key}
            type="button"
            className={`tz-dlv-chat-tab ${hilo === h.key ? "tz-dlv-chat-tab-active" : ""}`}
            onClick={() => setHilo(h.key)}
          >
            {h.label}
          </button>
        ))}
      </div>
      <div className="tz-dlv-chat-scroll">
        {delHilo.length === 0 ? (
          <p className="tz-dlv-chat-empty">Sin mensajes todavía.</p>
        ) : (
          delHilo.map((m) => {
            const mine = ["cajero", "cliente"].includes(m.emisor_rol) && m.emisor_rol === propioRol;
            const hora = m.created_at
              ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "";
            if (m.emisor_rol === "sistema") {
              return <p key={m.id} className="tz-dlv-msg-sys">{m.mensaje}</p>;
            }
            return (
              <div key={m.id} className={`tz-dlv-bubble ${mine ? "tz-dlv-bubble-mine" : ""}`}>
                <p>{m.mensaje}</p>
                <span className="tz-dlv-bubble-time">
                  {hora}
                  {mine && (m.leido
                    ? <CheckCheck size={12} className="tz-dlv-check tz-dlv-check-leido" />
                    : <Check size={12} className="tz-dlv-check" />)}
                </span>
              </div>
            );
          })
        )}
      </div>
      <div className="tz-dlv-chat-input">
        <input
          className="tz-input"
          placeholder="Escribe un mensaje…"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onEnviar()}
        />
        <button className="tz-dlv-send" onClick={onEnviar} disabled={busy || !texto.trim()}>
          {busy ? <Loader2 size={16} className="tz-spin" /> : <Send size={16} />}
        </button>
      </div>
    </>
  );
}

export default function EntregaCajaModal({ sessionToken, rol = "cajero", esAdmin = false, onClose }) {
  const { entrega, mensajes, ofertas, loading, ofertar, cancelar, enviarMensaje, marcarLeido, recargar } = useEntregaCaja(sessionToken, { rol });
  const buscando = entrega?.estado === "buscando";
  const { conductores } = useRadarReparto(buscando);
  const ofertaPorConductor = useMemo(
    () => Object.fromEntries((ofertas || []).map((o) => [o.conductor_id, o.estado])),
    [ofertas]
  );
  const rechazos = useMemo(() => (ofertas || []).filter((o) => o.estado === "rechazada"), [ofertas]);
  const [busyId, setBusyId] = useState(null);
  const [aviso, setAviso] = useState("");
  const [accion, setAccion] = useState(false);
  const [verQr, setVerQr] = useState(false);

  const hilos = useMemo(
    () =>
      rol === "cajero"
        ? [{ key: "cliente_cajero", label: "Cliente" }, { key: "cajero_conductor", label: "Repartidor" }]
        : [{ key: "cliente_cajero", label: "Sucursal" }, { key: "cliente_conductor", label: "Repartidor" }],
    [rol]
  );

  const onOfrecer = async (id) => {
    setBusyId(id);
    setAviso("");
    const r = await ofertar(id);
    setBusyId(null);
    if (r.status && r.status !== "ok") setAviso(`No se pudo ofrecer (${r.status}).`);
  };

  const onCancelar = async () => {
    if (!confirm("¿Cancelar este pedido de delivery?")) return;
    setAccion(true);
    await cancelar(rol === "cliente" ? "cancelado por el cliente" : "cancelado por la sucursal");
    setAccion(false);
  };

  const onNoEntregado = async () => {
    if (!confirm("Cerrar como NO ENTREGADO (el cliente no apareció / devolución)?")) return;
    setAccion(true);
    await supabaseTaxi.rpc("rpc_entrega_no_entregado", { p_entrega_id: entrega.id, p_motivo: "cierre admin" });
    await recargar();
    setAccion(false);
  };

  const destino =
    entrega?.entrega_lat && entrega?.entrega_lng
      ? { lat: Number(entrega.entrega_lat), lng: Number(entrega.entrega_lng) }
      : null;
  const origen =
    entrega?.origen_lat != null
      ? { lat: Number(entrega.origen_lat), lng: Number(entrega.origen_lng) }
      : null;

  return (
    <div className="tz-modal-backdrop">
      <div className="tz-modal" onClick={(e) => e.stopPropagation()}>
        <button className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <h2><Bike size={18} style={{ verticalAlign: "-3px" }} /> Entrega delivery</h2>

        {loading ? (
          <p className="tz-stock-editor-sub"><Loader2 size={16} className="tz-spin" /> Cargando…</p>
        ) : !entrega ? (
          <p className="tz-error">No se encontró la entrega.</p>
        ) : (
          <>
            <p className="tz-stock-editor-sub" style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <MapPin size={13} /> {entrega.direccion_entrega || "Sin dirección"} · Total {formatSoles(entrega.total || 0)}
              {entrega.conductor_nombre && ` · Repartidor: ${entrega.conductor_nombre}`}
            </p>
            <span className={`tz-dlv-badge tz-dlv-badge-${entrega.estado}`}>{entrega.estado.replace("_", " ")}</span>

            {/* --- BUSCANDO: radar de repartidores (solo cajero) --- */}
            {buscando && rol === "cajero" && (
              <div className="tz-dlv-radar">
                {rechazos.length > 0 && (
                  <div className="tz-dlv-rechazos">
                    {rechazos.map((r) => (
                      <p key={r.conductor_id} className="tz-dlv-rechazo">
                        🚫 <strong>{r.conductor_nombre || "Un repartidor"}</strong> rechazó la oferta.
                      </p>
                    ))}
                  </div>
                )}
                <p className="tz-field-label" style={{ marginTop: 10 }}>
                  Repartidores en línea y verificados ({conductores.length})
                </p>
                {conductores.length === 0 ? (
                  <p className="tz-stock-editor-sub">Ninguno disponible ahora. Se actualiza solo.</p>
                ) : (
                  <ul className="tz-dlv-radar-list">
                    {conductores.map((c) => {
                      const est = ofertaPorConductor[c.id];
                      return (
                        <li key={c.id}>
                          <span>
                            {c.nombre} <em>· {c.placa || "s/placa"}</em>
                            {c.estado === "ocupado" && <span className="tz-dlv-tag-ocupado"> en carrera</span>}
                            {est === "rechazada" && <span className="tz-dlv-tag-rechazo"> rechazó</span>}
                          </span>
                          {est === "pendiente" ? (
                            <span className="tz-dlv-tag-espera">Esperando…</span>
                          ) : (
                            <button className="tz-btn-mini" disabled={busyId === c.id} onClick={() => onOfrecer(c.id)}>
                              {busyId === c.id ? <Loader2 size={13} className="tz-spin" /> : <Send size={13} />}
                              {est === "rechazada" ? " Ofrecer de nuevo" : " Ofrecer"}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
                {aviso && <p className="tz-error">{aviso}</p>}
                <button className="tz-btn-ghost tz-dlv-cancelar" disabled={accion} onClick={onCancelar}>
                  <Ban size={14} /> Cancelar pedido
                </button>
              </div>
            )}
            {buscando && rol === "cliente" && (
              <p className="tz-stock-editor-sub" style={{ marginTop: 10 }}>
                La tienda está buscando un repartidor para tu pedido…
                <button className="tz-btn-ghost tz-dlv-cancelar" style={{ marginTop: 10 }} disabled={accion} onClick={onCancelar}>
                  <Ban size={14} /> Cancelar pedido
                </button>
              </p>
            )}

            {/* --- ASIGNADO: vista en vivo --- */}
            {["aceptado", "en_ruta"].includes(entrega.estado) && (
              <>
                <MapaEntregaCaja
                  entregaId={entrega.id}
                  conductorId={entrega.conductor_id}
                  destino={destino}
                  origen={origen}
                  posInicial={
                    entrega.repartidor_lat != null
                      ? { lat: Number(entrega.repartidor_lat), lng: Number(entrega.repartidor_lng), at: entrega.repartidor_pos_at }
                      : null
                  }
                />

                {/* PIN + botón QR + cancelar/no-entregado — todo en una línea */}
                <div className="tz-dlv-pin-row">
                  <span className="tz-dlv-pin">PIN <b>{String(entrega.pin || "").split("").join(" ")}</b></span>
                  <button className="tz-dlv-qr-btn" onClick={() => setVerQr(true)} aria-label="Ver QR" title="Ver QR">
                    <QrCode size={18} />
                  </button>
                  {entrega.estado === "aceptado" && (
                    <button className="tz-btn-ghost tz-dlv-cancelar" disabled={accion} onClick={onCancelar}>
                      <Ban size={14} /> Cancelar pedido
                    </button>
                  )}
                  {esAdmin && entrega.estado === "en_ruta" && (
                    <button className="tz-btn-ghost tz-dlv-cancelar" disabled={accion} onClick={onNoEntregado}>
                      <PackageX size={14} /> No se entregó
                    </button>
                  )}
                </div>

                <Chat hilos={hilos} mensajes={mensajes} enviarMensaje={enviarMensaje} marcarLeido={marcarLeido} propioRol={rol} />
              </>
            )}

            {/* --- CERRADA --- */}
            {["entregado", "cancelado", "no_entregado"].includes(entrega.estado) && (
              <p className="tz-stock-editor-sub" style={{ marginTop: 12, display: "flex", gap: 6, alignItems: "center" }}>
                {entrega.estado === "entregado" ? <Check size={16} color="#39ffac" /> : <Ban size={16} color="#ff5470" />}
                {entrega.estado === "entregado"
                  ? "Entrega confirmada por el repartidor."
                  : entrega.estado === "no_entregado"
                    ? "Cerrada como no entregada (devolución)."
                    : "Pedido cancelado."}
              </p>
            )}
          </>
        )}
      </div>

      {verQr && entrega?.pin && <QrVisorModal pin={entrega.pin} onClose={() => setVerQr(false)} />}
    </div>
  );
}
