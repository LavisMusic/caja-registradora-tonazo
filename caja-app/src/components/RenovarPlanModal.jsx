import { useEffect, useMemo, useState } from "react";
import { X, Loader2, Camera, Copy, Check, CreditCard, Clock, XCircle, Send, AlertTriangle, Store } from "lucide-react";
import { supabase } from "../supabaseClient";
import { subirComprobante } from "../lib/comprobantes";
import { useContactoPlataforma } from "../hooks/useContactoPlataforma";
import { formatSoles } from "../utils/format";
import { ESTADOS_PLAN, duracionPlan, formatFechaCorta, grupoDuracion, precioPlan, puedeRenovar, inicioRenovacion } from "../lib/planes";

// "Renovar plan" (pie de página del admin, Fase 4 bloque B): mismo
// flujo que la autorecarga del recolector en Taxi-PE —
//   1) elige el plan (pestañas Mensual / Anual / Otros),
//   2) copia el Yape/Plin o la cuenta de la plataforma y paga en su app,
//   3) elige el método y adjunta el comprobante,
//   4) se crea una PETICIÓN pendiente que el super admin aprueba (se
//      extiende el vencimiento) o rechaza con un motivo.
// Mientras hay una pendiente, el modal muestra su estado en vez del
// formulario (la base solo permite una pendiente por negocio).
const METODOS = [
  { key: "Yape", label: "Yape" },
  { key: "Plin", label: "Plin" },
  { key: "Transferencia", label: "Transferencia" },
];
const PESTANAS = [
  { id: "mensual", label: "Mensual" },
  { id: "anual", label: "Anual" },
  { id: "otros", label: "Otros" },
];

async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    // Fallback (HTTP sin contexto seguro, navegadores viejos).
    const ta = document.createElement("textarea");
    ta.value = texto;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

function BotonCopiar({ etiqueta, valor }) {
  const [copiado, setCopiado] = useState(false);
  if (!valor) return null;
  return (
    <button
      type="button"
      className={`tz-renovar-copiar ${copiado ? "tz-renovar-copiar-ok" : ""}`}
      onClick={async () => {
        if (await copiarTexto(valor)) {
          setCopiado(true);
          setTimeout(() => setCopiado(false), 1800);
        }
      }}
    >
      <span className="tz-renovar-copiar-etiqueta">{etiqueta}</span>
      <span className="tz-renovar-copiar-valor">{valor}</span>
      <span className="tz-renovar-copiar-accion">
        {copiado ? <Check size={14} /> : <Copy size={14} />} {copiado ? "¡Copiado!" : "Copiar"}
      </span>
    </button>
  );
}

function EstadoPeticion({ peticion }) {
  return (
    <div className="tz-renovar-estado">
      <span className="tz-renovar-estado-icono">
        <Clock size={26} />
      </span>
      <h3>Tu pago está en revisión</h3>
      <p className="tz-stock-editor-sub">
        {peticion.plan_nombre || "Plan"} · {duracionPlan(peticion.meses)} · {formatSoles(peticion.monto)} por {peticion.metodo}
        <br />
        Enviado el {formatFechaCorta(peticion.created_at)}. Apenas se apruebe, tu plan se extiende solo.
      </p>
      {peticion.comprobante_url && (
        <a href={peticion.comprobante_url} target="_blank" rel="noopener noreferrer">
          <img src={peticion.comprobante_url} alt="Comprobante enviado" className="tz-renovar-comprobante" />
        </a>
      )}
    </div>
  );
}

export default function RenovarPlanModal({
  negocioId,
  planActualId,
  plan,
  peticion,
  onPeticionEnviada,
  sinWhatsapp = false,
  onAbrirPerfil = null,
  onClose,
}) {
  const contacto = useContactoPlataforma();
  const [planes, setPlanes] = useState([]);
  const [cargandoPlanes, setCargandoPlanes] = useState(true);
  const [pestana, setPestana] = useState("mensual");
  const [planId, setPlanId] = useState(planActualId || "");
  const [metodo, setMetodo] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    supabase
      .from("planes")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true })
      .then(({ data }) => {
        if (!activo) return;
        setPlanes(data || []);
        setCargandoPlanes(false);
        const actual = (data || []).find((p) => p.id === planActualId);
        if (actual) setPestana(grupoDuracion(actual.meses));
      });
    return () => {
      activo = false;
    };
  }, [planActualId]);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const pestanasConPlanes = PESTANAS.filter((p) => planes.some((pl) => grupoDuracion(pl.meses) === p.id));
  const visibles = planes.filter((p) => grupoDuracion(p.meses) === pestana);
  const elegido = useMemo(() => planes.find((p) => p.id === planId) || null, [planes, planId]);
  const pendiente = peticion?.estado === "pendiente" ? peticion : null;
  const rechazada = peticion?.estado === "rechazado" ? peticion : null;
  const estado = ESTADOS_PLAN[plan?.estado] || null;
  const hayDatosPago = contacto.yape_plin || contacto.cuenta_bancaria;

  const elegirArchivo = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setArchivo(f);
    setPreview(URL.createObjectURL(f));
    setError("");
  };

  const enviar = async () => {
    setError("");
    if (!elegido) return setError("Elige el plan que vas a pagar.");
    if (!metodo) return setError("Elige con qué pagaste.");
    if (!archivo) return setError("Adjunta la foto o captura del comprobante.");
    setEnviando(true);
    // Foto comprimida antes de subir (lib/comprobantes.js).
    const { url, error: errSubida } = await subirComprobante(archivo, `planes/${negocioId}`);
    if (errSubida) {
      setEnviando(false);
      return setError("No se pudo subir el comprobante. Intenta de nuevo.");
    }
    const { error: errInsert } = await supabase.from("peticiones_plan").insert({
      negocio_id: negocioId,
      plan_id: elegido.id,
      plan_nombre: elegido.nombre,
      meses: elegido.meses,
      monto: precioPlan(elegido),
      metodo,
      comprobante_url: url,
    });
    setEnviando(false);
    if (errInsert) {
      return setError(
        errInsert.code === "23505"
          ? "Ya tienes un pago en revisión. Espera a que lo aprueben."
          : errInsert.message || "No se pudo enviar el pago."
      );
    }
    onPeticionEnviada?.();
  };

  return (
    <div className="tz-modal-backdrop">
      <div className="tz-modal tz-modal-wide" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <h2>
          <CreditCard size={17} /> Renovar plan
        </h2>
        {plan && (
          <p className="tz-brand-sub" style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {estado && <span className="tz-plan-badge" style={{ "--tz-plan-color": estado.color }}>{estado.label}</span>}
            {plan.venceAt ? `Vence el ${formatFechaCorta(plan.venceAt)}` : ""}
          </p>
        )}

        {pendiente ? (
          <EstadoPeticion peticion={pendiente} />
        ) : sinWhatsapp ? (
          // Regla (migración 0095): sin un WhatsApp registrado en el
          // perfil no se puede renovar — ahí llegan el resumen y la boleta.
          <div className="tz-renovar-estado">
            <span className="tz-renovar-estado-icono">
              <AlertTriangle size={26} />
            </span>
            <h3>Registra el WhatsApp de tu negocio</h3>
            <p className="tz-stock-editor-sub">
              Para renovar tu plan necesitas un número de WhatsApp en el perfil de tu negocio: ahí te llegan el resumen
              y la boleta de cada pago.
            </p>
            {onAbrirPerfil ? (
              <button type="button" className="tz-scan-btn tz-payment-save" onClick={onAbrirPerfil}>
                <Store size={15} /> Ir a mi perfil
              </button>
            ) : (
              <p className="tz-stock-editor-sub">Pídele al administrador del negocio que lo registre en "Perfil".</p>
            )}
          </div>
        ) : !puedeRenovar(plan?.venceAt) ? (
          <div className="tz-renovar-estado">
            <span className="tz-renovar-estado-icono">
              <Check size={26} />
            </span>
            <h3>Tu plan está vigente</h3>
            <p className="tz-stock-editor-sub">
              Vence el {formatFechaCorta(plan.venceAt)}. Podrás renovarlo desde el{" "}
              <strong>{formatFechaCorta(inicioRenovacion(plan.venceAt))}</strong> (3 días antes de que venza).
            </p>
          </div>
        ) : (
          <>
            {rechazada && (
              <div className="tz-plan-aviso tz-plan-aviso-gracia" style={{ width: "100%", margin: "0 0 12px" }}>
                <XCircle size={18} />
                <span>
                  <strong>Tu último pago fue rechazado:</strong> {rechazada.motivo_rechazo}. Puedes volver a enviarlo.
                </span>
              </div>
            )}

            <h3 className="tz-plan-subtitulo">1. Elige tu plan</h3>
            {cargandoPlanes ? (
              <Loader2 size={18} className="tz-spin" />
            ) : planes.length === 0 ? (
              <p className="tz-stock-editor-sub">Todavía no hay planes disponibles. Escríbenos a soporte.</p>
            ) : (
              <>
                {pestanasConPlanes.length > 1 && (
                  <div className="tz-plan-filtros">
                    {pestanasConPlanes.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className={`tz-gasto-tipo-btn ${pestana === p.id ? "tz-gasto-tipo-active" : ""}`}
                        onClick={() => setPestana(p.id)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}
                <div className="tz-renovar-planes">
                  {visibles.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`tz-renovar-plan ${planId === p.id ? "tz-renovar-plan-activo" : ""}`}
                      onClick={() => setPlanId(p.id)}
                    >
                      <span className="tz-renovar-plan-nombre">
                        {p.nombre}
                        {p.id === planActualId && <span className="tz-renovar-plan-actual">Tu plan</span>}
                      </span>
                      <span className="tz-renovar-plan-precio">{formatSoles(precioPlan(p))}</span>
                      <span className="tz-renovar-plan-detalle">
                        {duracionPlan(p.meses)}
                        {Number(p.descuento_pct) > 0 && <strong> · −{Number(p.descuento_pct)}%</strong>}
                        {" · "}
                        {p.max_sucursales == null ? "sucursales ilimitadas" : `hasta ${p.max_sucursales} sucursal(es)`}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            <h3 className="tz-plan-subtitulo">2. Paga desde tu app</h3>
            {hayDatosPago ? (
              <div className="tz-renovar-datos">
                <BotonCopiar etiqueta="Yape / Plin" valor={contacto.yape_plin} />
                <BotonCopiar etiqueta="Cuenta bancaria" valor={contacto.cuenta_bancaria} />
                {contacto.titular && <p className="tz-stock-editor-sub">Titular: {contacto.titular}</p>}
              </div>
            ) : (
              <p className="tz-stock-editor-sub">Todavía no hay datos de pago configurados. Escríbenos a soporte.</p>
            )}

            <h3 className="tz-plan-subtitulo">3. ¿Con qué pagaste?</h3>
            <div className="tz-gasto-tipo-buttons">
              {METODOS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  className={`tz-gasto-tipo-btn ${metodo === m.key ? "tz-gasto-tipo-active" : ""}`}
                  onClick={() => setMetodo(m.key)}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <h3 className="tz-plan-subtitulo">4. Comprobante</h3>
            <label className="tz-scan-btn" style={{ cursor: "pointer" }}>
              <Camera size={16} /> {archivo ? "Cambiar imagen" : "Adjuntar comprobante"}
              <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={elegirArchivo} />
            </label>
            {preview && <img src={preview} alt="Comprobante" className="tz-renovar-comprobante" />}

            {error && <p className="tz-error">{error}</p>}
            <button
              type="button"
              className="tz-scan-btn tz-payment-save"
              style={{ width: "100%", marginTop: 14 }}
              onClick={enviar}
              disabled={enviando}
            >
              {enviando ? <Loader2 size={15} className="tz-spin" /> : <Send size={15} />}
              {elegido ? ` Enviar pago de ${formatSoles(precioPlan(elegido))}` : " Enviar pago"}
            </button>
            <p className="tz-stock-editor-sub" style={{ textAlign: "center", marginTop: 6 }}>
              Revisamos tu comprobante y tu plan se extiende apenas se aprueba.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
