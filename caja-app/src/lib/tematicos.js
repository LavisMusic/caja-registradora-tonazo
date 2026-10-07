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

// VELO de las ventanas: una capa del color de fondo semitransparente
// justo ENCIMA de la trama (debajo de los adornos de esquina y bordes),
// para que la trama quede apagada detrás del texto de los formularios.
const VELO = "linear-gradient(rgba(var(--base-rgb), 0.74), rgba(var(--base-rgb), 0.74))";
function velar(capas) {
  const i = capas.findIndex((c) => c.rep === "repeat");
  if (i < 0) return capas;
  return [...capas.slice(0, i), capa(VELO), ...capas.slice(i)];
}

// PUENTE: un adorno montado sobre el borde de arriba de la barra de
// filtros (que va pegada a la cabecera): la cabecera dibuja la parte de
// arriba (`enCabecera` px) y la barra el resto, alineados por la derecha.
// La barra usa `d.barra` (sin el adorno de esquina de los paneles).
function puente(S, d) {
  const { img, ancho, alto, enCabecera, x = "right 18px" } = d.puente;
  const tam = `${ancho}px ${alto}px`;
  return `
${en(S, ".tz-header:has(+ .tz-admin-filterbar)")} { ${fondo([capa(img, `${x} bottom ${enCabecera - alto}px`, tam), ...d.cabecera])} }
${en(S, ".tz-header + .tz-admin-filterbar")} { ${fondo([capa(img, `${x} top ${-enCabecera}px`, tam), ...(d.barra || d.panel)])} border-top-color: transparent !important; }`;
}

// Tarjetas SIN objetos temáticos (zapatillas, cupcakes, anillos…): las
// de producto, el saldo del cliente en la tienda, las de "Mis ventas" y
// las del gestor de usuarios. Conservan el material (madera, jean,
// terciopelo…) pero sin los dibujos sueltos de las esquinas.
const SIN_OBJETOS = (S) =>
  [".tz-card", ".tz-receipt", ".tz-history-row", ".tz-filtrobar-saldo .tz-stat-chip"].map((c) => en(S, c)).join(", ");
const esObjeto = (c) => c.img.startsWith('url("data:image/svg') && (c.rep || "no-repeat") === "no-repeat";
const sinObjetos = (capas) => {
  const quedan = capas.filter((c) => !esObjeto(c));
  return quedan.length ? quedan : capas;
};

// BORDE: la PRIMERA capa de la cabecera es una franja repeat-x pegada
// abajo (bolas, jugo, lápices, cerco…). Cuando la barra de filtros va
// pegada debajo, esa franja queda MONTADA sobre su borde: la cabecera
// muestra los primeros `enCabecera` px y la barra el resto, sin tapar
// "Localidad" / "Sucursal". Sin barra debajo se ve entera.
function borde(S, d) {
  const { enCabecera, rellenoCabecera, rellenoBarra } = d.borde;
  const franja = d.cabecera[0];
  const alto = parseFloat(franja.size.split(" ")[1]);
  const pos = d.cabecera.map((c, i) => (i === 0 ? `left 0 bottom ${enCabecera - alto}px` : c.pos || "0 0")).join(", ");
  return `
${en(S, ".tz-header:has(+ .tz-admin-filterbar)")} { background-position: ${pos} !important; ${rellenoCabecera ? `padding-bottom: ${rellenoCabecera}px !important;` : ""} }
${en(S, ".tz-header + .tz-admin-filterbar")} {
  ${fondo([capa(franja.img, `left 0 top ${-enCabecera}px`, franja.size, "repeat-x"), ...(d.barra || d.panel)])}
  border-top-color: transparent !important; padding-top: ${rellenoBarra || alto - enCabecera + 10}px !important;
}`;
}

// La barra de filtros pegada a la cabecera, con fondo propio (lápices,
// ropa, pasto con cerco…) en vez del de los paneles.
const BARRA = (S, sub = "") => en(S, `.tz-header + .tz-admin-filterbar${sub}`);
const barraPropia = (S, capas, estilo = "") =>
  `${BARRA(S)} { ${fondo(capas)} border-top-color: transparent !important; ${estilo} }`;
// MONTADO: una franja en PRIMERA CAPA que cruza la unión cabecera/barra
// (`arriba` px sobre la cabecera, el resto sobre la barra) en una sola
// pieza — sin costura ni recortes. Va en ::before de la barra (que la
// app no usa) y no tapa los textos (la barra deja su padding arriba).
const montado = (S, { img, tam, arriba, alto }) => `
${BARRA(S)} { position: relative; overflow: visible !important; }
${BARRA(S, "::before")} { content: ""; position: absolute; left: 0; right: 0; top: ${-arriba}px; height: ${alto}px; background: ${img} left 0 top 0 / ${tam} repeat-x; pointer-events: none; z-index: 2; }`;

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
${SIN_OBJETOS(S)} { ${fondo(sinObjetos(d.panel))} }
${en(S, ".tz-modal")} { ${fondo(velar(d.modal || d.panel))} ${d.modalEstilo || d.panelEstilo || ""} }
${en(S, ".tz-table-wrap")} { background: rgba(var(--base-rgb), 0.8) !important; backdrop-filter: blur(3px); box-shadow: 0 8px 22px rgba(0,0,0,0.28); }
${en(S, ".tz-modal h2")} { ${d.tituloEstilo || ""} }
${PESTANAS(S)} { ${fondo(d.pestana)} ${d.pestanaEstilo || ""} }
${ACTIVAS(S)} { ${fondo(d.activa)} ${d.activaEstilo || ""} }
${CAMPOS(S)} { ${d.campoEstilo || ""} }
${d.puente ? puente(S, d) : ""}
${d.borde ? borde(S, d) : ""}
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
    // Paneles lisos (sin nubes) para que el texto se lea limpio.
    panel: [capa(CEL_SD, "right 4px top 4px", "14px 14px"), capa(CEL_ID, "right 4px bottom 4px", "14px 14px"), capa(CEL_II, "left 4px bottom 4px", "14px 14px"), capa(LACA_OSCURA)],
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
// Glaseado que chorrea (repeat-x): empieza y termina a la misma altura
// (y = 8) para que la unión entre repeticiones no se note; el contorno
// rosa va solo por el borde del chorreado.
const GLASEADO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='90' height='22'><path d='M0 0 H90 V8 C86 8 85 18 79 18 C73 18 74 9 67 9 C61 9 62 15 55 15 C48 15 49 7 41 7 C34 7 35 20 27 20 C20 20 21 8 13 8 C8 8 5 8 0 8 Z' fill='#f9a8d4'/><path d='M90 8 C86 8 85 18 79 18 C73 18 74 9 67 9 C61 9 62 15 55 15 C48 15 49 7 41 7 C34 7 35 20 27 20 C20 20 21 8 13 8 C8 8 5 8 0 8' fill='none' stroke='#ec4899' stroke-width='1'/><g fill='#fff' opacity='.7'><ellipse cx='27' cy='15' rx='1.5' ry='2.5'/><ellipse cx='79' cy='13' rx='1.4' ry='2.2'/></g></svg>`
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
    // Sobre el glaseado rosa la etiqueta "En línea" va en una pastilla
    // blanca sólida, con verde vivo, para que se lea de lejos.
    extra: (S) => `
${en(S, ".tz-header .tz-conn-indicator")} { background: #ffffff !important; box-shadow: 0 2px 8px rgba(190,24,93,0.22); }
${en(S, ".tz-header .tz-conn-online")} { color: #15803d !important; border-color: #4ade80 !important; }
${en(S, ".tz-header .tz-conn-online .tz-conn-dot")} { background: #22c55e !important; box-shadow: 0 0 6px rgba(34,197,94,0.9) !important; }
${en(S, ".tz-header .tz-conn-offline")} { color: #b91c1c !important; border-color: #f87171 !important; }
${en(S, ".tz-header .tz-subtitle")} { color: #9d174d !important; text-shadow: none !important; background: rgba(255,255,255,0.85); padding: 2px 10px; border-radius: 999px; }`,
  });

// =====================================================================
// CAFETERÍA — "Cafetal" (el campo: cielo, colinas sembradas, cafetos
// con cerezas, neblina y hojas que caen; paneles de madera de tronco)
// =====================================================================
// Hoja de cafeto: nace en (x, y) y apunta al ángulo `ang` (largo l).
const hojaCafe = (x, y, l, w, ang, fill, nervio = "#1b4d1e") =>
  `<g transform='translate(${x} ${y}) rotate(${ang})'><path d='M0 0 Q${l * 0.35} ${-w} ${l} 0 Q${l * 0.35} ${w} 0 0 Z' fill='${fill}'/><path d='M1 0 Q${l * 0.5} ${-w * 0.12} ${l - 1} 0' stroke='${nervio}' stroke-width='0.8' fill='none'/></g>`;
const cereza = (x, y, r, c) =>
  `<circle cx='${x}' cy='${y}' r='${r}' fill='${c}' stroke='rgba(60,0,0,0.35)' stroke-width='0.6'/><circle cx='${x - r * 0.35}' cy='${y - r * 0.35}' r='${r * 0.3}' fill='rgba(255,255,255,0.55)'/>`;

const HOJA_CAIDA = (fill, nervio) =>
  svg(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 44 20'>${hojaCafe(2, 10, 40, 9, 0, fill, nervio)}</svg>`);
const HOJA_VERDE = HOJA_CAIDA("#2f7d32", "#1b4d1e");
const HOJA_CLARA = HOJA_CAIDA("#6aa84f", "#2f5d22");
const HOJA_SECA = HOJA_CAIDA("#c08a2e", "#7a4f12");

const CEREZAS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 32'><path d='M18 1 V11' stroke='#5a3a1f' stroke-width='1.6'/>${hojaCafe(18, 7, 18, 6, -160, "#2f7d32")}${hojaCafe(18, 7, 17, 6, -20, "#3a8f3a")}${cereza(12, 16, 5, "#c1121f")}${cereza(20, 15, 5.2, "#d62828")}${cereza(27, 18, 4.6, "#9d0208")}${cereza(16, 24, 4.8, "#e85d04")}${cereza(24, 25, 4.5, "#c1121f")}</svg>`
);

// Mata de café entera (sale de abajo y se mece en la escena).
const MATA_CAFE = (() => {
  let s = `<path d='M45 180 Q43 120 46 60 Q47 30 45 6' stroke='#5a3a1f' stroke-width='3.5' fill='none'/>`;
  [[150, 1], [118, -1], [86, 1], [56, -1], [30, 1]].forEach(([y, d], i) => {
    const t = 1 - i * 0.12;
    s += `<path d='M45 ${y} Q${45 + d * 15} ${y - 6} ${45 + d * 34 * t} ${y - 12}' stroke='#5a3a1f' stroke-width='2' fill='none'/>`;
    s += hojaCafe(45 + d * 6 * t, y - 2, 26 * t, 8, d > 0 ? -70 : -110, "#2f7d32");
    s += hojaCafe(45 + d * 14 * t, y - 5, 28 * t, 8.5, d > 0 ? -35 : -145, "#2a6e2c");
    s += hojaCafe(45 + d * 22 * t, y - 8, 28 * t, 8.5, d > 0 ? 30 : 150, "#3a8f3a");
    s += hojaCafe(45 + d * 30 * t, y - 11, 26 * t, 8, d > 0 ? -10 : -170, "#2f7d32");
    s += cereza(45 + d * 9 * t, y + 2, 3.4, "#c1121f") + cereza(45 + d * 15 * t, y + 3, 3.2, "#d62828") + cereza(45 + d * 21 * t, y, 3, i % 2 ? "#e85d04" : "#9d0208");
  });
  s += hojaCafe(45, 10, 24, 8, -55, "#3a8f3a") + hojaCafe(45, 10, 24, 8, -125, "#2f7d32") + hojaCafe(45, 8, 20, 7, -90, "#2a6e2c");
  return svg(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='-10 -14 110 194'>${s}</svg>`);
})();

// Fila de cafetos con cerezas (borde de la cabecera y del pie).
const arbustos = (suelo) =>
  svg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='46'><rect x='0' y='36' width='120' height='10' fill='${suelo}'/>` +
      [[0, 30, 16, "#245a1d"], [120, 30, 16, "#245a1d"], [34, 24, 18, "#2d6a24"], [58, 30, 15, "#1f4f19"], [80, 22, 19, "#2f7a2a"], [102, 30, 14, "#285f20"]]
        .map(([x, y, r, c]) => `<circle cx='${x}' cy='${y}' r='${r}' fill='${c}'/><circle cx='${x - r * 0.3}' cy='${y - r * 0.35}' r='${r * 0.45}' fill='rgba(140,210,110,0.18)'/>`)
        .join("") +
      [[30, 18, "#d62828"], [34, 22, "#c1121f"], [27, 23, "#e85d04"], [76, 15, "#d62828"], [81, 19, "#c1121f"], [85, 15, "#9d0208"], [100, 25, "#d62828"], [55, 26, "#c1121f"], [10, 26, "#d62828"]]
        .map(([x, y, c]) => `<circle cx='${x}' cy='${y}' r='2.6' fill='${c}'/>`)
        .join("") +
      `</svg>`
  );
const ARBUSTOS_CAMPO = arbustos("#13351a");
const ARBUSTOS_TIERRA = arbustos("#4a2c15");

const COLINAS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='90'><path d='M0 55 C80 30 150 30 200 45 S330 70 400 55 V90 H0 Z' fill='#8fb8a8' opacity='.85'/><path d='M0 75 C90 50 170 52 240 64 S350 82 400 75 V90 H0 Z' fill='#4f8f45'/><path d='M0 81 C90 58 170 60 240 71 S350 88 400 81' stroke='#3a7434' stroke-width='3' stroke-dasharray='4 5' fill='none'/><path d='M0 88 C90 66 170 68 240 79 S350 95 400 88' stroke='#356b30' stroke-width='3' stroke-dasharray='4 5' fill='none'/></svg>`
);
const NUBES_CIELO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='70'><g fill='#ffffff' opacity='.9'><ellipse cx='60' cy='34' rx='30' ry='10'/><ellipse cx='48' cy='28' rx='14' ry='10'/><ellipse cx='70' cy='24' rx='17' ry='13'/></g><g fill='#ffffff' opacity='.7'><ellipse cx='230' cy='48' rx='24' ry='7'/><ellipse cx='222' cy='43' rx='10' ry='7'/><ellipse cx='238' cy='40' rx='12' ry='9'/></g></svg>`
);
const NEBLINA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='60'><defs><radialGradient id='n'><stop offset='0' stop-color='#ffffff' stop-opacity='.6'/><stop offset='1' stop-color='#ffffff' stop-opacity='0'/></radialGradient></defs><ellipse cx='130' cy='34' rx='150' ry='20' fill='url(#n)'/><ellipse cx='430' cy='28' rx='170' ry='22' fill='url(#n)'/></svg>`
);
// Tierra con surcos y plantones: 10 filas (un solo repeat-x, así arriba
// de los cafetos el pie queda transparente y se ve el campo).
const SURCOS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='260'><rect width='60' height='260' fill='#4a2c15'/>` +
    Array.from({ length: 10 }, (_, i) => {
      const y = i * 26;
      return `<path d='M0 ${y + 9} H60' stroke='#5f3a1d' stroke-width='8'/><path d='M0 ${y + 21} H60' stroke='#331d0d' stroke-width='6'/><g fill='#5fa64a'><path d='M${15 + (i % 2) * 15} ${y + 6} q-5 -4 -7 0 q4 2 7 0z'/><path d='M${15 + (i % 2) * 15} ${y + 6} q5 -4 7 0 q-4 2 -7 0z'/><path d='M${45 + (i % 2) * 15 - (i % 2) * 60} ${y + 6} q-5 -4 -7 0 q4 2 7 0z'/><path d='M${45 + (i % 2) * 15 - (i % 2) * 60} ${y + 6} q5 -4 7 0 q-4 2 -7 0z'/></g>`;
    }).join("") +
    `</svg>`
);
const HOJAS_TRAMA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='110' height='110'>${hojaCafe(10, 20, 26, 8, -25, "rgba(120,190,100,0.08)", "rgba(0,0,0,0)")}${hojaCafe(62, 70, 24, 7, 150, "rgba(120,190,100,0.07)", "rgba(0,0,0,0)")}${hojaCafe(70, 14, 20, 6, 60, "rgba(120,190,100,0.06)", "rgba(0,0,0,0)")}<circle cx='30' cy='86' r='3' fill='rgba(214,40,40,0.14)'/><circle cx='36' cy='88' r='3' fill='rgba(214,40,40,0.12)'/></svg>`
);
const CIELO = "linear-gradient(180deg, #3b7db6 0%, #6ea9d4 35%, #b9dbe8 68%, #e3efe4 100%)";
const SOL = "radial-gradient(circle at 86% 16%, rgba(255,250,225,0.95) 0 20px, rgba(255,236,170,0.55) 32px, rgba(255,236,170,0) 150px)";
const CAMPO = "linear-gradient(180deg, #13351a 0%, #0e2913 45%, #091b0c 100%)";
// Madera del tronco (como la mesa de la foto): anillos y brillo.
const ANILLOS = "repeating-radial-gradient(ellipse 160% 110% at 12% 135%, rgba(0,0,0,0) 0 9px, rgba(40,20,8,0.3) 9px 10px, rgba(0,0,0,0) 10px 15px, rgba(255,210,160,0.07) 15px 16px)";
const TRONCO = "linear-gradient(170deg, #6e4424 0%, #57341b 55%, #462914 100%)";
const BARNIZ = "linear-gradient(180deg, rgba(255,235,200,0.16), transparent 42%)";

const cafe = (S) =>
  construir(S, {
    // En la app real el campo lo dibuja la ESCENA (fija, detrás de
    // todo); este fondo queda para la vista previa del Perfil.
    raiz: [trama(HOJAS_TRAMA, "110px 110px"), capa(CAMPO)],
    // Cabecera = el paisaje: cielo con sol, nubes que pasan, colinas
    // sembradas, neblina que se desliza y la fila de cafetos.
    cabecera: [
      capa(ARBUSTOS_CAMPO, "left 0 bottom 0", "120px 46px", "repeat-x"),
      capa(NEBLINA, "left 0 bottom 40px", "600px 60px", "repeat-x"),
      capa(COLINAS, "left 0 bottom 30px", "400px 90px", "repeat-x"),
      capa(NUBES_CIELO, "left 0 top 8px", "320px 70px", "repeat-x"),
      capa(SOL),
      capa(CIELO),
    ],
    cabeceraEstilo: "padding-bottom: 52px !important; border-bottom: none !important; animation: tz-caf-cielo 80s linear infinite;",
    // Pie = tierra sembrada con surcos y plantones, cafetos arriba.
    pie: [
      capa(CEREZAS, "left 4% bottom 10px", "36px 32px"),
      capa(CEREZAS, "right 4% bottom 10px", "36px 32px"),
      capa(ARBUSTOS_TIERRA, "left 0 top 0", "120px 46px", "repeat-x"),
      capa(SURCOS, "left 0 top 40px", "60px 260px", "repeat-x"),
    ],
    pieEstilo: "border-top: none !important; padding-top: 56px !important;",
    boton: [capa(BARNIZ), capa("linear-gradient(180deg, #b9824a, #8a5a2b)")],
    botonEstilo: "border: 1px solid #4a2a14 !important; color: #fff6e6 !important; box-shadow: 0 3px 8px rgba(0,0,0,0.4) !important; text-shadow: 0 1px 1px rgba(0,0,0,0.55);",
    botonPieEstilo: "border-radius: 10px !important; border: 1px solid #4a2a14 !important; color: #fff6e6 !important; box-shadow: 0 4px 10px rgba(0,0,0,0.5) !important; text-shadow: 0 1px 1px rgba(0,0,0,0.55);",
    // Medidores, tarjetas, barra de filtros: madera de tronco barnizada
    // con un racimo de cerezas en la esquina (sin bordes repetidos).
    panel: [capa(CEREZAS, "right 6px top 6px", "26px 23px"), capa(BARNIZ), capa(ANILLOS), capa(TRONCO)],
    panelEstilo: "border: 1px solid #2e1a0b !important; box-shadow: inset 0 1px 0 rgba(255,225,180,0.18), 0 8px 18px rgba(0,0,0,0.45) !important;",
    modal: [
      capa(CEREZAS, "left 10px bottom 10px", "32px 28px"),
      capa(CEREZAS, "right 10px bottom 10px", "32px 28px"),
      trama(HOJAS_TRAMA, "110px 110px"),
      capa("linear-gradient(170deg, #17401f 0%, #0b2410 100%)"),
    ],
    modalEstilo: "border: 1px solid #8a5a2b !important; box-shadow: inset 0 0 0 3px rgba(11,36,16,0.9), inset 0 0 0 4px rgba(185,130,74,0.45), 0 20px 60px rgba(0,0,0,0.7) !important;",
    tituloEstilo: "color: #fff1d6 !important; border-bottom: 2px solid rgba(185,130,74,0.55); padding-bottom: 8px;",
    pestana: [capa(BARNIZ), capa("linear-gradient(180deg, #5a361b, #43270f)")],
    pestanaEstilo: "border: 1px solid #8a5a2b !important; color: #f3dcbc !important;",
    activa: [capa("linear-gradient(180deg, #e5383b, #a4161a)")],
    activaEstilo: "border-color: #660708 !important; color: #ffffff !important; box-shadow: 0 0 14px rgba(229,56,59,0.45) !important; text-shadow: 0 1px 2px rgba(0,0,0,0.4);",
    campoEstilo: "background: #0a1c0d !important; border: 1px solid #7a4f2a !important;",
    extra: (S) => `
@keyframes tz-caf-cielo {
  from { background-position: left 0 bottom 0, left 0 bottom 40px, left 0 bottom 30px, left 0 top 8px, 0 0, 0 0; }
  to { background-position: left 0 bottom 0, left 600px bottom 40px, left 0 bottom 30px, left 320px top 8px, 0 0, 0 0; }
}
${en(S, ".tz-header .tz-subtitle")} { color: #1b4d1e !important; text-shadow: none !important; background: rgba(255,255,255,0.82); padding: 2px 10px; border-radius: 999px; }
${en(S, ".tz-header .tz-conn-indicator")} { background: rgba(11,36,16,0.9) !important; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
${en(S, ".tz-logo")} { filter: drop-shadow(0 4px 10px rgba(20,40,20,0.45)) !important; }
${en(S, ".tz-stat-chip")}, ${en(S, ".tz-method-total")} { padding-right: 32px !important; }
/* ---- Escena (solo en la app real; TemaNegocio la dibuja) ---- */
${en(S, ".tz-escena")} { position: fixed; inset: 0; z-index: -1; pointer-events: none; overflow: hidden; }
${en(S, ".tz-esc-campo")} { position: absolute; inset: 0; background: ${HOJAS_TRAMA} 0 0 / 110px 110px repeat, ${CAMPO}; }
${en(S, ".tz-esc-sol")} {
  position: absolute; top: -30vh; right: -20vw; width: 90vw; height: 90vh;
  background: radial-gradient(circle, rgba(255,236,170,0.16), rgba(255,236,170,0) 62%);
  animation: tz-caf-sol 9s ease-in-out infinite alternate;
}
${en(S, ".tz-esc-rayos")} {
  position: absolute; inset: -10% -20%;
  background: linear-gradient(118deg, transparent 0 38%, rgba(255,240,190,0.07) 43%, transparent 50%), linear-gradient(126deg, transparent 0 56%, rgba(255,240,190,0.05) 60%, transparent 66%);
  animation: tz-caf-rayos 14s ease-in-out infinite alternate;
}
${en(S, ".tz-esc-niebla")} {
  position: absolute; left: 0; top: var(--y); width: 80vw; height: 180px;
  background: radial-gradient(ellipse at center, rgba(225,240,228,0.13), rgba(225,240,228,0) 70%);
  opacity: var(--op, 1);
  animation: tz-caf-niebla var(--dur) linear var(--delay) infinite;
  will-change: transform;
}
${en(S, ".tz-esc-hoja")} {
  position: absolute; top: -40px; left: var(--x);
  width: var(--tam); height: calc(var(--tam) * 0.46);
  background: var(--img) center / contain no-repeat;
  animation: tz-caf-caer var(--dur) linear var(--delay) infinite;
  will-change: transform;
}
${en(S, ".tz-esc-mata")} {
  position: absolute; bottom: -8px; width: var(--tam); height: calc(var(--tam) * 2);
  background: ${MATA_CAFE} center bottom / contain no-repeat;
  transform-origin: 50% 100%;
  animation: tz-caf-mecer var(--dur) ease-in-out var(--delay) infinite alternate;
  opacity: 0.9;
}
${en(S, ".tz-esc-mata-izq")} { left: var(--x); }
${en(S, ".tz-esc-mata-der")} { right: var(--x); }
@keyframes tz-caf-sol { from { opacity: 0.7; transform: scale(0.96); } to { opacity: 1; transform: scale(1.04); } }
@keyframes tz-caf-rayos { from { transform: translateX(-2%) skewX(-2deg); opacity: 0.6; } to { transform: translateX(2%) skewX(2deg); opacity: 1; } }
@keyframes tz-caf-niebla { from { transform: translateX(-85vw); } to { transform: translateX(110vw); } }
@keyframes tz-caf-caer {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
  6% { opacity: 0.9; }
  25% { transform: translate(46px, 28vh) rotate(95deg); }
  50% { transform: translate(-18px, 56vh) rotate(200deg); }
  75% { transform: translate(34px, 84vh) rotate(290deg); }
  94% { opacity: 0.85; }
  100% { transform: translate(-8px, 112vh) rotate(380deg); opacity: 0; }
}
@keyframes tz-caf-mecer { from { transform: rotate(-3.5deg); } to { transform: rotate(3.5deg); } }`,
  });

// Elementos de la escena del Cafetal (TemaNegocio los dibuja como <div>).
const ESCENA_CAFETAL = [
  { clase: "tz-esc-campo" },
  { clase: "tz-esc-sol" },
  { clase: "tz-esc-rayos" },
  { clase: "tz-esc-niebla", estilo: { "--y": "24%", "--dur": "70s", "--delay": "-12s" } },
  { clase: "tz-esc-niebla", estilo: { "--y": "56%", "--dur": "95s", "--delay": "-55s", "--op": 0.8 } },
  { clase: "tz-esc-niebla", estilo: { "--y": "80%", "--dur": "82s", "--delay": "-30s", "--op": 0.9 } },
  ...[
    ["5%", "30px", "19s", "-3s", HOJA_VERDE],
    ["17%", "22px", "23s", "-14s", HOJA_SECA],
    ["31%", "26px", "21s", "-8s", HOJA_CLARA],
    ["46%", "20px", "26s", "-19s", HOJA_VERDE],
    ["61%", "28px", "20s", "-5s", HOJA_SECA],
    ["74%", "22px", "24s", "-16s", HOJA_CLARA],
    ["87%", "30px", "22s", "-10s", HOJA_VERDE],
    ["95%", "20px", "27s", "-22s", HOJA_SECA],
  ].map(([x, tam, dur, delay, img]) => ({ clase: "tz-esc-hoja", estilo: { "--x": x, "--tam": tam, "--dur": dur, "--delay": delay, "--img": img } })),
  { clase: "tz-esc-mata tz-esc-mata-izq", estilo: { "--x": "-14px", "--tam": "104px", "--dur": "5s", "--delay": "0s" } },
  { clase: "tz-esc-mata tz-esc-mata-izq", estilo: { "--x": "52px", "--tam": "72px", "--dur": "4.2s", "--delay": "-1.4s" } },
  { clase: "tz-esc-mata tz-esc-mata-der", estilo: { "--x": "-12px", "--tam": "98px", "--dur": "5.4s", "--delay": "-2.2s" } },
  { clase: "tz-esc-mata tz-esc-mata-der", estilo: { "--x": "56px", "--tam": "66px", "--dur": "4.6s", "--delay": "-0.8s" } },
];

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
// Frutos rojos y morados: fresa, frambuesa, arándanos, uvas, moras y
// cerezas (se intercalan con las rodajas de la cabecera).
const fresa = (x, y, k = 1) =>
  `<g transform='translate(${x} ${y}) scale(${k})'><path d='M0 -7 C9 -8 11 2 0 13 C-11 2 -9 -8 0 -7 Z' fill='#e11d48'/><path d='M-3 -6 C-1 -2 -6 4 -2 9' stroke='rgba(255,255,255,0.25)' stroke-width='1.6' fill='none'/><g fill='#fde68a'><ellipse cx='-3' cy='-1' rx='.6' ry='1'/><ellipse cx='3' cy='0' rx='.6' ry='1'/><ellipse cx='0' cy='4' rx='.6' ry='1'/><ellipse cx='-4' cy='4' rx='.6' ry='1'/><ellipse cx='4' cy='5' rx='.6' ry='1'/><ellipse cx='0' cy='8' rx='.6' ry='1'/></g><path d='M0 -7 L-6 -10 L-2 -7.5 L-4 -12 L0 -8.5 L4 -12 L2 -7.5 L6 -10 Z' fill='#16a34a'/></g>`;
const uvas = (x, y, k = 1) =>
  `<g transform='translate(${x} ${y}) scale(${k})'><path d='M0 -12 Q2 -16 6 -17' stroke='#65a30d' stroke-width='1.6' fill='none'/><path d='M1 -13 Q9 -18 13 -11 Q6 -9 1 -13Z' fill='#4d7c0f'/>${[[-5, -8], [0, -9], [5, -8], [-7, -3], [-2, -3], [3, -3], [8, -3], [-5, 2], [0, 2], [5, 2], [-2, 7], [3, 7], [0, 12]].map(([a, b]) => `<circle cx='${a}' cy='${b}' r='3.4' fill='#7e22ce'/><circle cx='${a - 1.1}' cy='${b - 1.1}' r='1' fill='rgba(255,255,255,0.45)'/>`).join("")}</g>`;
const frambuesa = (x, y, k = 1) =>
  `<g transform='translate(${x} ${y}) scale(${k})'>${[[-3, -4], [2, -4], [-5, 0], [0, 0], [5, 0], [-3, 4], [2, 4], [0, 8]].map(([a, b]) => `<circle cx='${a}' cy='${b}' r='2.8' fill='#be123c'/><circle cx='${a - 0.8}' cy='${b - 0.8}' r='.8' fill='rgba(255,255,255,0.4)'/>`).join("")}<path d='M-4 -7 L0 -5 L4 -7 L2 -9 L0 -7 L-2 -9 Z' fill='#16a34a'/></g>`;
const arandanos = (x, y, k = 1) =>
  `<g transform='translate(${x} ${y}) scale(${k})'>${[[-5, 2, 4.6], [4, 0, 5], [0, -6, 4.2]].map(([a, b, r]) => `<circle cx='${a}' cy='${b}' r='${r}' fill='#3730a3'/><circle cx='${a - r * 0.3}' cy='${b - r * 0.35}' r='${r * 0.35}' fill='rgba(199,210,254,0.45)'/><circle cx='${a + r * 0.25}' cy='${b + r * 0.2}' r='1' fill='#1e1b4b'/>`).join("")}</g>`;
const moras = (x, y, k = 1) =>
  `<g transform='translate(${x} ${y}) scale(${k})'>${[[-2, -5], [2, -5], [-4, -1], [0, -1], [4, -1], [-2, 3], [2, 3], [0, 7]].map(([a, b]) => `<circle cx='${a}' cy='${b}' r='2.5' fill='#3b0764'/><circle cx='${a - 0.7}' cy='${b - 0.7}' r='.7' fill='rgba(233,213,255,0.5)'/>`).join("")}</g>`;
const cerezasRojas = (x, y, k = 1) =>
  `<g transform='translate(${x} ${y}) scale(${k})'><path d='M-4 2 Q-2 -10 4 -13 M5 4 Q4 -6 4 -13' stroke='#65a30d' stroke-width='1.4' fill='none'/><circle cx='-4' cy='5' r='4.6' fill='#dc2626'/><circle cx='5' cy='7' r='4.6' fill='#b91c1c'/><circle cx='-5.5' cy='3.5' r='1.3' fill='rgba(255,255,255,0.5)'/><circle cx='3.5' cy='5.5' r='1.3' fill='rgba(255,255,255,0.5)'/></g>`;
const BAYAS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='150' height='70'>${fresa(18, 50, 1.2)}${uvas(62, 22, 1)}${arandanos(104, 54, 1)}${frambuesa(138, 30, 1.1)}${moras(42, 14, 1)}${cerezasRojas(88, 54, 0.9)}</svg>`
);
const BAYAS_TENUES = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><g opacity='.22'>${fresa(30, 40, 1.3)}${uvas(120, 60, 1.1)}${arandanos(60, 130, 1.1)}${frambuesa(150, 150, 1.2)}${cerezasRojas(100, 120, 1)}${moras(160, 20, 1)}</g></svg>`
);
const FRUTOS_ESQUINA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 34 30'>${uvas(22, 15, 0.7)}${fresa(10, 16, 0.85)}${arandanos(26, 24, 0.55)}</svg>`
);
const VIDRIO_TROPICAL = "linear-gradient(170deg, rgba(22,101,52,0.55) 0%, rgba(6,40,22,0.88) 100%)";

const tropical = (S) =>
  construir(S, {
    raiz: [capa(HOJA_SI, "left -40px top 120px", "220px 220px"), capa(HOJA_ID, "right -40px bottom -20px", "240px 240px"), trama(BAYAS_TENUES, "180px 180px"), capa("radial-gradient(ellipse 900px 400px at 50% -10%, rgba(163,230,53,0.16), transparent 60%)"), capa("linear-gradient(180deg, #06200f 0%, #04140c 100%)")],
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
    pie: [capa(JUGO, "left 0 top 0", "120px 18px", "repeat-x"), capa(HOJA_SI, "left -20px bottom -30px", "130px 130px"), capa(HOJA_ID, "right -20px bottom -30px", "130px 130px"), trama(BAYAS_TENUES, "180px 180px"), capa("linear-gradient(180deg, #14532d, #06200f)")],
    pieEstilo: "border-top: none !important; padding-top: 30px !important;",
    boton: [capa("linear-gradient(180deg, rgba(255,255,255,0.3), transparent 55%)"), capa("linear-gradient(180deg, #bef264, #84cc16)")],
    botonEstilo: "border: 1px solid #3f6212 !important; color: #14290a !important; box-shadow: 0 3px 8px rgba(0,0,0,0.35) !important; border-radius: 999px !important;",
    botonPieEstilo: "border-radius: 999px !important; border: 1px solid #3f6212 !important; color: #14290a !important; box-shadow: 0 4px 10px rgba(0,0,0,0.4) !important;",
    panel: [capa(FRUTOS_ESQUINA, "right 6px top 6px", "30px 26px"), capa(VIDRIO_TROPICAL)],
    panelEstilo: "border: 1px solid rgba(190,242,100,0.4) !important; box-shadow: 0 8px 18px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12) !important; backdrop-filter: blur(3px);",
    modal: [capa(HOJA_SI, "left -30px top -30px", "110px 110px"), capa(HOJA_ID, "right -30px bottom -30px", "110px 110px"), capa(FRUTOS_ESQUINA, "left 12px bottom 12px", "34px 30px"), capa("linear-gradient(170deg, #0f3d22 0%, #06200f 100%)")],
    modalEstilo: "border: 1px solid rgba(190,242,100,0.5) !important; box-shadow: 0 20px 60px rgba(0,0,0,0.6) !important;",
    tituloEstilo: "color: #ecfccb !important; border-bottom: 3px solid #fb923c; padding-bottom: 8px;",
    pestana: [capa("linear-gradient(180deg, #14532d, #0d3b20)")],
    pestanaEstilo: "border: 1px solid rgba(190,242,100,0.35) !important; color: #d9f99d !important;",
    activa: [capa("linear-gradient(180deg, #fde047 0%, #fb923c 100%)")],
    activaEstilo: "border-color: #c2410c !important; color: #3b1a03 !important; box-shadow: 0 0 16px rgba(251,146,60,0.5) !important;",
    campoEstilo: "background: #04140c !important; border: 1px solid rgba(190,242,100,0.35) !important;",
    // La ola de jugo queda MONTADA sobre el borde de arriba de la barra de
    // filtros (pegada a la cabecera): la cabecera muestra la franja y la
    // barra el chorreado, sin tapar "Localidad" / "Sucursal". La barra va
    // sin frutas adentro.
    extra: (S) => `
${en(S, ".tz-header:has(+ .tz-admin-filterbar)")} { background-position: left 0 bottom -9px, 0 0, 0 0, 0 0, 0 0 !important; padding-bottom: 26px !important; }
${en(S, ".tz-header + .tz-admin-filterbar")} {
  ${fondo([capa(JUGO, "left 0 top -9px", "120px 18px", "repeat-x"), capa(VIDRIO_TROPICAL)])}
  border-top-color: transparent !important; padding-top: 20px !important;
}`,
  });

// =====================================================================
// HELADERÍA — "Helado artesanal" (claro)
// =====================================================================
const BOLAS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='108' height='38'><g transform='translate(0 4)'><g stroke-width='1.2'><path d='M0 34 V14 A18 16 0 0 1 36 14 V22 C33 22 33 30 30 30 C27 30 28 24 24 24 C20 24 21 32 17 32 C13 32 14 25 10 25 C6 25 7 34 0 34 Z' fill='#f9a8d4' stroke='#ec4899'/><path d='M36 34 V14 A18 16 0 0 1 72 14 V24 C69 24 69 31 66 31 C63 31 64 25 60 25 C56 25 57 33 53 33 C49 33 50 26 46 26 C42 26 43 34 36 34 Z' fill='#a7f3d0' stroke='#10b981'/><path d='M72 34 V14 A18 16 0 0 1 108 14 V22 C105 22 105 30 102 30 C99 30 100 25 96 25 C92 25 93 32 89 32 C85 32 86 26 82 26 C78 26 79 34 72 34 Z' fill='#fef3c7' stroke='#f59e0b'/></g><g fill='#fff' opacity='.6'><ellipse cx='12' cy='8' rx='5' ry='2.5'/><ellipse cx='48' cy='8' rx='5' ry='2.5'/><ellipse cx='84' cy='8' rx='5' ry='2.5'/></g></g></svg>`
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
    cabecera: [capa(BOLAS, "left 0 bottom 0", "108px 38px", "repeat-x"), ...CONFETI, capa("linear-gradient(180deg, #d1fae5 0%, #a7f3d0 100%)")],
    cabeceraEstilo: "padding-bottom: 50px !important; border-bottom: none !important;",
    pie: [capa(BOLAS, "left 0 top 0", "108px 38px", "repeat-x"), ...BARQUILLO],
    pieEstilo: "border-top: none !important; padding-top: 48px !important;",
    // Barquillo con un velo crema encima (la textura se ve, pero suave) y
    // texto café oscuro grueso con borde claro: se lee bien.
    boton: [capa("linear-gradient(rgba(255,247,232,0.6), rgba(255,247,232,0.6))"), ...BARQUILLO],
    botonEstilo: "border: 1px solid #b45309 !important; color: #3b1a03 !important; font-weight: 800 !important; text-shadow: 0 1px 0 rgba(255,255,255,0.8), 0 0 4px rgba(255,247,232,0.9) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), 0 3px 8px rgba(146,64,14,0.2) !important; border-radius: 999px !important;",
    // En el pie (sobre el barquillo) los botones van lisos, crema y rosa,
    // para que el texto se lea.
    botonPie: [capa("linear-gradient(180deg, #ffffff 0%, #fde7f1 100%)")],
    botonPieEstilo: "border-radius: 999px !important; border: 1.5px solid #f472b6 !important; color: #9d174d !important; font-weight: 800; box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 10px rgba(146,64,14,0.3) !important;",
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
    // La fila de bolas queda MONTADA sobre el borde de arriba de la barra
    // de filtros (que va pegada a la cabecera): la cabecera muestra la
    // parte de arriba de cada bola y la barra el chorreado, sin cortes y
    // sin tapar "Localidad" / "Sucursal". Sin barra debajo (cajero,
    // tienda), la cabecera muestra la fila entera.
    extra: (S) => `${en(S, ".tz-stat-chip")}, ${en(S, ".tz-method-total")} { padding-top: 14px !important; }
${en(S, ".tz-header:has(+ .tz-admin-filterbar)")} { background-position: left 0 bottom -12px, 0 0, 22px 22px, 0 0 !important; padding-bottom: 40px !important; }
${en(S, ".tz-header + .tz-admin-filterbar")} {
  ${fondo([capa(BOLAS, "left 0 top -26px", "108px 38px", "repeat-x"), capa(CONO, "right 10px bottom 8px", "18px 24px"), capa("linear-gradient(180deg, #ffffff, #fbfffd)")])}
  border-top: none !important; padding-top: 24px !important;
}`,
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

// Filetes en mosaico para el fondo: lomo con marmoleo, T-bone con su
// hueso y bife con capa de grasa (tenues, para que no compitan).
const marmoleo = `<g stroke='#f1d9c6' stroke-width='0.9' fill='none' opacity='.55' stroke-linejoin='round'><path d='M-15 -6 l4 2 l3 -1 l5 3 l4 -1'/><path d='M-10 6 l3 -2 l4 2 l3 -3 l3 1'/><path d='M2 -11 l2 3 l4 0 l2 3'/><path d='M9 3 l3 3 l3 -1'/><path d='M-4 -2 l3 1 l2 -2'/></g><g fill='#f1d9c6' opacity='.5'><ellipse cx='-6' cy='-8' rx='1.4' ry='.8'/><ellipse cx='12' cy='-4' rx='1.2' ry='.7'/><ellipse cx='-12' cy='10' rx='1.3' ry='.8'/><ellipse cx='4' cy='10' rx='1' ry='.6'/></g>`;
const lomo = (x, y, r, k = 1) =>
  `<g transform='translate(${x} ${y}) rotate(${r}) scale(${k})'><path d='M-24 0 C-24 -16 -8 -20 6 -18 C20 -16 26 -6 24 4 C22 16 8 20 -6 18 C-18 16 -24 10 -24 0 Z' fill='#f2e2cf'/><path d='M-20 0 C-20 -13 -7 -16 6 -14.5 C17 -13 21 -5 20 3 C18 13 7 16 -5 14.5 C-15 13 -20 8 -20 0 Z' fill='#a3171c'/><path d='M-14 -2 C-10 -10 4 -11 10 -6 C14 -2 10 6 2 7 C-8 8 -16 4 -14 -2 Z' fill='#bd2228'/>${marmoleo}</g>`;
// T-bone: el hueso en T separa el bife angosto (grande) del lomo (chico).
const tbone = (x, y, r, k = 1) =>
  `<g transform='translate(${x} ${y}) rotate(${r}) scale(${k})'><path d='M-26 -4 C-26 -18 -6 -22 10 -19 C24 -16 28 -4 26 8 C24 18 8 22 -8 20 C-22 18 -26 8 -26 -4 Z' fill='#f2e2cf'/><path d='M-22 -4 C-22 -15 -6 -18 9 -15.5 C21 -13 24 -3 22 7 C20 15 7 18 -7 16.5 C-19 15 -22 7 -22 -4 Z' fill='#a01b20'/><path d='M-8 -14 C-9 -2 -9 8 -6 16' stroke='#ece2d2' stroke-width='5' fill='none' stroke-linecap='round'/><path d='M-20 -9 C-12 -15 0 -17 10 -15' stroke='#ece2d2' stroke-width='4.5' fill='none' stroke-linecap='round'/><path d='M-8 -14 C-9 -2 -9 8 -6 16' stroke='#cdbfa8' stroke-width='1.2' fill='none'/><g transform='translate(8 2)'>${marmoleo}</g><path d='M-19 -2 l3 2 l3 -1 M-17 6 l3 -1' stroke='#f1d9c6' stroke-width='.8' fill='none' opacity='.5'/></g>`;
const bife = (x, y, r, k = 1) =>
  `<g transform='translate(${x} ${y}) rotate(${r}) scale(${k})'><path d='M-26 -10 Q0 -20 26 -10 Q30 6 18 14 Q0 20 -18 14 Q-30 6 -26 -10 Z' fill='#b3191f'/><path d='M-26 -10 Q0 -20 26 -10 L25 -5 Q0 -14 -25 -5 Z' fill='#f5e6d3'/>${marmoleo}</g>`;
const FILETES = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><g opacity='.38'>${lomo(66, 62, -18, 1.75)}${tbone(190, 168, 22, 1.8)}${bife(196, 50, 8, 1.6)}${lomo(66, 196, 34, 1.5)}</g></svg>`
);

const carnicero = (S) =>
  construir(S, {
    raiz: [trama(FILETES, "260px 260px"), capa("linear-gradient(180deg, rgba(20,12,10,0.94), rgba(14,8,7,0.97))"), trama(AZULEJOS, "44px 22px")],
    cabecera: [capa("linear-gradient(180deg, #b91c1c, #991b1b)", "left 0 bottom 0", "100% 10px"), capa("linear-gradient(180deg, #ffffff, #ffffff)", "left 0 bottom 10px", "100% 3px"), trama(AZULEJOS, "44px 22px")],
    cabeceraEstilo: "padding-bottom: 30px !important; border-bottom: none !important; box-shadow: 0 6px 16px rgba(0,0,0,0.45);",
    pie: [capa("linear-gradient(180deg, #b91c1c, #991b1b)", "left 0 top 0", "100% 10px"), trama(AZULEJOS, "44px 22px")],
    pieEstilo: "border-top: none !important; padding-top: 26px !important;",
    boton: [capa("linear-gradient(180deg, rgba(255,255,255,0.18), transparent 55%)"), capa("linear-gradient(180deg, #c62828, #991b1b)")],
    botonEstilo: "border: 1px solid #5f0f0f !important; color: #fff1e6 !important; box-shadow: 0 3px 8px rgba(0,0,0,0.35) !important; text-shadow: 0 1px 1px rgba(0,0,0,0.5);",
    botonPieEstilo: "border-radius: 10px !important; border: 1px solid #5f0f0f !important; color: #fff1e6 !important; box-shadow: 0 4px 10px rgba(0,0,0,0.4) !important; text-shadow: 0 1px 1px rgba(0,0,0,0.5);",
    panel: [capa(CUCHILLA, "right 6px top 8px", "26px 18px"), capa("linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.45))"), capa(BLOQUE, "0 0", "28px 28px", "repeat")],
    panelEstilo: "border: 1px solid #2a170c !important; box-shadow: inset 0 0 0 1px rgba(255,220,180,0.08), 0 8px 18px rgba(0,0,0,0.45) !important;",
    modal: [capa("linear-gradient(180deg, #b91c1c, #991b1b)", "left 0 top 0", "100% 8px"), trama(FILETES, "260px 260px"), capa("linear-gradient(170deg, #241310 0%, #160c0a 100%)")],
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
// Botellas: cerveza (ámbar y verde), whisky, licor claro y shots.
const cerveza = (x, vidrio, etiqueta) =>
  `<g transform='translate(${x} 0)'><path d='M1 38 V18 Q1 13 4.5 11 V4 H7.5 V11 Q11 13 11 18 V38 Z' fill='${vidrio}' stroke='rgba(0,0,0,0.35)' stroke-width='.6'/><rect x='4' y='1.6' width='4' height='2.6' rx='.6' fill='#fbbf24'/><rect x='1.6' y='22' width='8.8' height='8' rx='1' fill='${etiqueta}'/><rect x='1.6' y='25' width='8.8' height='1.6' fill='#b91c1c'/><path d='M3 17 V36' stroke='rgba(255,255,255,0.3)' stroke-width='1.2'/></g>`;
const whisky = (x) =>
  `<g transform='translate(${x} 0)'><path d='M0 38 V20 Q0 16 5 15 V9 H11 V15 Q16 16 16 20 V38 Z' fill='#d97706' fill-opacity='.85' stroke='#78350f' stroke-width='.8'/><rect x='5' y='5.5' width='6' height='3.6' rx='.8' fill='#1f2937'/><rect x='2' y='24' width='12' height='9' rx='1' fill='#111827' stroke='#e9c46a' stroke-width='.8'/><path d='M4 27 H12 M5 30 H11' stroke='#e9c46a' stroke-width='.7'/><path d='M2 19 V36' stroke='rgba(255,255,255,0.3)' stroke-width='1.2'/></g>`;
const licorClaro = (x) =>
  `<g transform='translate(${x} 0)'><path d='M0 38 V16 Q0 12 3 10 V3 H7 V10 Q10 12 10 16 V38 Z' fill='rgba(186,230,253,0.32)' stroke='rgba(255,255,255,0.6)' stroke-width='.7'/><rect x='2.8' y='1' width='4.4' height='2.6' rx='.6' fill='#e9c46a'/><rect x='1.2' y='22' width='7.6' height='9' rx='1' fill='#f5d58a'/><path d='M2 15 V36' stroke='rgba(255,255,255,0.45)' stroke-width='1'/></g>`;
const shot = (x, y, liquido) =>
  `<g transform='translate(${x} ${y})'><path d='M0 0 H10 L8.5 10 H1.5 Z' fill='rgba(255,255,255,0.18)' stroke='rgba(255,255,255,0.7)' stroke-width='.8'/><path d='M0.6 3.5 H9.4 L8.5 10 H1.5 Z' fill='${liquido}'/><path d='M1.5 9 H8.5' stroke='rgba(255,255,255,0.8)' stroke-width='1.6'/></g>`;
// Repisa de madera con la fila de botellas (repeat-x).
const REPISA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='46'>${cerveza(4, "#92400e", "#fef3c7")}${cerveza(20, "#15803d", "#fde68a")}${whisky(36)}${shot(58, 28, "#f59e0b")}${shot(70, 28, "#dc2626")}${licorClaro(86)}${cerveza(102, "#92400e", "#fef3c7")}<rect x='0' y='38' width='120' height='8' fill='#6b4423'/><rect x='0' y='38' width='120' height='1.5' fill='#a06a3c'/><rect x='0' y='44.5' width='120' height='1.5' fill='#3b2414'/></svg>`
);
const SHOTS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 26 18'><g transform='rotate(-10 6 10)'>${shot(1, 5, "#f59e0b")}</g><g transform='rotate(10 18 10)'>${shot(14, 5, "#dc2626")}</g><g fill='#fde68a'><circle cx='13' cy='2' r='1'/><circle cx='10' cy='4' r='.7'/><circle cx='16' cy='4' r='.7'/></g></svg>`
);
const BOTELLA_CERVEZA = svg(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 39'>${cerveza(0, "#92400e", "#fef3c7")}</svg>`);
const BOTELLAS_TENUES = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='150' height='120'><g opacity='.12'><g transform='translate(14 20) rotate(-12)'>${cerveza(0, "#d97706", "#fef3c7")}</g><g transform='translate(80 60) rotate(10)'>${whisky(0)}</g><g transform='translate(118 6) rotate(-6)'>${licorClaro(0)}</g><g transform='translate(40 84)'>${shot(0, 0, "#f59e0b")}${shot(12, 0, "#dc2626")}</g></g></svg>`
);
const DUELAS = "repeating-linear-gradient(90deg, #5e3b22 0 26px, #3b2414 26px 28px)";
const ARO = "linear-gradient(180deg, #4a4a4a 0%, #8a8a8a 45%, #3a3a3a 100%)";

const vinos = (S) =>
  construir(S, {
    raiz: [trama(BOTELLAS_TENUES, "150px 120px"), capa("radial-gradient(ellipse 900px 380px at 50% -10%, rgba(233,196,106,0.10), transparent 60%)"), trama(PIEDRA, "80px 48px"), capa("#120a0c")],
    cabecera: [capa(REPISA, "left 0 bottom 0", "156px 60px", "repeat-x"), capa("radial-gradient(ellipse 60% 70% at 50% 40%, rgba(122,20,44,0.45), transparent 70%)"), trama(PIEDRA, "80px 48px")],
    cabeceraEstilo: "padding-bottom: 68px !important; border-bottom: 3px solid #e9c46a !important; box-shadow: 0 6px 18px rgba(0,0,0,0.55);",
    pie: [capa(REPISA, "left 0 top 0", "156px 60px", "repeat-x"), trama(PIEDRA, "80px 48px")],
    pieEstilo: "border-top: 3px solid #e9c46a !important; padding-top: 68px !important;",
    boton: [capa("linear-gradient(180deg, rgba(255,255,255,0.16), transparent 55%)"), capa("linear-gradient(180deg, #7a1730, #561021)")],
    botonEstilo: "border: 1px solid #e9c46a !important; color: #f5d58a !important; box-shadow: 0 3px 8px rgba(0,0,0,0.5) !important;",
    botonPieEstilo: "border-radius: 10px !important; border: 1px solid #e9c46a !important; color: #f5d58a !important; box-shadow: 0 4px 10px rgba(0,0,0,0.5) !important;",
    // Barrica: duelas verticales con dos aros de metal.
    panel: [
      capa(SHOTS, "right 8px top 14px", "26px 18px"),
      capa(ARO, "left 0 top 6px", "100% 5px"),
      capa(ARO, "left 0 bottom 6px", "100% 5px"),
      capa("linear-gradient(90deg, rgba(0,0,0,0.45) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.45) 100%)"),
      capa("linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.35))"),
      capa(DUELAS, "0 0", "auto", "repeat"),
    ],
    panelEstilo: "border: 1px solid #2a170c !important; box-shadow: 0 8px 18px rgba(0,0,0,0.5) !important;",
    modal: [capa(BOTELLA_CERVEZA, "left 12px bottom 10px", "13px 42px"), capa(SHOTS, "right 12px bottom 12px", "30px 21px"), trama(BOTELLAS_TENUES, "150px 120px"), capa("linear-gradient(170deg, #2a0d16 0%, #14070b 100%)")],
    modalEstilo: "border: 1px solid #e9c46a !important; box-shadow: 0 20px 60px rgba(0,0,0,0.7) !important;",
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
    cabeceraEstilo: "padding-bottom: 54px !important; border-bottom: 4px solid #0e7490 !important; box-shadow: 0 6px 14px rgba(14,116,144,0.12);",
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
// BARBERÍA — "Barbería clásica"
// =====================================================================
// Poste de barbero con las franjas girando (animación DENTRO del SVG:
// solo se mueve la imagen, no repinta la página).
const POSTE = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 110'><defs><clipPath id='t'><rect x='5' y='14' width='14' height='82' rx='7'/></clipPath><linearGradient id='v' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='rgba(255,255,255,0.45)'/><stop offset='.35' stop-color='rgba(255,255,255,0)'/><stop offset='.75' stop-color='rgba(0,0,0,0)'/><stop offset='1' stop-color='rgba(0,0,0,0.35)'/></linearGradient><linearGradient id='c' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#9ca3af'/><stop offset='.45' stop-color='#f8fafc'/><stop offset='1' stop-color='#6b7280'/></linearGradient></defs><g clip-path='url(#t)'><rect x='0' y='0' width='24' height='110' fill='#ffffff'/><g><animateTransform attributeName='transform' type='translate' from='0 0' to='0 24' dur='1.6s' repeatCount='indefinite'/><g stroke-width='6'>${Array.from({ length: 9 }, (_, i) => `<path d='M-4 ${i * 24 - 30} L28 ${i * 24 - 46}' stroke='#dc2626'/><path d='M-4 ${i * 24 - 18} L28 ${i * 24 - 34}' stroke='#1d4ed8'/>`).join("")}</g></g><rect x='5' y='14' width='14' height='82' fill='url(#v)'/></g><rect x='3' y='4' width='18' height='11' rx='4' fill='url(#c)' stroke='#4b5563' stroke-width='.8'/><circle cx='12' cy='4' r='3' fill='url(#c)' stroke='#4b5563' stroke-width='.8'/><rect x='3' y='95' width='18' height='11' rx='4' fill='url(#c)' stroke='#4b5563' stroke-width='.8'/></svg>`
);
const NAVAJA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 34 18'><path d='M2 9 Q2 4 8 4 H22 L22 10 H8 Q4 10 2 9 Z' fill='#e5e7eb' stroke='#6b7280' stroke-width='.9'/><path d='M4 8.5 H21' stroke='#ffffff' stroke-width='1'/><rect x='21' y='6' width='12' height='6' rx='3' fill='#1f2937' stroke='#9ca3af' stroke-width='.8'/><circle cx='23.5' cy='9' r='1.2' fill='#d1d5db'/></svg>`
);
const GRANO_CUERO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><g fill='rgba(255,255,255,0.025)'><circle cx='6' cy='8' r='1.5'/><circle cx='22' cy='4' r='1'/><circle cx='40' cy='12' r='1.8'/><circle cx='54' cy='30' r='1.2'/><circle cx='14' cy='30' r='1.6'/><circle cx='34' cy='46' r='1.3'/><circle cx='50' cy='54' r='1'/><circle cx='8' cy='52' r='1.4'/></g></svg>`
);
const CUERO = "linear-gradient(170deg, #26262b 0%, #18181c 100%)";
const COSTURA = "outline: 1.5px dashed rgba(229,231,235,0.35); outline-offset: -6px;";

const barberia = (S) =>
  construir(S, {
    raiz: [trama(GRANO_CUERO, "60px 60px"), capa("linear-gradient(180deg, #121215 0%, #0b0b0d 100%)")],
    cabecera: [capa(POSTE, "left 3% center", "26px 118px"), capa(POSTE, "right 3% center", "26px 118px"), trama(GRANO_CUERO, "60px 60px"), capa("linear-gradient(180deg, #1f1f24 0%, #141418 100%)")],
    cabeceraEstilo: "border-bottom: 3px solid transparent !important; border-image: linear-gradient(90deg, #dc2626 0 33.3%, #f8fafc 33.3% 66.6%, #1d4ed8 66.6%) 1 !important; box-shadow: 0 6px 18px rgba(0,0,0,0.6);",
    pie: [trama(GRANO_CUERO, "60px 60px"), capa(CUERO)],
    pieEstilo: "border-top: 3px solid transparent !important; border-image: linear-gradient(90deg, #dc2626 0 33.3%, #f8fafc 33.3% 66.6%, #1d4ed8 66.6%) 1 !important;",
    boton: [capa("linear-gradient(180deg, rgba(255,255,255,0.10), transparent 55%)"), capa(CUERO)],
    botonEstilo: `border: 1px solid #9ca3af !important; color: #f3f4f6 !important; box-shadow: inset 0 1px 0 rgba(255,255,255,0.15), 0 3px 8px rgba(0,0,0,0.5) !important; ${COSTURA} outline-offset: -4px;`,
    botonPieEstilo: `border-radius: 10px !important; border: 1px solid #9ca3af !important; color: #f3f4f6 !important; box-shadow: 0 4px 10px rgba(0,0,0,0.55) !important; ${COSTURA} outline-offset: -4px;`,
    panel: [capa(NAVAJA, "right 8px top 8px", "26px 14px"), trama(GRANO_CUERO, "60px 60px"), capa(CUERO)],
    panelEstilo: `border: 1px solid #3f3f46 !important; box-shadow: 0 8px 18px rgba(0,0,0,0.5) !important; ${COSTURA}`,
    modal: [trama(GRANO_CUERO, "60px 60px"), capa("linear-gradient(170deg, #222227 0%, #141418 100%)")],
    modalEstilo: `border: 1px solid #6b7280 !important; box-shadow: 0 20px 60px rgba(0,0,0,0.7) !important; ${COSTURA} outline-offset: -8px;`,
    tituloEstilo: "color: #f8fafc !important; border-bottom: 3px solid transparent; border-image: linear-gradient(90deg, #dc2626 0 33.3%, #f8fafc 33.3% 66.6%, #1d4ed8 66.6%) 1; padding-bottom: 8px;",
    pestana: [capa(CUERO)],
    pestanaEstilo: "border: 1px solid #52525b !important; color: #e4e4e7 !important;",
    activa: [capa("linear-gradient(180deg, #f8fafc 0%, #d1d5db 50%, #9ca3af 100%)")],
    activaEstilo: "border-color: #4b5563 !important; color: #111827 !important; box-shadow: 0 0 12px rgba(229,231,235,0.35) !important;",
    campoEstilo: "background: #0b0b0d !important; border: 1px solid #52525b !important;",
  });

// =====================================================================
// SALÓN DE BELLEZA — "Glamour"
// =====================================================================
const FOCOS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='44' height='26'><defs><radialGradient id='f' cx='.5' cy='.45' r='.55'><stop offset='0' stop-color='#ffffff'/><stop offset='.5' stop-color='#fff4d6'/><stop offset='1' stop-color='#fcd34d'/></radialGradient><radialGradient id='h' cx='.5' cy='.5' r='.5'><stop offset='0' stop-color='rgba(253,224,140,0.55)'/><stop offset='1' stop-color='rgba(253,224,140,0)'/></radialGradient></defs><rect width='44' height='26' fill='#c9a227'/><rect y='1' width='44' height='24' fill='#2e1228'/><circle cx='22' cy='13' r='13' fill='url(#h)'/><circle cx='22' cy='13' r='7' fill='url(#f)' stroke='#d4a017' stroke-width='1'/></svg>`
);
const BRILLITOS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><g fill='rgba(252,211,77,0.35)'><path d='M12 8 l1.2 3 l3 1.2 l-3 1.2 l-1.2 3 l-1.2 -3 l-3 -1.2 l3 -1.2 Z'/><path d='M58 40 l1 2.5 l2.5 1 l-2.5 1 l-1 2.5 l-1 -2.5 l-2.5 -1 l2.5 -1 Z'/></g><g fill='rgba(249,168,212,0.3)'><circle cx='36' cy='22' r='1.2'/><circle cx='70' cy='12' r='0.9'/><circle cx='20' cy='60' r='1.1'/><circle cx='48' cy='70' r='0.8'/></g></svg>`
);
const PEINE = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 16'><rect x='1' y='2' width='28' height='5' rx='2' fill='#fcd34d' stroke='#b45309' stroke-width='.8'/><g stroke='#fcd34d' stroke-width='1.6' stroke-linecap='round'>${Array.from({ length: 11 }, (_, i) => `<path d='M${3.5 + i * 2.3} 7 V14'/>`).join("")}</g></svg>`
);

const glamour = (S) =>
  construir(S, {
    raiz: [trama(BRILLITOS, "80px 80px"), capa("radial-gradient(ellipse 900px 400px at 50% -10%, rgba(249,168,212,0.16), transparent 60%)"), capa("linear-gradient(180deg, #1c0a18 0%, #120610 100%)")],
    // Espejo de camerino: fila de focos encendidos bajo la cabecera.
    cabecera: [capa(FOCOS, "left 0 bottom 0", "44px 26px", "repeat-x"), trama(BRILLITOS, "80px 80px"), capa("linear-gradient(180deg, #3d1735 0%, #2a0f24 100%)")],
    cabeceraEstilo: "padding-bottom: 36px !important; border-bottom: none !important; box-shadow: 0 6px 18px rgba(0,0,0,0.5);",
    pie: [capa(FOCOS, "left 0 top 0", "44px 26px", "repeat-x"), trama(BRILLITOS, "80px 80px"), capa("linear-gradient(180deg, #2a0f24, #1c0a18)")],
    pieEstilo: "border-top: none !important; padding-top: 36px !important;",
    boton: [capa("linear-gradient(180deg, rgba(255,255,255,0.22), transparent 55%)"), capa("linear-gradient(180deg, #e7a1c4, #c86e9c)")],
    botonEstilo: "border: 1px solid #fcd34d !important; color: #2a0f24 !important; box-shadow: 0 0 10px rgba(252,211,77,0.3), 0 3px 8px rgba(0,0,0,0.45) !important; border-radius: 999px !important; font-weight: 800;",
    botonPieEstilo: "border-radius: 999px !important; border: 1px solid #fcd34d !important; color: #2a0f24 !important; box-shadow: 0 0 12px rgba(252,211,77,0.35) !important;",
    panel: [capa(PEINE, "right 8px top 8px", "24px 13px"), trama(BRILLITOS, "80px 80px"), capa("linear-gradient(160deg, rgba(249,168,212,0.10) 0%, transparent 40%)"), capa("linear-gradient(170deg, #34142c 0%, #220c1d 100%)")],
    panelEstilo: "border: 1px solid #c9a227 !important; box-shadow: inset 0 0 0 3px rgba(34,12,29,0.9), inset 0 0 0 4px rgba(252,211,77,0.35), 0 8px 18px rgba(0,0,0,0.5) !important;",
    modal: [capa(FOCOS, "left 0 top 0", "44px 26px", "repeat-x"), trama(BRILLITOS, "80px 80px"), capa("linear-gradient(170deg, #3a1532 0%, #1c0a18 100%)")],
    modalEstilo: "border: 1px solid #fcd34d !important; box-shadow: 0 0 24px rgba(249,168,212,0.25), 0 20px 60px rgba(0,0,0,0.7) !important; padding-top: 40px !important;",
    tituloEstilo: "color: #fde68a !important; text-shadow: 0 0 10px rgba(252,211,77,0.5); border-bottom: 1px solid rgba(252,211,77,0.6); padding-bottom: 8px; letter-spacing: 0.1em;",
    pestana: [capa("linear-gradient(170deg, #34142c 0%, #220c1d 100%)")],
    pestanaEstilo: "border: 1px solid rgba(252,211,77,0.45) !important; color: #fbcfe8 !important;",
    activa: [capa("linear-gradient(135deg, #f7c6a3 0%, #e8a0b4 50%, #d4a017 100%)")],
    activaEstilo: "border-color: #8a6a10 !important; color: #2a0f24 !important; box-shadow: 0 0 16px rgba(249,168,212,0.5) !important;",
    campoEstilo: "background: #160813 !important; border: 1px solid rgba(252,211,77,0.4) !important;",
  });

// =====================================================================
// SPA — "Zen" (claro)
// =====================================================================
const PIEDRAS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 52'><ellipse cx='20' cy='45' rx='17' ry='6.5' fill='#8a8f86'/><ellipse cx='20' cy='34' rx='13' ry='6' fill='#a3a89e'/><ellipse cx='20' cy='24' rx='10' ry='5' fill='#7d8278'/><ellipse cx='20' cy='15' rx='7' ry='4' fill='#b4b8ad'/><g fill='rgba(255,255,255,0.35)'><ellipse cx='14' cy='43' rx='5' ry='1.6'/><ellipse cx='15' cy='32' rx='4' ry='1.4'/><ellipse cx='16' cy='13.5' rx='2.5' ry='1'/></g><path d='M24 8 Q30 2 36 4 Q32 10 24 8 Z' fill='#6b8f5e'/></svg>`
);
const BAMBU = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><g stroke='rgba(63,107,79,0.10)' stroke-width='6' stroke-linecap='round'><path d='M20 0 V120'/><path d='M84 0 V120'/></g><g stroke='rgba(63,107,79,0.16)' stroke-width='7'><path d='M17 38 H23'/><path d='M17 90 H23'/><path d='M81 20 H87'/><path d='M81 72 H87'/></g><g fill='rgba(77,124,15,0.12)'><path d='M23 40 Q40 30 52 34 Q40 42 23 40 Z'/><path d='M81 74 Q62 64 52 70 Q64 78 81 74 Z'/></g></svg>`
);
const ONDAS_AGUA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='12'><path d='M0 6 Q12.5 0 25 6 T50 6 T75 6 T100 6' fill='none' stroke='rgba(63,107,79,0.45)' stroke-width='1.6'/></svg>`
);
const GOTA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 22'><path d='M8 1 C8 1 2 9 2 14 A6 6 0 0 0 14 14 C14 9 8 1 8 1 Z' fill='#bfe3d4' stroke='#5b8f7b' stroke-width='1'/><ellipse cx='6' cy='13' rx='1.6' ry='2.6' fill='#ffffff' opacity='.7'/></svg>`
);

const zen = (S) =>
  construir(S, {
    raiz: [trama(BAMBU, "120px 120px"), capa("linear-gradient(180deg, #f6f7f3 0%, #e9ede4 100%)")],
    cabecera: [capa(PIEDRAS, "left 3% bottom 14px", "40px 52px"), capa(PIEDRAS, "right 3% bottom 14px", "34px 44px"), capa(ONDAS_AGUA, "left 0 bottom 2px", "100px 12px", "repeat-x"), trama(BAMBU, "120px 120px"), capa("linear-gradient(180deg, #ffffff 0%, #eef2ea 100%)")],
    cabeceraEstilo: "padding-bottom: 24px !important; border-bottom: 1px solid #cdd6c6 !important; box-shadow: 0 6px 16px rgba(63,107,79,0.08);",
    pie: [capa(ONDAS_AGUA, "left 0 top 6px", "100px 12px", "repeat-x"), capa("linear-gradient(180deg, #eef2ea, #e2e9dc)")],
    pieEstilo: "border-top: 1px solid #cdd6c6 !important; padding-top: 26px !important;",
    boton: [capa("linear-gradient(180deg, #6f9a7d, #4f7a5e)")],
    botonEstilo: "border: 1px solid #3f6b4f !important; color: #ffffff !important; box-shadow: 0 3px 8px rgba(63,107,79,0.2) !important; border-radius: 999px !important;",
    botonPieEstilo: "border-radius: 999px !important; border: 1px solid #3f6b4f !important; color: #ffffff !important; box-shadow: 0 4px 10px rgba(63,107,79,0.22) !important;",
    panel: [capa(GOTA, "right 9px top 8px", "13px 18px"), capa("linear-gradient(180deg, #ffffff, #fbfcf9)")],
    panelEstilo: "border: 1px solid #dbe3d4 !important; border-radius: 18px !important; box-shadow: 0 8px 20px rgba(63,107,79,0.08) !important;",
    modal: [capa(PIEDRAS, "right 14px bottom 12px", "36px 47px"), capa("linear-gradient(180deg, #ffffff, #f4f6f1)")],
    modalEstilo: "border: 1px solid #cdd6c6 !important; box-shadow: 0 20px 60px rgba(63,107,79,0.18) !important;",
    tituloEstilo: `color: #2f5541 !important; background: ${ONDAS_AGUA} left 0 bottom 0 / 100px 10px repeat-x !important; padding-bottom: 16px; font-weight: 600;`,
    pestana: [capa("linear-gradient(180deg, #ffffff, #f1f4ee)")],
    pestanaEstilo: "border: 1px solid #cdd6c6 !important; color: #3f6b4f !important; border-radius: 999px !important;",
    activa: [capa("linear-gradient(180deg, #6f9a7d, #3f6b4f)")],
    activaEstilo: "border-color: #2f5541 !important; color: #ffffff !important; box-shadow: 0 4px 12px rgba(63,107,79,0.3) !important;",
    campoEstilo: "background: #ffffff !important; border: 1px solid #cdd6c6 !important;",
  });

// =====================================================================
// ROPA Y MODA — "Urbano" (denim, costuras naranjas y un tendedero de
// prendas: polos, camisa a cuadros, gorra, gafas, jeans y bikini)
// =====================================================================
const polo = (x, y, c, k = 1) =>
  `<g transform='translate(${x} ${y}) scale(${k})'><path d='M8 4 L12 2 Q15 5 18 2 L22 4 L28 9 L24 13 L22 11 V28 H8 V11 L6 13 L2 9 Z' fill='${c}' stroke='rgba(0,0,0,0.35)' stroke-width='.8'/><path d='M12 2 Q15 6 18 2' stroke='rgba(0,0,0,0.3)' stroke-width='1' fill='none'/><rect x='11' y='12' width='8' height='5' rx='1' fill='rgba(255,255,255,0.55)'/></g>`;
const camisa = (x, y, k = 1) =>
  `<g transform='translate(${x} ${y}) scale(${k})'><defs><pattern id='cu' width='6' height='6' patternUnits='userSpaceOnUse'><rect width='6' height='6' fill='#b91c1c'/><path d='M0 1.5 H6 M1.5 0 V6' stroke='#1f2937' stroke-width='1.4'/><path d='M0 4.5 H6 M4.5 0 V6' stroke='rgba(255,255,255,0.25)' stroke-width='.7'/></pattern></defs><path d='M8 4 L12 2 L15 6 L18 2 L22 4 L28 9 L24 13 L22 11 V28 H8 V11 L6 13 L2 9 Z' fill='url(#cu)' stroke='rgba(0,0,0,0.4)' stroke-width='.8'/><path d='M12 2 L15 8 L18 2' fill='#7f1d1d'/><path d='M15 8 V28' stroke='rgba(0,0,0,0.4)' stroke-width='.8'/><g fill='#f8fafc'><circle cx='15' cy='12' r='.8'/><circle cx='15' cy='17' r='.8'/><circle cx='15' cy='22' r='.8'/></g></g>`;
const gorra = (x, y, c, k = 1) =>
  `<g transform='translate(${x} ${y}) scale(${k})'><path d='M3 17 Q3 5 15 5 Q25 5 25 15 L31 17 Q31 20 27 20 H4 Q3 20 3 17 Z' fill='${c}' stroke='rgba(0,0,0,0.4)' stroke-width='.8'/><path d='M25 15 L31 17 Q31 20 27 20 H22 Z' fill='rgba(0,0,0,0.35)'/><path d='M15 5 Q12 10 12 18 M15 5 Q19 10 20 17' stroke='rgba(0,0,0,0.25)' stroke-width='.8' fill='none'/><circle cx='15' cy='5' r='1.4' fill='rgba(0,0,0,0.4)'/><rect x='7' y='11' width='6' height='4' rx='1' fill='#fde047'/></g>`;
const gafas = (x, y, k = 1) =>
  `<g transform='translate(${x} ${y}) scale(${k})'><path d='M1 3 H31' stroke='#111827' stroke-width='2' stroke-linecap='round'/><path d='M2 3 H13 Q14 11 8 12 Q2 12 2 3 Z' fill='#111827'/><path d='M19 3 H30 Q30 12 24 12 Q18 11 19 3 Z' fill='#111827'/><path d='M4 5 L8 9 M21 5 L25 9' stroke='rgba(125,211,252,0.7)' stroke-width='1.4' stroke-linecap='round'/><path d='M13 4 Q16 2 19 4' stroke='#111827' stroke-width='1.6' fill='none'/></g>`;
const jeans = (x, y, k = 1) =>
  `<g transform='translate(${x} ${y}) scale(${k})'><path d='M5 2 H25 L27 30 H18.5 L15 12 L11.5 30 H3 Z' fill='#2f5d9a' stroke='#1e3a5f' stroke-width='.8'/><rect x='5' y='2' width='20' height='3.5' fill='#264c80'/><path d='M7 6 Q9 10 13 8 M23 6 Q21 10 17 8' stroke='#f59e0b' stroke-width='.7' fill='none'/><path d='M15 5.5 V12' stroke='#f59e0b' stroke-width='.7' stroke-dasharray='1.4 1'/><circle cx='15' cy='3.8' r='.9' fill='#d6a756'/><path d='M4 28 H11 M19 28 H26' stroke='#f59e0b' stroke-width='.7' stroke-dasharray='1.4 1'/></g>`;
const bikini = (x, y, k = 1) =>
  `<g transform='translate(${x} ${y}) scale(${k})'><path d='M2 2 L8 11 M28 2 L22 11 M8 11 Q15 8 22 11' stroke='#111827' stroke-width='.9' fill='none'/><path d='M8 11 L4 5 Q9 4 13 9 Q12 13 8 11 Z' fill='#fb7185'/><path d='M22 11 L26 5 Q21 4 17 9 Q18 13 22 11 Z' fill='#fb7185'/><path d='M6 18 H24 Q22 27 15 28 Q8 27 6 18 Z' fill='#fb7185'/><path d='M2 18 H28' stroke='#111827' stroke-width='.9'/><g fill='#fff1f2'><circle cx='8' cy='8' r='.8'/><circle cx='22' cy='8' r='.8'/><circle cx='11' cy='21' r='.8'/><circle cx='17' cy='23' r='.8'/><circle cx='19' cy='20' r='.8'/></g></g>`;
const pinza = (x) => `<rect x='${x}' y='3' width='3' height='7' rx='1' fill='#d6a756' stroke='#8a6420' stroke-width='.5'/>`;
// Tendedero: cuerda + prendas colgadas con pinzas (repeat-x).
const TENDEDERO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='46'><path d='M0 6 Q100 11 200 6' stroke='#e5e7eb' stroke-width='1.4' fill='none'/>${polo(4, 8, "#f8fafc", 1)}${pinza(17)}${gorra(36, 6, "#1f2937", 0.95)}${pinza(50)}${gafas(70, 9, 0.9)}${pinza(83)}${jeans(104, 8, 1.15)}${pinza(110)}${pinza(130)}${bikini(140, 6, 1)}${pinza(154)}${camisa(170, 8, 1)}${pinza(183)}</svg>`
);
const PRENDAS_TENUES = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><g opacity='.09'>${polo(20, 20, "#e5e7eb", 1.5)}${gafas(120, 40, 1.4)}${gorra(150, 120, "#e5e7eb", 1.4)}${jeans(40, 130, 1.5)}${bikini(110, 175, 1.1)}</g></svg>`
);
// Costura de jean: doble pespunte naranja (repeat-x).
const PESPUNTE = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='10'><path d='M1 3 H9 M1 7 H9' stroke='#f59e0b' stroke-width='1.3' stroke-linecap='round'/></svg>`
);
const TWILL = "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 3px)";
const DENIM = "linear-gradient(170deg, #2a4a74 0%, #1d3557 55%, #172a46 100%)";
const DENIM_OSCURO = "linear-gradient(170deg, #1a2a44 0%, #121e33 100%)";
const BOLSILLO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 34 38'><path d='M2 2 H32 V26 L17 36 L2 26 Z' fill='#284a78' stroke='#f59e0b' stroke-width='1.2' stroke-dasharray='2 1.4'/><path d='M6 12 Q17 6 28 12 M6 16 Q17 10 28 16' stroke='#f59e0b' stroke-width='1' fill='none'/></svg>`
);
const REMACHE = svg(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'><circle cx='5' cy='5' r='4' fill='#b87333'/><circle cx='4' cy='4' r='1.6' fill='#f3c08a'/></svg>`);
const GAFAS_ICONO = svg(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 14'>${gafas(0, 0, 1)}</svg>`);

const boutique = (S) =>
  construir(S, {
    raiz: [trama(PRENDAS_TENUES, "220px 220px"), capa("radial-gradient(ellipse 900px 400px at 50% -10%, rgba(125,211,252,0.10), transparent 60%)"), capa("linear-gradient(180deg, #121419 0%, #0b0c10 100%)")],
    // Cabecera de jean con el tendedero arriba y la costura abajo.
    cabecera: [
      capa(TENDEDERO, "left 0 top 0", "270px 62px", "repeat-x"),
      capa(PESPUNTE, "left 0 bottom 6px", "16px 10px", "repeat-x"),
      capa(TWILL, "0 0", "auto", "repeat"),
      capa(DENIM),
    ],
    cabeceraEstilo: "padding-top: 68px !important; padding-bottom: 24px !important; border-bottom: 3px solid #0f1b2e !important; box-shadow: 0 6px 18px rgba(0,0,0,0.55);",
    pie: [
      capa(BOLSILLO, "left 3% bottom 10px", "34px 38px"),
      capa(BOLSILLO, "right 3% bottom 10px", "34px 38px"),
      capa(PESPUNTE, "left 0 top 6px", "16px 10px", "repeat-x"),
      capa(TWILL, "0 0", "auto", "repeat"),
      capa(DENIM),
    ],
    pieEstilo: "border-top: 3px solid #0f1b2e !important; padding-top: 26px !important;",
    boton: [capa("linear-gradient(180deg, rgba(255,255,255,0.14), transparent 55%)"), capa(TWILL, "0 0", "auto", "repeat"), capa("linear-gradient(180deg, #3b6aa8, #2a4f82)")],
    botonEstilo: "border: 1px solid #0f1b2e !important; color: #f8fafc !important; outline: 1.3px dashed rgba(245,158,11,0.85); outline-offset: -4px; box-shadow: 0 3px 8px rgba(0,0,0,0.45) !important; text-shadow: 0 1px 1px rgba(0,0,0,0.5);",
    botonPieEstilo: "border-radius: 10px !important; border: 1px solid #0f1b2e !important; color: #f8fafc !important; outline: 1.3px dashed rgba(245,158,11,0.85); outline-offset: -4px; box-shadow: 0 4px 10px rgba(0,0,0,0.5) !important; text-shadow: 0 1px 1px rgba(0,0,0,0.5);",
    // Paneles de jean oscuro con pespunte, remaches y unas gafas.
    panel: [capa(GAFAS_ICONO, "right 8px top 8px", "36px 16px"), ...esquinas(REMACHE, 7, 5).slice(2), capa(TWILL, "0 0", "auto", "repeat"), capa(DENIM_OSCURO)],
    panelEstilo: "border: 1px solid #0b1424 !important; outline: 1.3px dashed rgba(245,158,11,0.55); outline-offset: -6px; box-shadow: 0 8px 18px rgba(0,0,0,0.5) !important;",
    modal: [capa(PESPUNTE, "left 0 top 6px", "16px 10px", "repeat-x"), capa(TWILL, "0 0", "auto", "repeat"), capa(DENIM_OSCURO)],
    modalEstilo: "border: 1px solid #3b6aa8 !important; outline: 1.3px dashed rgba(245,158,11,0.6); outline-offset: -8px; box-shadow: 0 20px 60px rgba(0,0,0,0.7) !important;",
    tituloEstilo: "color: #f8fafc !important; letter-spacing: 0.12em; border-bottom: 2px dashed rgba(245,158,11,0.7); padding-bottom: 8px;",
    pestana: [capa(TWILL, "0 0", "auto", "repeat"), capa("linear-gradient(180deg, #24406a, #1a2f50)")],
    pestanaEstilo: "border: 1px solid rgba(125,211,252,0.35) !important; color: #dbeafe !important;",
    activa: [capa("linear-gradient(180deg, #fb7185, #e11d48)")],
    activaEstilo: "border-color: #9f1239 !important; color: #ffffff !important; box-shadow: 0 0 14px rgba(251,113,133,0.45) !important;",
    campoEstilo: "background: #0d1626 !important; border: 1px solid rgba(125,211,252,0.35) !important;",
    extra: (S) => `${en(S, ".tz-stat-chip")}, ${en(S, ".tz-method-total")} { padding-right: 38px !important; }`,
  });

// =====================================================================
// CALZADO — "Sneakers" (zapatillas retro de colores, pared de
// exhibición, agujetas y suela de goma; sin marcas reales)
// =====================================================================
// Zapatilla de perfil: c = {cuero, refuerzo, talon, suela, panel, alta}.
const zapatilla = (x, y, c, k = 1, espejo = false) => {
  const alta = c.alta;
  const capellada = alta
    ? "M3 20 Q2 8 6 3 L16 2 Q18 7 24 9 L34 10 Q38 12 42 12 L50 14 Q57 16 57 20 Z"
    : "M3 20 Q2 12 8 10 L18 8 Q22 4 28 5 L30 4 Q33 9 38 11 L50 14 Q57 16 57 20 Z";
  return `<g transform='translate(${x} ${y}) scale(${espejo ? -k : k} ${k})${espejo ? " translate(-60 0)" : ""}'><path d='M2 22 H57 Q59 22 59 24 V25 Q59 27 57 27 H4 Q2 27 2 25 Z' fill='${c.suela}'/><path d='M2 20 H58 V22.5 H2 Z' fill='#f8fafc'/><path d='${capellada}' fill='${c.cuero}' stroke='rgba(0,0,0,0.35)' stroke-width='.7'/><path d='M42 12.5 Q55 14.5 57 20 H44 Z' fill='${c.refuerzo}'/><path d='${alta ? "M3 20 Q2 8 6 3 L11 3 L12 20 Z" : "M3 20 Q2 12 8 10 L11 9.5 L12 20 Z"}' fill='${c.talon}'/><path d='M15 20 L21 ${alta ? 6 : 9} L29 ${alta ? 8 : 9} L24 20 Z' fill='${c.panel}' stroke='rgba(0,0,0,0.25)' stroke-width='.5'/><g stroke='#f8fafc' stroke-width='1.1' stroke-linecap='round'><path d='M${alta ? 20 : 27} ${alta ? 5 : 7} L${alta ? 23 : 30} ${alta ? 9 : 10}'/><path d='M${alta ? 24 : 30} ${alta ? 7 : 6.5} L${alta ? 27 : 33} ${alta ? 10.5 : 10.5}'/><path d='M${alta ? 28 : 33} ${alta ? 8.5 : 7.5} L${alta ? 31 : 36} ${alta ? 11 : 11}'/></g><path d='M3 21 H58' stroke='rgba(0,0,0,0.25)' stroke-width='.5' stroke-dasharray='1.5 1'/><g fill='rgba(0,0,0,0.25)'><circle cx='48' cy='17' r='.6'/><circle cx='51' cy='17.5' r='.6'/><circle cx='54' cy='18' r='.6'/></g></g>`;
};
const COLORES_ZAP = [
  { cuero: "#f8fafc", refuerzo: "#dc2626", talon: "#111827", suela: "#111827", panel: "#dc2626" },
  { cuero: "#f1f5f9", refuerzo: "#1d4ed8", talon: "#1d4ed8", suela: "#c68642", panel: "#93c5fd" },
  { cuero: "#111827", refuerzo: "#facc15", talon: "#facc15", suela: "#f8fafc", panel: "#374151", alta: true },
  { cuero: "#ecfdf5", refuerzo: "#10b981", talon: "#f97316", suela: "#c68642", panel: "#10b981" },
  { cuero: "#fdf2f8", refuerzo: "#a855f7", talon: "#111827", suela: "#f8fafc", panel: "#f472b6", alta: true },
];
// Pared de exhibición: repisas con luz y zapatillas (repeat-x).
const PARED_ZAP = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='260' height='40'>${COLORES_ZAP.slice(0, 4)
    .map((c, i) => zapatilla(6 + i * 64, 4, c, 0.9, i % 2 === 1))
    .join("")}<rect x='0' y='31' width='260' height='4' fill='#e5e7eb'/><rect x='0' y='35' width='260' height='5' fill='rgba(255,209,102,0.25)'/></svg>`
);
const ZAPS_TENUES = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='200'><g opacity='.1'><g transform='rotate(-14 60 40)'>${zapatilla(20, 20, COLORES_ZAP[0], 1.3)}</g><g transform='rotate(12 170 110)'>${zapatilla(130, 90, COLORES_ZAP[2], 1.2, true)}</g><g transform='rotate(-6 70 160)'>${zapatilla(30, 150, COLORES_ZAP[3], 1.1)}</g></g></svg>`
);
// Agujetas cruzadas por ojales (borde) y un lazo con sus herretes.
const AGUJETAS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='44' height='22'><path d='M0 4 L22 18 M0 18 L22 4 M22 4 L44 18 M22 18 L44 4' stroke='#f8fafc' stroke-width='3' stroke-linecap='round'/><path d='M0 4 L22 18 M22 4 L44 18' stroke='rgba(0,0,0,0.18)' stroke-width='1'/><g fill='#1f2937' stroke='#d1d5db' stroke-width='1.2'><circle cx='0' cy='4' r='2.6'/><circle cx='0' cy='18' r='2.6'/><circle cx='22' cy='4' r='2.6'/><circle cx='22' cy='18' r='2.6'/><circle cx='44' cy='4' r='2.6'/><circle cx='44' cy='18' r='2.6'/></g></svg>`
);
const LAZO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 50 46'><g fill='none' stroke='#f8fafc' stroke-width='3' stroke-linecap='round'><path d='M25 12 C14 0 4 6 10 12 C14 16 22 14 25 12'/><path d='M25 12 C36 0 46 6 40 12 C36 16 28 14 25 12'/><path d='M25 12 C22 22 14 28 10 40'/><path d='M25 12 C30 24 34 30 38 42'/></g><circle cx='25' cy='12' r='3' fill='#f8fafc'/><g fill='#ffd166'><rect x='7' y='38' width='5' height='7' rx='1.5' transform='rotate(22 9.5 41.5)'/><rect x='36' y='40' width='5' height='7' rx='1.5' transform='rotate(-20 38.5 43.5)'/></g></svg>`
);
// Suela de goma con dibujo de zigzag (pie de página).
const GOMA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='18'><rect width='28' height='18' fill='#b57d4c'/><path d='M0 5 L7 1 L14 5 L21 1 L28 5 M0 13 L7 9 L14 13 L21 9 L28 13' stroke='#8f5d33' stroke-width='2.2' fill='none'/></svg>`
);
const PERFORADO = "radial-gradient(circle, rgba(255,255,255,0.10) 1.2px, transparent 1.6px)";
const ZAPA_ICONO = svg(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 28'>${zapatilla(0, 0, COLORES_ZAP[0], 1)}</svg>`);
const ZAPA_ALTA_ICONO = svg(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 28'>${zapatilla(0, 0, COLORES_ZAP[4], 1)}</svg>`);

const vitrina = (S) =>
  construir(S, {
    raiz: [trama(ZAPS_TENUES, "240px 200px"), capa("radial-gradient(ellipse 900px 400px at 50% -10%, rgba(255,209,102,0.10), transparent 60%)"), capa("linear-gradient(180deg, #11131a 0%, #0b0d12 100%)")],
    // Cabecera = pared de exhibición: zapatillas sobre repisa con luz y
    // un lazo de agujetas en cada esquina de arriba.
    cabecera: [
      capa(LAZO, "left 1.5% top 6px", "40px 37px"),
      capa(LAZO, "right 1.5% top 6px", "40px 37px"),
      capa(PARED_ZAP, "left 0 bottom 0", "400px 62px", "repeat-x"),
      capa("linear-gradient(180deg, transparent 0 calc(100% - 74px), rgba(255,209,102,0.10) calc(100% - 74px))"),
      capa(PERFORADO, "0 0", "14px 14px", "repeat"),
      capa("linear-gradient(170deg, #1d2130 0%, #141722 100%)"),
    ],
    cabeceraEstilo: "padding-bottom: 76px !important; border-bottom: 4px solid #ffd166 !important; box-shadow: 0 6px 18px rgba(0,0,0,0.55);",
    // Pie = suela de goma con agujetas arriba.
    pie: [capa(AGUJETAS, "left 0 top 4px", "44px 22px", "repeat-x"), capa("linear-gradient(180deg, #141722 0 30px, transparent 30px)"), capa(GOMA, "0 0", "28px 18px", "repeat")],
    pieEstilo: "border-top: none !important; padding-top: 40px !important;",
    // Botones de cuero blanco con "suela" de goma abajo.
    boton: [capa("linear-gradient(180deg, transparent calc(100% - 4px), #c68642 calc(100% - 4px))"), capa("linear-gradient(180deg, #ffffff, #e5e7eb)")],
    botonEstilo: "border: 1px solid #9ca3af !important; color: #111827 !important; box-shadow: 0 3px 8px rgba(0,0,0,0.4) !important; font-weight: 800;",
    botonPieEstilo: "border-radius: 10px !important; border: 1px solid #9ca3af !important; color: #111827 !important; box-shadow: 0 4px 10px rgba(0,0,0,0.45) !important; font-weight: 800;",
    // Paneles de gamuza con perforado y una zapatilla en la esquina.
    panel: [capa(ZAPA_ICONO, "right 6px top 6px", "44px 21px"), capa(PERFORADO, "right 0 bottom 0", "12px 12px", "repeat"), capa("linear-gradient(170deg, #232838 0%, #191d28 100%)")],
    panelEstilo: "border: 1px solid #343a4e !important; border-bottom: 3px solid #c68642 !important; box-shadow: 0 8px 18px rgba(0,0,0,0.5) !important;",
    modal: [capa(ZAPA_ALTA_ICONO, "right 12px bottom 10px", "46px 22px"), capa(PERFORADO, "0 0", "14px 14px", "repeat"), capa("linear-gradient(170deg, #232838 0%, #12141c 100%)")],
    modalEstilo: "border: 1px solid #ffd166 !important; box-shadow: 0 20px 60px rgba(0,0,0,0.7) !important;",
    tituloEstilo: `color: #ffd166 !important; background: ${AGUJETAS} left 0 bottom 0 / 30px 15px repeat-x !important; padding-bottom: 22px;`,
    pestana: [capa("linear-gradient(170deg, #232838 0%, #191d28 100%)")],
    pestanaEstilo: "border: 1px solid #3f465c !important; color: #e5e7eb !important;",
    activa: [capa("linear-gradient(180deg, #ff6b6b, #dc2626)")],
    activaEstilo: "border-color: #7f1d1d !important; color: #ffffff !important; box-shadow: 0 0 14px rgba(255,107,107,0.45) !important;",
    campoEstilo: "background: #0f1118 !important; border: 1px solid #3f465c !important;",
    extra: (S) => `${en(S, ".tz-stat-chip")}, ${en(S, ".tz-method-total")} { padding-right: 50px !important; }`,
  });

// =====================================================================
// JOYERÍA Y ACCESORIOS — "Joyero" (terciopelo burdeos, oro, perlas,
// anillos y diamantes; destellos que titilan)
// =====================================================================
const diamante = (x, y, k = 1) =>
  `<g transform='translate(${x} ${y}) scale(${k})'><path d='M8 2 H26 L33 10 L17 29 L1 10 Z' fill='#dff3fb' stroke='#5fb4d0' stroke-width='.8'/><path d='M1 10 H33' stroke='#7cc7df' stroke-width='.8'/><path d='M8 2 L12 10 L17 29 M26 2 L22 10 L17 29 M12 10 L17 2 L22 10' stroke='#7cc7df' stroke-width='.8' fill='none'/><path d='M12 10 L17 2 L22 10 Z' fill='#ffffff'/><path d='M1 10 L12 10 L17 29 Z' fill='#b9e3f2'/><path d='M22 10 L33 10 L17 29 Z' fill='#cdeef8'/></g>`;
const DIAMANTE = svg(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 34 30'>${diamante(0, 0)}</svg>`);
const ANILLO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 32'><ellipse cx='14' cy='21' rx='10' ry='9' fill='none' stroke='#b8901f' stroke-width='4'/><ellipse cx='14' cy='21' rx='10' ry='9' fill='none' stroke='#f5d78e' stroke-width='2'/><path d='M10 11 L14 13 L18 11' stroke='#b8901f' stroke-width='2' fill='none'/>${diamante(7, 0, 0.42)}</svg>`
);
// Collar de perlas que cuelga (repeat-x; sube y baja igual en las puntas).
const PERLAS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='72' height='22'><defs><radialGradient id='p' cx='.35' cy='.35' r='.7'><stop offset='0' stop-color='#ffffff'/><stop offset='.6' stop-color='#f3eee4'/><stop offset='1' stop-color='#c9bfae'/></radialGradient></defs>${Array.from({ length: 12 }, (_, i) => {
    const x = 3 + i * 6;
    const y = 5 + 9 * Math.sin((Math.PI * (x - 3)) / 72);
    return `<circle cx='${x}' cy='${y.toFixed(1)}' r='3.2' fill='url(#p)'/>`;
  }).join("")}</svg>`
);
// Destellos dorados y blancos que titilan (SMIL, sin JS).
const destello = (x, y, r, c, dur, delay) =>
  `<path d='M${x} ${y - r} L${x + r * 0.22} ${y - r * 0.22} L${x + r} ${y} L${x + r * 0.22} ${y + r * 0.22} L${x} ${y + r} L${x - r * 0.22} ${y + r * 0.22} L${x - r} ${y} L${x - r * 0.22} ${y - r * 0.22} Z' fill='${c}'><animate attributeName='opacity' values='0.15;1;0.15' dur='${dur}s' begin='${delay}s' repeatCount='indefinite'/></path>`;
const DESTELLOS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'>${destello(18, 22, 5, "#f5d78e", 2.6, 0)}${destello(78, 14, 3.5, "#ffffff", 3.1, 0.8)}${destello(52, 66, 4.5, "#f5d78e", 2.2, 1.4)}${destello(104, 84, 3, "#ffffff", 2.8, 0.4)}${destello(24, 100, 3.5, "#fbcfe8", 3.4, 1.9)}</svg>`
);
// Terciopelo: brillo + tela (dos capas separadas, una imagen por capa).
const TERCIOPELO = [
  capa("radial-gradient(ellipse 120% 80% at 30% 0%, rgba(255,180,210,0.10), transparent 60%)"),
  capa("linear-gradient(170deg, #4a0f24 0%, #33091a 55%, #240612 100%)"),
];
const ESTUCHE = "linear-gradient(170deg, #3a0b1d 0%, #270714 100%)";

const joyero = (S) =>
  construir(S, {
    raiz: [trama(DESTELLOS, "120px 120px"), capa("radial-gradient(ellipse 900px 420px at 50% -10%, rgba(245,215,142,0.10), transparent 60%)"), capa("linear-gradient(180deg, #1a0710 0%, #12050b 100%)")],
    // Cabecera de terciopelo con un collar de perlas abajo y diamantes
    // en las esquinas de abajo.
    cabecera: [
      capa(DIAMANTE, "left 2.5% bottom 26px", "30px 26px"),
      capa(PERLAS, "left 0 bottom 4px", "72px 22px", "repeat-x"),
      capa("linear-gradient(90deg, #a8841f, #f5d78e, #a8841f)", "left 0 bottom 0", "100% 2px"),
      trama(DESTELLOS, "120px 120px"),
      ...TERCIOPELO,
    ],
    cabeceraEstilo: "padding-bottom: 40px !important; border-bottom: none !important; box-shadow: 0 6px 18px rgba(0,0,0,0.55);",
    pie: [capa(PERLAS, "left 0 top 4px", "72px 22px", "repeat-x"), trama(DESTELLOS, "120px 120px"), ...TERCIOPELO],
    pieEstilo: "border-top: 2px solid #d4af37 !important; padding-top: 34px !important;",
    boton: [capa("linear-gradient(180deg, rgba(255,255,255,0.35), transparent 50%)"), capa("linear-gradient(180deg, #f5d78e 0%, #d4af37 55%, #a8841f 100%)")],
    botonEstilo: "border: 1px solid #7a5c10 !important; color: #2a0614 !important; box-shadow: 0 3px 10px rgba(0,0,0,0.45) !important; font-weight: 800;",
    botonPieEstilo: "border-radius: 999px !important; border: 1px solid #7a5c10 !important; color: #2a0614 !important; box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important; font-weight: 800;",
    // Paneles = interior de estuche con un anillo en la esquina.
    panel: [capa(ANILLO, "right 8px top 6px", "22px 25px"), capa("linear-gradient(155deg, rgba(255,255,255,0.06) 0%, transparent 35%)"), capa(ESTUCHE)],
    panelEstilo: "border: 1px solid #d4af37 !important; box-shadow: inset 0 0 0 3px #270714, inset 0 0 0 4px rgba(212,175,55,0.35), 0 8px 18px rgba(0,0,0,0.5) !important;",
    barra: [capa("linear-gradient(155deg, rgba(255,255,255,0.06) 0%, transparent 35%)"), capa(ESTUCHE)],
    puente: { img: DIAMANTE, ancho: 36, alto: 32, enCabecera: 14 },
    modal: [capa(DIAMANTE, "left 12px bottom 12px", "26px 23px"), capa(DIAMANTE, "right 12px bottom 12px", "26px 23px"), trama(DESTELLOS, "120px 120px"), ...TERCIOPELO],
    modalEstilo: "border: 1px solid #d4af37 !important; box-shadow: inset 0 0 0 5px #240612, inset 0 0 0 6px rgba(212,175,55,0.4), 0 20px 60px rgba(0,0,0,0.7) !important;",
    tituloEstilo: `color: #f5d78e !important; letter-spacing: 0.14em; background: ${PERLAS} left 0 bottom 0 / 54px 16px repeat-x !important; padding-bottom: 20px;`,
    pestana: [capa(ESTUCHE)],
    pestanaEstilo: "border: 1px solid rgba(212,175,55,0.5) !important; color: #f3dfa8 !important;",
    activa: [capa("linear-gradient(180deg, #f5d78e 0%, #d4af37 55%, #a8841f 100%)")],
    activaEstilo: "border-color: #7a5c10 !important; color: #2a0614 !important; box-shadow: 0 0 14px rgba(245,215,142,0.45) !important;",
    campoEstilo: "background: #1a0710 !important; border: 1px solid rgba(212,175,55,0.45) !important;",
    extra: (S) => `${en(S, ".tz-stat-chip")}, ${en(S, ".tz-method-total")} { padding-right: 34px !important; }`,
  });

// =====================================================================
// CELULARES Y TECNOLOGÍA — "Circuito" (placa con pistas por las que
// corren pulsos de luz, chips, señal y batería)
// =====================================================================
// Pistas que empalman en los 4 bordes (la trama no muestra cortes).
const PISTAS = "M0 20 H40 L50 30 H120 M20 0 V50 L30 60 V80 L20 90 V120 M60 120 V90 L70 80 H120 M0 80 H10 M0 100 H30 L40 90 V70 M110 100 H120 M90 0 V40 L100 50 H108 M90 110 V120 M60 0 V10";
const pistas = (color, ancho) => `<path d='${PISTAS}' stroke='${color}' stroke-width='${ancho}' fill='none'/>`;
const PADS = [[40, 20], [50, 30], [30, 60], [70, 80], [10, 80], [40, 70], [100, 50], [108, 50], [90, 110], [60, 10], [110, 100], [30, 100]]
  .map(([x, y]) => `<circle cx='${x}' cy='${y}' r='2.6' fill='none' stroke='rgba(56,189,248,0.35)' stroke-width='1.2'/>`)
  .join("");
const CIRCUITO = svg(`<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'>${pistas("rgba(56,189,248,0.16)", 1.6)}${PADS}<rect x='64' y='36' width='16' height='12' rx='1.5' fill='rgba(56,189,248,0.08)' stroke='rgba(56,189,248,0.25)'/></svg>`);
// Mismas pistas + pulsos de luz que corren por ellas (SMIL).
const CIRCUITO_VIVO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'>${pistas("rgba(56,189,248,0.22)", 1.6)}${PADS}<path d='${PISTAS}' stroke='#7dd3fc' stroke-width='2.2' fill='none' stroke-linecap='round' stroke-dasharray='5 75'><animate attributeName='stroke-dashoffset' from='0' to='-160' dur='3.2s' repeatCount='indefinite'/></path><path d='${PISTAS}' stroke='#a78bfa' stroke-width='2' fill='none' stroke-linecap='round' stroke-dasharray='4 116' stroke-dashoffset='40'><animate attributeName='stroke-dashoffset' from='40' to='-200' dur='4.6s' repeatCount='indefinite'/></path></svg>`
);
const CHIP = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 26 26'><g stroke='#7dd3fc' stroke-width='1.4'><path d='M8 1 V5 M13 1 V5 M18 1 V5 M8 21 V25 M13 21 V25 M18 21 V25 M1 8 H5 M1 13 H5 M1 18 H5 M21 8 H25 M21 13 H25 M21 18 H25'/></g><rect x='5' y='5' width='16' height='16' rx='2' fill='#0f1a2b' stroke='#38bdf8' stroke-width='1.2'/><rect x='9' y='9' width='8' height='8' rx='1' fill='#38bdf8' opacity='.35'/></svg>`
);
const BATERIA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 44 22'><rect x='1.5' y='2' width='36' height='18' rx='4' fill='#0b1220' stroke='#e2e8f0' stroke-width='2'/><rect x='38.5' y='7' width='4' height='8' rx='1.5' fill='#e2e8f0'/><g fill='#34d399'><rect x='5' y='5.5' width='6' height='11' rx='1.2'/><rect x='13' y='5.5' width='6' height='11' rx='1.2'/><rect x='21' y='5.5' width='6' height='11' rx='1.2'><animate attributeName='opacity' values='1;0.2;1' dur='1.6s' repeatCount='indefinite'/></rect></g><path d='M31 4 L27 12 H31 L29 19 L35 9 H31 Z' fill='#facc15' stroke='#0b1220' stroke-width='.6'/></svg>`
);
const SENAL = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 22'><g fill='#38bdf8'><rect x='1' y='15' width='4' height='6' rx='1'/><rect x='7' y='11' width='4' height='10' rx='1'/><rect x='13' y='7' width='4' height='14' rx='1'/><rect x='19' y='3' width='4' height='18' rx='1' opacity='.4'/></g><g fill='none' stroke='#a78bfa' stroke-width='2' stroke-linecap='round'><path d='M27 9 Q32 4 37 9'/><path d='M29.5 12.5 Q32 10 34.5 12.5'/></g><circle cx='32' cy='16.5' r='1.8' fill='#a78bfa'/></svg>`
);
const VIDRIO_NEGRO = "linear-gradient(160deg, rgba(30,41,59,0.92) 0%, rgba(11,18,32,0.96) 100%)";

const circuito = (S) =>
  construir(S, {
    raiz: [trama(CIRCUITO, "120px 120px"), capa("radial-gradient(ellipse 900px 420px at 50% -10%, rgba(56,189,248,0.12), transparent 60%)"), capa("linear-gradient(180deg, #08101d 0%, #060b14 100%)")],
    // Cabecera = placa viva: pulsos de luz por las pistas y señal + wifi
    // abajo a la izquierda (la batería cargando va montada en la barra).
    cabecera: [
      capa(SENAL, "left 2.5% bottom 12px", "44px 24px"),
      capa("linear-gradient(90deg, transparent, #38bdf8 20%, #a78bfa 80%, transparent)", "left 0 bottom 0", "100% 2px"),
      trama(CIRCUITO_VIVO, "120px 120px"),
      capa("linear-gradient(180deg, #0b1626 0%, #0a1322 100%)"),
    ],
    cabeceraEstilo: "padding-bottom: 42px !important; border-bottom: none !important; box-shadow: 0 6px 22px rgba(56,189,248,0.18);",
    pie: [capa("linear-gradient(90deg, transparent, #38bdf8 20%, #a78bfa 80%, transparent)", "left 0 top 0", "100% 2px"), trama(CIRCUITO_VIVO, "120px 120px"), capa("linear-gradient(180deg, #0a1322, #060b14)")],
    pieEstilo: "border-top: none !important;",
    boton: [capa("linear-gradient(180deg, rgba(125,211,252,0.18), transparent 60%)"), capa(VIDRIO_NEGRO)],
    botonEstilo: "border: 1px solid rgba(56,189,248,0.7) !important; color: #e0f2fe !important; box-shadow: 0 0 12px rgba(56,189,248,0.25), 0 3px 8px rgba(0,0,0,0.5) !important;",
    botonPieEstilo: "border-radius: 12px !important; border: 1px solid rgba(56,189,248,0.7) !important; color: #e0f2fe !important; box-shadow: 0 0 14px rgba(56,189,248,0.3), 0 4px 10px rgba(0,0,0,0.5) !important;",
    // Paneles de vidrio negro con un chip y pistas en la esquina.
    panel: [capa(CHIP, "right 8px top 8px", "20px 20px"), capa(CIRCUITO, "right -60px bottom -60px", "120px 120px"), capa(VIDRIO_NEGRO)],
    panelEstilo: "border: 1px solid rgba(56,189,248,0.35) !important; box-shadow: inset 0 1px 0 rgba(125,211,252,0.12), 0 8px 18px rgba(0,0,0,0.5) !important;",
    barra: [capa(CIRCUITO, "right -60px bottom -60px", "120px 120px"), capa(VIDRIO_NEGRO)],
    puente: { img: BATERIA, ancho: 50, alto: 25, enCabecera: 12 },
    modal: [capa(CHIP, "right 14px bottom 14px", "24px 24px"), trama(CIRCUITO, "120px 120px"), capa("linear-gradient(170deg, #0f1a2b 0%, #070d18 100%)")],
    modalEstilo: "border: 1px solid rgba(56,189,248,0.55) !important; box-shadow: 0 0 40px rgba(56,189,248,0.15), 0 20px 60px rgba(0,0,0,0.7) !important;",
    tituloEstilo: "color: #e0f2fe !important; border-bottom: 2px solid; border-image: linear-gradient(90deg, #38bdf8, #a78bfa) 1; padding-bottom: 8px;",
    pestana: [capa(VIDRIO_NEGRO)],
    pestanaEstilo: "border: 1px solid rgba(56,189,248,0.4) !important; color: #bae6fd !important;",
    activa: [capa("linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)")],
    activaEstilo: "border-color: #0369a1 !important; color: #06101f !important; box-shadow: 0 0 16px rgba(56,189,248,0.5) !important;",
    campoEstilo: "background: #070d18 !important; border: 1px solid rgba(56,189,248,0.4) !important;",
    extra: (S) => `${en(S, ".tz-stat-chip")}, ${en(S, ".tz-method-total")} { padding-right: 32px !important; }`,
  });

// =====================================================================
// CABINAS E IMPRESIONES — "Imprenta" (claro: papel continuo con
// perforaciones, colores CMYK, marcas de registro, clips)
// =====================================================================
const CMYK = "linear-gradient(90deg, #06b6d4 0 25%, #ec4899 25% 50%, #facc15 50% 75%, #111827 75%)";
const AGUJEROS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='22'><circle cx='8' cy='11' r='3.6' fill='#e7e5e0' stroke='#c9c5bc' stroke-width='1'/></svg>`
);
const REGISTRO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><g stroke='#111827' stroke-width='1.2' fill='none'><circle cx='12' cy='12' r='6'/><path d='M12 1 V23 M1 12 H23'/></g><circle cx='12' cy='12' r='2.4' fill='#111827'/></svg>`
);
const CLIP = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 36'><path d='M5 30 V8 Q5 3 9 3 Q13 3 13 8 V27 Q13 33 8 33 Q3 33 3 27 V12' stroke='#64748b' stroke-width='2.2' fill='none' stroke-linecap='round'/><path d='M5 30 V8 Q5 3 9 3' stroke='#cbd5e1' stroke-width='.8' fill='none'/></svg>`
);
// Semitono CMYK (puntitos que se agrandan hacia un lado).
const SEMITONO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='40'>${Array.from({ length: 16 }, (_, i) =>
    Array.from({ length: 4 }, (_, j) => {
      const r = 0.6 + (i / 15) * 2.6;
      const c = ["#06b6d4", "#ec4899", "#facc15", "#111827"][(i + j) % 4];
      return `<circle cx='${5 + i * 10}' cy='${5 + j * 10}' r='${r.toFixed(2)}' fill='${c}' opacity='.28'/>`;
    }).join("")
  ).join("")}</svg>`
);
const IMPRESORA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 34'><rect x='10' y='2' width='20' height='10' fill='#ffffff' stroke='#94a3b8'/><rect x='2' y='10' width='36' height='14' rx='3' fill='#334155'/><rect x='6' y='14' width='4' height='2' fill='#34d399'/><rect x='9' y='20' width='22' height='12' fill='#ffffff' stroke='#94a3b8'><animate attributeName='height' values='2;12;12;2' keyTimes='0;0.5;0.85;1' dur='3s' repeatCount='indefinite'/></rect><rect x='11' y='24' width='5' height='2' fill='#06b6d4'/><rect x='17' y='24' width='5' height='2' fill='#ec4899'/><rect x='23' y='24' width='5' height='2' fill='#facc15'/></svg>`
);
const PAPEL = "linear-gradient(180deg, #ffffff 0%, #fbfbf8 100%)";
const CUADRICULA = [
  capa("linear-gradient(rgba(6,182,212,0.07) 1px, transparent 1px)", "0 0", "22px 22px", "repeat"),
  capa("linear-gradient(90deg, rgba(6,182,212,0.07) 1px, transparent 1px)", "0 0", "22px 22px", "repeat"),
];
// Esquina doblada (oreja) arriba a la derecha.
const OREJA = "linear-gradient(225deg, #f1f0eb 0 13px, #cfccc3 13px 14px, transparent 14px)";

const imprenta = (S) =>
  construir(S, {
    raiz: [...CUADRICULA, capa("linear-gradient(180deg, #f7f7f4 0%, #efeee9 100%)")],
    // Cabecera = papel continuo: perforaciones a los costados, semitono
    // CMYK, marcas de registro, una impresora imprimiendo y la franja
    // CMYK abajo.
    cabecera: [
      capa(CMYK, "left 0 bottom 0", "100% 6px"),
      capa(IMPRESORA, "left 3.5% bottom 14px", "40px 34px"),
      capa(REGISTRO, "right 3.5% bottom 18px", "22px 22px"),
      capa(AGUJEROS, "left 4px top 0", "16px 22px", "repeat-y"),
      capa(AGUJEROS, "right 4px top 0", "16px 22px", "repeat-y"),
      capa("linear-gradient(90deg, transparent 0 24px, rgba(148,163,184,0.5) 24px 25px, transparent 25px calc(100% - 25px), rgba(148,163,184,0.5) calc(100% - 25px) calc(100% - 24px), transparent calc(100% - 24px))"),
      capa(SEMITONO, "right 30px top 10px", "160px 40px"),
      capa(PAPEL),
    ],
    cabeceraEstilo: "padding-bottom: 46px !important; border-bottom: none !important; box-shadow: 0 6px 16px rgba(15,23,42,0.12);",
    pie: [capa(CMYK, "left 0 top 0", "100% 6px"), capa(AGUJEROS, "left 4px top 0", "16px 22px", "repeat-y"), capa(AGUJEROS, "right 4px top 0", "16px 22px", "repeat-y"), capa(PAPEL)],
    pieEstilo: "border-top: none !important;",
    // Botones de papel con la franja CMYK abajo.
    boton: [capa(CMYK, "left 0 bottom 0", "100% 3px"), capa("linear-gradient(180deg, #ffffff, #f1f5f9)")],
    botonEstilo: "border: 1px solid #cbd5e1 !important; color: #0f172a !important; box-shadow: 0 2px 6px rgba(15,23,42,0.12) !important; font-weight: 800;",
    botonPieEstilo: "border-radius: 8px !important; border: 1px solid #cbd5e1 !important; color: #0f172a !important; box-shadow: 0 3px 8px rgba(15,23,42,0.15) !important; font-weight: 800;",
    // Paneles = hojas con la esquina doblada y un clip.
    panel: [capa(OREJA, "right 0 top 0", "22px 22px"), capa(CLIP, "right 26px top -4px", "12px 28px"), capa(PAPEL)],
    panelEstilo: "border: 1px solid #e2e0d8 !important; box-shadow: 0 1px 0 #d6d3c9, 0 6px 14px rgba(15,23,42,0.10) !important;",
    barra: [capa(PAPEL)],
    puente: { img: CLIP, ancho: 14, alto: 32, enCabecera: 14, x: "right 30px" },
    modal: [capa(REGISTRO, "left 10px bottom 10px", "18px 18px"), capa(REGISTRO, "right 10px bottom 10px", "18px 18px"), capa(CMYK, "left 0 top 0", "100% 5px"), capa(PAPEL)],
    modalEstilo: "border: 1px solid #d6d3c9 !important; box-shadow: 0 20px 60px rgba(15,23,42,0.22) !important;",
    tituloEstilo: "color: #0f172a !important; border-bottom: 2px dashed #94a3b8; padding-bottom: 8px;",
    pestana: [capa("linear-gradient(180deg, #ffffff, #f1f5f9)")],
    pestanaEstilo: "border: 1px solid #cbd5e1 !important; color: #334155 !important;",
    activa: [capa("linear-gradient(180deg, #22d3ee, #0891b2)")],
    activaEstilo: "border-color: #0e7490 !important; color: #ffffff !important; box-shadow: 0 4px 12px rgba(8,145,178,0.35) !important;",
    campoEstilo: "background: #ffffff !important; border: 1px solid #cbd5e1 !important;",
    extra: (S) => `
${en(S, ".tz-header .tz-subtitle")} { color: #0e7490 !important; text-shadow: none !important; }
${en(S, ".tz-header .tz-conn-indicator")} { background: #ffffff !important; box-shadow: 0 2px 6px rgba(15,23,42,0.15); }
${en(S, ".tz-logo")} { filter: drop-shadow(0 4px 10px rgba(15,23,42,0.25)) !important; }
${en(S, ".tz-stat-chip")}, ${en(S, ".tz-method-total")} { padding-right: 40px !important; }`,
  });

// =====================================================================
// REPUESTOS Y LUBRICANTES — "Motor" (fibra de carbono, engranajes que
// giran, aceite que chorrea, bujías y pistones)
// =====================================================================
const engranaje = (color, dur, sentido) =>
  svg(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='-20 -20 40 40'><g><animateTransform attributeName='transform' type='rotate' from='0' to='${sentido * 360}' dur='${dur}s' repeatCount='indefinite'/>${Array.from({ length: 10 }, (_, i) => `<rect x='-3' y='-19' width='6' height='7' rx='1' fill='${color}' transform='rotate(${i * 36})'/>`).join("")}<circle r='13.5' fill='${color}'/><circle r='9' fill='none' stroke='rgba(0,0,0,0.3)' stroke-width='2'/><circle r='4.5' fill='#0b0c0e'/>${Array.from({ length: 5 }, (_, i) => `<circle cx='0' cy='-7' r='1.6' fill='#0b0c0e' transform='rotate(${i * 72})'/>`).join("")}</g></svg>`
  );
const ENGRANAJE = engranaje("#9ca3af", 9, 1);
const ENGRANAJE_ROJO = engranaje("#b91c1c", 6, -1);
const ACEITE = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='18'><defs><linearGradient id='a' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#fbbf24'/><stop offset='1' stop-color='#b45309'/></linearGradient></defs><path d='M0 0 H80 V6 C74 6 74 15 70 15 C66 15 67 7 60 7 C54 7 55 11 49 11 C43 11 44 6 37 6 C31 6 32 17 26 17 C20 17 21 7 14 7 C8 7 6 6 0 6 Z' fill='url(#a)'/><g fill='rgba(255,255,255,0.5)'><ellipse cx='26' cy='13' rx='1.2' ry='2'/><ellipse cx='70' cy='11' rx='1.1' ry='1.8'/></g></svg>`
);
const GOTA_ACEITE = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 32'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#fcd34d'/><stop offset='1' stop-color='#b45309'/></linearGradient></defs><path d='M12 1 C12 1 3 14 3 21 A9 9 0 0 0 21 21 C21 14 12 1 12 1 Z' fill='url(#g)' stroke='#78350f' stroke-width='1'/><ellipse cx='8.5' cy='20' rx='2' ry='3.5' fill='rgba(255,255,255,0.55)'/></svg>`
);
const BUJIA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 36'><rect x='4' y='0' width='4' height='4' rx='1' fill='#cbd5e1'/><path d='M3 4 H9 L10 16 H2 Z' fill='#f8fafc' stroke='#94a3b8' stroke-width='.6'/><path d='M3 7 H9 M3 10 H9 M2.5 13 H9.5' stroke='#cbd5e1' stroke-width='.6'/><path d='M1 16 H11 V21 H1 Z' fill='#9ca3af' stroke='#4b5563' stroke-width='.6'/><rect x='3' y='21' width='6' height='9' fill='#d1d5db'/><path d='M3 23 H9 M3 25 H9 M3 27 H9 M3 29 H9' stroke='#6b7280' stroke-width='.6'/><path d='M6 30 V33 H9' stroke='#6b7280' stroke-width='1.2' fill='none'/></svg>`
);
const CARBONO = "repeating-conic-gradient(from 45deg, #1b1e23 0 25%, #121418 0 50%)";
const BRILLO_CARBONO = "linear-gradient(160deg, rgba(255,255,255,0.07) 0%, transparent 40%, rgba(255,255,255,0.03) 60%, transparent 100%)";

const motor = (S) =>
  construir(S, {
    raiz: [capa("radial-gradient(ellipse 900px 400px at 50% -10%, rgba(239,68,68,0.10), transparent 60%)"), capa("linear-gradient(180deg, rgba(11,12,14,0.55), rgba(11,12,14,0.8))"), capa(CARBONO, "0 0", "10px 10px", "repeat"), capa("#0b0c0e")],
    // Cabecera de fibra de carbono con dos engranajes girando abajo a
    // cada lado y el aceite chorreando por el borde.
    cabecera: [
      capa(ENGRANAJE, "left 2% bottom 14px", "56px 56px"),
      capa(ENGRANAJE_ROJO, "left calc(2% + 46px) bottom 8px", "36px 36px"),
      capa(ENGRANAJE, "right 2% bottom 14px", "56px 56px"),
      capa(ENGRANAJE_ROJO, "right calc(2% + 46px) bottom 8px", "36px 36px"),
      capa(ACEITE, "left 0 bottom 0", "80px 18px", "repeat-x"),
      capa(BRILLO_CARBONO),
      capa(CARBONO, "0 0", "10px 10px", "repeat"),
    ],
    cabeceraEstilo: "padding-bottom: 34px !important; border-bottom: none !important; box-shadow: 0 6px 18px rgba(0,0,0,0.6);",
    pie: [capa(ACEITE, "left 0 top 0", "80px 18px", "repeat-x"), capa(BRILLO_CARBONO), capa(CARBONO, "0 0", "10px 10px", "repeat")],
    pieEstilo: "border-top: none !important; padding-top: 28px !important;",
    boton: [capa("linear-gradient(180deg, rgba(255,255,255,0.2), transparent 55%)"), capa("linear-gradient(180deg, #dc2626, #991b1b)")],
    botonEstilo: "border: 1px solid #450a0a !important; color: #ffffff !important; box-shadow: 0 3px 8px rgba(0,0,0,0.5) !important; text-shadow: 0 1px 1px rgba(0,0,0,0.5); font-weight: 800;",
    botonPieEstilo: "border-radius: 8px !important; border: 1px solid #450a0a !important; color: #ffffff !important; box-shadow: 0 4px 10px rgba(0,0,0,0.55) !important; text-shadow: 0 1px 1px rgba(0,0,0,0.5); font-weight: 800;",
    // Paneles de carbono con franja roja de carrera y una bujía.
    panel: [capa(BUJIA, "right 10px top 6px", "9px 28px"), capa("linear-gradient(180deg, #dc2626, #991b1b)", "left 0 top 0", "4px 100%"), capa(BRILLO_CARBONO), capa("linear-gradient(rgba(18,20,24,0.55), rgba(18,20,24,0.55))"), capa(CARBONO, "0 0", "10px 10px", "repeat")],
    panelEstilo: "border: 1px solid #2a2d33 !important; box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 18px rgba(0,0,0,0.55) !important;",
    barra: [capa(BRILLO_CARBONO), capa("linear-gradient(rgba(18,20,24,0.55), rgba(18,20,24,0.55))"), capa(CARBONO, "0 0", "10px 10px", "repeat")],
    puente: { img: GOTA_ACEITE, ancho: 24, alto: 32, enCabecera: 13, x: "right 12%" },
    modal: [capa(ENGRANAJE, "left 10px bottom 10px", "30px 30px"), capa(ENGRANAJE_ROJO, "right 10px bottom 10px", "26px 26px"), capa(BRILLO_CARBONO), capa("linear-gradient(rgba(18,20,24,0.7), rgba(18,20,24,0.7))"), capa(CARBONO, "0 0", "10px 10px", "repeat")],
    modalEstilo: "border: 1px solid #dc2626 !important; box-shadow: 0 20px 60px rgba(0,0,0,0.75) !important;",
    tituloEstilo: "color: #ffffff !important; font-style: italic; border-bottom: 3px solid #dc2626; padding-bottom: 8px;",
    pestana: [capa(CARBONO, "0 0", "10px 10px", "repeat")],
    pestanaEstilo: "border: 1px solid #3f444d !important; color: #e5e7eb !important;",
    activa: [capa("linear-gradient(180deg, #fbbf24, #d97706)")],
    activaEstilo: "border-color: #78350f !important; color: #1c0f02 !important; box-shadow: 0 0 14px rgba(251,191,36,0.45) !important;",
    campoEstilo: "background: #0b0c0e !important; border: 1px solid #3f444d !important;",
    extra: (S) => `${en(S, ".tz-stat-chip")}, ${en(S, ".tz-method-total")} { padding-right: 28px !important; padding-left: 16px !important; }`,
  });

// =====================================================================
// TALLER MECÁNICO — "Garaje" (pared de herramientas, piso de concreto
// con manchas de aceite, cajón de herramientas rojo y llanta)
// =====================================================================
const PEGBOARD = svg(`<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18'><rect width='18' height='18' fill='#8f7049'/><circle cx='9' cy='9' r='2.1' fill='#3b2a18'/></svg>`);
const llaveInglesa = (x, y, r) =>
  `<g transform='translate(${x} ${y}) rotate(${r})'><rect x='-2.4' y='-2' width='4.8' height='30' rx='2.2' fill='#cbd5e1' stroke='#64748b' stroke-width='.7'/><path d='M-7 -4 A7 7 0 1 1 7 -4 L3 -4 L3 -9 L-3 -9 L-3 -4 Z' fill='#cbd5e1' stroke='#64748b' stroke-width='.7'/><circle cx='0' cy='26' r='4.5' fill='none' stroke='#cbd5e1' stroke-width='2.6'/></g>`;
const destornillador = (x, y, c) =>
  `<g transform='translate(${x} ${y})'><rect x='-3.5' y='0' width='7' height='14' rx='2.5' fill='${c}'/><path d='M-3.5 4 H3.5 M-3.5 8 H3.5' stroke='rgba(0,0,0,0.3)' stroke-width='1'/><rect x='-1' y='14' width='2' height='16' fill='#cbd5e1'/><path d='M-1 30 L0 33 L1 30 Z' fill='#94a3b8'/></g>`;
const martillo = (x, y) =>
  `<g transform='translate(${x} ${y})'><rect x='-2' y='4' width='4' height='28' rx='1.5' fill='#a16207'/><path d='M-10 0 H8 Q11 0 11 3 V6 H-10 Z' fill='#6b7280' stroke='#374151' stroke-width='.7'/><path d='M8 0 Q13 -2 14 3' stroke='#6b7280' stroke-width='2' fill='none'/></g>`;
const alicate = (x, y) =>
  `<g transform='translate(${x} ${y})'><path d='M-2 0 L-3 12 L-6 32 M2 0 L3 12 L6 32' stroke='#9ca3af' stroke-width='2.6' fill='none' stroke-linecap='round'/><path d='M-3.5 16 L-6.5 32 M3.5 16 L6.5 32' stroke='#dc2626' stroke-width='4' stroke-linecap='round'/><circle cx='0' cy='11' r='2' fill='#4b5563'/></g>`;
// Fila de herramientas colgadas de la pared perforada (repeat-x).
const HERRAMIENTAS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='44'>${llaveInglesa(18, 9, 0)}${destornillador(48, 4, "#dc2626")}${martillo(80, 6)}${destornillador(108, 4, "#facc15")}${alicate(136, 4)}${llaveInglesa(168, 9, 0)}<g fill='#3b2a18'><circle cx='18' cy='3' r='1.6'/><circle cx='48' cy='2' r='1.6'/><circle cx='80' cy='3' r='1.6'/><circle cx='108' cy='2' r='1.6'/><circle cx='136' cy='2' r='1.6'/><circle cx='168' cy='3' r='1.6'/></g></svg>`
);
const LLANTA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='-20 -20 40 40'><circle r='19' fill='#1f2937'/><circle r='19' fill='none' stroke='#0b0f14' stroke-width='3.5' stroke-dasharray='3 2.6'/><circle r='11.5' fill='#9ca3af'/><circle r='11.5' fill='none' stroke='#e5e7eb' stroke-width='1'/>${Array.from({ length: 5 }, (_, i) => `<rect x='-1.6' y='-10' width='3.2' height='7' rx='1' fill='#6b7280' transform='rotate(${i * 72})'/>`).join("")}<circle r='3.4' fill='#4b5563'/>${Array.from({ length: 5 }, (_, i) => `<circle cx='0' cy='-5.6' r='1' fill='#e5e7eb' transform='rotate(${i * 72 + 36})'/>`).join("")}</svg>`
);
const LLAVE_ICONO = svg(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 46 18'><g transform='translate(10 9) rotate(-90)'>${llaveInglesa(0, 0, 0)}</g></svg>`);
const MANCHAS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><g fill='rgba(0,0,0,0.32)'><ellipse cx='70' cy='80' rx='46' ry='26' transform='rotate(-14 70 80)'/><ellipse cx='96' cy='96' rx='16' ry='9'/><ellipse cx='240' cy='220' rx='56' ry='30' transform='rotate(20 240 220)'/><ellipse cx='200' cy='250' rx='14' ry='8'/></g><g fill='none' stroke='rgba(120,90,200,0.10)' stroke-width='2'><ellipse cx='70' cy='80' rx='40' ry='21' transform='rotate(-14 70 80)'/><ellipse cx='240' cy='220' rx='49' ry='25' transform='rotate(20 240 220)'/></g></svg>`
);
const HUELLA_LLANTA = "repeating-linear-gradient(90deg, transparent 0 4px, rgba(0,0,0,0.25) 4px 9px)";
const CONCRETO_TALLER = "linear-gradient(180deg, #2a2d31 0%, #202326 100%)";
const CAJON_ROJO = "linear-gradient(180deg, #8b1a1a 0%, #6d1212 100%)";
const MANIJA = "linear-gradient(180deg, #f1f5f9 0%, #94a3b8 50%, #e2e8f0 100%)";

const garaje = (S) =>
  construir(S, {
    raiz: [
      trama(MANCHAS, "320px 320px"),
      capa(HUELLA_LLANTA, "left 12% top 0", "26px 100%"),
      capa(HUELLA_LLANTA, "right 12% top 0", "26px 100%"),
      capa(CONCRETO, "0 0", "70px 70px", "repeat"),
      capa(CONCRETO_TALLER),
    ],
    // Cabecera = pared perforada con herramientas colgadas abajo y un
    // riel cromado.
    cabecera: [
      capa(MANIJA, "left 0 bottom 0", "100% 5px"),
      capa(HERRAMIENTAS, "left 0 bottom 7px", "200px 44px", "repeat-x"),
      capa("linear-gradient(180deg, rgba(20,14,8,0.25), rgba(20,14,8,0.45))"),
      capa(PEGBOARD, "0 0", "18px 18px", "repeat"),
    ],
    cabeceraEstilo: "padding-bottom: 58px !important; border-bottom: none !important; box-shadow: 0 6px 18px rgba(0,0,0,0.55);",
    pie: [capa(MANIJA, "left 0 top 0", "100% 5px"), capa(MANCHAS, "0 0", "320px 320px", "repeat"), capa(CONCRETO, "0 0", "70px 70px", "repeat"), capa(CONCRETO_TALLER)],
    pieEstilo: "border-top: none !important;",
    // Botones = manijas cromadas.
    boton: [capa(MANIJA)],
    botonEstilo: "border: 1px solid #475569 !important; color: #0f172a !important; box-shadow: inset 0 1px 0 #ffffff, 0 3px 8px rgba(0,0,0,0.45) !important; font-weight: 800;",
    botonPieEstilo: "border-radius: 8px !important; border: 1px solid #475569 !important; color: #0f172a !important; box-shadow: inset 0 1px 0 #ffffff, 0 4px 10px rgba(0,0,0,0.5) !important; font-weight: 800;",
    // Paneles = cajones del cajón de herramientas rojo, con manija.
    panel: [capa(LLAVE_ICONO, "right 8px top 8px", "32px 14px"), capa(MANIJA, "left 50% bottom 6px", "40% 4px"), capa("linear-gradient(180deg, rgba(255,255,255,0.10), transparent 30%)"), capa(CAJON_ROJO)],
    panelEstilo: "border: 1px solid #3f0a0a !important; box-shadow: inset 0 0 0 2px rgba(0,0,0,0.25), 0 8px 18px rgba(0,0,0,0.5) !important;",
    barra: [capa("linear-gradient(180deg, rgba(255,255,255,0.10), transparent 30%)"), capa(CAJON_ROJO)],
    puente: { img: LLANTA, ancho: 40, alto: 40, enCabecera: 18 },
    modal: [capa(LLANTA, "right 12px bottom 12px", "30px 30px"), trama(MANCHAS, "320px 320px"), capa("linear-gradient(170deg, #2a1a1a 0%, #171010 100%)")],
    modalEstilo: "border: 2px solid #8b1a1a !important; box-shadow: inset 0 0 0 3px #171010, inset 0 0 0 4px rgba(226,232,240,0.3), 0 20px 60px rgba(0,0,0,0.7) !important;",
    tituloEstilo: "color: #f1f5f9 !important; border-bottom: 3px solid #dc2626; padding-bottom: 8px;",
    pestana: [capa(CAJON_ROJO)],
    pestanaEstilo: "border: 1px solid #3f0a0a !important; color: #fde2e2 !important;",
    activa: [capa(MANIJA)],
    activaEstilo: "border-color: #475569 !important; color: #0f172a !important; box-shadow: 0 0 12px rgba(226,232,240,0.35) !important;",
    campoEstilo: "background: #141618 !important; border: 1px solid #4b5563 !important;",
    extra: (S) => `
${en(S, ".tz-header .tz-subtitle")} { color: #fde68a !important; background: rgba(20,14,8,0.75); padding: 2px 10px; border-radius: 999px; }
${en(S, ".tz-header .tz-conn-indicator")} { background: rgba(20,14,8,0.85) !important; }
${en(S, ".tz-stat-chip")}, ${en(S, ".tz-method-total")} { padding-right: 40px !important; padding-bottom: 16px !important; }`,
  });

// =====================================================================
// LAVADO DE AUTOS — "Espuma" (agua, burbujas que suben, espuma sobre la
// barra, esponja y un auto recién lavado que brilla)
// =====================================================================
const ESPUMA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='90' height='30'><g fill='#f8fdff' stroke='rgba(125,211,252,0.55)' stroke-width='.8'>${[[0, 10, 9], [90, 10, 9], [22, 8, 10], [38, 11, 9], [53, 7, 11], [69, 10, 9], [82, 7, 9]].map(([x, y, r]) => `<circle cx='${x}' cy='${y}' r='${r}'/>`).join("")}${[[14, 21, 5], [30, 23, 4], [46, 20, 6], [62, 24, 4], [77, 21, 5]].map(([x, y, r]) => `<circle cx='${x}' cy='${y}' r='${r}'/>`).join("")}</g><g fill='#f8fdff' opacity='.85'><circle cx='6' cy='27' r='2.4'/><circle cx='40' cy='28' r='2'/><circle cx='70' cy='28' r='2.4'/></g><g fill='rgba(255,255,255,0.95)'><circle cx='19' cy='4' r='2.2'/><circle cx='50' cy='3' r='2.4'/><circle cx='79' cy='4' r='2'/></g></svg>`
);
// Burbujas que suben (SMIL): cada una cruza su baldosa de abajo arriba.
const BURBUJAS_VIVAS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'>${[
    [18, 9, 7, 0],
    [52, 5, 5.5, 1.8],
    [88, 11, 9, 3.4],
    [118, 6, 6, 0.9],
    [36, 4, 4.8, 2.6],
    [104, 8, 8, 4.4],
  ]
    .map(
      ([x, r, dur, delay]) =>
        `<g><animateTransform attributeName='transform' type='translate' values='0 0; 6 -80; -4 -160' dur='${dur}s' begin='-${delay}s' repeatCount='indefinite'/><circle cx='${x}' cy='${140 + r}' r='${r}' fill='rgba(186,230,253,0.10)' stroke='rgba(186,230,253,0.45)' stroke-width='1'/><circle cx='${x - r * 0.35}' cy='${140 + r - r * 0.35}' r='${r * 0.28}' fill='rgba(255,255,255,0.75)'/></g>`
    )
    .join("")}</svg>`
);
const AUTO_BRILLO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 72 34'><path d='M4 24 Q4 17 10 16 L20 15 L28 8 Q31 6 36 6 H48 Q52 6 55 9 L61 15 Q68 16 68 22 V25 H4 Z' fill='#2563eb' stroke='#1e3a8a' stroke-width='1'/><path d='M23 15 L30 9 H40 V15 Z M43 15 V9 H48 Q51 9 53 11 L57 15 Z' fill='#bfdbfe'/><path d='M10 18 H60' stroke='rgba(255,255,255,0.55)' stroke-width='1.6' stroke-linecap='round'/><circle cx='18' cy='25' r='5.5' fill='#111827'/><circle cx='18' cy='25' r='2.4' fill='#cbd5e1'/><circle cx='54' cy='25' r='5.5' fill='#111827'/><circle cx='54' cy='25' r='2.4' fill='#cbd5e1'/>${destello(64, 7, 5, "#ffffff", 1.8, 0)}${destello(26, 4, 3.5, "#ffffff", 2.3, 0.7)}${destello(46, 3, 3, "#fde047", 2, 1.2)}</svg>`
);
const ESPONJA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 22'><rect x='1' y='6' width='28' height='15' rx='4' fill='#facc15' stroke='#a16207' stroke-width='1'/><rect x='1' y='2' width='28' height='6' rx='3' fill='#22c55e' stroke='#15803d' stroke-width='1'/><g fill='#ca8a04'><circle cx='7' cy='12' r='1.4'/><circle cx='14' cy='16' r='1.2'/><circle cx='21' cy='11' r='1.5'/><circle cx='24' cy='17' r='1.1'/><circle cx='10' cy='18' r='1'/></g><g fill='#f8fdff' stroke='rgba(125,211,252,0.6)' stroke-width='.6'><circle cx='26' cy='3' r='3'/><circle cx='21' cy='1.5' r='2'/></g></svg>`
);
const GOTAS_AGUA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><g fill='rgba(186,230,253,0.16)'><path d='M12 8 q-4 6 0 8 q4 -2 0 -8z'/><path d='M44 22 q-3 5 0 6.5 q3 -1.5 0 -6.5z'/><path d='M26 44 q-4 6 0 8 q4 -2 0 -8z'/><path d='M52 50 q-2.5 4 0 5 q2.5 -1 0 -5z'/></g></svg>`
);
const AGUA_LAVADO = "linear-gradient(180deg, #0a2a4a 0%, #062039 55%, #03111f 100%)";
const VIDRIO_MOJADO = "linear-gradient(170deg, rgba(14,58,99,0.88) 0%, rgba(6,30,56,0.94) 100%)";

// Espuma viva (franja montada sobre la unión cabecera/barra): burbujas
// apretadas, sin huecos, que se inflan y desinflan (SMIL). Todas caben
// dentro del dibujo, así ningún borde redondo sale cortado.
const ESPUMA_VIVA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='46'><g fill='#f8fdff' stroke='rgba(125,211,252,0.5)' stroke-width='.8'>${[
    ...[0, 15, 30, 45, 60, 75, 90, 105, 120].map((x, i) => [x, 21, i % 2 ? 12 : 11, 2 + (i % 3) * 0.7, i * 0.3]),
    ...[-7.5, 7.5, 22.5, 37.5, 52.5, 67.5, 82.5, 97.5, 112.5].map((x, i) => [x, 31, 9.5, 2.4 + (i % 2) * 0.8, i * 0.4]),
    ...[8, 38, 68, 98].map((x, i) => [x, 12, 7.5, 2.8, i * 0.5]),
  ]
    .map(([x, y, r, dur, delay]) => `<circle cx='${x}' cy='${y}' r='${r}'><animate attributeName='r' values='${r};${(r * 1.1).toFixed(1)};${r}' dur='${dur.toFixed(1)}s' begin='-${delay.toFixed(1)}s' repeatCount='indefinite'/></circle>`)
    .join("")}</g><g fill='#f8fdff' opacity='.85'>${[10, 33, 57, 81, 104].map((x) => `<circle cx='${x}' cy='42' r='2.6'/>`).join("")}</g><g fill='#ffffff'>${[4, 34, 64, 94].map((x) => `<ellipse cx='${x}' cy='9' rx='2.4' ry='1.4'/>`).join("")}</g></svg>`
);
// Auto de perfil mirando a la izquierda (avanza hacia la izquierda).
const autoPerfil = `<g transform='translate(90 0) scale(-1.25 1.25)'><path d='M4 24 Q4 17 10 16 L20 15 L28 8 Q31 6 36 6 H48 Q52 6 55 9 L61 15 Q68 16 68 22 V25 H4 Z' fill='#2563eb' stroke='#1e3a8a' stroke-width='1'/><path d='M23 15 L30 9 H40 V15 Z M43 15 V9 H48 Q51 9 53 11 L57 15 Z' fill='#bfdbfe'/><path d='M10 18 H60' stroke='rgba(255,255,255,0.55)' stroke-width='1.6' stroke-linecap='round'/><circle cx='18' cy='25' r='5.5' fill='#111827'/><circle cx='18' cy='25' r='2.4' fill='#cbd5e1'/><circle cx='54' cy='25' r='5.5' fill='#111827'/><circle cx='54' cy='25' r='2.4' fill='#cbd5e1'/></g>`;
// La escena del lavado (dura 14 s y se repite): el auto entra SUCIO por
// la derecha perseguido por la esponja; a mitad de camino lo alcanza,
// los dos van a media velocidad mientras la esponja tiembla limpiando,
// estalla un poco de espuma y el auto sale limpio con estrellitas.
const LAVADO_T = "dur='14s' repeatCount='indefinite'";
const LAVADO_AUTO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='82'><svg x='105%' y='27' width='90' height='46' overflow='visible'><animate attributeName='x' values='105%;52%;34%;-30%;-30%' keyTimes='0;0.35;0.62;0.85;1' ${LAVADO_T}/>${autoPerfil}<g fill='#7c5a3a' opacity='.85'><animate attributeName='opacity' values='.85;.85;0;0;.85' keyTimes='0;0.5;0.6;0.99;1' ${LAVADO_T}/><ellipse cx='26' cy='24' rx='7' ry='3.5'/><ellipse cx='50' cy='27' rx='9' ry='3'/><ellipse cx='70' cy='22' rx='5' ry='3'/><ellipse cx='40' cy='12' rx='5' ry='2'/><circle cx='15' cy='29' r='2.2'/><circle cx='80' cy='28' r='2'/></g><g><animateTransform attributeName='transform' type='translate' values='230 -4;72 -4;30 -4;62 -4;26 -4;58 -4;40 -4;40 -4;230 -4' keyTimes='0;0.35;0.4;0.45;0.5;0.55;0.6;0.99;1' ${LAVADO_T}/><g><animate attributeName='opacity' values='1;1;0;0;1' keyTimes='0;0.6;0.66;0.99;1' ${LAVADO_T}/><g><animateTransform attributeName='transform' type='rotate' values='0 15 11;0 15 11;-14 15 11;12 15 11;-14 15 11;12 15 11;-12 15 11;0 15 11;0 15 11' keyTimes='0;0.35;0.39;0.43;0.47;0.51;0.55;0.6;1' ${LAVADO_T}/><rect x='1' y='6' width='28' height='15' rx='4' fill='#facc15' stroke='#a16207' stroke-width='1'/><rect x='1' y='2' width='28' height='6' rx='3' fill='#22c55e' stroke='#15803d' stroke-width='1'/><g fill='#ca8a04'><circle cx='7' cy='12' r='1.4'/><circle cx='14' cy='16' r='1.2'/><circle cx='21' cy='11' r='1.5'/></g></g></g></g><g fill='#f8fdff' stroke='rgba(125,211,252,0.7)' stroke-width='.8'>${[
    [45, 18, 0],
    [25, 22, 0.01],
    [66, 20, 0.02],
    [38, 6, 0.015],
    [56, 8, 0.025],
    [12, 14, 0.03],
    [80, 12, 0.02],
  ]
    .map(([cx, cy, d]) => {
      const a = (0.56 + d).toFixed(3);
      const b = (0.6 + d).toFixed(3);
      const c = (0.68 + d).toFixed(3);
      return `<circle cx='${cx}' cy='${cy}' r='0' opacity='0'><animate attributeName='r' values='0;0;9;11;0' keyTimes='0;${a};${b};${c};1' ${LAVADO_T}/><animate attributeName='opacity' values='0;0;1;0;0' keyTimes='0;${a};${b};${c};1' ${LAVADO_T}/></circle>`;
    })
    .join("")}</g><g opacity='0'><animate attributeName='opacity' values='0;0;1;1;0;0' keyTimes='0;0.6;0.63;0.82;0.86;1' ${LAVADO_T}/>${destello(8, 2, 6, "#ffffff", 1.2, 0)}${destello(48, -4, 5, "#fde047", 1, 0.3)}${destello(82, 4, 6, "#ffffff", 1.4, 0.6)}${destello(30, 12, 3.5, "#ffffff", 0.9, 0.2)}</g></svg></svg>`
);

const espuma = (S) =>
  construir(S, {
    // En la app real el agua y las burbujas las dibuja la ESCENA (fija,
    // detrás de todo): suben de verdad desde abajo de la pantalla y se
    // esconden detrás de la barra de filtros. Esto queda para la vista
    // previa del Perfil.
    raiz: [trama(GOTAS_AGUA, "60px 60px"), capa(AGUA_LAVADO)],
    cabecera: [capa(LAVADO_AUTO, "left 0 bottom 0", "100% 82px"), capa("radial-gradient(ellipse 70% 60% at 50% 0%, rgba(186,230,253,0.18), transparent 70%)"), capa("linear-gradient(180deg, #0f4c81 0%, #0a3561 100%)")],
    cabeceraEstilo: "padding-bottom: 78px !important; border-bottom: none !important;",
    pie: [capa(ESPUMA_VIVA, "left 0 top -6px", "120px 46px", "repeat-x"), trama(GOTAS_AGUA, "60px 60px"), capa("linear-gradient(180deg, #0a3561, #03111f)")],
    pieEstilo: "border-top: none !important; padding-top: 44px !important;",
    boton: [capa("linear-gradient(180deg, rgba(255,255,255,0.4), transparent 50%)"), capa("linear-gradient(180deg, #38bdf8, #0284c7)")],
    botonEstilo: "border: 1px solid #075985 !important; color: #ffffff !important; box-shadow: 0 3px 10px rgba(2,132,199,0.4) !important; text-shadow: 0 1px 1px rgba(0,0,0,0.35); border-radius: 999px !important;",
    botonPieEstilo: "border-radius: 999px !important; border: 1px solid #075985 !important; color: #ffffff !important; box-shadow: 0 4px 12px rgba(2,132,199,0.45) !important; text-shadow: 0 1px 1px rgba(0,0,0,0.35);",
    panel: [capa(ESPONJA, "right 8px top 7px", "24px 18px"), trama(GOTAS_AGUA, "60px 60px"), capa(VIDRIO_MOJADO)],
    panelEstilo: "border: 1px solid rgba(125,211,252,0.4) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,0.15), 0 8px 18px rgba(0,0,0,0.45) !important;",
    modal: [capa(ESPONJA, "right 12px bottom 12px", "30px 22px"), trama(GOTAS_AGUA, "60px 60px"), capa("linear-gradient(170deg, #0e3a63 0%, #04182c 100%)")],
    modalEstilo: "border: 1px solid rgba(125,211,252,0.55) !important; box-shadow: 0 20px 60px rgba(0,0,0,0.6) !important;",
    tituloEstilo: `color: #f0f9ff !important; background: ${ESPUMA_VIVA} left 0 bottom 0 / 54px 21px repeat-x !important; padding-bottom: 24px;`,
    pestana: [capa("linear-gradient(180deg, #0f4c81, #0a3561)")],
    pestanaEstilo: "border: 1px solid rgba(125,211,252,0.4) !important; color: #e0f2fe !important;",
    activa: [capa("linear-gradient(180deg, #f0abfc, #d946ef)")],
    activaEstilo: "border-color: #86198f !important; color: #ffffff !important; box-shadow: 0 0 14px rgba(240,171,252,0.5) !important;",
    campoEstilo: "background: #04182c !important; border: 1px solid rgba(125,211,252,0.4) !important;",
    extra: (S) => `${en(S, ".tz-stat-chip")}, ${en(S, ".tz-method-total")} { padding-right: 36px !important; }
${barraPropia(S, [trama(GOTAS_AGUA, "60px 60px"), capa(VIDRIO_MOJADO)], "padding-top: 34px !important;")}
${montado(S, { img: ESPUMA_VIVA, tam: "120px 46px", arriba: 22, alto: 46 })}
/* ---- Escena (solo en la app real; TemaNegocio la dibuja) ---- */
${en(S, ".tz-escena")} { position: fixed; inset: 0; z-index: -1; pointer-events: none; overflow: hidden; }
${en(S, ".tz-esc-agua")} { position: absolute; inset: 0; background: radial-gradient(ellipse 900px 420px at 50% -10%, rgba(125,211,252,0.14), transparent 60%), ${AGUA_LAVADO}; }
${en(S, ".tz-esc-burbuja")} {
  position: absolute; bottom: -40px; left: var(--x);
  width: var(--tam); height: var(--tam); border-radius: 50%;
  background: radial-gradient(circle at 32% 30%, rgba(255,255,255,0.95) 0 13%, rgba(186,230,253,0.28) 16% 55%, rgba(186,230,253,0.10) 72%, rgba(255,255,255,0.55) 100%);
  box-shadow: inset 0 0 3px rgba(255,255,255,0.6);
  animation: tz-esp-subir var(--dur) linear var(--delay) infinite;
  will-change: transform;
}
@keyframes tz-esp-subir {
  0% { transform: translate(0, 0); }
  25% { transform: translate(12px, -28vh); }
  50% { transform: translate(-10px, -56vh); }
  75% { transform: translate(9px, -84vh); }
  100% { transform: translate(0, -118vh); }
}`,
  });

const ESCENA_ESPUMA = [
  { clase: "tz-esc-agua" },
  ...[
    ["4%", "14px", "13s", "-1s"],
    ["10%", "22px", "17s", "-9s"],
    ["17%", "9px", "11s", "-4s"],
    ["25%", "28px", "19s", "-14s"],
    ["33%", "12px", "12s", "-7s"],
    ["41%", "18px", "15s", "-2s"],
    ["49%", "10px", "10s", "-6s"],
    ["57%", "24px", "18s", "-11s"],
    ["64%", "13px", "13s", "-3s"],
    ["72%", "20px", "16s", "-12s"],
    ["79%", "9px", "11s", "-8s"],
    ["86%", "26px", "20s", "-5s"],
    ["93%", "15px", "14s", "-10s"],
    ["97%", "11px", "12s", "-1.5s"],
  ].map(([x, tam, dur, delay]) => ({ clase: "tz-esc-burbuja", estilo: { "--x": x, "--tam": tam, "--dur": dur, "--delay": delay } })),
];

// =====================================================================
// LIBRERÍA Y BAZAR — "Cuaderno" (claro: hoja rayada con margen, espiral,
// lápices de colores sobre la barra, cinta adhesiva y clips)
// =====================================================================
const RENGLONES = "repeating-linear-gradient(180deg, transparent 0 27px, rgba(59,130,246,0.22) 27px 28px)";
const MARGEN = "linear-gradient(90deg, transparent 0 46px, rgba(239,68,68,0.5) 46px 48px, transparent 48px)";
const HOJA_PAPEL = "linear-gradient(180deg, #fffef9 0%, #fbf9ef 100%)";
const ESPIRAL = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='24'><circle cx='14' cy='17' r='3.6' fill='#d6d3c8'/><path d='M11 17 Q9 3 14 1 Q19 3 17 17' stroke='#64748b' stroke-width='2.4' fill='none' stroke-linecap='round'/><path d='M12 15 Q11 5 14 3' stroke='#e2e8f0' stroke-width='.9' fill='none'/></svg>`
);
// Lápices de colores con la punta hacia abajo (franja repeat-x).
const LAPICES = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='42'>${[
    ["#ef4444", 0],
    ["#f97316", 5],
    ["#facc15", 2],
    ["#22c55e", 6],
    ["#3b82f6", 1],
    ["#a855f7", 4],
  ]
    .map(([c, dy], i) => {
      const x = 4 + i * 20;
      return `<g transform='translate(${x} ${dy - 6})'><rect x='0' y='0' width='12' height='28' fill='${c}'/><rect x='4' y='0' width='4' height='28' fill='rgba(255,255,255,0.22)'/><path d='M0 28 L6 40 L12 28 Z' fill='#f5d0a9'/><path d='M3.6 35.2 L6 40 L8.4 35.2 Z' fill='${c}'/></g>`;
    })
    .join("")}</svg>`
);
const WASHI = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 44 16'><g transform='rotate(-8 22 8)'><path d='M3 3 L5 5 L3 7 L5 9 L3 11 L5 13 H39 L41 11 L39 9 L41 7 L39 5 L41 3 Z' fill='rgba(244,114,182,0.75)'/><path d='M10 3 V13 M18 3 V13 M26 3 V13 M34 3 V13' stroke='rgba(255,255,255,0.55)' stroke-width='2.5'/></g></svg>`
);
const CLIPS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='72' height='34'>${[["#ef4444", 6], ["#3b82f6", 24], ["#22c55e", 42], ["#facc15", 60]]
    .map(([c, x], i) => `<g transform='translate(${x} ${i % 2 ? 4 : 1}) rotate(${i % 2 ? 8 : -6})'><path d='M3 20 V5 Q3 1 6 1 Q9 1 9 5 V18 Q9 22 6 22 Q2 22 2 18 V8' stroke='${c}' stroke-width='1.8' fill='none' stroke-linecap='round'/></g>`)
    .join("")}</svg>`
);
const KRAFT = "linear-gradient(180deg, #d1a777 0%, #b88b5a 100%)";

// Lápices cortos acostados dentro de la barra de filtros.
const LAPICES_CORTOS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='28'>${[
    ["#ef4444", 2],
    ["#f97316", 4],
    ["#facc15", 1],
    ["#22c55e", 5],
    ["#3b82f6", 0],
    ["#a855f7", 3],
  ]
    .map(([c, dy], i) => {
      const x = 4 + i * 20;
      return `<g transform='translate(${x} ${dy})'><rect x='0' y='0' width='12' height='14' fill='${c}'/><rect x='4' y='0' width='4' height='14' fill='rgba(255,255,255,0.22)'/><rect x='0' y='0' width='12' height='2.5' fill='rgba(0,0,0,0.15)'/><path d='M0 14 L6 22 L12 14 Z' fill='#f5d0a9'/><path d='M3.8 19 L6 22 L8.2 19 Z' fill='${c}'/></g>`;
    })
    .join("")}</svg>`
);
// Útiles que caen por el fondo (escena).
const UTIL_LAPIZ = svg(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 12'><rect x='8' y='1' width='46' height='10' fill='#facc15' stroke='#a16207' stroke-width='.8'/><rect x='54' y='1' width='8' height='10' rx='1.5' fill='#f9a8d4'/><rect x='51' y='1' width='3' height='10' fill='#cbd5e1'/><path d='M8 1 L0 6 L8 11 Z' fill='#f5d0a9'/><path d='M3 4.2 L0 6 L3 7.8 Z' fill='#1f2937'/></svg>`);
const UTIL_CUADERNO = svg(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 34 42'><rect x='4' y='1' width='29' height='40' rx='2' fill='#3b82f6' stroke='#1e40af' stroke-width='1'/><rect x='12' y='10' width='16' height='8' rx='1' fill='#ffffff'/>${[5, 11, 17, 23, 29, 35].map((y) => `<circle cx='4' cy='${y}' r='2.4' fill='none' stroke='#94a3b8' stroke-width='1.4'/>`).join("")}</svg>`);
const UTIL_CARTUCHERA = svg(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 56 24'><rect x='1' y='3' width='54' height='20' rx='9' fill='#ec4899' stroke='#9d174d' stroke-width='1'/><path d='M8 8 H48' stroke='#1f2937' stroke-width='1.6' stroke-dasharray='2 1.4'/><rect x='44' y='5' width='6' height='5' rx='1' fill='#cbd5e1'/><circle cx='18' cy='15' r='3' fill='#fde047'/><circle cx='30' cy='16' r='2.4' fill='#a5f3fc'/></svg>`);
const UTIL_REGLA = svg(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 72 14'><rect x='1' y='1' width='70' height='12' rx='1.5' fill='rgba(186,230,253,0.85)' stroke='#0284c7' stroke-width='.8'/>${Array.from({ length: 14 }, (_, i) => `<path d='M${5 + i * 5} 1 V${i % 2 ? 4.5 : 7}' stroke='#0369a1' stroke-width='.8'/>`).join("")}</svg>`);
const UTIL_PLUMON = svg(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 52 14'><rect x='14' y='2' width='36' height='10' rx='3' fill='#f8fafc' stroke='#64748b' stroke-width='.8'/><rect x='30' y='2' width='8' height='10' fill='#22c55e'/><rect x='4' y='2' width='12' height='10' rx='2' fill='#22c55e' stroke='#15803d' stroke-width='.8'/><path d='M4 5 L0 7 L4 9 Z' fill='#15803d'/></svg>`);
const UTIL_BORRADOR = svg(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 16'><rect x='1' y='2' width='30' height='12' rx='2.5' fill='#fda4af' stroke='#e11d48' stroke-width='.8'/><rect x='17' y='2' width='14' height='12' rx='2' fill='#60a5fa'/></svg>`);
const UTIL_PELOTA = svg(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='-12 -12 24 24'><circle r='11' fill='#ffffff' stroke='#1f2937' stroke-width='.8'/><path d='M0 -11 A11 11 0 0 1 9.5 -5.5 L0 0 Z' fill='#ef4444'/><path d='M9.5 5.5 A11 11 0 0 1 0 11 L0 0 Z' fill='#3b82f6'/><path d='M-9.5 5.5 A11 11 0 0 1 -9.5 -5.5 L0 0 Z' fill='#facc15'/><circle r='2.2' fill='#22c55e'/></svg>`);
const UTIL_ESTRELLA = svg(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M12 1 l3.2 6.6 7.3 1 -5.3 5.1 1.3 7.2 -6.5-3.4 -6.5 3.4 1.3-7.2 -5.3-5.1 7.3-1z' fill='#facc15' stroke='#ca8a04' stroke-width='1'/></svg>`);

const cuaderno = (S) =>
  construir(S, {
    // En la app real la hoja y los útiles que caen los dibuja la ESCENA.
    raiz: [capa(MARGEN), capa(RENGLONES), capa(HOJA_PAPEL)],
    cabecera: [capa(ESPIRAL, "left 0 top 0", "28px 24px", "repeat-x"), capa(MARGEN), capa(RENGLONES), capa(HOJA_PAPEL)],
    cabeceraEstilo: "padding-top: 32px !important; border-bottom: 2px solid #bfdbfe !important; box-shadow: 0 6px 16px rgba(30,41,59,0.10);",
    // Pie de cartón con clips (el dibujo es más alto: ningún clip se corta).
    pie: [capa(CLIPS, "left 0 top 4px", "72px 34px", "repeat-x"), capa(KRAFT)],
    pieEstilo: "border-top: 3px solid #8a6238 !important; padding-top: 44px !important;",
    boton: [capa("linear-gradient(180deg, rgba(255,255,255,0.35), transparent 55%)"), capa("linear-gradient(180deg, #fde047, #facc15)")],
    botonEstilo: "border: 1px solid #a16207 !important; color: #1f2937 !important; box-shadow: 0 2px 6px rgba(161,98,7,0.25) !important; font-weight: 800;",
    botonPieEstilo: "border-radius: 8px !important; border: 1px solid #a16207 !important; color: #1f2937 !important; box-shadow: 0 3px 8px rgba(80,50,10,0.3) !important; font-weight: 800;",
    panel: [capa(WASHI, "right 6px top -2px", "40px 15px"), capa(RENGLONES), capa(HOJA_PAPEL)],
    panelEstilo: "border: 1px solid #e7e2cf !important; box-shadow: 0 1px 0 #ddd6bd, 0 6px 14px rgba(30,41,59,0.10) !important;",
    modal: [capa(MARGEN), capa(RENGLONES), capa(HOJA_PAPEL)],
    modalEstilo: "border: 1px solid #e7e2cf !important; box-shadow: 0 20px 60px rgba(30,41,59,0.22) !important;",
    tituloEstilo: "color: #1e3a8a !important; border-bottom: 2px solid rgba(239,68,68,0.55); padding-bottom: 8px;",
    pestana: [capa("linear-gradient(180deg, #ffffff, #f5f3ea)")],
    pestanaEstilo: "border: 1px solid #d6d0b8 !important; color: #334155 !important;",
    activa: [capa("linear-gradient(180deg, #3b82f6, #1d4ed8)")],
    activaEstilo: "border-color: #1e3a8a !important; color: #ffffff !important; box-shadow: 0 4px 12px rgba(29,78,216,0.3) !important;",
    campoEstilo: "background: #ffffff !important; border: 1px solid #d6d0b8 !important;",
    extra: (S) => `
${en(S, ".tz-header .tz-subtitle")} { color: #1d4ed8 !important; text-shadow: none !important; }
${en(S, ".tz-header .tz-conn-indicator")} { background: #ffffff !important; box-shadow: 0 2px 6px rgba(30,41,59,0.15); }
${en(S, ".tz-logo")} { filter: drop-shadow(0 4px 10px rgba(30,41,59,0.25)) !important; }
${en(S, ".tz-stat-chip")}, ${en(S, ".tz-method-total")} { padding-top: 14px !important; }
/* Los lápices van acostados DENTRO de la barra (más alta arriba). */
${barraPropia(S, [capa(LAPICES_CORTOS, "left 0 top 8px", "120px 28px", "repeat-x"), capa(HOJA_PAPEL)], "padding-top: 46px !important;")}
/* ---- Escena: hoja + útiles que caen de vez en cuando ---- */
${en(S, ".tz-escena")} { position: fixed; inset: 0; z-index: -1; pointer-events: none; overflow: hidden; }
${en(S, ".tz-esc-hoja")} { position: absolute; inset: 0; background: ${MARGEN}, ${RENGLONES}, ${HOJA_PAPEL}; }
${en(S, ".tz-esc-util")} {
  position: absolute; top: -70px; left: var(--x);
  width: var(--w); height: var(--h);
  background: var(--img) center / contain no-repeat;
  opacity: 0.9;
  animation: tz-cua-caer var(--dur) linear var(--delay) infinite;
  will-change: transform;
}
@keyframes tz-cua-caer {
  0% { transform: translate(0, 0) rotate(0deg); }
  72% { transform: translate(var(--dx), 118vh) rotate(var(--giro)); }
  100% { transform: translate(var(--dx), 118vh) rotate(var(--giro)); }
}`,
  });

// Caen pocos a la vez (cada uno cae y luego espera un rato fuera).
const ESCENA_CUADERNO = [
  { clase: "tz-esc-hoja" },
  ...[
    ["6%", UTIL_LAPIZ, "54px", "11px", "26s", "-3s", "30px", "220deg"],
    ["18%", UTIL_CUADERNO, "28px", "35px", "30s", "-16s", "-20px", "-140deg"],
    ["31%", UTIL_REGLA, "60px", "12px", "24s", "-9s", "24px", "180deg"],
    ["44%", UTIL_BORRADOR, "26px", "13px", "28s", "-21s", "-16px", "260deg"],
    ["57%", UTIL_CARTUCHERA, "46px", "20px", "32s", "-6s", "18px", "-120deg"],
    ["69%", UTIL_PLUMON, "44px", "12px", "27s", "-13s", "-26px", "200deg"],
    ["80%", UTIL_PELOTA, "20px", "20px", "25s", "-19s", "14px", "360deg"],
    ["91%", UTIL_ESTRELLA, "20px", "20px", "29s", "-1s", "-18px", "-300deg"],
  ].map(([x, img, w, h, dur, delay, dx, giro]) => ({
    clase: "tz-esc-util",
    estilo: { "--x": x, "--img": img, "--w": w, "--h": h, "--dur": dur, "--delay": delay, "--dx": dx, "--giro": giro },
  })),
];

// =====================================================================
// JUGUETERÍA — "Bloques" (claro: cielo con cometas, bloques de
// construcción de colores, pelotas y confeti)
// =====================================================================
const bloque = (x, c, oscuro) =>
  `<g transform='translate(${x} 0)'><rect x='2' y='1' width='9' height='8' rx='2' fill='${c}' stroke='${oscuro}' stroke-width='.8'/><rect x='21' y='1' width='9' height='8' rx='2' fill='${c}' stroke='${oscuro}' stroke-width='.8'/><rect x='0' y='7' width='32' height='23' rx='2.5' fill='${c}' stroke='${oscuro}' stroke-width='1'/><rect x='3' y='3' width='4' height='1.6' rx='.8' fill='rgba(255,255,255,0.6)'/><rect x='22' y='3' width='4' height='1.6' rx='.8' fill='rgba(255,255,255,0.6)'/><rect x='2.5' y='10' width='27' height='3' rx='1.5' fill='rgba(255,255,255,0.3)'/></g>`;
const LADRILLOS_JUGUETE = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='30'>${bloque(0, "#ef4444", "#991b1b")}${bloque(32, "#facc15", "#a16207")}${bloque(64, "#3b82f6", "#1e40af")}${bloque(96, "#22c55e", "#15803d")}</svg>`
);
const MURO_JUGUETE = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='46'>${bloque(0, "#3b82f6", "#1e40af")}${bloque(32, "#ef4444", "#991b1b")}${bloque(64, "#22c55e", "#15803d")}${bloque(96, "#facc15", "#a16207")}<g transform='translate(-16 23)'>${bloque(0, "#facc15", "#a16207")}${bloque(32, "#3b82f6", "#1e40af")}${bloque(64, "#ef4444", "#991b1b")}${bloque(96, "#22c55e", "#15803d")}${bloque(128, "#facc15", "#a16207")}</g></svg>`
);
const cometa = (a, b, c) =>
  svg(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 70'><g><animateTransform attributeName='transform' type='rotate' values='-7 20 20; 7 20 20; -7 20 20' dur='4s' repeatCount='indefinite'/><path d='M20 2 L36 20 L20 40 L4 20 Z' fill='${a}' stroke='#1f2937' stroke-width='1'/><path d='M20 2 L36 20 L20 20 Z' fill='${b}'/><path d='M4 20 L20 40 L20 20 Z' fill='${b}'/><path d='M20 2 V40 M4 20 H36' stroke='#1f2937' stroke-width='.8'/><path d='M20 40 Q14 48 20 54 Q26 60 20 68' stroke='#1f2937' stroke-width='1' fill='none'/><g fill='${c}'><path d='M17 47 L20 45 L23 47 L20 49 Z'/><path d='M17 57 L20 55 L23 57 L20 59 Z'/></g></g></svg>`
  );
const COMETA_ROJA = cometa("#ef4444", "#facc15", "#3b82f6");
const COMETA_AZUL = cometa("#3b82f6", "#22c55e", "#ef4444");
const PELOTA_PLAYA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='-12 -12 24 24'><circle r='11' fill='#ffffff' stroke='#1f2937' stroke-width='.8'/><path d='M0 -11 A11 11 0 0 1 9.5 -5.5 L0 0 Z' fill='#ef4444'/><path d='M9.5 5.5 A11 11 0 0 1 0 11 L0 0 Z' fill='#3b82f6'/><path d='M-9.5 5.5 A11 11 0 0 1 -9.5 -5.5 L0 0 Z' fill='#facc15'/><circle r='2.2' fill='#22c55e'/><ellipse cx='-4' cy='-5' rx='2.5' ry='1.4' fill='rgba(255,255,255,0.7)'/></svg>`
);
const CONFETI_JUGUETES = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='110' height='110'><g opacity='.35'><circle cx='14' cy='18' r='4' fill='#ef4444'/><path d='M60 10 L66 22 H54 Z' fill='#3b82f6'/><rect x='88' y='40' width='8' height='8' rx='1.5' fill='#22c55e' transform='rotate(20 92 44)'/><path d='M30 70 l2.4 5 5.4.6-4 3.7 1.1 5.3-4.9-2.7-4.9 2.7 1.1-5.3-4-3.7 5.4-.6z' fill='#facc15'/><circle cx='86' cy='92' r='3.5' fill='#a855f7'/><path d='M8 96 Q14 90 20 96' stroke='#f97316' stroke-width='3' fill='none' stroke-linecap='round'/></g></svg>`
);
const CIELO_JUGUETE = "linear-gradient(180deg, #7dd3fc 0%, #bae6fd 55%, #e0f2fe 100%)";

// Cielo vivo de la cabecera (SMIL, a todo el ancho): nubes que avanzan
// lento y cometas que vuelan por el cielo a distintas distancias.
const cometaMarca = (a, b, c) =>
  `<g><animateTransform attributeName='transform' type='rotate' values='-7 20 20; 7 20 20; -7 20 20' dur='4s' repeatCount='indefinite'/><path d='M20 2 L36 20 L20 40 L4 20 Z' fill='${a}' stroke='#1f2937' stroke-width='1'/><path d='M20 2 L36 20 L20 20 Z' fill='${b}'/><path d='M4 20 L20 40 L20 20 Z' fill='${b}'/><path d='M20 2 V40 M4 20 H36' stroke='#1f2937' stroke-width='.8'/><path d='M20 40 Q14 48 20 54 Q26 60 20 68' stroke='#1f2937' stroke-width='1' fill='none'/><g fill='${c}'><path d='M17 47 L20 45 L23 47 L20 49 Z'/><path d='M17 57 L20 55 L23 57 L20 59 Z'/></g></g>`;
const nubeMarca = `<g fill='#ffffff'><ellipse cx='60' cy='30' rx='42' ry='13'/><ellipse cx='42' cy='22' rx='20' ry='14'/><ellipse cx='70' cy='16' rx='24' ry='16'/></g>`;
const CIELO_VIVO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'>${[
    ["4%", 120, 0.95, 95, 10],
    ["14%", 90, 0.8, 130, 70],
    ["26%", 150, 0.9, 110, 40],
    ["40%", 70, 0.65, 150, 100],
  ]
    .map(
      ([y, w, op, dur, delay]) =>
        `<svg x='-20%' y='${y}' width='${w}' height='${(w * 0.4).toFixed(0)}' viewBox='0 0 120 46' opacity='${op}' overflow='visible'><animate attributeName='x' values='-20%;105%' dur='${dur}s' begin='-${delay}s' repeatCount='indefinite'/>${nubeMarca}</svg>`
    )
    .join("")}${[
    ["#ef4444", "#facc15", "#3b82f6", 62, 1, 30, "6%;28%;52%;74%;88%;62%;34%;6%", "30%;14%;34%;12%;36%;20%;40%;30%"],
    ["#3b82f6", "#22c55e", "#ef4444", 44, 0.85, 38, "84%;62%;40%;18%;8%;30%;60%;84%", "10%;26%;8%;24%;10%;30%;14%;10%"],
    ["#a855f7", "#f97316", "#facc15", 28, 0.65, 46, "46%;70%;90%;66%;36%;14%;24%;46%", "6%;16%;4%;20%;8%;14%;4%;6%"],
  ]
    .map(
      ([a, b, c, w, op, dur, xs, ys]) =>
        `<svg x='0' y='0' width='${w}' height='${(w * 1.75).toFixed(0)}' viewBox='0 0 40 70' opacity='${op}' overflow='visible'><animate attributeName='x' values='${xs}' dur='${dur}s' repeatCount='indefinite' calcMode='spline' keySplines='${Array(7).fill(".45 0 .55 1").join(";")}'/><animate attributeName='y' values='${ys}' dur='${dur}s' repeatCount='indefinite' calcMode='spline' keySplines='${Array(7).fill(".45 0 .55 1").join(";")}'/>${cometaMarca(a, b, c)}</svg>`
    )
    .join("")}</svg>`
);

const bloques = (S) =>
  construir(S, {
    raiz: [trama(CONFETI_JUGUETES, "110px 110px"), capa("linear-gradient(180deg, #fffdf5 0%, #fff4dc 100%)")],
    // Cabecera = cielo vivo (nubes y cometas en movimiento) y una fila de
    // bloques abajo, montada sobre la barra de filtros.
    cabecera: [capa(LADRILLOS_JUGUETE, "left 0 bottom 0", "128px 30px", "repeat-x"), capa(CIELO_VIVO, "0 0", "100% 100%"), capa(CIELO_JUGUETE)],
    cabeceraEstilo: "padding-bottom: 44px !important; border-bottom: none !important;",
    borde: { enCabecera: 15, rellenoCabecera: 30 },
    pie: [capa(MURO_JUGUETE, "0 0", "128px 46px", "repeat")],
    pieEstilo: "border-top: none !important;",
    boton: [capa("linear-gradient(180deg, rgba(255,255,255,0.35), transparent 50%)"), capa("linear-gradient(180deg, #ef4444, #dc2626)")],
    botonEstilo: "border: 1px solid #991b1b !important; color: #ffffff !important; box-shadow: 0 3px 0 #991b1b, 0 5px 10px rgba(153,27,27,0.25) !important; text-shadow: 0 1px 1px rgba(0,0,0,0.3); font-weight: 800;",
    botonPie: [capa("linear-gradient(180deg, #ffffff, #f1f5f9)")],
    botonPieEstilo: "border-radius: 12px !important; border: 2px solid #1e40af !important; color: #1e3a8a !important; box-shadow: 0 3px 0 #1e40af, 0 6px 12px rgba(0,0,0,0.25) !important; font-weight: 800;",
    panel: [capa(PELOTA_PLAYA, "right 8px top 8px", "22px 22px"), capa("linear-gradient(180deg, #ffffff, #fffbf0)")],
    panelEstilo: "border: 2px solid #fcd34d !important; border-radius: 16px !important; box-shadow: 0 4px 0 #f59e0b, 0 8px 16px rgba(180,83,9,0.12) !important;",
    barra: [capa("linear-gradient(180deg, #ffffff, #fffbf0)")],
    modal: [capa(PELOTA_PLAYA, "right 12px bottom 12px", "26px 26px"), trama(CONFETI_JUGUETES, "110px 110px"), capa("linear-gradient(180deg, #ffffff, #fffaf0)")],
    modalEstilo: "border: 3px solid #3b82f6 !important; box-shadow: 0 6px 0 #1e40af, 0 20px 60px rgba(30,64,175,0.2) !important;",
    tituloEstilo: `color: #1e3a8a !important; background: ${LADRILLOS_JUGUETE} left 0 bottom 0 / 64px 15px repeat-x !important; padding-bottom: 22px;`,
    pestana: [capa("linear-gradient(180deg, #ffffff, #f1f5f9)")],
    pestanaEstilo: "border: 2px solid #93c5fd !important; color: #1e3a8a !important;",
    activa: [capa("linear-gradient(180deg, #facc15, #eab308)")],
    activaEstilo: "border-color: #a16207 !important; color: #422006 !important; box-shadow: 0 3px 0 #a16207 !important;",
    campoEstilo: "background: #ffffff !important; border: 2px solid #bfdbfe !important;",
    extra: (S) => `
${en(S, ".tz-header .tz-subtitle")} { color: #1e3a8a !important; text-shadow: none !important; background: rgba(255,255,255,0.85); padding: 2px 10px; border-radius: 999px; }
${en(S, ".tz-header .tz-conn-indicator")} { background: #ffffff !important; box-shadow: 0 2px 6px rgba(30,64,175,0.2); }
${en(S, ".tz-logo")} { filter: drop-shadow(0 4px 10px rgba(30,64,175,0.3)) !important; }
${en(S, ".tz-stat-chip")}, ${en(S, ".tz-method-total")} { padding-right: 34px !important; }
/* La barra con los bloques encima va recta a todo el ancho: sin
   esquinas redondas ni bordes laterales que se crucen con los bloques. */
${BARRA(S)} { border-radius: 0 !important; border-left: none !important; border-right: none !important; border-width: 0 0 2px 0 !important; box-shadow: 0 4px 0 #f59e0b !important; }`,
  });

// =====================================================================
// FLORERÍA — "Jardín" (claro: guirnalda de flores sobre la barra,
// pétalos que caen, lazo de papel kraft)
// =====================================================================
const rosa = (x, y, k, c, oscuro) =>
  `<g transform='translate(${x} ${y}) scale(${k})'><circle r='7' fill='${c}'/><path d='M-4 -1 Q0 -6 4 -1 Q2 3 -2 2 Q-3 -1 0 -2' stroke='${oscuro}' stroke-width='1.1' fill='none'/><path d='M-6 2 Q-2 7 5 4' stroke='${oscuro}' stroke-width='.9' fill='none'/></g>`;
const margarita = (x, y, k) =>
  `<g transform='translate(${x} ${y}) scale(${k})'>${Array.from({ length: 8 }, (_, i) => `<ellipse cx='0' cy='-5.5' rx='2.2' ry='4.2' fill='#ffffff' stroke='#e5e7eb' stroke-width='.5' transform='rotate(${i * 45})'/>`).join("")}<circle r='2.8' fill='#facc15'/></g>`;
const tulipan = (x, y, k, c) =>
  `<g transform='translate(${x} ${y}) scale(${k})'><path d='M-5 -2 Q-6 -10 -3 -9 L0 -5 L3 -9 Q6 -10 5 -2 Q4 4 0 4 Q-4 4 -5 -2 Z' fill='${c}'/><path d='M0 -5 V4' stroke='rgba(0,0,0,0.15)' stroke-width='.8'/></g>`;
const hojita = (x, y, ang) => `<g transform='translate(${x} ${y}) rotate(${ang})'><path d='M0 0 Q5 -4 11 0 Q5 4 0 0 Z' fill='#4d7c0f'/></g>`;
// Guirnalda de flores (franja repeat-x).
const GUIRNALDA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='40'><path d='M0 16 Q40 26 80 16 T160 16' stroke='#3f6212' stroke-width='2' fill='none'/>${hojita(8, 18, 20)}${hojita(30, 22, -30)}${hojita(52, 21, 160)}${hojita(70, 16, -20)}${hojita(96, 19, 30)}${hojita(118, 24, -150)}${hojita(140, 20, 10)}${rosa(20, 20, 1, "#f472b6", "#be185d")}${margarita(44, 24, 1)}${tulipan(64, 22, 1.1, "#a855f7")}${rosa(88, 22, 1.15, "#ef4444", "#991b1b")}${margarita(112, 24, 0.9)}${tulipan(132, 20, 1, "#f97316")}${rosa(152, 18, 0.9, "#fda4af", "#e11d48")}</svg>`
);
// Pétalos que caen girando (SMIL), en baldosas.
const PETALOS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='170' height='170'>${[
    [20, "#f9a8d4", 9, 0],
    [70, "#fda4af", 11, 3],
    [120, "#f9a8d4", 8, 5.5],
    [150, "#fbcfe8", 12, 1.5],
    [45, "#fecdd3", 10, 7],
  ]
    .map(
      ([x, c, dur, delay]) =>
        `<g><animateTransform attributeName='transform' type='translate' values='0 -20; 14 50; -8 120; 6 190' dur='${dur}s' begin='-${delay}s' repeatCount='indefinite'/><g transform='translate(${x} 0)'><ellipse rx='4' ry='6.5' fill='${c}' opacity='.75'><animateTransform attributeName='transform' type='rotate' values='0;180;360' dur='${dur / 2}s' repeatCount='indefinite'/></ellipse></g></g>`
    )
    .join("")}</svg>`
);
const FLOR_ICONO = svg(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 22'>${hojita(10, 14, 160)}${hojita(18, 14, 20)}${rosa(10, 10, 0.9, "#f472b6", "#be185d")}${margarita(22, 9, 0.75)}</svg>`);
const LAZO_KRAFT = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 44 34'><path d='M22 12 C12 0 2 6 8 14 C12 18 19 15 22 12 Z' fill='#c99a66' stroke='#8a6238' stroke-width='1'/><path d='M22 12 C32 0 42 6 36 14 C32 18 25 15 22 12 Z' fill='#c99a66' stroke='#8a6238' stroke-width='1'/><path d='M20 14 L12 32 L17 29 L19 33 Z M24 14 L32 32 L27 29 L25 33 Z' fill='#b88452' stroke='#8a6238' stroke-width='.8'/><circle cx='22' cy='13' r='3.5' fill='#b88452' stroke='#8a6238' stroke-width='1'/></svg>`
);
const PASTO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='18'><path d='M0 18 L3 6 L5 18 L8 2 L10 18 L14 8 L16 18 L19 4 L22 18 L25 7 L27 18 L31 3 L33 18 L36 8 L38 18 L40 5 V18 Z' fill='#65a30d'/></svg>`
);
const FLORES_FONDO = "linear-gradient(180deg, #fff7f9 0%, #fdeef2 100%)";

const jardin = (S) =>
  construir(S, {
    raiz: [trama(PETALOS, "170px 170px"), capa(FLORES_FONDO)],
    // Cabecera rosada con pétalos cayendo, lazo kraft en las esquinas y
    // la guirnalda de flores montada sobre la barra de filtros.
    cabecera: [
      capa(GUIRNALDA, "left 0 bottom 0", "224px 56px", "repeat-x"),
      capa(LAZO_KRAFT, "left 3% bottom 52px", "54px 42px"),
      capa(LAZO_KRAFT, "right 3% bottom 52px", "54px 42px"),
      trama(PETALOS, "170px 170px"),
      capa("radial-gradient(ellipse 60% 80% at 50% 0%, rgba(255,255,255,0.7), transparent 70%)"),
      capa("linear-gradient(180deg, #fde2ea 0%, #fbd0dd 100%)"),
    ],
    cabeceraEstilo: "padding-bottom: 70px !important; border-bottom: none !important;",
    borde: { enCabecera: 30, rellenoCabecera: 50 },
    pie: [capa(FLOR_ICONO, "left 4% bottom 16px", "40px 29px"), capa(FLOR_ICONO, "right 4% bottom 16px", "40px 29px"), capa(PASTO, "left 0 bottom 0", "40px 18px", "repeat-x"), capa("linear-gradient(180deg, #fbd0dd, #f9c2d3)")],
    pieEstilo: "border-top: 3px solid #f472b6 !important;",
    boton: [capa("linear-gradient(180deg, rgba(255,255,255,0.35), transparent 55%)"), capa("linear-gradient(180deg, #f472b6, #db2777)")],
    botonEstilo: "border: 1px solid #9d174d !important; color: #ffffff !important; box-shadow: 0 3px 8px rgba(219,39,119,0.3) !important; text-shadow: 0 1px 1px rgba(0,0,0,0.25); border-radius: 999px !important;",
    botonPieEstilo: "border-radius: 999px !important; border: 1px solid #9d174d !important; color: #ffffff !important; box-shadow: 0 4px 10px rgba(219,39,119,0.35) !important; text-shadow: 0 1px 1px rgba(0,0,0,0.25);",
    panel: [capa(FLOR_ICONO, "right 6px top 6px", "30px 22px"), capa("linear-gradient(180deg, #ffffff, #fffafb)")],
    panelEstilo: "border: 1px solid #fbcfe8 !important; box-shadow: 0 6px 16px rgba(190,24,93,0.08) !important;",
    barra: [capa("linear-gradient(180deg, #ffffff, #fffafb)")],
    modal: [capa(LAZO_KRAFT, "right 12px bottom 10px", "36px 28px"), trama(PETALOS, "170px 170px"), capa("linear-gradient(180deg, #ffffff, #fff5f8)")],
    modalEstilo: "border: 1px solid #f9a8d4 !important; box-shadow: 0 20px 60px rgba(190,24,93,0.18) !important;",
    tituloEstilo: "color: #9d174d !important; border-bottom: 2px solid #86efac; padding-bottom: 8px;",
    pestana: [capa("linear-gradient(180deg, #ffffff, #fdf2f8)")],
    pestanaEstilo: "border: 1px solid #fbcfe8 !important; color: #831843 !important;",
    activa: [capa("linear-gradient(180deg, #4ade80, #16a34a)")],
    activaEstilo: "border-color: #166534 !important; color: #ffffff !important; box-shadow: 0 4px 12px rgba(22,163,74,0.3) !important;",
    campoEstilo: "background: #ffffff !important; border: 1px solid #f5c2d8 !important;",
    extra: (S) => `
${en(S, ".tz-header .tz-subtitle")} { color: #9d174d !important; text-shadow: none !important; background: rgba(255,255,255,0.85); padding: 2px 10px; border-radius: 999px; }
${en(S, ".tz-header .tz-conn-indicator")} { background: #ffffff !important; box-shadow: 0 2px 8px rgba(190,24,93,0.2); }
${en(S, ".tz-header .tz-conn-online")} { color: #15803d !important; }
${en(S, ".tz-stat-chip")}, ${en(S, ".tz-method-total")} { padding-right: 38px !important; }`,
  });

// =====================================================================
// AGROVETERINARIA — "Granja" (granero rojo, cerco de madera sobre la
// barra, pasto con huellas de vaca, herradura y sacos de alimento)
// =====================================================================
const CERCO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='46'><g fill='#a16207' stroke='#713f12' stroke-width='1'><path d='M6 46 V6 L11 1 L16 6 V46 Z'/><path d='M46 46 V6 L51 1 L56 6 V46 Z'/><rect x='-2' y='14' width='84' height='7' rx='1'/><rect x='-2' y='30' width='84' height='7' rx='1'/></g><g stroke='rgba(60,30,5,0.35)' stroke-width='.8'><path d='M9 10 V42 M49 10 V42 M20 17 H40 M60 33 H76'/></g><circle cx='11' cy='17.5' r='1' fill='#3b2205'/><circle cx='51' cy='33.5' r='1' fill='#3b2205'/></svg>`
);
const HUELLAS_VACA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><g fill='rgba(20,40,12,0.55)'><g transform='translate(22 26) rotate(-15)'><path d='M-5 -6 Q-7 0 -4 6 Q-1 6 -1 0 Q-1 -6 -5 -6Z'/><path d='M5 -6 Q7 0 4 6 Q1 6 1 0 Q1 -6 5 -6Z'/></g><g transform='translate(70 66) rotate(20)'><path d='M-5 -6 Q-7 0 -4 6 Q-1 6 -1 0 Q-1 -6 -5 -6Z'/><path d='M5 -6 Q7 0 4 6 Q1 6 1 0 Q1 -6 5 -6Z'/></g></g><g stroke='rgba(132,204,22,0.18)' stroke-width='1.4' stroke-linecap='round'><path d='M10 90 l2 -6 M14 90 l-1 -7 M80 20 l2 -6 M84 20 l-1 -7 M50 46 l1 -6'/></g></svg>`
);
const HERRADURA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 26 26'><path d='M5 24 L4 12 Q4 3 13 3 Q22 3 22 12 L21 24 L16 24 L17 12 Q17 8 13 8 Q9 8 9 12 L10 24 Z' fill='#9ca3af' stroke='#4b5563' stroke-width='1'/><g fill='#374151'><circle cx='6.5' cy='20' r='1'/><circle cx='6' cy='14' r='1'/><circle cx='19.5' cy='20' r='1'/><circle cx='20' cy='14' r='1'/></g></svg>`
);
const GRANERO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 48'><path d='M4 20 L30 4 L56 20 V46 H4 Z' fill='#b91c1c' stroke='#7f1d1d' stroke-width='1.2'/><path d='M2 21 L30 3 L58 21' stroke='#f8fafc' stroke-width='3' fill='none' stroke-linejoin='round'/><rect x='20' y='26' width='20' height='20' fill='#7f1d1d' stroke='#f8fafc' stroke-width='2'/><path d='M20 26 L40 46 M40 26 L20 46' stroke='#f8fafc' stroke-width='2'/><rect x='26' y='12' width='8' height='7' fill='#fde68a' stroke='#f8fafc' stroke-width='1.4'/></svg>`
);
const SACO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 34 40'><path d='M6 8 Q4 4 8 3 H26 Q30 4 28 8 Q33 20 30 36 Q17 40 4 36 Q1 20 6 8 Z' fill='#d6b98c' stroke='#8a6a3a' stroke-width='1.2'/><path d='M7 8 H27' stroke='#8a6a3a' stroke-width='1.6' stroke-dasharray='2 1.6'/><rect x='10' y='16' width='14' height='11' rx='1.5' fill='#f8fafc' stroke='#15803d' stroke-width='1'/><path d='M14 21.5 h6 M17 18.5 v6' stroke='#15803d' stroke-width='1.8'/></svg>`
);
const TABLAS_GRANERO = "repeating-linear-gradient(90deg, #9b1c1c 0 26px, #7f1d1d 26px 28px)";
const PRADERA = "linear-gradient(180deg, #16290f 0%, #0f1a0c 100%)";
const MADERA_ESTABLO = "linear-gradient(170deg, #3b2a1a 0%, #2a1d12 100%)";

// Animales de perfil (mirando a la derecha). `pasta` = baja la cabeza a
// comer pasto (SMIL).
const vaca = (pasta) =>
  `<path d='M9 14 Q2 18 4 27' stroke='#374151' stroke-width='1.6' fill='none'/><circle cx='4' cy='28' r='1.8' fill='#374151'/>${[14, 20, 40, 46].map((x) => `<rect x='${x}' y='26' width='4.5' height='12' fill='#f8fafc' stroke='#94a3b8' stroke-width='.6'/><rect x='${x}' y='36' width='4.5' height='3' fill='#374151'/>`).join("")}<rect x='8' y='10' width='42' height='20' rx='9' fill='#ffffff' stroke='#94a3b8' stroke-width='.8'/><g fill='#1f2937'><ellipse cx='20' cy='16' rx='6.5' ry='4.5'/><ellipse cx='35' cy='23' rx='5' ry='4'/><ellipse cx='43' cy='13' rx='3.5' ry='3'/></g><ellipse cx='38' cy='30' rx='3.5' ry='2' fill='#f9a8d4'/><g>${pasta ? "<animateTransform attributeName='transform' type='rotate' values='0 50 12;0 50 12;40 50 12;34 50 12;40 50 12;0 50 12' keyTimes='0;0.3;0.38;0.55;0.75;1' dur='6s' repeatCount='indefinite'/>" : ""}<path d='M51 6 Q50 1 53 2 M59 6 Q61 1 58 2' stroke='#e7d8b5' stroke-width='1.6' fill='none'/><ellipse cx='49' cy='9' rx='3' ry='1.8' fill='#f8fafc' stroke='#94a3b8' stroke-width='.6'/><rect x='50' y='5' width='12' height='16' rx='5' fill='#ffffff' stroke='#94a3b8' stroke-width='.8'/><ellipse cx='57' cy='18.5' rx='5.5' ry='3.6' fill='#f9a8d4'/><g fill='#9d174d'><circle cx='55.5' cy='18.5' r='.8'/><circle cx='59' cy='18.5' r='.8'/></g><circle cx='56' cy='10.5' r='1.2' fill='#111827'/></g>`;
const VACA = svg(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 42'>${vaca(false)}</svg>`);
const OVEJA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 34'>${[12, 18, 30, 36].map((x) => `<rect x='${x}' y='22' width='3.5' height='11' rx='1' fill='#374151'/>`).join("")}<g fill='#ffffff' stroke='#d1d5db' stroke-width='.8'><circle cx='14' cy='17' r='8'/><circle cx='22' cy='12' r='9'/><circle cx='31' cy='13' r='9'/><circle cx='37' cy='18' r='7'/><circle cx='20' cy='21' r='8'/><circle cx='31' cy='22' r='8'/></g><ellipse cx='42' cy='14' rx='5' ry='6.5' fill='#4b5563'/><ellipse cx='39' cy='9' rx='3' ry='1.6' fill='#4b5563' transform='rotate(-25 39 9)'/><circle cx='44' cy='12.5' r='1.1' fill='#ffffff'/></svg>`
);
const GALLINA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'><path d='M11 23 V29 M16 23 V29 M9 29 H13 M14 29 H18' stroke='#f59e0b' stroke-width='1.4'/><path d='M4 12 Q0 6 3 4 Q6 8 8 11 Z' fill='#e5e7eb'/><ellipse cx='13' cy='17' rx='9.5' ry='7' fill='#ffffff' stroke='#d1d5db' stroke-width='.8'/><path d='M8 16 Q12 20 17 16' stroke='#e5e7eb' stroke-width='1.4' fill='none'/><circle cx='21' cy='9' r='5' fill='#ffffff' stroke='#d1d5db' stroke-width='.8'/><path d='M18 4.5 Q19 1 21 3.5 Q22 1 24 4 Q25 2 25.5 5.5 Z' fill='#ef4444'/><path d='M25.5 9 L29 10.5 L25.5 11.5 Z' fill='#f59e0b'/><ellipse cx='24.5' cy='13.5' rx='1.2' ry='2' fill='#ef4444'/><circle cx='22.5' cy='8' r='.9' fill='#111827'/></svg>`
);
const CERDO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 32'>${[12, 18, 28, 34].map((x) => `<rect x='${x}' y='22' width='4' height='9' rx='1.5' fill='#f472b6'/>`).join("")}<path d='M7 14 q-4 -3 -2 -6 q3 -1 2 3' stroke='#f472b6' stroke-width='1.4' fill='none'/><ellipse cx='22' cy='17' rx='16' ry='10' fill='#f9a8d4' stroke='#ec4899' stroke-width='.8'/><circle cx='37' cy='14' r='8' fill='#f9a8d4' stroke='#ec4899' stroke-width='.8'/><path d='M33 7 L35 2 L38 7 Z' fill='#f472b6'/><ellipse cx='44.5' cy='16' rx='3.5' ry='3.2' fill='#f472b6' stroke='#db2777' stroke-width='.6'/><g fill='#9d174d'><circle cx='43.6' cy='16' r='.7'/><circle cx='45.6' cy='16' r='.7'/></g><circle cx='39' cy='12' r='1.1' fill='#111827'/></svg>`
);
// Vacas pastando detrás del cerco de la barra (avanzan muy lento).
const VACAS_BARRA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='52'>${[
    [false, 110, 0, "-10%;105%", 1.2],
    [true, 140, 60, "105%;-10%", 1.1],
    [false, 170, 120, "-10%;105%", 1],
  ]
    .map(
      ([izq, dur, delay, xs, k]) =>
        `<svg x='0' y='${izq ? 4 : 2}' width='${(64 * k).toFixed(0)}' height='${(42 * k).toFixed(0)}' viewBox='0 0 64 42' overflow='visible'><animate attributeName='x' values='${xs}' dur='${dur}s' begin='-${delay}s' repeatCount='indefinite'/>${izq ? `<g transform='translate(64 0) scale(-1 1)'>${vaca(true)}</g>` : vaca(true)}</svg>`
    )
    .join("")}</svg>`
);
const PASTO_FRENTE = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='44' height='18'><path d='M0 18 L2 8 L4 18 L6 3 L9 18 L11 9 L13 18 L16 4 L18 18 L21 10 L23 18 L26 2 L28 18 L31 8 L33 18 L36 5 L38 18 L41 9 L44 18 Z' fill='#4caf2e'/><path d='M6 3 L7 12 M16 4 L16.5 12 M26 2 L26.5 12 M36 5 L36.5 12' stroke='#86e05a' stroke-width='.8'/></svg>`
);
const PASTO_TRAMA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='70' height='70'><g stroke='rgba(20,83,45,0.35)' stroke-width='1.3' stroke-linecap='round'><path d='M10 20 l-2 -6 M12 20 l1 -7 M14 20 l3 -5'/><path d='M48 52 l-2 -6 M50 52 l1 -7 M52 52 l3 -5'/><path d='M40 14 l-1 -5 M42 14 l2 -5'/></g><g fill='#fde047'><circle cx='26' cy='44' r='1.6'/><circle cx='60' cy='24' r='1.4'/></g><g fill='#ffffff'><circle cx='28' cy='42' r='1'/><circle cx='24' cy='42' r='1'/></g></svg>`
);
const PASTO_VIVO = "linear-gradient(180deg, #8be05a 0%, #5cbf3a 45%, #47a52e 100%)";
const PRADERA_VIVA = "linear-gradient(180deg, #3aa33a 0%, #2f9134 50%, #257d2b 100%)";

const granja = (S) =>
  construir(S, {
    // En la app real el prado con los animales lo dibuja la ESCENA.
    raiz: [trama(PASTO_TRAMA, "70px 70px"), capa(PRADERA_VIVA)],
    cabecera: [capa("linear-gradient(180deg, #f8fafc, #e5e7eb)", "left 0 bottom 0", "100% 6px"), capa("linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.4))"), capa(TABLAS_GRANERO)],
    cabeceraEstilo: "border-bottom: none !important; box-shadow: 0 6px 18px rgba(0,0,0,0.35);",
    // Pie: solo pasto con el cerco plantado.
    pie: [capa(PASTO_FRENTE, "left 0 top 40px", "44px 18px", "repeat-x"), capa(CERCO, "left 0 top 4px", "80px 46px", "repeat-x"), trama(PASTO_TRAMA, "70px 70px"), capa(PASTO_VIVO)],
    pieEstilo: "border-top: none !important; padding-top: 62px !important;",
    boton: [capa("linear-gradient(180deg, rgba(255,255,255,0.3), transparent 55%)"), capa("linear-gradient(180deg, #fde68a, #eab308)")],
    botonEstilo: "border: 1px solid #854d0e !important; color: #3b2a06 !important; box-shadow: 0 3px 8px rgba(0,0,0,0.4) !important; font-weight: 800;",
    botonPieEstilo: "border-radius: 8px !important; border: 1px solid #854d0e !important; color: #3b2a06 !important; box-shadow: 0 4px 10px rgba(0,0,0,0.45) !important; font-weight: 800;",
    panel: [capa(HERRADURA, "right 8px top 7px", "20px 20px"), trama(VETA, "120px 34px"), capa(MADERA_ESTABLO)],
    panelEstilo: "border: 1px solid #1a120a !important; box-shadow: inset 0 1px 0 rgba(255,230,180,0.1), 0 8px 18px rgba(0,0,0,0.45) !important;",
    modal: [capa(HERRADURA, "right 12px bottom 12px", "24px 24px"), trama(VETA, "120px 34px"), capa(MADERA_ESTABLO)],
    modalEstilo: "border: 2px solid #a16207 !important; box-shadow: 0 20px 60px rgba(0,0,0,0.7) !important;",
    tituloEstilo: "color: #fde68a !important; border-bottom: 3px solid #b91c1c; padding-bottom: 8px;",
    pestana: [capa(MADERA_ESTABLO)],
    pestanaEstilo: "border: 1px solid #a16207 !important; color: #fde68a !important;",
    activa: [capa("linear-gradient(180deg, #dc2626, #991b1b)")],
    activaEstilo: "border-color: #7f1d1d !important; color: #ffffff !important; box-shadow: 0 0 14px rgba(220,38,38,0.45) !important;",
    campoEstilo: "background: #0f1a0c !important; border: 1px solid #854d0e !important;",
    extra: (S) => `
${en(S, ".tz-header .tz-subtitle")} { color: #fde68a !important; background: rgba(40,10,10,0.75); padding: 2px 10px; border-radius: 999px; }
${en(S, ".tz-header .tz-conn-indicator")} { background: rgba(20,12,6,0.85) !important; }
${en(S, ".tz-stat-chip")}, ${en(S, ".tz-method-total")} { padding-right: 34px !important; }
/* Barra = césped vivo: el granero y el saco parados en el pasto, vacas
   pastando detrás del cerco plantado y matas de pasto delante. */
${barraPropia(
  S,
  [
    capa(SACO, "right 3% top 30px", "40px 47px"),
    capa(PASTO_FRENTE, "left 0 top 58px", "44px 18px", "repeat-x"),
    capa(CERCO, "left 0 top 24px", "80px 46px", "repeat-x"),
    capa(GRANERO, "left 1.5% top 6px", "74px 59px"),
    capa(VACAS_BARRA, "left 0 top 2px", "100% 52px"),
    trama(PASTO_TRAMA, "70px 70px"),
    capa(PASTO_VIVO),
  ],
  "padding-top: 82px !important;"
)}
${BARRA(S, " .tz-admin-filter-label")} { color: #14532d !important; text-shadow: none !important; background: rgba(255,255,255,0.8); padding: 1px 10px; border-radius: 999px; }
/* ---- Escena: prado con animales paseando (estilo granja) ---- */
${en(S, ".tz-escena")} { position: fixed; inset: 0; z-index: -1; pointer-events: none; overflow: hidden; }
${en(S, ".tz-esc-prado")} { position: absolute; inset: 0; background: ${PASTO_TRAMA} 0 0 / 70px 70px repeat, ${PRADERA_VIVA}; }
${en(S, ".tz-esc-animal")} {
  position: absolute; left: 0; top: var(--y);
  width: var(--w); height: var(--h);
  background: var(--img) center / contain no-repeat;
  animation: tz-gra-der var(--dur) linear var(--delay) infinite, tz-gra-paso var(--paso, 0.5s) ease-in-out infinite alternate;
  will-change: translate;
}
${en(S, ".tz-esc-izq")} { scale: -1 1; animation-name: tz-gra-izq, tz-gra-paso; }
@keyframes tz-gra-der { 0% { translate: -14vw 0; } 40% { translate: 38vw 0; } 56% { translate: 38vw 0; } 100% { translate: 112vw 0; } }
@keyframes tz-gra-izq { 0% { translate: 112vw 0; } 44% { translate: 56vw 0; } 60% { translate: 56vw 0; } 100% { translate: -14vw 0; } }
@keyframes tz-gra-paso { from { rotate: -2.5deg; } to { rotate: 2.5deg; } }`,
  });

const ESCENA_GRANJA = [
  { clase: "tz-esc-prado" },
  ...[
    ["", VACA, "70px", "46px", "22%", "70s", "-10s"],
    ["izq", OVEJA, "48px", "34px", "34%", "60s", "-25s"],
    ["", GALLINA, "28px", "28px", "44%", "38s", "-5s", "0.28s"],
    ["izq", CERDO, "48px", "32px", "52%", "64s", "-40s"],
    ["", OVEJA, "44px", "31px", "61%", "56s", "-30s"],
    ["izq", VACA, "64px", "42px", "70%", "80s", "-55s"],
    ["", CERDO, "44px", "29px", "80%", "58s", "-18s"],
    ["izq", GALLINA, "26px", "26px", "88%", "34s", "-12s", "0.26s"],
    ["", GALLINA, "24px", "24px", "92%", "42s", "-30s", "0.3s"],
  ].map(([dir, img, w, h, y, dur, delay, paso]) => ({
    clase: `tz-esc-animal${dir ? " tz-esc-izq" : ""}`,
    estilo: { "--img": img, "--w": w, "--h": h, "--y": y, "--dur": dur, "--delay": delay, ...(paso ? { "--paso": paso } : {}) },
  })),
];

// =====================================================================
// LAVANDERÍA — "Tendedero" (claro: ropa colgada sobre la barra, burbujas
// de jabón que suben, lavadora girando y canasta de ropa)
// =====================================================================
const toalla = (x, y, c) =>
  `<g transform='translate(${x} ${y})'><rect x='0' y='0' width='18' height='26' rx='1.5' fill='${c}' stroke='rgba(0,0,0,0.18)' stroke-width='.7'/><path d='M0 19 H18 M0 22 H18' stroke='rgba(255,255,255,0.75)' stroke-width='1.4'/><path d='M2 26 v2 M5 26 v2 M8 26 v2 M11 26 v2 M14 26 v2' stroke='${c}' stroke-width='1'/></g>`;
const calcetin = (x, y, c, ang) =>
  `<g transform='translate(${x} ${y}) rotate(${ang})'><path d='M0 0 H7 V14 Q7 20 12 20 Q15 21 14 24 H5 Q0 24 0 18 Z' fill='${c}' stroke='rgba(0,0,0,0.2)' stroke-width='.7'/><rect x='0' y='0' width='7' height='3' fill='rgba(255,255,255,0.7)'/><path d='M10 21 Q12 24 14 23' stroke='rgba(255,255,255,0.6)' stroke-width='1' fill='none'/></g>`;
const pinzaRopa = (x) => `<rect x='${x}' y='2' width='3' height='8' rx='1' fill='#f472b6' stroke='#be185d' stroke-width='.5'/>`;
// Cuerda con ropa colgada (franja repeat-x; la cuerda empalma a y = 6).
const TENDEDERO_ROPA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='48'><path d='M0 6 Q90 12 180 6' stroke='#64748b' stroke-width='1.4' fill='none'/>${toalla(8, 8, "#7dd3fc")}${pinzaRopa(10)}${pinzaRopa(22)}${polo(32, 9, "#fda4af", 1.05)}${pinzaRopa(40)}${pinzaRopa(53)}${calcetin(66, 10, "#c4b5fd", -4)}${calcetin(78, 10, "#c4b5fd", 4)}${pinzaRopa(68)}${pinzaRopa(80)}${toalla(98, 10, "#fde68a")}${pinzaRopa(100)}${pinzaRopa(112)}${polo(124, 9, "#86efac", 1.05)}${pinzaRopa(132)}${pinzaRopa(145)}${calcetin(158, 9, "#7dd3fc", 2)}${pinzaRopa(160)}</svg>`
);
// Burbujas de jabón tornasoladas que suben (SMIL).
const BURBUJAS_JABON = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150'><defs><linearGradient id='t' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#7dd3fc'/><stop offset='.5' stop-color='#f0abfc'/><stop offset='1' stop-color='#fde68a'/></linearGradient></defs>${[
    [20, 10, 9, 0],
    [62, 6, 7, 2.2],
    [104, 13, 11, 4],
    [134, 7, 8, 1.1],
    [42, 5, 6, 3.3],
  ]
    .map(
      ([x, r, dur, delay]) =>
        `<g><animateTransform attributeName='transform' type='translate' values='0 0; -8 -85; 6 -170' dur='${dur}s' begin='-${delay}s' repeatCount='indefinite'/><circle cx='${x}' cy='${150 + r}' r='${r}' fill='rgba(255,255,255,0.18)' stroke='url(#t)' stroke-width='1.3' opacity='.8'/><ellipse cx='${x - r * 0.35}' cy='${150 + r - r * 0.4}' rx='${r * 0.3}' ry='${r * 0.18}' fill='rgba(255,255,255,0.9)'/></g>`
    )
    .join("")}</svg>`
);
const LAVADORA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 46 52'><rect x='1' y='1' width='44' height='50' rx='5' fill='#ffffff' stroke='#94a3b8' stroke-width='1.2'/><rect x='1' y='1' width='44' height='10' rx='5' fill='#e2e8f0'/><circle cx='36' cy='6' r='3' fill='#cbd5e1' stroke='#64748b' stroke-width='.8'/><rect x='6' y='4.5' width='10' height='3' rx='1.5' fill='#7dd3fc'/><circle cx='23' cy='31' r='15' fill='#cbd5e1' stroke='#64748b' stroke-width='1.2'/><circle cx='23' cy='31' r='11.5' fill='#bae6fd'/><g><animateTransform attributeName='transform' type='rotate' from='0 23 31' to='360 23 31' dur='2.4s' repeatCount='indefinite'/><path d='M15 30 Q19 24 25 26 Q22 30 15 30 Z' fill='#f472b6'/><path d='M24 35 Q30 34 31 28 Q26 31 24 35 Z' fill='#a78bfa'/><path d='M17 35 Q20 39 25 38 Q21 35 17 35 Z' fill='#fde047'/></g><path d='M15 25 Q18 21 23 20.5' stroke='rgba(255,255,255,0.85)' stroke-width='1.6' fill='none' stroke-linecap='round'/></svg>`
);
const CANASTA = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 46 36'><path d='M8 10 Q14 2 22 8 Q28 1 36 8 L38 12 H6 Z' fill='#f9a8d4'/><path d='M14 6 Q20 0 26 6' fill='#7dd3fc'/><path d='M3 12 H43 L39 34 H7 Z' fill='#d6a35c' stroke='#8a5a26' stroke-width='1'/><g stroke='#a86f30' stroke-width='1.2'><path d='M5 17 H41 M6 22 H40 M7 27 H39'/><path d='M12 12 L13 34 M19 12 L19.5 34 M26 12 L26 34 M33 12 L32.5 34'/></g><rect x='2' y='10' width='42' height='4' rx='2' fill='#b07a3a'/></svg>`
);
const JABON_ICONO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 24'><g fill='rgba(255,255,255,0.6)' stroke='#38bdf8' stroke-width='1.2'><circle cx='9' cy='14' r='7'/><circle cx='20' cy='9' r='5'/><circle cx='21' cy='19' r='3.5'/></g><g fill='#ffffff'><ellipse cx='6.5' cy='11' rx='2' ry='1.2'/><ellipse cx='18.5' cy='7.5' rx='1.4' ry='.8'/></g></svg>`
);
const AZULEJO_CLARO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='30' height='30'><rect width='30' height='30' fill='#bfe6ef'/><rect x='1' y='1' width='28' height='28' rx='2' fill='#f4fbfd'/><rect x='3' y='3' width='10' height='2' rx='1' fill='rgba(255,255,255,0.9)'/></svg>`
);
const AIRE_LIMPIO = "linear-gradient(180deg, #cdeef7 0%, #e3f6fb 100%)";

const tendedero = (S) =>
  construir(S, {
    raiz: [trama(BURBUJAS_JABON, "150px 150px"), capa("linear-gradient(180deg, #f5fbfd 0%, #e6f4f8 100%)")],
    cabecera: [
      capa(LAVADORA, "left 2.5% bottom 12px", "58px 66px"),
      capa(CANASTA, "right 2.5% bottom 12px", "64px 50px"),
      trama(BURBUJAS_JABON, "150px 150px"),
      capa(AIRE_LIMPIO),
    ],
    cabeceraEstilo: "border-bottom: none !important;",
    pie: [capa("linear-gradient(180deg, #38bdf8, #0ea5e9)", "left 0 top 0", "100% 4px"), trama(AZULEJO_CLARO, "30px 30px")],
    pieEstilo: "border-top: none !important;",
    boton: [capa("linear-gradient(180deg, rgba(255,255,255,0.35), transparent 55%)"), capa("linear-gradient(180deg, #22d3ee, #0891b2)")],
    botonEstilo: "border: 1px solid #0e7490 !important; color: #ffffff !important; box-shadow: 0 3px 8px rgba(8,145,178,0.3) !important; text-shadow: 0 1px 1px rgba(0,0,0,0.25); border-radius: 999px !important;",
    botonPieEstilo: "border-radius: 999px !important; border: 1px solid #0e7490 !important; color: #ffffff !important; box-shadow: 0 4px 10px rgba(8,145,178,0.35) !important; text-shadow: 0 1px 1px rgba(0,0,0,0.25);",
    panel: [capa(JABON_ICONO, "right 8px top 6px", "26px 22px"), capa("linear-gradient(180deg, #ffffff, #f7fcfe)")],
    panelEstilo: "border: 1px solid #bfe6ef !important; box-shadow: 0 6px 16px rgba(14,116,144,0.10) !important;",
    modal: [capa(JABON_ICONO, "right 12px bottom 12px", "30px 26px"), trama(BURBUJAS_JABON, "150px 150px"), capa("linear-gradient(180deg, #ffffff, #f2fafd)")],
    modalEstilo: "border: 1px solid #a5dcea !important; box-shadow: 0 20px 60px rgba(14,116,144,0.2) !important;",
    tituloEstilo: "color: #0e7490 !important; border-bottom: 2px dashed #f9a8d4; padding-bottom: 8px;",
    pestana: [capa("linear-gradient(180deg, #ffffff, #effafc)")],
    pestanaEstilo: "border: 1px solid #a5dcea !important; color: #155e75 !important;",
    activa: [capa("linear-gradient(180deg, #f472b6, #db2777)")],
    activaEstilo: "border-color: #9d174d !important; color: #ffffff !important; box-shadow: 0 4px 12px rgba(219,39,119,0.3) !important;",
    campoEstilo: "background: #ffffff !important; border: 1px solid #a5dcea !important;",
    extra: (S) => `
${en(S, ".tz-header .tz-subtitle")} { color: #0e7490 !important; text-shadow: none !important; background: rgba(255,255,255,0.85); padding: 2px 10px; border-radius: 999px; }
${en(S, ".tz-header .tz-conn-indicator")} { background: #ffffff !important; box-shadow: 0 2px 6px rgba(14,116,144,0.2); }
${en(S, ".tz-logo")} { filter: drop-shadow(0 4px 10px rgba(14,116,144,0.3)) !important; }
${en(S, ".tz-stat-chip")}, ${en(S, ".tz-method-total")} { padding-right: 36px !important; }
/* La cuerda va justo en la línea de arriba de la barra y la ropa cuelga
   dentro de ella. */
${barraPropia(S, [capa(TENDEDERO_ROPA, "left 0 top -5px", "240px 64px", "repeat-x"), capa("linear-gradient(180deg, #ffffff, #f7fcfe)")], "padding-top: 70px !important;")}`,
  });

// =====================================================================
// SEX SHOP — "Neón íntimo" (discreto: terciopelo negro, luces de neón
// rosa y morado que titilan, corazones, labios y antifaz)
// =====================================================================
const BRILLO_NEON = `<filter id='n' x='-30%' y='-30%' width='160%' height='160%'><feGaussianBlur stdDeviation='1.6' result='b'/><feMerge><feMergeNode in='b'/><feMergeNode in='b'/><feMergeNode in='SourceGraphic'/></feMerge></filter>`;
const parpadeo = (dur, delay = 0) => `<animate attributeName='opacity' values='1;1;0.55;1;1;0.8;1' keyTimes='0;0.4;0.45;0.5;0.8;0.85;1' dur='${dur}s' begin='${delay}s' repeatCount='indefinite'/>`;
const CORAZON_PATH = "M30 50 C10 36 3 26 3 16 A12 12 0 0 1 30 10 A12 12 0 0 1 57 16 C57 26 50 36 30 50 Z";
const NEON_CORAZON = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 54'><defs>${BRILLO_NEON}</defs><g filter='url(#n)'>${parpadeo(3.2)}<path d='${CORAZON_PATH}' fill='none' stroke='#ff4fa3' stroke-width='3' stroke-linejoin='round'/><path d='${CORAZON_PATH}' fill='none' stroke='#ffe4f1' stroke-width='1'/></g></svg>`
);
const NEON_LABIOS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 66 38'><defs>${BRILLO_NEON}</defs><g filter='url(#n)' fill='none' stroke-linecap='round' stroke-linejoin='round'>${parpadeo(4.1, 1.2)}<path d='M4 19 Q16 4 26 9 Q33 4 40 9 Q50 4 62 19 Q50 34 33 34 Q16 34 4 19 Z' stroke='#c084fc' stroke-width='3'/><path d='M4 19 Q20 21 33 19 Q46 21 62 19' stroke='#c084fc' stroke-width='2.4'/><path d='M4 19 Q16 4 26 9 Q33 4 40 9 Q50 4 62 19 Q50 34 33 34 Q16 34 4 19 Z' stroke='#f3e8ff' stroke-width='.9'/></g></svg>`
);
const ANTIFAZ = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 54 26'><defs>${BRILLO_NEON}</defs><g filter='url(#n)'><path d='M3 8 Q14 2 27 8 Q40 2 51 8 Q52 20 40 22 Q32 22 27 16 Q22 22 14 22 Q2 20 3 8 Z' fill='none' stroke='#ff4fa3' stroke-width='2.4' stroke-linejoin='round'/><ellipse cx='15' cy='13' rx='5' ry='3' fill='none' stroke='#ffe4f1' stroke-width='1.2'/><ellipse cx='39' cy='13' rx='5' ry='3' fill='none' stroke='#ffe4f1' stroke-width='1.2'/></g></svg>`
);
// Guirnalda de foquitos en forma de corazón que se encienden por turnos
// (franja repeat-x; el cable empalma a y = 4).
const LUCES_CORAZON = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='34'><defs>${BRILLO_NEON}</defs><path d='M0 4 Q24 12 48 4 T96 4' stroke='#3b1030' stroke-width='1.6' fill='none'/>${[
    [16, 9, "#ff4fa3", 0],
    [48, 5, "#c084fc", 0.6],
    [80, 9, "#fb7185", 1.2],
  ]
    .map(
      ([x, y, c, d]) =>
        `<g transform='translate(${x - 8} ${y})'><rect x='6' y='0' width='4' height='4' rx='1' fill='#2a0c22'/><g filter='url(#n)'><animate attributeName='opacity' values='1;0.35;1' dur='1.8s' begin='${d}s' repeatCount='indefinite'/><path d='M8 22 C2 17 0 13 0 10 A4 4 0 0 1 8 8 A4 4 0 0 1 16 10 C16 13 14 17 8 22 Z' fill='${c}'/></g></g>`
    )
    .join("")}</svg>`
);
const CORAZONES_TENUES = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='130' height='130'><g fill='none' stroke-width='1.2' opacity='.16'><path d='M24 34 C16 28 12 24 12 20 A5 5 0 0 1 24 17 A5 5 0 0 1 36 20 C36 24 32 28 24 34 Z' stroke='#ff4fa3'/><path d='M94 96 C88 91 85 88 85 85 A4 4 0 0 1 94 83 A4 4 0 0 1 103 85 C103 88 100 91 94 96 Z' stroke='#c084fc'/><path d='M100 30 C96 27 94 25 94 23 A3 3 0 0 1 100 22 A3 3 0 0 1 106 23 C106 25 104 27 100 30 Z' stroke='#fb7185'/></g></svg>`
);
const CORAZONCITO = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 54'><defs>${BRILLO_NEON}</defs><path d='${CORAZON_PATH}' fill='#ff4fa3' filter='url(#n)'/></svg>`
);
const SATEN_NEGRO = "linear-gradient(160deg, #1f0a1a 0%, #12050f 55%, #0b0309 100%)";

// Besos que aparecen en cualquier parte de la cabecera: se encienden en
// neón, mandan un corazoncito que sube y se desvanecen (SMIL).
const LABIOS_PATH = "M4 19 Q16 4 26 9 Q33 4 40 9 Q50 4 62 19 Q50 34 33 34 Q16 34 4 19 Z";
const BESOS = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><defs>${BRILLO_NEON}</defs>${[
    [5, 22, "#ff4fa3", 44, 7, 0],
    [19, 64, "#c084fc", 34, 9, 2.5],
    [32, 20, "#fb7185", 30, 8, 5],
    [61, 14, "#ff4fa3", 36, 10, 1.2],
    [70, 66, "#c084fc", 42, 7.5, 3.8],
    [84, 28, "#fb7185", 38, 9.5, 6.2],
    [91, 70, "#ff4fa3", 30, 8.5, 4.4],
    [11, 80, "#fb7185", 28, 11, 7.5],
    [46, 76, "#c084fc", 26, 9, 8.6],
    [78, 6, "#ff4fa3", 26, 10.5, 0.6],
  ]
    .map(([x, y, c, w, dur, begin]) => {
      const t = `dur='${dur}s' begin='${begin}s' repeatCount='indefinite'`;
      const a = Math.round(w * 1.45);
      return `<svg x='${x}%' y='${y}%' width='${a}' height='${(a * 0.58).toFixed(0)}' viewBox='0 0 66 38' overflow='visible'><g opacity='0'><animate attributeName='opacity' values='0;0;1;1;0;0' keyTimes='0;0.04;0.1;0.36;0.58;1' ${t}/><g filter='url(#n)'><path d='${LABIOS_PATH}' fill='${c}'/><path d='M4 19 Q20 21 33 19 Q46 21 62 19' stroke='#2a0618' stroke-width='2.4' fill='none'/></g><path d='${LABIOS_PATH}' fill='none' stroke='#ffffff' stroke-width='1.6' opacity='0'><animate attributeName='opacity' values='0;0;0.9;0;0' keyTimes='0;0.08;0.12;0.22;1' ${t}/></path><g opacity='0'><animate attributeName='opacity' values='0;0;1;0;0' keyTimes='0;0.12;0.2;0.5;1' ${t}/><animateTransform attributeName='transform' type='translate' values='0 0;0 0;10 -34;10 -34' keyTimes='0;0.12;0.5;1' ${t}/><path d='M56 14 C51 10 49 8 49 6 A3 3 0 0 1 56 4.5 A3 3 0 0 1 63 6 C63 8 61 10 56 14 Z' fill='${c}' filter='url(#n)'/></g></g></svg>`;
    })
    .join("")}</svg>`
);

const neonIntimo = (S) =>
  construir(S, {
    raiz: [trama(CORAZONES_TENUES, "130px 130px"), capa("radial-gradient(ellipse 700px 380px at 15% 0%, rgba(255,79,163,0.14), transparent 65%)"), capa("radial-gradient(ellipse 700px 380px at 85% 0%, rgba(192,132,252,0.12), transparent 65%)"), capa("linear-gradient(180deg, #0d0409 0%, #0a0408 100%)")],
    // Cabecera de terciopelo negro con besos de neón que aparecen y se
    // desvanecen en cualquier parte.
    cabecera: [
      capa(BESOS, "0 0", "100% 100%"),
      trama(CORAZONES_TENUES, "130px 130px"),
      capa("radial-gradient(ellipse 60% 90% at 50% 100%, rgba(255,79,163,0.18), transparent 70%)"),
      capa("linear-gradient(180deg, #170612 0%, #220a1b 100%)"),
    ],
    cabeceraEstilo: "border-bottom: none !important; box-shadow: 0 6px 22px rgba(255,79,163,0.15);",
    pie: [capa(LUCES_CORAZON, "left 0 top 0", "96px 34px", "repeat-x"), capa(ANTIFAZ, "left 4% bottom 12px", "50px 24px"), capa(ANTIFAZ, "right 4% bottom 12px", "50px 24px"), capa(SATEN_NEGRO)],
    pieEstilo: "border-top: 1px solid rgba(255,79,163,0.4) !important; padding-top: 40px !important;",
    boton: [capa(SATEN_NEGRO)],
    botonEstilo: "border: 1.5px solid #ff4fa3 !important; color: #ffd1e8 !important; box-shadow: 0 0 10px rgba(255,79,163,0.45), inset 0 0 8px rgba(255,79,163,0.2) !important; text-shadow: 0 0 6px rgba(255,79,163,0.7);",
    botonPieEstilo: "border-radius: 999px !important; border: 1.5px solid #c084fc !important; color: #f3e8ff !important; box-shadow: 0 0 12px rgba(192,132,252,0.45), inset 0 0 8px rgba(192,132,252,0.2) !important; text-shadow: 0 0 6px rgba(192,132,252,0.7);",
    panel: [capa(CORAZONCITO, "right 9px top 9px", "18px 16px"), capa("linear-gradient(155deg, rgba(255,255,255,0.05) 0%, transparent 35%)"), capa(SATEN_NEGRO)],
    panelEstilo: "border: 1px solid rgba(255,79,163,0.45) !important; box-shadow: 0 0 14px rgba(255,79,163,0.12), 0 8px 18px rgba(0,0,0,0.55) !important;",
    modal: [capa(ANTIFAZ, "right 12px bottom 12px", "44px 21px"), trama(CORAZONES_TENUES, "130px 130px"), capa(SATEN_NEGRO)],
    modalEstilo: "border: 1px solid #ff4fa3 !important; box-shadow: 0 0 30px rgba(255,79,163,0.25), 0 20px 60px rgba(0,0,0,0.75) !important;",
    tituloEstilo: "color: #ffd1e8 !important; text-shadow: 0 0 10px rgba(255,79,163,0.7); border-bottom: 1px solid rgba(255,79,163,0.6); padding-bottom: 8px;",
    pestana: [capa(SATEN_NEGRO)],
    pestanaEstilo: "border: 1px solid rgba(192,132,252,0.5) !important; color: #f3e8ff !important;",
    activa: [capa("linear-gradient(135deg, #ff4fa3 0%, #c084fc 100%)")],
    activaEstilo: "border-color: #86198f !important; color: #ffffff !important; box-shadow: 0 0 16px rgba(255,79,163,0.55) !important; text-shadow: 0 1px 2px rgba(0,0,0,0.35);",
    campoEstilo: "background: #0b0309 !important; border: 1px solid rgba(255,79,163,0.4) !important;",
    extra: (S) => `${en(S, ".tz-stat-chip")}, ${en(S, ".tz-method-total")} { padding-right: 32px !important; }
/* La guirnalda de corazones va DENTRO de la barra, como en el pie. */
${barraPropia(S, [capa(LUCES_CORAZON, "left 0 top 0", "96px 34px", "repeat-x"), capa("linear-gradient(155deg, rgba(255,255,255,0.05) 0%, transparent 35%)"), capa(SATEN_NEGRO)], "padding-top: 44px !important; border-top: 1px solid rgba(255,79,163,0.4) !important;")}`,
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
    nombre: "Cafetal",
    descripcion: "Campo de café: cielo, cafetos con cerezas, neblina y hojas que caen",
    paleta: { id: "tematico-cafe", nombre: "Cafetal", modo: "oscuro", principal: "#a7e08a", secundario: "#ff8a75", acento: "#f6d27a", botones: "#f0c08a", fondo1: "#0b1f0e", fondo2: "#14321a" },
    muestra: `${CEREZAS} right 10px bottom 8px / 26px 23px no-repeat, ${ARBUSTOS_CAMPO} left 0 top 34px / 70px 27px repeat-x, ${COLINAS} left 0 top 14px / 220px 50px repeat-x, ${NUBES_CIELO} left 0 top 0 / 160px 35px repeat-x, linear-gradient(180deg, #4a8cc2 0%, #b9dbe8 38%, #13351a 62%, #0b1f0e 100%)`,
    escena: ESCENA_CAFETAL,
    css: cafe,
  },
  {
    id: "tropical",
    rubro: "jugueria",
    nombre: "Tropical",
    descripcion: "Hojas tropicales, frutas, frutos rojos y morados, ola de jugo",
    paleta: { id: "tematico-tropical", nombre: "Tropical", modo: "oscuro", principal: "#86efac", secundario: "#fb923c", acento: "#fde047", botones: "#bef264", fondo1: "#04140c", fondo2: "#0a2a19" },
    muestra: `${JUGO} left 0 bottom 0 / 90px 14px repeat-x, ${HOJA_SI} left -20px top -20px / 80px 80px no-repeat, ${BAYAS} 60px 28px / 120px 56px, ${RODAJAS} 0 0 / 120px 56px, linear-gradient(180deg, #15803d, #0a2a19)`,
    css: tropical,
  },
  {
    id: "helado",
    rubro: "heladeria",
    nombre: "Helado artesanal",
    descripcion: "Bolas de colores, barquillo y conos",
    paleta: { id: "tematico-helado", nombre: "Helado artesanal", modo: "claro", principal: "#0f766e", secundario: "#db2777", acento: "#b45309", botones: "#92400e", fondo1: "#f4fbf8", fondo2: "#e9f6f0" },
    muestra: `${CONO} right 12px top 10px / 18px 24px no-repeat, ${BOLAS} left 0 bottom 0 / 81px 28px repeat-x, linear-gradient(180deg, #d1fae5, #a7f3d0)`,
    css: helado,
  },
  {
    id: "carnicero",
    rubro: "carniceria",
    nombre: "Carnicero",
    descripcion: "Azulejos, filetes en mosaico, tabla de picar y cuchilla",
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
    nombre: "Bodega de licores",
    descripcion: "Muro de piedra, barricas, cervezas, licores y shots",
    paleta: { id: "tematico-vinos", nombre: "Bodega de licores", modo: "oscuro", principal: "#e9c46a", secundario: "#f4a7b9", acento: "#f5d58a", botones: "#e9c46a", fondo1: "#120a0c", fondo2: "#2a0d16" },
    muestra: `${SHOTS} right 12px top 10px / 24px 17px no-repeat, ${REPISA} left 0 bottom 0 / 80px 31px repeat-x, ${PIEDRA} 0 0 / 60px 36px, #120a0c`,
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
  {
    id: "barberia",
    rubro: "barberia",
    nombre: "Barbería clásica",
    descripcion: "Poste giratorio, cuero con costura, navaja y cromo",
    paleta: { id: "tematico-barberia", nombre: "Barbería clásica", modo: "oscuro", principal: "#e5e7eb", secundario: "#f87171", acento: "#93c5fd", botones: "#f8fafc", fondo1: "#0b0b0d", fondo2: "#1d1d22" },
    muestra: `${POSTE} left 10px center / 20px 70px no-repeat, ${NAVAJA} right 10px top 10px / 26px 14px no-repeat, linear-gradient(90deg, #dc2626 0 33.3%, #f8fafc 33.3% 66.6%, #1d4ed8 66.6%) left 0 bottom 0 / 100% 3px no-repeat, ${GRANO_CUERO} 0 0 / 50px 50px, ${CUERO}`,
    css: barberia,
  },
  {
    id: "glamour",
    rubro: "salon-belleza",
    nombre: "Glamour",
    descripcion: "Rosa y dorado, focos de camerino y brillos",
    paleta: { id: "tematico-glamour", nombre: "Glamour", modo: "oscuro", principal: "#f9a8d4", secundario: "#fcd34d", acento: "#fbcfe8", botones: "#fde68a", fondo1: "#120610", fondo2: "#2e1228" },
    muestra: `${FOCOS} left 0 bottom 0 / 34px 20px repeat-x, ${PEINE} right 10px top 10px / 24px 13px no-repeat, ${BRILLITOS} 0 0 / 60px 60px, linear-gradient(180deg, #3d1735, #2a0f24)`,
    css: glamour,
  },
  {
    id: "zen",
    rubro: "spa",
    nombre: "Zen",
    descripcion: "Salvia, piedras apiladas, bambú y agua",
    paleta: { id: "tematico-zen", nombre: "Zen", modo: "claro", principal: "#3f6b4f", secundario: "#7c6a55", acento: "#4d7c0f", botones: "#3f6b4f", fondo1: "#f6f7f3", fondo2: "#e9ede4" },
    muestra: `${PIEDRAS} right 10px bottom 6px / 30px 39px no-repeat, ${ONDAS_AGUA} left 0 bottom 2px / 80px 10px repeat-x, ${BAMBU} 0 0 / 90px 90px, linear-gradient(180deg, #ffffff, #eef2ea)`,
    css: zen,
  },
  {
    id: "boutique",
    rubro: "ropa-moda",
    nombre: "Urbano",
    descripcion: "Denim con costuras, tendedero de polos, gorras, gafas, jeans y bikinis",
    paleta: { id: "tematico-boutique", nombre: "Urbano", modo: "oscuro", principal: "#7dd3fc", secundario: "#fb7185", acento: "#fde047", botones: "#e0f2fe", fondo1: "#0b0c10", fondo2: "#161a22" },
    muestra: `${TENDEDERO} left 0 top 0 / 140px 32px repeat-x, ${GAFAS_ICONO} right 10px bottom 10px / 28px 12px no-repeat, ${PESPUNTE} left 0 bottom 2px / 12px 8px repeat-x, ${TWILL}, ${DENIM}`,
    css: boutique,
  },
  {
    id: "vitrina",
    rubro: "calzado",
    nombre: "Sneakers",
    descripcion: "Zapatillas retro de colores, agujetas y suela de goma",
    paleta: { id: "tematico-vitrina", nombre: "Sneakers", modo: "oscuro", principal: "#ffd166", secundario: "#ff6b6b", acento: "#7dd3fc", botones: "#f8fafc", fondo1: "#0b0d12", fondo2: "#1a1d26" },
    muestra: `${LAZO} right 8px top 6px / 26px 24px no-repeat, ${PARED_ZAP} left 0 bottom 6px / 160px 25px repeat-x, linear-gradient(180deg, #ffd166, #ffd166) left 0 bottom 0 / 100% 4px no-repeat, ${PERFORADO} 0 0 / 12px 12px, linear-gradient(170deg, #1d2130, #141722)`,
    css: vitrina,
  },
  {
    id: "joyero",
    rubro: "joyeria",
    nombre: "Joyero",
    descripcion: "Terciopelo burdeos, oro, perlas, anillos y diamantes que destellan",
    paleta: { id: "tematico-joyero", nombre: "Joyero", modo: "oscuro", principal: "#f5d78e", secundario: "#f9a8d4", acento: "#bae6fd", botones: "#f5d78e", fondo1: "#12050b", fondo2: "#2a0a18" },
    muestra: `${DIAMANTE} right 12px top 10px / 24px 21px no-repeat, ${PERLAS} left 0 bottom 4px / 54px 16px repeat-x, ${DESTELLOS} 0 0 / 90px 90px, linear-gradient(170deg, #4a0f24, #240612)`,
    css: joyero,
  },
  {
    id: "circuito",
    rubro: "celulares-tecnologia",
    nombre: "Circuito",
    descripcion: "Placa con pulsos de luz, chips, señal y batería",
    paleta: { id: "tematico-circuito", nombre: "Circuito", modo: "oscuro", principal: "#38bdf8", secundario: "#a78bfa", acento: "#34d399", botones: "#7dd3fc", fondo1: "#060b14", fondo2: "#0f1a2b" },
    muestra: `${BATERIA} right 10px top 10px / 34px 17px no-repeat, ${SENAL} left 10px top 10px / 30px 17px no-repeat, ${CIRCUITO_VIVO} 0 0 / 90px 90px, linear-gradient(180deg, #0b1626, #060b14)`,
    css: circuito,
  },
  {
    id: "imprenta",
    rubro: "cabinas-impresiones",
    nombre: "Imprenta",
    descripcion: "Papel continuo, colores CMYK, marcas de registro y clips",
    paleta: { id: "tematico-imprenta", nombre: "Imprenta", modo: "claro", principal: "#0e7490", secundario: "#be185d", acento: "#a16207", botones: "#0f172a", fondo1: "#f7f7f4", fondo2: "#efeee9" },
    muestra: `${CMYK} left 0 bottom 0 / 100% 6px no-repeat, ${IMPRESORA} right 10px top 8px / 30px 26px no-repeat, ${AGUJEROS} left 2px top 0 / 12px 17px repeat-y, linear-gradient(180deg, #ffffff, #f3f2ee)`,
    css: imprenta,
  },
  {
    id: "motor",
    rubro: "repuestos",
    nombre: "Motor",
    descripcion: "Fibra de carbono, engranajes que giran, aceite y bujías",
    paleta: { id: "tematico-motor", nombre: "Motor", modo: "oscuro", principal: "#f87171", secundario: "#fbbf24", acento: "#e5e7eb", botones: "#fca5a5", fondo1: "#0b0c0e", fondo2: "#17191d" },
    muestra: `${ENGRANAJE} right 10px top 8px / 30px 30px no-repeat, ${ENGRANAJE_ROJO} right 34px top 26px / 20px 20px no-repeat, ${ACEITE} left 0 top 0 / 60px 14px repeat-x, ${CARBONO} 0 0 / 10px 10px, #0b0c0e`,
    css: motor,
  },
  {
    id: "garaje",
    rubro: "taller-mecanico",
    nombre: "Garaje",
    descripcion: "Pared de herramientas, cajón rojo, llanta y manchas de aceite",
    paleta: { id: "tematico-garaje", nombre: "Garaje", modo: "oscuro", principal: "#93c5fd", secundario: "#fca5a5", acento: "#fde68a", botones: "#e2e8f0", fondo1: "#0e1013", fondo2: "#1c2026" },
    muestra: `${LLANTA} right 8px bottom 8px / 30px 30px no-repeat, ${HERRAMIENTAS} left 0 top 4px / 140px 31px repeat-x, ${PEGBOARD} 0 0 / 14px 14px`,
    css: garaje,
  },
  {
    id: "espuma",
    rubro: "lavado-autos",
    nombre: "Espuma",
    descripcion: "Agua, burbujas que suben, espuma, esponja y un auto que brilla",
    paleta: { id: "tematico-espuma", nombre: "Espuma", modo: "oscuro", principal: "#7dd3fc", secundario: "#f0abfc", acento: "#fde047", botones: "#bae6fd", fondo1: "#03111f", fondo2: "#0a2340" },
    muestra: `${AUTO_BRILLO} right 8px top 8px / 44px 21px no-repeat, ${ESPUMA_VIVA} left 0 bottom 0 / 80px 31px repeat-x, ${GOTAS_AGUA} 0 0 / 50px 50px, linear-gradient(180deg, #0f4c81, #03111f)`,
    escena: ESCENA_ESPUMA,
    css: espuma,
  },
  {
    id: "cuaderno",
    rubro: "libreria-bazar",
    nombre: "Cuaderno",
    descripcion: "Hoja rayada con espiral, lápices de colores, cinta y clips",
    paleta: { id: "tematico-cuaderno", nombre: "Cuaderno", modo: "claro", principal: "#1d4ed8", secundario: "#be123c", acento: "#a16207", botones: "#1e3a8a", fondo1: "#fdfdf8", fondo2: "#f3f1e6" },
    muestra: `${ESPIRAL} left 0 top 0 / 20px 17px repeat-x, ${LAPICES} left 0 bottom 0 / 90px 31px repeat-x, ${MARGEN}, ${RENGLONES}, ${HOJA_PAPEL}`,
    escena: ESCENA_CUADERNO,
    css: cuaderno,
  },
  {
    id: "bloques",
    rubro: "jugueteria",
    nombre: "Bloques",
    descripcion: "Cielo con cometas, bloques de colores, pelotas y confeti",
    paleta: { id: "tematico-bloques", nombre: "Bloques", modo: "claro", principal: "#1d4ed8", secundario: "#dc2626", acento: "#a16207", botones: "#dc2626", fondo1: "#fffdf5", fondo2: "#fff4dc" },
    muestra: `${COMETA_ROJA} right 10px top 4px / 22px 38px no-repeat, ${LADRILLOS_JUGUETE} left 0 bottom 0 / 96px 22px repeat-x, ${NUBES_CIELO} left 0 top 0 / 200px 44px repeat-x, ${CIELO_JUGUETE}`,
    css: bloques,
  },
  {
    id: "jardin",
    rubro: "floreria",
    nombre: "Jardín",
    descripcion: "Guirnalda de flores, pétalos que caen y lazo de papel kraft",
    paleta: { id: "tematico-jardin", nombre: "Jardín", modo: "claro", principal: "#be185d", secundario: "#15803d", acento: "#b45309", botones: "#be185d", fondo1: "#fff7f9", fondo2: "#fdeef2" },
    muestra: `${LAZO_KRAFT} right 8px top 6px / 30px 23px no-repeat, ${GUIRNALDA} left 0 bottom 0 / 120px 30px repeat-x, ${PETALOS} 0 0 / 120px 120px, linear-gradient(180deg, #fde2ea, #fff7f9)`,
    css: jardin,
  },
  {
    id: "granja",
    rubro: "agroveterinaria",
    nombre: "Granja",
    descripcion: "Granero rojo, cerco de madera, huellas, herradura y sacos",
    paleta: { id: "tematico-granja", nombre: "Granja", modo: "oscuro", principal: "#fde68a", secundario: "#fca5a5", acento: "#bbf7d0", botones: "#fde68a", fondo1: "#0f1a0c", fondo2: "#1f3318" },
    muestra: `${GRANERO} right 8px top 6px / 34px 27px no-repeat, ${CERCO} left 0 bottom 0 / 60px 35px repeat-x, ${TABLAS_GRANERO}`,
    escena: ESCENA_GRANJA,
    css: granja,
  },
  {
    id: "tendedero",
    rubro: "lavanderia",
    nombre: "Tendedero",
    descripcion: "Ropa colgada, burbujas de jabón, lavadora girando y canasta",
    paleta: { id: "tematico-tendedero", nombre: "Tendedero", modo: "claro", principal: "#0e7490", secundario: "#be185d", acento: "#6d28d9", botones: "#0e7490", fondo1: "#f5fbfd", fondo2: "#e6f4f8" },
    muestra: `${LAVADORA} right 10px top 6px / 26px 29px no-repeat, ${TENDEDERO_ROPA} left 0 bottom 0 / 135px 36px repeat-x, ${BURBUJAS_JABON} 0 0 / 110px 110px, ${AIRE_LIMPIO}`,
    css: tendedero,
  },
  {
    id: "neon-intimo",
    rubro: "sex-shop",
    nombre: "Neón íntimo",
    descripcion: "Terciopelo negro, neón rosa y morado, corazones, labios y antifaz",
    paleta: { id: "tematico-neon-intimo", nombre: "Neón íntimo", modo: "oscuro", principal: "#f472b6", secundario: "#c084fc", acento: "#fb7185", botones: "#f9a8d4", fondo1: "#0a0408", fondo2: "#1a0a16" },
    muestra: `${NEON_CORAZON} right 10px top 8px / 34px 30px no-repeat, ${LUCES_CORAZON} left 0 bottom 0 / 72px 26px repeat-x, ${CORAZONES_TENUES} 0 0 / 100px 100px, linear-gradient(180deg, #220a1b, #0a0408)`,
    css: neonIntimo,
  },
];

export function tematicoDe(tema) {
  if (!tema?.tematico) return null;
  return TEMATICOS.find((t) => t.id === tema.tematico && t.rubro === tema.rubro) || null;
}

export function tematicosDelRubro(claveRubro) {
  return TEMATICOS.filter((t) => t.rubro === claveRubro);
}
