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
];

export function tematicoDe(tema) {
  if (!tema?.tematico) return null;
  return TEMATICOS.find((t) => t.id === tema.tematico && t.rubro === tema.rubro) || null;
}

export function tematicosDelRubro(claveRubro) {
  return TEMATICOS.filter((t) => t.rubro === claveRubro);
}
