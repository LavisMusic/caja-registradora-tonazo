// Tema por negocio (Perfil → Tema). Un tema es:
//   { preset: "neon" }                         → una paleta armada, o
//   { modo: "oscuro"|"claro", principal: "#rrggbb" } → color libre
// y se convierte en las variables CSS de Styles.jsx (ver el bloque
// ".tz-root, .tz-portal" de arriba de esa hoja). Todo color de texto
// se ajusta solo hasta que se lea bien sobre el fondo (contraste WCAG
// ≥ 4.5 para texto principal), así ni una paleta ni un color libre
// pueden dejar algo ilegible.

// ---------- utilidades de color ----------
function hexARgb(hex) {
  const h = String(hex || "").replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.padEnd(6, "0").slice(0, 6);
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbAHex([r, g, b]) {
  return `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;
}
function rgbAHsl([r, g, b]) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}
function hslARgb([h, s, l]) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}
function luminancia([r, g, b]) {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
export function contraste(a, b) {
  const la = luminancia(hexARgb(a));
  const lb = luminancia(hexARgb(b));
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
// Aclara (fondo oscuro) u oscurece (fondo claro) un color hasta que se
// lea sobre ese fondo, conservando su tono.
function legible(hex, fondo, minimo = 4.5) {
  let [h, s, l] = rgbAHsl(hexARgb(hex));
  const fondoOscuro = luminancia(hexARgb(fondo)) < 0.2;
  for (let i = 0; i < 40 && contraste(rgbAHex(hslARgb([h, s, l])), fondo) < minimo; i += 1) {
    l = fondoOscuro ? Math.min(0.95, l + 0.025) : Math.max(0.08, l - 0.025);
  }
  return rgbAHex(hslARgb([h, s, l]));
}
// Texto encima de un color lleno (botón): oscuro o blanco, el que se lea.
function textoSobre(hex, oscuro = "#0b0716") {
  return contraste(hex, oscuro) >= contraste(hex, "#ffffff") ? oscuro : "#ffffff";
}
function girarTono(hex, grados, sat = null, lum = null) {
  const [h, s, l] = rgbAHsl(hexARgb(hex));
  return rgbAHex(hslARgb([h + grados, sat ?? s, lum ?? l]));
}
const rgbTexto = (hex) => hexARgb(hex).join(", ");

// ---------- paletas armadas ----------
// principal = --cyan (bordes, títulos, brillos), secundario = --pink,
// acento = --yellow (subtítulo, resaltados), botones = --orange (botones
// de la cabecera), fondo1/fondo2 = degradado del fondo.
export const PRESETS_TEMA = [
  { id: "neon", nombre: "Neón Tonazo", modo: "oscuro", principal: "#2be8ff", secundario: "#ff2f9e", acento: "#d7ff3b", botones: "#ff9500", fondo1: "#0a0716", fondo2: "#170e2e" },
  { id: "oceano", nombre: "Océano", modo: "oscuro", principal: "#38bdf8", secundario: "#22d3ee", acento: "#a5f3fc", botones: "#60a5fa", fondo1: "#03101c", fondo2: "#0a2336" },
  { id: "selva", nombre: "Selva", modo: "oscuro", principal: "#4ade80", secundario: "#a3e635", acento: "#facc15", botones: "#34d399", fondo1: "#04140b", fondo2: "#0b2616" },
  { id: "atardecer", nombre: "Atardecer", modo: "oscuro", principal: "#fb923c", secundario: "#f472b6", acento: "#fde047", botones: "#f97316", fondo1: "#170807", fondo2: "#2a0f18" },
  { id: "oro", nombre: "Oro", modo: "oscuro", principal: "#facc15", secundario: "#f59e0b", acento: "#fde68a", botones: "#eab308", fondo1: "#0d0b05", fondo2: "#1d180a" },
  { id: "lavanda", nombre: "Lavanda", modo: "oscuro", principal: "#c084fc", secundario: "#f0abfc", acento: "#a5b4fc", botones: "#a78bfa", fondo1: "#0e0818", fondo2: "#1d1233" },
  { id: "claro-azul", nombre: "Claro Azul", modo: "claro", principal: "#0284c7", secundario: "#db2777", acento: "#4d7c0f", botones: "#ea580c", fondo1: "#f5f7fb", fondo2: "#e8eef8" },
  { id: "claro-verde", nombre: "Claro Fresco", modo: "claro", principal: "#059669", secundario: "#0d9488", acento: "#65a30d", botones: "#16a34a", fondo1: "#f4faf6", fondo2: "#e4f3ea" },
  { id: "claro-rosa", nombre: "Claro Rosa", modo: "claro", principal: "#db2777", secundario: "#9333ea", acento: "#c2410c", botones: "#e11d48", fondo1: "#fdf6f9", fondo2: "#f8e6ef" },
  { id: "claro-oro", nombre: "Claro Oro", modo: "claro", principal: "#b45309", secundario: "#a16207", acento: "#65a30d", botones: "#d97706", fondo1: "#fdfaf3", fondo2: "#f6edd9" },
];
export const TEMA_POR_DEFECTO = { preset: "neon" };

// Paleta completa a partir de un color libre: secundario, acento y
// botones salen del mismo color girando el tono; el fondo, un tono muy
// oscuro (o muy claro) del principal.
function paletaLibre(principal, modo) {
  const [h, sat] = rgbAHsl(hexARgb(principal));
  const oscuro = modo !== "claro";
  // Un color sin tono (blanco, negro, gris) da un fondo neutro, no teñido.
  const k = sat < 0.08 ? 0 : 1;
  return {
    id: "libre",
    nombre: "Color libre",
    modo: oscuro ? "oscuro" : "claro",
    principal,
    // Armonía: secundario = tono vecino; acento = complementario
    // suavizado (resalta sin pelear); botones = el principal corrido.
    secundario: girarTono(principal, 40),
    acento: girarTono(principal, 180, Math.min(0.75, rgbAHsl(hexARgb(principal))[1])),
    botones: girarTono(principal, -20),
    fondo1: rgbAHex(hslARgb(oscuro ? [h, 0.45 * k, 0.05] : [h, 0.35 * k, 0.97])),
    fondo2: rgbAHex(hslARgb(oscuro ? [h, 0.5 * k, 0.12] : [h, 0.4 * k, 0.92])),
  };
}

export function resolverPaleta(tema) {
  if (tema && tema.principal && /^#[0-9a-f]{6}$/i.test(tema.principal)) return paletaLibre(tema.principal, tema.modo);
  return PRESETS_TEMA.find((p) => p.id === tema?.preset) || PRESETS_TEMA[0];
}

// Variables CSS del tema (las mismas que define Styles.jsx).
export function variablesTema(tema) {
  const p = resolverPaleta(tema);
  const oscuro = p.modo !== "claro";
  const fondo = p.fondo1;
  const panelSolido = oscuro ? rgbAHex(hslARgb([rgbAHsl(hexARgb(p.fondo2))[0], 0.45, 0.1])) : "#ffffff";
  // El contraste se mide contra el tono del fondo MÁS desfavorable
  // (fondo2: el más claro en oscuro, el más oscuro en claro).
  const ref = p.fondo2;
  const cyan = legible(p.principal, ref);
  const pink = legible(p.secundario, ref);
  const yellow = legible(p.acento, ref);
  const orange = legible(p.botones, ref);
  const green = legible(oscuro ? "#39ffb0" : "#047857", ref);
  const danger = legible(oscuro ? "#ff5470" : "#c81e3a", ref);
  const text = oscuro ? "#f4f2ff" : "#14111f";
  // Texto secundario: un gris teñido con el tono del fondo (en Neón
  // Tonazo da el mismo lavanda de siempre).
  const tonoFondo = rgbAHsl(hexARgb(p.fondo2))[0];
  const textDim = oscuro
    ? legible(rgbAHex(hslARgb([tonoFondo, 0.3, 0.68])), p.fondo2, 4.5)
    : legible(rgbAHex(hslARgb([tonoFondo, 0.12, 0.4])), p.fondo2, 4.5);
  const base = hexARgb(oscuro ? fondo : "#ffffff");
  const surface = hexARgb(oscuro ? p.fondo2 : "#ffffff");
  return {
    "--bg-1": p.fondo1,
    "--bg-2": p.fondo2,
    "--panel": oscuro ? `rgba(${hexARgb(p.fondo2).join(", ")}, 0.55)` : "rgba(255, 255, 255, 0.82)",
    "--panel-solid": panelSolido,
    "--cyan": cyan,
    "--cyan-rgb": rgbTexto(cyan),
    "--cyan-2": cyan,
    "--cyan-2-rgb": rgbTexto(cyan),
    "--pink": pink,
    "--pink-rgb": rgbTexto(pink),
    "--yellow": yellow,
    "--yellow-rgb": rgbTexto(yellow),
    "--orange": orange,
    "--orange-rgb": rgbTexto(orange),
    "--green": green,
    "--green-rgb": rgbTexto(green),
    "--danger": danger,
    "--danger-rgb": rgbTexto(danger),
    "--text": text,
    "--text-dim": textDim,
    "--fg-rgb": oscuro ? "255, 255, 255" : "20, 17, 31",
    "--shadow-rgb": oscuro ? "0, 0, 0" : "40, 30, 70",
    "--base-rgb": base.join(", "),
    "--base-deep-rgb": (oscuro ? base.map((v) => v * 0.5) : [244, 243, 248]).map(Math.round).join(", "),
    "--surface-rgb": surface.join(", "),
    "--surface-2-rgb": surface.join(", "),
    "--on-cyan": textoSobre(cyan),
    "--on-yellow": textoSobre(yellow),
    "--on-danger": textoSobre(danger),
    "--on-green": textoSobre(green),
  };
}

export function esTemaClaro(tema) {
  return resolverPaleta(tema).modo === "claro";
}

// Hoja de estilos del tema para inyectar (TemaNegocio.jsx). En modo
// claro se apagan los brillos de texto (sobre fondo blanco se ven
// borrosos) y los controles nativos (select, fecha) pasan a claro.
export function cssTema(tema) {
  const vars = Object.entries(variablesTema(tema))
    .map(([k, v]) => `${k}: ${v};`)
    .join(" ");
  const claro = esTemaClaro(tema);
  // ":root .tz-root" (más específico que ".tz-root") para ganarle a
  // cualquier otra copia de <Styles /> que un modal monte más abajo.
  return `:root .tz-root, :root .tz-portal { ${vars} color-scheme: ${claro ? "light" : "dark"}; }
${
  claro
    ? `:root .tz-root *, :root .tz-portal * { text-shadow: none !important; }
:root .tz-root .tz-logo { filter: drop-shadow(0 4px 14px rgba(40, 30, 70, 0.18)); }`
    : ""
}`;
}
