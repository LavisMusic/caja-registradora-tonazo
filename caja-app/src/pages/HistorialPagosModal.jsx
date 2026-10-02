import { useEffect, useMemo, useState } from "react";
import { X, Loader2, Receipt, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { supabase } from "../supabaseClient";
import Styles from "../components/Styles";
import { formatSoles } from "../utils/format";
import { duracionPlan, formatFechaCorta } from "../lib/planes";

// Historial de ventas de planes (super admin, pie de página): todos los
// pagos de pagos_plataforma — Recarga rápida y peticiones aprobadas — mes
// por mes, con su código de operación (PL-000001…, automático), método,
// comprobante y el total del mes. SOLO CONSULTA: anular se hace desde el
// gestor de cada negocio (⚡ → Pagos); lo anulado se ve acá al instante
// (tiempo real). Filtro Todas / Registradas / Anuladas y buscador por
// negocio, código, plan o método.
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const FILTROS = [
  { id: "todas", label: "Todas" },
  { id: "registradas", label: "Registradas" },
  { id: "anuladas", label: "Anuladas" },
];

const normalizar = (t) =>
  String(t || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export default function HistorialPagosModal({ negocios, planes, onClose }) {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth());
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ver, setVer] = useState(null);
  const [version, setVersion] = useState(0);
  const [filtro, setFiltro] = useState("todas");
  const [busqueda, setBusqueda] = useState("");

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
  }, [anio, mes, version]);

  // Un pago nuevo o anulado desde el gestor de un negocio se refleja acá.
  useEffect(() => {
    const canal = supabase
      .channel(`historial-pagos-sa-${Math.random().toString(36).slice(2, 10)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "pagos_plataforma" }, () => setVersion((v) => v + 1))
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  const nombreNegocio = (id) => negocios.find((n) => n.id === id)?.nombre || "Negocio eliminado";
  const nombrePlan = (id) => planes.find((p) => p.id === id)?.nombre || "—";

  const vigentes = pagos.filter((p) => !p.anulado);
  const anuladas = pagos.length - vigentes.length;
  const total = vigentes.reduce((s, p) => s + Number(p.monto || 0), 0);

  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return pagos.filter((p) => {
      if (filtro === "registradas" && p.anulado) return false;
      if (filtro === "anuladas" && !p.anulado) return false;
      if (!q) return true;
      const texto = normalizar(
        [p.codigo, negocios.find((n) => n.id === p.negocio_id)?.nombre, planes.find((pl) => pl.id === p.plan_id)?.nombre, p.metodo, p.nota].join(" ")
      );
      return texto.includes(q);
    });
  }, [pagos, filtro, busqueda, negocios, planes]);

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
            {anuladas > 0 ? ` · ${anuladas} anulada(s)` : ""}
          </span>
        </div>

        <div className="tz-historial-filtros">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`tz-gasto-tipo-btn ${filtro === f.id ? "tz-gasto-tipo-active" : ""}`}
              onClick={() => setFiltro(f.id)}
            >
              {f.label}
              {f.id === "registradas" ? ` (${vigentes.length})` : f.id === "anuladas" ? ` (${anuladas})` : ""}
            </button>
          ))}
          <div className="tz-sa-buscador" style={{ flex: "1 1 220px", minWidth: 0 }}>
            <Search size={15} />
            <input
              className="tz-text-input"
              type="search"
              placeholder="Buscar negocio, código, plan…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="tz-loading">
            <Loader2 className="tz-spin" size={24} />
          </div>
        ) : visibles.length === 0 ? (
          <p className="tz-stock-editor-sub">
            {pagos.length === 0 ? "No hay ventas en este mes." : "Ninguna venta coincide con el filtro."}
          </p>
        ) : (
          <ul className="tz-plan-pagos">
            {visibles.map((p) => (
              <li key={p.id} className={p.anulado ? "tz-plan-pago-anulado" : ""}>
                <span className="tz-plan-pago-codigo">{p.codigo || "—"}</span>
                <span>{formatFechaCorta(p.created_at)}</span>
                <strong>{nombreNegocio(p.negocio_id)}</strong>
                <span>
                  {nombrePlan(p.plan_id)} · {duracionPlan(p.meses)} · {formatSoles(p.monto)}
                  {p.metodo ? ` · ${p.metodo}` : ""}
                  {p.vuelto != null ? ` · recibido ${formatSoles(p.monto_recibido)}, vuelto ${formatSoles(p.vuelto)}` : ""}
                </span>
                <span className="tz-plan-pagos-hasta">hasta {formatFechaCorta(p.vence_nuevo)}</span>
                {p.comprobante_url && (
                  <button type="button" className="tz-plan-pago-ver" onClick={() => setVer(p)}>
                    Ver comprobante
                  </button>
                )}
                {p.anulado && (
                  <span className="tz-tag tz-tag-danger">
                    Anulada{p.anulado_at ? ` el ${formatFechaCorta(p.anulado_at)}` : ""}
                  </span>
                )}
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
