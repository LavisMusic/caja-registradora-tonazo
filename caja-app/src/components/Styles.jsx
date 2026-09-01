export default function Styles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;800;900&family=Rajdhani:wght@500;600;700&display=swap');

      .tz-root {
        --bg-1: #0a0716;
        --bg-2: #170e2e;
        --panel: rgba(26, 19, 48, 0.55);
        --panel-solid: #140d28;
        --border-soft: rgba(255,255,255,0.08);
        --cyan: #2be8ff;
        --pink: #ff2f9e;
        --yellow: #d7ff3b;
        --text: #f4f2ff;
        --text-dim: #9c93c2;
        --danger: #ff5470;
        --green: #39ffb0;
        --green-bg: rgba(57,255,176,0.12);
        --orange: #ff9500;
        --orange-glow: rgba(255,149,0,0.5);
        --yape: #b621ff;
        --plin: #00e0c6;
        --gris: #9ca3af;

        --tz-footer-h: 84px;

        min-height: 100vh;
        width: 100%;
        background:
          radial-gradient(ellipse 900px 500px at 20% -10%, rgba(43,232,255,0.10), transparent 60%),
          radial-gradient(ellipse 900px 500px at 90% 10%, rgba(255,47,158,0.10), transparent 60%),
          linear-gradient(160deg, var(--bg-1), var(--bg-2) 55%, var(--bg-1));
        color: var(--text);
        font-family: 'Rajdhani', sans-serif;
        box-sizing: border-box;
      }
      .tz-root *, .tz-root *::before, .tz-root *::after { box-sizing: border-box; }

      /* Anti auto-zoom de Safari/iOS: si un input/textarea/select
         enfocado tiene font-size < 16px, Safari agranda TODO el
         viewport al tocarlo (así el usuario "vea" lo que escribe),
         descuadrando este diseño compacto tipo app nativa — el usuario
         queda obligado a pellizcar hacia afuera para volver a ver la
         pantalla completa. El meta viewport con user-scalable=0
         (index.html) ayuda, pero versiones recientes de iOS lo
         ignoran por accesibilidad — esta regla es la que realmente
         previene el zoom en el origen. Global e incondicional (gana
         sobre cualquier font-size más chico definido en clases
         puntuales como .tz-text-input) y solo en mobile: en
         tablet/desktop no hace falta, ahí no hay auto-zoom táctil. */
      @media (max-width: 767px) {
        .tz-root input,
        .tz-root textarea,
        .tz-root select {
          font-size: 16px !important;
        }
      }
      /* index.css (plantilla base de Vite) trae "h1, h2 { color:
         var(--text-h) }" — negro cuando el SO está en modo claro. Esa
         regla apunta directo al h1/h2, así que gana por sobre el
         color:var(--text) heredado de .tz-root (la herencia solo
         aplica si NINGUNA regla matchea el elemento directamente).
         Sin este reset, todo título de modal ("¿Qué variante?",
         "Descuento", "Usuarios", etc.) y cada encabezado de subgrupo
         del catálogo se renderiza en negro sobre el fondo oscuro. */
      .tz-root h1, .tz-root h2 { color: var(--text); }

      .tz-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 14px;
        min-height: 100vh;
        color: var(--text-dim);
        font-family: 'Rajdhani', sans-serif;
        font-size: 18px;
      }
      .tz-spin { animation: tz-spin 1s linear infinite; color: var(--cyan); }
      @keyframes tz-spin { to { transform: rotate(360deg); } }

      /* ---------- FASE 1: BLOQUEO DE CAJA (cajero) ---------- */
      .tz-caja-blocked {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        min-height: 100vh;
        padding: 24px;
        text-align: center;
        color: var(--danger);
      }
      .tz-caja-blocked-logo { width: 90px; height: auto; margin-bottom: 8px; opacity: 0.9; }
      .tz-caja-blocked h1 {
        margin: 4px 0 0;
        font-family: 'Orbitron', sans-serif;
        font-size: 24px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .tz-caja-blocked p {
        margin: 0;
        color: var(--text-dim);
        font-family: 'Rajdhani', sans-serif;
        font-size: 15px;
        font-weight: 600;
      }
      .tz-caja-fondo-readonly {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        margin: 10px 0;
        padding: 14px 24px;
        background: var(--panel-solid);
        border: 1px solid var(--border-soft);
        border-radius: 14px;
      }
      .tz-caja-fondo-readonly span {
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--text-dim);
        font-weight: 700;
      }
      .tz-caja-fondo-readonly strong {
        font-family: 'Orbitron', sans-serif;
        font-size: 28px;
        color: var(--green);
        text-shadow: 0 0 16px rgba(57,255,176,0.5);
      }
      .tz-caja-blocked-logout { margin-top: 14px; }
      .tz-caja-apertura-backdrop { cursor: default; }
      .tz-caja-blocked .tz-submit-btn { width: auto; min-width: 240px; }
      /* UX Bug 2: "Reportar mal conteo" — secundario, nunca compite
         visualmente con "Confirmar Turno" (la acción esperada). */
      .tz-caja-blocked-reportar {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-top: 10px;
        padding: 10px 18px;
        min-width: 240px;
        background: transparent;
        border: 1px solid rgba(255,149,0,0.4);
        border-radius: 999px;
        color: var(--orange);
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        font-size: 13px;
        cursor: pointer;
      }
      .tz-caja-blocked-reportar:hover { background: rgba(255,149,0,0.1); }

      /* ---------- HEADER ---------- */
      /* El logo y el texto ya NO son una barra fija/flotante: viven en el
         flujo normal del documento, al principio de la página, como
         cualquier otro contenido. Así es estructuralmente imposible que
         tapen a los medidores de más abajo (se desplazan con el scroll
         igual que todo lo demás).
         overflow: visible + padding generoso evitan que el resplandor
         (drop-shadow) del logo se vea recortado en un "cuadrado". */
      .tz-header {
        position: static;
        width: 100%;
        box-sizing: border-box;
        overflow: visible;
        padding: 20px 14px 22px;
        background: rgba(10, 7, 22, 0.85);
        border-bottom: 1px solid rgba(43,232,255,0.15);
      }
      /* Distribución en 3 zonas: columna izquierda (Fiados / Top
         Clientes) / centro (logo) / columna derecha (Salir / Pagos /
         Usuarios). Las dos columnas laterales usan el MISMO flex-grow
         (1) entre sí — así, sin importar que el cajero vea solo 1
         botón a la derecha y el admin vea 3, ambas columnas siempre
         ocupan el mismo ancho y el logo queda perfectamente centrado.
         El centro usa un flex-grow mayor para quedarse con más
         espacio (no necesita ser exactamente 1/3). */
      .tz-header-row {
        width: 100%;
        max-width: 100%;
        margin: 0 auto;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        overflow: visible;
      }
      .tz-header-side {
        flex: 1 1 0;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .tz-header-side-left { align-items: flex-start; }
      .tz-header-side-right { align-items: flex-end; }
      .tz-header-center {
        flex: 1.6 1 0;
        min-width: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        overflow: visible;
      }
      .tz-logo {
        max-width: 130px;
        width: 100%;
        height: auto;
        overflow: visible;
        filter:
          drop-shadow(0 0 18px rgba(43,232,255,0.55))
          drop-shadow(0 0 34px rgba(255,47,158,0.35));
      }
      .tz-subtitle {
        margin: 0;
        font-family: 'Orbitron', sans-serif;
        font-size: 11px;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        color: var(--text-dim);
        text-align: center;
      }
      .tz-conn-indicator {
        display: flex;
        align-items: center;
        gap: 5px;
        margin-top: 6px;
        padding: 3px 9px;
        border-radius: 999px;
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        font-size: 10.5px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        border: 1px solid transparent;
      }
      .tz-conn-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .tz-conn-online {
        color: var(--green);
        background: rgba(57,255,176,0.1);
        border-color: rgba(57,255,176,0.35);
      }
      .tz-conn-online .tz-conn-dot { background: var(--green); box-shadow: 0 0 6px rgba(57,255,176,0.8); }
      .tz-conn-offline {
        color: var(--danger);
        background: rgba(255,84,112,0.1);
        border-color: rgba(255,84,112,0.4);
        animation: tz-conn-offline-pulse 1.6s ease-in-out infinite;
      }
      .tz-conn-offline .tz-conn-dot { background: var(--danger); box-shadow: 0 0 6px rgba(255,84,112,0.8); }
      @keyframes tz-conn-offline-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }

      /* Botones del header (Fiados / Métodos de pago). En móvil (base,
         mobile-first) solo se ve el ícono, para ahorrar espacio.
         Naranja neón en el ícono/texto y el borde. */
      .tz-header-btn {
        flex: 0 0 auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        background: rgba(255,149,0,0.06);
        border: 1px solid rgba(255,149,0,0.45);
        color: var(--orange);
        border-radius: 12px;
        padding: 9px;
        cursor: pointer;
        box-shadow: 0 0 10px rgba(255,149,0,0.15);
        transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease,
          box-shadow 0.15s ease;
      }
      .tz-header-btn svg {
        filter: drop-shadow(0 0 4px var(--orange-glow));
      }
      .tz-header-btn:hover {
        color: var(--orange);
        border-color: var(--orange);
        background: rgba(255,149,0,0.16);
        box-shadow: 0 0 16px rgba(255,149,0,0.4);
      }
      .tz-header-btn-label {
        display: none;
        font-size: 9px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        font-weight: 700;
        white-space: nowrap;
      }

      .tz-header-payment-wrap { position: relative; flex: 0 0 auto; }

      .tz-payment-menu {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        z-index: 60;
        background: var(--panel-solid);
        border: 1px solid var(--border-soft);
        border-radius: 12px;
        padding: 6px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 170px;
        max-width: calc(100vw - 28px);
        box-sizing: border-box;
        box-shadow: 0 8px 30px rgba(0,0,0,0.5);
      }
      .tz-payment-menu-item {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        box-sizing: border-box;
        background: transparent;
        border: none;
        border-radius: 8px;
        padding: 10px 10px;
        color: var(--text);
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        font-size: 13px;
        cursor: pointer;
        text-align: left;
      }
      .tz-payment-menu-item:hover { background: rgba(43,232,255,0.1); }
      .tz-payment-menu-amount {
        margin-left: auto;
        color: var(--green);
        font-size: 11.5px;
        font-weight: 800;
      }

      /* ---- autocompletado de Razón Social (Gastos) ---- */
      .tz-suggest-wrap { position: relative; }
      .tz-suggest-list {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        z-index: 60;
        background: var(--panel-solid);
        border: 1px solid var(--border-soft);
        border-radius: 10px;
        padding: 4px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        max-height: 200px;
        overflow-y: auto;
        box-shadow: 0 8px 30px rgba(0,0,0,0.5);
      }
      .tz-suggest-item {
        display: flex;
        flex-direction: column;
        gap: 1px;
        width: 100%;
        box-sizing: border-box;
        background: transparent;
        border: none;
        border-radius: 7px;
        padding: 8px 10px;
        color: var(--text);
        font-family: 'Rajdhani', sans-serif;
        text-align: left;
        cursor: pointer;
      }
      .tz-suggest-item:hover { background: rgba(43,232,255,0.1); }
      .tz-suggest-item-name { font-weight: 700; font-size: 13px; }
      .tz-suggest-item-ruc { font-size: 11px; color: var(--text-dim); }

      /* ---------- CONTENEDOR PRINCIPAL (mobile-first) ---------- */
      /* 100% del ancho + box-sizing: border-box para que ningún hijo
         (medidores, tarjetas, textos) se corte por los bordes.
         El header ya NO es fixed (ver arriba), así que solo hace falta
         un padding-top chico de respiro, no uno gigante para "esquivar"
         nada. El padding-bottom sí usa la altura real del footer
         (--tz-footer-h), porque esa barra sí es fixed y cambia de
         tamaño según cuántos productos hay seleccionados (o
         desaparece del todo).
         SIN overflow-x:hidden a propósito (antes lo tenía): recortaba
         el resplandor de las tarjetas — Combo, Estrella, recién
         reactivada — apenas tocaban el borde izquierdo/derecho de la
         grilla. Mismo criterio que .tz-header más arriba: overflow
         visible + padding generoso, no un clip. */
      .tz-main {
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
        margin: 0;
        padding-left: 16px;
        padding-right: 16px;
        padding-top: 20px;
        padding-bottom: calc(var(--tz-footer-h, 0px) + 24px);
        overflow-x: visible;
      }

      /* ---------- FILTROS SUPERIORES (Parte 3, solo admin — y el
         filtro público de sucursal del catálogo, que reusa esta misma
         clase) ----------
         Barra oscura con borde/glow cyan — mismo lenguaje "premium
         cyberpunk" que ya usa el resto de la app (--panel-solid +
         var(--cyan)), no un estilo nuevo aislado.
         Mobile-first (equivalente a 'flex flex-col md:flex-row
         justify-center items-center gap-4'): en pantallas angostas los
         filtros caen en una sola columna, cada uno ocupando el ancho
         disponible (mejor para tocar) — desde 768px (el 'md:' de
         Tailwind) vuelven a la fila horizontal, siempre CENTRADA (antes
         quedaba pegada a la izquierda). */
      .tz-admin-filterbar {
        width: 100%;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 14px;
        padding: 14px 16px;
        background: linear-gradient(180deg, rgba(43,232,255,0.06), rgba(10,7,22,0.4));
        border-bottom: 1px solid rgba(43,232,255,0.22);
        box-shadow: 0 4px 24px rgba(43,232,255,0.08) inset;
      }
      .tz-admin-filter-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
        width: 100%;
        max-width: 360px;
      }
      @media (min-width: 768px) {
        .tz-admin-filterbar {
          flex-direction: row;
          flex-wrap: wrap;
          align-items: flex-end;
        }
        .tz-admin-filter-group {
          width: auto;
          max-width: none;
          min-width: 170px;
        }
      }
      .tz-admin-filter-label {
        font-family: 'Orbitron', sans-serif;
        font-size: 9.5px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--cyan);
        text-shadow: 0 0 10px rgba(43,232,255,0.5);
      }
      .tz-admin-filter-select {
        appearance: none;
        width: 100%;
        box-sizing: border-box;
        background: var(--panel-solid);
        border: 1px solid rgba(43,232,255,0.4);
        border-radius: 10px;
        color: var(--text);
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        font-size: 13px;
        padding: 9px 30px 9px 12px;
        cursor: pointer;
        box-shadow: 0 0 14px rgba(43,232,255,0.15);
        background-image: linear-gradient(45deg, transparent 50%, var(--cyan) 50%),
          linear-gradient(135deg, var(--cyan) 50%, transparent 50%);
        background-position: calc(100% - 16px) center, calc(100% - 11px) center;
        background-size: 5px 5px, 5px 5px;
        background-repeat: no-repeat;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }
      .tz-admin-filter-select:hover,
      .tz-admin-filter-select:focus {
        outline: none;
        border-color: var(--cyan);
        box-shadow: 0 0 20px rgba(43,232,255,0.4);
      }
      .tz-admin-filter-select option { background: var(--panel-solid); color: var(--text); }
      /* Fila select + botón "+" (creación dinámica de Localidad/Sucursal) */
      .tz-admin-filter-row { display: flex; align-items: center; gap: 6px; }
      .tz-admin-filter-row .tz-admin-filter-select { flex: 1 1 auto; min-width: 0; }
      .tz-admin-filter-add-btn {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: 999px;
        background: rgba(43,232,255,0.1);
        border: 1px solid rgba(43,232,255,0.4);
        color: var(--cyan);
        cursor: pointer;
        transition: background 0.15s ease, box-shadow 0.15s ease;
      }
      .tz-admin-filter-add-btn:hover {
        background: rgba(43,232,255,0.22);
        box-shadow: 0 0 14px rgba(43,232,255,0.4);
      }
      .tz-admin-filter-tag {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 9px 14px;
        border-radius: 999px;
        font-family: 'Rajdhani', sans-serif;
        font-weight: 800;
        font-size: 12px;
        letter-spacing: 0.02em;
        white-space: nowrap;
        border: 1px solid rgba(43,232,255,0.4);
        color: var(--text);
        background: rgba(43,232,255,0.08);
      }
      .tz-admin-filter-tag-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .tz-admin-filter-tag.is-abierta .tz-admin-filter-tag-dot {
        background: var(--green);
        box-shadow: 0 0 8px rgba(57,255,176,0.8);
      }
      .tz-admin-filter-tag.is-cerrada .tz-admin-filter-tag-dot {
        background: var(--danger);
        box-shadow: 0 0 8px rgba(255,84,112,0.7);
      }

      /* ---------- STATS ---------- */
      /* 6 medidores en 2 filas x 3 columnas, en todo tamaño de pantalla.
         Usamos fracciones (1fr) en vez de minmax(): las columnas siempre
         suman exactamente el ancho disponible, así que nunca desbordan
         (a diferencia de minmax(160px,1fr), que sí podía forzar overflow
         en pantallas angostas). El texto largo solo se envuelve más,
         nunca corta el layout. */
      .tz-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-bottom: 20px;
      }

      /* ---- Partes 4/5: placeholder cuando el admin todavía no eligió
         sucursal/caja arriba — reemplaza TODO el dashboard financiero,
         nunca lo mezcla. ---- */
      .tz-admin-sin-vista {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 10px;
        padding: 48px 20px;
        margin-bottom: 20px;
        background: var(--panel);
        border: 1px dashed rgba(43,232,255,0.35);
        border-radius: 16px;
        color: var(--cyan);
      }
      .tz-admin-sin-vista h2 {
        margin: 0;
        font-family: 'Orbitron', sans-serif;
        font-size: 15px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .tz-admin-sin-vista p {
        margin: 0;
        max-width: 420px;
        font-size: 13px;
        color: var(--text-dim);
      }
      .tz-stat-chip {
        min-width: 0;
        box-sizing: border-box;
        background: var(--panel);
        border: 1px solid var(--border-soft);
        border-radius: 12px;
        padding: 9px 8px;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .tz-stat-label {
        font-size: 9.5px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-dim);
        font-weight: 600;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 4px;
        line-height: 1.2;
      }
      .tz-stat-value {
        font-family: 'Orbitron', sans-serif;
        font-size: 15px;
        font-weight: 700;
        overflow-wrap: anywhere;
        line-height: 1.15;
      }
      .tz-stat-sub {
        font-size: 9px;
        color: var(--text-dim);
        font-weight: 600;
        overflow-wrap: anywhere;
        line-height: 1.2;
      }
      .tz-cyan { color: var(--cyan); text-shadow: 0 0 14px rgba(43,232,255,0.5); }
      .tz-pink { color: var(--pink); text-shadow: 0 0 14px rgba(255,47,158,0.5); }
      .tz-yellow { color: var(--yellow); text-shadow: 0 0 14px rgba(215,255,59,0.5); }
      .tz-green { color: var(--green); text-shadow: 0 0 14px rgba(57,255,176,0.5); }

      .tz-stat-chip-green {
        border-color: rgba(57,255,176,0.35);
        background: linear-gradient(180deg, var(--green-bg), var(--panel));
      }
      .tz-stat-chip-star {
        border-color: rgba(215,255,59,0.4);
        background: linear-gradient(180deg, rgba(215,255,59,0.10), var(--panel));
      }
      .tz-star-text {
        font-family: 'Orbitron', sans-serif;
        font-size: 15px;
        font-weight: 700;
        color: var(--yellow);
        text-shadow: 0 0 12px rgba(215,255,59,0.45);
        line-height: 1.25;
      }

      /* ---------- BUSCADOR GLOBAL + ESCÁNER RÁPIDO (pantalla principal) ---------- */
      .tz-global-search {
        margin-bottom: 16px;
      }
      .tz-global-search-wrap {
        position: relative;
        flex: 1 1 auto;
        min-width: 0;
      }
      .tz-global-search-wrap .tz-text-input {
        width: 100%;
        margin: 0;
      }
      .tz-global-search-dropdown {
        position: absolute;
        top: calc(100% + 6px);
        left: 0;
        right: 0;
        z-index: 60;
        /* Fondo SÓLIDO (no 'var(--panel)', que es semitransparente —
           rgba con alpha 0.55 — y se mezclaba con las pestañas de
           categoría detrás del dropdown). 'var(--panel-solid)' es la
           misma variable que ya usan .tz-modal y .tz-payment-menu para
           flotar opaco sobre el resto de la interfaz. */
        background: var(--panel-solid);
        border: 1px solid var(--border-soft);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 8px 30px rgba(0,0,0,0.5);
        max-height: 320px;
        overflow-y: auto;
      }
      .tz-global-search-item {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 2px;
        text-align: left;
        background: transparent;
        border: none;
        border-bottom: 1px solid var(--border-soft);
        color: var(--text);
        padding: 10px 14px;
        cursor: pointer;
        font-family: 'Rajdhani', sans-serif;
      }
      .tz-global-search-item:last-child { border-bottom: none; }
      .tz-global-search-item:hover,
      .tz-global-search-item:focus-visible {
        background: rgba(43,232,255,0.08);
      }
      .tz-global-search-item-name {
        font-weight: 700;
        font-size: 14px;
      }
      .tz-global-search-item-meta {
        font-size: 11.5px;
        color: var(--text-dim);
      }

      /* ---------- TABS ---------- */
      .tz-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 22px;
      }
      .tz-tab {
        flex: 1 1 calc(50% - 5px);
        min-width: 0;
        box-sizing: border-box;
        padding: 13px 10px;
        border-radius: 12px;
        border: 1px solid var(--border-soft);
        background: rgba(255,255,255,0.02);
        color: var(--text-dim);
        font-family: 'Orbitron', sans-serif;
        font-size: 11.5px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .tz-tab:hover { border-color: rgba(43,232,255,0.4); color: var(--text); }
      .tz-tab-active {
        background: var(--cyan);
        color: #06131a;
        border-color: var(--cyan);
        box-shadow: 0 0 22px rgba(43,232,255,0.45);
      }

      /* ---- Tab "COMBOS": tratamiento neón exclusivo (fondo amarillo +
         pulsación + shimmer que recorre el borde) para invitar al
         click — matchea por nombre de categoría en CatalogPage/App.jsx,
         no por posición, así que sigue funcionando aunque se reordenen
         las categorías (punto 3 del pedido). */
      .tz-tab-combos {
        position: relative;
        overflow: hidden;
        color: #241b00;
        background: linear-gradient(135deg, #fff35c, #ffd60a);
        border-color: #ffe066;
        animation: tz-tab-combos-pulse 1.8s ease-in-out infinite;
      }
      .tz-tab-combos:hover { color: #241b00; border-color: #ffe066; }
      .tz-tab-combos::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.7) 50%, transparent 70%);
        transform: translateX(-120%);
        animation: tz-tab-combos-shimmer 2.6s ease-in-out infinite;
      }
      .tz-tab-combos.tz-tab-active {
        background: linear-gradient(135deg, #ffe066, #ffb400);
        border-color: #fff35c;
        box-shadow: 0 0 26px rgba(255,214,10,0.75);
      }
      @keyframes tz-tab-combos-pulse {
        0%, 100% { box-shadow: 0 0 10px rgba(255,214,10,0.5); }
        50% { box-shadow: 0 0 22px rgba(255,214,10,0.95); }
      }
      @keyframes tz-tab-combos-shimmer {
        0% { transform: translateX(-120%); }
        55%, 100% { transform: translateX(120%); }
      }

      /* ---------- GROUPS / PRODUCTS ---------- */
      .tz-group { margin-bottom: 26px; }
      .tz-group-heading {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 14px;
      }
      .tz-badge {
        background: var(--yellow);
        color: #16190a;
        font-family: 'Orbitron', sans-serif;
        font-weight: 800;
        font-size: 13px;
        padding: 6px 10px;
        border-radius: 8px;
        box-shadow: 0 0 16px rgba(215,255,59,0.4);
      }
      .tz-group-heading h2 {
        margin: 0;
        font-family: 'Orbitron', sans-serif;
        font-size: 15px;
        letter-spacing: 0.03em;
        text-transform: uppercase;
      }

      .tz-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 14px;
      }

      .tz-card {
        position: relative;
        cursor: pointer;
        border-radius: 16px;
        min-width: 0;
        box-sizing: border-box;
        padding: 18px;
        background:
          linear-gradient(var(--panel-solid), var(--panel-solid)) padding-box,
          linear-gradient(135deg, rgba(43,232,255,0.55), rgba(255,47,158,0.5)) border-box;
        border: 1px solid transparent;
        /* 'transform' se queda rápido (hover necesita sentirse
           inmediato); todo lo relacionado al glow/apagado — sombra,
           fondo (el degradé del borde), y opacity/filter de
           .tz-card-disabled — pasa a 0.5s ease-in-out para que
           agotado <-> disponible (llegue por una venta, una edición
           del Gestor de Productos, o Realtime desde otra pestaña) se
           sienta como un fundido, nunca un salto brusco. */
        transition:
          transform 0.12s ease,
          box-shadow 0.5s ease-in-out,
          background 0.5s ease-in-out,
          border-color 0.5s ease-in-out,
          opacity 0.5s ease-in-out,
          filter 0.5s ease-in-out;
        display: flex;
        flex-direction: column;
        gap: 14px;
        min-height: 148px;
        /* #root (index.css, plantilla de Vite) hereda text-align:center a
           todo el árbol; sin este reset, texto corto como la descripción
           de variante ("600ml") queda centrado dentro de la tarjeta en
           vez de pegado a la izquierda debajo del nombre. */
        text-align: left;
      }
      .tz-card:hover { transform: translateY(-2px); }

      /* ---- Módulo de Imágenes: CUADRADO perfecto de tamaño FIJO al
         costado izquierdo de la tarjeta (ver .tz-card-row, que ahora
         centra verticalmente con align-items:center) — nunca un
         rectángulo ni 'width:100%' arriba (eso deformaba/achicaba mal).
         Base oscura pero NO negro puro (a pedido: "mezcla los colores
         sobre una base ligeramente más clara") para que el glow de la
         capa Aurora de abajo tenga contra qué contrastar sin quemar la
         vista. 'position:relative' es obligatorio acá (no solo en el
         modificador -editable): es el ancla de las 2 capas absolutas
         de abajo. */
      .tz-product-image {
        position: relative;
        width: 144px;
        height: 144px;
        flex-shrink: 0;
        border-radius: 14px;
        overflow: hidden;
        background: #14101f;
        border: 1px solid var(--border-soft);
        --mouse-x: 50%;
        --mouse-y: 50%;
      }
      /* Capa trasera (z-index 0): "Mesh Gradient" tipo Aurora — 3
         manchas radiales (cyan/fucsia/amarillo) con bordes MUY
         difuminados (varios stops de color hasta transparent, en vez
         de un filter:blur real) que se desplazan rápido y en bucle.
         Evité 'filter: blur()' a propósito: con muchas tarjetas
         visibles a la vez en la grilla, un blur por tarjeta es
         bastante más pesado para el navegador que gradientes con
         degradé suave — el resultado visual es prácticamente el mismo.
         Solo se anima 'background-position' (ease-in-out), así el
         movimiento se siente fluido y nunca parpadea. */
      .tz-product-image-particles {
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background-image:
          radial-gradient(circle at 20% 25%, rgba(43,232,255,0.65) 0%, rgba(43,232,255,0.22) 32%, transparent 62%),
          radial-gradient(circle at 80% 30%, rgba(255,47,158,0.6) 0%, rgba(255,47,158,0.2) 34%, transparent 64%),
          radial-gradient(circle at 50% 85%, rgba(215,255,59,0.5) 0%, rgba(215,255,59,0.16) 34%, transparent 64%);
        background-size: 200% 200%;
        animation: tz-aurora-drift 5s ease-in-out infinite alternate;
      }
      @keyframes tz-aurora-drift {
        0% { background-position: 10% 15%; }
        50% { background-position: 70% 55%; }
        100% { background-position: 30% 80%; }
      }
      /* Capa intermedia (z-index 1): sigue al cursor vía --mouse-x/
         --mouse-y (seteadas en JS por ProductImage.jsx en onMouseMove,
         mutación directa del DOM — ver el componente). En reposo es
         invisible (opacity 0); al pasar el mouse aparece un glow
         blanco/cyan centrado en el cursor con mix-blend-mode:
         color-dodge, que "quema"/empuja los colores del Aurora de
         abajo como si el cursor agitara un líquido luminoso. Sin
         'pointer-events' propios: no debe robarle el hover al padre.

         CRÍTICO: la 'transition' de acá NUNCA debe tocar --mouse-x/
         --mouse-y (ni top/left/transform si el día de mañana se migra
         a esa técnica) — eso fue justo lo que causaba el retraso
         perceptible al mover el mouse: cada frame el navegador
         animaba HACIA la nueva posición en vez de pintarla al
         instante. Solo 'opacity' anima (entrada/salida del hover); la
         posición responde 1:1 con el cursor, cero latencia. */
      .tz-product-image-liquid {
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        background-image: radial-gradient(
          circle at var(--mouse-x) var(--mouse-y),
          rgba(255,255,255,0.95) 0%,
          rgba(43,232,255,0.65) 22%,
          transparent 55%
        );
        mix-blend-mode: color-dodge;
        opacity: 0;
        transition: opacity 0.4s ease;
      }
      .tz-product-image:hover .tz-product-image-liquid { opacity: 1; }
      /* Capa delantera (z-index 10): la foto del producto (PNG con
         fondo removido por la IA, o cualquier foto normal) SIEMPRE en
         object-contain — nunca cover, se vería recortada/estirada — con
         un poco de padding para que no choque contra los bordes del
         cuadro. Drop-shadow natural (ya no un halo negro pesado: el
         fondo ahora es luz suave, no una fiesta de láseres) — solo
         separa el producto del glow de atrás con un toque 3D. */
      .tz-product-image-cutout {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
        padding: 8px;
        z-index: 10;
        filter: drop-shadow(0 8px 10px rgba(0,0,0,0.5));
      }
      .tz-product-image-placeholder {
        position: relative;
        z-index: 10;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-dim);
        opacity: 0.6;
      }
      .tz-product-image-editable {
        cursor: pointer;
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .tz-product-image-editable:hover {
        border-color: var(--cyan);
        box-shadow: 0 0 14px rgba(43,232,255,0.3);
      }
      .tz-product-image-edit-badge {
        position: absolute;
        bottom: 6px;
        right: 6px;
        z-index: 20;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: rgba(10,7,20,0.75);
        border: 1px solid var(--cyan);
        color: var(--cyan);
      }
      /* Versión compacta: mini imagen por variante dentro del modal
         "¿Qué variante?" (tz-variant-card). Tamaño fijo pequeño +
         flex-shrink:0 para que, sumada a tz-variant-card-info
         (min-width:0; flex:1 1 0%) y tz-variant-card-actions
         (flex-shrink:0), los 3 bloques (imagen | info | %,lápiz,+)
         siempre quepan en una fila incluso en celulares angostos —
         mismo criterio ya usado para no empujar botones fuera de la
         tarjeta principal. */
      .tz-product-image-sm {
        width: 48px;
        height: 48px;
        border-radius: 10px;
      }
      .tz-product-image-edit-badge-sm {
        width: 16px;
        height: 16px;
        bottom: 2px;
        right: 2px;
      }
      /* Mostrador público (CatalogPage): mismas tarjetas que el Admin,
         pero sin gesto de clic — nada de mano/pointer ni levante al
         pasar el mouse, para no insinuar una interacción que no existe. */
      .tz-card-readonly { cursor: default; }
      .tz-card-readonly:hover { transform: none; }
      .tz-card-checked {
        box-shadow: 0 0 0 1.5px var(--cyan), 0 0 26px rgba(43,232,255,0.35);
      }
      .tz-card-disabled {
        cursor: not-allowed;
        opacity: 0.45;
        filter: grayscale(0.4);
      }
      .tz-card-disabled:hover { transform: none; }

      .tz-card-star {
        background:
          linear-gradient(var(--panel-solid), var(--panel-solid)) padding-box,
          linear-gradient(135deg, rgba(215,255,59,0.9), rgba(215,255,59,0.35)) border-box;
        box-shadow: 0 0 0 1.5px var(--yellow), 0 0 30px rgba(215,255,59,0.4);
      }
      .tz-card-star.tz-card-checked {
        box-shadow: 0 0 0 1.5px var(--yellow), 0 0 8px var(--cyan) inset, 0 0 30px rgba(215,255,59,0.45);
      }

      /* ---- Combos: glow amarillo "sensacionalista" para que resalten
         como ofertas en la grilla, con una pulsación sutil (no un
         parpadeo agresivo) que invite a mirarlos dos veces. Va DESPUÉS
         de tz-card-star para ganarle el box-shadow/background si un
         combo también fuera "Estrella" — dos glows a la vez ilegibles
         no suman nada, se prioriza el del combo. ---- */
      .tz-card-combo {
        border-color: transparent;
        background:
          linear-gradient(var(--panel-solid), var(--panel-solid)) padding-box,
          linear-gradient(135deg, rgba(255,225,0,0.95), rgba(255,153,0,0.55)) border-box;
        animation: tz-card-combo-glow 2.4s ease-in-out infinite;
      }
      @keyframes tz-card-combo-glow {
        0%, 100% { box-shadow: 0 0 14px rgba(255,225,0,0.45), 0 0 28px rgba(255,225,0,0.18); }
        50% { box-shadow: 0 0 24px rgba(255,225,0,0.8), 0 0 42px rgba(255,225,0,0.35); }
      }
      /* Un combo AGOTADO no debe seguir brillando — sin esto,
         .tz-card-combo (arriba) sigue animando su borde/box-shadow por
         encima del apagado de .tz-card-disabled (selector de dos
         clases: gana por especificidad sin importar el orden). */
      .tz-card-combo.tz-card-disabled {
        animation: none;
        background: none;
        border-color: var(--border-soft);
        box-shadow: none;
      }
      /* Combo recién reactivado (su stock virtual pasó de 0 a > 0):
         pulso más intenso y en VERDE, a propósito distinto del
         amarillo/naranja permanente de .tz-card-combo de arriba, para
         que "ahora sí hay stock" se note aunque el cajero no estuviera
         mirando esta tarjeta en el instante exacto. Va DESPUÉS de
         .tz-card-combo en la hoja: mismo peso de selector, gana el que
         está más abajo, así que mientras dura tapa el glow normal.
         JS le quita esta clase a los ~2.5s (ver reactivatedComboIds en
         App.jsx) — el 'animation-iteration-count: 3' de acá abajo es
         solo estético, para que el pulso en sí se vea vivo mientras
         la clase sigue puesta. */
      .tz-card-reactivated {
        border-color: transparent;
        background:
          linear-gradient(var(--panel-solid), var(--panel-solid)) padding-box,
          linear-gradient(135deg, rgba(57,255,176,0.95), rgba(43,232,255,0.6)) border-box;
        animation: tz-card-reactivated-glow 0.8s ease-in-out 3;
      }
      @keyframes tz-card-reactivated-glow {
        0%, 100% { box-shadow: 0 0 16px rgba(57,255,176,0.5), 0 0 30px rgba(57,255,176,0.2); }
        50% { box-shadow: 0 0 34px rgba(57,255,176,0.95), 0 0 55px rgba(57,255,176,0.5); }
      }
      /* Lista vertical (una fila por ingrediente) — mismo tamaño/peso
         que .tz-card-detail (la descripción de cualquier producto
         normal), no un tamaño reducido aparte, para que un combo no
         se vea "más chico" que el resto de las tarjetas. */
      .tz-combo-ingredients-list {
        list-style: none;
        margin: 4px 0 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .tz-combo-ingredient-row {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-dim);
        overflow-wrap: anywhere;
      }

      /* Lápiz de precio: solo admin, vive EN EL FLUJO normal junto al
         checkbox de selección (mismo wrapper .tz-card-top-actions),
         no flotando encima — position:absolute lo hacía superponerse
         con el checkbox porque los dos "querían" la misma esquina. */
      .tz-card-top-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }
      .tz-card-edit-price-btn {
        flex-shrink: 0;
        width: 26px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        border: 1px solid var(--border-soft);
        background: rgba(255,255,255,0.08);
        color: var(--cyan);
        cursor: pointer;
      }
      .tz-card-edit-price-btn:hover { background: rgba(43,232,255,0.2); }
      /* Botón de Descuento: mismo tamaño/posición que el lápiz de
         precio (vive justo a su izquierda), en rosa neón para
         distinguirlo a simple vista. Estado "activo" (ya tiene un
         descuento aplicado) queda relleno en vez de solo el borde. */
      .tz-card-discount-btn {
        flex-shrink: 0;
        width: 26px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        border: 1px solid var(--border-soft);
        background: rgba(255,255,255,0.08);
        color: var(--pink);
        cursor: pointer;
      }
      .tz-card-discount-btn:hover { background: rgba(255,47,158,0.2); }
      .tz-card-discount-btn-active {
        background: rgba(255,47,158,0.28);
        border-color: var(--pink);
        box-shadow: 0 0 10px rgba(255,47,158,0.4);
      }
      .tz-star-ribbon {
        position: absolute;
        top: -13px;
        left: 18px;
        display: flex;
        align-items: center;
        gap: 5px;
        background: var(--yellow);
        color: #16190a;
        font-family: 'Orbitron', sans-serif;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.08em;
        padding: 5px 10px 4px;
        border-radius: 7px 7px 0 0;
        box-shadow: 0 0 16px rgba(215,255,59,0.55);
      }

      /* Fila horizontal: imagen (cuadrado fijo, .tz-product-image) a la
         izquierda + el resto del contenido de la tarjeta (título,
         descripción, ingredientes, stock, precio, botones) en
         .tz-card-main a la derecha — reemplaza el layout anterior
         donde la imagen iba arriba ocupando todo el ancho. Todo lo que
         antes vivía directo dentro de .tz-card (tz-card-top +
         tz-card-bottom) ahora vive dentro de tz-card-main SIN tocar su
         propia alineación interna (precio/acciones siguen a la
         derecha exactamente igual que antes). */
      .tz-card-row { display: flex; align-items: center; gap: 16px; }
      .tz-card-main {
        flex: 1 1 0%;
        min-width: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 14px;
      }
      .tz-card-top { display: flex; justify-content: space-between; gap: 10px; }
      /* flex-basis 0 (no 'auto'): el bloque de nombre+detalle arranca
         en 0 y crece solo hasta el espacio que sobra, en vez de pedir
         su ancho de contenido completo antes de repartir — así nunca
         empuja a tz-card-top-actions (%, lápiz, checkbox) fuera del
         ancho de la tarjeta en pantallas angostas. min-width:0 permite
         que el texto se achique por debajo del "ancho de contenido"
         normal y haga wrap en vez de forzar overflow. */
      .tz-card-info { min-width: 0; flex: 1 1 0%; }
      .tz-combo {
        display: block;
        font-family: 'Orbitron', sans-serif;
        font-size: 10.5px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--cyan);
        margin-bottom: 6px;
      }
      .tz-card-name {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        line-height: 1.25;
        overflow-wrap: anywhere;
      }
      .tz-name-plus {
        color: var(--green);
        text-shadow: 0 0 8px rgba(57,255,176,0.6);
        font-weight: 700;
      }
      .tz-card-detail {
        margin: 4px 0 0;
        font-size: 13px;
        color: var(--text-dim);
        font-weight: 600;
      }

      .tz-checkbox {
        flex-shrink: 0;
        width: 26px;
        height: 26px;
        border-radius: 8px;
        border: 1.5px solid rgba(255,255,255,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #06131a;
      }
      .tz-checkbox-on {
        background: var(--cyan);
        border-color: var(--cyan);
        box-shadow: 0 0 14px rgba(43,232,255,0.6);
      }

      .tz-card-bottom {
        /* Antes 'margin-top: auto' empujaba este bloque hasta el
           fondo de la tarjeta (para alinear precios entre tarjetas de
           distinta altura), pero dejaba un hueco vacío enorme cuando
           el bloque de arriba (nombre + detalle) era corto — ej. las
           tarjetas maestras agrupadas ("Hey FIT" + "X variantes").
           Sin 'auto', queda pegado justo debajo, usando el mismo gap
           que ya separa al resto de los hijos de .tz-card. */
        display: flex;
        flex-direction: column;
        gap: 10px;
        border-top: 1px dashed rgba(255,255,255,0.12);
        padding-top: 12px;
      }
      .tz-card-stockrow { display: flex; }
      .tz-tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.04em;
        padding: 4px 9px;
        border-radius: 999px;
        text-transform: uppercase;
      }
      .tz-tag-ok { color: var(--cyan); background: rgba(43,232,255,0.12); }
      .tz-tag-warn { color: var(--yellow); background: rgba(215,255,59,0.12); }
      .tz-tag-danger { color: var(--danger); background: rgba(255,84,112,0.14); }

      /* ---- Fase 2 "Inventario Inteligente": tarjeta maestra agrupada
         + modal de selección de variante ---- */
      .tz-card-group { border-style: dashed; }
      .tz-variant-modal { max-width: 420px; text-align: center; }
      .tz-variant-modal h2 { margin: 0 0 2px; }
      .tz-variant-modal-subtitle {
        color: var(--text-dim);
        font-size: 13px;
        margin: 0 0 16px;
      }
      .tz-variant-grid {
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-height: 60vh;
        overflow-y: auto;
        padding-right: 2px;
      }
      /* Cada variante ahora es un contenedor NO clicable (antes era un
         <button> entero que agregaba y cerraba el modal de una): a la
         izquierda la info, a la derecha una columna vertical de 3
         botones (Descuento / Editar precio / Agregar) — así el cajero
         puede seleccionar varias variantes distintas sin que el modal
         se cierre en cada click. */
      .tz-variant-card {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 14px;
        border: 1px solid var(--border-soft);
        background: rgba(255,255,255,0.04);
        color: var(--text);
        font-family: 'Rajdhani', sans-serif;
        text-align: left;
        transition: border-color 0.15s, background 0.15s;
      }
      .tz-variant-card-selected {
        border-color: var(--cyan);
        background: rgba(43,232,255,0.08);
        box-shadow: 0 0 0 1.5px var(--cyan);
      }
      .tz-variant-btn-disabled {
        cursor: not-allowed;
        opacity: 0.45;
        filter: grayscale(0.4);
      }
      .tz-variant-card-info {
        flex: 1 1 0%;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .tz-variant-btn-label {
        font-size: 15px;
        font-weight: 700;
        overflow-wrap: anywhere;
      }
      .tz-variant-btn-price {
        font-size: 13px;
        color: var(--text-dim);
      }
      .tz-variant-card-actions {
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .tz-variant-add-btn {
        position: relative;
        flex-shrink: 0;
        width: 26px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        border: 1px solid var(--cyan);
        background: rgba(43,232,255,0.12);
        color: var(--cyan);
        cursor: pointer;
      }
      .tz-variant-add-btn:hover:not(:disabled) { background: rgba(43,232,255,0.28); }
      .tz-variant-add-btn:disabled { cursor: not-allowed; opacity: 0.4; }
      .tz-variant-add-qty {
        position: absolute;
        top: -6px;
        right: -6px;
        min-width: 15px;
        height: 15px;
        padding: 0 3px;
        border-radius: 999px;
        background: var(--pink);
        color: #16041a;
        font-family: 'Orbitron', sans-serif;
        font-size: 9px;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* ---- Refactor de variantes v2: dots de color, chips de
         variedad y el selector de color reutilizable (ColorPicker) ---- */
      .tz-variant-dots {
        display: flex;
        align-items: center;
        gap: 5px;
        flex-wrap: wrap;
      }
      .tz-variant-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 1px solid rgba(255,255,255,0.35);
        display: inline-block;
        flex-shrink: 0;
      }
      /* Variante puntual en 0 dentro de una tarjeta maestra: borde rojo
         + parpadeo — visible aun si el color de la variante es
         parecido al del resto (ej. dos verdes distintos). */
      .tz-variant-dot-soldout {
        border: 2px solid var(--danger);
        animation: tz-dot-pulse 1.4s ease-in-out infinite;
      }
      @keyframes tz-dot-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(255,84,112,0.55); }
        50% { box-shadow: 0 0 0 4px rgba(255,84,112,0); }
      }
      .tz-variant-dot-inline {
        width: 9px;
        height: 9px;
        margin-right: 6px;
        vertical-align: middle;
      }

      .tz-variedades-quickadd {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px dashed var(--border-soft);
      }
      .tz-variant-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 8px 0 12px;
      }
      .tz-variant-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        border-radius: 999px;
        border: 1px solid var(--border-soft);
        background: rgba(255,255,255,0.04);
        color: var(--text);
        font-size: 12.5px;
        font-family: 'Rajdhani', sans-serif;
        cursor: pointer;
      }
      .tz-variant-chip:hover { background: rgba(255,255,255,0.09); }

      .tz-color-picker { margin: 8px 0; }
      .tz-color-swatches {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 6px;
      }
      .tz-color-swatch {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        border: 2px solid transparent;
        cursor: pointer;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.1s, border-color 0.15s;
      }
      .tz-color-swatch:hover { transform: scale(1.1); }
      .tz-color-swatch-active {
        border-color: var(--text);
        box-shadow: 0 0 0 2px rgba(255,255,255,0.15);
      }
      .tz-color-swatch-custom {
        position: relative;
        overflow: hidden;
        background: rgba(255,255,255,0.06);
        border: 2px dashed var(--border-soft);
        color: var(--text-dim);
      }
      .tz-color-swatch-custom input[type="color"] {
        position: absolute;
        inset: -6px;
        width: calc(100% + 12px);
        height: calc(100% + 12px);
        opacity: 0;
        cursor: pointer;
        border: none;
        padding: 0;
      }

      .tz-card-priceqty {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .tz-price-block { display: flex; flex-direction: column; align-items: flex-end; margin-left: auto; }
      .tz-price-label {
        font-size: 10px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--text-dim);
      }
      .tz-price {
        font-family: 'Orbitron', sans-serif;
        font-weight: 800;
        font-size: 21px;
        color: var(--pink);
        text-shadow: 0 0 16px rgba(255,47,158,0.5);
      }

      /* ---- Motor de descuentos: precio tachado + precio final +
         badge -X%, tanto en la tarjeta de producto como en el carrito
         (CartRow reusa .tz-discount-badge con un modificador inline). */
      .tz-price-original {
        font-family: 'Rajdhani', sans-serif;
        font-size: 12px;
        font-weight: 700;
        color: var(--text-dim);
        text-decoration: line-through;
      }
      .tz-price-discounted { color: var(--green); text-shadow: 0 0 16px rgba(57,255,176,0.5); }
      .tz-discount-badge {
        font-family: 'Orbitron', sans-serif;
        font-size: 10px;
        font-weight: 800;
        color: #16190a;
        background: var(--green);
        padding: 2px 6px;
        border-radius: 6px;
        box-shadow: 0 0 10px rgba(57,255,176,0.5);
      }
      .tz-discount-badge-inline { margin-left: 6px; vertical-align: middle; }

      .tz-qty-stepper {
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(255,255,255,0.04);
        border: 1px solid var(--border-soft);
        border-radius: 999px;
        padding: 4px 10px;
      }
      .tz-qty-stepper button {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: none;
        background: rgba(255,255,255,0.08);
        color: var(--text);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
      .tz-qty-stepper button:disabled { opacity: 0.3; cursor: not-allowed; }
      .tz-qty-stepper span {
        font-family: 'Orbitron', sans-serif;
        font-weight: 700;
        min-width: 16px;
        text-align: center;
      }

      /* Limpieza visual de tarjetas: reemplaza al viejo stepper [-][+]
         que vivía en la tarjeta del catálogo — solo texto informativo,
         sin controles (ajustar cantidad es exclusivo del carrito). */
      .tz-card-qty-display {
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        font-size: 11.5px;
        color: var(--cyan);
      }

      @keyframes tz-drop-in {
        from { opacity: 0; transform: translateY(-6px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* ---------- MODAL DE DESCUENTO ---------- */
      .tz-discount-type-toggle {
        display: flex;
        gap: 8px;
        margin-bottom: 14px;
      }
      .tz-discount-type-toggle .tz-tab { flex: 1 1 50%; }
      .tz-discount-preview {
        margin: 10px 0 0;
        font-size: 13px;
        color: var(--text-dim);
      }
      .tz-discount-preview strong { color: var(--green); font-size: 16px; }

      /* ---------- MODAL GLOBAL DE MÉTODOS DE PAGO ---------- */
      .tz-method-totals {
        display: flex;
        gap: 10px;
      }
      .tz-method-total {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        background: rgba(255,255,255,0.04);
        border: 1px solid var(--border-soft);
        border-radius: 10px;
        padding: 10px 8px;
      }
      .tz-method-total span {
        font-size: 10.5px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--text-dim);
        font-weight: 700;
      }
      .tz-method-total strong {
        font-family: 'Orbitron', sans-serif;
        font-size: 16px;
        font-weight: 800;
      }

      .tz-add-entry-toggle { justify-content: center; }
      .tz-add-entry {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 12px;
        border: 1px dashed var(--border-soft);
        border-radius: 12px;
        animation: tz-drop-in 0.15s ease;
      }
      .tz-add-entry-actions {
        display: flex;
        gap: 8px;
      }
      .tz-add-entry-actions .tz-camera-cancel { flex: 1; }
      .tz-add-entry-actions .tz-payment-save { flex: 2; margin-top: 0; }

      .tz-method-history {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .tz-method-history-label {
        font-size: 10.5px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--text-dim);
        font-weight: 700;
      }
      .tz-method-history-empty {
        margin: 0;
        font-size: 12px;
        color: var(--text-dim);
        opacity: 0.8;
      }
      .tz-history-row-manual-note {
        font-size: 12px;
        color: var(--text-dim);
        font-style: italic;
      }
      .tz-history-rows {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
        /* Sin max-height/overflow propio a propósito: si una fila
           (ej. un cliente de la Libreta) se expande con mucho
           contenido, no queremos un scroll diminuto anidado que la
           recorte — el modal entero (.tz-modal) ya tiene su propio
           scroll y se encarga de todo el contenido de una sola vez.
           Esto también evita que las fotos de comprobantes en Pagos
           queden cortadas. */
      }
      .tz-history-row {
        border: 1px solid var(--border-soft);
        border-radius: 8px;
        background: rgba(255,255,255,0.02);
        overflow: hidden;
      }
      .tz-history-row-head {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 8px;
        background: transparent;
        border: none;
        padding: 8px 10px;
        cursor: pointer;
        color: var(--text);
        font-family: 'Rajdhani', sans-serif;
      }
      .tz-usuario-row-actions {
        display: flex;
        gap: 8px;
        padding: 0 10px 10px;
        border-top: 1px dashed var(--border-soft);
        margin-top: 2px;
        padding-top: 8px;
      }
      .tz-usuario-action-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 7px 10px;
        font-size: 12px;
      }
      .tz-usuario-delete-btn {
        border-color: rgba(255,84,112,0.35);
        color: var(--danger);
      }
      .tz-usuario-delete-btn:hover { background: rgba(255,84,112,0.12); }
      .tz-history-row-method {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.04em;
        color: var(--cyan);
        text-transform: uppercase;
      }
      .tz-history-row-amount {
        margin-left: auto;
        font-weight: 700;
        color: var(--pink);
        font-size: 12.5px;
      }
      .tz-history-row-detail {
        height: auto;
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 2px 12px 10px;
        font-size: 12px;
        color: var(--text-dim);
      }
      .tz-history-row-detail strong { color: var(--text); font-weight: 700; }
      .tz-history-row-photo-link {
        display: inline-block;
        margin-top: 4px;
        width: fit-content;
      }
      .tz-history-row-photo {
        display: block;
        width: 64px;
        height: 64px;
        object-fit: cover;
        border-radius: 8px;
        border: 1px solid var(--border-soft);
      }

      /* ---------- SUBMIT BAR ---------- */
      /* Igual que el header: fixed en vez de sticky para que quede
         anclada de forma confiable en móvil (incluidos navegadores
         embebidos) y también en PC. Altura dinámica (auto): crece
         hacia arriba según la cantidad de productos seleccionados,
         con un límite (max-height + overflow-y) en la lista interna. */
      .tz-submitbar {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 45;
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
        margin: 0;
        height: auto;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
        background: rgba(15, 10, 30, 0.94);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(43,232,255,0.25);
        border-left: none;
        border-right: none;
        border-bottom: none;
        border-radius: 0;
        padding: 14px 12px calc(14px + env(safe-area-inset-bottom, 0px));
        box-shadow: 0 -8px 30px rgba(0,0,0,0.4);
        /* Slide de entrada/salida: SIEMPRE montada mientras dura la
           animación (ver 'barMounted' en App.jsx) — nunca aparece/
           desaparece de un salto, un translateY largo y ease-in-out
           en las dos direcciones. */
        transition: transform 0.5s ease-in-out;
      }
      .tz-submitbar-visible { transform: translateY(0); }
      .tz-submitbar-hidden { transform: translateY(120%); }

      /* "Manija" para ocultar la barra a mano: una lengüeta que
         sobresale de su borde superior, en vez de un botón más dentro
         del contenido (ya bastante apretado en móvil). */
      .tz-submitbar-collapse {
        position: absolute;
        top: -30px;
        left: 50%;
        transform: translateX(-50%);
        width: 46px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(43,232,255,0.25);
        border-bottom: none;
        border-radius: 10px 10px 0 0;
        background: rgba(15, 10, 30, 0.94);
        color: var(--text-dim);
        cursor: pointer;
      }
      .tz-submitbar-collapse:hover { color: var(--text); background: rgba(20,14,40,0.98); }
      .tz-submitbar-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 8px;
        min-width: 0;
      }
      .tz-submitbar-message { margin: 0; justify-content: center; }

      .tz-cart-list {
        width: 100%;
        max-height: 40vh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding-right: 2px;
      }
      .tz-cart-row {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 8px 10px;
        border-radius: 8px;
        background: rgba(255,255,255,0.03);
        border: 1px solid var(--border-soft);
        font-size: 12.5px;
      }
      .tz-cart-row-info {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .tz-cart-row-name {
        flex: 1 1 auto;
        min-width: 0;
        text-align: left;
        color: var(--text);
        font-weight: 600;
        overflow-wrap: anywhere;
      }
      .tz-cart-row-amount-group {
        flex: 0 0 auto;
        display: flex;
        align-items: baseline;
        gap: 6px;
      }
      .tz-cart-row-original {
        color: var(--text-dim);
        text-decoration: line-through;
        font-size: 11px;
        font-weight: 600;
      }
      .tz-cart-row-amount {
        flex: 0 0 auto;
        color: var(--pink);
        font-weight: 700;
      }
      .tz-cart-row-discount-note {
        display: block;
        color: var(--green);
        font-size: 11px;
        font-weight: 600;
      }
      .tz-cart-row-controls {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
      }
      .tz-cart-qty-stepper { padding: 3px 6px; gap: 6px; }
      .tz-cart-qty-stepper button { width: 20px; height: 20px; }
      .tz-cart-qty-input {
        width: 38px;
        background: transparent;
        border: none;
        color: var(--text);
        font-family: 'Orbitron', sans-serif;
        font-weight: 700;
        font-size: 13px;
        text-align: center;
        -moz-appearance: textfield;
      }
      .tz-cart-qty-input:focus { outline: none; }
      .tz-cart-qty-input::-webkit-outer-spin-button,
      .tz-cart-qty-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      .tz-cart-remove-btn {
        flex-shrink: 0;
        width: 26px;
        height: 26px;
        border-radius: 8px;
        border: 1px solid rgba(255,84,112,0.35);
        background: rgba(255,84,112,0.12);
        color: var(--danger);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
      .tz-cart-remove-btn:hover { background: rgba(255,84,112,0.22); }

      .tz-submitbar-summary {
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap: 8px;
        color: var(--text-dim);
        font-weight: 600;
        font-size: 14px;
      }
      .tz-error {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--danger);
        font-weight: 700;
        font-size: 13.5px;
      }
      .tz-success {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--cyan);
        font-weight: 700;
        font-size: 14px;
      }
      .tz-submit-btn {
        width: 100%;
        box-sizing: border-box;
        font-family: 'Orbitron', sans-serif;
        font-weight: 800;
        font-size: 13px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #16190a;
        background: var(--yellow);
        border: none;
        border-radius: 12px;
        padding: 14px 26px;
        cursor: pointer;
        box-shadow: 0 0 24px rgba(215,255,59,0.4);
        transition: transform 0.12s ease;
      }
      .tz-submit-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      .tz-submit-btn:hover { transform: translateY(-1px); }
      .tz-submit-btn:active { transform: translateY(0); }
      .tz-submit-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        box-shadow: none;
        transform: none;
      }

      /* ---------- HISTORIAL ---------- */
      .tz-history { margin-top: 40px; }
      .tz-history-heading {
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--cyan);
        margin-bottom: 14px;
      }
      .tz-history-heading h2 {
        margin: 0;
        font-family: 'Orbitron', sans-serif;
        font-size: 15px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text);
      }

      .tz-empty {
        border: 1px dashed rgba(255,255,255,0.15);
        border-radius: 14px;
        padding: 28px;
        text-align: center;
        color: var(--text-dim);
      }
      .tz-empty p { margin: 0 0 6px; }
      .tz-empty-sub { font-size: 13px; opacity: 0.8; }

      .tz-table-wrap {
        overflow-x: auto;
        border-radius: 14px;
        border: 1px solid var(--border-soft);
      }
      .tz-history-toggle-btn {
        display: block;
        margin: 12px auto 0;
        padding: 8px 18px;
        border-radius: 999px;
        border: 1px solid var(--border-soft);
        background: rgba(255,255,255,0.04);
        color: var(--text);
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        font-size: 13px;
        cursor: pointer;
      }
      .tz-history-toggle-btn:hover { background: rgba(255,255,255,0.09); }
      .tz-table {
        width: 100%;
        border-collapse: collapse;
        min-width: 640px;
        font-size: 13.5px;
      }
      .tz-table thead th {
        text-align: left;
        font-family: 'Orbitron', sans-serif;
        font-size: 10.5px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--text-dim);
        background: rgba(255,255,255,0.03);
        padding: 12px 14px;
        border-bottom: 1px solid var(--border-soft);
      }
      .tz-table tbody td {
        padding: 12px 14px;
        border-bottom: 1px solid rgba(255,255,255,0.05);
        font-weight: 600;
      }
      .tz-table tbody tr:hover { background: rgba(43,232,255,0.04); }
      .tz-id-cell {
        font-family: 'Orbitron', sans-serif;
        color: var(--yellow);
        font-size: 12px;
      }
      .tz-pink-cell { color: var(--pink); font-weight: 700; }
      .tz-dim-cell { color: var(--text-dim); }

      /* ---------- PIE DE PÁGINA (Cerrar Caja / Gastos / Editar Stock) ---------- */
      /* Flujo normal del documento (NO fixed): así nunca puede tapar el
         formulario de checkout, sin importar cuánto crezca. */
      .tz-page-footer {
        width: 100%;
        max-width: 100%;
        margin: 0 auto;
        box-sizing: border-box;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
        gap: 10px;
        padding: 20px 12px calc(20px + env(safe-area-inset-bottom, 0px));
        border-top: 1px solid var(--border-soft);
      }
      .tz-footer-btn {
        position: relative;
        flex: 1 1 140px;
        max-width: 220px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        border: none;
        border-radius: 999px;
        padding: 12px 16px;
        font-family: 'Orbitron', sans-serif;
        font-weight: 800;
        font-size: 11px;
        letter-spacing: 0.03em;
        text-transform: uppercase;
        cursor: pointer;
        white-space: nowrap;
      }
      .tz-footer-btn:hover { transform: translateY(-1px); }
      /* Badge de "un cajero cerró su turno" (Cerrar Caja, solo admin) —
         esquina superior derecha del botón, con un pulso sutil para que
         se note sin ser molesto. */
      .tz-footer-btn-badge {
        position: absolute;
        top: -6px;
        right: -6px;
        min-width: 18px;
        height: 18px;
        padding: 0 4px;
        border-radius: 999px;
        background: var(--danger);
        color: #fff;
        font-family: 'Rajdhani', sans-serif;
        font-size: 11px;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid var(--bg-1);
        box-shadow: 0 0 8px rgba(255,84,112,0.7);
        animation: tz-footer-badge-pulse 1.4s ease-in-out infinite;
      }
      @keyframes tz-footer-badge-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.15); }
      }
      .tz-footer-btn-cierre {
        background: var(--danger);
        color: #2b0006;
        box-shadow: 0 0 20px rgba(255,84,112,0.4);
      }
      .tz-footer-btn-gastos {
        background: var(--orange);
        color: #241200;
        box-shadow: 0 0 20px rgba(255,149,0,0.4);
      }
      .tz-footer-btn-stock {
        background: var(--yellow);
        color: #16190a;
        box-shadow: 0 0 20px rgba(215,255,59,0.4);
      }
      .tz-footer-btn-misventas {
        background: var(--cyan);
        color: #06131a;
        box-shadow: 0 0 20px rgba(43,232,255,0.4);
      }
      .tz-footer-btn-productos {
        background: #2e1065;
        color: var(--text);
        border: 1.5px solid var(--yape);
        box-shadow: 0 0 20px rgba(182,33,255,0.5);
      }

      /* ---------- MODAL ---------- */
      .tz-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 60;
        background: rgba(5, 3, 12, 0.75);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px;
      }
      .tz-modal {
        position: relative;
        width: 100%;
        max-width: 460px;
        max-height: 90vh;
        overflow-y: auto;
        background: var(--panel-solid);
        border: 1px solid rgba(43,232,255,0.25);
        border-radius: 18px;
        padding: 26px 18px 20px;
        box-shadow: 0 0 50px rgba(43,232,255,0.15);
        /* Firefox */
        scrollbar-width: thin;
        scrollbar-color: rgba(43,232,255,0.35) transparent;
      }
      .tz-modal-wide { max-width: 560px; }

      /* ---------- GESTOR DE CAJAS (Parte 3, solo admin) ---------- */
      .tz-modal-gestor-cajas { max-width: 720px; }
      /* Título + botón "Historial de Cierres" (reubicado desde el
         header principal) en la misma fila — se envuelve en pantallas
         angostas en vez de apretar el botón contra el título. */
      .tz-gc-header-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding-right: 30px;
      }
      .tz-gc-header-row h2 { margin: 0; }
      .tz-gc-list {
        display: flex;
        flex-direction: column;
        gap: 18px;
        margin-top: 14px;
      }
      .tz-gc-localidad {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding-top: 10px;
        border-top: 1px solid var(--border-soft);
      }
      .tz-gc-localidad:first-child { padding-top: 0; border-top: none; }
      .tz-gc-localidad-title {
        margin: 0;
        font-family: 'Orbitron', sans-serif;
        font-size: 13px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--cyan);
        text-shadow: 0 0 10px rgba(43,232,255,0.4);
      }
      .tz-gc-sucursal {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-left: 6px;
        border-left: 2px solid rgba(43,232,255,0.2);
      }
      .tz-gc-sucursal-title {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 6px;
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        font-size: 13px;
        color: var(--text-dim);
      }
      /* UX Bug 3: renombrar sucursal desde el Gestor de Cajas */
      .tz-gc-sucursal-edit-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: transparent;
        border: 1px solid rgba(255,255,255,0.15);
        color: var(--text-dim);
        cursor: pointer;
      }
      .tz-gc-sucursal-edit-btn:hover { color: var(--cyan); border-color: var(--cyan); }
      .tz-gc-sucursal-rename {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .tz-gc-sucursal-rename .tz-text-input { flex: 1 1 auto; min-width: 0; padding: 6px 10px; font-size: 13px; }
      .tz-gc-caja-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        background: var(--panel);
        border: 1px solid var(--border-soft);
        border-radius: 12px;
        padding: 10px 12px;
      }
      .tz-gc-caja-info {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }
      .tz-gc-caja-nombre {
        font-family: 'Rajdhani', sans-serif;
        font-weight: 800;
        font-size: 14px;
        color: var(--text);
      }
      .tz-gc-caja-estado {
        font-family: 'Orbitron', sans-serif;
        font-size: 9.5px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        padding: 3px 9px;
        border-radius: 999px;
      }
      .tz-gc-caja-estado.is-abierta {
        color: var(--green);
        background: var(--green-bg);
        box-shadow: 0 0 8px rgba(57,255,176,0.3);
      }
      .tz-gc-caja-estado.is-cerrada {
        color: var(--danger);
        background: rgba(255,84,112,0.12);
      }
      .tz-gc-caja-meta {
        font-size: 11.5px;
        color: var(--text-dim);
      }
      .tz-gc-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
        border: none;
        border-radius: 999px;
        padding: 8px 14px;
        font-family: 'Orbitron', sans-serif;
        font-weight: 800;
        font-size: 10.5px;
        letter-spacing: 0.03em;
        text-transform: uppercase;
        cursor: pointer;
      }
      .tz-gc-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      .tz-gc-btn-cerrar {
        background: var(--danger);
        color: #2b0006;
        box-shadow: 0 0 14px rgba(255,84,112,0.35);
      }
      .tz-gc-btn-abrir {
        background: var(--green);
        color: #06190f;
        box-shadow: 0 0 14px rgba(57,255,176,0.35);
      }
      .tz-gc-abrir-form {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }
      .tz-gc-monto-input { width: 130px; }

      .tz-modal-fullscreen {
        max-width: 1400px;
        width: 96vw;
        height: 92vh;
        max-height: 92vh;
        display: flex;
        flex-direction: column;
        overflow-y: hidden;
      }
      .tz-pm-header { flex-shrink: 0; }
      .tz-pm-header-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        padding-right: 34px;
      }
      .tz-pm-export-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
        border: 1px solid rgba(57,255,176,0.4);
        border-radius: 10px;
        background: rgba(57,255,176,0.1);
        color: var(--green);
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        font-size: 13px;
        padding: 8px 14px;
        cursor: pointer;
      }
      .tz-pm-export-btn:hover { background: rgba(57,255,176,0.2); }
      .tz-pm-body { flex: 1; overflow-y: auto; margin-top: 8px; }
      /* -webkit-overflow-scrolling: el scroll horizontal a dedo se
         sentía "trabado" en Safari/iOS sin esto — con touch-action
         explícito el navegador no duda si el gesto es scroll de la
         tabla o del modal entero por detrás. */
      .tz-pm-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; touch-action: pan-x; }
      /* min-width es LA pieza que faltaba: sin ella, 'width:100%' +
         table-layout:auto (el default) deja que el navegador COMPRIMA
         cada columna para que la tabla entera quepa en el ancho
         angosto del modal en celular — apachurrando los inputs de
         Stock/Costo/Precio hasta mostrar apenas un caracter ("[").
         Con un min-width que nunca se negocia, la tabla directamente
         NO entra en pantallas chicas, y es .tz-pm-table-wrap (arriba)
         el que se hace cargo con scroll horizontal — que es lo que
         debía pasar desde el principio. */
      .tz-pm-table { width: 100%; min-width: 760px; border-collapse: collapse; font-size: 13px; }
      .tz-pm-table th {
        text-align: left;
        padding: 8px 10px;
        color: var(--text-dim);
        text-transform: uppercase;
        font-size: 10.5px;
        letter-spacing: 0.04em;
        border-bottom: 1px solid var(--border-soft);
        white-space: nowrap;
      }
      .tz-pm-table td {
        padding: 7px 10px;
        border-bottom: 1px solid rgba(255,255,255,0.05);
        white-space: nowrap;
      }
      .tz-pm-cell-nombre { white-space: normal; min-width: 180px; }
      .tz-pm-detail { color: var(--text-dim); font-size: 12px; }
      .tz-pm-input { width: 90px; min-width: 90px; padding: 6px 8px; font-size: 12.5px; }
      /* El de Stock necesita más aire que Costo/Precio: números de más
         dígitos (y, en 'venta a granel', decimales) se recortaban. */
      .tz-pm-input-stock { width: 130px; min-width: 130px; }
      .tz-pm-margin-positive { color: var(--green); font-weight: 700; }
      .tz-pm-descuento-badge {
        display: inline-flex;
        align-items: center;
        padding: 3px 9px;
        border-radius: 999px;
        background: rgba(255,149,0,0.12);
        border: 1px solid rgba(255,149,0,0.4);
        color: var(--orange);
        font-weight: 700;
        font-size: 12px;
      }
      .tz-pm-descuento-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 6px;
        vertical-align: middle;
      }
      .tz-pm-dot-green { background: var(--green); box-shadow: 0 0 6px rgba(57,255,176,0.8); }
      .tz-pm-dot-red { background: var(--danger); box-shadow: 0 0 6px rgba(255,84,112,0.6); }
      .tz-pm-margin-negative { color: var(--danger); font-weight: 700; }
      /* 'transition' vive en la fila BASE (no en el modificador) para
         que también anime al SALIR del resplandor: se agrega la clase
         -highlight sin transición (aparece resaltada de inmediato,
         apenas se monta ya con foco), y al quitarla ~2s después el
         navegador anima el regreso a fondo transparente solo. */
      .tz-pm-row { transition: background-color 1.4s ease; }
      .tz-pm-row-highlight { background-color: rgba(182,33,255,0.22); }
      .tz-pm-save-cell { position: relative; }
      .tz-pm-save-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        border-radius: 8px;
        border: 1px solid rgba(57,255,176,0.4);
        background: rgba(57,255,176,0.08);
        color: var(--green);
        cursor: pointer;
      }
      .tz-pm-save-btn:hover { background: rgba(57,255,176,0.18); }
      .tz-pm-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      .tz-pm-row-error {
        position: absolute;
        top: 100%;
        right: 0;
        white-space: nowrap;
        margin: 2px 0 0;
        font-size: 11px;
        z-index: 1;
      }
      .tz-modal::-webkit-scrollbar { width: 8px; }
      .tz-modal::-webkit-scrollbar-track { background: transparent; }
      .tz-modal::-webkit-scrollbar-thumb {
        background: rgba(43,232,255,0.3);
        border-radius: 8px;
      }
      .tz-modal::-webkit-scrollbar-thumb:hover { background: rgba(43,232,255,0.5); }

      /* ---- Escáner de códigos (html5-qrcode inyecta su propio DOM
         dentro de este contenedor: video, selector de cámara, botones
         de permiso) — solo lo encajamos en el tema oscuro, sin tocar
         su lógica interna. ---- */
      .tz-barcode-scanner-region {
        margin-top: 12px;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--border-soft);
        background: #000;
      }
      .tz-barcode-scanner-region video { border-radius: 12px; }
      .tz-barcode-scanner-region select,
      .tz-barcode-scanner-region button {
        background: rgba(255,255,255,0.08);
        color: var(--text);
        border: 1px solid var(--border-soft);
        border-radius: 8px;
        padding: 6px 10px;
        font-family: 'Rajdhani', sans-serif;
        cursor: pointer;
      }
      .tz-barcode-scanner-region span,
      .tz-barcode-scanner-region a {
        color: var(--text-dim);
      }
      .tz-modal-close {
        position: absolute;
        top: 14px;
        right: 14px;
        width: 30px;
        height: 30px;
        border-radius: 8px;
        border: 1px solid var(--border-soft);
        background: rgba(255,255,255,0.04);
        color: var(--text-dim);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }

      .tz-pw-form {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 6px;
      }
      .tz-pw-icon {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: rgba(43,232,255,0.1);
        color: var(--cyan);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 6px;
      }
      .tz-pw-form h2 {
        margin: 0;
        font-family: 'Orbitron', sans-serif;
        font-size: 16px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .tz-pw-form p { margin: 0 0 10px; color: var(--text-dim); font-size: 13.5px; }
      .tz-pw-form input {
        width: 100%;
        background: rgba(255,255,255,0.05);
        border: 1px solid var(--border-soft);
        border-radius: 10px;
        padding: 12px 14px;
        color: var(--text);
        font-size: 15px;
        font-family: 'Rajdhani', sans-serif;
        text-align: center;
        letter-spacing: 0.1em;
      }
      .tz-pw-form input:focus { outline: none; border-color: var(--cyan); }
      .tz-pw-submit {
        margin-top: 10px;
        width: 100%;
        background: var(--cyan);
        color: #06131a;
        border: none;
        border-radius: 10px;
        padding: 12px;
        font-family: 'Orbitron', sans-serif;
        font-weight: 800;
        font-size: 12.5px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        cursor: pointer;
        box-shadow: 0 0 20px rgba(43,232,255,0.35);
      }

      /* "Cierre Ciego" (cajero): mismo molde que .tz-pw-submit pero en
         rojo — es una acción irreversible, tiene que leerse como tal. */
      .tz-cierre-ciego-btn {
        margin-top: 12px;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: var(--danger);
        color: #1a0208;
        border: none;
        border-radius: 10px;
        padding: 13px;
        font-family: 'Orbitron', sans-serif;
        font-weight: 800;
        font-size: 13px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        cursor: pointer;
        box-shadow: 0 0 20px rgba(255,84,112,0.4);
      }
      .tz-cierre-ciego-btn:disabled { opacity: 0.6; cursor: not-allowed; }

      .tz-stock-editor h2 {
        margin: 0 0 4px;
        font-family: 'Orbitron', sans-serif;
        font-size: 16px;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      .tz-stock-editor-sub {
        margin: 0 0 18px;
        color: var(--text-dim);
        font-size: 13px;
      }
      .tz-stock-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-height: 46vh;
        overflow-y: auto;
        padding-right: 4px;
        margin-bottom: 14px;
      }
      .tz-stock-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        background: rgba(255,255,255,0.03);
        border: 1px solid var(--border-soft);
        border-radius: 10px;
        padding: 10px 12px;
      }
      .tz-stock-row-info { display: flex; flex-direction: column; gap: 2px; }
      .tz-stock-row-name { font-weight: 700; font-size: 13.5px; }
      .tz-stock-row-current { font-size: 11.5px; color: var(--text-dim); }
      /* Badge tenue con el 'detalle' (columna productos.descripcion:
         "750ml", "Personal") junto al nombre — para distinguir
         "Coca Cola (Personal)" de "Coca Cola (1L)" de un vistazo. */
      .tz-vis-row-detail {
        display: inline-block;
        width: fit-content;
        font-size: 10.5px;
        font-weight: 700;
        letter-spacing: 0.03em;
        color: var(--cyan);
        background: rgba(43,232,255,0.1);
        border: 1px solid rgba(43,232,255,0.3);
        border-radius: 6px;
        padding: 1px 7px;
      }
      .tz-stock-row-input {
        display: flex;
        align-items: center;
        gap: 4px;
        background: rgba(255,255,255,0.05);
        border: 1px solid var(--border-soft);
        border-radius: 8px;
        padding: 4px 8px;
      }
      .tz-stock-plus { color: var(--yellow); font-weight: 800; }
      .tz-stock-row-input input {
        width: 52px;
        background: transparent;
        border: none;
        color: var(--text);
        font-family: 'Orbitron', sans-serif;
        font-weight: 700;
        font-size: 14px;
        text-align: center;
      }
      .tz-stock-row-input input:focus { outline: none; }

      /* ---- Costo Promedio Ponderado: fila de "Agregar Unidades al
         Stock" con 2 inputs (unidades + costo TOTAL de la compra) en
         vez del "+cantidad" simple — usa su propia clase de wrapper
         (no reutiliza '.tz-stock-row', que también usan las filas de
         "Visibilidad en catálogo" con un layout de una sola línea que
         no debe tocarse) porque necesita apilarse en columna. ---- */
      .tz-stock-cost-item {
        display: flex;
        flex-direction: column;
        gap: 8px;
        background: rgba(255,255,255,0.03);
        border: 1px solid var(--border-soft);
        border-radius: 10px;
        padding: 10px 12px;
      }
      .tz-stock-cost-inputs {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .tz-stock-cost-field {
        display: flex;
        flex-direction: column;
        gap: 3px;
        flex: 1 1 130px;
        min-width: 0;
      }
      .tz-stock-cost-field span {
        font-size: 10.5px;
        color: var(--text-dim);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      .tz-stock-cost-field input {
        background: rgba(255,255,255,0.05);
        border: 1px solid var(--border-soft);
        border-radius: 8px;
        padding: 8px 10px;
        color: var(--text);
        font-family: 'Orbitron', sans-serif;
        font-weight: 700;
        font-size: 13px;
        width: 100%;
        box-sizing: border-box;
      }
      .tz-stock-cost-field input:focus { outline: none; border-color: var(--cyan); }
      .tz-stock-cost-hint {
        margin: 0;
        font-size: 11px;
        color: var(--yellow);
        font-weight: 600;
      }

      .tz-stock-editor-section {
        margin: 24px 0 4px;
        padding-top: 18px;
        border-top: 1px solid var(--border-soft);
        font-family: 'Orbitron', sans-serif;
        font-size: 16px;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      /* ---- Acordeón de "Visibilidad en catálogo público": Categoría
         -> Subgrupo -> productos. La animación de expand/collapse usa
         grid-template-rows 0fr/1fr (en vez de max-height con un valor
         arbitrario) porque se anima suave sin importar cuánto mida el
         contenido real — esto es lo que da la sensación "premium" de
         no saltar ni recortarse de golpe. ---- */
      .tz-vis-accordion {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .tz-vis-create-categoria { margin-bottom: 2px; }
      .tz-vis-create-categoria .tz-scanner-upload-btn { margin-top: 0; }
      .tz-vis-create-categoria .tz-vis-inline-edit-row { margin: 0; padding: 2px; }
      .tz-vis-category {
        border: 1px solid var(--border-soft);
        border-radius: 12px;
        overflow: hidden;
        background: rgba(255,255,255,0.02);
        transition: border-color 0.12s, box-shadow 0.12s, opacity 0.12s;
      }
      /* Drag & Drop de categorías (nativo HTML5, sin librería): el
         handle es el único elemento draggable; dragover/drop viven en
         toda la tarjeta para que soltar en cualquier parte cuente. */
      .tz-vis-drag-handle {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 30px;
        color: var(--text-dim);
        cursor: grab;
        touch-action: none;
      }
      .tz-vis-drag-handle:active { cursor: grabbing; }
      .tz-vis-category-dragging { opacity: 0.4; }
      .tz-vis-category-drag-over {
        border-color: var(--cyan);
        box-shadow: 0 0 0 1.5px var(--cyan), 0 0 16px rgba(43,232,255,0.35);
      }
      .tz-vis-category-header,
      .tz-vis-subgroup-header {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        background: transparent;
        border: none;
        cursor: pointer;
        color: var(--text);
        font-family: 'Rajdhani', sans-serif;
        text-align: left;
        padding: 0;
        min-width: 0;
      }
      .tz-vis-category-header {
        font-family: 'Orbitron', sans-serif;
        font-size: 12.5px;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .tz-vis-subgroup-header {
        font-size: 12.5px;
        font-weight: 700;
        color: var(--cyan);
      }
      /* Fila que envuelve el header clickable (categoría/subgrupo) +
         su botón de lápiz — el padding que antes vivía en el propio
         header ahora vive acá, para que el lápiz quede alineado e
         inserto en la misma fila sin anidar un <button> dentro de
         otro <button>. */
      .tz-vis-header-row,
      .tz-vis-inline-edit-row {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .tz-vis-category > .tz-vis-header-row,
      .tz-vis-category > .tz-vis-inline-edit-row {
        padding: 10px 12px;
      }
      .tz-vis-subsection > .tz-vis-header-row,
      .tz-vis-subsection > .tz-vis-inline-edit-row {
        padding: 7px 10px;
      }
      .tz-vis-inline-edit-row .tz-text-input {
        flex: 1 1 auto;
        min-width: 0;
        padding: 8px 10px;
      }
      .tz-vis-edit-btn {
        width: 30px;
        height: 30px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        border: 1px solid rgba(43,232,255,0.35);
        background: rgba(43,232,255,0.08);
        color: var(--cyan);
        cursor: pointer;
      }
      .tz-vis-edit-btn:hover { background: rgba(43,232,255,0.18); }
      .tz-vis-edit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .tz-vis-category-meta {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        font-weight: 600;
        color: var(--text-dim);
        flex-shrink: 0;
      }
      /* La animación de "acordeón CSS puro" (grid-template-rows 0fr/1fr)
         se cambió por montaje/desmontaje condicional en React: el
         contenido cerrado deja de existir en el DOM en vez de
         intentar colapsarlo a 0px con CSS. Es menos "cinematográfico"
         que la técnica de grid, pero es imposible que algo se filtre
         visualmente cuando el nodo directamente no está — que es lo
         que seguía pasando con la versión anterior. Se mantiene una
         animación de entrada breve (fade + slide) para no perder toda
         la sensación de transición. */
      @keyframes tzAccordionIn {
        from { opacity: 0; transform: translateY(-6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .tz-vis-accordion-inner {
        animation: tzAccordionIn 0.18s ease;
      }
      .tz-vis-category > .tz-vis-accordion-inner {
        padding: 4px 14px 14px;
      }
      .tz-vis-subsection {
        border-top: 1px solid var(--border-soft);
      }
      .tz-vis-subsection:first-child { border-top: none; }
      .tz-vis-subsection-body { padding: 10px 12px 12px; }
      .tz-vis-search-row {
        display: flex;
        align-items: stretch;
        gap: 8px;
        margin-bottom: 8px;
      }
      .tz-vis-search-row .tz-text-input {
        flex: 1 1 auto;
        /* Sin esto, el input usa su min-width intrínseco (bastante
           ancho) como piso y fuerza al row entero a desbordar en vez
           de respetar flex:1 — es lo que aplastaba el botón de al
           lado dentro del acordeón angosto. */
        min-width: 0;
        margin: 0;
        padding: 12px 14px;
      }
      /* Selector reforzado (.tz-vis-search-row .tz-vis-scan-btn, no solo
         .tz-vis-scan-btn): el botón también lleva la clase base
         .tz-scan-btn (width: 100%), y esa regla vive MÁS ABAJO en esta
         hoja de estilos — con igual especificidad (una sola clase),
         gana la que aparece último en el archivo. Sin este refuerzo,
         "width: 100%" de .tz-scan-btn le ganaba a "width: 42px" acá y
         el botón se estiraba a todo el ancho, aplastando el input (el
         bug visual reportado). */
      .tz-vis-search-row .tz-vis-scan-btn {
        flex: 0 0 auto;
        width: 42px;
        /* Sin alto fijo: 'align-items: stretch' en .tz-vis-search-row
           ya lo estira exactamente a la altura del input de al lado. */
        padding: 0;
        justify-content: center;
      }
      .tz-vis-row-actions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;
      }
      .tz-vis-delete-btn {
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        border: 1px solid rgba(255,84,112,0.35);
        background: rgba(255,84,112,0.08);
        color: var(--danger);
        cursor: pointer;
      }
      .tz-vis-delete-btn:hover { background: rgba(255,84,112,0.18); }
      .tz-vis-confirm-delete {
        border: 1px solid rgba(255,84,112,0.35);
        background: rgba(255,84,112,0.06);
        border-radius: 10px;
        padding: 10px 12px;
        font-size: 12.5px;
      }
      .tz-vis-confirm-delete p { margin: 0 0 8px; }
      .tz-vis-confirm-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .tz-toggle {
        position: relative;
        display: inline-flex;
        align-items: center;
        width: 42px;
        height: 24px;
        flex: 0 0 auto;
        cursor: pointer;
      }
      .tz-toggle input {
        position: absolute;
        opacity: 0;
        width: 100%;
        height: 100%;
        margin: 0;
        cursor: pointer;
      }
      .tz-toggle-slider {
        position: absolute;
        inset: 0;
        background: rgba(255,255,255,0.12);
        border: 1px solid var(--border-soft);
        border-radius: 999px;
        transition: background 0.15s ease;
      }
      .tz-toggle-slider::before {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 18px;
        height: 18px;
        background: var(--text-dim);
        border-radius: 50%;
        transition: transform 0.15s ease, background 0.15s ease;
      }
      .tz-toggle input:checked + .tz-toggle-slider {
        background: rgba(57,255,176,0.25);
        border-color: var(--green);
      }
      .tz-toggle input:checked + .tz-toggle-slider::before {
        transform: translateX(18px);
        background: var(--green);
      }

      .tz-stock-saved {
        margin: 0 0 12px;
        color: var(--cyan);
        font-weight: 700;
        font-size: 13px;
        text-align: center;
      }
      .tz-stock-save {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: var(--yellow);
        color: #16190a;
        border: none;
        border-radius: 10px;
        padding: 13px;
        font-family: 'Orbitron', sans-serif;
        font-weight: 800;
        font-size: 12.5px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        cursor: pointer;
        box-shadow: 0 0 20px rgba(215,255,59,0.35);
      }
      .tz-stock-save:disabled { opacity: 0.6; cursor: not-allowed; }

      /* ---------- "+ Nuevo Combo" (Editar Stock, solo admin) ---------- */
      .tz-new-combo-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-bottom: 16px;
        background: linear-gradient(135deg, rgba(255,47,158,0.9), rgba(43,232,255,0.75));
        color: #0a0714;
        border: none;
        border-radius: 10px;
        padding: 12px;
        font-family: 'Orbitron', sans-serif;
        font-weight: 800;
        font-size: 12.5px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        cursor: pointer;
        box-shadow: 0 0 20px rgba(255,47,158,0.35);
      }
      .tz-new-combo-btn:hover { transform: translateY(-1px); }
      .tz-combo-search-results {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin: 6px 0 12px;
        max-height: 160px;
        overflow-y: auto;
      }
      .tz-combo-search-result {
        display: flex;
        align-items: center;
        text-align: left;
        gap: 6px;
        padding: 8px 10px;
        border-radius: 8px;
        border: 1px solid var(--border-soft);
        background: rgba(255,255,255,0.04);
        color: var(--text);
        font-family: 'Rajdhani', sans-serif;
        font-size: 13.5px;
        cursor: pointer;
      }
      .tz-combo-search-result:hover { background: rgba(43,232,255,0.12); }
      .tz-combo-items {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin: 4px 0 12px;
      }
      .tz-combo-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border-radius: 8px;
        border: 1px solid var(--border-soft);
        background: rgba(255,255,255,0.03);
      }
      .tz-combo-item-name {
        flex: 1 1 0%;
        min-width: 0;
        font-size: 13.5px;
        overflow-wrap: anywhere;
      }
      .tz-combo-item-qty {
        width: 52px;
        flex-shrink: 0;
        background: rgba(255,255,255,0.06);
        border: 1px solid var(--border-soft);
        border-radius: 6px;
        color: var(--text);
        padding: 5px 6px;
        text-align: center;
        font-family: 'Rajdhani', sans-serif;
        font-size: 13px;
      }
      .tz-combo-item-remove {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        border: 1px solid rgba(255,84,112,0.35);
        background: rgba(255,84,112,0.1);
        color: var(--danger);
        cursor: pointer;
      }
      .tz-combo-item-remove:hover { background: rgba(255,84,112,0.22); }

      /* ---------- Modal: Gestión de Imagen (solo admin) ---------- */
      .tz-image-manager-preview {
        width: 100%;
        height: 160px;
        border-radius: 14px;
        overflow: hidden;
        background: rgba(255,255,255,0.04);
        border: 1px solid var(--border-soft);
        margin: 10px 0 14px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .tz-image-manager-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .tz-image-manager-actions {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
      }
      .tz-image-manager-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        cursor: pointer;
        text-align: center;
      }
      /* Botón mágico ("Mejorar con IA"): gradiente violeta/rosa
         reusando --yape (el único morado ya definido en la paleta) en
         vez de inventar un color nuevo. Dispara @imgly/background-
         removal en el navegador del admin (ver handleAiEnhance). */
      .tz-ai-magic-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: linear-gradient(135deg, var(--yape), var(--pink));
        color: #fff;
        border: none;
        border-radius: 10px;
        padding: 13px;
        font-family: 'Orbitron', sans-serif;
        font-weight: 800;
        font-size: 12.5px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        cursor: pointer;
        box-shadow: 0 0 20px rgba(182,33,255,0.45);
      }
      .tz-ai-magic-btn:hover:not(:disabled) { transform: translateY(-1px); }
      .tz-ai-magic-btn:disabled { opacity: 0.75; cursor: not-allowed; }

      /* Resultado de la IA (PNG con fondo transparente): el recuadro
         de previsualización es BLANCO a propósito (nuestra app es
         oscura/neón) para simular al toque el "efecto estudio" de una
         foto de catálogo — es la única superficie clara de todo el
         tema, adrede. */
      .tz-ai-result { margin-top: 6px; }
      .tz-ai-result-preview {
        width: 100%;
        height: 160px;
        border-radius: 14px;
        overflow: hidden;
        background: #ffffff;
        border: 1px solid var(--border-soft);
        margin: 8px 0 10px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .tz-ai-result-preview img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      /* ---------- MODAL: RECORTE DE FOTO (react-easy-crop) ---------- */
      .tz-crop-modal { max-width: 420px; }
      .tz-crop-area {
        position: relative;
        width: 100%;
        height: 300px;
        border-radius: 14px;
        overflow: hidden;
        background: #000;
        margin: 4px 0 14px;
      }
      .tz-crop-zoom-row {
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--text-dim);
        margin-bottom: 8px;
      }
      .tz-crop-zoom-slider {
        flex: 1 1 auto;
        accent-color: var(--cyan);
      }

      /* ---------- MODAL: PAGO / ESCANEO ---------- */
      .tz-payment-modal {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .tz-payment-modal h2 {
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-family: 'Orbitron', sans-serif;
        font-size: 15px;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        text-align: center;
      }
      .tz-field-label {
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--text-dim);
        font-weight: 700;
      }
      .tz-field-hint {
        margin: 2px 0 0;
        font-size: 11px;
        color: var(--text-dim);
        opacity: 0.8;
        font-style: italic;
      }

      /* ---------- SWITCH (Venta a Granel / Por Peso) ---------- */
      .tz-switch-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 10px;
        background: rgba(255,255,255,0.04);
        border: 1px solid var(--border-soft);
      }
      .tz-switch {
        flex-shrink: 0;
        position: relative;
        width: 42px;
        height: 24px;
        border-radius: 999px;
        border: 1px solid var(--border-soft);
        background: rgba(255,255,255,0.08);
        cursor: pointer;
        transition: background 0.15s ease, border-color 0.15s ease;
      }
      .tz-switch-on {
        background: var(--cyan);
        border-color: var(--cyan);
        box-shadow: 0 0 12px rgba(43,232,255,0.4);
      }
      .tz-switch-knob {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #fff;
        transition: transform 0.15s ease;
      }
      .tz-switch-on .tz-switch-knob { transform: translateX(18px); }

      /* ---------- MODAL: CALCULADORA DE PESO ---------- */
      .tz-peso-modal { max-width: 380px; }
      .tz-peso-subtotal {
        margin: 10px 0 0;
        font-size: 14px;
        color: var(--text-dim);
      }
      .tz-peso-subtotal strong {
        color: var(--green);
        font-size: 18px;
        font-family: 'Orbitron', sans-serif;
      }

      /* Cantidad en Kg dentro de la tarjeta de producto (reemplaza al
         stepper +/- de unidades, que no tiene sentido para algo que se
         vende a granel). */
      .tz-qty-peso {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        font-family: 'Orbitron', sans-serif;
        font-size: 12px;
        font-weight: 700;
        color: var(--cyan);
      }
      .tz-qty-peso button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        border-radius: 6px;
        border: 1px solid var(--border-soft);
        background: rgba(255,255,255,0.06);
        color: var(--cyan);
        cursor: pointer;
      }

      /* Mismo botón, versión del carrito (CartRow) — reemplaza el
         stepper numérico +/- por "1.25 Kg [lápiz]" que reabre el modal
         de peso para editar. */
      .tz-cart-peso-edit-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        border-radius: 8px;
        border: 1px solid var(--border-soft);
        background: rgba(43,232,255,0.08);
        color: var(--cyan);
        font-family: 'Orbitron', sans-serif;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
      }
      .tz-cart-peso-edit-btn:hover { background: rgba(43,232,255,0.18); }
      /* Nombre 70% / Detalle 30% en una sola fila (alta de producto al
         vuelo) — flex-grow en proporción 7:3 en vez de width en %, así
         no hay que restar el gap a mano. */
      .tz-nombre-detalle-row {
        display: flex;
        gap: 8px;
      }
      .tz-nombre-detalle-row input:first-child { flex: 7 1 0; min-width: 0; }
      .tz-nombre-detalle-row input:last-child { flex: 3 1 0; min-width: 0; }
      .tz-amount-input {
        width: 100%;
        background: rgba(255,255,255,0.05);
        border: 1px solid var(--border-soft);
        border-radius: 10px;
        padding: 12px 14px;
        color: var(--text);
        font-family: 'Orbitron', sans-serif;
        font-size: 18px;
        font-weight: 700;
        text-align: center;
      }
      .tz-amount-input:focus { outline: none; border-color: var(--green); }

      .tz-text-input {
        width: 100%;
        box-sizing: border-box;
        background: rgba(255,255,255,0.05);
        border: 1px solid var(--border-soft);
        border-radius: 10px;
        padding: 11px 12px;
        color: var(--text);
        font-family: 'Rajdhani', sans-serif;
        font-size: 14px;
        font-weight: 600;
        text-align: left;
      }
      .tz-text-input:focus { outline: none; border-color: var(--cyan); }
      /* <select> pinta su propio menú desplegable con los estilos del
         sistema operativo — sin esto, las <option> salen con fondo
         blanco y texto blanco (ilegibles) aunque el <select> se vea
         bien. */
      select.tz-text-input option {
        background: var(--panel-solid);
        color: var(--text);
      }

      /* ---------- LIBRETA (FIADOS) ---------- */
      .tz-libreta-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 14px;
        padding: 18px 0 6px;
        text-align: center;
      }
      .tz-cliente-nombre {
        color: var(--text) !important;
        text-transform: none !important;
        letter-spacing: 0 !important;
        font-weight: 700 !important;
      }
      .tz-cliente-debe { color: var(--danger); }
      .tz-cliente-favor { color: var(--green); }
      .tz-cliente-aldia { color: var(--text-dim); }

      .tz-cliente-detail { gap: 10px !important; }
      .tz-mov-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .tz-mov-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 7px 9px;
        border-radius: 8px;
        background: rgba(255,255,255,0.03);
        border-left: 3px solid var(--border-soft);
        font-size: 12px;
      }
      .tz-mov-deuda { border-left-color: var(--danger); }
      .tz-mov-pago { border-left-color: var(--green); }
      .tz-mov-rechazado { border-left-color: var(--danger); opacity: 0.7; }
      .tz-mov-rechazado-monto {
        text-decoration: line-through;
        color: var(--text-dim);
        font-weight: 600;
      }
      .tz-mov-row-desc {
        display: flex;
        flex-direction: column;
        gap: 1px;
        color: var(--text);
        font-weight: 600;
      }
      .tz-mov-row-date {
        font-size: 10px;
        color: var(--text-dim);
        font-weight: 600;
      }
      .tz-mov-row strong { flex-shrink: 0; }

      .tz-cliente-actions {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .tz-cliente-action-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        border-radius: 8px;
        border: 1px solid var(--border-soft);
        background: rgba(255,255,255,0.03);
        color: var(--text);
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        font-size: 11.5px;
        padding: 7px 10px;
        cursor: pointer;
        text-decoration: none;
      }
      .tz-cliente-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .tz-pago-pendiente-note {
        margin: 0 0 8px;
        color: var(--orange);
        font-size: 12px;
        font-weight: 700;
      }

      .tz-toast {
        margin: 0 0 16px;
        padding: 10px 14px;
        border-radius: 10px;
        font-weight: 700;
        font-size: 13.5px;
        text-align: center;
      }
      .tz-toast-aprobado {
        background: var(--green-bg);
        border: 1px solid rgba(57,255,176,0.4);
        color: var(--green);
      }
      .tz-toast-rechazado {
        background: rgba(255,84,112,0.12);
        border: 1px solid rgba(255,84,112,0.4);
        color: var(--danger);
      }

      /* ---------- BRANDING (pantallas de login) ---------- */
      .tz-brand-title {
        font-family: 'Orbitron', sans-serif;
        font-weight: 900;
        font-size: 30px;
        letter-spacing: 0.08em;
        text-align: center;
        margin: 4px 0 2px;
        background: linear-gradient(90deg, var(--cyan), var(--pink));
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        filter: drop-shadow(0 0 18px rgba(43,232,255,0.35));
      }
      .tz-brand-sub {
        text-align: center;
        color: var(--text-dim);
        font-size: 12.5px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        margin: 0 0 26px;
      }
      .tz-csv-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .tz-csv-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
        background: rgba(255,255,255,0.05);
        border: 1px solid var(--border-soft);
        color: var(--text-dim);
        border-radius: 8px;
        padding: 6px 10px;
        font-family: 'Rajdhani', sans-serif;
        font-size: 11.5px;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
      }
      .tz-csv-btn:hover { border-color: var(--cyan); color: var(--cyan); }
      .tz-export-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .tz-export-buttons .tz-csv-btn { flex: 1 1 auto; justify-content: center; }

      .tz-arqueo-ok,
      .tz-arqueo-faltante,
      .tz-arqueo-sobrante {
        font-weight: 800;
        letter-spacing: 0.02em;
      }
      .tz-arqueo-ok { color: var(--cyan); }
      .tz-arqueo-faltante { color: var(--danger); }
      .tz-arqueo-sobrante { color: var(--green); }
      p.tz-arqueo-ok,
      p.tz-arqueo-faltante,
      p.tz-arqueo-sobrante {
        margin: -6px 0 0;
        font-size: 13.5px;
      }

      .tz-login-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 14px;
      }
      .tz-modal-logo {
        display: block;
        height: 88px;
        width: auto;
        margin: 0 auto 12px;
      }
      .tz-checkbox-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: -4px 0 16px;
        font-size: 13px;
        color: var(--text-dim);
        cursor: pointer;
        user-select: none;
      }
      .tz-checkbox-row input {
        width: 15px;
        height: 15px;
        accent-color: var(--cyan);
        cursor: pointer;
      }
      /* Va en la misma fila que el resumen del carrito (ver
         '.tz-checkout-summary-row'), ya no debajo — sin margen propio. */
      .tz-checkout-ruc-toggle { margin: 0; }
      /* Agrupa el resumen del carrito ("1 producto · Total S/ X") y el
         checkbox de RUC en una sola fila horizontal — antes cada uno
         era un hijo directo de '.tz-submitbar-content' (flex-direction:
         column), así que cada uno caía en su propia línea. 'flex-wrap'
         solo entra en juego si de verdad no entran en el ancho
         disponible (pantallas muy angostas). */
      .tz-checkout-summary-row {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap: 16px;
        width: 100%;
      }
      .tz-cliente-action-deuda { border-color: rgba(255,84,112,0.4); color: var(--danger); }
      .tz-cliente-action-deuda:hover { background: rgba(255,84,112,0.12); }
      .tz-cliente-action-pago { border-color: rgba(57,255,176,0.4); color: var(--green); }
      .tz-cliente-action-pago:hover { background: rgba(57,255,176,0.12); }
      .tz-cliente-action-whatsapp { border-color: rgba(37,211,102,0.5); color: #25d366; }
      .tz-cliente-action-whatsapp:hover { background: rgba(37,211,102,0.14); }
      .tz-cliente-action-delete { border-color: rgba(255,84,112,0.5); color: var(--danger); }
      .tz-cliente-action-delete:hover { background: rgba(255,84,112,0.14); }

      /* ---------- GASTOS + PROVEEDORES ---------- */
      .tz-gasto-row-2col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .tz-gasto-tipo-buttons {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .tz-gasto-tipo-btn {
        flex: 1 1 auto;
        border-radius: 8px;
        border: 1px solid var(--border-soft);
        background: rgba(255,255,255,0.03);
        color: var(--text-dim);
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        font-size: 12px;
        padding: 9px 8px;
        cursor: pointer;
        white-space: nowrap;
      }
      .tz-gasto-tipo-active {
        border-color: var(--orange);
        color: var(--orange);
        background: rgba(255,149,0,0.12);
      }

      .tz-ruc-hint {
        display: flex;
        align-items: center;
        gap: 5px;
        margin: -4px 0 0;
        font-size: 11.5px;
        font-weight: 600;
      }
      .tz-ruc-found { color: var(--green); }
      .tz-ruc-new { color: var(--orange); }

      .tz-gasto-items {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .tz-gasto-item-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
      }
      .tz-gasto-item-desc { flex: 1 1 100%; }
      .tz-gasto-item-desc-wrap {
        flex: 1 1 100%;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .tz-gasto-item-desc-wrap .tz-gasto-item-desc { flex: 1 1 auto; min-width: 0; }
      .tz-gasto-item-linked {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        color: var(--cyan);
      }
      .tz-gasto-item-remove {
        flex-shrink: 0;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        border: 1px solid rgba(255,84,112,0.35);
        background: rgba(255,84,112,0.08);
        color: var(--danger);
        cursor: pointer;
      }
      .tz-gasto-item-remove:hover { background: rgba(255,84,112,0.18); }
      /* Dentro de '.tz-stock-cost-inputs' (ítems de Gastos, mismo layout
         que "Agregar Unidades al Stock") el botón de eliminar es un
         hermano flex de los dos '.tz-stock-cost-field' (label + input,
         ~54px de alto) — sin esto quedaba pegado arriba, a la altura
         del label, en vez de a la altura del input. */
      .tz-stock-cost-inputs .tz-gasto-item-remove { align-self: flex-end; margin-bottom: 1px; }

      .tz-gasto-add-item {
        align-self: flex-start;
        display: flex;
        align-items: center;
        gap: 5px;
        background: transparent;
        border: 1px dashed var(--border-soft);
        border-radius: 8px;
        color: var(--text-dim);
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        font-size: 12px;
        padding: 7px 12px;
        cursor: pointer;
      }
      .tz-gasto-add-item:hover { color: var(--text); border-color: rgba(43,232,255,0.35); }

      .tz-gasto-total-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        border-radius: 10px;
        background: rgba(255,149,0,0.08);
        border: 1px solid rgba(255,149,0,0.3);
        font-family: 'Orbitron', sans-serif;
        font-weight: 800;
      }
      .tz-gasto-total-row span {
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--text-dim);
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
      }
      .tz-gasto-total-row strong { color: var(--orange); font-size: 16px; }

      /* ---------- CIERRE DE CAJA (RECIBO NEÓN) ---------- */
      .tz-receipt {
        display: flex;
        flex-direction: column;
        gap: 6px;
        background: linear-gradient(180deg, rgba(255,84,112,0.06), transparent 60%),
          var(--panel-solid);
        border: 1px solid rgba(255,84,112,0.35);
        border-radius: 12px;
        padding: 14px 16px;
        box-shadow: 0 0 22px rgba(255,84,112,0.18);
        font-family: 'Rajdhani', sans-serif;
      }
      .tz-receipt-compact { padding: 10px 12px; gap: 4px; }
      .tz-receipt-header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
      }
      .tz-receipt-title {
        font-family: 'Orbitron', sans-serif;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--danger);
      }
      .tz-receipt-date {
        font-size: 10.5px;
        color: var(--text-dim);
        font-weight: 600;
      }
      .tz-receipt-divider {
        border-top: 1px dashed rgba(255,255,255,0.18);
        margin: 2px 0;
      }
      .tz-receipt-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        font-size: 12.5px;
      }
      .tz-receipt-row span { color: var(--text-dim); font-weight: 600; }
      .tz-receipt-row strong { color: var(--text); font-weight: 700; }
      .tz-receipt-total span {
        font-family: 'Orbitron', sans-serif;
        font-size: 11px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--text);
      }
      .tz-receipt-total strong {
        font-family: 'Orbitron', sans-serif;
        font-size: 16px;
        color: var(--green);
        text-shadow: 0 0 10px rgba(57,255,176,0.45);
      }
      .tz-cierre-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 320px;
        overflow-y: auto;
        padding-right: 2px;
      }

      /* ---------- MODAL TOP CLIENTES ---------- */
      .tz-top-clientes-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 420px;
        overflow-y: auto;
        padding-right: 2px;
      }
      .tz-top-cliente-row {
        padding: 10px 12px;
        border-radius: 10px;
        background: rgba(255,255,255,0.03);
        border: 1px solid var(--border-soft);
      }
      .tz-top-cliente-row:nth-child(1) { border-color: rgba(215,255,59,0.5); box-shadow: 0 0 14px rgba(215,255,59,0.2); }
      .tz-top-cliente-row:nth-child(2) { border-color: rgba(43,232,255,0.4); }
      .tz-top-cliente-row:nth-child(3) { border-color: rgba(255,149,0,0.4); }
      .tz-top-cliente-main {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .tz-top-cliente-rank {
        flex-shrink: 0;
        width: 26px;
        text-align: center;
        font-family: 'Orbitron', sans-serif;
        font-weight: 800;
        color: var(--text-dim);
      }
      .tz-top-cliente-row:nth-child(1) .tz-top-cliente-rank { color: var(--yellow); }
      .tz-top-cliente-info {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 3px;
      }
      .tz-top-cliente-nombre {
        font-weight: 700;
        color: var(--text);
        overflow-wrap: anywhere;
      }
      .tz-top-cliente-sub {
        font-size: 11px;
        color: var(--text-dim);
      }
      .tz-top-cliente-deuda { font-size: 10px; padding: 2px 8px; }
      .tz-top-cliente-monto {
        flex-shrink: 0;
        font-family: 'Orbitron', sans-serif;
        color: var(--green);
        font-size: 15px;
      }
      .tz-top-cliente-actions {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .tz-top-cliente-wa-btn,
      .tz-top-cliente-expand-btn {
        flex-shrink: 0;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        border: 1px solid var(--border-soft);
        background: rgba(255,255,255,0.06);
        color: var(--text-dim);
        cursor: pointer;
        text-decoration: none;
      }
      .tz-top-cliente-wa-btn {
        border-color: rgba(57,255,176,0.4);
        color: var(--green);
      }
      .tz-top-cliente-wa-btn:hover { background: rgba(57,255,176,0.15); }
      .tz-top-cliente-expand-btn:hover { background: rgba(43,232,255,0.15); color: var(--cyan); }
      .tz-top-cliente-favoritos {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px dashed rgba(255,255,255,0.12);
      }
      .tz-top-favoritos-list {
        margin: 0;
        padding: 0 0 0 4px;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 12.5px;
        color: var(--text-dim);
      }
      .tz-cierre-warning {
        display: flex;
        align-items: flex-start;
        gap: 7px;
        margin: 0;
        font-size: 12.5px;
        color: var(--yellow);
        font-weight: 600;
        line-height: 1.4;
      }

      /* ---------- CRM WHATSAPP EN EL COBRO ---------- */
      .tz-checkout-crm {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .tz-checkout-input { flex: 1 1 140px; font-size: 12.5px; padding: 9px 11px; }
      /* Los inputs de Nombre/WhatsApp con autocompletado van envueltos en
         '.tz-global-search-wrap' (para poder anclar el dropdown) — ese
         wrap, no el <input> directamente, es ahora el hijo flex real
         de '.tz-checkout-crm', así que hereda acá el mismo flex-basis
         que antes tenía '.tz-checkout-input'. */
      .tz-checkout-crm .tz-global-search-wrap { flex: 1 1 140px; }
      .tz-whatsapp-send-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        text-decoration: none;
        background: rgba(37,211,102,0.14);
        border: 1px solid rgba(37,211,102,0.5);
        color: #25d366;
        border-radius: 10px;
        padding: 10px 14px;
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        font-size: 13px;
      }
      .tz-whatsapp-send-btn:hover { background: rgba(37,211,102,0.22); }
      .tz-whatsapp-send-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      /* Variante sólida: la boleta-imagen es la acción principal (vs. el
         resumen de texto, que queda como link secundario en outline) —
         más peso visual, mismo verde de marca de WhatsApp. */
      .tz-whatsapp-send-btn-solid {
        background: #25d366;
        border-color: #25d366;
        color: #05130c;
        margin-top: 8px;
      }
      .tz-whatsapp-send-btn-solid:hover { background: #2fe676; }

      /* ---------- MÉTODO DE PAGO (checkout) ---------- */
      .tz-metodo-pago {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding-top: 10px;
        border-top: 1px dashed rgba(255,255,255,0.14);
      }
      .tz-metodo-pago-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .tz-metodo-pago-change {
        background: transparent;
        border: none;
        color: var(--cyan);
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        font-size: 12px;
        text-decoration: underline;
        cursor: pointer;
        padding: 0;
      }
      /* Cada método de pago con su color característico. Se ve tenue
         en reposo y con más fuerza (fondo + glow) cuando está elegido. */
      .tz-metodo-btn {
        text-transform: uppercase !important;
      }
      .tz-metodo-btn-yape { border-color: rgba(182,33,255,0.45); color: var(--yape); }
      .tz-metodo-btn-yape.tz-gasto-tipo-active {
        border-color: var(--yape);
        background: rgba(182,33,255,0.16);
        box-shadow: 0 0 14px rgba(182,33,255,0.35);
      }
      .tz-metodo-btn-plin { border-color: rgba(0,224,198,0.45); color: var(--plin); }
      .tz-metodo-btn-plin.tz-gasto-tipo-active {
        border-color: var(--plin);
        background: rgba(0,224,198,0.16);
        box-shadow: 0 0 14px rgba(0,224,198,0.35);
      }
      .tz-metodo-btn-otros { border-color: rgba(156,163,175,0.5); color: var(--gris); }
      .tz-metodo-btn-otros.tz-gasto-tipo-active {
        border-color: var(--gris);
        background: rgba(156,163,175,0.16);
        box-shadow: 0 0 14px rgba(156,163,175,0.3);
      }
      .tz-metodo-btn-fiado { border-color: rgba(255,149,0,0.5); color: var(--orange); }
      .tz-metodo-btn-fiado.tz-gasto-tipo-active {
        border-color: var(--orange);
        background: rgba(255,149,0,0.16);
        box-shadow: 0 0 14px rgba(255,149,0,0.4);
      }
      .tz-metodo-btn-efectivo { border-color: rgba(57,255,176,0.5); color: var(--green); }
      .tz-metodo-btn-efectivo.tz-gasto-tipo-active {
        border-color: var(--green);
        background: rgba(57,255,176,0.16);
        box-shadow: 0 0 14px rgba(57,255,176,0.4);
      }

      .tz-checkout-scan,
      .tz-checkout-fiado {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 12px;
        border: 1px dashed var(--border-soft);
        border-radius: 12px;
        animation: tz-drop-in 0.15s ease;
      }
      .tz-checkout-fiado-new {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .tz-vuelto-quick-buttons {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .tz-vuelto-quick-btn {
        flex: 1 1 70px;
        background: rgba(255,255,255,0.05);
        border: 1px solid var(--border-soft);
        border-radius: 8px;
        padding: 8px 6px;
        color: var(--text);
        font-family: 'Orbitron', sans-serif;
        font-weight: 700;
        font-size: 12.5px;
        cursor: pointer;
      }
      .tz-vuelto-quick-btn:hover { border-color: var(--green); color: var(--green); }
      .tz-vuelto-display {
        margin: 0;
        text-align: center;
        font-family: 'Orbitron', sans-serif;
        font-size: 13px;
        font-weight: 700;
        color: var(--text-dim);
        letter-spacing: 0.05em;
      }
      .tz-vuelto-display strong {
        display: block;
        margin-top: 2px;
        font-size: 26px;
        color: var(--green);
        text-shadow: 0 0 16px rgba(57,255,176,0.5);
      }
      .tz-checkout-fiado-selected {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0;
        font-size: 12.5px;
        color: var(--green);
        font-weight: 600;
      }
      .tz-checkout-fiado-selected strong { color: var(--text); }

      /* ---------- ETIQUETA DE MÉTODO EN EL HISTORIAL ---------- */
      .tz-metodo-tag {
        display: inline-block;
        padding: 3px 9px;
        border-radius: 999px;
        font-size: 10.5px;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        border: 1px solid var(--border-soft);
      }
      .tz-metodo-tag-yape { color: var(--yape); border-color: rgba(182,33,255,0.5); background: rgba(182,33,255,0.1); }
      .tz-metodo-tag-plin { color: var(--plin); border-color: rgba(0,224,198,0.5); background: rgba(0,224,198,0.1); }
      .tz-metodo-tag-otros { color: var(--gris); border-color: rgba(156,163,175,0.5); background: rgba(156,163,175,0.1); }
      .tz-metodo-tag-fiado { color: var(--orange); border-color: rgba(255,149,0,0.5); background: rgba(255,149,0,0.1); }
      .tz-metodo-tag-efectivo { color: var(--green); border-color: rgba(57,255,176,0.5); background: rgba(57,255,176,0.1); }

      .tz-scan-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        background: rgba(43,232,255,0.1);
        border: 1px solid rgba(43,232,255,0.4);
        color: var(--cyan);
        border-radius: 10px;
        padding: 11px;
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        font-size: 13.5px;
        cursor: pointer;
      }
      .tz-scan-btn:hover { background: rgba(43,232,255,0.18); }
      .tz-scan-btn:disabled { opacity: 0.5; cursor: not-allowed; }

      .tz-camera-note {
        margin: -4px 0 0;
        font-size: 11.5px;
        color: var(--text-dim);
        text-align: center;
      }
      .tz-monto-ok {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        color: var(--green);
        font-weight: 700;
      }

      .tz-payment-save {
        margin-top: 2px;
        /* --green (#39ffb0) es un verde neón muy claro: el texto cian
           heredado de .tz-scan-btn quedaba casi ilegible encima. Se usa
           un verde sólido más oscuro (sigue leyéndose "vibrante") con
           texto blanco fijo para que el contraste sea alto en cualquier
           estado, habilitado o no. */
        background: #12b76a;
        color: #ffffff;
        box-shadow: 0 0 20px rgba(18,183,106,0.45);
      }
      .tz-payment-save:disabled {
        opacity: 0.55;
        cursor: not-allowed;
        color: #ffffff;
      }

      .tz-scan-result {
        background: rgba(57,255,176,0.08);
        border: 1px solid rgba(57,255,176,0.3);
        border-radius: 10px;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .tz-scan-result-title {
        margin: 0 0 2px;
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--green);
        font-weight: 800;
        font-size: 12.5px;
      }
      .tz-scan-result-row {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        font-size: 12.5px;
        color: var(--text-dim);
      }
      .tz-scan-result-row strong { color: var(--text); }

      .tz-camera-view {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .tz-camera-video {
        width: 100%;
        aspect-ratio: 3 / 4;
        max-height: 70vh;
        border-radius: 12px;
        background: #000;
        border: 1px solid var(--border-soft);
        object-fit: cover;
        display: block;
      }
      .tz-camera-actions {
        display: flex;
        gap: 8px;
      }
      .tz-camera-actions .tz-scan-btn { flex: 1; }
      .tz-camera-cancel {
        flex: 0 0 auto;
        background: rgba(255,255,255,0.05);
        border: 1px solid var(--border-soft);
        color: var(--text-dim);
        border-radius: 10px;
        padding: 11px 16px;
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        font-size: 13px;
        cursor: pointer;
      }
      .tz-scanner-upload-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-top: 10px;
      }
      .tz-scanner-upload-btn:disabled { opacity: 0.5; cursor: not-allowed; }

      .tz-scan-processing {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        padding: 24px 0;
        color: var(--text-dim);
      }
      .tz-scan-processing p { margin: 0; font-weight: 600; font-size: 13.5px; }

      /* ==================================================================
         RESPONSIVE: el diseño base de arriba es "mobile-first" (1 columna,
         100% de ancho, padding lateral chico). Estas media queries SOLO
         amplían el layout para pantallas más grandes.
         ================================================================== */

      /* Elimina las franjas laterales del boilerplate de Vite (#root)
         para que la app aproveche todo el ancho de la ventana. */
      #root {
        width: 100% !important;
        max-width: 100% !important;
        border-inline: none !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      /* ---------- CELULARES ANGOSTOS (<= 380px) ---------- */
      /* En equipos de gama baja (~360px de ancho) la fila del nombre
         del producto + la botonera (%, lápiz, checkbox) puede quedar
         muy apretada. flex-basis:0 en .tz-card-info ya evita que se
         empujen fuera de la tarjeta, pero acá les damos además más
         aire: menos padding en la tarjeta, botones más chicos y menor
         gap entre ellos, para que los 3 siempre quepan cómodos. */
      @media (max-width: 380px) {
        .tz-card { padding: 14px; gap: 12px; }
        .tz-card-row { gap: 10px; }
        /* Más chico que en escritorio (144px) para no comerse toda la
           fila en ~320-360px, pero sigue siendo un cuadrado grande y
           protagonista — la info al lado usa flex-basis:0 y hace
           wrap, nunca se rompe por esto. */
        .tz-product-image { width: 112px; height: 112px; }
        .tz-card-name { font-size: 16px; }
        .tz-card-top-actions { gap: 6px; }
        .tz-variant-card-actions { gap: 5px; }
        .tz-card-discount-btn,
        .tz-card-edit-price-btn,
        .tz-checkbox,
        .tz-variant-add-btn {
          width: 24px;
          height: 24px;
        }
        /* Mismo criterio que arriba, aplicado a la fila de cada
           variante dentro del modal "¿Qué variante?": imagen + botonera
           un poco más chicas para que nunca compitan por espacio con el
           nombre en pantallas de gama baja (~320-360px). */
        .tz-variant-card { padding: 8px 10px; gap: 8px; }
        .tz-product-image-sm { width: 40px; height: 40px; }
      }

      /* ---------- TABLET (>= 768px) ---------- */
      @media (min-width: 768px) {
        .tz-header-row {
          max-width: 700px;
          margin: 0 auto;
        }
        .tz-header-btn {
          flex-direction: row;
          padding: 9px 14px;
        }
        .tz-header-btn-label { display: inline; font-size: 11px; }
        .tz-main {
          max-width: 700px;
          margin: 0 auto;
          padding-left: 20px;
          padding-right: 20px;
          padding-top: 24px;
          padding-bottom: calc(var(--tz-footer-h, 0px) + 26px);
        }
        .tz-header { padding: 24px 20px; }
        .tz-logo { max-width: 170px; }

        .tz-stats { gap: 12px; }
        .tz-stat-chip { padding: 12px 14px; border-radius: 14px; gap: 5px; }
        .tz-stat-label { font-size: 11px; letter-spacing: 0.09em; gap: 5px; }
        .tz-stat-value { font-size: 20px; }
        .tz-stat-sub { font-size: 10.5px; }
        .tz-tab { flex: 1 1 150px; font-size: 12px; padding: 13px 14px; }
        .tz-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }

        .tz-submitbar {
          /* left:0/right:0 + width acotado + márgenes auto = centrado real
             (antes le faltaba margin:auto y quedaba pegada a la izquierda) */
          max-width: 700px;
          margin: 0 auto;
          border-radius: 16px 16px 0 0;
          border-left: 1px solid rgba(43,232,255,0.25);
          border-right: 1px solid rgba(43,232,255,0.25);
          padding: 16px 20px calc(16px + env(safe-area-inset-bottom, 0px));
        }
        .tz-page-footer { max-width: 700px; margin: 0 auto; padding: 24px 20px; gap: 12px; }
        .tz-footer-btn { flex: 0 1 200px; padding: 13px 20px; font-size: 12px; }
      }

      /* ---------- ESCRITORIO (>= 1024px) ---------- */
      /* Aquí sí se "libera" el ancho: la app pasa a ocupar el 95% de la
         ventana (en vez de quedar encajonada en ~1100px con franjas a
         los lados) y la grilla de productos pasa a 3 columnas
         panorámicas. */
      @media (min-width: 1024px) {
        .tz-header-row,
        .tz-main,
        .tz-submitbar,
        .tz-page-footer {
          width: 95%;
          max-width: 1400px;
          margin-left: auto;
          margin-right: auto;
        }
        .tz-main {
          padding-left: 28px;
          padding-right: 28px;
          padding-top: 28px;
          padding-bottom: calc(var(--tz-footer-h, 0px) + 30px);
        }
        .tz-header { padding: 26px 16px; }
        .tz-logo { max-width: 190px; }

        .tz-stats { gap: 14px; }
        .tz-stat-chip { padding: 14px 16px; }
        .tz-stat-value { font-size: 22px; }
        .tz-stat-label { font-size: 11px; }
        .tz-stat-sub { font-size: 11px; }

        /* Tarjetas panorámicas: 3+ columnas, cada tarjeta más ancha que alta */
        .tz-grid { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 18px; }
        .tz-card { min-height: 168px; }
      }

      /* ==================== EASTER EGG: TONAZO ARCADE ==================== */
      .tz-eg-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: #050310;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        font-family: 'Rajdhani', sans-serif;
      }
      .tz-eg-close {
        position: absolute;
        top: 14px;
        right: 14px;
        z-index: 20;
        width: 38px;
        height: 38px;
        border-radius: 10px;
        border: 1px solid rgba(255,84,112,0.4);
        background: rgba(255,84,112,0.12);
        color: #ff5470;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
      .tz-eg-close:hover { background: rgba(255,84,112,0.24); }

      /* ---- selección de personaje / menú ---- */
      .tz-eg-select {
        width: 100%;
        max-width: 720px;
        max-height: 100%;
        overflow-y: auto;
        padding: 40px 24px;
        text-align: center;
        color: #e8f6ff;
      }
      .tz-eg-title {
        font-family: 'Orbitron', sans-serif;
        font-size: 26px;
        font-weight: 800;
        color: #2be8ff;
        text-shadow: 0 0 18px rgba(43,232,255,0.6);
        margin: 0 0 8px;
        letter-spacing: 0.04em;
      }
      .tz-eg-gold {
        margin: 0 0 24px;
        color: #ffd43b;
        font-weight: 700;
        font-size: 15px;
      }
      .tz-eg-char-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 14px;
        margin-bottom: 28px;
      }
      .tz-eg-char-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 14px 10px;
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,0.1);
        background: rgba(255,255,255,0.03);
      }
      .tz-eg-char-card-selected {
        border-color: #2be8ff;
        background: rgba(43,232,255,0.08);
      }
      .tz-eg-char-avatar {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: 2px solid;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0,0,0,0.4);
      }
      .tz-eg-char-avatar-dot {
        width: 22px;
        height: 22px;
        border-radius: 6px;
      }
      .tz-eg-char-name {
        font-size: 12.5px;
        font-weight: 700;
        color: #e8f6ff;
      }
      .tz-eg-char-btn {
        width: 100%;
        padding: 6px 8px;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.15);
        background: rgba(255,255,255,0.06);
        color: #e8f6ff;
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        font-size: 12px;
        cursor: pointer;
      }
      .tz-eg-char-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .tz-eg-char-btn-locked { color: #ffd43b; border-color: rgba(255,212,59,0.35); }
      .tz-eg-play-btn {
        padding: 14px 32px;
        border-radius: 999px;
        border: none;
        background: linear-gradient(135deg, #2be8ff, #b98bff);
        color: #06131a;
        font-family: 'Orbitron', sans-serif;
        font-weight: 800;
        font-size: 15px;
        letter-spacing: 0.03em;
        cursor: pointer;
        box-shadow: 0 0 24px rgba(43,232,255,0.4);
      }
      .tz-eg-controls-hint {
        margin-top: 18px;
        font-size: 12px;
        color: #8fa3c8;
        line-height: 1.6;
      }

      /* ---- área de juego ---- */
      .tz-eg-game-area {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .tz-eg-canvas {
        max-width: 100%;
        max-height: 100%;
        aspect-ratio: 960 / 540;
        image-rendering: crisp-edges;
        border: 1px solid rgba(43,232,255,0.15);
      }

      .tz-eg-overlay-msg {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 14px;
        background: rgba(5,3,16,0.82);
        color: #e8f6ff;
        text-align: center;
        padding: 20px;
      }
      .tz-eg-overlay-msg h2 {
        font-family: 'Orbitron', sans-serif;
        font-size: 22px;
        color: #b98bff;
        text-shadow: 0 0 16px rgba(185,139,255,0.6);
        margin: 0;
      }
      .tz-eg-continue-btn {
        padding: 12px 28px;
        border-radius: 999px;
        border: none;
        background: linear-gradient(135deg, #2be8ff, #b98bff);
        color: #06131a;
        font-family: 'Orbitron', sans-serif;
        font-weight: 800;
        font-size: 14px;
        cursor: pointer;
      }

      /* ---- controles táctiles: solo en pantallas táctiles (pointer
         grueso) — en desktop con mouse/teclado quedan ocultos, ya que
         el teclado cubre ese caso. ---- */
      .tz-eg-joystick {
        position: absolute;
        left: 24px;
        bottom: 24px;
        width: 96px;
        height: 96px;
        border-radius: 50%;
        border: 2px solid rgba(43,232,255,0.4);
        background: rgba(43,232,255,0.06);
        touch-action: none;
        z-index: 15;
      }
      .tz-eg-joystick-nub {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 40px;
        height: 40px;
        margin-left: -20px;
        margin-top: -20px;
        border-radius: 50%;
        background: rgba(43,232,255,0.35);
        border: 2px solid #2be8ff;
        box-shadow: 0 0 14px rgba(43,232,255,0.5);
        pointer-events: none;
      }
      .tz-eg-btn {
        position: absolute;
        bottom: 30px;
        width: 74px;
        height: 74px;
        border-radius: 50%;
        border: 2px solid rgba(255,255,255,0.3);
        background: rgba(255,255,255,0.08);
        color: #e8f6ff;
        font-family: 'Orbitron', sans-serif;
        font-weight: 800;
        font-size: 11px;
        letter-spacing: 0.02em;
        touch-action: none;
        z-index: 15;
        cursor: pointer;
      }
      .tz-eg-btn-jump {
        right: 116px;
        border-color: rgba(215,255,59,0.5);
        background: rgba(215,255,59,0.1);
        color: #d7ff3b;
      }
      .tz-eg-btn-action {
        right: 24px;
        border-color: rgba(255,47,158,0.5);
        background: rgba(255,47,158,0.1);
        color: #ff2f9e;
      }

      @media (pointer: fine) {
        .tz-eg-joystick, .tz-eg-btn { display: none; }
      }

      /* ---- aviso de "gira tu dispositivo": el juego es 960x540
         (horizontal) — en pantallas táctiles angostas en vertical se
         cubre todo con este aviso en vez de mostrar el canvas
         aplastado. screen.orientation.lock('landscape') ya se intenta
         desde JS, pero iOS Safari no lo soporta, así que este overlay
         de CSS es el fallback real que sí funciona siempre. ---- */
      .tz-eg-rotate-hint {
        display: none;
      }
      @media (orientation: portrait) and (max-width: 900px) {
        .tz-eg-rotate-hint {
          display: flex;
          position: fixed;
          inset: 0;
          z-index: 30;
          align-items: center;
          justify-content: center;
          background: #050310;
          color: #2be8ff;
          font-family: 'Orbitron', sans-serif;
          font-size: 16px;
          text-align: center;
          padding: 24px;
        }
      }
    `}</style>
  );
}
