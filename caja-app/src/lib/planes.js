// Fase 4 — estados del plan de un negocio. El estado lo calcula la base
// (columna calculada `plan_estado`, migración 0087), acá solo se
// traduce a texto/colores y se cuentan los días para los avisos.

export const DIAS_GRACIA = 5;
// Desde cuántos días antes del vencimiento se avisa al admin.
export const DIAS_AVISO = 7;

export const ESTADOS_PLAN = {
  exento: { label: "Exento", color: "var(--cyan)" },
  prueba: { label: "Prueba", color: "var(--yellow)" },
  activo: { label: "Activo", color: "var(--green)" },
  gracia: { label: "En gracia", color: "var(--orange, #ff9500)" },
  suspendido: { label: "Suspendido", color: "var(--danger, #ff5470)" },
};

// Días enteros que faltan para `fecha` (negativo si ya pasó).
export function diasHasta(fecha) {
  if (!fecha) return null;
  const ms = new Date(fecha).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}

export function formatFechaCorta(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// El negocio puede recibir pedidos online / aparecer en el directorio.
export function planPermiteOnline(estado) {
  return !estado || ["exento", "prueba", "activo"].includes(estado);
}
