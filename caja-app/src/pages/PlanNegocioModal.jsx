import { useEffect, useState } from "react";
import { X, Loader2, Check, CreditCard, CalendarClock } from "lucide-react";
import { supabase } from "../supabaseClient";
import Styles from "../components/Styles";
import { formatSoles } from "../utils/format";
import { ESTADOS_PLAN, DIAS_GRACIA, diasHasta, formatFechaCorta, precioPlan, duracionPlan, puedeRenovar, inicioRenovacion } from "../lib/planes";

// Plan y pagos de UN negocio (super admin, Fase 4): plan asignado,
// modo (automático / exento / suspendido a mano), registrar un pago
// eligiendo QUÉ plan pagó (meses y monto salen del plan; el negocio
// pasa a ese plan — RPC registrar_pago_plan) y corregir el vencimiento
// a mano si hubo un error. El estado lo calcula la base.
const METODOS = ["Yape", "Plin", "Transferencia", "Efectivo", "Otro"];

function modoDe(n) {
  if (n.plan_suspendido_manual) return "suspendido";
  if (n.plan_exento) return "exento";
  return "automatico";
}

function textoVencimiento(negocio) {
  if (negocio.plan_suspendido_manual) return "Suspendido manualmente: no puede vender ni recibir pedidos hasta que cambies el estado.";
  if (negocio.plan_exento) return "Sin vencimiento (exento).";
  const dias = diasHasta(negocio.plan_vence_at);
  if (dias == null) return "Sin fecha de vencimiento.";
  const fecha = formatFechaCorta(negocio.plan_vence_at);
  if (dias > 1) return `Vence el ${fecha} (en ${dias} días).`;
  if (dias === 1) return `Vence el ${fecha} (mañana).`;
  if (dias === 0) return `Vence hoy (${fecha}).`;
  const suspension = new Date(new Date(negocio.plan_vence_at).getTime() + DIAS_GRACIA * 86400000);
  return negocio.plan_estado === "gracia"
    ? `Venció el ${fecha}. Se suspende el ${formatFechaCorta(suspension)}.`
    : `Venció el ${fecha}. Suspendido desde el ${formatFechaCorta(suspension)}.`;
}

export default function PlanNegocioModal({ negocio: negocioInicial, planes, onClose, onActualizado }) {
  const [negocio, setNegocio] = useState(negocioInicial);
  const [pagos, setPagos] = useState([]);
  const [cargandoPagos, setCargandoPagos] = useState(true);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState("");

  const planActual = planes.find((p) => p.id === negocio.plan_id) || null;
  const [planPagoId, setPlanPagoId] = useState(negocio.plan_id || "");
  const planPago = planes.find((p) => p.id === planPagoId) || null;
  const meses = planPago?.meses || 1;
  const [monto, setMonto] = useState(String(precioPlan(planActual)));
  const [metodo, setMetodo] = useState("Yape");
  const [nota, setNota] = useState("");
  const [pagoOk, setPagoOk] = useState("");
  const [fechaManual, setFechaManual] = useState(
    negocio.plan_vence_at ? new Date(negocio.plan_vence_at).toISOString().slice(0, 10) : ""
  );

  const cargarPagos = async () => {
    setCargandoPagos(true);
    const { data } = await supabase
      .from("pagos_plataforma")
      .select("*")
      .eq("negocio_id", negocio.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setPagos(data || []);
    setCargandoPagos(false);
  };

  useEffect(() => {
    cargarPagos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refrescarNegocio = async () => {
    const { data } = await supabase.from("negocios").select("*, plan_estado").eq("id", negocio.id).single();
    if (data) {
      setNegocio(data);
      onActualizado?.(data);
    }
  };

  const actualizarCampos = async (campos, etiqueta) => {
    setError("");
    setGuardando(etiqueta);
    const { error: err } = await supabase.from("negocios").update(campos).eq("id", negocio.id);
    setGuardando("");
    if (err) return setError(err.message || "No se pudo guardar.");
    await refrescarNegocio();
  };

  const cambiarPlan = (planId) => {
    setPlanPagoId(planId);
    setMonto(String(precioPlan(planes.find((p) => p.id === planId))));
    actualizarCampos({ plan_id: planId || null }, "plan");
  };

  const cambiarModo = (modo) =>
    actualizarCampos(
      { plan_exento: modo === "exento", plan_suspendido_manual: modo === "suspendido" },
      "modo"
    );

  const registrarPago = async () => {
    setError("");
    setPagoOk("");
    const m = Number(String(monto).replace(",", "."));
    if (!Number.isFinite(m) || m < 0) return setError("Monto inválido.");
    setGuardando("pago");
    if (!planPago) return setError("Elige qué plan pagó.");
    const { data, error: err } = await supabase.rpc("registrar_pago_plan", {
      p_negocio_id: negocio.id,
      p_meses: meses,
      p_monto: m,
      p_metodo: metodo,
      p_nota: nota.trim() || null,
      p_plan_id: planPago.id,
    });
    setGuardando("");
    if (err) return setError(err.message || "No se pudo registrar el pago.");
    setNota("");
    setPagoOk(`Pago registrado. Nuevo vencimiento: ${formatFechaCorta(data)}.`);
    if (data) setFechaManual(new Date(data).toISOString().slice(0, 10));
    await Promise.all([refrescarNegocio(), cargarPagos()]);
  };

  const corregirVencimiento = () => {
    if (!fechaManual) return setError("Elige una fecha.");
    // Fin del día elegido (hora de Perú, UTC-5).
    actualizarCampos({ plan_vence_at: `${fechaManual}T23:59:59-05:00` }, "fecha");
  };

  const estado = ESTADOS_PLAN[negocio.plan_estado] || ESTADOS_PLAN.activo;

  return (
    <div className="tz-modal-backdrop">
      <Styles />
      <div className="tz-modal tz-modal-wide" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <h2>
          <CreditCard size={17} /> Plan · {negocio.nombre}
        </h2>
        <p className="tz-brand-sub" style={{ marginBottom: 14, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span className="tz-plan-badge" style={{ "--tz-plan-color": estado.color }}>{estado.label}</span>
          {textoVencimiento(negocio)}
        </p>

        <div className="tz-plan-seccion">
          <label className="tz-plan-campo tz-plan-campo-ancho">
            <span>Plan</span>
            <select
              className="tz-text-input"
              value={negocio.plan_id || ""}
              onChange={(e) => cambiarPlan(e.target.value)}
              disabled={guardando === "plan"}
            >
              <option value="">Sin plan</option>
              {planes
                .filter((p) => p.activo !== false || p.id === negocio.plan_id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} — {duracionPlan(p.meses)} {formatSoles(precioPlan(p))} ·{" "}
                    {p.max_sucursales == null ? "sucursales sin límite" : `hasta ${p.max_sucursales} sucursal(es)`}
                  </option>
                ))}
            </select>
          </label>
          <label className="tz-plan-campo tz-plan-campo-ancho">
            <span>Estado</span>
            <select
              className="tz-text-input"
              value={modoDe(negocio)}
              disabled={guardando === "modo"}
              onChange={(e) => cambiarModo(e.target.value)}
            >
              <option value="automatico">Automático (según la fecha de vencimiento)</option>
              <option value="exento">Exento (sin vencimiento ni límites)</option>
              <option value="suspendido">Suspendido manualmente (aunque tenga días pagados)</option>
            </select>
          </label>
        </div>

        {!negocio.plan_exento && (
          <>
            <h3 className="tz-plan-subtitulo">Registrar pago</h3>
            {!puedeRenovar(negocio.plan_vence_at) && (
              <p className="tz-stock-editor-sub tz-plan-ventana-nota">
                Plan vigente: se puede renovar desde el {formatFechaCorta(inicioRenovacion(negocio.plan_vence_at))} (3 días
                antes de que venza). Si hubo un error en la fecha, usa “Corregir vencimiento”.
              </p>
            )}
            <div className="tz-plan-seccion tz-plan-pago-grid">
              <label className="tz-plan-campo tz-plan-campo-ancho">
                <span>Plan pagado</span>
                <select
                  className="tz-text-input"
                  value={planPagoId}
                  onChange={(e) => {
                    setPlanPagoId(e.target.value);
                    setMonto(String(precioPlan(planes.find((p) => p.id === e.target.value))));
                  }}
                >
                  <option value="">Elegir plan…</option>
                  {planes
                    .filter((p) => p.activo !== false || p.id === planPagoId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} — {duracionPlan(p.meses)} · {formatSoles(precioPlan(p))}
                      </option>
                    ))}
                </select>
              </label>
              <label className="tz-plan-campo">
                <span>Monto (S/)</span>
                <input className="tz-text-input" inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} />
              </label>
              <label className="tz-plan-campo">
                <span>Método</span>
                <select className="tz-text-input" value={metodo} onChange={(e) => setMetodo(e.target.value)}>
                  {METODOS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </label>
              <label className="tz-plan-campo tz-plan-campo-ancho">
                <span>Nota (opcional)</span>
                <input className="tz-text-input" placeholder="Ej. N° de operación" value={nota} onChange={(e) => setNota(e.target.value)} />
              </label>
            </div>
            <button
              type="button"
              className="tz-scan-btn tz-payment-save"
              style={{ width: "100%" }}
              onClick={registrarPago}
              disabled={guardando === "pago" || !puedeRenovar(negocio.plan_vence_at)}
            >
              {guardando === "pago" ? <Loader2 size={15} className="tz-spin" /> : <Check size={15} />} Registrar pago y extender {meses}{" "}
              {meses === 1 ? "mes" : "meses"}
            </button>
            {pagoOk && <p className="tz-sa-negocio-admin-ok">{pagoOk}</p>}

            <h3 className="tz-plan-subtitulo">Corregir vencimiento</h3>
            <div className="tz-plan-seccion" style={{ alignItems: "flex-end" }}>
              <label className="tz-plan-campo">
                <span>Vence el</span>
                <input type="date" className="tz-text-input" value={fechaManual} onChange={(e) => setFechaManual(e.target.value)} />
              </label>
              <button type="button" className="tz-cliente-action-btn" onClick={corregirVencimiento} disabled={guardando === "fecha"}>
                {guardando === "fecha" ? <Loader2 size={13} className="tz-spin" /> : <CalendarClock size={13} />} Guardar fecha
              </button>
            </div>
          </>
        )}

        {error && <p className="tz-error">{error}</p>}

        <h3 className="tz-plan-subtitulo">Pagos registrados</h3>
        {cargandoPagos ? (
          <Loader2 size={18} className="tz-spin" />
        ) : pagos.length === 0 ? (
          <p className="tz-stock-editor-sub">Todavía no hay pagos registrados.</p>
        ) : (
          <ul className="tz-plan-pagos">
            {pagos.map((p) => (
              <li key={p.id}>
                <span>{formatFechaCorta(p.created_at)}</span>
                <span>
                  {formatSoles(p.monto)} · {p.meses} {p.meses === 1 ? "mes" : "meses"}
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
