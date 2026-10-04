// TEMAS TEMÁTICOS por rubro (Perfil → Tema → "Temático de tu rubro").
// Un temático = una paleta fija + ADORNOS dibujados en código (texturas,
// tuercas, tornillos… como capas SVG de fondo — no pseudo-elementos, así
// no pisan ningún efecto existente de la app). Solo lo pueden usar los
// negocios de ese rubro (rubros.clave, migración 0097; la RPC
// actualizar_tema_negocio lo verifica).
// Se guarda como { tematico: "metal", rubro: "ferreteria" }.
//
// css(S): S es la lista de selectores "raíz" donde aplica (la caja y la
// tienda: ":root .tz-root" y ":root .tz-portal"; en la vista previa del
// Perfil, la caja de vista previa). `en(S, sub)` arma "raíz sub" para
// cada raíz.
export const en = (S, sub = "") => S.map((s) => `${s}${sub ? " " + sub : ""}`).join(", ");
const svg = (s) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;

// ---------------------------------------------------------------------
// FERRETERÍA — "Metal industrial"
// ---------------------------------------------------------------------
const TUERCA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#f3f6f9'/><stop offset='.45' stop-color='#a9b3bd'/><stop offset='1' stop-color='#4a525b'/></linearGradient></defs><polygon points='10,1.2 17.6,5.6 17.6,14.4 10,18.8 2.4,14.4 2.4,5.6' fill='url(#g)' stroke='#22272c' stroke-width='1.1'/><circle cx='10' cy='10' r='3.7' fill='#15181c' stroke='#7b858f' stroke-width='1.1'/><circle cx='9' cy='9' r='1.2' fill='#3a4148'/></svg>`
);
const TORNILLO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'><defs><radialGradient id='g' cx='.35' cy='.3' r='.8'><stop offset='0' stop-color='#f5f7fa'/><stop offset='.55' stop-color='#9ba5af'/><stop offset='1' stop-color='#3f464e'/></radialGradient></defs><circle cx='10' cy='10' r='8' fill='url(#g)' stroke='#1f2328' stroke-width='1.2'/><path d='M6 10h8M10 6v8' stroke='#2a2f35' stroke-width='2' stroke-linecap='round'/></svg>`
);
const PLACA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='26' height='26'><g stroke-linecap='round' stroke-width='3'><path d='M4 11 L11 4' stroke='rgba(255,255,255,0.10)'/><path d='M5 12 L12 5' stroke='rgba(0,0,0,0.45)' stroke-width='1.5'/><path d='M15 4 L22 11' stroke='rgba(255,255,255,0.10)'/><path d='M16 5 L23 12' stroke='rgba(0,0,0,0.45)' stroke-width='1.5'/><path d='M4 15 L11 22' stroke='rgba(255,255,255,0.10)'/><path d='M5 16 L12 23' stroke='rgba(0,0,0,0.45)' stroke-width='1.5'/><path d='M15 22 L22 15' stroke='rgba(255,255,255,0.10)'/><path d='M16 23 L23 16' stroke='rgba(0,0,0,0.45)' stroke-width='1.5'/></g></svg>`
);
const CEPILLADO = "repeating-linear-gradient(90deg, rgba(255,255,255,0.028) 0 1px, transparent 1px 3px, rgba(0,0,0,0.05) 3px 4px)";
const ACERO = "linear-gradient(180deg, #4a535c 0%, #2c3238 48%, #22272c 52%, #30363d 100%)";
const PLANCHA = "linear-gradient(160deg, #2e343a 0%, #1f2428 60%, #262b30 100%)";
const BRILLO = "inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -2px 0 rgba(0,0,0,0.45)";
const SEGURIDAD = "repeating-linear-gradient(-45deg, #ffcc00 0 12px, #16181b 12px 24px)";
// Tuercas en las 4 esquinas (tamaño t, separación m del borde).
const cuatroEsquinas = (img, t, m) => ({
  imagen: `${img}, ${img}, ${img}, ${img}`,
  pos: `left ${m}px top ${m}px, right ${m}px top ${m}px, left ${m}px bottom ${m}px, right ${m}px bottom ${m}px`,
  tam: `${t}px ${t}px, ${t}px ${t}px, ${t}px ${t}px, ${t}px ${t}px`,
});

function cssMetal(S) {
  const nut = cuatroEsquinas(TUERCA, 9, 3);
  const nutGrande = cuatroEsquinas(TORNILLO, 11, 6);
  return `
${en(S)} {
  background:
    radial-gradient(ellipse 900px 420px at 15% -10%, rgba(255,255,255,0.07), transparent 60%),
    ${CEPILLADO},
    linear-gradient(170deg, #1a1d21 0%, #121417 45%, #1b1f23 100%) !important;
}
${en(S, ".tz-header")} {
  background: ${PLACA}, ${ACERO} !important;
  background-size: 26px 26px, auto !important;
  border-bottom: 7px solid transparent !important;
  border-image: ${SEGURIDAD} 1 !important;
  box-shadow: 0 6px 18px rgba(0,0,0,0.55);
}
${en(S, ".tz-header-btn")}, ${en(S, ".tz-scan-btn:not(.tz-payment-save)")}, ${en(S, ".tz-csv-btn")} {
  background: ${nut.imagen}, ${CEPILLADO}, ${ACERO} !important;
  background-position: ${nut.pos}, 0 0, 0 0 !important;
  background-size: ${nut.tam}, auto, auto !important;
  background-repeat: no-repeat, no-repeat, no-repeat, no-repeat, repeat, no-repeat !important;
  border: 1px solid #77818b !important;
  box-shadow: ${BRILLO}, 0 3px 8px rgba(0,0,0,0.5) !important;
  text-shadow: 0 1px 0 rgba(0,0,0,0.7);
}
${en(S, ".tz-header-btn")} { padding-left: 16px; padding-right: 16px; }
${en(S, ".tz-header-btn:hover")}, ${en(S, ".tz-scan-btn:not(.tz-payment-save):hover")} { filter: brightness(1.15); }
${en(S, ".tz-footer-btn")} {
  background: ${TORNILLO}, ${TORNILLO}, ${CEPILLADO}, ${ACERO} !important;
  background-position: left 10px center, right 10px center, 0 0, 0 0 !important;
  background-size: 12px 12px, 12px 12px, auto, auto !important;
  background-repeat: no-repeat, no-repeat, repeat, no-repeat !important;
  border-radius: 10px !important;
  border: 1px solid #77818b !important;
  color: #ffcc00 !important;
  box-shadow: ${BRILLO}, 0 4px 10px rgba(0,0,0,0.55) !important;
  text-shadow: 0 1px 0 rgba(0,0,0,0.8);
}
${en(S, ".tz-page-footer")} {
  background: ${PLACA}, linear-gradient(180deg, #1d2125, #121417) !important;
  background-size: 26px 26px, auto !important;
  border-top: 7px solid transparent !important;
  border-image: ${SEGURIDAD} 1 !important;
}
${en(S, ".tz-stat-chip")}, ${en(S, ".tz-card")}, ${en(S, ".tz-receipt")}, ${en(S, ".tz-admin-filterbar")}, ${en(S, ".tz-method-total")}, ${en(S, ".tz-history-row")} {
  background: ${nutGrande.imagen}, ${CEPILLADO}, ${PLANCHA} !important;
  background-position: ${nutGrande.pos}, 0 0, 0 0 !important;
  background-size: ${nutGrande.tam}, auto, auto !important;
  background-repeat: no-repeat, no-repeat, no-repeat, no-repeat, repeat, no-repeat !important;
  border: 1px solid #59626b !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.10), inset 0 0 0 1px rgba(0,0,0,0.35), 0 6px 16px rgba(0,0,0,0.45) !important;
}
${en(S, ".tz-stat-chip")}, ${en(S, ".tz-method-total")} { padding-left: 22px !important; padding-right: 22px !important; }
${en(S, ".tz-modal")} {
  background: ${nutGrande.imagen}, ${CEPILLADO}, linear-gradient(170deg, #2a3035 0%, #1a1e22 100%) !important;
  background-position: ${nutGrande.pos}, 0 0, 0 0 !important;
  background-size: ${nutGrande.tam}, auto, auto !important;
  background-repeat: no-repeat, no-repeat, no-repeat, no-repeat, repeat, no-repeat !important;
  border: 2px solid #6b757f !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 20px 60px rgba(0,0,0,0.7) !important;
}
${en(S, ".tz-modal h2")} {
  color: #e9edf1 !important;
  text-shadow: 0 1px 0 #000, 0 0 12px rgba(255,204,0,0.25);
  border-bottom: 4px solid transparent;
  border-image: ${SEGURIDAD} 1;
  padding-bottom: 8px;
}
${en(S, ".tz-tab")}, ${en(S, ".tz-gasto-tipo-btn")} {
  background: ${CEPILLADO}, ${ACERO} !important;
  border: 1px solid #66707a !important;
  box-shadow: ${BRILLO} !important;
  color: #d5dbe1 !important;
}
${en(S, ".tz-tab-active")}, ${en(S, ".tz-gasto-tipo-active")} {
  background: ${CEPILLADO}, linear-gradient(180deg, #ffe066 0%, #ffcc00 50%, #e0a800 100%) !important;
  border-color: #8a6a00 !important;
  color: #16181b !important;
  text-shadow: 0 1px 0 rgba(255,255,255,0.4);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -2px 0 rgba(0,0,0,0.25), 0 0 14px rgba(255,204,0,0.35) !important;
}
${en(S, ".tz-text-input")}, ${en(S, ".tz-admin-filter-select")}, ${en(S, ".tz-amount-input")} {
  background: linear-gradient(180deg, #0f1114, #171a1e) !important;
  border: 1px solid #4b535b !important;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.06) !important;
}
${en(S, ".tz-subtitle")} { letter-spacing: 0.16em; }
${en(S, ".tz-logo")} { filter: drop-shadow(0 4px 10px rgba(0,0,0,0.7)) drop-shadow(0 0 18px rgba(255,204,0,0.25)) !important; }
`;
}

export const TEMATICOS = [
  {
    id: "metal",
    rubro: "ferreteria",
    nombre: "Metal industrial",
    descripcion: "Acero cepillado, tuercas y franjas de seguridad",
    paleta: {
      id: "tematico-metal",
      nombre: "Metal industrial",
      modo: "oscuro",
      principal: "#b8c4d0",
      secundario: "#ff8a1f",
      acento: "#ffcc00",
      botones: "#ffcc00",
      fondo1: "#121417",
      fondo2: "#262b31",
    },
    // Muestra para la tarjeta del Perfil.
    muestra: `${TUERCA} left 8px top 8px / 16px 16px no-repeat, ${TUERCA} right 8px bottom 8px / 16px 16px no-repeat, ${PLACA} 0 0 / 20px 20px, ${ACERO}`,
    css: cssMetal,
  },
];

export function tematicoDe(tema) {
  if (!tema?.tematico) return null;
  return TEMATICOS.find((t) => t.id === tema.tematico && t.rubro === tema.rubro) || null;
}

export function tematicosDelRubro(claveRubro) {
  return TEMATICOS.filter((t) => t.rubro === claveRubro);
}
