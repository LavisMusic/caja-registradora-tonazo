import { useEffect, useMemo, useState } from "react";
import { X, Loader2, Receipt, Download, Lock } from "lucide-react";
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

  return (
    <div className="tz-modal-backdrop">
      <Styles />
      <div className="tz-modal tz-modal-wide" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <h2>
          <Receipt size={17} /> Cierre de caja
        </h2>
        <p className="tz-brand-sub" style={{ marginBottom: 12 }}>
          Desde {desde ? `el último cierre (${fechaHora(desde)})` : "el inicio"} hasta ahora.
        </p>

        {loading ? (
          <div className="tz-loading">
            <Loader2 className="tz-spin" size={24} />
          </div>
        ) : (
          <>
            <div className="tz-method-totals tz-cierre-sa-totales">
              {METODOS_PAGO_SA.map((m) => (
                <div key={m.key} className="tz-method-total">
                  <span>{m.label}</span>
                  <strong>{formatSoles(porMetodo[m.key])}</strong>
                </div>
              ))}
            </div>
            <div className="tz-method-totals" style={{ marginTop: 8 }}>
              <div className="tz-method-total">
                <span>Cobrado ({pagos.length} pagos)</span>
                <strong className="tz-green">{formatSoles(totalCobrado)}</strong>
              </div>
              <div className="tz-method-total">
                <span>Gastos</span>
                <strong className="tz-pink">− {formatSoles(totalGastos)}</strong>
              </div>
              <div className="tz-method-total">
                <span>Balance</span>
                <strong className={balance >= 0 ? "tz-green" : "tz-pink"}>{formatSoles(balance)}</strong>
              </div>
            </div>

            {confirmando ? (
              <div className="tz-vis-confirm-delete" style={{ marginTop: 14 }}>
                <p>
                  ¿Cerrar la caja? Se guarda este resumen y se descarga el Excel. El próximo cierre empieza desde ahora.
                </p>
                <div className="tz-vis-confirm-actions">
                  <button type="button" className="tz-cliente-action-btn tz-cliente-action-pago" onClick={cerrarCaja} disabled={cerrando}>
                    {cerrando ? <Loader2 size={13} className="tz-spin" /> : <Lock size={13} />} Sí, cerrar caja
                  </button>
                  <button type="button" className="tz-cliente-action-btn" onClick={() => setConfirmando(false)} disabled={cerrando}>
                    <X size={13} /> Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="tz-scan-btn tz-payment-save" style={{ width: "100%", marginTop: 14 }} onClick={() => setConfirmando(true)}>
                <Lock size={15} /> Cerrar caja y descargar Excel
              </button>
            )}
            {error && <p className="tz-error">{error}</p>}

            <h3 className="tz-plan-subtitulo">Cierres anteriores</h3>
            {cierres.length === 0 ? (
              <p className="tz-stock-editor-sub">Todavía no hay cierres.</p>
            ) : (
              <ul className="tz-plan-pagos">
                {cierres.map((c) => (
                  <li key={c.id}>
                    <span>{fechaHora(c.hasta)}</span>
                    <strong className="tz-green">{formatSoles(c.total_cobrado)}</strong>
                    <span className="tz-pink">− {formatSoles(c.total_gastos)}</span>
                    <span>Balance {formatSoles(c.balance)}</span>
                    <button type="button" className="tz-vis-edit-btn" onClick={() => armarExcel(c, negocios, planes)} title="Descargar Excel" aria-label="Descargar Excel">
                      <Download size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
