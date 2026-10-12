// Hora en que debe cerrarse una caja abierta: la hora de cierre de su
// sucursal el día que se abrió (sucursales.horario, ver lib/horario.js);
// si ese día no tiene horario —o la caja se abrió después de esa hora—,
// a las 00:00 siguientes (si se abrió en las últimas 3 horas antes de la
// medianoche, a las 00:00 del día siguiente). Una extensión (cajas.extendida_hasta, de 30 en
// 30 minutos) la corre más tarde. Todo en milisegundos, como abierta_en.
const POR_GETDAY = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"];
export const EXTENSION_TURNO_MS = 30 * 60 * 1000;
// Extensiones por turno: el cajero hasta 3, el admin hasta 5 (contando las
// del cajero). Lo controla la base (caja_extender_turno).
export const MAX_EXTENSIONES_CAJERO = 3;
export const MAX_EXTENSIONES_ADMIN = 5;
const TRES_HORAS_MS = 3 * 60 * 60 * 1000;

function medianocheSiguiente(ms) {
  const d = new Date(ms);
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

export function venceCaja(caja, sucursal) {
  if (!caja || caja.estado !== "abierta" || !caja.abiertaEn) return null;
  const apertura = new Date(caja.abiertaEn);
  const dia = sucursal?.horario?.[POR_GETDAY[apertura.getDay()]];
  let vence = medianocheSiguiente(caja.abiertaEn + TRES_HORAS_MS);
  if (dia?.cierra && /^\d{1,2}:\d{2}$/.test(dia.cierra)) {
    const [h, m] = dia.cierra.split(":").map(Number);
    const cierre = new Date(apertura);
    cierre.setHours(h, m, 0, 0);
    // Horario que cruza la medianoche (abre 18:00, cierra 02:00).
    if (dia.abre && dia.cierra <= dia.abre) cierre.setDate(cierre.getDate() + 1);
    if (cierre.getTime() > caja.abiertaEn) vence = cierre.getTime();
  }
  return Math.max(vence, Number(caja.extendidaHasta) || 0);
}

export function cajaVencida(caja, sucursal, ahora = Date.now()) {
  const vence = venceCaja(caja, sucursal);
  return vence != null && ahora >= vence;
}
