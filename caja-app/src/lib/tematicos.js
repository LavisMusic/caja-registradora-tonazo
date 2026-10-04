// TEMAS TEMÁTICOS por rubro (Perfil → Tema → "Temático de tu rubro").
// Un temático = una paleta fija + ADORNOS dibujados en código (texturas,
// tuercas, toldos, olas… como capas SVG/degradados de fondo — no
// pseudo-elementos, así no pisan ningún efecto existente de la app).
// Solo lo pueden usar los negocios de ese rubro (rubros.clave, migración
// 0097; la RPC actualizar_tema_negocio lo verifica). Uno por rubro (con
// el tiempo un rubro puede tener varios).
// Se guarda como { tematico: "metal", rubro: "ferreteria" }.
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
// =====================================================================
const RED_PESCA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28'><path d='M0 14 L14 0 L28 14 L14 28 Z' fill='none' stroke='rgba(220,255,250,0.13)' stroke-width='1.2'/></svg>`
);
const OLAS = (color, espuma) =>
  svg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='16'><path d='M0 8 C10 0 20 0 30 8 S50 16 60 8 S75 2 80 6 V16 H0Z' fill='${color}'/><path d='M0 8 C10 0 20 0 30 8 S50 16 60 8 S75 2 80 6' fill='none' stroke='${espuma}' stroke-width='1.5'/></svg>`
  );
const OLAS_ABAJO = OLAS("#0b5a7a", "rgba(230,255,252,0.7)");
const OLAS_ARRIBA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='16'><path d='M0 8 C10 16 20 16 30 8 S50 0 60 8 S75 14 80 10 V0 H0Z' fill='#0b5a7a'/><path d='M0 8 C10 16 20 16 30 8 S50 0 60 8 S75 14 80 10' fill='none' stroke='rgba(230,255,252,0.7)' stroke-width='1.5'/></svg>`
);
const CONCHA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M12 21 L3 9 Q12 0 21 9 Z' fill='rgba(253,224,200,0.75)' stroke='rgba(251,113,133,0.8)' stroke-width='1'/><g stroke='rgba(251,113,133,0.7)' stroke-width='0.9'><path d='M12 21 L7 6'/><path d='M12 21 L12 4'/><path d='M12 21 L17 6'/></g></svg>`
);
const CAUSTICAS =
  "radial-gradient(ellipse 500px 260px at 20% 10%, rgba(94,234,212,0.12), transparent 65%), radial-gradient(ellipse 600px 300px at 85% 30%, rgba(103,232,249,0.08), transparent 65%)";

const marino = (S) =>
  construir(S, {
    raiz: [capa(CAUSTICAS), capa("linear-gradient(180deg, #032235 0%, #021a29 50%, #04314a 100%)")],
    cabecera: [capa(OLAS_ABAJO, "left 0 bottom 0", "80px 16px", "repeat-x"), trama(RED_PESCA, "28px 28px"), capa("linear-gradient(180deg, #0a3d5a 0%, #06405c 100%)")],
    cabeceraEstilo: "padding-bottom: 30px !important; border-bottom: none !important; box-shadow: 0 6px 16px rgba(0,0,0,0.35);",
    pie: [capa(OLAS_ARRIBA, "0 0", "80px 16px", "repeat-x"), trama(RED_PESCA, "28px 28px"), capa("linear-gradient(180deg, #06405c, #032235)")],
    pieEstilo: "padding-top: 30px !important; border-top: none !important;",
    boton: [capa("linear-gradient(180deg, rgba(255,255,255,0.22), transparent 55%)"), capa("linear-gradient(180deg, #0f6f86, #0a4d63)")],
    botonEstilo: "border: 1px solid rgba(94,234,212,0.7) !important; color: #c9fbf3 !important; box-shadow: 0 0 12px rgba(94,234,212,0.25) !important; border-radius: 999px !important;",
    botonPieEstilo: "border: 1px solid rgba(94,234,212,0.7) !important; color: #c9fbf3 !important; box-shadow: 0 0 14px rgba(94,234,212,0.3) !important;",
    panel: [capa(CONCHA, "right 8px top 8px", "18px 18px"), trama(RED_PESCA, "28px 28px"), capa("linear-gradient(170deg, rgba(10,77,99,0.75) 0%, rgba(3,34,53,0.9) 100%)")],
    panelEstilo: "border: 1px solid rgba(94,234,212,0.35) !important; box-shadow: 0 6px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08) !important;",
    modal: [capa(OLAS_ABAJO, "left 0 bottom 0", "80px 16px", "repeat-x"), capa(CAUSTICAS), capa("linear-gradient(170deg, #0a3d5a 0%, #032235 100%)")],
    modalEstilo: "border: 1px solid rgba(94,234,212,0.5) !important; box-shadow: 0 20px 60px rgba(0,0,0,0.6) !important; padding-bottom: 34px !important;",
    tituloEstilo: "color: #e6fffb !important; border-bottom: 2px solid rgba(94,234,212,0.5); padding-bottom: 8px;",
    pestana: [capa("linear-gradient(180deg, #0c566e, #083d50)")],
    pestanaEstilo: "border: 1px solid rgba(94,234,212,0.35) !important; color: #c9fbf3 !important;",
    activa: [capa("linear-gradient(180deg, #fb7185, #e11d48)")],
    activaEstilo: "border-color: #9f1239 !important; color: #ffffff !important; box-shadow: 0 0 16px rgba(251,113,133,0.5) !important;",
    campoEstilo: "background: rgba(2,26,41,0.85) !important; border: 1px solid rgba(94,234,212,0.35) !important;",
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
    descripcion: "Mar turquesa, olas, redes de pesca y conchas",
    paleta: { id: "tematico-marino", nombre: "Marino", modo: "oscuro", principal: "#5eead4", secundario: "#fb7185", acento: "#fde68a", botones: "#67e8f9", fondo1: "#031b2b", fondo2: "#06334d" },
    muestra: `${OLAS_ABAJO} 0 bottom / 60px 12px repeat-x, ${CONCHA} right 8px top 8px / 18px 18px no-repeat, ${RED_PESCA} 0 0 / 22px 22px, linear-gradient(180deg, #0a3d5a, #032235)`,
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
