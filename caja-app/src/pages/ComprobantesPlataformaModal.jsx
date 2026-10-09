import { useEffect, useMemo, useState } from "react";
import { X, CreditCard, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "../supabaseClient";
import Styles from "../components/Styles";
import { formatSoles } from "../utils/format";
import { formatFechaCorta } from "../lib/planes";

// Gestor de comprobantes del super admin — menú "Pagos" de la cabecera
// (Efectivo / Yape / Plin / Otros), mismo modal que "Pagos" del admin de
// Taxi-PE: medidores Hoy / Histórico + el historial de cobros de ESE
// método con su foto de comprobante (o el efectivo recibido y el vuelto).
// Diseño igual al de "Pagos" de las cajas: filas que se despliegan con
// hora, fecha, código, negocio y la foto del comprobante.
// Toma los pagos de planes no anulados: Recarga rápida y peticiones
// aprobadas. "Otros" incluye las transferencias.
const formatHora = (iso) => new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });

export const METODOS_PAGO_SA = [
  { key: "efectivo", label: "Efectivo" },
  { key: "yape", label: "Yape" },
  { key: "plin", label: "Plin" },
  { key: "otros", label: "Otros" },
];

export function grupoMetodo(metodo) {
  const m = String(metodo || "").toLowerCase();
  if (m === "efectivo") return "efectivo";
  if (m === "yape") return "yape";
  if (m === "plin") return "plin";
  return "otros";
}

export default function ComprobantesPlataformaModal({ metodo, negocios, onClose }) {
  const label = METODOS_PAGO_SA.find((m) => m.key === metodo)?.label ?? metodo;
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ver, setVer] = useState(null);
  const [abiertoId, setAbiertoId] = useState(null);

  useEffect(() => {
    let activo = true;
    supabase
      .from("pagos_plataforma")
      .select("*")
      .eq("anulado", false)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!activo) return;
        setPagos((data || []).filter((p) => grupoMetodo(p.metodo) === metodo));
        setLoading(false);
      });
    return () => {
      activo = false;
    };
  }, [metodo]);

  const inicioHoy = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);
  const totalHoy = pagos.filter((p) => new Date(p.created_at).getTime() >= inicioHoy).reduce((s, p) => s + Number(p.monto || 0), 0);
  const totalHistorico = pagos.reduce((s, p) => s + Number(p.monto || 0), 0);
  const nombreNegocio = (id) => negocios.find((n) => n.id === id)?.nombre || "Negocio eliminado";

  return (
    <div className="tz-modal-backdrop">
      <Styles />
      <div className="tz-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <div className="tz-payment-modal">
          <h2>
            <CreditCard size={17} /> {label}
          </h2>
          <div className="tz-method-totals">
            <div className="tz-method-total">
              <span>Hoy</span>
              <strong className="tz-green">{formatSoles(totalHoy)}</strong>
            </div>
            <div className="tz-method-total">
              <span>Histórico</span>
              <strong>{formatSoles(totalHistorico)}</strong>
            </div>
          </div>

          {loading ? (
            <Loader2 size={18} className="tz-spin" />
          ) : pagos.length === 0 ? (
            <p className="tz-method-history-empty">Aún no hay cobros registrados por esta vía.</p>
          ) : (
            <div className="tz-method-history">
              <span className="tz-method-history-label">Historial</span>
              <ul className="tz-history-rows">
                {pagos.map((p) => {
                  const abierto = abiertoId === p.id;
                  return (
                    <li key={p.id} className="tz-history-row">
                      <button className="tz-history-row-head" onClick={() => setAbiertoId(abierto ? null : p.id)}>
                        <span className="tz-history-row-method">
                          {formatFechaCorta(p.created_at)} · {nombreNegocio(p.negocio_id)}
                        </span>
                        <span className="tz-history-row-amount">{formatSoles(p.monto)}</span>
                        {abierto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      {abierto && (
                        <div className="tz-history-row-detail">
                          <span>
                            <strong>Hora:</strong> {formatHora(p.created_at)}
                          </span>
                          <span>
                            <strong>Fecha:</strong> {formatFechaCorta(p.created_at)}
                          </span>
                          <span>
                            <strong>Código:</strong> {p.codigo || "—"}
                          </span>
                          <span>
                            <strong>Negocio:</strong> {nombreNegocio(p.negocio_id)}
                          </span>
                          {p.monto_recibido != null && (
                            <span>
                              <strong>Recibido:</strong> {formatSoles(p.monto_recibido)} · <strong>Vuelto:</strong>{" "}
                              {formatSoles(p.vuelto || 0)}
                            </span>
                          )}
                          {p.comprobante_url ? (
                            <button type="button" className="tz-history-row-photo-link" onClick={() => setVer(p)}>
                              <img src={p.comprobante_url} alt="Comprobante" className="tz-history-row-photo" />
                            </button>
                          ) : (
                            metodo !== "efectivo" && <span className="tz-history-row-manual-note">Sin captura adjunta</span>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      {ver && (
        <div className="tz-modal-backdrop" style={{ zIndex: 120 }}>
          <div className="tz-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="tz-modal-close" onClick={() => setVer(null)} aria-label="Cerrar">
              <X size={18} />
            </button>
            <h2>
              {ver.codigo} · {nombreNegocio(ver.negocio_id)}
            </h2>
            <img src={ver.comprobante_url} alt="Comprobante" style={{ width: "100%", borderRadius: 12 }} />
          </div>
        </div>
      )}
    </div>
  );
}
