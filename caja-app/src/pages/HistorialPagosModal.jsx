import { useEffect, useMemo, useState } from "react";
import { X, Loader2, Receipt, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "../supabaseClient";
import Styles from "../components/Styles";
import { formatSoles } from "../utils/format";
import { duracionPlan, formatFechaCorta } from "../lib/planes";

// Historial de ventas de planes (super admin, pie de página): todos los
// pagos registrados en pagos_plataforma — los aprobados desde el Centro
// de Peticiones y los de Recarga rápida — mes por mes, con el total.
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function HistorialPagosModal({ negocios, planes, onClose }) {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth());
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let activo = true;
    setLoading(true);
    const desde = new Date(anio, mes, 1).toISOString();
    const hasta = new Date(anio, mes + 1, 1).toISOString();
    supabase
      .from("pagos_plataforma")
      .select("*")
      .gte("created_at", desde)
      .lt("created_at", hasta)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!activo) return;
        setPagos(data || []);
        setLoading(false);
      });
    return () => {
      activo = false;
    };
  }, [anio, mes]);

  const total = useMemo(() => pagos.reduce((s, p) => s + Number(p.monto || 0), 0), [pagos]);
  const nombreNegocio = (id) => negocios.find((n) => n.id === id)?.nombre || "Negocio eliminado";
  const nombrePlan = (id) => planes.find((p) => p.id === id)?.nombre || "—";

  const mover = (delta) => {
    const d = new Date(anio, mes + delta, 1);
    setAnio(d.getFullYear());
    setMes(d.getMonth());
  };
  const esMesActual = anio === hoy.getFullYear() && mes === hoy.getMonth();

  return (
    <div className="tz-modal-backdrop">
      <Styles />
      <div className="tz-modal tz-modal-wide" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <h2>
          <Receipt size={17} /> Historial de ventas de planes
        </h2>
        <div className="tz-sa-mes-nav">
          <button type="button" className="tz-vis-edit-btn" onClick={() => mover(-1)} aria-label="Mes anterior">
            <ChevronLeft size={16} />
          </button>
          <strong>
            {MESES[mes]} {anio}
          </strong>
          <button type="button" className="tz-vis-edit-btn" onClick={() => mover(1)} disabled={esMesActual} aria-label="Mes siguiente">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="tz-stat-chip tz-stat-chip-green" style={{ margin: "10px 0 14px" }}>
          <span className="tz-stat-label">Total cobrado</span>
          <span className="tz-stat-value">{formatSoles(total)}</span>
          <span className="tz-stat-sub">{pagos.length} pago{pagos.length === 1 ? "" : "s"}</span>
        </div>
        {loading ? (
          <div className="tz-loading">
            <Loader2 className="tz-spin" size={24} />
          </div>
        ) : pagos.length === 0 ? (
          <p className="tz-stock-editor-sub">No hay pagos en este mes.</p>
        ) : (
          <ul className="tz-plan-pagos">
            {pagos.map((p) => (
              <li key={p.id}>
                <span>{formatFechaCorta(p.created_at)}</span>
                <strong>{nombreNegocio(p.negocio_id)}</strong>
                <span>
                  {nombrePlan(p.plan_id)} · {duracionPlan(p.meses)} · {formatSoles(p.monto)}
                  {p.metodo ? ` · ${p.metodo}` : ""}
                </span>
                <span className="tz-plan-pagos-hasta">hasta {formatFechaCorta(p.vence_nuevo)}</span>
                {p.nota && <span className="tz-plan-pagos-nota">{p.nota}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
