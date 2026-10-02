import { useEffect, useMemo, useState } from "react";
import { X, Loader2, Receipt, ChevronLeft, ChevronRight, Ban } from "lucide-react";
import { supabase } from "../supabaseClient";
import Styles from "../components/Styles";
import { formatSoles } from "../utils/format";
import { duracionPlan, formatFechaCorta } from "../lib/planes";

// Historial de ventas de planes (super admin, pie de página): todos los
// pagos de pagos_plataforma — Recarga rápida y peticiones aprobadas — mes
// por mes, con su código de operación (PL-000001…, automático), método,
// comprobante y el total del mes. Anular revierte el vencimiento del
// negocio; solo se puede anular el ÚLTIMO pago vigente de cada negocio.
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function HistorialPagosModal({ negocios, planes, onClose }) {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth());
  const [pagos, setPagos] = useState([]);
  const [ultimos, setUltimos] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [ver, setVer] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;
    setLoading(true);
    const desde = new Date(anio, mes, 1).toISOString();
    const hasta = new Date(anio, mes + 1, 1).toISOString();
    Promise.all([
      supabase.from("pagos_plataforma").select("*").gte("created_at", desde).lt("created_at", hasta).order("created_at", { ascending: false }),
      // Último pago vigente de cada negocio (los únicos anulables).
      supabase.from("pagos_plataforma").select("id, negocio_id, created_at").eq("anulado", false).order("created_at", { ascending: false }),
    ]).then(([{ data }, { data: vigentes }]) => {
      if (!activo) return;
      const vistos = new Set();
      const ids = new Set();
      (vigentes || []).forEach((p) => {
        if (vistos.has(p.negocio_id)) return;
        vistos.add(p.negocio_id);
        ids.add(p.id);
      });
      setPagos(data || []);
      setUltimos(ids);
      setLoading(false);
    });
    return () => {
      activo = false;
    };
  }, [anio, mes, version]);

  const vigentes = pagos.filter((p) => !p.anulado);
  const total = useMemo(() => vigentes.reduce((s, p) => s + Number(p.monto || 0), 0), [vigentes]);
  const nombreNegocio = (id) => negocios.find((n) => n.id === id)?.nombre || "Negocio eliminado";
  const nombrePlan = (id) => planes.find((p) => p.id === id)?.nombre || "—";

  const mover = (delta) => {
    const d = new Date(anio, mes + delta, 1);
    setAnio(d.getFullYear());
    setMes(d.getMonth());
  };
  const esMesActual = anio === hoy.getFullYear() && mes === hoy.getMonth();

  const anular = async (p) => {
    setError("");
    setBusyId(p.id);
    const { error: err } = await supabase.rpc("anular_pago_plan", { p_pago_id: p.id });
    setBusyId(null);
    setConfirmandoId(null);
    if (err) return setError(err.message || "No se pudo anular.");
    setVersion((v) => v + 1);
  };

  return (
    <div className="tz-modal-backdrop">
      <Styles />
      <div className="tz-modal tz-modal-wide" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <h2>
          <Receipt size={17} /> Historial de ventas
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
          <span className="tz-stat-sub">
            {vigentes.length} venta{vigentes.length === 1 ? "" : "s"}
            {pagos.length > vigentes.length ? ` · ${pagos.length - vigentes.length} anulada(s)` : ""}
          </span>
        </div>
        {error && <p className="tz-error">{error}</p>}
        {loading ? (
          <div className="tz-loading">
            <Loader2 className="tz-spin" size={24} />
          </div>
        ) : pagos.length === 0 ? (
          <p className="tz-stock-editor-sub">No hay ventas en este mes.</p>
        ) : (
          <ul className="tz-plan-pagos">
            {pagos.map((p) => (
              <li key={p.id} className={p.anulado ? "tz-plan-pago-anulado" : ""}>
                <span className="tz-plan-pago-codigo">{p.codigo || "—"}</span>
                <span>{formatFechaCorta(p.created_at)}</span>
                <strong>{nombreNegocio(p.negocio_id)}</strong>
                <span>
                  {nombrePlan(p.plan_id)} · {duracionPlan(p.meses)} · {formatSoles(p.monto)}
                  {p.metodo ? ` · ${p.metodo}` : ""}
                </span>
                <span className="tz-plan-pagos-hasta">hasta {formatFechaCorta(p.vence_nuevo)}</span>
                {p.comprobante_url && (
                  <button type="button" className="tz-plan-pago-ver" onClick={() => setVer(p)}>
                    Ver comprobante
                  </button>
                )}
                {p.anulado ? (
                  <span className="tz-tag tz-tag-danger">Anulada</span>
                ) : ultimos.has(p.id) ? (
                  confirmandoId === p.id ? (
                    <span className="tz-plan-pago-confirmar">
                      ¿Anular? El vencimiento vuelve al {formatFechaCorta(p.vence_anterior)}.
                      <button type="button" className="tz-cliente-action-btn tz-cliente-action-deuda" onClick={() => anular(p)} disabled={busyId === p.id}>
                        {busyId === p.id ? <Loader2 size={13} className="tz-spin" /> : <Ban size={13} />} Anular
                      </button>
                      <button type="button" className="tz-cliente-action-btn" onClick={() => setConfirmandoId(null)}>
                        Cancelar
                      </button>
                    </span>
                  ) : (
                    <button type="button" className="tz-vis-reject-btn" onClick={() => setConfirmandoId(p.id)} title="Anular venta" aria-label="Anular venta">
                      <Ban size={14} />
                    </button>
                  )
                ) : null}
                {p.nota && <span className="tz-plan-pagos-nota">{p.nota}</span>}
              </li>
            ))}
          </ul>
        )}
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
