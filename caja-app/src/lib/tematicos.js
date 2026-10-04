// TEMAS TEMÁTICOS por rubro (Perfil → Tema → "Temático de tu rubro").
// Un temático = una paleta fija + ADORNOS dibujados en código (texturas,
// tuercas, toldos, olas… como capas SVG/degradados de fondo — no
// pseudo-elementos, así no pisan ningún efecto existente de la app).
// Solo lo pueden usar los negocios de ese rubro (rubros.clave, migración
// 0097; la RPC actualizar_tema_negocio lo verifica). Uno por rubro (con
// el tiempo un rubro puede tener varios).
// Se guarda como { tematico: "metal", rubro: "ferreteria" }.
// `escena` (opcional): elementos animados que TemaNegocio dibuja en una
// capa FIJA detrás de todo el contenido (peces, burbujas…) — solo se
// mueven con transform/opacity, lo más liviano para el celular.
//
// css(S): S es la lista de selectores "raíz" donde aplica (la caja y la
// tienda: ":root .tz-root" y ":root .tz-portal"; en la vista previa del
// Perfil, la caja de vista previa). `en(S, sub)` arma "raíz sub" para
// cada raíz. Cada temático describe sus MATERIALES (capas de fondo de
// cada pieza) y `construir` arma el CSS común: fondo, cabecera, pie
// (siempre a todo el ancho de la pantalla), botones, paneles, ventanas,
// pestañas y campos.
export const en = (S, sub = "") => S.map((s) => `${s}${sub ? " " + sub : ""}`).join(", ");
const svg = (s) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;

// Capas de fondo: [{ img, pos, size, rep }] → declaraciones CSS.
function fondo(capas) {
  return `background: ${capas.map((c) => c.img).join(", ")} !important;
  background-position: ${capas.map((c) => c.pos || "0 0").join(", ")} !important;
  background-size: ${capas.map((c) => c.size || "auto").join(", ")} !important;
  background-repeat: ${capas.map((c) => c.rep || "no-repeat").join(", ")} !important;`;
}
const capa = (img, pos = "0 0", size = "auto", rep = "no-repeat") => ({ img, pos, size, rep });
const trama = (img, size) => capa(img, "0 0", size, "repeat");
// El mismo adorno en las 4 esquinas (tamaño t, separación m del borde).
const esquinas = (img, t, m) =>
  [`left ${m}px top ${m}px`, `right ${m}px top ${m}px`, `left ${m}px bottom ${m}px`, `right ${m}px bottom ${m}px`].map((p) =>
    capa(img, p, `${t}px ${t}px`)
  );

// Pie a TODO el ancho de la pantalla (el diseño base lo deja como un
// "dock" centrado de 700px / 95%): el fondo del temático llega a los
// bordes y los botones siguen centrados con el mismo ancho de antes.
function pieCompleto(S) {
  const lado = "max(12px, calc((100% - 700px) / 2))";
  const ladoEscritorio = "max(12px, calc((100% - min(95%, 1400px)) / 2))";
  return `
${en(S, ".tz-page-footer")} {
  width: 100% !important; max-width: none !important;
  margin-left: 0 !important; margin-right: 0 !important;
  border-radius: 0 !important; border-left: none !important; border-right: none !important;
  padding-left: ${lado} !important; padding-right: ${lado} !important;
}
@media (min-width: 1024px) {
  ${en(S, ".tz-page-footer")} { padding-left: ${ladoEscritorio} !important; padding-right: ${ladoEscritorio} !important; }
}`;
}

const BOTONES = (S) => `${en(S, ".tz-header-btn")}, ${en(S, ".tz-scan-btn:not(.tz-payment-save)")}, ${en(S, ".tz-csv-btn")}`;
const PANELES = (S) =>
  [".tz-stat-chip", ".tz-card", ".tz-receipt", ".tz-admin-filterbar", ".tz-method-total", ".tz-history-row"].map((c) => en(S, c)).join(", ");
const PESTANAS = (S) => `${en(S, ".tz-tab")}, ${en(S, ".tz-gasto-tipo-btn")}`;
const ACTIVAS = (S) => `${en(S, ".tz-tab-active")}, ${en(S, ".tz-gasto-tipo-active")}`;
const CAMPOS = (S) => `${en(S, ".tz-text-input")}, ${en(S, ".tz-admin-filter-select")}, ${en(S, ".tz-amount-input")}`;

function construir(S, d) {
  return `
${en(S)} { ${fondo(d.raiz)} }
${en(S, ".tz-header")} { ${fondo(d.cabecera)} ${d.cabeceraEstilo || ""} }
${en(S, ".tz-page-footer")} { ${fondo(d.pie)} ${d.pieEstilo || ""} }
${pieCompleto(S)}
${BOTONES(S)} { ${fondo(d.boton)} ${d.botonEstilo || ""} }
${en(S, ".tz-header-btn:hover")}, ${en(S, ".tz-scan-btn:not(.tz-payment-save):hover")} { filter: brightness(1.12); }
${en(S, ".tz-footer-btn")} { ${fondo(d.botonPie || d.boton)} ${d.botonPieEstilo || d.botonEstilo || ""} }
${PANELES(S)} { ${fondo(d.panel)} ${d.panelEstilo || ""} }
${en(S, ".tz-modal")} { ${fondo(d.modal || d.panel)} ${d.modalEstilo || d.panelEstilo || ""} }
${en(S, ".tz-modal h2")} { ${d.tituloEstilo || ""} }
${PESTANAS(S)} { ${fondo(d.pestana)} ${d.pestanaEstilo || ""} }
${ACTIVAS(S)} { ${fondo(d.activa)} ${d.activaEstilo || ""} }
${CAMPOS(S)} { ${d.campoEstilo || ""} }
${d.extra ? d.extra(S) : ""}
`;
}

// =====================================================================
// FERRETERÍA — "Metal industrial"
// =====================================================================
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

const metal = (S) =>
  construir(S, {
    raiz: [
      capa("radial-gradient(ellipse 900px 420px at 15% -10%, rgba(255,255,255,0.07), transparent 60%)"),
      capa(CEPILLADO, "0 0", "auto", "repeat"),
      capa("linear-gradient(170deg, #1a1d21 0%, #121417 45%, #1b1f23 100%)"),
    ],
    cabecera: [trama(PLACA, "26px 26px"), capa(ACERO)],
    cabeceraEstilo: `border-bottom: 7px solid transparent !important; border-image: ${SEGURIDAD} 1 !important; box-shadow: 0 6px 18px rgba(0,0,0,0.55);`,
    pie: [trama(PLACA, "26px 26px"), capa("linear-gradient(180deg, #1d2125, #121417)")],
    pieEstilo: `border-top: 7px solid transparent !important; border-image: ${SEGURIDAD} 1 !important;`,
    boton: [...esquinas(TUERCA, 9, 3), capa(CEPILLADO, "0 0", "auto", "repeat"), capa(ACERO)],
    botonEstilo: `border: 1px solid #77818b !important; box-shadow: ${BRILLO}, 0 3px 8px rgba(0,0,0,0.5) !important; text-shadow: 0 1px 0 rgba(0,0,0,0.7);`,
    botonPie: [
      capa(TORNILLO, "left 10px center", "12px 12px"),
      capa(TORNILLO, "right 10px center", "12px 12px"),
      capa(CEPILLADO, "0 0", "auto", "repeat"),
      capa(ACERO),
    ],
    botonPieEstilo: `border-radius: 10px !important; border: 1px solid #77818b !important; color: #ffcc00 !important; box-shadow: ${BRILLO}, 0 4px 10px rgba(0,0,0,0.55) !important; text-shadow: 0 1px 0 rgba(0,0,0,0.8);`,
    panel: [...esquinas(TORNILLO, 11, 6), capa(CEPILLADO, "0 0", "auto", "repeat"), capa(PLANCHA)],
    panelEstilo:
      "border: 1px solid #59626b !important; box-shadow: inset 0 1px 0 rgba(255,255,255,0.10), inset 0 0 0 1px rgba(0,0,0,0.35), 0 6px 16px rgba(0,0,0,0.45) !important;",
    modal: [...esquinas(TORNILLO, 11, 6), capa(CEPILLADO, "0 0", "auto", "repeat"), capa("linear-gradient(170deg, #2a3035 0%, #1a1e22 100%)")],
    modalEstilo: "border: 2px solid #6b757f !important; box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 20px 60px rgba(0,0,0,0.7) !important;",
    tituloEstilo: `color: #e9edf1 !important; text-shadow: 0 1px 0 #000, 0 0 12px rgba(255,204,0,0.25); border-bottom: 4px solid transparent; border-image: ${SEGURIDAD} 1; padding-bottom: 8px;`,
    pestana: [capa(CEPILLADO, "0 0", "auto", "repeat"), capa(ACERO)],
    pestanaEstilo: `border: 1px solid #66707a !important; box-shadow: ${BRILLO} !important; color: #d5dbe1 !important;`,
    activa: [capa(CEPILLADO, "0 0", "auto", "repeat"), capa("linear-gradient(180deg, #ffe066 0%, #ffcc00 50%, #e0a800 100%)")],
    activaEstilo:
      "border-color: #8a6a00 !important; color: #16181b !important; text-shadow: 0 1px 0 rgba(255,255,255,0.4); box-shadow: inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -2px 0 rgba(0,0,0,0.25), 0 0 14px rgba(255,204,0,0.35) !important;",
    campoEstilo:
      "background: linear-gradient(180deg, #0f1114, #171a1e) !important; border: 1px solid #4b535b !important; box-shadow: inset 0 2px 4px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.06) !important;",
    extra: (S) => `
${en(S, ".tz-header-btn")} { padding-left: 16px; padding-right: 16px; }
${en(S, ".tz-stat-chip")}, ${en(S, ".tz-method-total")} { padding-left: 22px !important; padding-right: 22px !important; }
${en(S, ".tz-subtitle")} { letter-spacing: 0.16em; }
${en(S, ".tz-logo")} { filter: drop-shadow(0 4px 10px rgba(0,0,0,0.7)) drop-shadow(0 0 18px rgba(255,204,0,0.25)) !important; }`,
  });

// =====================================================================
// ABARROTES — "Bodega de barrio"
// =====================================================================
const VETA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='46'><g fill='none' stroke-width='1.2'><path d='M0 9 C40 5 80 14 160 8' stroke='rgba(0,0,0,0.22)'/><path d='M0 21 C50 26 100 16 160 22' stroke='rgba(255,220,170,0.07)'/><path d='M0 33 C30 30 90 40 160 34' stroke='rgba(0,0,0,0.18)'/><ellipse cx='118' cy='22' rx='9' ry='3.2' stroke='rgba(0,0,0,0.25)'/></g><path d='M0 45.5 H160' stroke='rgba(0,0,0,0.55)' stroke-width='1.5'/></svg>`
);
const FESTON = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='68' height='14'><path d='M0 0 H34 A17 14 0 0 1 0 0Z' fill='#c8322b'/><path d='M34 0 H68 A17 14 0 0 1 34 0Z' fill='#f3e6c8'/></svg>`
);
const CINTA_IZQ = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='46' height='46'><rect x='-6' y='15' width='58' height='15' transform='rotate(-45 23 23)' fill='rgba(236,214,168,0.78)'/><rect x='-6' y='15' width='58' height='15' transform='rotate(-45 23 23)' fill='none' stroke='rgba(120,90,40,0.35)' stroke-dasharray='3 3'/></svg>`
);
const CINTA_DER = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='46' height='46'><rect x='-6' y='15' width='58' height='15' transform='rotate(45 23 23)' fill='rgba(236,214,168,0.78)'/><rect x='-6' y='15' width='58' height='15' transform='rotate(45 23 23)' fill='none' stroke='rgba(120,90,40,0.35)' stroke-dasharray='3 3'/></svg>`
);
const CLAVO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'><circle cx='6' cy='6' r='4.4' fill='#2a1a10'/><circle cx='5' cy='5' r='2.2' fill='#8a7a6a'/></svg>`
);
const MADERA_OSC = "linear-gradient(180deg, #3d2717 0%, #2f1d11 100%)";
const MADERA_CLARA = "linear-gradient(180deg, #8c5a33 0%, #70452a 55%, #5c3720 100%)";
const TOLDO = "repeating-linear-gradient(90deg, #c8322b 0 34px, #f3e6c8 34px 68px)";

const bodega = (S) =>
  construir(S, {
    raiz: [trama(VETA, "160px 46px"), capa("radial-gradient(ellipse 800px 400px at 50% -10%, rgba(255,200,120,0.10), transparent 60%)"), capa(MADERA_OSC)],
    cabecera: [capa(TOLDO, "0 0", "100% 46px"), capa(FESTON, "0 46px", "68px 14px", "repeat-x"), trama(VETA, "160px 46px"), capa("linear-gradient(180deg, #4a2f1b, #2f1d11)")],
    cabeceraEstilo: "padding-top: 64px !important; border-bottom: 3px solid #1c110a !important; box-shadow: 0 6px 16px rgba(0,0,0,0.5);",
    pie: [trama(VETA, "160px 46px"), capa("linear-gradient(180deg, #2f1d11, #1f130b)")],
    pieEstilo: "border-top: 6px solid transparent !important; border-image: repeating-linear-gradient(90deg, #c8322b 0 22px, #f3e6c8 22px 44px) 1 !important;",
    boton: [capa(CLAVO, "left 6px center", "8px 8px"), capa(CLAVO, "right 6px center", "8px 8px"), trama(VETA, "160px 46px"), capa(MADERA_CLARA)],
    botonEstilo:
      "border: 1px solid #3b2414 !important; color: #fff1d6 !important; text-shadow: 0 1px 1px rgba(0,0,0,0.7); box-shadow: inset 0 1px 0 rgba(255,230,190,0.25), 0 3px 6px rgba(0,0,0,0.5) !important; padding-left: 18px; padding-right: 18px;",
    botonPieEstilo:
      "border-radius: 8px !important; border: 1px solid #3b2414 !important; color: #fff1d6 !important; text-shadow: 0 1px 1px rgba(0,0,0,0.7); box-shadow: inset 0 1px 0 rgba(255,230,190,0.25), 0 4px 8px rgba(0,0,0,0.5) !important;",
    // Cinta solo en la esquina derecha (a la izquierda van los títulos de
    // medidores y recibos); las tarjetas de producto y la barra de
    // filtros llevan las dos (ver `extra`).
    panel: [capa(CINTA_DER, "right -10px top -10px", "42px 42px"), trama(VETA, "160px 46px"), capa("linear-gradient(170deg, #4a3020 0%, #36231a 100%)")],
    panelEstilo: "border: 1px solid #1f130b !important; box-shadow: inset 0 1px 0 rgba(255,220,170,0.12), 0 6px 14px rgba(0,0,0,0.45) !important;",
    modal: [capa(CINTA_IZQ, "left -6px top -6px", "52px 52px"), capa(CINTA_DER, "right -6px top -6px", "52px 52px"), trama(VETA, "160px 46px"), capa("linear-gradient(170deg, #45301f 0%, #2c1c12 100%)")],
    modalEstilo: "border: 2px solid #6b4528 !important; box-shadow: 0 20px 60px rgba(0,0,0,0.7) !important;",
    tituloEstilo: "color: #fff1d6 !important; border-bottom: 2px dashed rgba(243,230,200,0.45); padding-bottom: 8px;",
    pestana: [trama(VETA, "160px 46px"), capa("linear-gradient(180deg, #5a3a22, #432a19)")],
    pestanaEstilo: "border: 1px solid #2a1a10 !important; color: #f3e2c4 !important; box-shadow: inset 0 1px 0 rgba(255,230,190,0.18) !important;",
    activa: [capa("repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0 2px, transparent 2px 6px)", "0 0", "auto", "repeat"), capa("linear-gradient(180deg, #e04a3f 0%, #c8322b 60%, #a5251f 100%)")],
    activaEstilo: "border-color: #6e1712 !important; color: #fff6e6 !important; text-shadow: 0 1px 1px rgba(0,0,0,0.5); box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 0 12px rgba(200,50,43,0.4) !important;",
    campoEstilo: "background: #22150d !important; border: 1px solid #5c3c25 !important; box-shadow: inset 0 2px 4px rgba(0,0,0,0.55) !important;",
    extra: (S) => `${en(S, ".tz-card")}, ${en(S, ".tz-admin-filterbar")} {
  ${fondo([capa(CINTA_IZQ, "left -10px top -10px", "42px 42px"), capa(CINTA_DER, "right -10px top -10px", "42px 42px"), trama(VETA, "160px 46px"), capa("linear-gradient(170deg, #4a3020 0%, #36231a 100%)")])}
}`,
  });

// =====================================================================
// MINIMARKET — "Góndola" (claro)
// =====================================================================
const BARRAS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='34' height='14'><g fill='rgba(20,17,31,0.55)'><rect x='0' y='0' width='2' height='14'/><rect x='3' y='0' width='1' height='14'/><rect x='6' y='0' width='3' height='14'/><rect x='10' y='0' width='1' height='14'/><rect x='13' y='0' width='2' height='14'/><rect x='17' y='0' width='1' height='14'/><rect x='19' y='0' width='3' height='14'/><rect x='24' y='0' width='1' height='14'/><rect x='26' y='0' width='2' height='14'/><rect x='30' y='0' width='1' height='14'/><rect x='32' y='0' width='2' height='14'/></g></svg>`
);
const RIEL = "linear-gradient(180deg, #d5dbe2 0%, #b9c2cc 100%)";
const ETIQUETAS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='90' height='12'><rect x='8' y='2' width='30' height='8' rx='1.5' fill='#ffd60a'/><rect x='52' y='2' width='30' height='8' rx='1.5' fill='#ffffff'/><rect x='55' y='4.5' width='16' height='1.6' fill='#c1121f'/></svg>`
);

const gondola = (S) =>
  construir(S, {
    raiz: [capa("repeating-linear-gradient(180deg, transparent 0 138px, rgba(20,17,31,0.05) 138px 140px)", "0 0", "auto", "repeat"), capa("linear-gradient(180deg, #f7f8fa 0%, #eceff3 100%)")],
    cabecera: [capa(ETIQUETAS, "left 0 bottom 0", "90px 12px", "repeat-x"), capa(RIEL, "left 0 bottom 0", "100% 12px"), capa("linear-gradient(180deg, #ffffff, #f1f3f6)")],
    cabeceraEstilo: "border-bottom: 5px solid #c1121f !important; box-shadow: 0 6px 14px rgba(40,30,70,0.10);",
    pie: [capa(RIEL, "0 0", "100% 10px"), capa("linear-gradient(180deg, #ffffff, #eef1f4)")],
    pieEstilo: "border-top: 5px solid #c1121f !important;",
    boton: [capa(BARRAS, "right 8px bottom 5px", "26px 10px"), capa("linear-gradient(180deg, #c1121f 0 4px, transparent 4px)"), capa("linear-gradient(180deg, #ffffff, #f2f4f7)")],
    botonEstilo: "border: 1px solid #cfd5dc !important; box-shadow: 0 2px 6px rgba(40,30,70,0.12) !important; color: #c1121f !important;",
    botonPie: [capa(BARRAS, "right 10px center", "28px 11px"), capa("linear-gradient(180deg, #c1121f 0 4px, transparent 4px)"), capa("linear-gradient(180deg, #ffffff, #f2f4f7)")],
    botonPieEstilo: "border-radius: 8px !important; border: 1px solid #cfd5dc !important; color: #c1121f !important; box-shadow: 0 3px 8px rgba(40,30,70,0.12) !important;",
    panel: [capa(ETIQUETAS, "left 10px bottom 2px", "90px 12px"), capa(RIEL, "left 0 bottom 0", "100% 16px"), capa("linear-gradient(180deg, #ffffff, #fafbfc)")],
    panelEstilo: "border: 1px solid #dde2e8 !important; box-shadow: 0 4px 12px rgba(40,30,70,0.08) !important; padding-bottom: 22px !important;",
    modal: [capa("linear-gradient(180deg, #c1121f 0 6px, transparent 6px)"), capa("linear-gradient(180deg, #ffffff, #f7f8fa)")],
    modalEstilo: "border: 1px solid #d6dbe1 !important; box-shadow: 0 20px 60px rgba(40,30,70,0.25) !important;",
    tituloEstilo: "color: #14111f !important; border-bottom: 2px solid #ffd60a; padding-bottom: 8px;",
    pestana: [capa("linear-gradient(180deg, #ffffff, #f1f3f6)")],
    pestanaEstilo: "border: 1px solid #d3d9e0 !important; color: #3a3550 !important; box-shadow: 0 2px 4px rgba(40,30,70,0.06) !important;",
    activa: [capa("linear-gradient(180deg, #e01e2b, #c1121f)")],
    activaEstilo: "border-color: #8f0d17 !important; color: #ffffff !important; box-shadow: 0 4px 12px rgba(193,18,31,0.35) !important;",
    campoEstilo: "background: #ffffff !important; border: 1px solid #c9d0d8 !important;",
    extra: (S) => `${en(S, ".tz-stat-chip")}, ${en(S, ".tz-method-total")} { padding-bottom: 18px !important; }
${en(S, ".tz-scan-btn:not(.tz-payment-save)")}, ${en(S, ".tz-csv-btn")} {
  ${fondo([capa("linear-gradient(180deg, #c1121f 0 4px, transparent 4px)"), capa("linear-gradient(180deg, #ffffff, #f2f4f7)")])}
}
${en(S, ".tz-header-btn")} { padding-right: 40px; }`,
  });

// =====================================================================
// RESTAURANTE — "Mantel y madera"
// =====================================================================
const CUBIERTOS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><g fill='none' stroke='rgba(243,227,195,0.55)' stroke-width='1.6' stroke-linecap='round'><path d='M6 3v7M4 3v5a2 2 0 0 0 4 0V3M6 10v11'/><path d='M17 21V3c-2 1-3 4-3 7 0 2 1 3 3 3'/></g></svg>`
);
const TIZA = "radial-gradient(ellipse 60% 40% at 30% 20%, rgba(255,255,255,0.05), transparent 70%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(255,255,255,0.04), transparent 70%)";
const CUADROS =
  "repeating-linear-gradient(0deg, rgba(255,236,214,0.16) 0 14px, transparent 14px 28px), repeating-linear-gradient(90deg, rgba(255,236,214,0.16) 0 14px, transparent 14px 28px)";

const mantel = (S) =>
  construir(S, {
    raiz: [trama(VETA, "160px 46px"), capa("linear-gradient(180deg, #24170f 0%, #1a110b 100%)")],
    cabecera: [capa(CUADROS, "0 0", "auto", "repeat"), capa("linear-gradient(180deg, #7a1d1d, #5a1414)")],
    cabeceraEstilo: "border-bottom: 4px solid #2c1d12 !important; box-shadow: 0 6px 16px rgba(0,0,0,0.5);",
    pie: [capa(CUADROS, "0 0", "auto", "repeat"), capa("linear-gradient(180deg, #5a1414, #3e0e0e)")],
    pieEstilo: "border-top: 4px solid #2c1d12 !important;",
    boton: [trama(VETA, "160px 46px"), capa("linear-gradient(180deg, #6b4428, #4a2e1a)")],
    botonEstilo: "border: 1px solid #2a1a10 !important; color: #f3e3c3 !important; box-shadow: inset 0 1px 0 rgba(255,230,190,0.2), 0 3px 6px rgba(0,0,0,0.5) !important;",
    botonPieEstilo: "border-radius: 8px !important; border: 1px solid #2a1a10 !important; color: #f3e3c3 !important; box-shadow: inset 0 1px 0 rgba(255,230,190,0.2), 0 4px 8px rgba(0,0,0,0.5) !important;",
    panel: [capa(CUBIERTOS, "right 8px top 8px", "18px 18px"), trama(VETA, "160px 46px"), capa("linear-gradient(170deg, #3d2818 0%, #2b1c11 100%)")],
    panelEstilo: "border: 1px solid #1a110b !important; box-shadow: inset 0 1px 0 rgba(255,220,170,0.1), 0 6px 14px rgba(0,0,0,0.45) !important;",
    modal: [capa(TIZA), capa("linear-gradient(170deg, #26332b 0%, #1b2520 100%)")],
    modalEstilo: "border: 8px solid #5c3a22 !important; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.5), 0 20px 60px rgba(0,0,0,0.7) !important;",
    tituloEstilo: "color: #f6f1e7 !important; text-shadow: 0 0 1px rgba(255,255,255,0.6); border-bottom: 2px dashed rgba(246,241,231,0.4); padding-bottom: 8px; letter-spacing: 0.08em;",
    pestana: [trama(VETA, "160px 46px"), capa("linear-gradient(180deg, #4e321d, #3a2515)")],
    pestanaEstilo: "border: 1px solid #22150d !important; color: #eedcbc !important;",
    activa: [capa(CUADROS, "0 0", "auto", "repeat"), capa("linear-gradient(180deg, #b3261e, #8c1b15)")],
    activaEstilo: "border-color: #5a0f0b !important; color: #fff6e6 !important; box-shadow: 0 0 12px rgba(179,38,30,0.45) !important;",
    campoEstilo: "background: #1f2a24 !important; border: 1px solid #4a3a2a !important; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5) !important;",
  });

// =====================================================================
// POLLERÍA — "Brasa"
// =====================================================================
const CARBON = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='70' height='70'><g fill='rgba(255,255,255,0.035)'><circle cx='8' cy='12' r='1.2'/><circle cx='40' cy='6' r='0.9'/><circle cx='60' cy='30' r='1.4'/><circle cx='22' cy='48' r='1'/><circle cx='50' cy='60' r='1.1'/></g><g fill='rgba(255,120,30,0.10)'><circle cx='30' cy='26' r='1'/><circle cx='64' cy='52' r='0.8'/><circle cx='12' cy='64' r='0.9'/></g></svg>`
);
const PARRILLA = "repeating-linear-gradient(90deg, transparent 0 16px, #151210 16px 20px, #3d3530 20px 21px, transparent 21px 26px)";
const MARCAS = "repeating-linear-gradient(135deg, transparent 0 14px, rgba(0,0,0,0.38) 14px 17px, rgba(255,140,40,0.06) 17px 18px)";
const LLAMA = "linear-gradient(180deg, #ffd166 0%, #ff8c1a 45%, #e8461d 100%)";

const brasa = (S) =>
  construir(S, {
    raiz: [
      capa("radial-gradient(ellipse 1100px 360px at 50% 105%, rgba(255,110,20,0.22), transparent 70%)"),
      trama(CARBON, "70px 70px"),
      capa("linear-gradient(180deg, #120c09 0%, #0b0806 100%)"),
    ],
    cabecera: [capa(PARRILLA, "0 0", "auto", "repeat"), capa("linear-gradient(180deg, #1a1210 0%, #2a160d 60%, #5a2410 100%)")],
    cabeceraEstilo: "border-bottom: 3px solid #ff7a1a !important; animation: tz-brasa-pulso 3.2s ease-in-out infinite;",
    pie: [capa(PARRILLA, "0 0", "auto", "repeat"), capa("linear-gradient(0deg, #1a1210 0%, #2a160d 60%, #4a1e0d 100%)")],
    pieEstilo: "border-top: 3px solid #ff7a1a !important; box-shadow: 0 -4px 18px rgba(255,110,20,0.35);",
    boton: [capa(MARCAS, "0 0", "auto", "repeat"), capa("linear-gradient(180deg, #2b211d, #18120f)")],
    botonEstilo: "border: 1px solid rgba(255,122,26,0.75) !important; color: #ffb24a !important; box-shadow: inset 0 1px 0 rgba(255,200,140,0.12), 0 0 12px rgba(255,110,20,0.3) !important;",
    botonPieEstilo: "border-radius: 10px !important; border: 1px solid rgba(255,122,26,0.75) !important; color: #ffb24a !important; box-shadow: 0 0 14px rgba(255,110,20,0.35) !important;",
    panel: [capa("linear-gradient(180deg, rgba(255,110,20,0.25), transparent 4px)"), capa(MARCAS, "0 0", "auto", "repeat"), capa("linear-gradient(170deg, #241a16 0%, #160f0c 100%)")],
    panelEstilo: "border: 1px solid #3a2a22 !important; box-shadow: 0 6px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,110,20,0.12) !important;",
    modal: [capa("radial-gradient(ellipse 80% 40% at 50% 110%, rgba(255,110,20,0.22), transparent 70%)"), trama(CARBON, "70px 70px"), capa("linear-gradient(170deg, #201714 0%, #120c09 100%)")],
    modalEstilo: "border: 1px solid rgba(255,122,26,0.6) !important; box-shadow: 0 0 40px rgba(255,110,20,0.25), 0 20px 60px rgba(0,0,0,0.7) !important;",
    tituloEstilo: "color: #ffd9a8 !important; text-shadow: 0 0 10px rgba(255,140,40,0.6); border-bottom: 2px solid rgba(255,122,26,0.6); padding-bottom: 8px;",
    pestana: [capa("linear-gradient(180deg, #2b211d, #18120f)")],
    pestanaEstilo: "border: 1px solid #4a3326 !important; color: #f0cfa8 !important;",
    activa: [capa(LLAMA)],
    activaEstilo: "border-color: #8a2a0d !important; color: #1a0d05 !important; text-shadow: 0 1px 0 rgba(255,230,180,0.5); box-shadow: 0 0 18px rgba(255,120,20,0.6), inset 0 1px 0 rgba(255,255,255,0.45) !important;",
    campoEstilo: "background: #120c09 !important; border: 1px solid #4a3326 !important; box-shadow: inset 0 2px 4px rgba(0,0,0,0.6) !important;",
    extra: (S) => `
@keyframes tz-brasa-pulso {
  0%, 100% { box-shadow: 0 4px 16px rgba(255,110,20,0.35); }
  50% { box-shadow: 0 6px 26px rgba(255,140,30,0.6); }
}
${en(S, ".tz-logo")} { filter: drop-shadow(0 0 16px rgba(255,120,20,0.55)) !important; }`,
  });

// =====================================================================
// CEVICHERÍA — "Marino"
// Agua con profundidad (turquesa → azul profundo) y rayos de luz;
// peces nadando, burbujas y algas meciéndose en una ESCENA fija detrás
// del contenido (ver `escena` en el catálogo y TemaNegocio.jsx).
// Cabecera = PLAYA de arena con ancla, salvavidas, estrella y concha, y
// la orilla (arena mojada + olas con espuma animadas); medidores,
// tarjetas y barra de filtros = cubierta de barco (tablones de teca con
// clavos de bronce y concha); pie = fondo marino que se funde con la
// arena, con algas, estrellas de mar y conchas.
// =====================================================================
const pez = (cuerpo, aleta, franja) =>
  svg(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 36'><defs><linearGradient id='c' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${cuerpo}'/><stop offset='1' stop-color='${aleta}'/></linearGradient></defs><path d='M44 18 L58 6 L55 18 L58 30 Z' fill='${aleta}'/><path d='M30 6 Q36 1 40 8 Z' fill='${aleta}' opacity='.85'/><ellipse cx='26' cy='18' rx='20' ry='12' fill='url(#c)'/><path d='M22 6.5 Q18 18 22 29.5' stroke='${franja}' stroke-width='3.2' fill='none' opacity='.9'/><path d='M32 7.5 Q29 18 32 28.5' stroke='${franja}' stroke-width='2.4' fill='none' opacity='.75'/><path d='M27 22 Q31 26 36 23' stroke='${aleta}' stroke-width='2' fill='none'/><circle cx='12.5' cy='15.5' r='3' fill='#fff'/><circle cx='11.8' cy='15.5' r='1.7' fill='#0b1d2a'/><ellipse cx='20' cy='12' rx='7' ry='2.2' fill='#fff' opacity='.25'/></svg>`
  );
const PEZ_CORAL = pez("#ff8fa3", "#e5486a", "#ffffff");
const PEZ_PAYASO = pez("#ffa24c", "#e2630f", "#ffffff");
const PEZ_AMARILLO = pez("#fde047", "#eab308", "#1d4ed8");
const PEZ_TURQUESA = pez("#7ff5e3", "#14b8a6", "#0e7490");

const ALGA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 120'><g fill='none' stroke-linecap='round'><path d='M14 120 C4 96 24 82 12 60 C2 40 20 26 12 4' stroke='#1f9d55' stroke-width='7'/><path d='M14 120 C4 96 24 82 12 60 C2 40 20 26 12 4' stroke='#4ade80' stroke-width='2.2' opacity='.6'/><path d='M32 120 C42 98 24 84 36 62 C46 44 30 30 40 12' stroke='#15803d' stroke-width='8'/><path d='M32 120 C42 98 24 84 36 62 C46 44 30 30 40 12' stroke='#86efac' stroke-width='2.2' opacity='.5'/><path d='M50 120 C44 104 56 92 48 76' stroke='#22c55e' stroke-width='6'/></g></svg>`
);
const ESTRELLA_MAR = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><defs><radialGradient id='e' cx='.5' cy='.45' r='.6'><stop offset='0' stop-color='#ffb38a'/><stop offset='1' stop-color='#f0603a'/></radialGradient></defs><path d='M20 2 L24.6 14.4 L37.8 15.2 L27.4 23.4 L30.9 36.2 L20 28.9 L9.1 36.2 L12.6 23.4 L2.2 15.2 L15.4 14.4 Z' fill='url(#e)' stroke='#c2410c' stroke-width='1.2' stroke-linejoin='round'/><g fill='#ffe4d1'><circle cx='20' cy='9' r='1'/><circle cx='20' cy='14' r='1'/><circle cx='29' cy='17' r='1'/><circle cx='11' cy='17' r='1'/><circle cx='25' cy='26' r='1'/><circle cx='15' cy='26' r='1'/><circle cx='20' cy='20' r='1.3'/></g></svg>`
);
const ANCLA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 46'><g fill='none' stroke='#e2e8f0' stroke-width='3.4' stroke-linecap='round' stroke-linejoin='round'><circle cx='20' cy='6.5' r='4'/><path d='M20 10.5 V42'/><path d='M11 17 H29'/><path d='M5 30 Q8 42 20 42 Q32 42 35 30'/><path d='M2 33 L5 29 L9 32'/><path d='M38 33 L35 29 L31 32'/></g></svg>`
);
const SALVAVIDAS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 44 44'><circle cx='22' cy='22' r='16' fill='none' stroke='#ffffff' stroke-width='9'/><g stroke='#ef4444' stroke-width='9' fill='none'><path d='M22 6 A16 16 0 0 1 33.3 10.7'/><path d='M38 22 A16 16 0 0 1 33.3 33.3'/><path d='M22 38 A16 16 0 0 1 10.7 33.3'/><path d='M6 22 A16 16 0 0 1 10.7 10.7'/></g><circle cx='22' cy='22' r='20.5' fill='none' stroke='rgba(0,0,0,0.25)' stroke-width='1'/><path d='M22 1.5 Q2 2 1.5 22' stroke='#d9b382' stroke-width='1.6' fill='none' stroke-dasharray='3 2'/></svg>`
);
// Olas en 3 capas (fondo oscuro, medio turquesa, espuma al frente).
const ola = (ancho, alto, fill, espuma) =>
  svg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${ancho}' height='${alto}' preserveAspectRatio='none'><path d='M0 ${alto * 0.45} C${ancho * 0.25} ${alto * 0.05} ${ancho * 0.25} ${alto * 0.05} ${ancho * 0.5} ${alto * 0.45} S${ancho * 0.75} ${alto * 0.85} ${ancho} ${alto * 0.45} V${alto} H0 Z' fill='${fill}'/>${
      espuma
        ? `<path d='M0 ${alto * 0.45} C${ancho * 0.25} ${alto * 0.05} ${ancho * 0.25} ${alto * 0.05} ${ancho * 0.5} ${alto * 0.45} S${ancho * 0.75} ${alto * 0.85} ${ancho} ${alto * 0.45}' fill='none' stroke='${espuma}' stroke-width='2.2' stroke-linecap='round'/>`
        : ""
    }</svg>`
  );
const OLA_FRENTE = ola(120, 16, "#0c3b55", "rgba(240,253,250,0.9)");
const ARENA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='40'><g fill='none' stroke='rgba(150,110,60,0.35)' stroke-width='1.4' stroke-linecap='round'><path d='M4 10 Q30 4 56 10 T110 10'/><path d='M14 24 Q40 18 66 24 T120 22'/><path d='M0 36 Q24 30 50 36 T100 35'/></g><g fill='rgba(255,255,255,0.35)'><circle cx='20' cy='16' r='.8'/><circle cx='78' cy='30' r='.9'/><circle cx='98' cy='14' r='.7'/></g></svg>`
);
const AGUA_PROFUNDA = "linear-gradient(180deg, #0f7491 0%, #0a5574 22%, #073b5a 50%, #04253d 78%, #021a2c 100%)";
const RAYOS =
  "linear-gradient(100deg, transparent 0 16%, rgba(190,255,250,0.07) 19%, transparent 25%), linear-gradient(80deg, transparent 0 52%, rgba(190,255,250,0.06) 55%, transparent 61%), linear-gradient(95deg, transparent 0 72%, rgba(190,255,250,0.05) 74%, transparent 79%)";
const SUPERFICIE = "radial-gradient(ellipse 130% 45% at 50% -12%, rgba(140,245,235,0.38), transparent 62%)";
const VIDRIO_MAR = "linear-gradient(170deg, rgba(14,116,144,0.62) 0%, rgba(6,53,82,0.82) 100%)";

// Concha nacarada (sin perla).
const CONCHA_NACAR = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 34'><defs><linearGradient id='n' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#fff1f2'/><stop offset='.5' stop-color='#fbcfe8'/><stop offset='1' stop-color='#f9a8d4'/></linearGradient></defs><path d='M20 32 L3 13 Q20 -6 37 13 Z' fill='url(#n)' stroke='#db2777' stroke-width='1.1' stroke-linejoin='round'/><g stroke='#ec4899' stroke-width='.9' opacity='.75'><path d='M20 32 L8 9'/><path d='M20 32 L14 5'/><path d='M20 32 L20 3.5'/><path d='M20 32 L26 5'/><path d='M20 32 L32 9'/></g><path d='M14 32 H26 L23 29 H17 Z' fill='#f9a8d4' stroke='#db2777' stroke-width='.9'/><path d='M10 12 Q20 4 30 12' stroke='#ffffff' stroke-width='1.4' fill='none' opacity='.6'/></svg>`
);
const CLAVO_BRONCE = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'><defs><radialGradient id='b' cx='.35' cy='.3' r='.75'><stop offset='0' stop-color='#fde68a'/><stop offset='.55' stop-color='#c2902f'/><stop offset='1' stop-color='#6b4a12'/></radialGradient></defs><circle cx='6' cy='6' r='4.4' fill='url(#b)' stroke='#3b2a0b' stroke-width='.8'/></svg>`
);
// Cubierta de barco: tablones de teca con juntas oscuras y vetas.
const TABLONES = "repeating-linear-gradient(180deg, transparent 0 22px, rgba(18,9,3,0.6) 22px 24px)";
const TECA = "linear-gradient(180deg, #74492a 0%, #5b3920 50%, #4c2f1a 100%)";
const OLA_ORILLA = (ancho, alto, fill, espuma) =>
  svg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${ancho}' height='${alto}' preserveAspectRatio='none'><path d='M0 ${alto * 0.5} C${ancho * 0.25} ${alto * 0.1} ${ancho * 0.25} ${alto * 0.1} ${ancho * 0.5} ${alto * 0.5} S${ancho * 0.75} ${alto * 0.9} ${ancho} ${alto * 0.5} V${alto} H0 Z' fill='${fill}'/><path d='M0 ${alto * 0.5} C${ancho * 0.25} ${alto * 0.1} ${ancho * 0.25} ${alto * 0.1} ${ancho * 0.5} ${alto * 0.5} S${ancho * 0.75} ${alto * 0.9} ${ancho} ${alto * 0.5}' fill='none' stroke='${espuma}' stroke-width='3' stroke-linecap='round'/></svg>`
  );
// La orilla: espuma que moja la arena → agua turquesa → mar.
const ORILLA_ESPUMA = OLA_ORILLA(140, 26, "rgba(220,250,247,0.55)", "rgba(255,255,255,0.95)");
const ORILLA_TURQUESA = OLA_ORILLA(190, 30, "#22a6b3", "rgba(240,253,250,0.8)");
const ORILLA_MAR = OLA_ORILLA(240, 30, "#0e6c88", "rgba(200,245,240,0.6)");
const ARENA_PLAYA = "linear-gradient(180deg, #f3e2bb 0%, #ead3a2 55%, #d8b981 100%)";
const ARENA_MOJADA = "linear-gradient(180deg, transparent 0%, rgba(150,110,60,0.35) 100%)";

const marino = (S) =>
  construir(S, {
    // En la app real el agua la dibuja la ESCENA (fija, detrás de todo);
    // este fondo queda para la vista previa del Perfil.
    raiz: [capa(SUPERFICIE), capa(RAYOS), capa(AGUA_PROFUNDA)],
    // Cabecera = PLAYA: toda de arena (opaca, así los peces no se ven
    // detrás), con ancla, salvavidas, estrella y concha; abajo la orilla:
    // arena mojada y olas con espuma (animadas) que llegan al muelle.
    cabecera: [
      capa(ANCLA, "left 4% bottom 46px", "30px 34px"),
      capa(SALVAVIDAS, "right 4% bottom 42px", "40px 40px"),
      capa(ESTRELLA_MAR, "left 14% bottom 50px", "20px 20px"),
      capa(CONCHA_NACAR, "right 15% bottom 50px", "22px 19px"),
      capa(ORILLA_ESPUMA, "left 0 bottom 14px", "140px 26px", "repeat-x"),
      capa(ORILLA_TURQUESA, "left 0 bottom 6px", "190px 30px", "repeat-x"),
      capa(ORILLA_MAR, "left 0 bottom 0", "240px 30px", "repeat-x"),
      capa(ARENA_MOJADA, "left 0 bottom 30px", "100% 40px"),
      capa(ARENA, "0 0", "120px 40px", "repeat"),
      capa(ARENA_PLAYA),
    ],
    cabeceraEstilo: "padding-bottom: 50px !important; border-bottom: none !important; animation: tz-mar-orilla 7s ease-in-out infinite;",
    // Pie = fondo marino: el agua se funde suave con la arena.
    pie: [
      capa(ESTRELLA_MAR, "left 8% bottom 10px", "30px 30px"),
      capa(CONCHA_NACAR, "right 10% bottom 8px", "30px 26px"),
      capa(ESTRELLA_MAR, "right 22% bottom 14px", "20px 20px"),
      capa(ALGA, "left 0 bottom 0", "46px 92px"),
      capa(ALGA, "right 0 bottom 0", "46px 92px"),
      capa(ARENA, "left 0 bottom 0", "120px 40px", "repeat-x"),
      capa(ARENA, "left 60px bottom 34px", "120px 40px", "repeat-x"),
      capa("linear-gradient(180deg, rgba(4,37,61,0) 0%, rgba(4,37,61,0.35) 22%, rgba(150,130,90,0.55) 48%, #d6b67f 70%, #cfae76 100%)"),
    ],
    pieEstilo: "border-top: none !important; padding-bottom: calc(46px + env(safe-area-inset-bottom, 0px)) !important;",
    boton: [capa("linear-gradient(180deg, rgba(255,255,255,0.24), transparent 55%)"), capa("linear-gradient(180deg, #0f7a92, #0a5068)")],
    botonEstilo:
      "border: 2px dashed rgba(231,196,143,0.9) !important; color: #e6fffb !important; border-radius: 999px !important; box-shadow: 0 0 0 2px rgba(10,80,104,0.9), 0 3px 10px rgba(0,0,0,0.3) !important; text-shadow: 0 1px 2px rgba(0,0,0,0.6);",
    botonPie: [capa("linear-gradient(180deg, rgba(255,255,255,0.22), transparent 55%)"), capa("linear-gradient(180deg, #0f7a92, #0a5068)")],
    botonPieEstilo:
      "border: 2px dashed rgba(231,196,143,0.9) !important; color: #e6fffb !important; box-shadow: 0 0 0 2px rgba(10,80,104,0.9), 0 6px 14px rgba(0,0,0,0.4) !important; text-shadow: 0 1px 2px rgba(0,0,0,0.6);",
    // Medidores, tarjetas, barra de filtros, recibos: CUBIERTA DE BARCO.
    panel: [
      capa(CONCHA_NACAR, "right 6px top 6px", "24px 20px"),
      ...esquinas(CLAVO_BRONCE, 8, 5).slice(2),
      capa(TABLONES, "0 0", "auto", "repeat"),
      trama(VETA, "160px 46px"),
      capa(TECA),
    ],
    panelEstilo:
      "border: 1px solid #2e1c0e !important; box-shadow: inset 0 1px 0 rgba(255,220,170,0.18), inset 0 0 0 1px rgba(0,0,0,0.25), 0 8px 20px rgba(0,0,0,0.4) !important;",
    modal: [
      capa(ESTRELLA_MAR, "left 10px top 10px", "26px 26px"),
      capa(ALGA, "left 0 bottom 0", "40px 80px"),
      capa(ALGA, "right 0 bottom 0", "40px 80px"),
      capa(SUPERFICIE),
      capa(AGUA_PROFUNDA),
    ],
    modalEstilo: "border: 1px solid rgba(125,245,230,0.55) !important; box-shadow: 0 20px 60px rgba(0,0,0,0.6), inset 0 0 40px rgba(94,234,212,0.08) !important;",
    tituloEstilo: "color: #f0fffd !important; border-bottom: 2px solid rgba(94,234,212,0.5); padding-bottom: 8px; text-shadow: 0 1px 3px rgba(0,0,0,0.5);",
    pestana: [capa("linear-gradient(180deg, rgba(255,255,255,0.14), transparent 60%)"), capa("linear-gradient(180deg, #0c5f78, #083d55)")],
    pestanaEstilo: "border: 1px solid rgba(125,245,230,0.4) !important; color: #c9fbf3 !important;",
    activa: [capa("linear-gradient(180deg, #ff8fa3, #f43f5e)")],
    activaEstilo: "border-color: #9f1239 !important; color: #ffffff !important; box-shadow: 0 0 18px rgba(251,113,133,0.55) !important; text-shadow: 0 1px 2px rgba(0,0,0,0.35);",
    campoEstilo: "background: rgba(2,26,41,0.85) !important; border: 1px solid rgba(125,245,230,0.4) !important;",
    extra: (S) => `
@keyframes tz-mar-orilla {
  0%, 100% { background-position: left 4% bottom 46px, right 4% bottom 42px, left 14% bottom 50px, right 15% bottom 50px, left 0 bottom 14px, left 0 bottom 6px, left 0 bottom 0, left 0 bottom 30px, 0 0, 0 0; }
  50% { background-position: left 4% bottom 46px, right 4% bottom 42px, left 14% bottom 50px, right 15% bottom 50px, left -70px bottom 20px, left 95px bottom 9px, left -120px bottom 0, left 0 bottom 30px, 0 0, 0 0; }
}
${en(S, ".tz-header .tz-subtitle")} { color: #0b4f6c !important; text-shadow: 0 1px 0 rgba(255,255,255,0.55) !important; }
${en(S, ".tz-header .tz-conn-indicator")} { background: rgba(8,58,86,0.88) !important; border-color: rgba(125,245,230,0.6) !important; box-shadow: 0 2px 8px rgba(80,50,10,0.3); }
${en(S, ".tz-logo")} { filter: drop-shadow(0 4px 10px rgba(80,50,10,0.45)) !important; }
${en(S, ".tz-stat-chip")}, ${en(S, ".tz-method-total")} { padding-right: 30px !important; }
${en(S, ".tz-table-wrap")} { background: ${VIDRIO_MAR}; border: 1px solid rgba(125,245,230,0.3); border-radius: 14px; backdrop-filter: blur(4px); }
/* ---- Escena (solo en la app real; TemaNegocio la dibuja) ---- */
${en(S, ".tz-escena")} { position: fixed; inset: 0; z-index: -1; pointer-events: none; overflow: hidden; }
${en(S, ".tz-esc-agua")} { position: absolute; inset: 0; background: ${SUPERFICIE}, ${RAYOS}, ${AGUA_PROFUNDA}; }
${en(S, ".tz-esc-rayos")} {
  position: absolute; inset: -10% -20%;
  background: linear-gradient(100deg, transparent 0 30%, rgba(200,255,250,0.10) 34%, transparent 42%), linear-gradient(78deg, transparent 0 58%, rgba(200,255,250,0.08) 61%, transparent 68%);
  animation: tz-mar-rayos 12s ease-in-out infinite alternate;
}
${en(S, ".tz-esc-pez")} {
  position: absolute; left: 0; top: var(--y);
  width: var(--tam); height: calc(var(--tam) * 0.6);
  background: var(--img) center / contain no-repeat;
  opacity: var(--op, 0.85);
  animation: tz-mar-nadar var(--dur) linear var(--delay) infinite;
  will-change: transform;
}
${en(S, ".tz-esc-burbuja")} {
  position: absolute; bottom: -24px; left: var(--x);
  width: var(--tam); height: var(--tam); border-radius: 50%;
  background: radial-gradient(circle at 32% 30%, rgba(255,255,255,0.95) 0 14%, rgba(200,255,250,0.35) 16% 55%, rgba(200,255,250,0.12) 70%, rgba(255,255,255,0.5) 100%);
  box-shadow: inset 0 0 2px rgba(255,255,255,0.6);
  animation: tz-mar-subir var(--dur) linear var(--delay) infinite;
  will-change: transform;
}
${en(S, ".tz-esc-alga")} {
  position: absolute; bottom: -6px; width: var(--tam); height: calc(var(--tam) * 2);
  background: ${ALGA} center bottom / contain no-repeat;
  transform-origin: 50% 100%;
  animation: tz-mar-mecer var(--dur) ease-in-out var(--delay) infinite alternate;
  opacity: 0.9;
}
${en(S, ".tz-esc-alga-izq")} { left: var(--x); }
${en(S, ".tz-esc-alga-der")} { right: var(--x); }
@keyframes tz-mar-rayos { from { transform: translateX(-3%) skewX(-2deg); opacity: 0.7; } to { transform: translateX(3%) skewX(2deg); opacity: 1; } }
@keyframes tz-mar-nadar {
  0% { transform: translate(110vw, 0) scaleX(1); }
  25% { transform: translate(75vw, -14px); }
  50% { transform: translate(40vw, 6px); }
  75% { transform: translate(5vw, -10px); }
  100% { transform: translate(-25vw, 0); }
}
@keyframes tz-mar-subir {
  0% { transform: translate(0, 0); opacity: 0; }
  10% { opacity: 0.9; }
  50% { transform: translate(14px, -55vh); }
  90% { opacity: 0.8; }
  100% { transform: translate(-6px, -112vh); opacity: 0; }
}
@keyframes tz-mar-mecer { from { transform: rotate(-5deg); } to { transform: rotate(5deg); } }`,
  });

// Elementos de la escena de Marino (TemaNegocio los dibuja como <div>).
const ESCENA_MARINO = [
  { clase: "tz-esc-agua" },
  { clase: "tz-esc-rayos" },
  { clase: "tz-esc-pez", estilo: { "--y": "18%", "--tam": "58px", "--dur": "34s", "--delay": "-4s", "--img": PEZ_CORAL } },
  { clase: "tz-esc-pez", estilo: { "--y": "36%", "--tam": "40px", "--dur": "26s", "--delay": "-17s", "--img": PEZ_AMARILLO, "--op": 0.75 } },
  { clase: "tz-esc-pez", estilo: { "--y": "55%", "--tam": "72px", "--dur": "44s", "--delay": "-28s", "--img": PEZ_PAYASO } },
  { clase: "tz-esc-pez", estilo: { "--y": "68%", "--tam": "34px", "--dur": "22s", "--delay": "-9s", "--img": PEZ_TURQUESA, "--op": 0.7 } },
  { clase: "tz-esc-pez", estilo: { "--y": "82%", "--tam": "50px", "--dur": "38s", "--delay": "-21s", "--img": PEZ_CORAL, "--op": 0.65 } },
  { clase: "tz-esc-pez", estilo: { "--y": "27%", "--tam": "30px", "--dur": "20s", "--delay": "-12s", "--img": PEZ_TURQUESA, "--op": 0.6 } },
  ...[
    ["6%", "9px", "14s", "-2s"],
    ["11%", "6px", "11s", "-7s"],
    ["23%", "12px", "17s", "-11s"],
    ["37%", "7px", "12s", "-4s"],
    ["49%", "10px", "15s", "-9s"],
    ["61%", "6px", "10s", "-1s"],
    ["72%", "11px", "16s", "-13s"],
    ["84%", "8px", "13s", "-6s"],
    ["93%", "9px", "15s", "-3s"],
  ].map(([x, tam, dur, delay]) => ({ clase: "tz-esc-burbuja", estilo: { "--x": x, "--tam": tam, "--dur": dur, "--delay": delay } })),
  { clase: "tz-esc-alga tz-esc-alga-izq", estilo: { "--x": "-6px", "--tam": "70px", "--dur": "4.5s", "--delay": "0s" } },
  { clase: "tz-esc-alga tz-esc-alga-izq", estilo: { "--x": "40px", "--tam": "46px", "--dur": "3.8s", "--delay": "-1.2s" } },
  { clase: "tz-esc-alga tz-esc-alga-der", estilo: { "--x": "-4px", "--tam": "64px", "--dur": "5s", "--delay": "-2s" } },
  { clase: "tz-esc-alga tz-esc-alga-der", estilo: { "--x": "46px", "--tam": "40px", "--dur": "4.2s", "--delay": "-0.6s" } },
];

// =====================================================================
// CHIFA — "Dragón rojo"
// =====================================================================
const NUBES_CHINAS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='72' height='40'><g fill='none' stroke='rgba(245,197,66,0.16)' stroke-width='2' stroke-linecap='round'><path d='M6 30 q6 -12 16 -6 q4 -10 14 -4 q8 -6 12 4'/><path d='M18 24 q-2 -6 4 -6 q4 0 2 5'/><path d='M38 26 q0 -6 6 -5 q4 2 1 6'/><path d='M44 12 q8 -8 16 0 q6 -4 10 3'/><path d='M58 12 q-1 -5 4 -5 q4 1 1 5'/></g></svg>`
);
const FAROL = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 56'><path d='M16 0 V6' stroke='#f5c542' stroke-width='1.5'/><rect x='10' y='5' width='12' height='4' rx='1' fill='#f5c542'/><ellipse cx='16' cy='23' rx='13' ry='14' fill='#d62828'/><ellipse cx='16' cy='23' rx='13' ry='14' fill='none' stroke='#f5c542' stroke-width='1.2'/><path d='M8 13 Q16 23 8 33 M24 13 Q16 23 24 33 M16 9 V37' stroke='rgba(245,197,66,0.7)' stroke-width='1' fill='none'/><ellipse cx='12' cy='18' rx='3' ry='5' fill='rgba(255,220,150,0.35)'/><rect x='10' y='36' width='12' height='4' rx='1' fill='#f5c542'/><path d='M14 40 V54 M16 40 V56 M18 40 V54' stroke='#f5c542' stroke-width='1.3'/></svg>`
);
const GRECA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='12'><rect width='24' height='12' fill='#b8860b'/><path d='M0 10 H6 V2 H14 V8 H10 V5 M14 10 H24' fill='none' stroke='#7a0c0c' stroke-width='1.6' stroke-linejoin='miter'/></svg>`
);
const celosia = (rot) =>
  svg(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><g transform='rotate(${rot} 12 12)' fill='none' stroke='#f5c542' stroke-width='1.6'><path d='M2 22 V2 H22'/><path d='M6 22 V6 H22'/><path d='M10 14 V10 H14'/></g></svg>`
  );
const CEL_SI = celosia(0);
const CEL_SD = celosia(90);
const CEL_ID = celosia(180);
const CEL_II = celosia(270);
const LACA = "linear-gradient(170deg, #8b1a1a 0%, #6e1111 55%, #560c0c 100%)";
const LACA_OSCURA = "linear-gradient(170deg, #5c1010 0%, #470b0b 55%, #3a0808 100%)";

const dragon = (S) =>
  construir(S, {
    raiz: [trama(NUBES_CHINAS, "72px 40px"), capa("radial-gradient(ellipse 900px 400px at 50% -10%, rgba(245,197,66,0.10), transparent 60%)"), capa("linear-gradient(180deg, #1f0707 0%, #140404 100%)")],
    cabecera: [
      capa(FAROL, "left 3% top 0", "36px 63px"),
      capa(FAROL, "right 3% top 0", "36px 63px"),
      capa(GRECA, "left 0 bottom 0", "24px 12px", "repeat-x"),
      trama(NUBES_CHINAS, "72px 40px"),
      capa(LACA),
    ],
    cabeceraEstilo: "padding-bottom: 30px !important; border-bottom: none !important; box-shadow: 0 6px 18px rgba(0,0,0,0.5);",
    pie: [capa(GRECA, "left 0 top 0", "24px 12px", "repeat-x"), trama(NUBES_CHINAS, "72px 40px"), capa("linear-gradient(180deg, #3a0a0a, #1f0707)")],
    pieEstilo: "border-top: none !important; padding-top: 30px !important;",
    boton: [capa("linear-gradient(180deg, rgba(255,230,160,0.18), transparent 55%)"), capa(LACA)],
    botonEstilo: "border: 1.5px solid #d4a017 !important; color: #f5c542 !important; box-shadow: inset 0 0 0 2px rgba(86,12,12,0.9), inset 0 0 0 3px rgba(245,197,66,0.35), 0 3px 8px rgba(0,0,0,0.45) !important;",
    botonPieEstilo: "border-radius: 10px !important; border: 1.5px solid #d4a017 !important; color: #f5c542 !important; box-shadow: inset 0 0 0 2px rgba(86,12,12,0.9), inset 0 0 0 3px rgba(245,197,66,0.35), 0 4px 10px rgba(0,0,0,0.5) !important;",
    // Celosía dorada en 3 esquinas (arriba a la izquierda van los títulos).
    panel: [capa(CEL_SD, "right 4px top 4px", "14px 14px"), capa(CEL_ID, "right 4px bottom 4px", "14px 14px"), capa(CEL_II, "left 4px bottom 4px", "14px 14px"), trama(NUBES_CHINAS, "72px 40px"), capa(LACA_OSCURA)],
    panelEstilo: "border: 1px solid #d4a017 !important; box-shadow: inset 0 0 0 3px rgba(86,12,12,0.85), inset 0 0 0 4px rgba(245,197,66,0.45), 0 8px 18px rgba(0,0,0,0.45) !important;",
    modal: [capa(CEL_SI, "left 8px top 8px", "18px 18px"), capa(CEL_SD, "right 8px top 8px", "18px 18px"), capa(CEL_ID, "right 8px bottom 8px", "18px 18px"), capa(CEL_II, "left 8px bottom 8px", "18px 18px"), trama(NUBES_CHINAS, "72px 40px"), capa("linear-gradient(170deg, #4a0d0d 0%, #2a0606 100%)")],
    modalEstilo: "border: 2px solid #d4a017 !important; box-shadow: inset 0 0 0 4px rgba(42,6,6,0.9), inset 0 0 0 5px rgba(245,197,66,0.4), 0 20px 60px rgba(0,0,0,0.7) !important;",
    tituloEstilo: `color: #f5c542 !important; text-shadow: 0 1px 0 #000, 0 0 12px rgba(245,197,66,0.35); background: ${GRECA} left 0 bottom 0 / 24px 8px repeat-x !important; padding-bottom: 14px;`,
    pestana: [capa(LACA)],
    pestanaEstilo: "border: 1px solid rgba(212,160,23,0.6) !important; color: #f3d9a0 !important;",
    activa: [capa("linear-gradient(180deg, #ffe08a 0%, #f5c542 50%, #c9971a 100%)")],
    activaEstilo: "border-color: #7a5a00 !important; color: #5a0b0b !important; text-shadow: 0 1px 0 rgba(255,255,255,0.4); box-shadow: 0 0 16px rgba(245,197,66,0.45) !important;",
    campoEstilo: "background: #1f0707 !important; border: 1px solid rgba(212,160,23,0.5) !important;",
    extra: (S) => `${en(S, ".tz-logo")} { filter: drop-shadow(0 0 16px rgba(245,197,66,0.4)) drop-shadow(0 4px 10px rgba(0,0,0,0.6)) !important; }`,
  });

// =====================================================================
// PIZZERÍA — "Horno de leña"
// =====================================================================
const LADRILLOS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='32'><rect width='64' height='32' fill='#7a3322'/><g fill='#8e3d28'><rect x='1' y='1' width='30' height='14' rx='1.5'/><rect x='33' y='1' width='30' height='14' rx='1.5'/><rect x='-15' y='17' width='30' height='14' rx='1.5'/><rect x='17' y='17' width='30' height='14' rx='1.5'/><rect x='49' y='17' width='30' height='14' rx='1.5'/></g><g fill='rgba(0,0,0,0.12)'><rect x='4' y='9' width='20' height='3'/><rect x='38' y='4' width='14' height='2'/><rect x='22' y='25' width='18' height='3'/></g></svg>`
);
const TRICOLOR = "linear-gradient(90deg, #009246 0 33.33%, #f4f5f0 33.33% 66.66%, #ce2b37 66.66%)";
const ALBAHACA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 28'><path d='M4 24 Q2 8 18 4 Q22 18 4 24 Z' fill='#43a047' stroke='#1b5e20' stroke-width='1'/><path d='M4 24 Q10 14 16 7' stroke='#1b5e20' stroke-width='1' fill='none'/><path d='M14 26 Q16 12 30 10 Q30 24 14 26 Z' fill='#66bb6a' stroke='#1b5e20' stroke-width='1'/><path d='M14 26 Q22 18 28 12' stroke='#1b5e20' stroke-width='1' fill='none'/></svg>`
);
const HARINA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><g fill='rgba(255,250,240,0.10)'><circle cx='8' cy='10' r='1.4'/><circle cx='30' cy='6' r='1'/><circle cx='50' cy='20' r='1.6'/><circle cx='18' cy='34' r='1.2'/><circle cx='44' cy='46' r='1'/><circle cx='8' cy='52' r='1.5'/><circle cx='36' cy='30' r='0.8'/></g></svg>`
);
const NOGAL = "linear-gradient(170deg, #4a2f1d 0%, #3a2416 60%, #2f1d12 100%)";

const horno = (S) =>
  construir(S, {
    raiz: [capa("radial-gradient(ellipse 1000px 380px at 50% -10%, rgba(255,140,40,0.14), transparent 60%)"), trama(HARINA, "60px 60px"), capa("linear-gradient(180deg, #1d100a 0%, #140b07 100%)")],
    cabecera: [capa("radial-gradient(ellipse 70% 60% at 50% 120%, rgba(255,140,30,0.55), transparent 70%)"), capa(LADRILLOS, "0 0", "64px 32px", "repeat"), capa("#5a2618")],
    cabeceraEstilo: `border-bottom: 8px solid transparent !important; border-image: ${TRICOLOR} 1 !important; box-shadow: 0 6px 18px rgba(0,0,0,0.5);`,
    pie: [capa(LADRILLOS, "0 0", "64px 32px", "repeat"), capa("#5a2618")],
    pieEstilo: `border-top: 8px solid transparent !important; border-image: ${TRICOLOR} 1 !important;`,
    boton: [capa("linear-gradient(180deg, rgba(255,255,255,0.18), transparent 55%)"), capa("linear-gradient(180deg, #d84330, #b5291c)")],
    botonEstilo: "border: 1px solid #7f1d14 !important; color: #fff3e0 !important; box-shadow: 0 3px 8px rgba(0,0,0,0.45) !important; text-shadow: 0 1px 1px rgba(0,0,0,0.5);",
    botonPieEstilo: "border-radius: 10px !important; border: 1px solid #7f1d14 !important; color: #fff3e0 !important; box-shadow: 0 4px 10px rgba(0,0,0,0.5) !important; text-shadow: 0 1px 1px rgba(0,0,0,0.5);",
    panel: [capa(ALBAHACA, "right 6px top 6px", "24px 21px"), trama(HARINA, "60px 60px"), trama(VETA, "160px 46px"), capa(NOGAL)],
    panelEstilo: "border: 1px solid #1c110a !important; box-shadow: inset 0 1px 0 rgba(255,220,170,0.1), 0 8px 18px rgba(0,0,0,0.45) !important;",
    modal: [capa(LADRILLOS, "left 0 top 0", "64px 32px", "repeat-x"), trama(HARINA, "60px 60px"), capa("linear-gradient(180deg, transparent 32px, #241510 32px, #1a0f0a 100%)")],
    modalEstilo: "border: 1px solid #6b2a1a !important; box-shadow: 0 20px 60px rgba(0,0,0,0.7) !important; padding-top: 44px !important;",
    tituloEstilo: `color: #fff3e0 !important; border-bottom: 4px solid transparent; border-image: ${TRICOLOR} 1; padding-bottom: 8px;`,
    pestana: [trama(VETA, "160px 46px"), capa(NOGAL)],
    pestanaEstilo: "border: 1px solid #1c110a !important; color: #f5deb3 !important;",
    activa: [capa("linear-gradient(180deg, #e8513c, #c62f20)")],
    activaEstilo: "border-color: #7f1d14 !important; color: #fff8ef !important; box-shadow: 0 0 14px rgba(232,81,60,0.45) !important;",
    campoEstilo: "background: #1a0f0a !important; border: 1px solid #5c3a24 !important;",
    extra: (S) => `${en(S, ".tz-logo")} { filter: drop-shadow(0 0 18px rgba(255,140,30,0.45)) drop-shadow(0 4px 10px rgba(0,0,0,0.6)) !important; }`,
  });

// =====================================================================
// PANADERÍA Y PASTELERÍA — "Pastelería" (claro)
// =====================================================================
const LUNARES = "radial-gradient(circle, rgba(236,72,153,0.10) 3px, transparent 3.5px)";
const CHISPAS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='70' height='50'><g stroke-width='3' stroke-linecap='round'><path d='M8 10 l6 3' stroke='#f472b6'/><path d='M30 6 l2 6' stroke='#60a5fa'/><path d='M52 12 l6 -2' stroke='#facc15'/><path d='M18 30 l-2 6' stroke='#34d399'/><path d='M40 28 l6 4' stroke='#f97316'/><path d='M60 36 l-4 5' stroke='#a78bfa'/><path d='M10 44 l6 0' stroke='#facc15'/><path d='M34 44 l3 -5' stroke='#f472b6'/></g></svg>`
);
const GLASEADO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='90' height='22'><path d='M0 0 H90 V6 C84 6 84 18 78 18 C72 18 73 8 66 8 C60 8 61 14 54 14 C47 14 48 6 40 6 C33 6 34 20 26 20 C19 20 20 7 12 7 C6 7 6 12 0 12 Z' fill='#f9a8d4'/><path d='M0 0 H90 V6 C84 6 84 18 78 18 C72 18 73 8 66 8 C60 8 61 14 54 14 C47 14 48 6 40 6 C33 6 34 20 26 20 C19 20 20 7 12 7 C6 7 6 12 0 12' fill='none' stroke='#ec4899' stroke-width='1'/><g fill='#fff' opacity='.7'><ellipse cx='25' cy='15' rx='1.5' ry='2.5'/><ellipse cx='77' cy='13' rx='1.4' ry='2.2'/></g></svg>`
);
const CUPCAKE = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 30'><path d='M6 16 H22 L20 28 H8 Z' fill='#f59e0b' stroke='#b45309' stroke-width='1'/><path d='M10 16 L11 28 M14 16 V28 M18 16 L17 28' stroke='#b45309' stroke-width='.8'/><path d='M4 16 Q4 8 10 8 Q12 3 16 5 Q22 4 23 10 Q26 12 24 16 Z' fill='#f9a8d4' stroke='#db2777' stroke-width='1'/><circle cx='15' cy='4' r='2.4' fill='#ef4444'/><g stroke-width='1.5' stroke-linecap='round'><path d='M9 12 l2 1' stroke='#60a5fa'/><path d='M16 10 l1 2' stroke='#facc15'/><path d='M20 13 l2 -1' stroke='#34d399'/></g></svg>`
);

const pasteleria = (S) =>
  construir(S, {
    raiz: [capa(LUNARES, "0 0", "36px 36px", "repeat"), capa("linear-gradient(180deg, #fff9f2 0%, #fbefe4 100%)")],
    cabecera: [capa(GLASEADO, "left 0 bottom 0", "90px 22px", "repeat-x"), capa("linear-gradient(180deg, transparent 0 calc(100% - 22px), #fff9f2 calc(100% - 22px))"), capa(CHISPAS, "0 0", "70px 50px", "repeat"), capa("linear-gradient(180deg, #fde4ef 0%, #fbcfe1 100%)")],
    cabeceraEstilo: "padding-bottom: 34px !important; border-bottom: none !important;",
    pie: [capa("linear-gradient(180deg, #ec4899 0 4px, transparent 4px)"), capa(CHISPAS, "0 0", "70px 50px", "repeat"), capa("linear-gradient(180deg, #fde4ef, #fbcfe1)")],
    pieEstilo: "border-top: none !important;",
    boton: [capa("linear-gradient(180deg, #ffffff, #ffe4ef)")],
    botonEstilo: "border: 1.5px solid #f9a8d4 !important; color: #be185d !important; box-shadow: 0 3px 8px rgba(190,24,93,0.15) !important;",
    botonPieEstilo: "border-radius: 999px !important; border: 1.5px solid #f9a8d4 !important; color: #be185d !important; box-shadow: 0 4px 10px rgba(190,24,93,0.15) !important;",
    panel: [capa(CUPCAKE, "right 6px top 6px", "22px 24px"), capa("linear-gradient(180deg, #ffffff, #fffaf6)")],
    panelEstilo: "border: 1px solid #fbcfe8 !important; outline: 1.5px dashed rgba(236,72,153,0.35); outline-offset: -6px; box-shadow: 0 6px 16px rgba(190,24,93,0.08) !important;",
    modal: [capa(CHISPAS, "left 0 top 0", "70px 50px", "repeat-x"), capa("linear-gradient(180deg, #fde4ef 0 50px, #ffffff 50px)")],
    modalEstilo: "border: 1px solid #f9a8d4 !important; box-shadow: 0 20px 60px rgba(190,24,93,0.2) !important;",
    tituloEstilo: "color: #9d174d !important; border-bottom: 2px dashed rgba(236,72,153,0.45); padding-bottom: 8px;",
    pestana: [capa("linear-gradient(180deg, #ffffff, #fff1f6)")],
    pestanaEstilo: "border: 1px solid #fbcfe8 !important; color: #831843 !important;",
    activa: [capa("linear-gradient(180deg, #f472b6, #db2777)")],
    activaEstilo: "border-color: #9d174d !important; color: #ffffff !important; box-shadow: 0 4px 14px rgba(219,39,119,0.35) !important;",
    campoEstilo: "background: #ffffff !important; border: 1px solid #f5c2d8 !important;",
  });

// =====================================================================
// CAFETERÍA — "Café de especialidad"
// =====================================================================
const GRANOS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><g fill='rgba(200,140,90,0.10)'><ellipse cx='16' cy='18' rx='7' ry='10' transform='rotate(-30 16 18)'/><ellipse cx='58' cy='30' rx='6' ry='9' transform='rotate(25 58 30)'/><ellipse cx='30' cy='62' rx='7' ry='10' transform='rotate(60 30 62)'/></g><g fill='none' stroke='rgba(20,10,5,0.35)' stroke-width='1.5'><path d='M13 11 Q19 18 15 26' transform='rotate(-30 16 18)'/><path d='M56 23 Q61 30 57 38' transform='rotate(25 58 30)'/><path d='M27 55 Q33 62 29 70' transform='rotate(60 30 62)'/></g></svg>`
);
const GRANO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 26'><ellipse cx='10' cy='13' rx='8' ry='11.5' fill='#6b3f22' stroke='#3b2112' stroke-width='1'/><path d='M8 3 Q13 13 9 23' stroke='#2a170c' stroke-width='1.8' fill='none'/><ellipse cx='7' cy='8' rx='2' ry='3.5' fill='rgba(255,220,180,0.25)'/></svg>`
);
const CREMA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='14' preserveAspectRatio='none'><path d='M0 0 H80 V6 C70 12 60 2 50 7 S30 12 20 6 S6 10 0 6 Z' fill='#d9b48a'/><path d='M0 0 H80 V4 C70 9 60 0 50 5 S30 9 20 4 S6 7 0 4 Z' fill='#ead2b0'/></svg>`
);
const ESPRESSO = "linear-gradient(170deg, #3a2417 0%, #2a1910 60%, #22140c 100%)";

const cafe = (S) =>
  construir(S, {
    raiz: [trama(GRANOS, "80px 80px"), capa("radial-gradient(ellipse 900px 400px at 50% -10%, rgba(230,201,168,0.10), transparent 60%)"), capa("linear-gradient(180deg, #170e09 0%, #100906 100%)")],
    cabecera: [capa(CREMA, "left 0 bottom 0", "80px 14px", "repeat-x"), trama(GRANOS, "80px 80px"), capa("linear-gradient(180deg, #2a1810 0%, #3b2416 100%)")],
    cabeceraEstilo: "padding-bottom: 28px !important; border-bottom: none !important; box-shadow: 0 6px 16px rgba(0,0,0,0.5);",
    pie: [capa(CREMA, "left 0 top 0", "80px 14px", "repeat-x"), trama(GRANOS, "80px 80px"), capa("linear-gradient(180deg, #2a1810, #170e09)")],
    pieEstilo: "border-top: none !important; padding-top: 26px !important;",
    boton: [capa("linear-gradient(180deg, rgba(255,230,200,0.25), transparent 55%)"), capa("linear-gradient(180deg, #c27a45, #94562c)")],
    botonEstilo: "border: 1px solid #5c3418 !important; color: #fff3e3 !important; box-shadow: 0 3px 8px rgba(0,0,0,0.45) !important; text-shadow: 0 1px 1px rgba(0,0,0,0.5);",
    botonPieEstilo: "border-radius: 10px !important; border: 1px solid #5c3418 !important; color: #fff3e3 !important; box-shadow: 0 4px 10px rgba(0,0,0,0.5) !important; text-shadow: 0 1px 1px rgba(0,0,0,0.5);",
    // Taza de café: borde de crema arriba y un grano en la esquina.
    panel: [capa(GRANO, "right 8px top 12px", "14px 18px"), capa(CREMA, "left 0 top 0", "80px 10px", "repeat-x"), trama(GRANOS, "80px 80px"), capa(ESPRESSO)],
    panelEstilo: "border: 1px solid #1a0f08 !important; box-shadow: inset 0 0 0 1px rgba(230,201,168,0.08), 0 8px 18px rgba(0,0,0,0.45) !important;",
    modal: [capa(CREMA, "left 0 top 0", "80px 14px", "repeat-x"), trama(GRANOS, "80px 80px"), capa("linear-gradient(170deg, #2f1d12 0%, #1a100a 100%)")],
    modalEstilo: "border: 1px solid #6b4426 !important; box-shadow: 0 20px 60px rgba(0,0,0,0.7) !important;",
    tituloEstilo: "color: #f3dcc0 !important; border-bottom: 2px solid rgba(217,180,138,0.45); padding-bottom: 8px;",
    pestana: [capa(ESPRESSO)],
    pestanaEstilo: "border: 1px solid #5c3a24 !important; color: #ecd2b4 !important;",
    activa: [capa("linear-gradient(180deg, #f1dcc0 0%, #e0bf95 100%)")],
    activaEstilo: "border-color: #8a5a32 !important; color: #3a2112 !important; box-shadow: 0 0 14px rgba(230,201,168,0.35) !important;",
    campoEstilo: "background: #140c08 !important; border: 1px solid #5c3a24 !important;",
    extra: (S) => `${en(S, ".tz-stat-chip")}, ${en(S, ".tz-method-total")} { padding-top: 16px !important; }`,
  });

// =====================================================================
// JUGUERÍA — "Tropical"
// =====================================================================
const RODAJAS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='150' height='70'><g transform='translate(22 22)'><circle r='15' fill='#fb923c'/><circle r='12.5' fill='#fdba74'/><g stroke='#fb923c' stroke-width='1.4'><path d='M0 -12 V12 M-12 0 H12 M-8.5 -8.5 L8.5 8.5 M-8.5 8.5 L8.5 -8.5'/></g><circle r='2' fill='#fff7ed'/></g><g transform='translate(78 46)'><circle r='14' fill='#65a30d'/><circle r='11.5' fill='#bef264'/><circle r='4' fill='#f7fee7'/><g fill='#1a2e05'><circle cx='0' cy='-7' r='1'/><circle cx='6' cy='-3.5' r='1'/><circle cx='6' cy='3.5' r='1'/><circle cx='0' cy='7' r='1'/><circle cx='-6' cy='3.5' r='1'/><circle cx='-6' cy='-3.5' r='1'/></g></g><g transform='translate(128 20)'><path d='M-15 0 A15 15 0 0 0 15 0 Z' fill='#16a34a'/><path d='M-12.5 0 A12.5 12.5 0 0 0 12.5 0 Z' fill='#f87171'/><g fill='#1f2937'><circle cx='-5' cy='4' r='1'/><circle cx='0' cy='7' r='1'/><circle cx='5' cy='4' r='1'/></g></g></svg>`
);
const HOJA = (rot) =>
  svg(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><g transform='rotate(${rot} 60 60)'><path d='M60 112 C10 100 6 40 60 8 C114 40 110 100 60 112 Z' fill='#166534'/><path d='M60 112 V14' stroke='#4ade80' stroke-width='2' opacity='.6'/><g stroke='#052e16' stroke-width='5' stroke-linecap='round'><path d='M60 40 L28 30'/><path d='M60 60 L22 58'/><path d='M60 80 L30 88'/><path d='M60 40 L92 30'/><path d='M60 60 L98 58'/><path d='M60 80 L90 88'/></g></g></svg>`
  );
const HOJA_SI = HOJA(-40);
const HOJA_ID = HOJA(140);
const JUGO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='18' preserveAspectRatio='none'><path d='M0 0 H120 V8 C100 16 80 2 60 9 S20 16 0 8 Z' fill='#fb923c'/><path d='M0 0 H120 V5 C100 12 80 0 60 6 S20 12 0 5 Z' fill='#fdba74'/><g fill='#fff7ed' opacity='.7'><circle cx='30' cy='4' r='1.4'/><circle cx='86' cy='3' r='1.1'/></g></svg>`
);
const RODAJA_NARANJA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='-16 -16 32 32'><circle r='15' fill='#fb923c'/><circle r='12.5' fill='#fdba74'/><g stroke='#fb923c' stroke-width='1.4'><path d='M0 -12 V12 M-12 0 H12 M-8.5 -8.5 L8.5 8.5 M-8.5 8.5 L8.5 -8.5'/></g><circle r='2' fill='#fff7ed'/></svg>`
);
const VIDRIO_TROPICAL = "linear-gradient(170deg, rgba(22,101,52,0.55) 0%, rgba(6,40,22,0.88) 100%)";

const tropical = (S) =>
  construir(S, {
    raiz: [capa(HOJA_SI, "left -40px top 120px", "220px 220px"), capa(HOJA_ID, "right -40px bottom -20px", "240px 240px"), capa("radial-gradient(ellipse 900px 400px at 50% -10%, rgba(163,230,53,0.16), transparent 60%)"), capa("linear-gradient(180deg, #06200f 0%, #04140c 100%)")],
    // Frutas tenues y espaciadas, con una zona tranquila detrás del logo
    // (que no compitan con el logo ni con los textos del centro).
    cabecera: [
      capa(JUGO, "left 0 bottom 0", "120px 18px", "repeat-x"),
      capa("radial-gradient(ellipse 260px 150px at 50% 45%, rgba(21,101,52,0.95) 0%, rgba(21,101,52,0.75) 55%, transparent 100%)"),
      capa("linear-gradient(180deg, rgba(21,128,61,0.55), rgba(22,101,52,0.55))"),
      capa(RODAJAS, "0 0", "210px 100px", "repeat"),
      capa("linear-gradient(180deg, #15803d 0%, #166534 100%)"),
    ],
    cabeceraEstilo: "padding-bottom: 32px !important; border-bottom: none !important; box-shadow: 0 6px 16px rgba(0,0,0,0.45);",
    pie: [capa(JUGO, "left 0 top 0", "120px 18px", "repeat-x"), capa(HOJA_SI, "left -20px bottom -30px", "130px 130px"), capa(HOJA_ID, "right -20px bottom -30px", "130px 130px"), capa("linear-gradient(180deg, #14532d, #06200f)")],
    pieEstilo: "border-top: none !important; padding-top: 30px !important;",
    boton: [capa("linear-gradient(180deg, rgba(255,255,255,0.3), transparent 55%)"), capa("linear-gradient(180deg, #bef264, #84cc16)")],
    botonEstilo: "border: 1px solid #3f6212 !important; color: #14290a !important; box-shadow: 0 3px 8px rgba(0,0,0,0.35) !important; border-radius: 999px !important;",
    botonPieEstilo: "border-radius: 999px !important; border: 1px solid #3f6212 !important; color: #14290a !important; box-shadow: 0 4px 10px rgba(0,0,0,0.4) !important;",
    panel: [capa(RODAJA_NARANJA, "right 6px top 6px", "22px 22px"), capa(VIDRIO_TROPICAL)],
    panelEstilo: "border: 1px solid rgba(190,242,100,0.4) !important; box-shadow: 0 8px 18px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12) !important; backdrop-filter: blur(3px);",
    modal: [capa(HOJA_SI, "left -30px top -30px", "110px 110px"), capa(HOJA_ID, "right -30px bottom -30px", "110px 110px"), capa("linear-gradient(170deg, #0f3d22 0%, #06200f 100%)")],
    modalEstilo: "border: 1px solid rgba(190,242,100,0.5) !important; box-shadow: 0 20px 60px rgba(0,0,0,0.6) !important;",
    tituloEstilo: "color: #ecfccb !important; border-bottom: 3px solid #fb923c; padding-bottom: 8px;",
    pestana: [capa("linear-gradient(180deg, #14532d, #0d3b20)")],
    pestanaEstilo: "border: 1px solid rgba(190,242,100,0.35) !important; color: #d9f99d !important;",
    activa: [capa("linear-gradient(180deg, #fde047 0%, #fb923c 100%)")],
    activaEstilo: "border-color: #c2410c !important; color: #3b1a03 !important; box-shadow: 0 0 16px rgba(251,146,60,0.5) !important;",
    campoEstilo: "background: #04140c !important; border: 1px solid rgba(190,242,100,0.35) !important;",
  });

// =====================================================================
// HELADERÍA — "Helado artesanal" (claro)
// =====================================================================
const BOLAS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='108' height='34'><g stroke-width='1.2'><path d='M0 34 V14 A18 16 0 0 1 36 14 V22 C33 22 33 30 30 30 C27 30 28 24 24 24 C20 24 21 32 17 32 C13 32 14 25 10 25 C6 25 7 34 0 34 Z' fill='#f9a8d4' stroke='#ec4899'/><path d='M36 34 V14 A18 16 0 0 1 72 14 V24 C69 24 69 31 66 31 C63 31 64 25 60 25 C56 25 57 33 53 33 C49 33 50 26 46 26 C42 26 43 34 36 34 Z' fill='#a7f3d0' stroke='#10b981'/><path d='M72 34 V14 A18 16 0 0 1 108 14 V22 C105 22 105 30 102 30 C99 30 100 25 96 25 C92 25 93 32 89 32 C85 32 86 26 82 26 C78 26 79 34 72 34 Z' fill='#fef3c7' stroke='#f59e0b'/></g><g fill='#fff' opacity='.6'><ellipse cx='12' cy='8' rx='5' ry='2.5'/><ellipse cx='48' cy='8' rx='5' ry='2.5'/><ellipse cx='84' cy='8' rx='5' ry='2.5'/></g></svg>`
);
// Cada textura de varias imágenes va como capas separadas (si no, las
// posiciones/tamaños se corren contra las demás capas).
const BARQUILLO = [
  capa("repeating-linear-gradient(45deg, rgba(146,64,14,0.28) 0 2px, transparent 2px 13px)"),
  capa("repeating-linear-gradient(-45deg, rgba(146,64,14,0.28) 0 2px, transparent 2px 13px)"),
  capa("linear-gradient(180deg, #f8d29a, #eab676)"),
];
const CONFETI = [
  capa("radial-gradient(circle, rgba(16,185,129,0.20) 2.5px, transparent 3px)", "0 0", "44px 44px", "repeat"),
  capa("radial-gradient(circle, rgba(236,72,153,0.20) 2.5px, transparent 3px)", "22px 22px", "44px 44px", "repeat"),
];
const CONO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 32'><path d='M5 14 L12 31 L19 14 Z' fill='#eab676' stroke='#92400e' stroke-width='1'/><path d='M7 17 L15 25 M9 14 L17 21 M12 14 L18 18 M17 17 L9 25 M15 14 L7 21' stroke='#92400e' stroke-width='.7'/><circle cx='12' cy='10' r='7' fill='#f9a8d4' stroke='#ec4899' stroke-width='1'/><path d='M6 13 Q8 17 10 13 Q12 17 14 13 Q16 17 18 13' fill='#f9a8d4' stroke='#ec4899' stroke-width='.8'/><circle cx='12' cy='3' r='2' fill='#ef4444'/></svg>`
);
const DERRETIDO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='10'><path d='M0 0 H60 V3 C55 3 55 8 51 8 C47 8 48 4 44 4 C40 4 41 9 36 9 C31 9 32 3 27 3 C23 3 23 7 19 7 C15 7 16 3 11 3 C7 3 7 6 3 6 C1 6 0 4 0 3 Z' fill='#fbcfe8'/></svg>`
);

const helado = (S) =>
  construir(S, {
    raiz: [...CONFETI, capa("linear-gradient(180deg, #f4fbf8 0%, #e9f6f0 100%)")],
    cabecera: [capa(BOLAS, "left 0 bottom 0", "108px 34px", "repeat-x"), ...CONFETI, capa("linear-gradient(180deg, #d1fae5 0%, #a7f3d0 100%)")],
    cabeceraEstilo: "padding-bottom: 46px !important; border-bottom: none !important;",
    pie: [capa(BOLAS, "left 0 top 0", "108px 34px", "repeat-x"), ...BARQUILLO],
    pieEstilo: "border-top: none !important; padding-top: 44px !important;",
    boton: [...BARQUILLO],
    botonEstilo: "border: 1px solid #b45309 !important; color: #5b2c06 !important; box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), 0 3px 8px rgba(146,64,14,0.2) !important; border-radius: 999px !important;",
    botonPieEstilo: "border-radius: 999px !important; border: 1px solid #b45309 !important; color: #5b2c06 !important; box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 10px rgba(146,64,14,0.25) !important;",
    panel: [capa(CONO, "right 8px top 12px", "18px 24px"), capa(DERRETIDO, "left 0 top 0", "60px 10px", "repeat-x"), capa("linear-gradient(180deg, #ffffff, #fbfffd)")],
    panelEstilo: "border: 1px solid #c7eadb !important; box-shadow: 0 6px 16px rgba(15,118,110,0.10) !important;",
    modal: [capa(DERRETIDO, "left 0 top 0", "60px 10px", "repeat-x"), ...CONFETI, capa("linear-gradient(180deg, #ffffff, #f4fbf8)")],
    modalEstilo: "border: 1px solid #a7f3d0 !important; box-shadow: 0 20px 60px rgba(15,118,110,0.2) !important;",
    tituloEstilo: "color: #0f766e !important; border-bottom: 2px dashed rgba(236,72,153,0.4); padding-bottom: 8px;",
    pestana: [capa("linear-gradient(180deg, #ffffff, #ecfdf5)")],
    pestanaEstilo: "border: 1px solid #a7f3d0 !important; color: #115e59 !important;",
    activa: [capa("linear-gradient(180deg, #f472b6, #db2777)")],
    activaEstilo: "border-color: #9d174d !important; color: #ffffff !important; box-shadow: 0 4px 14px rgba(219,39,119,0.35) !important;",
    campoEstilo: "background: #ffffff !important; border: 1px solid #b7e4d3 !important;",
    extra: (S) => `${en(S, ".tz-stat-chip")}, ${en(S, ".tz-method-total")} { padding-top: 14px !important; }`,
  });

// =====================================================================
// CARNICERÍA — "Carnicero"
// =====================================================================
const AZULEJOS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='44' height='22'><rect width='44' height='22' fill='#d6cec2'/><rect x='1' y='1' width='20' height='9.5' rx='1.5' fill='#f6f2ea'/><rect x='23' y='1' width='20' height='9.5' rx='1.5' fill='#f3eee5'/><rect x='-10' y='12' width='20' height='9' rx='1.5' fill='#f3eee5'/><rect x='12' y='12' width='20' height='9' rx='1.5' fill='#f6f2ea'/><rect x='34' y='12' width='20' height='9' rx='1.5' fill='#f3eee5'/><g fill='rgba(255,255,255,0.7)'><rect x='3' y='2' width='10' height='1.5'/><rect x='14' y='13' width='10' height='1.5'/></g></svg>`
);
const BLOQUE = "repeating-conic-gradient(#5e3a21 0 25%, #4b2d18 0 50%)";
const CUCHILLA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 34 24'><path d='M2 3 H24 V16 Q14 21 2 18 Z' fill='#d7dde3' stroke='#475569' stroke-width='1'/><path d='M2 16 Q13 20 24 15' stroke='#f8fafc' stroke-width='1.2' fill='none'/><circle cx='20' cy='7' r='1.8' fill='#475569'/><rect x='24' y='7' width='9' height='5' rx='2' fill='#7c2d12' stroke='#431407' stroke-width='.8'/></svg>`
);

const carnicero = (S) =>
  construir(S, {
    raiz: [capa("linear-gradient(180deg, rgba(20,12,10,0.94), rgba(14,8,7,0.97))"), trama(AZULEJOS, "44px 22px")],
    cabecera: [capa("linear-gradient(180deg, #b91c1c, #991b1b)", "left 0 bottom 0", "100% 10px"), capa("linear-gradient(180deg, #ffffff, #ffffff)", "left 0 bottom 10px", "100% 3px"), trama(AZULEJOS, "44px 22px")],
    cabeceraEstilo: "padding-bottom: 30px !important; border-bottom: none !important; box-shadow: 0 6px 16px rgba(0,0,0,0.45);",
    pie: [capa("linear-gradient(180deg, #b91c1c, #991b1b)", "left 0 top 0", "100% 10px"), trama(AZULEJOS, "44px 22px")],
    pieEstilo: "border-top: none !important; padding-top: 26px !important;",
    boton: [capa("linear-gradient(180deg, rgba(255,255,255,0.18), transparent 55%)"), capa("linear-gradient(180deg, #c62828, #991b1b)")],
    botonEstilo: "border: 1px solid #5f0f0f !important; color: #fff1e6 !important; box-shadow: 0 3px 8px rgba(0,0,0,0.35) !important; text-shadow: 0 1px 1px rgba(0,0,0,0.5);",
    botonPieEstilo: "border-radius: 10px !important; border: 1px solid #5f0f0f !important; color: #fff1e6 !important; box-shadow: 0 4px 10px rgba(0,0,0,0.4) !important; text-shadow: 0 1px 1px rgba(0,0,0,0.5);",
    panel: [capa(CUCHILLA, "right 6px top 8px", "26px 18px"), capa("linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.45))"), capa(BLOQUE, "0 0", "28px 28px", "repeat")],
    panelEstilo: "border: 1px solid #2a170c !important; box-shadow: inset 0 0 0 1px rgba(255,220,180,0.08), 0 8px 18px rgba(0,0,0,0.45) !important;",
    modal: [capa("linear-gradient(180deg, #b91c1c, #991b1b)", "left 0 top 0", "100% 8px"), capa("linear-gradient(170deg, #241310 0%, #160c0a 100%)")],
    modalEstilo: "border: 1px solid #5f2a1c !important; box-shadow: 0 20px 60px rgba(0,0,0,0.7) !important;",
    tituloEstilo: "color: #fde8e8 !important; border-bottom: 2px solid rgba(239,68,68,0.6); padding-bottom: 8px;",
    pestana: [capa("linear-gradient(180deg, #3a2318, #2a1810)")],
    pestanaEstilo: "border: 1px solid #5c3a24 !important; color: #f1dcc8 !important;",
    activa: [capa("linear-gradient(180deg, #dc2626, #991b1b)")],
    activaEstilo: "border-color: #5f0f0f !important; color: #ffffff !important; box-shadow: 0 0 14px rgba(220,38,38,0.45) !important;",
    campoEstilo: "background: #120a08 !important; border: 1px solid #5c3a24 !important;",
    extra: (S) => `
${en(S, ".tz-header .tz-subtitle")} { color: #991b1b !important; text-shadow: none !important; }
${en(S, ".tz-header .tz-conn-indicator")} { background: rgba(40,20,14,0.88) !important; }
${en(S, ".tz-logo")} { filter: drop-shadow(0 4px 10px rgba(60,30,20,0.4)) !important; }`,
  });

// =====================================================================
// FRUTAS Y VERDURAS — "Mercado fresco"
// =====================================================================
const ARPILLERA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12'><path d='M0 3 H12 M0 9 H12' stroke='rgba(255,235,190,0.08)' stroke-width='2'/><path d='M3 0 V12 M9 0 V12' stroke='rgba(0,0,0,0.18)' stroke-width='2'/></svg>`
);
const VERDURAS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='34'><g transform='translate(18 18)'><circle r='12' fill='#ef4444'/><ellipse cx='-4' cy='-4' rx='3' ry='2' fill='#fca5a5'/><path d='M-5 -12 L0 -8 L5 -12 L3 -7 L-3 -7 Z' fill='#16a34a'/></g><g transform='translate(52 18) rotate(30)'><path d='M-3 -14 Q0 -15 3 -14 L1 14 Q0 15 -1 14 Z' fill='#f97316'/><path d='M-2 -8 H2 M-2 -2 H2 M-1 5 H1' stroke='#c2410c' stroke-width='1'/><path d='M0 -14 L-5 -21 M0 -14 L0 -22 M0 -14 L5 -21' stroke='#16a34a' stroke-width='2.2' stroke-linecap='round'/></g><g transform='translate(90 19)'><ellipse rx='15' ry='12' fill='#4ade80'/><path d='M-12 -2 Q0 -12 12 -2 M-10 5 Q0 -4 10 5' stroke='#166534' stroke-width='1.5' fill='none'/></g><g transform='translate(128 18)'><path d='M-9 -6 Q-10 12 0 13 Q10 12 9 -6 Q0 -10 -9 -6 Z' fill='#eab308'/><path d='M0 -8 Q2 -13 5 -13' stroke='#15803d' stroke-width='2.4' fill='none' stroke-linecap='round'/></g></svg>`
);
const CAJON = "repeating-linear-gradient(180deg, #7a5230 0 20px, #2c1a0d 20px 24px)";
const TOMATE = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='-13 -15 26 28'><circle r='12' fill='#ef4444' stroke='#b91c1c' stroke-width='1'/><ellipse cx='-4' cy='-4' rx='3' ry='2' fill='#fca5a5'/><path d='M-6 -12 L0 -8 L6 -12 L3 -7 L-3 -7 Z' fill='#16a34a'/></svg>`
);

const mercado = (S) =>
  construir(S, {
    raiz: [trama(ARPILLERA, "12px 12px"), capa("radial-gradient(ellipse 900px 400px at 50% -10%, rgba(132,204,22,0.12), transparent 60%)"), capa("linear-gradient(180deg, #0f1c0d 0%, #0a140a 100%)")],
    cabecera: [capa(VERDURAS, "left 0 bottom 6px", "160px 34px", "repeat-x"), capa(CAJON, "left 0 bottom 0", "100% 46px"), trama(ARPILLERA, "12px 12px"), capa("linear-gradient(180deg, #3f6212 0%, #365314 100%)")],
    cabeceraEstilo: "padding-bottom: 56px !important; border-bottom: none !important; box-shadow: 0 6px 16px rgba(0,0,0,0.45);",
    pie: [capa(CAJON), trama(VETA, "160px 46px")],
    pieEstilo: "border-top: 4px solid #2c1a0d !important;",
    boton: [capa("linear-gradient(180deg, rgba(255,255,255,0.2), transparent 55%)"), capa("linear-gradient(180deg, #4d7c0f, #3f6212)")],
    botonEstilo: "border: 1px solid #1a2e05 !important; color: #f7fee7 !important; box-shadow: 0 3px 8px rgba(0,0,0,0.4) !important; text-shadow: 0 1px 1px rgba(0,0,0,0.5);",
    botonPieEstilo: "border-radius: 10px !important; border: 1px solid #1a2e05 !important; color: #f7fee7 !important; box-shadow: 0 4px 10px rgba(0,0,0,0.45) !important;",
    panel: [capa(TOMATE, "right 6px top 6px", "20px 21px"), capa("linear-gradient(180deg, rgba(0,0,0,0.38), rgba(0,0,0,0.52))"), trama(VETA, "160px 46px"), capa(CAJON)],
    panelEstilo: "border: 1px solid #2c1a0d !important; box-shadow: 0 8px 18px rgba(0,0,0,0.45) !important;",
    modal: [trama(ARPILLERA, "12px 12px"), capa("linear-gradient(170deg, #1d2e16 0%, #0f1a0c 100%)")],
    modalEstilo: "border: 1px solid #4d7c0f !important; box-shadow: 0 20px 60px rgba(0,0,0,0.65) !important;",
    tituloEstilo: `color: #ecfccb !important; background: ${VERDURAS} left 0 bottom 0 / 110px 24px repeat-x !important; padding-bottom: 30px;`,
    pestana: [capa("linear-gradient(180deg, #2d4a12, #1f3a0c)")],
    pestanaEstilo: "border: 1px solid #4d7c0f !important; color: #d9f99d !important;",
    activa: [capa("linear-gradient(180deg, #f87171, #dc2626)")],
    activaEstilo: "border-color: #7f1d1d !important; color: #ffffff !important; box-shadow: 0 0 14px rgba(239,68,68,0.45) !important;",
    campoEstilo: "background: #0a140a !important; border: 1px solid #4d7c0f !important;",
  });

// =====================================================================
// LICORERÍA — "Bodega de vinos"
// =====================================================================
const PIEDRA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='48'><rect width='80' height='48' fill='#1a1013'/><g fill='#2d1d21' stroke='#120a0c' stroke-width='1.5'><path d='M2 2 H34 L36 14 L32 22 H4 L1 12 Z'/><path d='M38 2 H78 V20 L74 22 H40 L37 12 Z'/><path d='M2 25 H22 L24 36 L20 46 H3 L1 36 Z'/><path d='M26 25 H56 L58 34 L54 46 H28 L25 35 Z'/><path d='M60 25 H78 V46 H62 L59 36 Z'/></g><g fill='rgba(255,255,255,0.04)'><path d='M6 4 H30 L31 8 H6 Z'/><path d='M42 4 H72 V8 H42 Z'/></g></svg>`
);
const PARRA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='30'><path d='M0 8 C20 2 30 14 60 8 S100 2 120 8' stroke='#6b4a2a' stroke-width='2.4' fill='none'/><g transform='translate(30 10)'><path d='M0 0 C-10 -4 -14 6 -6 8 C-10 14 2 16 2 8 C8 12 12 2 4 0 Z' fill='#4d7c0f'/></g><g transform='translate(84 9)'><path d='M0 0 C-10 -4 -14 6 -6 8 C-10 14 2 16 2 8 C8 12 12 2 4 0 Z' fill='#3f6212'/></g><g fill='#6d28d9'><circle cx='56' cy='14' r='3.4'/><circle cx='62' cy='14' r='3.4'/><circle cx='59' cy='19' r='3.4'/><circle cx='65' cy='19' r='3.2'/><circle cx='53' cy='19' r='3.2'/><circle cx='59' cy='24' r='3.2'/></g><g fill='rgba(255,255,255,0.35)'><circle cx='55' cy='13' r='1'/><circle cx='61' cy='13' r='1'/></g></svg>`
);
const UVAS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 30'><path d='M12 6 Q12 1 16 1' stroke='#6b4a2a' stroke-width='1.6' fill='none'/><path d='M14 4 C20 1 23 7 18 9 Z' fill='#4d7c0f'/><g fill='#7c3aed' stroke='#4c1d95' stroke-width='.6'><circle cx='7' cy='10' r='3.6'/><circle cx='14' cy='10' r='3.6'/><circle cx='10.5' cy='15.5' r='3.6'/><circle cx='17.5' cy='15.5' r='3.4'/><circle cx='4' cy='15.5' r='3.2'/><circle cx='7' cy='21' r='3.4'/><circle cx='14' cy='21' r='3.4'/><circle cx='10.5' cy='26' r='3.2'/></g><g fill='rgba(255,255,255,0.4)'><circle cx='6' cy='9' r='1'/><circle cx='13' cy='9' r='1'/><circle cx='9.5' cy='14.5' r='1'/></g></svg>`
);
const DUELAS = "repeating-linear-gradient(90deg, #5e3b22 0 26px, #3b2414 26px 28px)";
const ARO = "linear-gradient(180deg, #4a4a4a 0%, #8a8a8a 45%, #3a3a3a 100%)";

const vinos = (S) =>
  construir(S, {
    raiz: [capa("radial-gradient(ellipse 900px 380px at 50% -10%, rgba(233,196,106,0.10), transparent 60%)"), trama(PIEDRA, "80px 48px"), capa("#120a0c")],
    cabecera: [capa(PARRA, "left 0 bottom 2px", "120px 30px", "repeat-x"), capa("radial-gradient(ellipse 60% 70% at 50% 40%, rgba(122,20,44,0.45), transparent 70%)"), trama(PIEDRA, "80px 48px")],
    cabeceraEstilo: "padding-bottom: 38px !important; border-bottom: 3px solid #e9c46a !important; box-shadow: 0 6px 18px rgba(0,0,0,0.55);",
    pie: [capa(PARRA, "left 0 top 0", "120px 30px", "repeat-x"), trama(PIEDRA, "80px 48px")],
    pieEstilo: "border-top: 3px solid #e9c46a !important; padding-top: 34px !important;",
    boton: [capa("linear-gradient(180deg, rgba(255,255,255,0.16), transparent 55%)"), capa("linear-gradient(180deg, #7a1730, #561021)")],
    botonEstilo: "border: 1px solid #e9c46a !important; color: #f5d58a !important; box-shadow: 0 3px 8px rgba(0,0,0,0.5) !important;",
    botonPieEstilo: "border-radius: 10px !important; border: 1px solid #e9c46a !important; color: #f5d58a !important; box-shadow: 0 4px 10px rgba(0,0,0,0.5) !important;",
    // Barrica: duelas verticales con dos aros de metal.
    panel: [
      capa(UVAS, "right 8px top 14px", "18px 22px"),
      capa(ARO, "left 0 top 6px", "100% 5px"),
      capa(ARO, "left 0 bottom 6px", "100% 5px"),
      capa("linear-gradient(90deg, rgba(0,0,0,0.45) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.45) 100%)"),
      capa("linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.35))"),
      capa(DUELAS, "0 0", "auto", "repeat"),
    ],
    panelEstilo: "border: 1px solid #2a170c !important; box-shadow: 0 8px 18px rgba(0,0,0,0.5) !important;",
    modal: [capa(PARRA, "left 0 top 0", "120px 30px", "repeat-x"), capa("linear-gradient(170deg, #2a0d16 0%, #14070b 100%)")],
    modalEstilo: "border: 1px solid #e9c46a !important; box-shadow: 0 20px 60px rgba(0,0,0,0.7) !important; padding-top: 38px !important;",
    tituloEstilo: "color: #f5d58a !important; border-bottom: 1px solid rgba(233,196,106,0.55); padding-bottom: 8px; letter-spacing: 0.1em;",
    pestana: [capa("linear-gradient(180deg, #3a1420, #260b14)")],
    pestanaEstilo: "border: 1px solid rgba(233,196,106,0.4) !important; color: #f3dca8 !important;",
    activa: [capa("linear-gradient(180deg, #f5d58a 0%, #e9c46a 50%, #c99a3a 100%)")],
    activaEstilo: "border-color: #7a5a1a !important; color: #3a0a16 !important; box-shadow: 0 0 14px rgba(233,196,106,0.4) !important;",
    campoEstilo: "background: #120a0c !important; border: 1px solid rgba(233,196,106,0.35) !important;",
    extra: (S) => `${en(S, ".tz-stat-chip")}, ${en(S, ".tz-method-total")} { padding-top: 16px !important; padding-bottom: 16px !important; }`,
  });

// =====================================================================
// BAR Y DISCOTECA — "Club nocturno" (con escena: reflectores y destellos)
// =====================================================================
const NOTA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M9 18 V5 L20 3 V16' stroke='#f472b6' stroke-width='2' fill='none'/><circle cx='6.5' cy='18' r='3' fill='#f472b6'/><circle cx='17.5' cy='16' r='3' fill='#f472b6'/></svg>`
);
const LADRILLO_NOCHE = "linear-gradient(180deg, rgba(10,4,20,0.82), rgba(10,4,20,0.9))";
const NOCHE = "linear-gradient(180deg, #0c0418 0%, #07020f 100%)";

const club = (S) =>
  construir(S, {
    raiz: [capa("radial-gradient(ellipse 600px 300px at 20% 0%, rgba(244,114,182,0.18), transparent 60%)"), capa("radial-gradient(ellipse 600px 300px at 80% 0%, rgba(34,211,238,0.16), transparent 60%)"), capa(NOCHE)],
    cabecera: [capa(LADRILLO_NOCHE), capa(LADRILLOS, "0 0", "64px 32px", "repeat")],
    cabeceraEstilo:
      "border-bottom: 3px solid #f472b6 !important; box-shadow: 0 0 12px rgba(244,114,182,0.9), 0 0 30px rgba(244,114,182,0.5), inset 0 -2px 0 #22d3ee !important; animation: tz-club-neon 2.6s ease-in-out infinite;",
    pie: [capa(LADRILLO_NOCHE), capa(LADRILLOS, "0 0", "64px 32px", "repeat")],
    pieEstilo: "border-top: 3px solid #22d3ee !important; box-shadow: 0 0 14px rgba(34,211,238,0.7);",
    boton: [capa("rgba(10,4,20,0.85)")],
    botonEstilo: "border: 2px solid #f472b6 !important; color: #fbcfe8 !important; box-shadow: 0 0 8px rgba(244,114,182,0.8), inset 0 0 8px rgba(244,114,182,0.35) !important; text-shadow: 0 0 6px rgba(244,114,182,0.9);",
    botonPie: [capa("rgba(10,4,20,0.85)")],
    botonPieEstilo: "border-radius: 10px !important; border: 2px solid #22d3ee !important; color: #cffafe !important; box-shadow: 0 0 10px rgba(34,211,238,0.8), inset 0 0 8px rgba(34,211,238,0.3) !important; text-shadow: 0 0 6px rgba(34,211,238,0.9);",
    panel: [capa(NOTA, "right 8px top 8px", "18px 18px"), capa("linear-gradient(170deg, rgba(30,12,52,0.85) 0%, rgba(12,4,24,0.92) 100%)")],
    panelEstilo: "border: 1.5px solid #22d3ee !important; box-shadow: 0 0 10px rgba(34,211,238,0.5), inset 0 0 14px rgba(34,211,238,0.12), 0 8px 20px rgba(0,0,0,0.5) !important; backdrop-filter: blur(4px);",
    modal: [capa("radial-gradient(ellipse 80% 50% at 50% 0%, rgba(244,114,182,0.18), transparent 70%)"), capa("linear-gradient(170deg, #1a0b30 0%, #0a0414 100%)")],
    modalEstilo: "border: 2px solid #f472b6 !important; box-shadow: 0 0 22px rgba(244,114,182,0.6), 0 20px 60px rgba(0,0,0,0.7) !important;",
    tituloEstilo: "color: #fce7f3 !important; text-shadow: 0 0 8px #f472b6, 0 0 18px rgba(244,114,182,0.7); border-bottom: 2px solid #22d3ee; box-shadow: 0 6px 10px -8px #22d3ee; padding-bottom: 8px;",
    pestana: [capa("rgba(10,4,20,0.85)")],
    pestanaEstilo: "border: 1.5px solid rgba(167,139,250,0.7) !important; color: #ddd6fe !important; box-shadow: 0 0 6px rgba(167,139,250,0.4) !important;",
    activa: [capa("linear-gradient(90deg, #f472b6, #a855f7)")],
    activaEstilo: "border-color: #fbcfe8 !important; color: #ffffff !important; box-shadow: 0 0 18px rgba(244,114,182,0.8) !important; text-shadow: 0 0 6px rgba(255,255,255,0.6);",
    campoEstilo: "background: rgba(10,4,20,0.9) !important; border: 1.5px solid rgba(167,139,250,0.6) !important;",
    extra: (S) => `
@keyframes tz-club-neon {
  0%, 100% { box-shadow: 0 0 12px rgba(244,114,182,0.9), 0 0 30px rgba(244,114,182,0.5), inset 0 -2px 0 #22d3ee; }
  48% { box-shadow: 0 0 12px rgba(244,114,182,0.9), 0 0 30px rgba(244,114,182,0.5), inset 0 -2px 0 #22d3ee; }
  50% { box-shadow: 0 0 4px rgba(244,114,182,0.5), 0 0 10px rgba(244,114,182,0.25), inset 0 -2px 0 #22d3ee; }
  53% { box-shadow: 0 0 12px rgba(244,114,182,0.9), 0 0 30px rgba(244,114,182,0.5), inset 0 -2px 0 #22d3ee; }
}
${en(S, ".tz-logo")} { filter: drop-shadow(0 0 14px rgba(244,114,182,0.7)) drop-shadow(0 0 26px rgba(34,211,238,0.35)) !important; }
/* ---- Escena: reflectores que barren y destellos ---- */
${en(S, ".tz-escena")} { position: fixed; inset: 0; z-index: -1; pointer-events: none; overflow: hidden; background: ${NOCHE}; }
${en(S, ".tz-esc-foco")} {
  position: absolute; top: -12vh; left: var(--x);
  width: 42vw; height: 140vh;
  background: linear-gradient(180deg, var(--c) 0%, rgba(255,255,255,0.08) 60%, transparent 92%);
  clip-path: polygon(45% 0, 55% 0, 100% 100%, 0 100%);
  opacity: 0.42; mix-blend-mode: screen; filter: blur(2px);
  transform-origin: 50% 0;
  animation: tz-club-barrer var(--dur) ease-in-out var(--delay) infinite alternate;
  will-change: transform;
}
${en(S, ".tz-esc-destello")} {
  position: absolute; left: var(--x); top: var(--y);
  width: var(--tam); height: var(--tam); border-radius: 50%;
  background: radial-gradient(circle, #ffffff 0 20%, var(--c) 45%, transparent 70%);
  animation: tz-club-titilar var(--dur) ease-in-out var(--delay) infinite;
  will-change: opacity, transform;
}
@keyframes tz-club-barrer { from { transform: rotate(-28deg); } to { transform: rotate(28deg); } }
@keyframes tz-club-titilar { 0%, 100% { opacity: 0; transform: scale(0.4); } 50% { opacity: 0.9; transform: scale(1); } }`,
  });

const ESCENA_CLUB = [
  { clase: "tz-esc-foco", estilo: { "--x": "-8vw", "--c": "rgba(244,114,182,0.9)", "--dur": "7s", "--delay": "0s" } },
  { clase: "tz-esc-foco", estilo: { "--x": "33vw", "--c": "rgba(34,211,238,0.9)", "--dur": "9s", "--delay": "-3s" } },
  { clase: "tz-esc-foco", estilo: { "--x": "72vw", "--c": "rgba(167,139,250,0.9)", "--dur": "8s", "--delay": "-5s" } },
  ...[
    ["8%", "22%", "8px", "#f472b6", "3s", "0s"],
    ["18%", "58%", "5px", "#22d3ee", "2.4s", "-1s"],
    ["31%", "35%", "9px", "#a78bfa", "3.4s", "-2s"],
    ["44%", "76%", "5px", "#f472b6", "2.8s", "-0.5s"],
    ["57%", "28%", "6px", "#22d3ee", "3.1s", "-1.6s"],
    ["66%", "63%", "10px", "#fde047", "3.6s", "-2.4s"],
    ["78%", "41%", "5px", "#f472b6", "2.6s", "-0.8s"],
    ["88%", "84%", "6px", "#a78bfa", "3.2s", "-1.9s"],
    ["93%", "18%", "5px", "#22d3ee", "2.9s", "-2.7s"],
    ["4%", "88%", "6px", "#fde047", "3.3s", "-1.2s"],
  ].map(([x, y, tam, c, dur, delay]) => ({ clase: "tz-esc-destello", estilo: { "--x": x, "--y": y, "--tam": tam, "--c": c, "--dur": dur, "--delay": delay } })),
];

// =====================================================================
// MATERIALES DE CONSTRUCCIÓN — "Obra"
// =====================================================================
const CONCRETO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90'><g fill='rgba(255,255,255,0.05)'><circle cx='8' cy='12' r='1.3'/><circle cx='34' cy='6' r='0.9'/><circle cx='62' cy='22' r='1.6'/><circle cx='20' cy='44' r='1.1'/><circle cx='76' cy='58' r='1.2'/><circle cx='46' cy='72' r='0.8'/><circle cx='12' cy='80' r='1.4'/></g><g fill='rgba(0,0,0,0.22)'><circle cx='24' cy='20' r='1.2'/><circle cx='54' cy='40' r='1.5'/><circle cx='70' cy='12' r='0.9'/><circle cx='36' cy='60' r='1.3'/><circle cx='82' cy='84' r='1'/></g><path d='M10 60 L18 64 L22 72' stroke='rgba(0,0,0,0.18)' stroke-width='0.8' fill='none'/></svg>`
);
const OBRA_FRANJAS = "repeating-linear-gradient(-45deg, #f97316 0 14px, #f8fafc 14px 28px)";
const CINTA_METRICA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='50' height='18'><rect width='50' height='18' fill='#facc15'/><g stroke='#1c1917' stroke-width='1'><path d='M0 0 V10'/><path d='M5 0 V4'/><path d='M10 0 V4'/><path d='M15 0 V4'/><path d='M20 0 V4'/><path d='M25 0 V7'/><path d='M30 0 V4'/><path d='M35 0 V4'/><path d='M40 0 V4'/><path d='M45 0 V4'/></g><rect y='17' width='50' height='1' fill='#a16207'/></svg>`
);
const CASCO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 22'><path d='M4 16 Q4 3 15 3 Q26 3 26 16 Z' fill='#facc15' stroke='#a16207' stroke-width='1.1'/><path d='M13 3.5 H17 V15 H13 Z' fill='#fde047' stroke='#a16207' stroke-width='.8'/><rect x='1' y='15' width='28' height='4' rx='2' fill='#eab308' stroke='#a16207' stroke-width='1'/><ellipse cx='10' cy='8' rx='3' ry='1.5' fill='rgba(255,255,255,0.5)'/></svg>`
);
const CEMENTO = "linear-gradient(170deg, #4b4f55 0%, #3a3e43 60%, #33363b 100%)";

const obra = (S) =>
  construir(S, {
    raiz: [trama(CONCRETO, "90px 90px"), capa("linear-gradient(180deg, #1d1f22 0%, #151618 100%)")],
    cabecera: [capa(CINTA_METRICA, "left 0 bottom 0", "50px 18px", "repeat-x"), trama(CONCRETO, "90px 90px"), capa(CEMENTO)],
    cabeceraEstilo: `padding-bottom: 30px !important; border-bottom: none !important; box-shadow: 0 6px 18px rgba(0,0,0,0.5);`,
    pie: [trama(CONCRETO, "90px 90px"), capa(CEMENTO)],
    pieEstilo: `border-top: 8px solid transparent !important; border-image: ${OBRA_FRANJAS} 1 !important;`,
    boton: [capa("linear-gradient(180deg, rgba(255,255,255,0.22), transparent 55%)"), capa("linear-gradient(180deg, #fb923c, #ea580c)")],
    botonEstilo: "border: 1px solid #9a3412 !important; color: #1c1917 !important; box-shadow: 0 3px 8px rgba(0,0,0,0.45) !important; font-weight: 800;",
    botonPieEstilo: "border-radius: 8px !important; border: 1px solid #9a3412 !important; color: #1c1917 !important; box-shadow: 0 4px 10px rgba(0,0,0,0.5) !important;",
    panel: [capa(CASCO, "right 6px top 7px", "26px 19px"), capa(OBRA_FRANJAS, "left 0 bottom 0", "100% 6px"), trama(CONCRETO, "90px 90px"), capa(CEMENTO)],
    panelEstilo: "border: 1px solid #25272b !important; box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 18px rgba(0,0,0,0.45) !important; padding-bottom: 14px !important;",
    modal: [capa(OBRA_FRANJAS, "left 0 top 0", "100% 8px"), trama(CONCRETO, "90px 90px"), capa("linear-gradient(170deg, #34373c 0%, #222428 100%)")],
    modalEstilo: "border: 1px solid #5a5f66 !important; box-shadow: 0 20px 60px rgba(0,0,0,0.7) !important;",
    tituloEstilo: `color: #fff7ed !important; background: ${CINTA_METRICA} left 0 bottom 0 / 50px 14px repeat-x !important; padding-bottom: 22px;`,
    pestana: [capa(CEMENTO)],
    pestanaEstilo: "border: 1px solid #5a5f66 !important; color: #e7e5e4 !important;",
    activa: [capa("linear-gradient(180deg, #fb923c, #ea580c)")],
    activaEstilo: "border-color: #9a3412 !important; color: #1c1917 !important; box-shadow: 0 0 14px rgba(249,115,22,0.45) !important;",
    campoEstilo: "background: #18191b !important; border: 1px solid #5a5f66 !important;",
  });

// =====================================================================
// ELECTRODOMÉSTICOS — "Tecno hogar"
// =====================================================================
const ENCHUFE = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect x='3' y='3' width='18' height='18' rx='5' fill='#1e293b' stroke='#60a5fa' stroke-width='1.3'/><rect x='8' y='8' width='2.2' height='5' rx='1' fill='#93c5fd'/><rect x='13.8' y='8' width='2.2' height='5' rx='1' fill='#93c5fd'/><path d='M10 16 Q12 18 14 16' stroke='#93c5fd' stroke-width='1.3' fill='none'/></svg>`
);
const LEDS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='34' height='8'><circle cx='4' cy='4' r='2.6' fill='#22c55e'/><circle cx='14' cy='4' r='2.6' fill='#38bdf8'/><circle cx='24' cy='4' r='2.6' fill='#38bdf8' opacity='.35'/></svg>`
);
const INOX = "linear-gradient(180deg, #2b313a 0%, #1d222a 50%, #161a20 100%)";

const tecno = (S) =>
  construir(S, {
    raiz: [capa("radial-gradient(ellipse 900px 400px at 50% -10%, rgba(56,189,248,0.10), transparent 60%)"), capa(CEPILLADO, "0 0", "auto", "repeat"), capa("linear-gradient(180deg, #0f131a 0%, #0a0d12 100%)")],
    cabecera: [capa(CEPILLADO, "0 0", "auto", "repeat"), capa(INOX)],
    cabeceraEstilo: "border-bottom: 2px solid #38bdf8 !important; box-shadow: 0 2px 14px rgba(56,189,248,0.7), 0 8px 20px rgba(0,0,0,0.5) !important;",
    pie: [capa(CEPILLADO, "0 0", "auto", "repeat"), capa(INOX)],
    pieEstilo: "border-top: 2px solid #38bdf8 !important; box-shadow: 0 -2px 14px rgba(56,189,248,0.6);",
    boton: [capa("linear-gradient(180deg, rgba(255,255,255,0.10), transparent 55%)"), capa("linear-gradient(180deg, #1e293b, #111827)")],
    botonEstilo: "border: 1px solid rgba(96,165,250,0.7) !important; color: #bfdbfe !important; box-shadow: 0 0 8px rgba(56,189,248,0.35), inset 0 1px 0 rgba(255,255,255,0.1) !important; border-radius: 10px !important;",
    botonPieEstilo: "border-radius: 10px !important; border: 1px solid rgba(96,165,250,0.7) !important; color: #bfdbfe !important; box-shadow: 0 0 10px rgba(56,189,248,0.4) !important;",
    // Paneles = pantallas de vidrio negro con LEDs y un enchufe.
    panel: [capa(ENCHUFE, "right 7px top 7px", "18px 18px"), capa(LEDS, "right 10px bottom 9px", "34px 8px"), capa("linear-gradient(160deg, rgba(255,255,255,0.07) 0%, transparent 38%)"), capa("linear-gradient(170deg, #121821 0%, #0b0f15 100%)")],
    panelEstilo: "border: 1px solid rgba(96,165,250,0.45) !important; box-shadow: 0 0 0 1px #05070a, 0 0 12px rgba(56,189,248,0.18), 0 8px 18px rgba(0,0,0,0.5) !important;",
    modal: [capa("linear-gradient(160deg, rgba(255,255,255,0.06) 0%, transparent 35%)"), capa("linear-gradient(170deg, #151b25 0%, #0b0f15 100%)")],
    modalEstilo: "border: 1px solid rgba(96,165,250,0.55) !important; box-shadow: 0 0 24px rgba(56,189,248,0.25), 0 20px 60px rgba(0,0,0,0.7) !important;",
    tituloEstilo: "color: #e0f2fe !important; border-bottom: 2px solid #38bdf8; box-shadow: 0 6px 10px -8px #38bdf8; padding-bottom: 8px;",
    pestana: [capa("linear-gradient(180deg, #1e293b, #111827)")],
    pestanaEstilo: "border: 1px solid rgba(96,165,250,0.4) !important; color: #cbd5e1 !important;",
    activa: [capa("linear-gradient(180deg, #38bdf8, #2563eb)")],
    activaEstilo: "border-color: #1e40af !important; color: #ffffff !important; box-shadow: 0 0 16px rgba(56,189,248,0.6) !important;",
    campoEstilo: "background: #0b0f15 !important; border: 1px solid rgba(96,165,250,0.4) !important;",
    extra: (S) => `${en(S, ".tz-logo")} { filter: drop-shadow(0 0 14px rgba(56,189,248,0.45)) drop-shadow(0 4px 10px rgba(0,0,0,0.6)) !important; }`,
  });

// =====================================================================
// MUEBLERÍA — "Taller de madera"
// =====================================================================
const COLA_MILANO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='16'><rect width='48' height='16' fill='#4a2f1b'/><path d='M4 0 H20 L17 16 H7 Z' fill='#b07a4a'/><path d='M28 0 H44 L41 16 H31 Z' fill='#b07a4a'/><path d='M4 0 H20 L17 16 H7 Z M28 0 H44 L41 16 H31 Z' fill='none' stroke='#2a170b' stroke-width='1'/></svg>`
);
const SERRUCHO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 34 20'><path d='M2 12 L24 4 L26 10 L4 18 Z' fill='#cbd5e1' stroke='#475569' stroke-width='.9'/><path d='M4 18 l2 -2 l1 1.6 l2 -2.2 l1 1.6 l2 -2.2 l1 1.6 l2 -2.2 l1 1.6 l2 -2.2 l1 1.6 l2 -2.2' stroke='#475569' stroke-width='.8' fill='none'/><path d='M24 4 L31 2 Q33 6 30 10 L26 10 Z' fill='#92400e' stroke='#451a03' stroke-width='.9'/><circle cx='29.5' cy='6' r='1.5' fill='#451a03'/></svg>`
);
const ROBLE = "linear-gradient(170deg, #8a5a32 0%, #73492a 50%, #5f3b21 100%)";
const NOGAL_OSC = "linear-gradient(170deg, #3d2615 0%, #2e1c0f 100%)";
const TAPIZ = [
  capa("radial-gradient(circle, rgba(0,0,0,0.45) 1.6px, rgba(255,255,255,0.12) 2.4px, transparent 3px)", "0 0", "16px 16px", "repeat"),
  capa("linear-gradient(180deg, #2f5d4a 0%, #1f4334 100%)"),
];

const taller = (S) =>
  construir(S, {
    raiz: [trama(VETA, "160px 46px"), capa("radial-gradient(ellipse 900px 400px at 50% -10%, rgba(255,210,150,0.10), transparent 60%)"), capa("linear-gradient(180deg, #1c120a 0%, #140d08 100%)")],
    cabecera: [capa(COLA_MILANO, "left 0 bottom 0", "48px 16px", "repeat-x"), trama(VETA, "160px 46px"), capa(ROBLE)],
    cabeceraEstilo: "padding-bottom: 28px !important; border-bottom: none !important; box-shadow: 0 6px 18px rgba(0,0,0,0.5);",
    pie: [capa(COLA_MILANO, "left 0 top 0", "48px 16px", "repeat-x"), trama(VETA, "160px 46px"), capa(NOGAL_OSC)],
    pieEstilo: "border-top: none !important; padding-top: 26px !important;",
    // Botones tapizados: terciopelo verde con capitoné.
    boton: TAPIZ,
    botonEstilo: "border: 1px solid #0f2a1f !important; color: #f3e7c9 !important; box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 3px 8px rgba(0,0,0,0.45) !important; text-shadow: 0 1px 1px rgba(0,0,0,0.5);",
    botonPieEstilo: "border-radius: 10px !important; border: 1px solid #0f2a1f !important; color: #f3e7c9 !important; box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 10px rgba(0,0,0,0.5) !important;",
    // Paneles de roble con marco de nogal (marquetería) y un serrucho.
    panel: [capa(SERRUCHO, "right 6px top 8px", "28px 16px"), trama(VETA, "160px 46px"), capa("linear-gradient(170deg, #6e4627 0%, #573620 100%)")],
    panelEstilo: "border: 3px solid #2e1c0f !important; box-shadow: inset 0 0 0 1px rgba(255,220,170,0.25), 0 8px 18px rgba(0,0,0,0.45) !important;",
    modal: [trama(VETA, "160px 46px"), capa("linear-gradient(170deg, #4a2f1b 0%, #2e1c0f 100%)")],
    modalEstilo: "border: 6px solid #2e1c0f !important; box-shadow: inset 0 0 0 1px rgba(255,220,170,0.3), 0 20px 60px rgba(0,0,0,0.7) !important;",
    tituloEstilo: `color: #fbe7c6 !important; background: ${COLA_MILANO} left 0 bottom 0 / 36px 12px repeat-x !important; padding-bottom: 20px;`,
    pestana: [trama(VETA, "160px 46px"), capa(ROBLE)],
    pestanaEstilo: "border: 1px solid #2e1c0f !important; color: #fbe7c6 !important;",
    activa: [capa("linear-gradient(180deg, #f1d18a 0%, #d4a24c 50%, #a7772a 100%)")],
    activaEstilo: "border-color: #5c3d10 !important; color: #2a1606 !important; box-shadow: 0 0 14px rgba(212,162,76,0.45) !important;",
    campoEstilo: "background: #1c120a !important; border: 1px solid #6b4426 !important;",
  });

// =====================================================================
// BOTICA Y FARMACIA — "Botica" (claro)
// =====================================================================
const CRUCES = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='56' height='56'><path d='M10 6 h4 v4 h4 v4 h-4 v4 h-4 v-4 h-4 v-4 h4 Z' fill='rgba(4,120,87,0.08)'/><path d='M38 34 h4 v4 h4 v4 h-4 v4 h-4 v-4 h-4 v-4 h4 Z' fill='rgba(4,120,87,0.08)'/></svg>`
);
const CAPSULAS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='24'><g transform='translate(14 12) rotate(-25)'><rect x='-10' y='-4.5' width='20' height='9' rx='4.5' fill='#ffffff' stroke='#94a3b8' stroke-width='.8'/><path d='M0 -4.5 H5.5 A4.5 4.5 0 0 1 5.5 4.5 H0 Z' fill='#10b981'/></g><g transform='translate(42 12)'><circle r='6' fill='#ffffff' stroke='#94a3b8' stroke-width='.8'/><path d='M-4 0 H4' stroke='#94a3b8' stroke-width='.9'/></g><g transform='translate(70 12) rotate(20)'><rect x='-10' y='-4.5' width='20' height='9' rx='4.5' fill='#ffffff' stroke='#94a3b8' stroke-width='.8'/><path d='M0 -4.5 H5.5 A4.5 4.5 0 0 1 5.5 4.5 H0 Z' fill='#3b82f6'/></g><g transform='translate(88 13)'><ellipse rx='5' ry='4' fill='#fde68a' stroke='#d97706' stroke-width='.8'/></g></svg>`
);
const FRASCO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 28'><rect x='5' y='1' width='10' height='5' rx='1.5' fill='#f8fafc' stroke='#64748b' stroke-width='.8'/><path d='M3 8 Q3 6 5 6 H15 Q17 6 17 8 V25 Q17 27 15 27 H5 Q3 27 3 25 Z' fill='#d97706' stroke='#92400e' stroke-width='.9'/><rect x='5' y='12' width='10' height='9' rx='1' fill='#fffbeb'/><path d='M9 14 h2 v2 h2 v2 h-2 v2 h-2 v-2 h-2 v-2 h2 Z' fill='#059669'/><rect x='4.5' y='8' width='2' height='16' rx='1' fill='rgba(255,255,255,0.3)'/></svg>`
);

const botica = (S) =>
  construir(S, {
    raiz: [trama(CRUCES, "56px 56px"), capa("linear-gradient(180deg, #f7fcfa 0%, #ebf6f1 100%)")],
    cabecera: [capa(CAPSULAS, "left 0 bottom 4px", "96px 24px", "repeat-x"), trama(CRUCES, "56px 56px"), capa("linear-gradient(180deg, #ffffff 0%, #e3f5ec 100%)")],
    cabeceraEstilo: "padding-bottom: 36px !important; border-bottom: 4px solid #059669 !important; box-shadow: 0 6px 14px rgba(4,120,87,0.10);",
    pie: [capa(CAPSULAS, "left 0 top 6px", "96px 24px", "repeat-x"), capa("linear-gradient(180deg, #e3f5ec, #ffffff)")],
    pieEstilo: "border-top: 4px solid #059669 !important; padding-top: 38px !important;",
    boton: [capa("linear-gradient(180deg, #ffffff, #f0fdf7)")],
    botonEstilo: "border: 1.5px solid #10b981 !important; color: #047857 !important; box-shadow: 0 2px 6px rgba(4,120,87,0.12) !important;",
    botonPieEstilo: "border-radius: 10px !important; border: 1.5px solid #10b981 !important; color: #047857 !important; box-shadow: 0 3px 8px rgba(4,120,87,0.14) !important;",
    panel: [capa(FRASCO, "right 7px top 7px", "16px 22px"), capa("linear-gradient(90deg, #10b981 0 4px, transparent 4px)"), capa("linear-gradient(180deg, #ffffff, #fbfefd)")],
    panelEstilo: "border: 1px solid #cdeee0 !important; box-shadow: 0 4px 12px rgba(4,120,87,0.08) !important;",
    modal: [capa("linear-gradient(180deg, #059669 0 6px, transparent 6px)"), trama(CRUCES, "56px 56px"), capa("linear-gradient(180deg, #ffffff, #f4fbf8)")],
    modalEstilo: "border: 1px solid #a7e3c9 !important; box-shadow: 0 20px 60px rgba(4,120,87,0.18) !important;",
    tituloEstilo: "color: #065f46 !important; border-bottom: 2px solid #a7e3c9; padding-bottom: 8px;",
    pestana: [capa("linear-gradient(180deg, #ffffff, #f0fdf7)")],
    pestanaEstilo: "border: 1px solid #b7e6d1 !important; color: #065f46 !important;",
    activa: [capa("linear-gradient(180deg, #10b981, #047857)")],
    activaEstilo: "border-color: #064e3b !important; color: #ffffff !important; box-shadow: 0 4px 14px rgba(4,120,87,0.3) !important;",
    campoEstilo: "background: #ffffff !important; border: 1px solid #b7e6d1 !important;",
  });

// =====================================================================
// VETERINARIA Y PET SHOP — "Huellitas" (claro)
// =====================================================================
const huella = (color) =>
  `<g fill='${color}'><ellipse cx='0' cy='4' rx='5.5' ry='4.6'/><ellipse cx='-6' cy='-3' rx='2.2' ry='2.8'/><ellipse cx='-2' cy='-6.5' rx='2.2' ry='2.8'/><ellipse cx='2.6' cy='-6.5' rx='2.2' ry='2.8'/><ellipse cx='6.6' cy='-3' rx='2.2' ry='2.8'/></g>`;
const HUELLAS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90'><g transform='translate(18 20) rotate(-20)'>${huella("rgba(14,116,144,0.08)")}</g><g transform='translate(42 44) rotate(10)'>${huella("rgba(14,116,144,0.08)")}</g><g transform='translate(70 70) rotate(-10)'>${huella("rgba(194,65,12,0.07)")}</g></svg>`
);
const JUGUETES = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='26'><g transform='translate(20 13)'><path d='M-12 -3 a3.5 3.5 0 1 1 3 -3 h18 a3.5 3.5 0 1 1 3 3 v6 a3.5 3.5 0 1 1 -3 3 h-18 a3.5 3.5 0 1 1 -3 -3 Z' fill='#fff7ed' stroke='#c2410c' stroke-width='1'/></g><g transform='translate(54 13)'><circle r='8' fill='#facc15' stroke='#a16207' stroke-width='1'/><path d='M-8 0 Q0 -5 8 0 M-8 0 Q0 5 8 0' stroke='#fff' stroke-width='1.4' fill='none'/></g><g transform='translate(84 13)'>${huella("#0e7490")}</g><g transform='translate(108 13)'><circle r='8' fill='#38bdf8' stroke='#0369a1' stroke-width='1'/><path d='M-5 -5 L5 5 M-5 5 L5 -5' stroke='#fff' stroke-width='1.3'/></g></svg>`
);
const PLACA_COLLAR = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 26'><path d='M2 4 Q12 10 22 4' stroke='#c2410c' stroke-width='3' fill='none' stroke-linecap='round'/><circle cx='12' cy='8.5' r='1.6' fill='none' stroke='#a16207' stroke-width='1.2'/><path d='M12 10 l6 4 v4 a6 6 0 0 1 -12 0 v-4 Z' fill='#facc15' stroke='#a16207' stroke-width='1'/><g transform='translate(12 17.2) scale(0.42)'>${huella("#a16207")}</g></svg>`
);

const huellitas = (S) =>
  construir(S, {
    raiz: [trama(HUELLAS, "90px 90px"), capa("linear-gradient(180deg, #f5fbfd 0%, #e8f5f9 100%)")],
    cabecera: [capa(JUGUETES, "left 0 bottom 4px", "120px 26px", "repeat-x"), trama(HUELLAS, "90px 90px"), capa("linear-gradient(180deg, #fef9c3 0%, #fde68a 100%)")],
    cabeceraEstilo: "padding-bottom: 38px !important; border-bottom: 4px solid #0e7490 !important; box-shadow: 0 6px 14px rgba(14,116,144,0.12);",
    pie: [capa(JUGUETES, "left 0 top 6px", "120px 26px", "repeat-x"), capa("linear-gradient(180deg, #fde68a, #fef9c3)")],
    pieEstilo: "border-top: 4px solid #0e7490 !important; padding-top: 40px !important;",
    boton: [capa("linear-gradient(180deg, rgba(255,255,255,0.25), transparent 55%)"), capa("linear-gradient(180deg, #0891b2, #0e7490)")],
    botonEstilo: "border: 1px solid #155e75 !important; color: #ffffff !important; box-shadow: 0 3px 8px rgba(14,116,144,0.3) !important; border-radius: 999px !important;",
    botonPieEstilo: "border-radius: 999px !important; border: 1px solid #155e75 !important; color: #ffffff !important; box-shadow: 0 4px 10px rgba(14,116,144,0.3) !important;",
    panel: [capa(PLACA_COLLAR, "right 6px top 6px", "20px 22px"), trama(HUELLAS, "90px 90px"), capa("linear-gradient(180deg, #ffffff, #fbfeff)")],
    panelEstilo: "border: 2px dashed #a5d8e6 !important; box-shadow: 0 4px 12px rgba(14,116,144,0.08) !important;",
    modal: [trama(HUELLAS, "90px 90px"), capa("linear-gradient(180deg, #fef3c7 0 54px, #ffffff 54px)")],
    modalEstilo: "border: 2px solid #67c5dc !important; box-shadow: 0 20px 60px rgba(14,116,144,0.2) !important;",
    tituloEstilo: "color: #155e75 !important; border-bottom: 2px dashed #f59e0b; padding-bottom: 8px;",
    pestana: [capa("linear-gradient(180deg, #ffffff, #f0f9fc)")],
    pestanaEstilo: "border: 1px solid #b4e0ec !important; color: #155e75 !important;",
    activa: [capa("linear-gradient(180deg, #fb923c, #ea580c)")],
    activaEstilo: "border-color: #9a3412 !important; color: #ffffff !important; box-shadow: 0 4px 14px rgba(234,88,12,0.35) !important;",
    campoEstilo: "background: #ffffff !important; border: 1px solid #b4e0ec !important;",
  });

// =====================================================================
// Catálogo
// =====================================================================
export const TEMATICOS = [
  {
    id: "metal",
    rubro: "ferreteria",
    nombre: "Metal industrial",
    descripcion: "Acero cepillado, tuercas y franjas de seguridad",
    paleta: { id: "tematico-metal", nombre: "Metal industrial", modo: "oscuro", principal: "#b8c4d0", secundario: "#ff8a1f", acento: "#ffcc00", botones: "#ffcc00", fondo1: "#121417", fondo2: "#262b31" },
    muestra: `${TUERCA} left 8px top 8px / 16px 16px no-repeat, ${TUERCA} right 8px bottom 8px / 16px 16px no-repeat, ${PLACA} 0 0 / 20px 20px, ${ACERO}`,
    css: metal,
  },
  {
    id: "bodega",
    rubro: "abarrotes",
    nombre: "Bodega de barrio",
    descripcion: "Madera, toldo a rayas y cajas con cinta",
    paleta: { id: "tematico-bodega", nombre: "Bodega de barrio", modo: "oscuro", principal: "#f2c48d", secundario: "#ff6b4a", acento: "#ffd166", botones: "#ffe2b0", fondo1: "#1b120c", fondo2: "#2e1e13" },
    muestra: `${TOLDO} 0 0 / 100% 22px no-repeat, ${FESTON} 0 22px / 34px 8px repeat-x, ${VETA} 0 0 / 120px 34px, ${MADERA_OSC}`,
    css: bodega,
  },
  {
    id: "gondola",
    rubro: "minimarket",
    nombre: "Góndola",
    descripcion: "Estantes claros, rieles de precio y ofertas en rojo",
    paleta: { id: "tematico-gondola", nombre: "Góndola", modo: "claro", principal: "#c1121f", secundario: "#1d4ed8", acento: "#b45309", botones: "#c1121f", fondo1: "#f6f7f9", fondo2: "#e9edf1" },
    muestra: `linear-gradient(180deg, #c1121f 0 5px, transparent 5px), ${ETIQUETAS} 0 bottom / 90px 12px repeat-x, ${RIEL} 0 bottom / 100% 12px no-repeat, linear-gradient(180deg, #ffffff, #eceff3)`,
    css: gondola,
  },
  {
    id: "mantel",
    rubro: "restaurante",
    nombre: "Mantel y madera",
    descripcion: "Mantel a cuadros, madera y pizarra con tiza",
    paleta: { id: "tematico-mantel", nombre: "Mantel y madera", modo: "oscuro", principal: "#f3e3c3", secundario: "#ff6b5b", acento: "#f4b860", botones: "#f4b860", fondo1: "#1a110b", fondo2: "#2c1d12" },
    muestra: `${CUADROS}, linear-gradient(180deg, #7a1d1d, #5a1414)`,
    css: mantel,
  },
  {
    id: "brasa",
    rubro: "polleria",
    nombre: "Brasa",
    descripcion: "Carbón, parrilla y brasas encendidas",
    paleta: { id: "tematico-brasa", nombre: "Brasa", modo: "oscuro", principal: "#ffa94d", secundario: "#ff5a1f", acento: "#ffd166", botones: "#ffb24a", fondo1: "#0d0907", fondo2: "#1f130c" },
    muestra: `${PARRILLA}, radial-gradient(ellipse 120% 70% at 50% 120%, rgba(255,110,20,0.6), transparent 70%), linear-gradient(180deg, #1a1210, #0b0806)`,
    css: brasa,
  },
  {
    id: "marino",
    rubro: "cevicheria",
    nombre: "Marino",
    descripcion: "Playa, mar profundo, peces y cubierta de barco",
    paleta: { id: "tematico-marino", nombre: "Marino", modo: "oscuro", principal: "#5eead4", secundario: "#fb7185", acento: "#fde68a", botones: "#67e8f9", fondo1: "#031b2b", fondo2: "#06334d" },
    muestra: `${PEZ_CORAL} right 12px top 10px / 34px 20px no-repeat, ${CONCHA_NACAR} right 54px bottom 10px / 22px 19px no-repeat, ${ESTRELLA_MAR} left 6px bottom 6px / 18px 18px no-repeat, ${OLA_FRENTE} left 0 top 0 / 60px 10px repeat-x, ${SUPERFICIE}, ${AGUA_PROFUNDA}`,
    escena: ESCENA_MARINO,
    css: marino,
  },
  {
    id: "dragon",
    rubro: "chifa",
    nombre: "Dragón rojo",
    descripcion: "Laca roja y oro, nubes, faroles y celosías",
    paleta: { id: "tematico-dragon", nombre: "Dragón rojo", modo: "oscuro", principal: "#f5c542", secundario: "#ffe0b0", acento: "#ffd56b", botones: "#f5c542", fondo1: "#140404", fondo2: "#2e0b0b" },
    muestra: `${FAROL} right 10px top 0 / 18px 32px no-repeat, ${GRECA} left 0 bottom 0 / 24px 10px repeat-x, ${NUBES_CHINAS} 0 0 / 60px 34px, ${LACA}`,
    css: dragon,
  },
  {
    id: "horno",
    rubro: "pizzeria",
    nombre: "Horno de leña",
    descripcion: "Ladrillo, fuego, albahaca y tricolor italiano",
    paleta: { id: "tematico-horno", nombre: "Horno de leña", modo: "oscuro", principal: "#ffcc80", secundario: "#ff6f5e", acento: "#8bd48f", botones: "#ffb74d", fondo1: "#140b07", fondo2: "#2d1810" },
    muestra: `${TRICOLOR} left 0 bottom 0 / 100% 6px no-repeat, ${ALBAHACA} right 10px top 8px / 22px 19px no-repeat, radial-gradient(ellipse 80% 60% at 50% 120%, rgba(255,140,30,0.6), transparent 70%), ${LADRILLOS} 0 0 / 48px 24px, #5a2618`,
    css: horno,
  },
  {
    id: "pasteleria",
    rubro: "panaderia",
    nombre: "Pastelería",
    descripcion: "Glaseado rosa, chispas de colores y cupcakes",
    paleta: { id: "tematico-pasteleria", nombre: "Pastelería", modo: "claro", principal: "#be185d", secundario: "#8d5a4a", acento: "#b45309", botones: "#be185d", fondo1: "#fff9f2", fondo2: "#fbefe4" },
    muestra: `${CUPCAKE} right 10px bottom 8px / 20px 22px no-repeat, ${GLASEADO} left 0 top 0 / 70px 18px repeat-x, ${CHISPAS} 0 0 / 60px 44px, linear-gradient(180deg, #fde4ef, #fff9f2)`,
    css: pasteleria,
  },
  {
    id: "cafe",
    rubro: "cafeteria",
    nombre: "Café de especialidad",
    descripcion: "Espresso, granos de café, crema y cobre",
    paleta: { id: "tematico-cafe", nombre: "Café de especialidad", modo: "oscuro", principal: "#e6c9a8", secundario: "#e0915e", acento: "#f2d0a4", botones: "#d9a066", fondo1: "#100906", fondo2: "#24160f" },
    muestra: `${GRANO} right 12px top 14px / 14px 18px no-repeat, ${CREMA} left 0 top 0 / 70px 12px repeat-x, ${GRANOS} 0 0 / 70px 70px, ${ESPRESSO}`,
    css: cafe,
  },
  {
    id: "tropical",
    rubro: "jugueria",
    nombre: "Tropical",
    descripcion: "Hojas tropicales, frutas y ola de jugo",
    paleta: { id: "tematico-tropical", nombre: "Tropical", modo: "oscuro", principal: "#86efac", secundario: "#fb923c", acento: "#fde047", botones: "#bef264", fondo1: "#04140c", fondo2: "#0a2a19" },
    muestra: `${JUGO} left 0 bottom 0 / 90px 14px repeat-x, ${HOJA_SI} left -20px top -20px / 80px 80px no-repeat, ${RODAJAS} 0 0 / 120px 56px, linear-gradient(180deg, #15803d, #0a2a19)`,
    css: tropical,
  },
  {
    id: "helado",
    rubro: "heladeria",
    nombre: "Helado artesanal",
    descripcion: "Bolas de colores, barquillo y conos",
    paleta: { id: "tematico-helado", nombre: "Helado artesanal", modo: "claro", principal: "#0f766e", secundario: "#db2777", acento: "#b45309", botones: "#92400e", fondo1: "#f4fbf8", fondo2: "#e9f6f0" },
    muestra: `${CONO} right 12px top 10px / 18px 24px no-repeat, ${BOLAS} left 0 bottom 0 / 81px 26px repeat-x, linear-gradient(180deg, #d1fae5, #a7f3d0)`,
    css: helado,
  },
  {
    id: "carnicero",
    rubro: "carniceria",
    nombre: "Carnicero",
    descripcion: "Azulejos, tabla de picar y cuchilla",
    paleta: { id: "tematico-carnicero", nombre: "Carnicero", modo: "oscuro", principal: "#f5e6d3", secundario: "#fca5a5", acento: "#fecaca", botones: "#fee2e2", fondo1: "#0e0807", fondo2: "#1d110d" },
    muestra: `${CUCHILLA} right 10px bottom 10px / 28px 20px no-repeat, linear-gradient(180deg, #b91c1c, #991b1b) left 0 top 46% / 100% 8px no-repeat, ${AZULEJOS} 0 0 / 33px 16px, #d6cec2`,
    css: carnicero,
  },
  {
    id: "mercado",
    rubro: "frutas-verduras",
    nombre: "Mercado fresco",
    descripcion: "Arpillera, cajones de madera y verduras",
    paleta: { id: "tematico-mercado", nombre: "Mercado fresco", modo: "oscuro", principal: "#bef264", secundario: "#fb923c", acento: "#facc15", botones: "#d9f99d", fondo1: "#0a140a", fondo2: "#1a2e12" },
    muestra: `${VERDURAS} left 0 bottom 4px / 120px 26px repeat-x, ${CAJON} left 0 bottom 0 / 100% 34px no-repeat, ${ARPILLERA} 0 0 / 12px 12px, linear-gradient(180deg, #3f6212, #365314)`,
    css: mercado,
  },
  {
    id: "vinos",
    rubro: "licoreria",
    nombre: "Bodega de vinos",
    descripcion: "Muro de piedra, barricas, parra y oro",
    paleta: { id: "tematico-vinos", nombre: "Bodega de vinos", modo: "oscuro", principal: "#e9c46a", secundario: "#f4a7b9", acento: "#f5d58a", botones: "#e9c46a", fondo1: "#120a0c", fondo2: "#2a0d16" },
    muestra: `${UVAS} right 12px top 10px / 18px 22px no-repeat, ${PARRA} left 0 bottom 2px / 100px 25px repeat-x, ${PIEDRA} 0 0 / 60px 36px, #120a0c`,
    css: vinos,
  },
  {
    id: "club",
    rubro: "bar-discoteca",
    nombre: "Club nocturno",
    descripcion: "Reflectores, destellos y luces de neón",
    paleta: { id: "tematico-club", nombre: "Club nocturno", modo: "oscuro", principal: "#22d3ee", secundario: "#f472b6", acento: "#c4b5fd", botones: "#f472b6", fondo1: "#07020f", fondo2: "#160a2b" },
    muestra: `${NOTA} right 12px top 10px / 18px 18px no-repeat, linear-gradient(115deg, transparent 30%, rgba(244,114,182,0.35) 38%, transparent 46%), linear-gradient(65deg, transparent 52%, rgba(34,211,238,0.3) 60%, transparent 68%), ${NOCHE}`,
    escena: ESCENA_CLUB,
    css: club,
  },
  {
    id: "obra",
    rubro: "materiales-construccion",
    nombre: "Obra",
    descripcion: "Concreto, franjas de obra, cinta métrica y casco",
    paleta: { id: "tematico-obra", nombre: "Obra", modo: "oscuro", principal: "#fb923c", secundario: "#fdba74", acento: "#facc15", botones: "#fb923c", fondo1: "#151618", fondo2: "#2a2c30" },
    muestra: `${CASCO} right 10px top 8px / 26px 19px no-repeat, ${CINTA_METRICA} left 0 bottom 0 / 40px 14px repeat-x, ${CONCRETO} 0 0 / 70px 70px, ${CEMENTO}`,
    css: obra,
  },
  {
    id: "tecno",
    rubro: "electrodomesticos",
    nombre: "Tecno hogar",
    descripcion: "Acero inoxidable, vidrio negro y luces LED",
    paleta: { id: "tematico-tecno", nombre: "Tecno hogar", modo: "oscuro", principal: "#60a5fa", secundario: "#93c5fd", acento: "#38bdf8", botones: "#bfdbfe", fondo1: "#0a0d12", fondo2: "#161b24" },
    muestra: `${ENCHUFE} right 10px top 10px / 18px 18px no-repeat, ${LEDS} right 12px bottom 10px / 34px 8px no-repeat, linear-gradient(180deg, transparent 0 calc(100% - 2px), #38bdf8 calc(100% - 2px)), ${INOX}`,
    css: tecno,
  },
  {
    id: "taller",
    rubro: "muebleria",
    nombre: "Taller de madera",
    descripcion: "Roble, ensambles, tapizado y herramientas",
    paleta: { id: "tematico-taller", nombre: "Taller de madera", modo: "oscuro", principal: "#e8c39e", secundario: "#f0a35e", acento: "#ffd8a8", botones: "#f3e7c9", fondo1: "#140d08", fondo2: "#2a1b10" },
    muestra: `${SERRUCHO} right 10px top 10px / 28px 16px no-repeat, ${COLA_MILANO} left 0 bottom 0 / 36px 12px repeat-x, ${VETA} 0 0 / 120px 34px, ${ROBLE}`,
    css: taller,
  },
  {
    id: "botica",
    rubro: "botica",
    nombre: "Botica",
    descripcion: "Blanco clínico, cruz verde, cápsulas y frascos",
    paleta: { id: "tematico-botica", nombre: "Botica", modo: "claro", principal: "#047857", secundario: "#0369a1", acento: "#b45309", botones: "#047857", fondo1: "#f7fcfa", fondo2: "#ebf6f1" },
    muestra: `${FRASCO} right 12px top 10px / 16px 22px no-repeat, ${CAPSULAS} left 0 bottom 4px / 80px 20px repeat-x, ${CRUCES} 0 0 / 46px 46px, linear-gradient(180deg, #ffffff, #e3f5ec)`,
    css: botica,
  },
  {
    id: "huellitas",
    rubro: "veterinaria",
    nombre: "Huellitas",
    descripcion: "Patitas, huesitos, pelotas y collar con placa",
    paleta: { id: "tematico-huellitas", nombre: "Huellitas", modo: "claro", principal: "#0e7490", secundario: "#c2410c", acento: "#7c3aed", botones: "#0e7490", fondo1: "#f5fbfd", fondo2: "#e8f5f9" },
    muestra: `${PLACA_COLLAR} right 10px top 8px / 20px 22px no-repeat, ${JUGUETES} left 0 bottom 4px / 100px 22px repeat-x, ${HUELLAS} 0 0 / 70px 70px, linear-gradient(180deg, #fef9c3, #fde68a)`,
    css: huellitas,
  },
];

export function tematicoDe(tema) {
  if (!tema?.tematico) return null;
  return TEMATICOS.find((t) => t.id === tema.tematico && t.rubro === tema.rubro) || null;
}

export function tematicosDelRubro(claveRubro) {
  return TEMATICOS.filter((t) => t.rubro === claveRubro);
}
