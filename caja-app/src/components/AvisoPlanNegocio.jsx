import { AlertTriangle, Lock, LogOut, MessageCircle } from "lucide-react";
import { useContactoPlataforma } from "../hooks/useContactoPlataforma";
import { buildWhatsappLink } from "../lib/whatsapp";
import { DIAS_AVISO, DIAS_GRACIA, diasHasta, formatFechaCorta } from "../lib/planes";

// Fase 4 — avisos del plan para admin/cajero de un negocio.
//   * Por vencer (≤ 7 días, prueba o activo): aviso amarillo, solo admin.
//   * Gracia (días 1-5 vencido): aviso rojo para admin y cajero — ya no
//     aparece en el directorio ni recibe pedidos online.
//   * Suspendido: pantalla completa (PantallaPlanSuspendido).
// El estado lo decide la base (columna plan_estado); acá solo se muestra.

function usePagarLink(negocioNombre) {
  const { whatsapp_pagos } = useContactoPlataforma();
  return buildWhatsappLink(
    whatsapp_pagos,
    `Hola, quiero pagar el plan de mi negocio${negocioNombre ? ` ${negocioNombre}` : ""} en Tonazo.`
  );
}

export function AvisoPlan({ plan, esAdmin, negocioNombre }) {
  const link = usePagarLink(negocioNombre);
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
        {esAdmin && link && (
          <a className="tz-plan-aviso-btn" href={link} target="_blank" rel="noopener noreferrer">
            <MessageCircle size={14} /> Pagar
          </a>
        )}
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
        {link && (
          <a className="tz-plan-aviso-btn" href={link} target="_blank" rel="noopener noreferrer">
            <MessageCircle size={14} /> Renovar
          </a>
        )}
      </div>
    );
  }

  return null;
}

export function PantallaPlanSuspendido({ esAdmin, negocioNombre, logo, onSalir }) {
  const link = usePagarLink(negocioNombre);
  return (
    <>
      <img src={logo} alt="Logo del negocio" className="tz-caja-blocked-logo" />
      <Lock size={44} />
      <h1>Plan suspendido</h1>
      <p>
        {esAdmin
          ? "El plan de tu negocio venció y pasaron los días de gracia. Regulariza el pago para volver a usar la caja."
          : "El plan de este negocio está suspendido. Avisa al administrador para que lo regularice."}
      </p>
      {esAdmin && link && (
        <a className="tz-scan-btn tz-payment-save tz-plan-suspendido-pagar" href={link} target="_blank" rel="noopener noreferrer">
          <MessageCircle size={16} /> Escribir para pagar
        </a>
      )}
      <button className="tz-header-btn tz-caja-blocked-logout" onClick={onSalir}>
        <LogOut size={16} /> Cerrar sesión
      </button>
    </>
  );
}
