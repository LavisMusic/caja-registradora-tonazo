import { useEffect, useMemo, useState } from "react";
import { X, Loader2, Receipt, Download, Save, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { supabase } from "../supabaseClient";
import Styles from "../components/Styles";
import { formatSoles } from "../utils/format";
import { duracionPlan } from "../lib/planes";
import { descargarXLSX } from "../lib/excel";
import { METODOS_PAGO_SA, grupoMetodo } from "./ComprobantesPlataformaModal.jsx";

// Cierre de caja del super admin — como las cajas de los negocios: junta
// lo cobrado (pagos de planes no anulados) y los gastos desde el ÚLTIMO
// cierre, muestra el balance y el desglose por método, y al cerrar
// guarda una instantánea en cierres_plataforma (con el detalle completo)
// y descarga el Excel. Los cierres anteriores se pueden volver a
// descargar.
function fechaHora(fecha) {
  return fecha ? new Date(fecha).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" }) : "—";
}

function armarExcel(cierre, negocios, planes) {
  const nombreNegocio = (id) => negocios.find((n) => n.id === id)?.nombre || "Negocio eliminado";
  const nombrePlan = (id) => planes.find((p) => p.id === id)?.nombre || "—";
  const pagos = cierre.detalle?.pagos || [];
  const gastos = cierre.detalle?.gastos || [];
  const resumen = [
    ["Cierre de caja — Tonazo (super admin)"],
    ["Desde", fechaHora(cierre.desde)],
    ["Hasta", fechaHora(cierre.hasta)],
    [],
    ["Concepto", "Monto (S/)"],
    ...METODOS_PAGO_SA.map((m) => [`Cobrado en ${m.label}`, Number(cierre.por_metodo?.[m.key] || 0)]),
    ["Total cobrado", Number(cierre.total_cobrado || 0)],
    ["Total gastos", Number(cierre.total_gastos || 0)],
    ["Balance", Number(cierre.balance || 0)],
    ["Cantidad de pagos", cierre.cantidad_pagos || 0],
  ];
  const filasPagos = [
    ["Código", "Fecha", "Negocio", "Plan", "Duración", "Método", "Monto", "Recibido", "Vuelto", "Comprobante"],
    ...pagos.map((p) => [
      p.codigo || "",
      fechaHora(p.created_at),
      nombreNegocio(p.negocio_id),
      nombrePlan(p.plan_id),
      duracionPlan(p.meses),
      p.metodo || "",
      Number(p.monto || 0),
      p.monto_recibido != null ? Number(p.monto_recibido) : "",
      p.vuelto != null ? Number(p.vuelto) : "",
      p.comprobante_url || "",
    ]),
  ];
  const filasGastos = [
    ["Fecha", "Descripción", "Categoría", "Monto"],
    ...gastos.map((g) => [fechaHora(g.fecha), g.descripcion, g.categoria || "", Number(g.monto || 0)]),
  ];
  const sello = new Date(cierre.hasta).toISOString().slice(0, 16).replace(/[:T]/g, "-");
  descargarXLSX(`cierre-caja-tonazo-${sello}.xlsx`, [
    { nombre: "Resumen", filas: resumen },
    { nombre: "Pagos", filas: filasPagos },
    { nombre: "Gastos", filas: filasGastos },
  ]);
}

export default function CierreCajaPlataformaModal({ negocios, planes, onClose }) {
  const [cierres, setCierres] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmando, setConfirmando] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [error, setError] = useState("");

  const cargar = async () => {
    const { data: c } = await supabase.from("cierres_plataforma").select("*").order("hasta", { ascending: false }).limit(30);
    const desde = c?.[0]?.hasta || null;
    let qPagos = supabase.from("pagos_plataforma").select("*").eq("anulado", false).order("created_at", { ascending: true });
    let qGastos = supabase.from("gastos_plataforma").select("*").order("fecha", { ascending: true });
    if (desde) {
      qPagos = qPagos.gt("created_at", desde);
      qGastos = qGastos.gt("fecha", desde);
    }
    const [{ data: p }, { data: g }] = await Promise.all([qPagos, qGastos]);
    setCierres(c || []);
    setPagos(p || []);
    setGastos(g || []);
    setLoading(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  const desde = cierres[0]?.hasta || null;
  const porMetodo = useMemo(() => {
    const t = { efectivo: 0, yape: 0, plin: 0, otros: 0 };
    pagos.forEach((p) => {
      t[grupoMetodo(p.metodo)] += Number(p.monto || 0);
    });
    return t;
  }, [pagos]);
  const totalCobrado = pagos.reduce((s, p) => s + Number(p.monto || 0), 0);
  const totalGastos = gastos.reduce((s, g) => s + Number(g.monto || 0), 0);
  const balance = totalCobrado - totalGastos;

  const cerrarCaja = async () => {
    setError("");
    setCerrando(true);
    const fila = {
      desde,
      hasta: new Date().toISOString(),
      total_cobrado: totalCobrado,
      total_gastos: totalGastos,
      balance,
      por_metodo: porMetodo,
      cantidad_pagos: pagos.length,
      detalle: { pagos, gastos },
    };
    const { data, error: err } = await supabase.from("cierres_plataforma").insert(fila).select().single();
    setCerrando(false);
    setConfirmando(false);
    if (err) return setError(err.message || "No se pudo cerrar la caja.");
    armarExcel(data, negocios, planes);
    setLoading(true);
    cargar();
  };

  const exportarHistorial = () => {
    const filas = [
      ["Desde", "Hasta", "Pagos", ...METODOS_PAGO_SA.map((m) => `${m.label} (S/)`), "Cobrado (S/)", "Gastos (S/)", "Balance (S/)"],
      ...cierres.map((c) => [
        fechaHora(c.desde),
        fechaHora(c.hasta),
        c.cantidad_pagos || 0,
        ...METODOS_PAGO_SA.map((m) => Number(c.por_metodo?.[m.key] || 0)),
        Number(c.total_cobrado || 0),
        Number(c.total_gastos || 0),
        Number(c.balance || 0),
      ]),
    ];
    descargarXLSX(`historial-cierres-tonazo-${Date.now()}.xlsx`, [{ nombre: "Cierres", filas }]);
  };

  return (
    <div className="tz-modal-backdrop">
      <Styles />
      <div className="tz-modal tz-modal-wide" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <div className="tz-payment-modal">
          <h2>
            <Receipt size={17} /> Cierre de Caja
          </h2>

          {loading ? (
            <div className="tz-loading">
              <Loader2 className="tz-spin" size={24} />
            </div>
          ) : (
            <>
              {/* Recibo del turno actual (desde el último cierre), con el
                 mismo diseño del cierre de las cajas de los negocios. */}
              <div className="tz-receipt">
                <div className="tz-receipt-header">
                  <span className="tz-receipt-title">Turno actual</span>
                  <span className="tz-receipt-date">Desde {desde ? fechaHora(desde) : "el inicio"}</span>
                </div>
                <div className="tz-receipt-row">
                  <span>Responsable</span>
                  <strong>Super Admin</strong>
                </div>
                <div className="tz-receipt-divider" />
                {METODOS_PAGO_SA.map((m) => (
                  <div key={m.key} className="tz-receipt-row">
                    <span>Ingresos ({m.label})</span>
                    <strong>{formatSoles(porMetodo[m.key])}</strong>
                  </div>
                ))}
                <div className="tz-receipt-divider" />
                <div className="tz-receipt-row">
                  <span>Recaudado</span>
                  <strong>{formatSoles(totalCobrado)}</strong>
                </div>
                <div className="tz-receipt-row">
                  <span>Pagos registrados</span>
                  <strong>{pagos.length}</strong>
                </div>
                <div className="tz-receipt-row">
                  <span>Gastos</span>
                  <strong>{formatSoles(totalGastos)}</strong>
                </div>
                <div className="tz-receipt-divider" />
                <div className="tz-receipt-row tz-receipt-total">
                  <span>BALANCE DEL TURNO</span>
                  <strong>{formatSoles(balance)}</strong>
                </div>
              </div>

              {!confirmando ? (
                <button className="tz-scan-btn tz-add-entry-toggle" onClick={() => setConfirmando(true)}>
                  <Receipt size={16} /> Cerrar turno
                </button>
              ) : (
                <div className="tz-add-entry">
                  <p className="tz-cierre-warning">
                    <AlertTriangle size={14} /> Esto guarda una instantánea de estos totales, descarga su Excel y el
                    próximo cierre empieza desde ahora. No se puede deshacer.
                  </p>
                  {error && <p className="tz-error">{error}</p>}
                  <div className="tz-add-entry-actions">
                    <button className="tz-camera-cancel" onClick={() => setConfirmando(false)} disabled={cerrando}>
                      Cancelar
                    </button>
                    <button className="tz-pw-submit tz-payment-save" onClick={cerrarCaja} disabled={cerrando}>
                      {cerrando ? <Loader2 size={16} className="tz-spin" /> : <Save size={16} />}
                      Sí, cerrar turno
                    </button>
                  </div>
                </div>
              )}

              <div className="tz-method-history">
                <span className="tz-method-history-label">Historial de cierres</span>
                {cierres.length === 0 ? (
                  <p className="tz-method-history-empty">Todavía no hay cierres registrados.</p>
                ) : (
                  <>
                    <div className="tz-export-buttons">
                      <button type="button" className="tz-csv-btn" onClick={exportarHistorial}>
                        <Download size={13} /> Exportar Historial de Cierres
                      </button>
                    </div>
                    <div className="tz-cierre-list">
                      {cierres.map((c) => (
                        <div key={c.id} className="tz-receipt tz-receipt-compact">
                          <div className="tz-receipt-header">
                            <span className="tz-receipt-title">Cierre</span>
                            <span className="tz-receipt-date">{fechaHora(c.hasta)}</span>
                          </div>
                          <div className="tz-receipt-divider" />
                          <div className="tz-receipt-row">
                            <span>Recaudado</span>
                            <strong>{formatSoles(c.total_cobrado)}</strong>
                          </div>
                          <div className="tz-receipt-row">
                            <span>Pagos</span>
                            <strong>{c.cantidad_pagos || 0}</strong>
                          </div>
                          <div className="tz-receipt-row">
                            <span>Gastos</span>
                            <strong>{formatSoles(c.total_gastos)}</strong>
                          </div>
                          <div className="tz-receipt-divider" />
                          <div className="tz-receipt-row tz-receipt-total">
                            <span>Balance</span>
                            <strong>{formatSoles(c.balance)}</strong>
                          </div>
                          <button
                            type="button"
                            className="tz-csv-btn"
                            style={{ marginTop: 8 }}
                            onClick={() => armarExcel(c, negocios, planes)}
                          >
                            <FileSpreadsheet size={13} /> Descargar Excel de este cierre
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
