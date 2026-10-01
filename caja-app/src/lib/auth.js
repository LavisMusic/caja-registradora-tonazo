// Dummy-email helpers para el login por Celular+PIN (clientes) y por
// clave secreta (admin), sin exponer nunca un campo de correo en la UI.

export const ADMIN_DUMMY_EMAIL = "admin@tonazo.com";

// Cuenta única del super-admin (Fase 1) — igual que ADMIN_DUMMY_EMAIL,
// una sola cuenta, sin selector de "usuario". Separada de la de admin
// a propósito: son cuentas de Auth distintas, así el dueño de Tonazo
// sigue entrando a SU panel normal con su misma clave de siempre, y el
// panel super-admin (gestor de rubros/negocios) es un acceso aparte.
export const SUPER_ADMIN_DUMMY_EMAIL = "superadmin@tonazo.com";

export function celularToDummyEmail(celular) {
  const digits = String(celular || "").replace(/\D/g, "");
  return `${digits}@tonazo.app`;
}

export function usuarioToDummyEmail(usuario) {
  const clean = String(usuario || "")
    .trim()
    .toLowerCase();
  return `${clean}@tonazo.staff`;
}
