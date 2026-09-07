// Perú: los celulares se anotan localmente con 9 dígitos empezando en
// "9" (ej. 987654321), pero wa.me exige el número en formato
// internacional completo (con código de país, sin '+'). Si ya viene
// con código de país (u otro formato), se manda tal cual, sin adivinar
// de más. Copiado de App.jsx (toPeruWhatsappNumber) para reutilizarlo
// también en el flujo de pedidos del cliente, sin duplicar la lógica.
export function toPeruWhatsappNumber(whatsapp) {
  const cleaned = (whatsapp || "").replace(/[^\d]/g, "");
  if (!cleaned) return null;
  return cleaned.length === 9 && cleaned.startsWith("9") ? `51${cleaned}` : cleaned;
}

export function buildWhatsappLink(whatsapp, message) {
  const numero = toPeruWhatsappNumber(whatsapp);
  if (!numero) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(message)}`;
}
