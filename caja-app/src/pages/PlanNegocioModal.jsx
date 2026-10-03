import { useEffect, useMemo, useRef, useState } from "react";
import { X, Loader2, Check, CreditCard, CalendarClock, Camera, ImagePlus, Trash2, Zap, Receipt, AlertTriangle } from "lucide-react";
import { supabase } from "../supabaseClient";
import Styles from "../components/Styles";
import { formatSoles } from "../utils/format";
import { subirComprobante } from "../lib/comprobantes";
import PanelVentaRegistrada from "../components/PanelVentaRegistrada";
import {
  ESTADOS_PLAN,
  DIAS_GRACIA,
  calcularEstadoPlan,
  diasHasta,
  formatFechaCorta,
  precioPlan,
  duracionPlan,
  grupoDuracion,
  puedeRenovar,
  inicioRenovacion,
} from "../lib/planes";

// Gestor del plan de UN negocio (super admin — botón ⚡ de la tarjeta).
// Separado en apartados:
//   * Plan y estado: plan asignado y modo (automático / exento /
//     suspendido a mano).
//   * Recarga rápida: registra la compra de una membresía (bloqueada si
//     la membresía sigue activa, salvo los últimos 3 días). Planes con
//     filtro Mensual/Anual, método de pago como en el resto de la app,
//     comprobante OBLIGATORIO si es digital (foto comprimida) y
//     calculadora de vuelto si es efectivo. El código de operación lo
//     asigna la base (PL-000001…).
//   * Corregir vencimiento.
//   * Pagos: los pagos de este negocio (también los aprobados desde el
//     Centro de Peticiones) con el diseño de "Mis ventas" de la caja:
//     Anular (revierte el vencimiento; solo el último) y Boleta.
// Al registrar una recarga (o tocar Boleta) sube el desplegable de venta
// registrada: imprimir, resumen/boleta por WhatsApp al número del
// negocio y copiar la boleta.
// Todo pago queda en el Historial de ventas del super admin (ahí solo se
// consulta: anular es solo desde aquí).
// Regla: un negocio SUSPENDIDO queda "Sin plan" (lo hace la base, ver
// migración 0093); al renovar vuelve a quedar con el plan que pagó.
const METODOS = [
  { key: "Efectivo", label: "Efectivo", clase: "efectivo" },
  { key: "Yape", label: "Yape", clase: "yape" },
  { key: "Plin", label: "Plin", clase: "plin" },
  { key: "Otros", label: "Otros", clase: "otros" },
];
const APARTADOS = [
  { id: "estado", label: "Plan y estado" },
  { id: "recarga", label: "Recarga rápida" },
  { id: "vencimiento", label: "Corregir vencimiento" },
  { id: "pagos", label: "Pagos" },
];
const DURACIONES = [
  { id: "mensual", label: "Mensual" },
  { id: "anual", label: "Anual" },
  { id: "otros", label: "Otros" },
];

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
  return calcularEstadoPlan(negocio) === "gracia"
    ? `Venció el ${fecha}. Se suspende el ${formatFechaCorta(suspension)}.`
    : `Venció el ${fecha}. Suspendido desde el ${formatFechaCorta(suspension)}.`;
}

// Datos del desplegable de venta registrada para un pago de plan.
export function ventaDePago(pago, negocio, planes) {
  const plan = planes.find((p) => p.id === pago.plan_id);
  const fecha = new Date(pago.created_at || Date.now());
  const meses = `${pago.meses} ${pago.meses === 1 ? "mes" : "meses"}`;
  const concepto = plan ? `Plan ${plan.nombre} · ${duracionPlan(pago.meses)}` : `Plan · ${meses}`;
  const monto = Number(pago.monto) || 0;
  const resumen = [
    `Hola ${negocio.nombre}, registramos tu pago ${pago.codigo || ""}`.trim() + ":",
    `• ${concepto}`,
    `• Total: ${formatSoles(monto)}${pago.metodo ? ` (${pago.metodo})` : ""}`,
    pago.vence_nuevo ? `• Tu plan queda activo hasta el ${formatFechaCorta(pago.vence_nuevo)}.` : "",
    "¡Gracias por confiar en Caja Tonazo!",
  ]
    .filter(Boolean)
    .join("\n");
  return {
    mensaje: `${pago.codigo ? `Venta ${pago.codigo}` : "Venta"} registrada: ${formatSoles(monto)}`,
    whatsapp: negocio.whatsapp,
    resumen,
    boleta: {
      orden: {
        id: pago.codigo || "-",
        fecha: fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" }),
        hora: fecha.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
        cajero: "Super Admin",
      },
      cliente: { nombre: negocio.nombre, ruc: "" },
      productos: [{ cantidad: "1", nombre: concepto, precioUnitario: monto, subtotal: monto }],
      totales: {
        totalPagar: monto,
        metodoPago: pago.metodo || "-",
        efectivoRecibido: pago.monto_recibido,
        vuelto: pago.vuelto,
      },
    },
  };
}

function RecargaRapida({ negocio, planes, onPagado }) {
  const activos = planes.filter((p) => p.activo !== false);
  const duracionesConPlanes = DURACIONES.filter((d) => activos.some((p) => grupoDuracion(p.meses) === d.id));
  const actual = activos.find((p) => p.id === negocio.plan_id);
  const [duracion, setDuracion] = useState(actual ? grupoDuracion(actual.meses) : duracionesConPlanes[0]?.id || "mensual");
  const [planId, setPlanId] = useState(actual?.id || "");
  const [metodo, setMetodo] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState("");
  const [recibido, setRecibido] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const visibles = activos.filter((p) => grupoDuracion(p.meses) === duracion);
  const plan = activos.find((p) => p.id === planId) || null;
  const total = precioPlan(plan);
  const esEfectivo = metodo === "Efectivo";
  const esDigital = !!metodo && !esEfectivo;
  const recibidoNum = Number(String(recibido).replace(",", "."));
  const vuelto = esEfectivo && Number.isFinite(recibidoNum) && recibido !== "" ? recibidoNum - total : null;

  if (!String(negocio.whatsapp || "").trim()) {
    return (
      <div className="tz-renovar-estado">
        <span className="tz-renovar-estado-icono">
          <AlertTriangle size={26} />
        </span>
        <h3 className="tz-recarga-bloqueada">
          Sin WhatsApp
          <br />
          registrado
        </h3>
        <p className="tz-stock-editor-sub">
          Para recargar, el negocio tiene que tener un número de WhatsApp en su perfil (ahí le llegan el resumen y la
          boleta). Agrégalo desde el lápiz ✏️ de su tarjeta o pídele que lo registre en "Perfil".
        </p>
      </div>
    );
  }

  if (!puedeRenovar(negocio.plan_vence_at)) {
    return (
      <div className="tz-renovar-estado">
        <span className="tz-renovar-estado-icono">
          <Check size={26} />
        </span>
        <h3 className="tz-recarga-bloqueada">
          Membresía activa
          <br />
          hasta el {formatFechaCorta(negocio.plan_vence_at)}
        </h3>
        <p className="tz-stock-editor-sub">
          No se puede recargar mientras la membresía siga activa. Podrás hacerlo desde el{" "}
          <strong>{formatFechaCorta(inicioRenovacion(negocio.plan_vence_at))}</strong> (3 días antes de que venza).
        </p>
      </div>
    );
  }

  const elegirArchivo = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setArchivo(f);
    setPreview(URL.createObjectURL(f));
    setError("");
  };

  const registrar = async () => {
    setError("");
    if (!plan) return setError("Elige el plan que compró.");
    if (!metodo) return setError("Elige el método de pago.");
    if (esDigital && !archivo) return setError("Con Yape/Plin/Otros el comprobante es obligatorio: toma la foto o adjúntalo.");
    if (esEfectivo && recibido !== "" && (!Number.isFinite(recibidoNum) || recibidoNum < total)) {
      return setError("El efectivo recibido es menor al total.");
    }
    setEnviando(true);
    let comprobanteUrl = null;
    if (esDigital) {
      const { url, error: errSubida } = await subirComprobante(archivo, `plataforma/${negocio.id}`);
      if (errSubida) {
        console.error("[RecargaRapida] Error subiendo el comprobante:", errSubida);
        setEnviando(false);
        return setError(`No se pudo subir el comprobante: ${errSubida.message || errSubida}`);
      }
      comprobanteUrl = url;
    }
    const { data, error: err } = await supabase.rpc("registrar_pago_plan", {
      p_negocio_id: negocio.id,
      p_meses: plan.meses,
      p_monto: total,
      p_metodo: metodo,
      p_nota: null,
      p_plan_id: plan.id,
      p_comprobante_url: comprobanteUrl,
      p_monto_recibido: esEfectivo && recibido !== "" ? recibidoNum : null,
    });
    setEnviando(false);
    if (err) return setError(err.message || "No se pudo registrar la recarga.");
    setArchivo(null);
    setPreview("");
    setRecibido("");
    setMetodo("");
    onPagado?.(data);
  };

  return (
    <>
      {duracionesConPlanes.length > 1 && (
        <div className="tz-plan-filtros">
          {duracionesConPlanes.map((d) => (
            <button
              key={d.id}
              type="button"
              className={`tz-gasto-tipo-btn ${duracion === d.id ? "tz-gasto-tipo-active" : ""}`}
              onClick={() => {
                setDuracion(d.id);
                setPlanId("");
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}
      <label className="tz-field-label">Plan</label>
      <select className="tz-text-input" value={planId} onChange={(e) => setPlanId(e.target.value)}>
        <option value="">{visibles.length === 0 ? "No hay planes en este filtro" : "Elige un plan…"}</option>
        {visibles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre} — {duracionPlan(p.meses)} · {formatSoles(precioPlan(p))}
            {Number(p.descuento_pct) > 0 ? ` (−${Number(p.descuento_pct)}%)` : ""}
          </option>
        ))}
      </select>
      {plan && (
        <p className="tz-plan-total" style={{ margin: "8px 0 0" }}>
          Total: <strong>{formatSoles(total)}</strong> · {plan.meses} {plan.meses === 1 ? "mes" : "meses"}
        </p>
      )}

      <label className="tz-field-label" style={{ marginTop: 12 }}>
        Método de pago
      </label>
      <div className="tz-gasto-tipo-buttons">
        {METODOS.map((m) => (
          <button
            key={m.key}
            type="button"
            className={`tz-gasto-tipo-btn tz-metodo-btn tz-metodo-btn-${m.clase} ${metodo === m.key ? "tz-gasto-tipo-active" : ""}`}
            onClick={() => {
              setMetodo(m.key);
              setError("");
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {esDigital && (
        <div className="tz-recarga-comprobante">
          <label className="tz-field-label" style={{ marginTop: 12 }}>
            Comprobante (obligatorio)
          </label>
          <div className="tz-recarga-comprobante-botones">
            <label className="tz-scan-btn" style={{ cursor: "pointer" }}>
              <Camera size={16} /> Tomar foto
              <input type="file" accept="image/*" capture="environment" hidden onChange={elegirArchivo} />
            </label>
            <label className="tz-scan-btn" style={{ cursor: "pointer" }}>
              <ImagePlus size={16} /> Adjuntar
              <input type="file" accept="image/*" hidden onChange={elegirArchivo} />
            </label>
          </div>
          {preview && <img src={preview} alt="Comprobante" className="tz-renovar-comprobante" />}
        </div>
      )}

      {esEfectivo && (
        <div className="tz-recarga-vuelto">
          <label className="tz-field-label" style={{ marginTop: 12 }} htmlFor="recarga-recibido">
            Efectivo recibido (S/)
          </label>
          <input
            id="recarga-recibido"
            className="tz-text-input"
            inputMode="decimal"
            placeholder={plan ? String(total) : "0.00"}
            value={recibido}
            onChange={(e) => setRecibido(e.target.value)}
          />
          <div className="tz-recarga-vuelto-rapidos">
            {plan && (
              <button type="button" className="tz-gasto-tipo-btn" onClick={() => setRecibido(String(total))}>
                Exacto
              </button>
            )}
            {[10, 20, 50, 100, 200].map((v) => (
              <button key={v} type="button" className="tz-gasto-tipo-btn" onClick={() => setRecibido(String(v))}>
                S/ {v}
              </button>
            ))}
          </div>
          {vuelto != null && (
            <p className={`tz-recarga-vuelto-resultado ${vuelto < 0 ? "tz-recarga-vuelto-falta" : ""}`}>
              {vuelto < 0 ? `Faltan ${formatSoles(-vuelto)}` : `Vuelto: ${formatSoles(vuelto)}`}
            </p>
          )}
        </div>
      )}

      {error && <p className="tz-error">{error}</p>}
      <button type="button" className="tz-scan-btn tz-payment-save" style={{ width: "100%", marginTop: 14 }} onClick={registrar} disabled={enviando}>
        {enviando ? <Loader2 size={15} className="tz-spin" /> : <Zap size={15} />} Registrar recarga{plan ? ` de ${formatSoles(total)}` : ""}
      </button>
    </>
  );
}

export default function PlanNegocioModal({ negocio: negocioInicial, planes, sucursales = 0, onClose, onActualizado }) {
  const [negocio, setNegocio] = useState(negocioInicial);
  const [apartado, setApartado] = useState("estado");
  const [pagos, setPagos] = useState([]);
  const [cargandoPagos, setCargandoPagos] = useState(true);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState("");
  const [anulandoId, setAnulandoId] = useState(null);
  const [verComprobante, setVerComprobante] = useState(null);
  const [ventaPanel, setVentaPanel] = useState(null);
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
      .limit(30);
    setPagos(data || []);
    setCargandoPagos(false);
    return data || [];
  };

  // Recarga registrada: el pago nuevo es el más reciente de la lista.
  const alPagar = async () => {
    const [, lista] = await Promise.all([refrescarNegocio(), cargarPagos()]);
    if (lista[0]) setVentaPanel(ventaDePago(lista[0], negocioRef.current, planes));
  };

  useEffect(() => {
    cargarPagos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const negocioRef = useRef(negocio);
  negocioRef.current = negocio;

  const refrescarNegocio = async () => {
    const { data } = await supabase.from("negocios").select("*, plan_estado").eq("id", negocio.id).single();
    if (data) {
      negocioRef.current = data;
      setNegocio(data);
      setFechaManual(data.plan_vence_at ? new Date(data.plan_vence_at).toISOString().slice(0, 10) : "");
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

  const corregirVencimiento = () => {
    if (!fechaManual) return setError("Elige una fecha.");
    // Fin del día elegido (hora de Perú, UTC-5).
    actualizarCampos({ plan_vence_at: `${fechaManual}T23:59:59-05:00` }, "fecha");
  };

  // Solo el último pago NO anulado se puede anular (la base lo exige).
  const ultimoVigenteId = useMemo(() => pagos.find((p) => !p.anulado)?.id || null, [pagos]);

  const anular = async (pago) => {
    setError("");
    setGuardando(`anular-${pago.id}`);
    const { error: err } = await supabase.rpc("anular_pago_plan", { p_pago_id: pago.id });
    setGuardando("");
    setAnulandoId(null);
    if (err) return setError(err.message || "No se pudo anular.");
    await Promise.all([refrescarNegocio(), cargarPagos()]);
  };

  const estadoKey = calcularEstadoPlan(negocio);
  const estado = ESTADOS_PLAN[estadoKey] || ESTADOS_PLAN.activo;
  const suspendido = estadoKey === "suspendido";
  const nombrePlan = (id) => planes.find((p) => p.id === id)?.nombre;
  const planDe = (n) => planes.find((p) => p.id === n.plan_id) || null;

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
        <p className="tz-brand-sub" style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span className="tz-plan-badge" style={{ "--tz-plan-color": estado.color }}>{estado.label}</span>
          {textoVencimiento(negocio)}
        </p>

        <div className="tz-plan-filtros tz-plan-apartados">
          {APARTADOS.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`tz-gasto-tipo-btn ${apartado === a.id ? "tz-gasto-tipo-active" : ""}`}
              onClick={() => {
                setApartado(a.id);
                setError("");
              }}
            >
              {a.label}
            </button>
          ))}
        </div>

        {apartado === "estado" && (
          <>
          <div className="tz-gestor-recarga-datos">
            <div className="tz-gestor-recarga-dato">
              <span>Plan</span>
              <strong>{suspendido ? "Sin plan" : nombrePlan(negocio.plan_id) || "Sin plan"}</strong>
            </div>
            <div className="tz-gestor-recarga-dato">
              <span>Vence</span>
              <strong>{negocio.plan_exento ? "Exento" : negocio.plan_vence_at ? formatFechaCorta(negocio.plan_vence_at) : "—"}</strong>
            </div>
            <div className="tz-gestor-recarga-dato">
              <span>Sucursales</span>
              <strong>
                {sucursales}
                {planDe(negocio)?.max_sucursales != null ? ` de ${planDe(negocio).max_sucursales}` : ""}
              </strong>
            </div>
            <div className="tz-gestor-recarga-dato">
              <span>WhatsApp</span>
              <strong>{negocio.whatsapp || "Sin registrar"}</strong>
            </div>
          </div>
          <div className="tz-plan-seccion">
            <label className="tz-plan-campo tz-plan-campo-ancho">
              <span>Plan asignado (sin cobrar)</span>
              <select
                className="tz-text-input"
                value={suspendido ? "" : negocio.plan_id || ""}
                onChange={(e) => actualizarCampos({ plan_id: e.target.value || null }, "plan")}
                disabled={guardando === "plan" || suspendido}
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
              {suspendido && (
                <small className="tz-stock-editor-sub">
                  Suspendido: queda sin plan. Al registrar una recarga vuelve a tener el plan que pague.
                </small>
              )}
            </label>
            <label className="tz-plan-campo tz-plan-campo-ancho">
              <span>Estado</span>
              <select
                className="tz-text-input"
                value={modoDe(negocio)}
                disabled={guardando === "modo"}
                onChange={(e) =>
                  actualizarCampos(
                    {
                      plan_exento: e.target.value === "exento",
                      plan_suspendido_manual: e.target.value === "suspendido",
                      ...(e.target.value === "suspendido" ? { plan_id: null } : {}),
                    },
                    "modo"
                  )
                }
              >
                <option value="automatico">Automático (según la fecha de vencimiento)</option>
                <option value="exento">Exento (sin vencimiento ni límites)</option>
                <option value="suspendido">Suspendido manualmente (aunque tenga días pagados)</option>
              </select>
            </label>
          </div>
          </>
        )}

        {apartado === "recarga" &&
          (negocio.plan_exento ? (
            <p className="tz-stock-editor-sub">Este negocio es exento: no necesita recargas.</p>
          ) : (
            <RecargaRapida
              negocio={negocio}
              planes={planes}
              onPagado={alPagar}
            />
          ))}

        {apartado === "vencimiento" && (
          <div className="tz-plan-seccion" style={{ alignItems: "flex-end" }}>
            <label className="tz-plan-campo">
              <span>Vence el</span>
              <input type="date" className="tz-text-input" value={fechaManual} onChange={(e) => setFechaManual(e.target.value)} />
            </label>
            <button type="button" className="tz-cliente-action-btn" onClick={corregirVencimiento} disabled={guardando === "fecha"}>
              {guardando === "fecha" ? <Loader2 size={13} className="tz-spin" /> : <CalendarClock size={13} />} Guardar fecha
            </button>
            <p className="tz-stock-editor-sub" style={{ flexBasis: "100%", margin: 0 }}>
              Solo para corregir un error de fecha: no registra ningún pago.
            </p>
          </div>
        )}

        {apartado === "pagos" &&
          (cargandoPagos ? (
            <Loader2 size={18} className="tz-spin" />
          ) : pagos.length === 0 ? (
            <p className="tz-stock-editor-sub">Todavía no hay pagos registrados.</p>
          ) : (
            <div className="tz-cierre-list">
              {pagos.map((p) => (
                <div key={p.id} className={`tz-receipt tz-receipt-compact ${p.anulado ? "tz-plan-pago-anulado" : ""}`}>
                  <div className="tz-receipt-header">
                    <span className="tz-receipt-title">{p.codigo || "—"}</span>
                    <span className="tz-receipt-date">
                      {formatFechaCorta(p.created_at)} · {p.metodo || "?"}
                    </span>
                  </div>
                  <div className="tz-receipt-divider" />
                  <div className="tz-receipt-row">
                    <span>
                      {nombrePlan(p.plan_id) ? `Plan ${nombrePlan(p.plan_id)}` : "Plan"} · {p.meses} {p.meses === 1 ? "mes" : "meses"}
                    </span>
                    <strong>{formatSoles(p.monto)}</strong>
                  </div>
                  <div className="tz-receipt-row tz-plan-pagos-nota">
                    <span>Vigente hasta</span>
                    <span>{formatFechaCorta(p.vence_nuevo)}</span>
                  </div>
                  {p.vuelto != null && (
                    <div className="tz-receipt-row tz-plan-pagos-nota">
                      <span>Recibido · vuelto</span>
                      <span>
                        {formatSoles(p.monto_recibido)} · {formatSoles(p.vuelto)}
                      </span>
                    </div>
                  )}
                  <div className="tz-receipt-divider" />
                  <div className="tz-receipt-row tz-receipt-total">
                    <span>Total</span>
                    <strong>{formatSoles(p.monto)}</strong>
                  </div>
                  {p.comprobante_url && (
                    <button type="button" className="tz-comprobante-mini" onClick={() => setVerComprobante(p)} title="Ver comprobante">
                      <img src={p.comprobante_url} alt="Comprobante" loading="lazy" />
                      <span>Comprobante adjunto · tocar para ampliar</span>
                    </button>
                  )}
                  {p.anulado ? (
                    <p className="tz-tag tz-tag-danger" style={{ marginTop: 10, textAlign: "center" }}>
                      Anulado{p.anulado_at ? ` el ${formatFechaCorta(p.anulado_at)}` : ""}
                    </p>
                  ) : anulandoId === p.id ? (
                    <div className="tz-plan-pago-confirmar" style={{ marginTop: 10 }}>
                      ¿Anular? El vencimiento vuelve al {formatFechaCorta(p.vence_anterior) || "anterior"}.
                      <button type="button" className="tz-cliente-action-btn tz-cliente-action-deuda" onClick={() => anular(p)} disabled={!!guardando}>
                        {guardando === `anular-${p.id}` ? <Loader2 size={13} className="tz-spin" /> : <Trash2 size={13} />} Anular
                      </button>
                      <button type="button" className="tz-cliente-action-btn" onClick={() => setAnulandoId(null)}>
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="tz-cliente-actions" style={{ marginTop: 10 }}>
                      <button
                        type="button"
                        className="tz-cliente-action-btn tz-cliente-action-deuda"
                        style={{ flex: 1, justifyContent: "center" }}
                        disabled={p.id !== ultimoVigenteId}
                        title={p.id !== ultimoVigenteId ? "Solo se puede anular el último pago" : "Anular venta"}
                        onClick={() => setAnulandoId(p.id)}
                      >
                        <Trash2 size={13} /> Anular Venta
                      </button>
                      <button
                        type="button"
                        className="tz-cliente-action-btn tz-cliente-action-pago"
                        style={{ flex: 1, justifyContent: "center" }}
                        onClick={() => setVentaPanel(ventaDePago(p, negocio, planes))}
                      >
                        <Receipt size={13} /> Boleta
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}

        {error && <p className="tz-error">{error}</p>}
      </div>

      {verComprobante && (
        <div className="tz-modal-backdrop" style={{ zIndex: 120 }}>
          <div className="tz-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="tz-modal-close" onClick={() => setVerComprobante(null)} aria-label="Cerrar">
              <X size={18} />
            </button>
            <h2>Comprobante · {verComprobante.codigo}</h2>
            <img src={verComprobante.comprobante_url} alt="Comprobante" style={{ width: "100%", borderRadius: 12 }} />
          </div>
        </div>
      )}

      <PanelVentaRegistrada venta={ventaPanel} onCerrar={() => setVentaPanel(null)} />
    </div>
  );
}
