// Horario de atención por sucursal (sucursales.horario, migración 0095):
//   { lun: { abre: "08:00", cierra: "20:00" }, ..., dom: null }
// null en un día = cerrado ese día; horario null = sin horario cargado.
export const DIAS_SEMANA = [
  { id: "lun", label: "Lunes" },
  { id: "mar", label: "Martes" },
  { id: "mie", label: "Miércoles" },
  { id: "jue", label: "Jueves" },
  { id: "vie", label: "Viernes" },
  { id: "sab", label: "Sábado" },
  { id: "dom", label: "Domingo" },
];

// getDay(): 0 = domingo.
const POR_GETDAY = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"];

// Horario por defecto al cargar uno nuevo: de 08:00 a 00:00 (el cierre de
// caja por defecto es a medianoche), domingo cerrado.
export const HORA_ABRE_DEFECTO = "08:00";
export const HORA_CIERRA_DEFECTO = "00:00";
export function horarioVacio() {
  return Object.fromEntries(
    DIAS_SEMANA.map((d) => [d.id, d.id === "dom" ? null : { abre: HORA_ABRE_DEFECTO, cierra: HORA_CIERRA_DEFECTO }])
  );
}

// Texto para la tienda pública: el horario de HOY de la sucursal.
export function textoHorarioHoy(horario, fecha = new Date()) {
  if (!horario || typeof horario !== "object") return null;
  const dia = horario[POR_GETDAY[fecha.getDay()]];
  if (!dia || !dia.abre || !dia.cierra) return "Hoy no atendemos";
  return `Hoy atendemos de ${dia.abre} a ${dia.cierra}`;
}
