import { useEffect, useMemo, useState } from "react";
import { X, Wallet, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "../supabaseClient";
import Styles from "../components/Styles";
import { formatSoles } from "../utils/format";
import { formatFechaCorta } from "../lib/planes";

// Gestor de comprobantes del super admin — menú "Pagos" de la cabecera
// (Efectivo / Yape / Plin / Otros), mismo modal que "Pagos" del admin de
// Taxi-PE: medidores Hoy / Histórico + el historial de cobros de ESE
// método con su foto de comprobante (o el efectivo recibido y el vuelto).
// Toma los pagos de planes no anulados: Recarga rápida y peticiones
// aprobadas. "Otros" incluye las transferencias.
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
            <Wallet size={17} /> {label}
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
                {pagos.map((p) => (
                  <li key={p.id} className="tz-history-row">
                    <div
                      className="tz-history-row-detail"
                      style={{ padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}
                    >
                      <span style={{ minWidth: 0 }}>
                        <strong style={{ color: "var(--text)" }}>{nombreNegocio(p.negocio_id)}</strong>
                        <p style={{ margin: "2px 0", color: "var(--text-dim)", fontSize: 12.5 }}>
                          {p.codigo} · {formatFechaCorta(p.created_at)}
                          {p.monto_recibido != null && ` · recibió ${formatSoles(p.monto_recibido)}, vuelto ${formatSoles(p.vuelto || 0)}`}
                          {p.comprobante_url && (
                            <>
                              {" · "}
                              <button type="button" className="tz-plan-pago-ver" onClick={() => setVer(p)}>
                                comprobante <ExternalLink size={11} style={{ verticalAlign: "-1px" }} />
                              </button>
                            </>
                          )}
                        </p>
                      </span>
                      <strong>{formatSoles(p.monto)}</strong>
                    </div>
                  </li>
                ))}
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
