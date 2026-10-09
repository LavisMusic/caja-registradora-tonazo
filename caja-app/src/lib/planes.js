// Fase 4 — estados del plan de un negocio. La base es la fuente de verdad
// (columna calculada `plan_estado` + triggers, migraciones 0087/0088);
// acá se replica el MISMO cálculo para poder reaccionar en tiempo real
// (los cambios que llegan por Realtime no traen la columna calculada) y
// para cambiar de estado en el momento exacto en que vence, sin recargar.

export const DIAS_GRACIA = 5;
// Desde cuántos días antes del vencimiento se avisa al admin.
export const DIAS_AVISO = 7;
// Ventana de renovación (migración 0090): con el plan vigente solo se
// puede pagar en los últimos 3 días antes de que venza — misma regla que
// el recolector de Taxi-PE (no se vende otra membresía mientras la
// actual sigue vigente), con margen para que el negocio pague a tiempo.
export const DIAS_VENTANA_RENOVACION = 3;
const MS_DIA = 86400000;

export const ESTADOS_PLAN = {
  exento: { label: "Exento", color: "var(--cyan)" },
  prueba: { label: "Prueba", color: "var(--yellow)" },
  activo: { label: "Activo", color: "var(--green)" },
  gracia: { label: "En gracia", color: "var(--orange, #ff9500)" },
  suspendido: { label: "Suspendido", color: "var(--danger, #ff5470)" },
};

// Mismo cálculo que public.plan_estado(negocios) en la base.
export function calcularEstadoPlan(n, ahora = Date.now()) {
  if (!n) return "activo";
  if (n.plan_suspendido_manual) return "suspendido";
  if (n.plan_exento) return "exento";
  if (!n.plan_vence_at) return "activo";
  const vence = new Date(n.plan_vence_at).getTime();
  if (ahora < vence) return n.plan_en_prueba ? "prueba" : "activo";
  if (ahora < vence + DIAS_GRACIA * MS_DIA) return "gracia";
  return "suspendido";
}

// Milisegundos hasta el próximo cambio de estado por el paso del tiempo
// (entra a "por vencer", vence → gracia, gracia → suspendido), o null si
// no hay ninguno pendiente. Sirve para programar un temporizador.
export function msHastaProximoCambio(n, ahora = Date.now()) {
  if (!n || n.plan_suspendido_manual || n.plan_exento || !n.plan_vence_at) return null;
  const vence = new Date(n.plan_vence_at).getTime();
  const hitos = [vence - DIAS_AVISO * MS_DIA, vence - DIAS_VENTANA_RENOVACION * MS_DIA, vence, vence + DIAS_GRACIA * MS_DIA];
  const proximo = hitos.find((t) => t > ahora);
  return proximo == null ? null : proximo - ahora + 500;
}

// ¿Se puede pagar/renovar ya? (sin fecha, ya vencido, o dentro de los
// últimos DIAS_VENTANA_RENOVACION días). Misma regla que la base.
export function puedeRenovar(venceAt, ahora = Date.now()) {
  if (!venceAt) return true;
  return ahora >= new Date(venceAt).getTime() - DIAS_VENTANA_RENOVACION * MS_DIA;
}

// Desde qué fecha se habilita la renovación.
export function inicioRenovacion(venceAt) {
  if (!venceAt) return null;
  return new Date(new Date(venceAt).getTime() - DIAS_VENTANA_RENOVACION * MS_DIA);
}

// Días enteros que faltan para `fecha` (negativo si ya pasó).
export function diasHasta(fecha) {
  if (!fecha) return null;
  const ms = new Date(fecha).getTime() - Date.now();
  return Math.ceil(ms / MS_DIA);
}

export function formatFechaCorta(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// El negocio puede recibir pedidos online / aparecer en el directorio.
export function planPermiteOnline(estado) {
  return !estado || ["exento", "prueba", "activo"].includes(estado);
}

// Precio total de un plan: mensual × meses − descuento %.
export function precioPlan(plan) {
  if (!plan) return 0;
  const bruto = Number(plan.precio_mensual || 0) * Number(plan.meses || 1);
  const neto = bruto * (1 - Number(plan.descuento_pct || 0) / 100);
  return Math.round(neto * 100) / 100;
}

// "Mensual", "Anual" o "N meses" — también define la pestaña del gestor.
export function duracionPlan(meses) {
  const m = Number(meses || 1);
  if (m === 1) return "Mensual";
  if (m === 12) return "Anual";
  return `${m} meses`;
}

export function grupoDuracion(meses) {
  const m = Number(meses || 1);
  if (m === 1) return "mensual";
  if (m === 12) return "anual";
  return "otros";
}
