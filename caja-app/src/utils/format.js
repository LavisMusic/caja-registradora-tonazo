export function formatSoles(n) {
  return `S/ ${Number(n).toFixed(n % 1 === 0 ? 0 : 2)}`;
}

// "1.25 Kg" para venta a granel, "3" (bare, como siempre) para
// productos por unidad — un solo lugar que decide el formato de
// cantidad para carrito/tarjetas/boletas/WhatsApp, así los tres nunca
// pueden mostrar cosas distintas entre sí.
export function formatQty(ventaPorPeso, qty) {
  const n = Number(qty) || 0;
  return ventaPorPeso ? `${n.toFixed(2)} Kg` : String(n);
}

export function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
