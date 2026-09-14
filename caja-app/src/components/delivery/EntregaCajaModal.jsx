import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Bike, MapPin, ShoppingBag, Send, Loader2, Ban, QrCode, Check, CheckCheck, PackageX, Plus } from "lucide-react";
import QRCode from "qrcode";
import { useEntregaCaja } from "../../hooks/useEntregaCaja";
import { useRadarReparto } from "../../hooks/useRadarReparto";
import { supabaseTaxi } from "../../lib/supabaseTaxi";
import MapaEntregaCaja from "./MapaEntregaCaja";
import { formatSoles } from "../../utils/format";

// Montos rápidos para la tarifa de envío — MISMOS valores que
// TARIFAS_RAPIDAS en el chat del conductor de Taxi-PE (mensajes
// directos de tarifa), reusados acá por pedido explícito: mismos
// chips, mismo "+" para un monto personalizado, solo que en vez de
// mandar un mensaje de oferta fijan la tarifa que se le ofrece al
// repartidor junto con el pedido.
const TARIFAS_RAPIDAS_ENVIO = [1.5, 3, 4.5];

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
  // Badge independiente por pestaña (Sucursal / Repartidor) — antes solo
  // se sabía si HABÍA algo sin leer en el hilo ABIERTO; ahora cada tab
  // muestra su propio contador aunque esté en la otra.
  const noLeidosDe = (h) =>
    mensajes.filter((m) => m.hilo === h && m.emisor_rol !== "sistema" && m.emisor_rol !== propioRol && !m.leido)
      .length;

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
        {hilos.map((h) => {
          const n = noLeidosDe(h.key);
          return (
          <button
            key={h.key}
            type="button"
            className={`tz-dlv-chat-tab ${hilo === h.key ? "tz-dlv-chat-tab-active" : ""}`}
            onClick={() => setHilo(h.key)}
          >
            {h.label}
            {n > 0 && <span className="tz-badge-dot">{n > 9 ? "9+" : n}</span>}
          </button>
          );
        })}
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
  const { entrega, mensajes, ofertas, loading, ofertar, expirarOferta, cancelar, enviarMensaje, marcarLeido, recargar } =
    useEntregaCaja(sessionToken, { rol });
  const buscando = entrega?.estado === "buscando";
  const { conductores } = useRadarReparto(buscando);
  const ofertaPorConductor = useMemo(
    () => Object.fromEntries((ofertas || []).map((o) => [o.conductor_id, o.estado])),
    [ofertas]
  );
  // Igual que arriba pero con el objeto completo (oferta_id/created_at)
  // — para la cuenta regresiva de 30s por conductor.
  const ofertaInfoPorConductor = useMemo(
    () => Object.fromEntries((ofertas || []).map((o) => [o.conductor_id, o])),
    [ofertas]
  );
  const rechazos = useMemo(() => (ofertas || []).filter((o) => o.estado === "rechazada"), [ofertas]);

  // Reloj de 30s por oferta pendiente (ver DELIVERY.md §9) — mismo
  // mecanismo que EntregasRepartidorPanel.jsx del lado repartidor:
  // quien vea la oferta vencida primero la expira, el RPC es idempotente.
  const TIMEOUT_OFERTA_MS = 30000;
  const [ahora, setAhora] = useState(() => Date.now());
  const expirandoRef = useRef(new Set());
  const ofertasPendientes = useMemo(() => (ofertas || []).filter((o) => o.estado === "pendiente"), [ofertas]);
  useEffect(() => {
    if (ofertasPendientes.length === 0) return undefined;
    const t = setInterval(() => setAhora(Date.now()), 250);
    return () => clearInterval(t);
  }, [ofertasPendientes.length]);
  useEffect(() => {
    ofertasPendientes.forEach((o) => {
      if (!o.created_at || expirandoRef.current.has(o.oferta_id)) return;
      if (ahora - new Date(o.created_at).getTime() >= TIMEOUT_OFERTA_MS) {
        expirandoRef.current.add(o.oferta_id);
        expirarOferta(o.oferta_id);
      }
    });
  }, [ahora, ofertasPendientes, expirarOferta]);
  const [busyId, setBusyId] = useState(null);
  const [aviso, setAviso] = useState("");
  const [accion, setAccion] = useState(false);
  const [verQr, setVerQr] = useState(false);
  // Tarifa de envío (lo que la Caja le paga al repartidor, aparte del
  // valor del pedido) — la carga el cajero antes de ofertar. Se manda
  // con cada oferta; el RPC la graba en la entrega la primera vez.
  const [tarifa, setTarifa] = useState("");
  const [mostrarTarifaCustom, setMostrarTarifaCustom] = useState(false);
  const tarifaNum = parseFloat(tarifa);
  const tarifaValida = !Number.isNaN(tarifaNum) && tarifaNum > 0;

  const hilos = useMemo(
    () =>
      rol === "cajero"
        ? [{ key: "cliente_cajero", label: "Cliente" }, { key: "cajero_conductor", label: "Repartidor" }]
        : [{ key: "cliente_cajero", label: "Sucursal" }, { key: "cliente_conductor", label: "Repartidor" }],
    [rol]
  );

  const onOfrecer = async (id) => {
    if (!tarifaValida) {
      setAviso("Cargá la tarifa de envío antes de ofertar.");
      return;
    }
    setBusyId(id);
    setAviso("");
    const r = await ofertar(id, tarifaNum);
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

  // Memoizados por VALOR (no solo por referencia): 'entrega' es un
  // objeto nuevo en cada poll/broadcast aunque las coordenadas no hayan
  // cambiado — sin esto, MapaEntregaCaja recibía 'destino'/'origen' con
  // identidad nueva todo el tiempo y su AjustarVista (fitBounds) se
  // reencuadraba de más, cortando la vista justo cuando llegaba una
  // posición nueva del repartidor.
  const destino = useMemo(
    () =>
      entrega?.entrega_lat && entrega?.entrega_lng
        ? { lat: Number(entrega.entrega_lat), lng: Number(entrega.entrega_lng) }
        : null,
    [entrega?.entrega_lat, entrega?.entrega_lng]
  );
  const origen = useMemo(
    () =>
      entrega?.origen_lat != null
        ? { lat: Number(entrega.origen_lat), lng: Number(entrega.origen_lng) }
        : null,
    [entrega?.origen_lat, entrega?.origen_lng]
  );

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
            <div className="tz-dlv-details-card">
              <p className="tz-dlv-details-row">
                <MapPin size={13} /> {entrega.direccion_entrega || "Sin dirección"}
              </p>
              <p className="tz-dlv-details-row">
                <ShoppingBag size={13} /> Monto del pedido: {formatSoles(entrega.total || 0)}
              </p>
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
            </div>

            <span className={`tz-dlv-badge tz-dlv-badge-${entrega.estado}`}>{entrega.estado.replace("_", " ")}</span>
            {entrega.conductor_nombre && (
              <p className="tz-stock-editor-sub" style={{ marginTop: 4 }}>Repartidor: {entrega.conductor_nombre}</p>
            )}
            {entrega.tarifa != null && (
              <p className="tz-stock-editor-sub" style={{ marginTop: 2, color: "var(--green)", fontWeight: 700 }}>
                💰 Tarifa de envío: {formatSoles(entrega.tarifa)}
              </p>
            )}

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
                <div className="tz-dlv-tarifa-row">
                  <label className="tz-field-label">Tarifa de envío (para el repartidor)</label>
                  <div className="tz-dlv-tarifa-quickrow">
                    {TARIFAS_RAPIDAS_ENVIO.map((valor) => (
                      <button
                        key={valor}
                        type="button"
                        className={`tz-dlv-tarifa-chip ${
                          tarifaValida && tarifaNum === valor ? "tz-dlv-tarifa-chip-activo" : ""
                        }`}
                        onClick={() => {
                          setTarifa(String(valor));
                          setMostrarTarifaCustom(false);
                        }}
                      >
                        S/ {valor.toFixed(2)}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="tz-dlv-tarifa-chip tz-dlv-tarifa-chip-plus"
                      onClick={() => setMostrarTarifaCustom((v) => !v)}
                      aria-label="Tarifa personalizada"
                      title="Tarifa personalizada"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                  {mostrarTarifaCustom && (
                    <div className="tz-dlv-tarifa-custom-row">
                      <input
                        type="number"
                        min="0.5"
                        step="0.10"
                        inputMode="decimal"
                        className="tz-text-input tz-dlv-tarifa-custom-input"
                        placeholder="Ej. 10.50"
                        value={tarifa}
                        onChange={(e) => setTarifa(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="tz-dlv-send"
                        onClick={() => setMostrarTarifaCustom(false)}
                        disabled={!tarifaValida}
                        aria-label="Confirmar tarifa"
                      >
                        <Send size={15} />
                      </button>
                    </div>
                  )}
                  <p className="tz-dlv-tarifa-hint">
                    El repartidor la ve antes de aceptar, aparte del monto del pedido que cobra en el mostrador.
                  </p>
                </div>
                <p className="tz-field-label" style={{ marginTop: 10 }}>
                  Repartidores en línea y verificados ({conductores.length})
                </p>
                {conductores.length === 0 ? (
                  <p className="tz-stock-editor-sub">Ninguno disponible ahora. Se actualiza solo.</p>
                ) : (
                  <ul className="tz-dlv-radar-list">
                    {conductores.map((c) => {
                      const est = ofertaPorConductor[c.id];
                      const infoOferta = ofertaInfoPorConductor[c.id];
                      const pct =
                        est === "pendiente" && infoOferta?.created_at
                          ? Math.max(0, Math.min(1, 1 - (ahora - new Date(infoOferta.created_at).getTime()) / TIMEOUT_OFERTA_MS))
                          : null;
                      return (
                        <li key={c.id} className={pct != null ? "tz-dlv-radar-item-timeout" : ""}>
                          <span>
                            {c.nombre} <em>· {c.placa || "s/placa"}</em>
                            {c.estado === "ocupado" && <span className="tz-dlv-tag-ocupado"> en carrera</span>}
                            {est === "rechazada" && <span className="tz-dlv-tag-rechazo"> rechazó</span>}
                          </span>
                          {est === "pendiente" ? (
                            <span className="tz-dlv-tag-espera">Esperando…</span>
                          ) : (
                            <button
                              className="tz-btn-mini"
                              disabled={busyId === c.id || !tarifaValida}
                              title={!tarifaValida ? "Cargá la tarifa de envío primero" : undefined}
                              onClick={() => onOfrecer(c.id)}
                            >
                              {busyId === c.id ? <Loader2 size={13} className="tz-spin" /> : <Send size={13} />}
                              {est === "rechazada" ? " Ofrecer de nuevo" : " Ofrecer"}
                            </button>
                          )}
                          {pct != null && (
                            <div className="tz-dlv-radar-timeout-track">
                              <div className="tz-dlv-radar-timeout-fill" style={{ width: `${pct * 100}%` }} />
                            </div>
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

            {/* --- ASIGNADO: PIN/QR + chat (el mapa ya está arriba, en la tarjeta de detalles) --- */}
            {["aceptado", "en_ruta"].includes(entrega.estado) && (
              <>
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
