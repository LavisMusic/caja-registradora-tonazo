export function formatSoles(n) {
  return `S/ ${Number(n).toFixed(n % 1 === 0 ? 0 : 2)}`;
}

export function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
