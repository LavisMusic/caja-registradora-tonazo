import { AlertTriangle, Clock, CreditCard, Lock, LogOut } from "lucide-react";
import { DIAS_AVISO, DIAS_GRACIA, diasHasta, formatFechaCorta } from "../lib/planes";

// Fase 4 — avisos del plan para admin/cajero de un negocio.
//   * Por vencer (≤ 7 días, prueba o activo): aviso amarillo, solo admin.
//   * Gracia (días 1-5 vencido): aviso rojo para admin y cajero — ya no
//     aparece en el directorio ni recibe pedidos online.
//   * Suspendido: pantalla completa (PantallaPlanSuspendido).
// El botón de pago abre "Renovar plan" (RenovarPlanModal, mismo flujo de
// petición + comprobante que la autorecarga del recolector de Taxi-PE).
// Si ya hay un pago en revisión, se avisa eso en vez de pedir pagar.

function BotonRenovar({ onRenovar, enRevision, texto }) {
  if (enRevision) {
    return (
      <span className="tz-plan-aviso-btn tz-plan-aviso-btn-revision">
        <Clock size={14} /> En revisión
      </span>
    );
  }
  return (
    <button type="button" className="tz-plan-aviso-btn" onClick={onRenovar}>
      <CreditCard size={14} /> {texto}
    </button>
  );
}

export function AvisoPlan({ plan, esAdmin, onRenovar, enRevision = false }) {
  if (!plan || plan.exento) return null;
  const dias = diasHasta(plan.venceAt);

  if (plan.estado === "gracia") {
    const suspension = new Date(new Date(plan.venceAt).getTime() + DIAS_GRACIA * 86400000);
    return (
      <div className="tz-plan-aviso tz-plan-aviso-gracia" role="alert">
        <AlertTriangle size={18} />
        <span>
          <strong>Tu plan venció.</strong> Tu negocio ya no aparece en el directorio ni recibe pedidos online.
          La caja se bloquea el <strong>{formatFechaCorta(suspension)}</strong>
          {esAdmin ? "." : " — avisa al administrador."}
        </span>
        {esAdmin && <BotonRenovar onRenovar={onRenovar} enRevision={enRevision} texto="Pagar" />}
      </div>
    );
  }

  if (esAdmin && ["prueba", "activo"].includes(plan.estado) && dias != null && dias <= DIAS_AVISO) {
    const cuando = dias <= 0 ? "hoy" : dias === 1 ? "mañana" : `en ${dias} días`;
    return (
      <div className="tz-plan-aviso" role="status">
        <AlertTriangle size={18} />
        <span>
          {plan.estado === "prueba" ? "Tu prueba gratis" : "Tu plan"} vence <strong>{cuando}</strong> ({formatFechaCorta(plan.venceAt)}).
          Renueva para seguir apareciendo en el directorio.
        </span>
        <BotonRenovar onRenovar={onRenovar} enRevision={enRevision} texto="Renovar" />
      </div>
    );
  }

  return null;
}

export function PantallaPlanSuspendido({ esAdmin, logo, onSalir, onRenovar, enRevision = false }) {
  return (
    <>
      <img src={logo} alt="Logo del negocio" className="tz-caja-blocked-logo" />
      <Lock size={44} />
      <h1>Plan suspendido</h1>
      <p>
        {esAdmin
          ? enRevision
            ? "Tu pago está en revisión. Apenas se apruebe, la caja se desbloquea sola."
            : "El plan de tu negocio está suspendido. Regulariza el pago para volver a usar la caja."
          : "El plan de este negocio está suspendido. Avisa al administrador para que lo regularice."}
      </p>
      {esAdmin && (
        <button type="button" className="tz-scan-btn tz-payment-save tz-plan-suspendido-pagar" onClick={onRenovar}>
          {enRevision ? <Clock size={16} /> : <CreditCard size={16} />} {enRevision ? "Ver mi pago" : "Pagar mi plan"}
        </button>
      )}
      <button className="tz-header-btn tz-caja-blocked-logout" onClick={onSalir}>
        <LogOut size={16} /> Cerrar sesión
      </button>
    </>
  );
}
