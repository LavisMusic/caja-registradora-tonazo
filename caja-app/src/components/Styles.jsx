export default function Styles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;800;900&family=Rajdhani:wght@500;600;700&display=swap');

      /* ---- Variables del TEMA ----
         Valores por defecto = tema "Neón Tonazo" (oscuro). Un negocio
         puede tener su propio tema (Perfil → Tema): TemaNegocio.jsx
         inyecta otro <style> con estas MISMAS variables para .tz-root y
         .tz-portal (ventanas que se dibujan fuera de .tz-root, como el
         desplegable de venta registrada). Por eso en el resto de esta
         hoja los colores van SIEMPRE por variable — nunca un color fijo
         de la paleta — así un tema cambia toda la interfaz.
         Roles: --cyan = principal, --pink = secundario, --yellow =
         acento (los nombres quedaron de la paleta original). Los *-rgb
         son el mismo color en "r,g,b" para usarlos con transparencia:
         rgba(var(--cyan-rgb), 0.3). --fg-rgb es el color de los velos y
         bordes sutiles (blanco en oscuro, casi negro en claro); --base-rgb
         y --surface-rgb los fondos sólidos de barras y paneles. */
      .tz-root, .tz-portal {
        --bg-1: #0a0716;
        --bg-2: #170e2e;
        --panel: rgba(26, 19, 48, 0.55);
        --panel-solid: #140d28;
        --border-soft: rgba(var(--fg-rgb), 0.08);
        --cyan: #2be8ff;
        --cyan-rgb: 43, 232, 255;
        --cyan-2: #00e0ff;
        --cyan-2-rgb: 0, 224, 255;
        --pink: #ff2f9e;
        --pink-rgb: 255, 47, 158;
        --yellow: #d7ff3b;
        --yellow-rgb: 215, 255, 59;
        --text: #f4f2ff;
        --text-dim: #9c93c2;
        --danger: #ff5470;
        --danger-rgb: 255, 84, 112;
        --green: #39ffb0;
        --green-rgb: 57, 255, 176;
        --green-bg: rgba(var(--green-rgb), 0.12);
        --orange: #ff9500;
        --orange-rgb: 255, 149, 0;
        --orange-glow: rgba(var(--orange-rgb), 0.5);
        --fg-rgb: 255, 255, 255;
        --shadow-rgb: 0, 0, 0;
        --base-rgb: 10, 7, 22;
        --base-deep-rgb: 5, 3, 12;
        --surface-rgb: 15, 10, 30;
        --surface-2-rgb: 26, 19, 48;
        /* Texto encima de un botón/etiqueta del color principal, acento,
           peligro o verde (en neón va oscuro). */
        --on-cyan: #06131a;
        --on-yellow: #16190a;
        --on-danger: #2b0006;
        --on-green: #05030c;
        --yape: #b621ff;
        --plin: #00e0c6;
        --gris: #9ca3af;
        /* Fondo del recuadro de foto de producto (sin foto o mientras carga). */
        --img-bg: #14101f;
      }
      .tz-root {
        --tz-footer-h: 84px;

        min-height: 100vh;
        width: 100%;
        background:
          radial-gradient(ellipse 900px 500px at 20% -10%, rgba(var(--cyan-rgb),0.10), transparent 60%),
          radial-gradient(ellipse 900px 500px at 90% 10%, rgba(var(--pink-rgb),0.10), transparent 60%),
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
        text-shadow: 0 0 16px rgba(var(--green-rgb),0.5);
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
        border: 1px solid rgba(var(--orange-rgb),0.4);
        border-radius: 999px;
        color: var(--orange);
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        font-size: 13px;
        cursor: pointer;
      }
      .tz-caja-blocked-reportar:hover { background: rgba(var(--orange-rgb),0.1); }

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
        /* padding-top generoso (era 20px): el glow del logo (drop-shadow
           de hasta 34px de blur) no tiene nada arriba del header contra
           qué expandirse — con solo 20px quedaba clavado contra el
           borde superior de la pantalla en mobile, cortado en vez de
           desvanecerse. */
        padding: 40px 14px 22px;
        background: rgba(var(--base-rgb), 0.85);
        border-bottom: 1px solid rgba(var(--cyan-rgb),0.15);
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
        position: relative;
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

      /* Botón "Fiados" apareciendo por primera vez (asignado en vivo, o
         recién iniciada sesión) — "explosión de chicle": crece de
         golpe y de más (overshoot) antes de asentarse. .tz-header-side
         es flex-direction:column, así que animar max-height (no width)
         es lo que hace que "Mis Pedidos" (el hermano de abajo) se
         deslice solo hacia su posición final a medida que este crece —
         reflow real de layout, no un simple fundido. */
      .tz-fiados-pop-wrap {
        display: block;
        overflow: hidden;
        animation: tz-fiados-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      }
      @keyframes tz-fiados-pop {
        0% { max-height: 0; opacity: 0; transform: scale(0.4); }
        60% { max-height: 80px; opacity: 1; transform: scale(1.08); }
        100% { max-height: 80px; opacity: 1; transform: scale(1); }
      }
      /* Reverso al quitar Fiados — mismo "rebote" pero encogiendo, no
         un simple fundido. */
      .tz-fiados-pop-wrap-out {
        animation-name: tz-fiados-pop-out;
      }
      @keyframes tz-fiados-pop-out {
        0% { max-height: 80px; opacity: 1; transform: scale(1); }
        40% { max-height: 60px; opacity: 1; transform: scale(1.08); }
        100% { max-height: 0; opacity: 0; transform: scale(0.4); }
      }
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
          drop-shadow(0 0 18px rgba(var(--cyan-rgb),0.55))
          drop-shadow(0 0 34px rgba(var(--pink-rgb),0.35));
      }
      .tz-subtitle {
        margin: 0;
        font-family: 'Orbitron', sans-serif;
        font-size: 11px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        /* Limón neón con glow, mismo estilo que "Tu taxi, al toque" en
           Taxi-PE (misma clase .tz-subtitle ahí) — reusa --yellow
           (var(--yellow)), ya definido en :root más arriba. */
        color: var(--yellow);
        text-align: center;
        white-space: nowrap;
        text-shadow: 0 0 8px rgba(var(--yellow-rgb),0.85), 0 0 18px rgba(var(--yellow-rgb),0.55);
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
        background: rgba(var(--green-rgb),0.1);
        border-color: rgba(var(--green-rgb),0.35);
      }
      .tz-conn-online .tz-conn-dot { background: var(--green); box-shadow: 0 0 6px rgba(var(--green-rgb),0.8); }
      .tz-conn-offline {
        color: var(--danger);
        background: rgba(var(--danger-rgb),0.1);
        border-color: rgba(var(--danger-rgb),0.4);
        animation: tz-conn-offline-pulse 1.6s ease-in-out infinite;
      }
      .tz-conn-offline .tz-conn-dot { background: var(--danger); box-shadow: 0 0 6px rgba(var(--danger-rgb),0.8); }
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
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 0;
        position: relative;
        /* Celular: mantener presionado + deslizar (lib/despliegueBotones)
           sin que la página se desplace ni salga el menú del navegador. */
        touch-action: none;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
        background: rgba(var(--orange-rgb),0.06);
        border: 1px solid rgba(var(--orange-rgb),0.45);
        color: var(--orange);
        border-radius: 12px;
        padding: 9px;
        cursor: pointer;
        box-shadow: 0 0 10px rgba(var(--orange-rgb),0.15);
        transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease,
          box-shadow 0.15s ease;
      }
      .tz-header-btn svg {
        filter: drop-shadow(0 0 4px var(--orange-glow));
      }
      .tz-header-btn:hover {
        color: var(--orange);
        border-color: var(--orange);
        background: rgba(var(--orange-rgb),0.16);
        box-shadow: 0 0 16px rgba(var(--orange-rgb),0.4);
      }
      /* Botones de la cabecera: solo el ícono; el nombre se DESPLIEGA
         (el botón se estira con animación). PC: al pasar el cursor.
         Celular: manteniendo presionado (y deslizando por los demás) —
         clase .tz-hbtn-abierto, ver lib/despliegueBotones.js. Las
         columnas reparten el ancho fijo, así que estirarse no mueve el
         logo: los de la izquierda se abren a la derecha y los de la
         derecha a la izquierda, por encima de todo. */
      .tz-header-btn-label {
        display: inline-block;
        max-width: 0;
        opacity: 0;
        overflow: hidden;
        margin-left: 0;
        vertical-align: middle;
        font-size: 10px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        font-weight: 700;
        white-space: nowrap;
        transition: max-width 0.28s ease, opacity 0.2s ease, margin-left 0.28s ease;
      }
      .tz-header-btn.tz-hbtn-abierto,
      .tz-header-btn:focus-visible { z-index: 30; }
      .tz-header-btn.tz-hbtn-abierto .tz-header-btn-label,
      .tz-header-btn:focus-visible .tz-header-btn-label { max-width: 220px; opacity: 1; margin-left: 7px; }
      @media (hover: hover) and (pointer: fine) {
        .tz-header-btn:hover { z-index: 30; }
        .tz-header-btn:hover .tz-header-btn-label { max-width: 220px; opacity: 1; margin-left: 7px; }
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
        box-shadow: 0 8px 30px rgba(var(--shadow-rgb),0.5);
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
      .tz-payment-menu-item:hover { background: rgba(var(--cyan-rgb),0.1); }
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
        box-shadow: 0 8px 30px rgba(var(--shadow-rgb),0.5);
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
      .tz-suggest-item:hover { background: rgba(var(--cyan-rgb),0.1); }
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

      /* ---------- ScrollSpySidebar ("navegación estilo Fortnite") ----------
         Visible SIEMPRE, celular incluido — anclada al lateral, nunca
         compite por el ancho horizontal del contenido (es un carril
         angosto fijo de ~30-40px, no una barra que empuje nada), así
         que ocultarla en pantallas chicas no aportaba nada, solo hacía
         que el menú "desapareciera" justo donde más se necesita para
         no perderse en una carta larga.
         'flex + flex-direction:column + align-items:center +
         justify-content:center': con las etiquetas colapsadas (ancho
         0 vía max-width/overflow, ver '.tz-scrollspy-label' abajo),
         'align-items:center' es lo que centra cada punto EXACTO en el
         eje horizontal del carril — sin esto, el contenedor podía
         quedar unos px más ancho que el punto y el punto se veía
         corrido, no centrado matemáticamente. */
      .tz-scrollspy {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 14px;
        position: fixed;
        top: 50%;
        transform: translateY(-50%);
        z-index: 40;
        padding: 16px 12px;
        border-radius: 16px;
        background: rgba(var(--base-rgb), 0.55);
        border: 1px solid var(--border-soft);
        backdrop-filter: blur(6px);
        transition: background 0.2s ease, border-color 0.2s ease, padding 0.2s ease;
      }
      .tz-scrollspy-right { right: 10px; }
      .tz-scrollspy-left { left: 10px; }
      .tz-scrollspy-expanded {
        background: var(--panel-solid);
        border-color: rgba(var(--cyan-rgb),0.3);
        padding: 18px 16px;
        box-shadow: 0 0 30px rgba(var(--cyan-rgb),0.15);
      }
      .tz-scrollspy-item {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        background: transparent;
        border: none;
        padding: 0;
        cursor: pointer;
        color: var(--text-dim);
      }
      .tz-scrollspy-right .tz-scrollspy-item { flex-direction: row-reverse; }
      /* Estética "Limón Neón": el mismo --yellow (y la misma receta de
         glow, 'box-shadow' con su rgba) que ya usan las insignias
         numeradas de subgrupo (ej. '01', '02' — ver '.tz-badge') — un
         punto inactivo es lima tenue, el activo es lima a pleno con
         glow fuerte, nunca cian (eso queda para el resto del chrome). */
      .tz-scrollspy-dot {
        flex-shrink: 0;
        width: 11px;
        height: 11px;
        border-radius: 50%;
        background: rgba(var(--yellow-rgb),0.35);
        box-shadow: 0 0 0 rgba(var(--yellow-rgb),0);
        transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
      }
      .tz-scrollspy-item-active .tz-scrollspy-dot {
        background: var(--yellow);
        box-shadow: 0 0 12px rgba(var(--yellow-rgb),0.9), 0 0 4px rgba(var(--yellow-rgb),0.9);
        transform: scale(1.3);
      }
      /* Los nombres viven SIEMPRE en el DOM (nunca aparecen/
         desaparecen de golpe) — solo se les anima max-width + opacity
         a 0 cuando la barra está colapsada, así el despliegue al
         pasar el mouse se siente fluido, no un "pop". */
      .tz-scrollspy-label {
        max-width: 0;
        opacity: 0;
        overflow: hidden;
        white-space: nowrap;
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        font-size: 14px;
        transition: max-width 0.25s ease, opacity 0.2s ease, color 0.15s ease, text-shadow 0.15s ease;
      }
      .tz-scrollspy-expanded .tz-scrollspy-label { max-width: 180px; opacity: 1; }
      .tz-scrollspy-item-active .tz-scrollspy-label {
        color: var(--yellow);
        text-shadow: 0 0 8px rgba(var(--yellow-rgb),0.55);
      }
      .tz-scrollspy-item:hover .tz-scrollspy-dot { background: rgba(var(--yellow-rgb),0.7); }
      .tz-scrollspy-item-active:hover .tz-scrollspy-dot { background: var(--yellow); }
      /* Hover del NOMBRE (independiente de si es la sección activa):
         se pinta lima con un glow suave, como pedido. */
      .tz-scrollspy-item:hover .tz-scrollspy-label {
        color: var(--yellow);
        text-shadow: 0 0 8px rgba(var(--yellow-rgb),0.5);
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
        background: linear-gradient(180deg, rgba(var(--cyan-rgb),0.06), rgba(var(--base-rgb),0.4));
        border-bottom: 1px solid rgba(var(--cyan-rgb),0.22);
        box-shadow: 0 4px 24px rgba(var(--cyan-rgb),0.08) inset;
      }
      /* La barra pegada a la cabecera se DESVANECE hacia el cuerpo: su
         parte de abajo se vuelve transparente poco a poco (máscara), sin
         línea ni sombra. Tiene más espacio abajo para que solo se
         desvanezca el fondo, no los campos. (Los temáticos repiten esto
         en lib/tematicos.js; la barra de filtros de los modales no.) */
      .tz-header + .tz-admin-filterbar {
        border-bottom: none;
        box-shadow: none;
        padding-bottom: 40px;
        -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 34px), transparent);
        mask-image: linear-gradient(to bottom, #000 calc(100% - 34px), transparent);
      }
      /* Localidad + Sucursal + botón Taxi-PE, agrupados juntos — así
         tz-admin-filterbar (arriba) solo tiene que centrar ESTE bloque
         como un todo, en vez de repartir 3 hijos sueltos. */
      .tz-admin-filter-pareja {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 14px;
        width: 100%;
      }
      .tz-admin-filter-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
        width: 100%;
        max-width: 360px;
      }
      @media (min-width: 768px) {
        .tz-admin-filter-pareja {
          position: relative;
          flex-direction: row;
          align-items: flex-end;
          width: auto;
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
        text-shadow: 0 0 10px rgba(var(--cyan-rgb),0.5);
      }
      .tz-admin-filter-select {
        appearance: none;
        width: 100%;
        box-sizing: border-box;
        background: var(--panel-solid);
        border: 1px solid rgba(var(--cyan-rgb),0.4);
        border-radius: 10px;
        color: var(--text);
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        font-size: 13px;
        padding: 9px 30px 9px 12px;
        cursor: pointer;
        box-shadow: 0 0 14px rgba(var(--cyan-rgb),0.15);
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
        box-shadow: 0 0 20px rgba(var(--cyan-rgb),0.4);
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
        background: rgba(var(--cyan-rgb),0.1);
        border: 1px solid rgba(var(--cyan-rgb),0.4);
        color: var(--cyan);
        cursor: pointer;
        transition: background 0.15s ease, box-shadow 0.15s ease;
      }
      .tz-admin-filter-add-btn:hover {
        background: rgba(var(--cyan-rgb),0.22);
        box-shadow: 0 0 14px rgba(var(--cyan-rgb),0.4);
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
        border: 1px solid rgba(var(--cyan-rgb),0.4);
        color: var(--text);
        background: rgba(var(--cyan-rgb),0.08);
      }
      .tz-admin-filter-tag-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .tz-admin-filter-tag.is-abierta .tz-admin-filter-tag-dot {
        background: var(--green);
        box-shadow: 0 0 8px rgba(var(--green-rgb),0.8);
      }
      .tz-admin-filter-tag.is-cerrada .tz-admin-filter-tag-dot {
        background: var(--danger);
        box-shadow: 0 0 8px rgba(var(--danger-rgb),0.7);
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
        border: 1px dashed rgba(var(--cyan-rgb),0.35);
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
      .tz-cyan { color: var(--cyan); text-shadow: 0 0 14px rgba(var(--cyan-rgb),0.5); }
      .tz-pink { color: var(--pink); text-shadow: 0 0 14px rgba(var(--pink-rgb),0.5); }
      .tz-yellow { color: var(--yellow); text-shadow: 0 0 14px rgba(var(--yellow-rgb),0.5); }
      .tz-green { color: var(--green); text-shadow: 0 0 14px rgba(var(--green-rgb),0.5); }

      .tz-stat-chip-green {
        border-color: rgba(var(--green-rgb),0.35);
        background: linear-gradient(180deg, var(--green-bg), var(--panel));
      }
      .tz-stat-chip-star {
        border-color: rgba(var(--yellow-rgb),0.4);
        background: linear-gradient(180deg, rgba(var(--yellow-rgb),0.10), var(--panel));
      }
      /* Negocio Estrella (super admin) — mismo medidor que el Usuario
         Estrella de Taxi-PE: doble de ancho, selector y carrusel Top 5. */
      .tz-stats > .tz-stat-chip-negocio-estrella { grid-column: span 2; }
      .tz-star-roles { flex-wrap: nowrap; justify-content: space-around; }
      .tz-star-carousel {
        display: flex;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        gap: 4px;
        margin-top: 2px;
        scrollbar-width: none;
      }
      .tz-star-carousel::-webkit-scrollbar { display: none; }
      .tz-star-carousel-item {
        flex: 0 0 100%;
        min-width: 100%;
        scroll-snap-align: center;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 2px 1px;
      }
      .tz-star-carousel-rank {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 22px;
        font-family: 'Orbitron', sans-serif;
        font-weight: 700;
        font-size: 12px;
        color: var(--yellow);
      }
      .tz-star-carousel-info { display: flex; flex-direction: column; min-width: 0; flex: 1 1 auto; }
      .tz-star-carousel-name { font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .tz-vis-reject-btn {
        width: 30px;
        height: 30px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        border: 1px solid rgba(var(--danger-rgb),0.4);
        background: rgba(var(--danger-rgb),0.1);
        color: var(--danger);
        cursor: pointer;
      }
      .tz-vis-reject-btn:hover { background: rgba(var(--danger-rgb),0.22); }
      .tz-vis-reject-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .tz-star-text {
        font-family: 'Orbitron', sans-serif;
        font-size: 15px;
        font-weight: 700;
        color: var(--yellow);
        text-shadow: 0 0 12px rgba(var(--yellow-rgb),0.45);
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
        box-shadow: 0 8px 30px rgba(var(--shadow-rgb),0.5);
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
        background: rgba(var(--cyan-rgb),0.08);
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
        background: rgba(var(--fg-rgb),0.02);
        color: var(--text-dim);
        font-family: 'Orbitron', sans-serif;
        font-size: 11.5px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .tz-tab:hover { border-color: rgba(var(--cyan-rgb),0.4); color: var(--text); }
      .tz-tab-active {
        background: var(--cyan);
        color: var(--on-cyan);
        border-color: var(--cyan);
        box-shadow: 0 0 22px rgba(var(--cyan-rgb),0.45);
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
        background: linear-gradient(115deg, transparent 30%, rgba(var(--fg-rgb),0.7) 50%, transparent 70%);
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

      /* ---------- DIRECTORIO PÚBLICO (Fase 2, "/") ----------
         .tz-main de por sí queda acotado a ~700px desde el breakpoint
         de tablet (pensado para una columna de productos) — acá se
         pisa ese ancho porque hace falta una grilla tipo Friv bien
         ancha. Mobile: rubros arriba en una barra horizontal
         (idéntica a .tz-tabs); desde tablet, el "cuadro fijo a la
         izquierda" pedido — mismo estilo de .tz-tab pero en columna y
         sticky, para que quede a la vista mientras se scrollea la
         grilla. */
      .tz-dir-main {
        max-width: 1400px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .tz-dir-sidebar {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 8px;
      }
      .tz-dir-sidebar-item {
        flex: 1 1 calc(50% - 4px);
        padding: 12px 10px;
        border-radius: 12px;
        border: 1px solid var(--border-soft);
        background: rgba(var(--fg-rgb),0.02);
        color: var(--text-dim);
        font-family: 'Orbitron', sans-serif;
        font-size: 11.5px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.15s ease;
        text-align: center;
      }
      .tz-dir-sidebar-item:hover { border-color: rgba(var(--cyan-rgb),0.4); color: var(--text); }
      .tz-dir-sidebar-item-active {
        background: var(--cyan);
        color: var(--on-cyan);
        border-color: var(--cyan);
        box-shadow: 0 0 22px rgba(var(--cyan-rgb),0.45);
      }
      .tz-dir-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 14px;
      }
      .tz-dir-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 22px 14px;
        border-radius: 16px;
        border: 1px solid var(--border-soft);
        background: rgba(var(--fg-rgb),0.03);
        text-decoration: none;
        transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
      }
      .tz-dir-card:hover {
        transform: translateY(-2px);
        border-color: rgba(var(--cyan-rgb),0.5);
        box-shadow: 0 0 22px rgba(var(--cyan-rgb),0.25);
      }
      .tz-dir-card-logo { width: 72px; height: 72px; object-fit: cover; border-radius: 14px; }
      .tz-dir-card-logo-placeholder {
        width: 72px;
        height: 72px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(var(--fg-rgb),0.05);
        color: var(--text-dim);
      }
      .tz-dir-card-nombre {
        font-family: 'Orbitron', sans-serif;
        font-size: 13px;
        font-weight: 700;
        color: var(--text);
        text-align: center;
      }
      @media (min-width: 768px) {
        .tz-dir-main { flex-direction: row; align-items: flex-start; }
        .tz-dir-sidebar {
          flex-direction: column;
          flex: 0 0 190px;
          position: sticky;
          top: 90px;
        }
        .tz-dir-sidebar-item { flex: none; text-align: left; }
        .tz-dir-grid-wrap { flex: 1 1 auto; min-width: 0; }
        .tz-dir-grid { grid-template-columns: repeat(3, 1fr); }
      }
      @media (min-width: 1024px) {
        .tz-dir-grid { grid-template-columns: repeat(4, 1fr); }
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
        color: var(--on-yellow);
        font-family: 'Orbitron', sans-serif;
        font-weight: 800;
        font-size: 13px;
        padding: 6px 10px;
        border-radius: 8px;
        box-shadow: 0 0 16px rgba(var(--yellow-rgb),0.4);
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
          linear-gradient(135deg, rgba(var(--cyan-rgb),0.55), rgba(var(--pink-rgb),0.5)) border-box;
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
        background: var(--img-bg);
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
          radial-gradient(circle at 20% 25%, rgba(var(--cyan-rgb),0.65) 0%, rgba(var(--cyan-rgb),0.22) 32%, transparent 62%),
          radial-gradient(circle at 80% 30%, rgba(var(--pink-rgb),0.6) 0%, rgba(var(--pink-rgb),0.2) 34%, transparent 64%),
          radial-gradient(circle at 50% 85%, rgba(var(--yellow-rgb),0.5) 0%, rgba(var(--yellow-rgb),0.16) 34%, transparent 64%);
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
          rgba(var(--fg-rgb),0.95) 0%,
          rgba(var(--cyan-rgb),0.65) 22%,
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
        filter: drop-shadow(0 8px 10px rgba(var(--shadow-rgb),0.5));
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
        box-shadow: 0 0 14px rgba(var(--cyan-rgb),0.3);
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
        background: rgba(var(--base-rgb),0.75);
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
        box-shadow: 0 0 0 1.5px var(--cyan), 0 0 26px rgba(var(--cyan-rgb),0.35);
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
          linear-gradient(135deg, rgba(var(--yellow-rgb),0.9), rgba(var(--yellow-rgb),0.35)) border-box;
        box-shadow: 0 0 0 1.5px var(--yellow), 0 0 30px rgba(var(--yellow-rgb),0.4);
      }
      .tz-card-star.tz-card-checked {
        box-shadow: 0 0 0 1.5px var(--yellow), 0 0 8px var(--cyan) inset, 0 0 30px rgba(var(--yellow-rgb),0.45);
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
          linear-gradient(135deg, rgba(255,225,0,0.95), rgba(var(--orange-rgb),0.55)) border-box;
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
          linear-gradient(135deg, rgba(var(--green-rgb),0.95), rgba(var(--cyan-rgb),0.6)) border-box;
        animation: tz-card-reactivated-glow 0.8s ease-in-out 3;
      }
      @keyframes tz-card-reactivated-glow {
        0%, 100% { box-shadow: 0 0 16px rgba(var(--green-rgb),0.5), 0 0 30px rgba(var(--green-rgb),0.2); }
        50% { box-shadow: 0 0 34px rgba(var(--green-rgb),0.95), 0 0 55px rgba(var(--green-rgb),0.5); }
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
         con el checkbox porque los dos "querían" la misma esquina.

         Columna vertical (no fila): en modo admin son 3 controles
         (descuento, editar, checkbox) — en fila le comían tanto ancho a
         tz-card-info (nombre) que, en tarjetas con imagen, el nombre
         terminaba partiéndose letra por letra aunque overflow-wrap ya
         fuera 'break-word'. Apilados, esta columna ocupa el ancho de UN
         solo ícono en vez de tres, y le devuelve ese espacio al nombre. */
      .tz-card-top-actions {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
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
        background: rgba(var(--fg-rgb),0.08);
        color: var(--cyan);
        cursor: pointer;
      }
      .tz-card-edit-price-btn:hover { background: rgba(var(--cyan-rgb),0.2); }
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
        background: rgba(var(--fg-rgb),0.08);
        color: var(--pink);
        cursor: pointer;
      }
      .tz-card-discount-btn:hover { background: rgba(var(--pink-rgb),0.2); }
      .tz-card-discount-btn-active {
        background: rgba(var(--pink-rgb),0.28);
        border-color: var(--pink);
        box-shadow: 0 0 10px rgba(var(--pink-rgb),0.4);
      }
      /* Etiqueta "Estrella": por FUERA de la esquina superior derecha. */
      .tz-star-ribbon {
        position: absolute;
        top: -12px;
        right: -8px;
        z-index: 3;
        display: flex;
        align-items: center;
        gap: 5px;
        background: var(--yellow);
        color: var(--on-yellow);
        font-family: 'Orbitron', sans-serif;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.08em;
        padding: 5px 11px 4px;
        border-radius: 999px;
        box-shadow: 0 0 16px rgba(var(--yellow-rgb),0.55), 0 2px 6px rgba(0,0,0,0.35);
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
      /* Fix Admin Mode Bug: en pantallas MUY angostas, dos botones de
         admin (%, lápiz) + el checkbox no caben al lado del nombre sin
         aplastarlo — por debajo de 640px (el 'sm' de Tailwind), la
         cabecera pasa de fila a columna: el nombre ocupa el ancho
         completo en su propia línea, y las acciones caen debajo,
         alineadas a la derecha. Desde 640px vuelven a compartir fila
         (ver el @media más abajo). */
      .tz-card-top { display: flex; flex-direction: column; gap: 8px; }
      /* flex-basis 0 (no 'auto'): el bloque de nombre+detalle arranca
         en 0 y crece solo hasta el espacio que sobra, en vez de pedir
         su ancho de contenido completo antes de repartir — así nunca
         empuja a tz-card-top-actions (%, lápiz, checkbox) fuera del
         ancho de la tarjeta en pantallas angostas. min-width:0 permite
         que el texto se achique por debajo del "ancho de contenido"
         normal y haga wrap en vez de forzar overflow. */
      .tz-card-info { min-width: 0; flex: 1 1 0%; }
      @media (min-width: 640px) {
        .tz-card-top { flex-direction: row; justify-content: space-between; gap: 10px; }
      }
      @media (max-width: 639px) {
        .tz-card-top-actions { align-self: flex-end; }
      }
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
        /* Fix Admin Mode Bug: 'anywhere' partía nombres cortos letra
           por letra ("Co/m/bo") apenas la tarjeta se apretaba con los
           botones de admin — 'break-word' es la versión "inteligente":
           respeta los espacios entre palabras (wrap normal) y SOLO
           rompe una palabra a la mitad si, aun sola en su propia línea,
           no entra igual (el caso real que 'anywhere' quería cubrir:
           un nombre sin espacios, patológicamente largo). */
        overflow-wrap: break-word;
      }
      .tz-name-plus {
        color: var(--green);
        text-shadow: 0 0 8px rgba(var(--green-rgb),0.6);
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
        border: 1.5px solid rgba(var(--fg-rgb),0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--on-cyan);
      }
      .tz-checkbox-on {
        background: var(--cyan);
        border-color: var(--cyan);
        box-shadow: 0 0 14px rgba(var(--cyan-rgb),0.6);
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
        border-top: 1px dashed rgba(var(--fg-rgb),0.12);
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
      .tz-tag-ok { color: var(--cyan); background: rgba(var(--cyan-rgb),0.12); }
      .tz-tag-warn { color: var(--yellow); background: rgba(var(--yellow-rgb),0.12); }
      .tz-tag-danger { color: var(--danger); background: rgba(var(--danger-rgb),0.14); }

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
        background: rgba(var(--fg-rgb),0.04);
        color: var(--text);
        font-family: 'Rajdhani', sans-serif;
        text-align: left;
        transition: border-color 0.15s, background 0.15s;
      }
      .tz-variant-card-selected {
        border-color: var(--cyan);
        background: rgba(var(--cyan-rgb),0.08);
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
        background: rgba(var(--cyan-rgb),0.12);
        color: var(--cyan);
        cursor: pointer;
      }
      .tz-variant-add-btn:hover:not(:disabled) { background: rgba(var(--cyan-rgb),0.28); }
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
        border: 1px solid rgba(var(--fg-rgb),0.35);
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
        0%, 100% { box-shadow: 0 0 0 0 rgba(var(--danger-rgb),0.55); }
        50% { box-shadow: 0 0 0 4px rgba(var(--danger-rgb),0); }
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
        background: rgba(var(--fg-rgb),0.04);
        color: var(--text);
        font-size: 12.5px;
        font-family: 'Rajdhani', sans-serif;
        cursor: pointer;
      }
      .tz-variant-chip:hover { background: rgba(var(--fg-rgb),0.09); }

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
        box-shadow: 0 0 0 2px rgba(var(--fg-rgb),0.15);
      }
      .tz-color-swatch-custom {
        position: relative;
        overflow: hidden;
        background: rgba(var(--fg-rgb),0.06);
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
        text-shadow: 0 0 16px rgba(var(--pink-rgb),0.5);
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
      .tz-price-discounted { color: var(--green); text-shadow: 0 0 16px rgba(var(--green-rgb),0.5); }
      .tz-discount-badge {
        font-family: 'Orbitron', sans-serif;
        font-size: 10px;
        font-weight: 800;
        color: var(--on-yellow);
        background: var(--green);
        padding: 2px 6px;
        border-radius: 6px;
        box-shadow: 0 0 10px rgba(var(--green-rgb),0.5);
      }
      .tz-discount-badge-inline { margin-left: 6px; vertical-align: middle; }

      .tz-qty-stepper {
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(var(--fg-rgb),0.04);
        border: 1px solid var(--border-soft);
        border-radius: 999px;
        padding: 4px 10px;
      }
      .tz-qty-stepper button {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: none;
        background: rgba(var(--fg-rgb),0.08);
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
        background: rgba(var(--fg-rgb),0.04);
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
        background: rgba(var(--fg-rgb),0.02);
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
        border-color: rgba(var(--danger-rgb),0.35);
        color: var(--danger);
      }
      .tz-usuario-delete-btn:hover { background: rgba(var(--danger-rgb),0.12); }
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
        background: rgba(var(--surface-rgb), 0.94);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(var(--cyan-rgb),0.25);
        border-left: none;
        border-right: none;
        border-bottom: none;
        border-radius: 0;
        padding: 14px 12px calc(14px + env(safe-area-inset-bottom, 0px));
        box-shadow: 0 -8px 30px rgba(var(--shadow-rgb),0.4);
        /* Slide de entrada/salida: SIEMPRE montada mientras dura la
           animación (ver 'barMounted' en App.jsx) — nunca aparece/
           desaparece de un salto, un translateY largo y ease-in-out
           en las dos direcciones. */
        transition: transform 0.5s ease-in-out;
      }
      .tz-submitbar-visible { transform: translateY(0); }
      .tz-submitbar-hidden { transform: translateY(120%); }

      /* ---- Botón flotante "ir al pie de página" (solo interfaz de
         negocio, admin/cajero) — oculto hasta que se scrollea hacia
         abajo, entra con un slide-up + fade desde el borde inferior. ---- */
      .tz-scrolltop-fab {
        position: fixed;
        right: 18px;
        bottom: calc(20px + env(safe-area-inset-bottom, 0px));
        z-index: 50;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(var(--base-rgb), 0.9);
        border: 1.5px solid var(--cyan);
        color: var(--cyan);
        box-shadow: 0 0 18px rgba(var(--cyan-rgb),0.55), 0 0 4px rgba(var(--cyan-rgb),0.8);
        cursor: pointer;
        opacity: 0;
        transform: translateY(140%);
        pointer-events: none;
        transition: transform 0.3s ease, opacity 0.3s ease, bottom 0.2s ease;
      }
      .tz-scrolltop-fab-visible { opacity: 1; transform: translateY(0); pointer-events: auto; }
      .tz-scrolltop-fab:hover { background: rgba(var(--cyan-rgb),0.15); }
      /* Con el carrito/resumen de venta abierto (.tz-submitbar, fixed
         al piso) el botón se levanta para no quedar tapado por ella. */
      .tz-scrolltop-fab-raised { bottom: 100px; }

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
        border: 1px solid rgba(var(--cyan-rgb),0.25);
        border-bottom: none;
        border-radius: 10px 10px 0 0;
        background: rgba(var(--surface-rgb), 0.94);
        color: var(--text-dim);
        cursor: pointer;
      }
      .tz-submitbar-collapse:hover { color: var(--text); background: rgba(var(--surface-rgb),0.98); }
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
        background: rgba(var(--fg-rgb),0.03);
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
        border: 1px solid rgba(var(--danger-rgb),0.35);
        background: rgba(var(--danger-rgb),0.12);
        color: var(--danger);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
      .tz-cart-remove-btn:hover { background: rgba(var(--danger-rgb),0.22); }

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
        color: var(--on-yellow);
        background: var(--yellow);
        border: none;
        border-radius: 12px;
        padding: 14px 26px;
        cursor: pointer;
        box-shadow: 0 0 24px rgba(var(--yellow-rgb),0.4);
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
        border: 1px dashed rgba(var(--fg-rgb),0.15);
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
        background: rgba(var(--fg-rgb),0.04);
        color: var(--text);
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        font-size: 13px;
        cursor: pointer;
      }
      .tz-history-toggle-btn:hover { background: rgba(var(--fg-rgb),0.09); }
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
        background: rgba(var(--fg-rgb),0.03);
        padding: 12px 14px;
        border-bottom: 1px solid var(--border-soft);
      }
      .tz-table tbody td {
        padding: 12px 14px;
        border-bottom: 1px solid rgba(var(--fg-rgb),0.05);
        font-weight: 600;
      }
      .tz-table tbody tr:hover { background: rgba(var(--cyan-rgb),0.04); }
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
        box-shadow: 0 0 8px rgba(var(--danger-rgb),0.7);
        animation: tz-footer-badge-pulse 1.4s ease-in-out infinite;
      }
      @keyframes tz-footer-badge-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.15); }
      }
      .tz-footer-btn-cierre {
        background: var(--danger);
        color: var(--on-danger);
        box-shadow: 0 0 20px rgba(var(--danger-rgb),0.4);
      }
      .tz-footer-btn-gastos {
        background: var(--orange);
        color: #241200;
        box-shadow: 0 0 20px rgba(var(--orange-rgb),0.4);
      }
      .tz-footer-btn-stock {
        background: var(--yellow);
        color: var(--on-yellow);
        box-shadow: 0 0 20px rgba(var(--yellow-rgb),0.4);
      }
      .tz-footer-btn-misventas {
        background: var(--cyan);
        color: var(--on-cyan);
        box-shadow: 0 0 20px rgba(var(--cyan-rgb),0.4);
      }
      .tz-footer-btn-productos {
        background: #2e1065;
        color: var(--text);
        border: 1.5px solid var(--yape);
        box-shadow: 0 0 20px rgba(182,33,255,0.5);
      }
      .tz-footer-btn-localidades {
        background: var(--pink);
        color: #2b0018;
        box-shadow: 0 0 20px rgba(var(--pink-rgb),0.5);
      }

      /* ---------- MODAL ---------- */
      .tz-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 60;
        background: rgba(var(--base-deep-rgb), 0.75);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px;
      }
      /* Bloqueo Global de Modales: clic afuera YA NO cierra ningún
         modal en toda la app (los backdrops dejaron de llevar onClick)
         — la única salida es el botón "X". Este modificador es para
         modales que se abren DESDE ADENTRO de otro ya abierto
         (BarcodeScannerModal, ImageCropModal, PesoModal — escanear o
         recortar una foto sin salir del formulario que los abrió): un
         z-index más alto que el estándar (60) los garantiza siempre
         por ENCIMA del modal que los contiene, sin depender de que el
         orden del DOM alcance por sí solo. */
      .tz-modal-backdrop-nested { z-index: 70; }
      .tz-modal {
        position: relative;
        width: 100%;
        max-width: 460px;
        max-height: 90vh;
        overflow-y: auto;
        background: var(--panel-solid);
        border: 1px solid rgba(var(--cyan-rgb),0.25);
        border-radius: 18px;
        padding: 26px 18px 20px;
        box-shadow: 0 0 50px rgba(var(--cyan-rgb),0.15);
        /* Firefox */
        scrollbar-width: thin;
        scrollbar-color: rgba(var(--cyan-rgb),0.35) transparent;
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
        text-shadow: 0 0 10px rgba(var(--cyan-rgb),0.4);
      }
      .tz-gc-sucursal {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-left: 6px;
        border-left: 2px solid rgba(var(--cyan-rgb),0.2);
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
        border: 1px solid rgba(var(--fg-rgb),0.15);
        color: var(--text-dim);
        cursor: pointer;
      }
      .tz-gc-sucursal-edit-btn:hover { color: var(--cyan); border-color: var(--cyan); }
      .tz-gc-sucursal-delete-btn:hover { color: var(--danger); border-color: var(--danger); }
      .tz-gc-sucursal-rename {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .tz-gc-sucursal-rename .tz-text-input { flex: 1 1 auto; min-width: 0; padding: 6px 10px; font-size: 13px; }
      /* Coordenadas de sucursal (punto A del delivery) */
      .tz-gc-sucursal-title { flex-wrap: wrap; }
      .tz-gc-coords-set { color: var(--green, var(--green)) !important; border-color: rgba(var(--green-rgb),0.5) !important; }
      .tz-gc-coords-edit { display: inline-flex; align-items: center; gap: 5px; }
      .tz-gc-coords-input { width: 170px; padding: 5px 9px; font-size: 12px; }

      /* ---- Gestor de Localidades (botón rosa del pie de página) ---- */
      .tz-gl-list { display: flex; flex-direction: column; gap: 10px; }
      .tz-gl-localidad {
        border: 1px solid var(--border-soft);
        border-radius: 10px;
        background: rgba(var(--fg-rgb),0.02);
        padding: 10px 12px;
      }
      .tz-gl-localidad-head { display: flex; align-items: center; gap: 6px; }
      .tz-gl-localidad-toggle {
        flex: 1 1 auto;
        display: flex;
        align-items: center;
        gap: 6px;
        background: transparent;
        border: none;
        color: var(--text);
        font-family: 'Orbitron', sans-serif;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        padding: 4px 0;
        text-align: left;
      }
      .tz-gl-localidad-count { color: var(--text-dim); font-weight: 500; font-size: 12px; }
      .tz-gl-confirm { margin-top: 8px; }
      .tz-gl-sucursales {
        margin: 10px 0 0 22px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .tz-gl-sucursal-row {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 8px;
        border: 1px solid var(--border-soft);
        border-radius: 8px;
        background: rgba(var(--fg-rgb),0.015);
      }
      .tz-gl-sucursal-icon { color: var(--pink); flex-shrink: 0; }
      .tz-gl-sucursal-nombre { flex: 1 1 auto; font-size: 13px; color: var(--text); }
      .tz-gl-add-sucursal-btn { margin-top: 2px; font-size: 12px; padding: 7px; }
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
        box-shadow: 0 0 8px rgba(var(--green-rgb),0.3);
      }
      .tz-gc-caja-estado.is-cerrada {
        color: var(--danger);
        background: rgba(var(--danger-rgb),0.12);
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
        color: var(--on-danger);
        box-shadow: 0 0 14px rgba(var(--danger-rgb),0.35);
      }
      .tz-gc-btn-abrir {
        background: var(--green);
        color: #06190f;
        box-shadow: 0 0 14px rgba(var(--green-rgb),0.35);
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
        border: 1px solid rgba(var(--green-rgb),0.4);
        border-radius: 10px;
        background: rgba(var(--green-rgb),0.1);
        color: var(--green);
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        font-size: 13px;
        padding: 8px 14px;
        cursor: pointer;
      }
      .tz-pm-export-btn:hover { background: rgba(var(--green-rgb),0.2); }
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
        border-bottom: 1px solid rgba(var(--fg-rgb),0.05);
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
        background: rgba(var(--orange-rgb),0.12);
        border: 1px solid rgba(var(--orange-rgb),0.4);
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
      .tz-pm-dot-green { background: var(--green); box-shadow: 0 0 6px rgba(var(--green-rgb),0.8); }
      .tz-pm-dot-red { background: var(--danger); box-shadow: 0 0 6px rgba(var(--danger-rgb),0.6); }
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
        border: 1px solid rgba(var(--green-rgb),0.4);
        background: rgba(var(--green-rgb),0.08);
        color: var(--green);
        cursor: pointer;
      }
      .tz-pm-save-btn:hover { background: rgba(var(--green-rgb),0.18); }
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
        background: rgba(var(--cyan-rgb),0.3);
        border-radius: 8px;
      }
      .tz-modal::-webkit-scrollbar-thumb:hover { background: rgba(var(--cyan-rgb),0.5); }

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
        background: rgba(var(--fg-rgb),0.08);
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
        background: rgba(var(--fg-rgb),0.04);
        color: var(--text-dim);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }

      /* Pantalla de éxito (registro, entrega confirmada) — idéntico a
         taxi-pe-app. */
      .tz-qr-confirmado {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 30px 10px;
        text-align: center;
      }
      .tz-qr-confirmado-icono {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--green-bg);
        color: var(--green);
        box-shadow: 0 0 24px rgba(var(--green-rgb),0.5);
      }
      .tz-qr-confirmado h3 { margin: 0; color: var(--green); font-family: 'Orbitron', sans-serif; font-size: 16px; }

      /* Aviso de cuenta eliminada — marco rojo con glow pulsante,
         mismo lenguaje visual "neón" del resto de la app pero en rojo
         de alerta en vez de cyan/verde/rosa. */
      .tz-cuenta-eliminada-modal {
        border: 2px solid var(--danger);
        animation: tz-cuenta-eliminada-glow 2s ease-in-out infinite;
      }
      @keyframes tz-cuenta-eliminada-glow {
        0%, 100% { box-shadow: 0 0 18px rgba(var(--danger-rgb),0.5), 0 0 36px rgba(var(--danger-rgb),0.25); }
        50% { box-shadow: 0 0 30px rgba(var(--danger-rgb),0.75), 0 0 56px rgba(var(--danger-rgb),0.4); }
      }
      .tz-cuenta-eliminada-icono {
        width: 64px;
        height: 64px;
        margin: 0 auto;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(var(--danger-rgb),0.12);
        border: 1px solid var(--danger);
        color: var(--danger);
        box-shadow: 0 0 20px rgba(var(--danger-rgb),0.6);
      }
      .tz-cuenta-eliminada-salir-btn {
        background: var(--danger);
        border-color: var(--danger);
        color: var(--on-green);
      }

      /* Botón "ir a Taxi-PE" — sin recuadro (pedido explícito): solo el
         logo, que hace zoom in al pasar el cursor. Vive en su propia
         columna de tz-filtrobar-grid (ver más abajo), no ya pegado ni
         encimado a la pareja de filtros. */
      .tz-admin-filter-taxipe-btn {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 87px;
        height: 62px;
        cursor: pointer;
        padding: 0;
      }
      .tz-admin-filter-taxipe-btn img {
        width: 100px;
        height: 100px;
        object-fit: contain;
        transition: transform 0.2s ease;
      }
      .tz-admin-filter-taxipe-btn:hover img {
        transform: scale(1.15);
      }

      /* Barra de filtros del catálogo público: grid de 3 columnas para
         que Taxi-PE / filtros / saldo queden simétricos en cualquier
         ancho de ventana SIN pixeles puestos a mano — reemplaza una
         pila de position:absolute + valores fijos por breakpoint que
         se desordenaba con cualquier cambio de contenido. En mobile
         (<768px) los filtros ocupan la fila de arriba, completa;
         Taxi-PE y el saldo comparten la fila de abajo, cada uno
         centrado en su mitad. Desde 768px pasan a vivir en columnas
         laterales fijas (1fr auto 1fr), con los filtros perfectamente
         centrados en el medio — igual que en la interfaz de admin,
         que no tiene estos dos elementos compitiendo por el centro. */
      .tz-filtrobar-grid {
        display: grid;
        width: 100%;
        grid-template-columns: 1fr 1fr;
        grid-template-areas: "filtros filtros" "left right";
        align-items: center;
        /* En celular Taxi-PE y el saldo quedan uno al lado del otro en la
           fila de abajo: 40px de aire entre ambos para que no se vean
           pegados. En escritorio van a los costados de los filtros. */
        row-gap: 12px;
        column-gap: 40px;
      }
      .tz-filtrobar-side { display: flex; align-items: center; height: 100%; }
      .tz-filtrobar-side-left { grid-area: left; justify-content: flex-end; }
      .tz-filtrobar-side-right { grid-area: right; justify-content: flex-start; }
      .tz-filtrobar-grid .tz-admin-filter-pareja { grid-area: filtros; justify-self: center; }
      @media (min-width: 768px) {
        .tz-filtrobar-grid {
          grid-template-columns: 1fr auto 1fr;
          grid-template-areas: "left filtros right";
          column-gap: 12px;
        }
        .tz-filtrobar-side-left { justify-content: center; }
        .tz-filtrobar-side-right { justify-content: center; }
      }
      /* La etiqueta de estado (En línea/Cerrado) sale del flujo y se
         cuelga al costado derecho del select: así el grupo de Sucursal
         mide SOLO lo que mide su select, y el texto "SUCURSAL" queda
         centrado sobre el filtro y no sobre filtro+etiqueta. Solo desde
         768px: en mobile el grupo ocupa todo el ancho y no hay "costado"
         donde colgarla. */
      @media (min-width: 768px) {
        .tz-filtro-sucursal-group .tz-admin-filter-row { position: relative; }
        .tz-filtro-sucursal-group .tz-filtro-estado-tag {
          position: absolute;
          left: calc(100% + 8px);
          top: 50%;
          transform: translateY(-50%);
        }
      }
      .tz-filtrobar-saldo .tz-stat-chip { min-width: 80px; padding: 6px 7px; gap: 2px; }
      .tz-filtrobar-saldo .tz-stat-label { font-size: 10px; gap: 3px; }
      .tz-filtrobar-saldo .tz-stat-value { font-size: 15px; }

      @media (min-width: 1024px) {
        /* Mismo ajuste fino de siempre, PARA EL PANEL ADMIN — clases propias
           (no las de arriba) para que mover esto no mueva también la
           tienda pública ya aprobada. Arrancan en los mismos valores
           que compartían antes de separarlas; ajustar libremente. */
        .tz-admin-filtro-localidad-group { position: relative; top: -5px; left: 90px; }
        .tz-admin-filtro-localidad-label { position: relative; top: 0px; left: 4px; }
        .tz-admin-filtro-sucursal-group { position: relative; top: -5px; left: 100px; }
        .tz-admin-filtro-sucursal-label { position: relative; top: 0px; left: -45px; }
        .tz-admin-filtro-estado-tag { position: relative; top:-5px; left: 100px; }
      }

      /* Efecto de serpentinas (Confetti.jsx) — piezas con
         'var(--tz-confetti-rotate)'/'var(--tz-confetti-drift)' puestos
         inline por pieza — 'forwards' la deja invisible al terminar sin
         que haga falta desmontar el componente en el momento exacto.
         Idéntico a taxi-pe-app. */
      .tz-confetti-wrap {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 4000;
        overflow: hidden;
      }
      .tz-confetti-piece {
        position: absolute;
        top: -12px;
        width: 9px;
        height: 14px;
        border-radius: 2px;
        opacity: 0;
        animation-name: tz-confetti-fall;
        animation-timing-function: ease-in;
        animation-fill-mode: forwards;
      }
      @keyframes tz-confetti-fall {
        0% { opacity: 1; transform: translate(0, 0) rotate(0deg); }
        100% {
          opacity: 0.9;
          transform: translate(var(--tz-confetti-drift, 0px), 100vh) rotate(var(--tz-confetti-rotate, 180deg));
        }
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
        background: rgba(var(--cyan-rgb),0.1);
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
        background: rgba(var(--fg-rgb),0.05);
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
        color: var(--on-cyan);
        border: none;
        border-radius: 10px;
        padding: 12px;
        font-family: 'Orbitron', sans-serif;
        font-weight: 800;
        font-size: 12.5px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        cursor: pointer;
        box-shadow: 0 0 20px rgba(var(--cyan-rgb),0.35);
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
        box-shadow: 0 0 20px rgba(var(--danger-rgb),0.4);
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
        background: rgba(var(--fg-rgb),0.03);
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
        background: rgba(var(--cyan-rgb),0.1);
        border: 1px solid rgba(var(--cyan-rgb),0.3);
        border-radius: 6px;
        padding: 1px 7px;
      }
      .tz-stock-row-input {
        display: flex;
        align-items: center;
        gap: 4px;
        background: rgba(var(--fg-rgb),0.05);
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
        background: rgba(var(--fg-rgb),0.03);
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
        background: rgba(var(--fg-rgb),0.05);
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
        /* SIN 'overflow: hidden' a propósito: ninguno de los hijos
           (header, accordion-inner, subgrupos/productos) tiene fondo a
           sangrado que necesite recorte para respetar las esquinas
           redondeadas — pero el glow neón (box-shadow) de una fila/
           subgrupo/tarjeta arrastrándose SÍ necesita salirse de este
           bounding box para no verse "guillotinado" (bug reportado con
           image_e92421.jpg). */
        background: rgba(var(--fg-rgb),0.02);
        transition: border-color 0.12s, box-shadow 0.12s, opacity 0.12s;
      }
      /* DnD Multinivel (Categoría/Subgrupo/Producto) sobre @dnd-kit/core:
         el handle (GripVertical) es el único elemento con los
         listeners de arrastre (touch-action:none es obligatorio para
         que el PointerSensor funcione bien en touch); el resto de la
         fila/tarjeta es el droppable, para que soltar en cualquier
         parte de ella cuente. */
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
        box-shadow: 0 0 0 1.5px var(--cyan), 0 0 16px rgba(var(--cyan-rgb),0.35);
      }
      /* Slot genérico de subgrupo/producto (SubgrupoSection/ProductoRow):
         mismo lenguaje visual que '.tz-vis-category-drag-over' de
         arriba, a una escala más chica. */
      .tz-vis-dnd-slot { border-radius: 10px; transition: box-shadow 0.12s, opacity 0.12s; }
      .tz-vis-dnd-slot-over {
        box-shadow: 0 0 0 1.5px var(--cyan), 0 0 14px rgba(var(--cyan-rgb),0.35);
      }
      .tz-vis-dnd-dragging { opacity: 0.4; }
      .tz-vis-subsection.tz-vis-dnd-slot-over,
      .tz-vis-subsection.tz-vis-dnd-dragging {
        border-radius: 10px;
        transition: box-shadow 0.12s, opacity 0.12s;
      }
      /* Feedback de carga al SOLTAR: mientras la mutación async hacia
         Supabase (moverProducto/moverSubgrupo/reorderCategorias) está en
         vuelo, la fila/tarjeta que se soltó (y SOLO esa — 'movingId' se
         compara contra el id propio de cada ítem) pulsa en neón cian y
         su grip cambia por un spinner, para que el drop nunca se sienta
         "seco" mientras se espera la confirmación de la base. */
      .tz-vis-dnd-saving { animation: tz-vis-saving-pulse 1.1s ease-in-out infinite; }
      @keyframes tz-vis-saving-pulse {
        0%, 100% { box-shadow: 0 0 0 1px rgba(var(--cyan-rgb),0.25), 0 0 6px rgba(var(--cyan-rgb),0.2); }
        50% { box-shadow: 0 0 0 1.5px rgba(var(--cyan-rgb),0.65), 0 0 18px rgba(var(--cyan-rgb),0.55); }
      }
      /* Bloqueo de Categoría (Combos): reemplaza el glow cian de
         "aceptado" por uno rojo — un producto que no es ya de Combos
         nunca puede soltarse acá como ítem individual (cabecera de
         categoría/subgrupo, o encima de otro producto), solo vía la
         Zona de Crafteo. */
      .tz-vis-category.tz-vis-drag-forbidden {
        border-color: var(--danger);
        box-shadow: 0 0 0 1.5px var(--danger), 0 0 16px rgba(var(--danger-rgb),0.4);
      }
      .tz-vis-dnd-slot.tz-vis-drag-forbidden,
      .tz-vis-subsection.tz-vis-drag-forbidden {
        box-shadow: 0 0 0 1.5px var(--danger), 0 0 14px rgba(var(--danger-rgb),0.4);
      }
      /* "Fantasma" que sigue al cursor durante el arrastre (DragOverlay
         de dnd-kit) — un chip compacto, nunca el tamaño real de la
         fila/tarjeta (sería ruidoso arrastrando algo tan angosto como
         el acordeón). */
      .tz-vis-drag-ghost {
        /* dnd-kit hace 'portal' del DragOverlay directo a document.body,
           así que escapa de cualquier 'overflow: hidden' del modal — pero
           NO gana automáticamente el apilamiento (z-index) contra otros
           elementos con su propio stacking context (ej. el backdrop del
           modal en z-index:60). Sin 'position' + 'z-index' explícitos acá,
           la tarjeta arrastrada podía quedar recortada/detrás del modal. */
        position: fixed;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        border-radius: 999px;
        background: var(--panel-solid);
        border: 1px solid var(--cyan);
        box-shadow: 0 0 24px rgba(var(--cyan-rgb),0.5);
        color: var(--text);
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        font-size: 13px;
        white-space: nowrap;
        cursor: grabbing;
        pointer-events: none;
      }
      .tz-vis-drag-ghost-category { border-color: var(--yellow); box-shadow: 0 0 24px rgba(var(--yellow-rgb),0.5); }
      .tz-vis-drag-ghost-subgroup { border-color: var(--pink); box-shadow: 0 0 24px rgba(var(--pink-rgb),0.5); }

      /* ---- Mecánica de "Crafteo"/Fusión de Combos ---- */
      .tz-combo-craft-zone {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 56px;
        margin-bottom: 10px;
        padding: 12px;
        border-radius: 12px;
        border: 1.5px dashed rgba(var(--yellow-rgb),0.4);
        background: rgba(var(--yellow-rgb),0.04);
        transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
      }
      .tz-combo-craft-zone-over {
        border-color: var(--yellow);
        border-style: solid;
        box-shadow: 0 0 22px rgba(var(--yellow-rgb),0.45);
        background: rgba(var(--yellow-rgb),0.1);
      }
      .tz-combo-craft-zone-empty {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        color: var(--yellow);
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        font-size: 12.5px;
        text-align: center;
      }
      .tz-combo-craft-zone-staged { border-style: solid; border-color: rgba(var(--yellow-rgb),0.6); }
      /* Paso 2 del crafteo (ANTES de soltar): con un producto YA
         staged, un SEGUNDO producto arrastrado exactamente encima de
         la Zona de Crafteo dispara este pulso doble (amarillo + rosa,
         los mismos colores del overlay de fusión post-drop) — la
         fusión "se siente venir" mientras se arrastra, no recién al
         soltar. Ver 'tz-vis-drag-ghost-fusing' para el mismo pulso en
         el fantasma que sigue al cursor. */
      @keyframes tz-combo-fusing-pulse {
        0%, 100% { box-shadow: 0 0 14px rgba(var(--yellow-rgb),0.4), 0 0 8px rgba(var(--pink-rgb),0.25); }
        50% { box-shadow: 0 0 30px rgba(var(--yellow-rgb),0.85), 0 0 22px rgba(var(--pink-rgb),0.65); }
      }
      .tz-combo-craft-zone-fusing-preview {
        border-color: var(--pink);
        animation: tz-combo-fusing-pulse 0.9s ease-in-out infinite;
      }
      .tz-combo-staged-card-fusing .tz-combo-staged-name { color: var(--pink); }
      .tz-vis-drag-ghost-fusing {
        border-color: var(--pink);
        animation: tz-combo-fusing-pulse 0.9s ease-in-out infinite;
      }
      .tz-combo-staged-card {
        position: relative;
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 6px 34px 6px 10px;
        color: var(--yellow);
        font-family: 'Rajdhani', sans-serif;
      }
      .tz-combo-staged-name { font-weight: 800; font-size: 13px; color: var(--text); }
      .tz-combo-staged-hint {
        font-size: 11px;
        color: var(--text-dim);
        margin-left: auto;
        text-align: right;
      }
      .tz-combo-staged-discard {
        position: absolute;
        top: 50%;
        right: 4px;
        transform: translateY(-50%);
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        border: 1px solid rgba(var(--danger-rgb),0.4);
        background: rgba(var(--danger-rgb),0.1);
        color: var(--danger);
        cursor: pointer;
      }
      .tz-combo-staged-discard:hover { background: rgba(var(--danger-rgb),0.22); }

      /* Overlay de fusión: dos tarjetas + 2 curvas SVG neón fluyendo
         entre ellas, superpuesto a TODA la pantalla (decorativo, nunca
         intercepta clics) durante la breve transición antes de abrir
         "Nuevo Combo" ya precargado. */
      .tz-combo-fusion-overlay {
        position: fixed;
        inset: 0;
        z-index: 80;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0;
        pointer-events: none;
        background: rgba(var(--base-deep-rgb), 0.55);
        backdrop-filter: blur(3px);
        animation: tz-combo-fusion-fade 0.65s ease-in-out;
      }
      .tz-combo-fusion-card {
        flex: 0 0 auto;
        max-width: 150px;
        padding: 14px 16px;
        border-radius: 14px;
        background: var(--panel-solid);
        border: 1.5px solid var(--yellow);
        box-shadow: 0 0 30px rgba(var(--yellow-rgb),0.6);
        color: var(--text);
        font-family: 'Rajdhani', sans-serif;
        font-weight: 800;
        font-size: 13px;
        text-align: center;
        overflow-wrap: anywhere;
      }
      .tz-combo-fusion-card-a { animation: tz-combo-fusion-in-left 0.5s ease-out; }
      .tz-combo-fusion-card-b { animation: tz-combo-fusion-in-right 0.5s ease-out; }
      .tz-combo-fusion-svg {
        width: min(45vw, 320px);
        height: 130px;
        flex: 0 0 auto;
        margin: 0 -20px;
        overflow: visible;
      }
      .tz-combo-fusion-path {
        fill: none;
        stroke: var(--yellow);
        stroke-width: 3;
        stroke-linecap: round;
        filter: drop-shadow(0 0 8px rgba(var(--yellow-rgb),0.9)) drop-shadow(0 0 16px rgba(var(--pink-rgb),0.6));
        stroke-dasharray: 24 14;
        animation: tz-combo-fusion-flow 0.7s linear infinite;
      }
      .tz-combo-fusion-path-2 { stroke: var(--pink); animation-direction: reverse; }
      .tz-combo-fusion-label {
        position: absolute;
        bottom: 20%;
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--yellow);
        font-family: 'Orbitron', sans-serif;
        font-size: 13px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        text-shadow: 0 0 12px rgba(var(--yellow-rgb),0.7);
        animation: tz-combo-fusion-fade 0.65s ease-in-out;
      }
      @keyframes tz-combo-fusion-flow {
        from { stroke-dashoffset: 76; }
        to { stroke-dashoffset: 0; }
      }
      @keyframes tz-combo-fusion-in-left {
        from { transform: translateX(40px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes tz-combo-fusion-in-right {
        from { transform: translateX(-40px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes tz-combo-fusion-fade {
        0%, 100% { opacity: 0; }
        15%, 85% { opacity: 1; }
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
        border: 1px solid rgba(var(--cyan-rgb),0.35);
        background: rgba(var(--cyan-rgb),0.08);
        color: var(--cyan);
        cursor: pointer;
      }
      .tz-vis-edit-btn:hover { background: rgba(var(--cyan-rgb),0.18); }
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
        border: 1px solid rgba(var(--danger-rgb),0.35);
        background: rgba(var(--danger-rgb),0.08);
        color: var(--danger);
        cursor: pointer;
      }
      .tz-vis-delete-btn:hover { background: rgba(var(--danger-rgb),0.18); }
      .tz-vis-confirm-delete {
        border: 1px solid rgba(var(--danger-rgb),0.35);
        background: rgba(var(--danger-rgb),0.06);
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
        background: rgba(var(--fg-rgb),0.12);
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
        background: rgba(var(--green-rgb),0.25);
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
        color: var(--on-yellow);
        border: none;
        border-radius: 10px;
        padding: 13px;
        font-family: 'Orbitron', sans-serif;
        font-weight: 800;
        font-size: 12.5px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        cursor: pointer;
        box-shadow: 0 0 20px rgba(var(--yellow-rgb),0.35);
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
        background: linear-gradient(135deg, rgba(var(--pink-rgb),0.9), rgba(var(--cyan-rgb),0.75));
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
        box-shadow: 0 0 20px rgba(var(--pink-rgb),0.35);
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
        background: rgba(var(--fg-rgb),0.04);
        color: var(--text);
        font-family: 'Rajdhani', sans-serif;
        font-size: 13.5px;
        cursor: pointer;
      }
      .tz-combo-search-result:hover { background: rgba(var(--cyan-rgb),0.12); }
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
        background: rgba(var(--fg-rgb),0.03);
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
        background: rgba(var(--fg-rgb),0.06);
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
        border: 1px solid rgba(var(--danger-rgb),0.35);
        background: rgba(var(--danger-rgb),0.1);
        color: var(--danger);
        cursor: pointer;
      }
      .tz-combo-item-remove:hover { background: rgba(var(--danger-rgb),0.22); }

      /* ---------- Modal: Gestión de Imagen (solo admin) ---------- */
      .tz-image-manager-preview {
        width: 100%;
        height: 160px;
        border-radius: 14px;
        overflow: hidden;
        background: rgba(var(--fg-rgb),0.04);
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
        background: rgba(var(--fg-rgb),0.04);
        border: 1px solid var(--border-soft);
      }
      .tz-switch {
        flex-shrink: 0;
        position: relative;
        width: 42px;
        height: 24px;
        border-radius: 999px;
        border: 1px solid var(--border-soft);
        background: rgba(var(--fg-rgb),0.08);
        cursor: pointer;
        transition: background 0.15s ease, border-color 0.15s ease;
      }
      .tz-switch-on {
        background: var(--cyan);
        border-color: var(--cyan);
        box-shadow: 0 0 12px rgba(var(--cyan-rgb),0.4);
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
        background: rgba(var(--fg-rgb),0.06);
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
        background: rgba(var(--cyan-rgb),0.08);
        color: var(--cyan);
        font-family: 'Orbitron', sans-serif;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
      }
      .tz-cart-peso-edit-btn:hover { background: rgba(var(--cyan-rgb),0.18); }
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
        background: rgba(var(--fg-rgb),0.05);
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
        background: rgba(var(--fg-rgb),0.05);
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
        background: rgba(var(--fg-rgb),0.03);
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
        background: rgba(var(--fg-rgb),0.03);
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
        border: 1px solid rgba(var(--green-rgb),0.4);
        color: var(--green);
      }
      .tz-toast-rechazado {
        background: rgba(var(--danger-rgb),0.12);
        border: 1px solid rgba(var(--danger-rgb),0.4);
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
        /* text-shadow en vez de filter:drop-shadow — con
           background-clip:text, drop-shadow recorta el glow al
           bounding-box del texto en varios navegadores (bug de diseño
           reportado: "cortes en los bordes"). text-shadow no lo sufre. */
        text-shadow: 0 0 18px rgba(var(--cyan-rgb),0.35);
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
        background: rgba(var(--fg-rgb),0.05);
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
      .tz-cliente-action-deuda { border-color: rgba(var(--danger-rgb),0.4); color: var(--danger); }
      .tz-cliente-action-deuda:hover { background: rgba(var(--danger-rgb),0.12); }
      .tz-cliente-action-pago { border-color: rgba(var(--green-rgb),0.4); color: var(--green); }
      .tz-cliente-action-pago:hover { background: rgba(var(--green-rgb),0.12); }
      .tz-cliente-action-whatsapp { border-color: rgba(37,211,102,0.5); color: #25d366; }
      .tz-cliente-action-whatsapp:hover { background: rgba(37,211,102,0.14); }
      .tz-cliente-action-delete { border-color: rgba(var(--danger-rgb),0.5); color: var(--danger); }
      .tz-cliente-action-delete:hover { background: rgba(var(--danger-rgb),0.14); }

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
        background: rgba(var(--fg-rgb),0.03);
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
        background: rgba(var(--orange-rgb),0.12);
      }
      .tz-gasto-tipo-btn:disabled { opacity: 0.4; cursor: not-allowed; }

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
        border: 1px solid rgba(var(--danger-rgb),0.35);
        background: rgba(var(--danger-rgb),0.08);
        color: var(--danger);
        cursor: pointer;
      }
      .tz-gasto-item-remove:hover { background: rgba(var(--danger-rgb),0.18); }
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
      .tz-gasto-add-item:hover { color: var(--text); border-color: rgba(var(--cyan-rgb),0.35); }

      .tz-gasto-total-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        border-radius: 10px;
        background: rgba(var(--orange-rgb),0.08);
        border: 1px solid rgba(var(--orange-rgb),0.3);
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
        background: linear-gradient(180deg, rgba(var(--danger-rgb),0.06), transparent 60%),
          var(--panel-solid);
        border: 1px solid rgba(var(--danger-rgb),0.35);
        border-radius: 12px;
        padding: 14px 16px;
        box-shadow: 0 0 22px rgba(var(--danger-rgb),0.18);
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
        border-top: 1px dashed rgba(var(--fg-rgb),0.18);
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
        text-shadow: 0 0 10px rgba(var(--green-rgb),0.45);
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
        background: rgba(var(--fg-rgb),0.03);
        border: 1px solid var(--border-soft);
      }
      .tz-top-cliente-row:nth-child(1) { border-color: rgba(var(--yellow-rgb),0.5); box-shadow: 0 0 14px rgba(var(--yellow-rgb),0.2); }
      .tz-top-cliente-row:nth-child(2) { border-color: rgba(var(--cyan-rgb),0.4); }
      .tz-top-cliente-row:nth-child(3) { border-color: rgba(var(--orange-rgb),0.4); }
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
        background: rgba(var(--fg-rgb),0.06);
        color: var(--text-dim);
        cursor: pointer;
        text-decoration: none;
      }
      .tz-top-cliente-wa-btn {
        border-color: rgba(var(--green-rgb),0.4);
        color: var(--green);
      }
      .tz-top-cliente-wa-btn:hover { background: rgba(var(--green-rgb),0.15); }
      .tz-top-cliente-expand-btn:hover { background: rgba(var(--cyan-rgb),0.15); color: var(--cyan); }
      .tz-top-cliente-favoritos {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px dashed rgba(var(--fg-rgb),0.12);
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
      /* Bug: las sugerencias de Nombre/WhatsApp del checkout se abrían
         HACIA ABAJO (top:100%), pero estos campos viven dentro de
         .tz-submitbar, que está fija al borde inferior de la pantalla —
         el desplegable se dibujaba entero fuera del viewport, así que
         nunca se veía aunque sí hubiera coincidencias. Acá se abre hacia
         arriba, sobre el resto de la barra. */
      .tz-submitbar .tz-global-search-dropdown {
        top: auto;
        bottom: calc(100% + 6px);
        max-height: min(260px, 40vh);
        z-index: 70;
      }
      .tz-checkout-cuenta-row { width: 100%; display: flex; flex-direction: column; gap: 4px; }
      .tz-checkout-cuenta-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        width: 100%;
        padding: 9px 12px;
        border-radius: 10px;
        border: 1px dashed rgba(var(--cyan-rgb),0.4);
        background: transparent;
        color: var(--cyan);
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        font-size: 12.5px;
        cursor: pointer;
      }
      .tz-checkout-cuenta-btn:hover { background: rgba(var(--cyan-rgb),0.08); }
      .tz-checkout-cuenta-btn:disabled { opacity: 0.6; cursor: default; }
      .tz-checkout-cuenta-ok {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0;
        font-size: 12px;
        color: var(--green, var(--green));
      }
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
      /* "Imprimir Boleta": mismo molde que el resto de la barra, pero en
         cyan — no es una acción de WhatsApp. */
      .tz-print-boleta-btn {
        background: rgba(var(--cyan-rgb),0.14);
        border-color: rgba(var(--cyan-rgb),0.5);
        color: var(--cyan);
      }
      .tz-print-boleta-btn:hover { background: rgba(var(--cyan-rgb),0.22); }
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
        border-top: 1px dashed rgba(var(--fg-rgb),0.14);
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
      .tz-metodo-btn-fiado { border-color: rgba(var(--orange-rgb),0.5); color: var(--orange); }
      .tz-metodo-btn-fiado.tz-gasto-tipo-active {
        border-color: var(--orange);
        background: rgba(var(--orange-rgb),0.16);
        box-shadow: 0 0 14px rgba(var(--orange-rgb),0.4);
      }
      .tz-metodo-btn-efectivo { border-color: rgba(var(--green-rgb),0.5); color: var(--green); }
      .tz-metodo-btn-efectivo.tz-gasto-tipo-active {
        border-color: var(--green);
        background: rgba(var(--green-rgb),0.16);
        box-shadow: 0 0 14px rgba(var(--green-rgb),0.4);
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
        background: rgba(var(--fg-rgb),0.05);
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
        text-shadow: 0 0 16px rgba(var(--green-rgb),0.5);
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
      .tz-metodo-tag-fiado { color: var(--pink); border-color: rgba(var(--pink-rgb),0.5); background: rgba(var(--pink-rgb),0.12); }
      .tz-metodo-tag-fiado { color: var(--orange); border-color: rgba(var(--orange-rgb),0.5); background: rgba(var(--orange-rgb),0.1); }
      .tz-metodo-tag-efectivo { color: var(--green); border-color: rgba(var(--green-rgb),0.5); background: rgba(var(--green-rgb),0.1); }

      .tz-scan-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        background: rgba(var(--cyan-rgb),0.1);
        border: 1px solid rgba(var(--cyan-rgb),0.4);
        color: var(--cyan);
        border-radius: 10px;
        padding: 11px;
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        font-size: 13.5px;
        cursor: pointer;
      }
      .tz-scan-btn:hover { background: rgba(var(--cyan-rgb),0.18); }
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
        /* --green (var(--green)) es un verde neón muy claro: el texto cian
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
        background: rgba(var(--green-rgb),0.08);
        border: 1px solid rgba(var(--green-rgb),0.3);
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
        background: rgba(var(--fg-rgb),0.05);
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
        .tz-header-btn { padding: 9px 12px; }
        .tz-header-btn-label { font-size: 11px; }
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
          border-left: 1px solid rgba(var(--cyan-rgb),0.25);
          border-right: 1px solid rgba(var(--cyan-rgb),0.25);
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
        background: rgb(var(--base-deep-rgb));
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
        border: 1px solid rgba(var(--danger-rgb),0.4);
        background: rgba(var(--danger-rgb),0.12);
        color: var(--danger);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
      .tz-eg-close:hover { background: rgba(var(--danger-rgb),0.24); }

      /* ---- selección de personaje / menú ---- */
      .tz-eg-select {
        width: 100%;
        max-width: 720px;
        max-height: 100%;
        overflow-y: auto;
        padding: 40px 24px;
        text-align: center;
        color: var(--text);
      }
      .tz-eg-title {
        font-family: 'Orbitron', sans-serif;
        font-size: 26px;
        font-weight: 800;
        color: var(--cyan);
        text-shadow: 0 0 18px rgba(var(--cyan-rgb),0.6);
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
        border: 1px solid rgba(var(--fg-rgb),0.1);
        background: rgba(var(--fg-rgb),0.03);
      }
      .tz-eg-char-card-selected {
        border-color: var(--cyan);
        background: rgba(var(--cyan-rgb),0.08);
      }
      .tz-eg-char-avatar {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: 2px solid;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(var(--shadow-rgb),0.4);
      }
      .tz-eg-char-avatar-dot {
        width: 22px;
        height: 22px;
        border-radius: 6px;
      }
      .tz-eg-char-name {
        font-size: 12.5px;
        font-weight: 700;
        color: var(--text);
      }
      .tz-eg-char-btn {
        width: 100%;
        padding: 6px 8px;
        border-radius: 8px;
        border: 1px solid rgba(var(--fg-rgb),0.15);
        background: rgba(var(--fg-rgb),0.06);
        color: var(--text);
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
        background: linear-gradient(135deg, var(--cyan), #b98bff);
        color: var(--on-cyan);
        font-family: 'Orbitron', sans-serif;
        font-weight: 800;
        font-size: 15px;
        letter-spacing: 0.03em;
        cursor: pointer;
        box-shadow: 0 0 24px rgba(var(--cyan-rgb),0.4);
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
        border: 1px solid rgba(var(--cyan-rgb),0.15);
      }

      .tz-eg-overlay-msg {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 14px;
        background: rgba(var(--base-deep-rgb),0.82);
        color: var(--text);
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
        background: linear-gradient(135deg, var(--cyan), #b98bff);
        color: var(--on-cyan);
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
        border: 2px solid rgba(var(--cyan-rgb),0.4);
        background: rgba(var(--cyan-rgb),0.06);
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
        background: rgba(var(--cyan-rgb),0.35);
        border: 2px solid var(--cyan);
        box-shadow: 0 0 14px rgba(var(--cyan-rgb),0.5);
        pointer-events: none;
      }
      .tz-eg-btn {
        position: absolute;
        bottom: 30px;
        width: 74px;
        height: 74px;
        border-radius: 50%;
        border: 2px solid rgba(var(--fg-rgb),0.3);
        background: rgba(var(--fg-rgb),0.08);
        color: var(--text);
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
        border-color: rgba(var(--yellow-rgb),0.5);
        background: rgba(var(--yellow-rgb),0.1);
        color: var(--yellow);
      }
      .tz-eg-btn-action {
        right: 24px;
        border-color: rgba(var(--pink-rgb),0.5);
        background: rgba(var(--pink-rgb),0.1);
        color: var(--pink);
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
          background: rgb(var(--base-deep-rgb));
          color: var(--cyan);
          font-family: 'Orbitron', sans-serif;
          font-size: 16px;
          text-align: center;
          padding: 24px;
        }
      }

      /* ==================================================================
         FASE 1 "PEDIDOS DELIVERY" — Gestor de Pedidos (admin/cajero) +
         chat de pedido (cliente <-> cajero) + carrito/checkout público.
         ================================================================== */

      .tz-pedidos-list {
        display: flex;
        flex-direction: column;
        gap: 14px;
        margin-top: 14px;
      }
      .tz-pedido-card {
        border: 1px solid var(--border-soft);
        border-radius: 14px;
        padding: 14px;
        background: var(--panel);
      }
      .tz-pedido-card-head {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .tz-pedido-cliente-nombre {
        font-weight: 700;
        color: var(--text);
        flex: 1;
      }
      /* Con la etiqueta de sucursal + la de tipo de pedido compitiendo
         por espacio en la misma línea, el nombre YA NO se estira
         (flex:1) — queda pegado a la izquierda, del tamaño de su
         propio texto, y son las etiquetas las que se envuelven a una
         segunda línea si no entran (.tz-pedido-card-head ya tiene
         flex-wrap). */
      .tz-pedido-cliente-nombre-fijo { flex: 0 1 auto; }
      /* Grupo de etiquetas (sucursal, tipo de pedido, estado) — pegado
         a la derecha vía margin-left:auto, dejando el nombre solo a la
         izquierda. Envuelve a una segunda línea (alineada a la
         derecha) si no entran todas en una sola. */
      .tz-pedido-card-tags {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        flex-wrap: wrap;
        gap: 8px;
        margin-left: auto;
      }
      .tz-pedido-sucursal-tag {
        display: inline-flex;
        align-items: center;
        font-size: 11px;
        font-weight: 700;
        padding: 3px 9px;
        border-radius: 999px;
        flex-shrink: 0;
        color: var(--pink);
        background: rgba(var(--pink-rgb),0.12);
        border: 1px solid rgba(var(--pink-rgb),0.4);
        text-shadow: 0 0 10px rgba(var(--pink-rgb),0.5);
      }
      .tz-chat-dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: var(--text-dim);
        flex-shrink: 0;
      }
      .tz-chat-dot-activo {
        background: var(--cyan);
        box-shadow: 0 0 8px rgba(var(--cyan-rgb),0.8);
      }
      .tz-pedido-estado {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        padding: 3px 9px;
        border-radius: 999px;
        background: rgba(var(--fg-rgb),0.08);
        color: var(--text-dim);
      }
      .tz-pedido-estado-nuevo { background: rgba(var(--cyan-rgb),0.15); color: var(--cyan); }
      .tz-pedido-estado-en_atencion { background: rgba(var(--yellow-rgb),0.15); color: var(--yellow); }
      .tz-pedido-estado-confirmado { background: var(--green-bg); color: var(--green); }
      .tz-pedido-estado-cancelado { background: rgba(var(--danger-rgb),0.15); color: var(--danger); }

      .tz-pedido-modo-tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        font-weight: 700;
        padding: 3px 9px;
        border-radius: 999px;
        flex-shrink: 0;
      }
      .tz-pedido-modo-tienda { background: rgba(var(--cyan-2-rgb),0.12); color: var(--cyan); }
      .tz-pedido-modo-delivery { background: rgba(var(--orange-rgb),0.14); color: #ff9d3d; }

      .tz-asignar-fiado-search {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 10px 0 12px;
        padding: 0 12px;
        border-radius: 12px;
        border: 1px solid var(--border-soft);
        background: rgba(var(--fg-rgb),0.03);
        color: var(--text-dim);
      }
      .tz-asignar-fiado-search .tz-text-input {
        border: none;
        background: transparent;
        padding: 10px 0;
      }
      .tz-asignar-fiado-sugerencias {
        display: flex;
        flex-direction: column;
        gap: 6px;
        max-height: 320px;
        overflow-y: auto;
      }
      .tz-asignar-fiado-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid var(--border-soft);
        background: rgba(var(--fg-rgb),0.03);
        color: var(--text);
        text-align: left;
        cursor: pointer;
      }
      .tz-asignar-fiado-item:hover { border-color: var(--cyan); }
      .tz-asignar-fiado-info { display: flex; flex-direction: column; gap: 2px; }
      .tz-asignar-fiado-nombre { font-weight: 700; }
      .tz-asignar-fiado-meta { font-size: 12px; color: var(--text-dim); }

      /* Filtro secundario del Gestor de Pedidos (debajo de "Para
         retirar"/"Para repartir"): mismas 3 etiquetas de color que ya
         usan los badges de estado de la tarjeta, pero clickeables —
         reutiliza el color, no la forma (acá son chips con borde, no
         pastillas de solo lectura). Sin ninguna tocada = "Todos". */
      .tz-filtro-estado-chip {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        padding: 4px 11px;
        border-radius: 999px;
        background: transparent;
        border: 1px solid var(--border-soft);
        color: var(--text-dim);
        cursor: pointer;
      }
      .tz-filtro-estado-chip-activo.tz-filtro-estado-chip-en_carrera { background: rgba(var(--orange-rgb),0.15); border-color: var(--orange); color: var(--orange); }
      .tz-filtro-estado-chip-activo.tz-filtro-estado-chip-entregado { background: var(--green-bg); border-color: var(--green); color: var(--green); }
      .tz-filtro-estado-chip-activo.tz-filtro-estado-chip-cancelado { background: rgba(var(--danger-rgb),0.15); border-color: var(--danger); color: var(--danger); }

      .tz-pedido-card-meta {
        font-size: 12px;
        color: var(--text-dim);
        margin-top: 6px;
      }
      .tz-pedido-items-list {
        list-style: none;
        margin: 8px 0 0;
        padding: 0;
        font-size: 13px;
        color: var(--text);
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .tz-pedido-card-total {
        margin-top: 8px;
        font-weight: 700;
        color: var(--text);
      }
      .tz-pedido-card-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
      }
      .tz-pedido-action-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12.5px;
        font-weight: 600;
        padding: 7px 11px;
        border-radius: 10px;
        border: 1px solid var(--border-soft);
        background: rgba(var(--fg-rgb),0.04);
        color: var(--text);
        cursor: pointer;
      }
      .tz-pedido-action-btn:hover { border-color: var(--cyan); color: var(--cyan); }
      .tz-pedido-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .tz-pedido-action-confirmar { border-color: var(--green); color: var(--green); }
      .tz-pedido-action-cancelar { border-color: var(--danger); color: var(--danger); }

      /* ---- Chat de pedido ---- */
      .tz-modal-chat { max-width: 420px; display: flex; flex-direction: column; }
      .tz-chat-messages {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 360px;
        overflow-y: auto;
        margin-top: 12px;
        padding-right: 4px;
      }
      .tz-chat-empty { color: var(--text-dim); font-size: 13px; text-align: center; padding: 20px 0; }
      .tz-chat-bubble-row { display: flex; justify-content: flex-start; }
      .tz-chat-bubble-row-own { justify-content: flex-end; }
      .tz-chat-bubble-row-sistema { justify-content: center; }
      .tz-chat-bubble {
        max-width: 78%;
        padding: 8px 12px;
        border-radius: 14px;
        font-size: 13.5px;
        line-height: 1.4;
        word-break: break-word;
      }
      .tz-chat-bubble-own { background: rgba(var(--cyan-rgb),0.18); color: var(--text); border-bottom-right-radius: 3px; }
      .tz-chat-bubble-other { background: rgba(var(--fg-rgb),0.08); color: var(--text); border-bottom-left-radius: 3px; }
      .tz-chat-bubble-sistema {
        background: transparent;
        border: 1px dashed var(--border-soft);
        color: var(--text-dim);
        font-size: 12px;
        text-align: center;
        max-width: 90%;
      }
      .tz-chat-input-row {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }
      .tz-chat-input {
        flex: 1;
        background: rgba(var(--fg-rgb),0.05);
        border: 1px solid var(--border-soft);
        border-radius: 10px;
        padding: 10px 12px;
        color: var(--text);
        font-size: 13.5px;
      }
      .tz-chat-input:focus { outline: none; border-color: var(--cyan); }
      .tz-chat-send-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 10px;
        border: none;
        background: var(--cyan);
        color: var(--on-green);
        cursor: pointer;
        flex-shrink: 0;
      }
      .tz-chat-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

      /* ---- Carrito público del cliente (CatalogPage) ---- */
      .tz-card-cart-controls { margin-top: 10px; }
      .tz-card-add-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        width: 100%;
        margin-top: 8px;
        padding: 7px 0;
        border-radius: 8px;
        border: 1px solid var(--cyan);
        background: rgba(var(--cyan-rgb),0.1);
        color: var(--cyan);
        font-weight: 700;
        font-size: 12.5px;
        cursor: pointer;
      }
      .tz-card-add-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      .tz-cart-floating-bar {
        position: fixed;
        left: 50%;
        transform: translateX(-50%);
        bottom: 16px;
        z-index: 55;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px 20px;
        border-radius: 999px;
        background: var(--panel-solid);
        border: 1px solid rgba(var(--cyan-rgb),0.35);
        box-shadow: 0 0 30px rgba(var(--cyan-rgb),0.2);
        cursor: pointer;
      }
      .tz-cart-floating-bar-count {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 22px;
        height: 22px;
        padding: 0 6px;
        border-radius: 999px;
        background: var(--cyan);
        color: var(--on-green);
        font-size: 12px;
        font-weight: 700;
      }
      .tz-cart-floating-bar-total { font-weight: 700; color: var(--text); }
      .tz-pedido-confirmacion {
        display: flex;
        flex-direction: column;
        gap: 12px;
        align-items: center;
        text-align: center;
        padding: 10px 0;
      }
      .tz-pedido-confirmacion-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: center;
      }

      /* ---- Petición de retiro en tienda (Gestor de Pedidos) ---- */
      .tz-peticion-card { border-color: rgba(var(--cyan-2-rgb),0.4); background: rgba(var(--cyan-2-rgb),0.05); }
      .tz-peticion-badge {
        display: inline-block; padding: 2px 9px; border-radius: 999px;
        background: rgba(var(--cyan-2-rgb),0.16); border: 1px solid rgba(var(--cyan-2-rgb),0.5);
        color: var(--cyan-2); font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em;
      }
      .tz-peticion-comprobante {
        display: flex; align-items: center; gap: 10px; width: 100%; margin: 8px 0;
        padding: 8px; border-radius: 10px; border: 1px solid rgba(var(--fg-rgb),0.15);
        background: rgba(var(--shadow-rgb),0.2); color: var(--text); font-size: 12.5px; font-weight: 600; cursor: pointer;
      }
      .tz-peticion-comprobante img { width: 54px; height: 54px; object-fit: cover; border-radius: 8px; }

      /* ---- Comprobante en el checkout del cliente ---- */
      .tz-checkout-comprobante { margin: 12px 0; }
      .tz-checkout-comprobante-preview { width: 100%; border-radius: 10px; margin-top: 8px; max-height: 260px; object-fit: contain; background: rgba(var(--shadow-rgb),0.2); }

      /* ---- Círculo de aviso en botones de pedidos ---- */
      .tz-badge-dot {
        position: absolute;
        top: -4px;
        right: -4px;
        min-width: 16px;
        height: 16px;
        padding: 0 4px;
        border-radius: 999px;
        background: var(--danger, var(--danger));
        color: #fff;
        font-size: 10px;
        font-weight: 800;
        line-height: 16px;
        text-align: center;
        box-shadow: 0 0 0 2px var(--bg, #0b0e14);
      }

      /* ---- Selector de entrega + MapPicker (checkout del cliente) ---- */
      .tz-checkout-entrega { margin: 12px 0; }
      .tz-mp { margin-top: 10px; display: flex; flex-direction: column; gap: 8px; }
      .tz-mp-map { position: relative; height: 240px; border-radius: 12px; overflow: hidden; border: 1px solid rgba(var(--fg-rgb),0.12); }
      .tz-mp-map .leaflet-container { background: #10141c; }
      .tz-mp-loc {
        position: absolute; z-index: 500; left: 8px; bottom: 8px;
        display: inline-flex; align-items: center; gap: 6px;
        padding: 6px 12px; border-radius: 999px;
        background: rgba(var(--cyan-2-rgb),0.16); border: 1px solid rgba(var(--cyan-2-rgb),0.5);
        color: var(--cyan-2); font-size: 12px; font-weight: 700; cursor: pointer;
      }
      .tz-mp-loc:disabled { opacity: 0.6; cursor: default; }
      .tz-mp-pin-wrap { background: none; border: 0; }
      .tz-mp-pin { font-size: 26px; filter: drop-shadow(0 2px 4px rgba(var(--shadow-rgb),0.5)); }
      .tz-mp-dir { width: 100%; }

      /* ---- Delivery (EntregaCajaModal, MapaEntregaCaja) ---- */
      .tz-dlv-badge {
        display: inline-block; margin-top: 6px; padding: 2px 9px; border-radius: 999px;
        font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em;
        border: 1px solid rgba(var(--fg-rgb),0.18); color: var(--text-dim);
      }
      .tz-dlv-badge-buscando  { color: var(--text-dim); }
      .tz-dlv-badge-aceptado  { color: #ff9d3d; border-color: rgba(var(--orange-rgb),0.5); background: rgba(var(--orange-rgb),0.12); }
      .tz-dlv-badge-en_ruta   { color: var(--cyan-2); border-color: rgba(var(--cyan-2-rgb),0.5); background: rgba(var(--cyan-2-rgb),0.12); }
      .tz-dlv-badge-entregado { color: var(--green); border-color: rgba(var(--green-rgb),0.5); background: rgba(var(--green-rgb),0.12); }
      .tz-dlv-badge-cancelado, .tz-dlv-badge-no_entregado { color: var(--danger); border-color: rgba(var(--danger-rgb),0.5); background: rgba(var(--danger-rgb),0.12); }

      /* Tarjeta de detalles del pedido (ubicación + monto) + el mapa en
         vivo, todo junto — antes era una sola línea larga que se
         desordenaba con la dirección + total + repartidor mezclados. */
      .tz-dlv-details-card {
        margin-top: 10px;
        padding: 10px 12px;
        border-radius: 12px;
        background: rgba(var(--fg-rgb),0.04);
        border: 1px solid rgba(var(--fg-rgb),0.1);
      }
      .tz-dlv-details-row {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0;
        font-size: 13px;
        color: var(--text);
      }
      .tz-dlv-details-row + .tz-dlv-details-row { margin-top: 5px; }
      .tz-dlv-details-row svg { flex-shrink: 0; color: var(--text-dim); }

      /* Tarifa de envío — fuera de la tarjeta, antes de ofertar. Mismos
         chips ("mensajes directos") que ya usa el chat del conductor en
         Taxi-PE para proponer tarifa (.tz-chat-quickreply-btn ahí),
         portados acá con los mismos valores/tamaños/colores — solo que
         un tap fija la tarifa en vez de mandar un mensaje. */
      .tz-dlv-tarifa-row { margin: 10px 0; }
      .tz-dlv-tarifa-quickrow {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 4px;
      }
      .tz-dlv-tarifa-chip {
        flex-shrink: 0;
        white-space: nowrap;
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.15s, box-shadow 0.15s;
        padding: 8px 16px;
        border-radius: 999px;
        border: 1px solid rgba(var(--cyan-rgb),0.4);
        background: rgba(var(--cyan-rgb),0.1);
        color: var(--cyan);
        font-size: 13px;
      }
      .tz-dlv-tarifa-chip:hover { background: rgba(var(--cyan-rgb),0.2); box-shadow: 0 0 12px rgba(var(--cyan-rgb),0.3); }
      .tz-dlv-tarifa-chip-activo {
        background: rgba(var(--cyan-rgb),0.3);
        box-shadow: 0 0 12px rgba(var(--cyan-rgb),0.5);
        border-color: var(--cyan);
      }
      .tz-dlv-tarifa-chip-plus {
        width: 34px;
        padding: 8px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .tz-dlv-tarifa-custom-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
      }
      .tz-dlv-tarifa-custom-input { flex: 1; margin: 0; }
      .tz-dlv-tarifa-hint { margin: 6px 0 0; font-size: 11.5px; color: var(--text-dim); }

      .tz-dlv-radar-list { list-style: none; margin: 6px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
      .tz-dlv-radar-list li { display: flex; justify-content: space-between; align-items: center; gap: 8px;
        padding: 8px 10px; border: 1px solid rgba(var(--fg-rgb),0.12); border-radius: 10px; font-size: 13.5px; }
      .tz-dlv-radar-list em { opacity: 0.65; font-style: normal; }
      /* Cuenta regresiva de 30s por conductor ofertado — misma barra
         verde que ve el repartidor en su propia tarjeta de oferta. */
      .tz-dlv-radar-item-timeout { position: relative; overflow: hidden; padding-bottom: 11px; }
      .tz-dlv-radar-timeout-track {
        position: absolute; left: 0; right: 0; bottom: 0; height: 3px;
        background: rgba(var(--fg-rgb),0.06);
      }
      .tz-dlv-radar-timeout-fill {
        height: 100%; background: var(--green); box-shadow: 0 0 8px rgba(var(--green-rgb),0.7);
        transition: width 0.25s linear;
      }
      .tz-dlv-tag-ocupado { color: #ff9d3d; font-size: 11px; font-weight: 700; }
      .tz-dlv-tag-rechazo { color: var(--danger); font-size: 11px; font-weight: 700; }
      .tz-dlv-tag-espera { font-size: 11px; font-weight: 700; color: var(--text-dim); }
      .tz-dlv-rechazos { display: flex; flex-direction: column; gap: 4px; margin: 8px 0; }
      .tz-dlv-rechazo { margin: 0; font-size: 12.5px; color: #ffb3c0; padding: 6px 10px;
        border-radius: 8px; background: rgba(var(--danger-rgb),0.1); border: 1px solid rgba(var(--danger-rgb),0.35); }

      .tz-btn-mini { display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px; border-radius: 8px;
        border: 1px solid rgba(var(--green-rgb),0.45); background: rgba(var(--green-rgb),0.12); color: var(--green);
        font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; }
      .tz-btn-mini:disabled { opacity: 0.5; cursor: default; }
      .tz-btn-verde { display: inline-flex; align-items: center; gap: 6px; padding: 9px 14px; border-radius: 10px;
        border: 1px solid rgba(var(--green-rgb),0.5); background: rgba(var(--green-rgb),0.14); color: var(--green);
        font-size: 13px; font-weight: 700; cursor: pointer; }
      .tz-btn-ghost { display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 10px;
        border: 1px solid rgba(var(--fg-rgb),0.2); background: transparent; color: var(--text); font-size: 12.5px; cursor: pointer; }
      .tz-dlv-cancelar { border-color: rgba(var(--danger-rgb),0.5); color: var(--danger); }
      .tz-dlv-acciones { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
      .tz-dlv-radar .tz-dlv-cancelar { margin-top: 10px; }

      /* PIN + QR + cancelar, todos en la misma línea, empaquetados a la izquierda */
      .tz-dlv-pin-row { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
      .tz-dlv-pin {
        flex: 0 0 auto;                 /* solo lo que ocupa el contenido */
        display: inline-flex; align-items: center; gap: 8px;
        padding: 9px 12px;
        border-radius: 12px;
        border: 1px solid rgba(var(--cyan-2-rgb),0.35);
        background: rgba(var(--cyan-2-rgb),0.08);
        font-size: 12px; font-weight: 600; color: #9fdcff; letter-spacing: 0.02em;
      }
      .tz-dlv-pin b { font-size: 19px; font-weight: 800; letter-spacing: 0.2em; color: #eafcff; }
      .tz-dlv-qr-btn {
        flex: 0 0 42px; width: 42px; height: 42px;
        display: flex; align-items: center; justify-content: center;
        border-radius: 12px;
        border: 1px solid rgba(var(--green-rgb),0.5);
        background: rgba(var(--green-rgb),0.14);
        color: var(--green); cursor: pointer;
      }
      .tz-dlv-pin-row .tz-dlv-cancelar { flex: 0 0 auto; }

      /* ---- Chat: mismo estilo que el chat de Taxi-PE (burbujas, acento rosa a la derecha) ---- */
      .tz-dlv-chat-tabs { display: flex; gap: 8px; margin-top: 14px; }
      .tz-dlv-chat-tab { position: relative; flex: 1; padding: 7px 0; border-radius: 8px; border: 1px solid rgba(var(--fg-rgb),0.15);
        background: transparent; color: var(--text-dim); font-size: 12.5px; font-weight: 700; cursor: pointer; }
      .tz-dlv-chat-tab-active { border-color: var(--pink); color: var(--pink); background: rgba(var(--pink-rgb),0.1); }
      .tz-dlv-chat-scroll { margin-top: 8px; max-height: 220px; overflow-y: auto; display: flex; flex-direction: column;
        gap: 8px; padding: 12px; border: 1px solid rgba(var(--fg-rgb),0.1); border-radius: 12px 12px 0 0; background: rgba(var(--shadow-rgb),0.18); }
      .tz-dlv-chat-empty { text-align: center; color: var(--text-dim); font-size: 13px; margin: auto; }
      .tz-dlv-bubble {
        align-self: flex-start; max-width: 80%; min-width: 0;
        background: rgba(var(--fg-rgb),0.05);
        border: 1px solid rgba(var(--fg-rgb),0.12);
        border-radius: 12px 12px 12px 4px;
        padding: 8px 12px;
      }
      .tz-dlv-bubble p { margin: 0; color: var(--text); font-size: 14px; line-height: 1.4; white-space: pre-wrap;
        overflow-wrap: anywhere; word-break: break-word; }
      .tz-dlv-bubble-mine {
        align-self: flex-end; text-align: right;
        background: rgba(var(--pink-rgb),0.12);
        border-color: rgba(var(--pink-rgb),0.45);
        border-radius: 12px 12px 4px 12px;
        box-shadow: 0 0 14px rgba(var(--pink-rgb),0.18);
      }
      .tz-dlv-bubble-time { display: flex; align-items: center; justify-content: flex-end; gap: 3px; margin-top: 3px; font-size: 10.5px; color: var(--text-dim); }
      .tz-dlv-check { color: var(--text-dim); }
      .tz-dlv-check-leido { color: var(--cyan-2); }
      .tz-dlv-msg-sys { align-self: center; margin: 0; background: transparent; color: var(--text-dim); font-size: 12px; font-style: italic; }
      .tz-dlv-chat-input { display: flex; align-items: center; gap: 8px; padding: 8px;
        border: 1px solid rgba(var(--fg-rgb),0.1); border-top: 0; border-radius: 0 0 12px 12px; }
      .tz-dlv-chat-input .tz-input { flex: 1 1 auto; min-width: 0; padding: 10px 12px; border-radius: 10px;
        border: 1px solid rgba(var(--fg-rgb),0.18); background: rgba(var(--shadow-rgb),0.25); color: var(--text); font-size: 14px; }
      .tz-dlv-send { flex: 0 0 42px; width: 42px; height: 42px; padding: 0; display: flex; align-items: center;
        justify-content: center; border-radius: 12px; border: 1px solid rgba(var(--pink-rgb),0.45);
        background: rgba(var(--pink-rgb),0.14); color: var(--pink); cursor: pointer; }
      .tz-dlv-send:disabled { opacity: 0.4; cursor: default; }

      /* ==================== SUPER ADMIN (Fase 1) ====================
         Pantalla aparte de todo el POS: header simple + columna de
         rubros (izquierda, oscura) + grilla de negocios de 3 columnas
         estilo Friv (derecha). Reusa .tz-toggle/.tz-vis-edit-btn/
         .tz-text-input/.tz-cliente-action-btn ya definidos arriba, no
         duplica esos estilos base. */
      .tz-sa-header {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 16px 20px;
        border-bottom: 1px solid var(--border-soft);
        background: rgba(var(--base-rgb), 0.85);
      }
      .tz-sa-header-logo { height: 44px; width: auto; }
      .tz-sa-header-title { flex: 1 1 auto; min-width: 0; }
      .tz-sa-header-title h1 {
        margin: 0;
        font-family: 'Orbitron', sans-serif;
        font-size: 16px;
        letter-spacing: 0.08em;
      }
      .tz-sa-header-title p {
        margin: 2px 0 0;
        font-size: 12px;
        color: var(--text-dim);
      }

      .tz-sa-body {
        display: flex;
        align-items: flex-start;
        gap: 20px;
        padding: 20px;
      }
      @media (max-width: 767px) {
        .tz-sa-body { flex-direction: column; }
      }

      .tz-sa-col-title {
        margin: 0 0 10px;
        font-family: 'Orbitron', sans-serif;
        font-size: 13px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--cyan);
      }

      .tz-sa-rubros-col {
        flex: 0 0 260px;
        width: 260px;
        box-sizing: border-box;
        background: var(--panel-solid);
        border: 1px solid var(--border-soft);
        border-radius: 16px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        position: sticky;
        top: 20px;
      }
      @media (max-width: 767px) {
        .tz-sa-rubros-col { width: 100%; flex: 1 1 auto; position: static; }
      }

      .tz-sa-rubro-row {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px;
        border-radius: 10px;
        background: rgba(var(--fg-rgb),0.03);
        border: 1px solid transparent;
      }
      .tz-sa-rubro-row-active {
        border-color: rgba(var(--cyan-rgb),0.4);
        background: rgba(var(--cyan-rgb),0.08);
      }
      .tz-sa-rubro-todos {
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        color: var(--text);
        cursor: pointer;
        text-align: left;
      }
      .tz-sa-rubro-label {
        flex: 1 1 auto;
        min-width: 0;
        text-align: left;
        background: none;
        border: none;
        color: var(--text);
        font-family: 'Rajdhani', sans-serif;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        padding: 4px 2px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .tz-sa-rubro-toggle { flex: 0 0 auto; }
      .tz-sa-drag-handle {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        color: var(--text-dim);
        cursor: grab;
        touch-action: none;
      }
      .tz-sa-drag-handle:active { cursor: grabbing; }
      .tz-sa-inline-input { flex: 1 1 auto; min-width: 0; }
      .tz-sa-inline-error { margin-top: 4px; font-size: 12px; }
      .tz-sa-new-row {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 6px;
        padding: 10px;
        border-radius: 10px;
        border: 1px dashed rgba(var(--fg-rgb),0.15);
      }
      .tz-sa-add-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        margin-top: 6px;
        padding: 10px;
        border-radius: 10px;
        border: 1px dashed rgba(var(--cyan-rgb),0.35);
        background: transparent;
        color: var(--cyan);
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        cursor: pointer;
      }
      .tz-sa-add-btn:hover { background: rgba(var(--cyan-rgb),0.08); }

      .tz-sa-negocios-col { flex: 1 1 auto; min-width: 0; }
      .tz-sa-negocios-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }
      @media (max-width: 1023px) {
        .tz-sa-negocios-grid { grid-template-columns: repeat(2, 1fr); }
      }
      @media (max-width: 559px) {
        .tz-sa-negocios-grid { grid-template-columns: 1fr; }
      }

      .tz-sa-negocio-card {
        position: relative;
        background: var(--panel-solid);
        border: 1px solid var(--border-soft);
        border-radius: 16px;
        padding: 14px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
      }
      .tz-sa-negocio-drag {
        position: absolute;
        top: 10px;
        left: 10px;
      }
      .tz-sa-negocio-logo-wrap {
        position: relative;
        width: 96px;
        height: 96px;
        border-radius: 14px;
        overflow: hidden;
        background: rgba(var(--fg-rgb),0.04);
        border: 1px solid var(--border-soft);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
      .tz-sa-negocio-logo { width: 100%; height: 100%; object-fit: contain; }
      .tz-sa-negocio-logo-placeholder { color: var(--text-dim); }
      .tz-sa-negocio-logo-overlay {
        position: absolute;
        bottom: 4px;
        right: 4px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: rgba(var(--shadow-rgb),0.6);
        color: var(--cyan);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .tz-sa-negocio-name-row {
        display: flex;
        align-items: center;
        gap: 6px;
        width: 100%;
        justify-content: center;
      }
      .tz-sa-negocio-name {
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        font-size: 14.5px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 160px;
      }
      .tz-sa-negocio-edit-row {
        display: flex;
        align-items: center;
        gap: 6px;
        width: 100%;
      }
      .tz-sa-negocio-edit-col {
        display: flex;
        flex-direction: column;
        gap: 6px;
        width: 100%;
      }
      .tz-sa-negocio-slug {
        margin: -4px 0 0;
        font-size: 11px;
        color: var(--text-dim);
        font-family: 'Rajdhani', sans-serif;
      }
      .tz-sa-negocio-toggle {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .tz-sa-negocio-toggle-label { font-size: 11px; color: var(--text-dim); }
      .tz-sa-negocio-delete-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        width: 100%;
        padding: 6px;
        border-radius: 8px;
        border: 1px solid transparent;
        background: none;
        color: #ff6b6b;
        font-family: 'Rajdhani', sans-serif;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }
      .tz-sa-negocio-delete-btn:hover { background: rgba(var(--danger-rgb),0.1); border-color: rgba(var(--danger-rgb),0.3); }
      .tz-sa-negocio-confirm { width: 100%; }
      .tz-sa-rubro-confirm { margin-bottom: 2px; }
      .tz-sa-negocio-admin-form { width: 100%; }
      .tz-sa-negocio-admin-btn { width: 100%; font-size: 12px; padding: 8px; }
      .tz-sa-negocio-clientes-btn { width: 100%; font-size: 12px; padding: 8px; border-color: rgba(var(--yellow-rgb),0.35); color: var(--yellow); }

      /* ---- Fase 4: planes, pagos y avisos ---- */
      .tz-sa-negocio-plan-btn { width: 100%; font-size: 12px; padding: 8px; border-color: rgba(var(--green-rgb),0.35); color: var(--green); }
      .tz-plan-badge {
        display: inline-flex;
        align-items: center;
        padding: 2px 9px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.03em;
        color: var(--tz-plan-color);
        border: 1px solid var(--tz-plan-color);
        background: color-mix(in srgb, var(--tz-plan-color) 12%, transparent);
        white-space: nowrap;
      }
      .tz-plan-resumen {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap: 6px;
        margin: 2px 0 0;
        font-size: 12px;
        color: var(--text-dim);
      }
      .tz-plan-resumen-dias { font-variant-numeric: tabular-nums; }
      .tz-plan-filtros { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 14px; }
      .tz-plan-filtros .tz-gasto-tipo-btn { flex: 0 0 auto; padding: 7px 12px; font-size: 12px; }

      .tz-plan-fila {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
        align-items: end;
        padding: 12px 0;
        border-bottom: 1px solid var(--border-soft);
      }
      .tz-plan-fila > .tz-text-input { grid-column: 1 / -1; }
      .tz-plan-fila .tz-toggle { grid-column: 1 / 3; }
      .tz-plan-fila-error,
      .tz-plan-total,
      .tz-plan-fila-confirmar { grid-column: 1 / -1; margin: 0; }
      .tz-plan-fila-acciones { grid-column: 3 / -1; display: flex; gap: 6px; justify-content: flex-end; flex-wrap: wrap; }
      .tz-plan-total { font-size: 13px; color: var(--text-dim); }
      .tz-plan-total strong { color: var(--green); font-size: 15px; }
      .tz-plan-total-desc { color: var(--yellow); }
      .tz-plan-total-uso { color: var(--cyan); }
      .tz-plan-fila-confirmar select { margin: 6px 0; }
      @media (max-width: 520px) {
        .tz-plan-fila { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .tz-plan-fila .tz-toggle,
        .tz-plan-fila-acciones { grid-column: 1 / -1; }
        .tz-plan-fila-acciones { justify-content: flex-start; }
      }
      .tz-plan-campo { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
      .tz-plan-campo > span { font-size: 11px; color: var(--text-dim); letter-spacing: 0.04em; text-transform: uppercase; }
      .tz-plan-campo-ancho { flex: 1 1 100%; }
      .tz-plan-seccion { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 12px; }
      .tz-plan-pago-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); align-items: end; }
      .tz-plan-pago-grid .tz-plan-campo-ancho { grid-column: 1 / -1; }
      .tz-plan-subtitulo {
        margin: 18px 0 10px;
        font-size: 13px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--cyan);
      }
      .tz-plan-pagos { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
      .tz-plan-pagos li {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 12px;
        padding: 8px 10px;
        border-radius: 10px;
        background: rgba(var(--fg-rgb),0.03);
        border: 1px solid var(--border-soft);
        font-size: 13px;
      }
      .tz-plan-pagos-hasta { color: var(--green); }
      .tz-plan-pagos-nota { flex-basis: 100%; color: var(--text-dim); font-size: 12px; }

      .tz-plan-aviso {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 10px auto;
        max-width: 960px;
        width: calc(100% - 32px);
        padding: 10px 14px;
        border-radius: 12px;
        border: 1px solid rgba(var(--yellow-rgb),0.45);
        background: rgba(var(--yellow-rgb),0.08);
        color: var(--text);
        font-size: 13px;
        line-height: 1.4;
      }
      .tz-plan-aviso > svg { flex: 0 0 auto; color: var(--yellow); }
      .tz-plan-aviso > span { flex: 1 1 auto; min-width: 0; }
      .tz-plan-aviso-gracia { border-color: rgba(var(--danger-rgb),0.55); background: rgba(var(--danger-rgb),0.1); }
      .tz-plan-aviso-gracia > svg { color: var(--danger); }
      .tz-plan-aviso-btn {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 7px 12px;
        border-radius: 999px;
        border: 1px solid var(--green);
        color: var(--green);
        font-weight: 700;
        font-size: 12px;
        text-decoration: none;
        white-space: nowrap;
      }
      .tz-catalogo-sin-pedidos { justify-content: center; text-align: center; margin-top: 0; }
      button.tz-plan-aviso-btn { background: transparent; cursor: pointer; font-family: inherit; }
      .tz-plan-aviso-btn-revision { border-color: var(--yellow); color: var(--yellow); }
      .tz-footer-btn-renovar {
        background: var(--green);
        color: #032316;
        box-shadow: 0 0 20px rgba(var(--green-rgb),0.45);
      }
      .tz-footer-btn-bloqueado { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
      .tz-footer-btn-bloqueado:hover { transform: none; }
      .tz-plan-ventana-nota { color: var(--yellow); margin: 0 0 10px; }

      /* ---- Panel del super admin (diseño del admin de Taxi-PE) ---- */
      .tz-header-btn-badge {
        position: absolute;
        top: -6px;
        right: -6px;
        min-width: 16px;
        height: 16px;
        padding: 0 4px;
        border-radius: 999px;
        background: var(--danger);
        color: var(--on-danger);
        font-size: 10px;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 8px rgba(var(--danger-rgb),0.6);
      }
      .tz-directorio-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
      @media (min-width: 768px) { .tz-directorio-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; } }
      @media (min-width: 1024px) { .tz-directorio-grid { grid-template-columns: repeat(3, 1fr); gap: 18px; } }
      .tz-page-footer-admin-grid { display: grid; grid-template-columns: repeat(3, 1fr); flex-wrap: nowrap; }
      .tz-page-footer-admin-grid .tz-footer-btn { max-width: none; }
      @media (max-width: 640px) {
        .tz-page-footer-admin-grid { grid-template-columns: repeat(2, 1fr); }
      }
      .tz-footer-btn-catalogo {
        background: var(--pink);
        color: #240013;
        box-shadow: 0 0 20px rgba(var(--pink-rgb),0.4);
      }
      .tz-estado-select {
        border-radius: 8px;
        border: 1px solid var(--border-soft);
        padding: 7px 10px;
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        font-size: 12px;
        cursor: pointer;
        background: rgba(var(--fg-rgb),0.03);
        color: var(--text);
      }
      .tz-estado-select[data-estado="activo"] { border-color: var(--green); color: var(--green); background: var(--green-bg); }
      .tz-estado-select[data-estado="prueba"] { border-color: var(--yellow); color: var(--yellow); background: rgba(var(--yellow-rgb),0.1); }
      .tz-estado-select[data-estado="gracia"] { border-color: var(--orange); color: var(--orange); background: rgba(var(--orange-rgb),0.12); }
      .tz-estado-select[data-estado="suspendido"] { border-color: var(--danger); color: var(--danger); background: rgba(var(--danger-rgb),0.12); }
      .tz-estado-select[data-estado="exento"] { border-color: var(--cyan); color: var(--cyan); background: rgba(var(--cyan-rgb),0.1); }

      /* Tarjeta de negocio: borde con el color propio del negocio. */
      .tz-card.tz-card-negocio {
        cursor: default;
        background:
          linear-gradient(var(--panel-solid), var(--panel-solid)) padding-box,
          linear-gradient(135deg, var(--tz-negocio-color), color-mix(in srgb, var(--tz-negocio-color) 35%, transparent)) border-box;
        border-color: transparent;
        box-shadow: 0 0 0 1.5px var(--tz-negocio-color), 0 0 24px color-mix(in srgb, var(--tz-negocio-color) 35%, transparent);
      }
      .tz-card-negocio-logo {
        position: relative;
        flex: 0 0 auto;
        width: 76px;
        height: 76px;
        border-radius: 14px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(var(--fg-rgb),0.05);
        color: var(--text-dim);
        cursor: pointer;
      }
      .tz-card-negocio-logo img { width: 100%; height: 100%; object-fit: contain; }
      .tz-card-negocio-logo-overlay {
        position: absolute;
        inset: auto 0 0 0;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(var(--shadow-rgb),0.55);
        color: #fff;
        opacity: 0;
        transition: opacity 0.15s ease;
      }
      .tz-card-negocio-logo:hover .tz-card-negocio-logo-overlay { opacity: 1; }
      .tz-card-negocio-dato { margin: 2px 0; color: var(--text-dim); font-size: 13px; }
      .tz-card-negocio-colores { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
      .tz-card-negocio-color {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid rgba(var(--fg-rgb),0.15);
        cursor: pointer;
        padding: 0;
      }
      .tz-card-negocio-color-activo { border-color: var(--text); box-shadow: 0 0 10px rgba(var(--fg-rgb),0.6); }
      .tz-card-negocio-colores input[type="color"] { width: 30px; height: 26px; border: none; background: none; padding: 0; cursor: pointer; }
      .tz-card-negocio-admin { display: flex; flex-direction: column; gap: 6px; }

      /* Gestores del super admin */
      .tz-sa-rubros-lista,
      .tz-sa-negocios-lista { display: flex; flex-direction: column; gap: 8px; }
      .tz-sa-rubro-fila,
      .tz-sa-negocio-fila {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border-radius: 12px;
        border: 1px solid var(--border-soft);
        background: rgba(var(--fg-rgb),0.03);
      }
      .tz-sa-negocio-fila { border-left: 3px solid var(--tz-negocio-color); }
      .tz-sa-rubro-fila-nombre { flex: 1 1 auto; font-weight: 700; }
      .tz-sa-rubro-fila-nombre small { color: var(--text-dim); font-weight: 600; }
      .tz-sa-rubro-fila-confirmar,
      .tz-sa-rubro-fila-error { flex-basis: 100%; margin: 0; }
      .tz-sa-negocio-fila-logo { width: 34px; height: 34px; border-radius: 8px; object-fit: contain; background: rgba(var(--fg-rgb),0.06); flex: 0 0 auto; }
      .tz-sa-negocio-fila-logo-vacio { display: flex; align-items: center; justify-content: center; color: var(--text-dim); }
      .tz-sa-negocio-fila-info { flex: 1 1 140px; min-width: 0; display: flex; flex-direction: column; font-size: 13px; }
      .tz-sa-negocio-fila-info span { color: var(--text-dim); font-size: 12px; }
      .tz-sa-nuevo-negocio { display: grid; grid-template-columns: 1.3fr 1fr 1fr auto; gap: 8px; align-items: center; }
      @media (max-width: 640px) { .tz-sa-nuevo-negocio { grid-template-columns: 1fr 1fr; } }
      .tz-sa-buscador { display: flex; align-items: center; gap: 8px; color: var(--text-dim); }
      .tz-sa-buscador .tz-text-input { flex: 1 1 auto; }
      .tz-sa-eliminar { border-color: rgba(var(--danger-rgb),0.6); }
      .tz-sa-eliminar-resumen { margin: 10px 0 14px; padding-left: 18px; display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
      .tz-sa-eliminar-resumen strong { color: var(--danger); }
      .tz-sa-mes-nav { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 4px; }

      .tz-dropdown-backdrop { position: fixed; inset: 0; z-index: 55; background: transparent; }
      .tz-gastos-sa-form { display: grid; grid-template-columns: 1.6fr 0.8fr 1fr auto; gap: 8px; align-items: center; }
      @media (max-width: 640px) { .tz-gastos-sa-form { grid-template-columns: 1fr 1fr; } }
      .tz-cierre-sa-totales { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); }
      @media (max-width: 520px) { .tz-cierre-sa-totales { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

      /* Gestor del plan del negocio (rayo): apartados + recarga rápida */
      .tz-plan-apartados { margin-bottom: 14px; }
      /* ---- Perfil del negocio ---- */
      .tz-logo-preview {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 110px;
        padding: 12px;
        border-radius: 12px;
        border: 1px dashed var(--border-soft);
        background:
          repeating-conic-gradient(rgba(var(--fg-rgb),0.05) 0% 25%, transparent 0% 50%) 0 0 / 16px 16px;
      }
      .tz-logo-preview img { max-width: 220px; max-height: 160px; width: auto; height: auto; display: block; }
      /* Marco del adaptador de logo: cuadriculado para ver lo transparente. */
      .tz-crop-area.tz-crop-area-logo {
        background:
          repeating-conic-gradient(rgba(var(--fg-rgb),0.08) 0% 25%, transparent 0% 50%) 0 0 / 18px 18px,
          #141022;
      }
      .tz-crop-porcentaje { flex: 0 0 auto; min-width: 40px; text-align: right; font-size: 12px; color: var(--cyan); }
      .tz-crop-centrar { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 4px; padding: 6px 10px; font-size: 12px; }
      .tz-perfil-logo { display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center; }
      @media (max-width: 480px) { .tz-perfil-logo { grid-template-columns: 1fr; } }
      .tz-perfil-descripcion { display: flex; align-items: center; gap: 8px; }
      .tz-perfil-descripcion .tz-text-input { flex: 1 1 auto; min-width: 0; }
      .tz-perfil-contador { font-size: 11px; color: var(--text-dim); min-width: 36px; text-align: right; }
      .tz-horario-dias { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
      .tz-horario-dia {
        display: grid;
        grid-template-columns: 88px auto 1fr;
        align-items: center;
        gap: 10px;
        padding: 6px 10px;
        border-radius: 10px;
        background: rgba(var(--fg-rgb),0.03);
        border: 1px solid var(--border-soft);
      }
      .tz-horario-dia-cerrado { opacity: 0.65; }
      .tz-horario-dia-nombre { font-size: 13px; color: var(--text); }
      .tz-horario-horas { display: flex; align-items: center; gap: 6px; justify-content: flex-end; font-size: 12px; color: var(--text-dim); }
      .tz-horario-horas .tz-text-input { width: 104px; padding: 6px 8px; }
      .tz-horario-cerrado-texto { color: var(--danger); }
      @media (max-width: 420px) {
        .tz-horario-dia { grid-template-columns: 1fr auto; }
        .tz-horario-horas { grid-column: 1 / -1; justify-content: flex-start; }
      }

      /* ---- Tema del negocio (Perfil → Tema) ---- */
      .tz-tema-presets { display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 8px; }
      .tz-tema-preset {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        padding: 10px;
        border-radius: 12px;
        border: 1.5px solid rgba(var(--fg-rgb), 0.12);
        cursor: pointer;
        font-family: inherit;
        text-align: left;
      }
      .tz-tema-preset { touch-action: manipulation; user-select: none; -webkit-user-select: none; }
      .tz-tema-preset-activa { border-color: var(--cyan); box-shadow: 0 0 0 2px rgba(var(--cyan-rgb), 0.35); }
      .tz-tema-preset-puntos { display: flex; gap: 4px; }
      .tz-tema-preset-puntos i { width: 14px; height: 14px; border-radius: 50%; display: block; box-shadow: 0 0 0 1px rgba(0,0,0,0.25); }
      .tz-tema-preset-nombre { font-size: 12px; font-weight: 700; }
      .tz-tema-preset-check {
        position: absolute; top: 6px; right: 6px;
        width: 18px; height: 18px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        background: var(--cyan); color: var(--on-cyan);
      }
      /* Temas por rubros: de 3 en 3 (los destacados y, con "Ver más",
         todos agrupados por rubro). */
      .tz-tema-tematicos, .tz-tema-grupos { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .tz-tema-grupos { display: grid; gap: 10px 8px; }
      .tz-tema-grupo { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
      .tz-tema-grupo-rubro {
        font-size: 10px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;
        color: var(--cyan); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .tz-tema-tematico { min-height: 92px; justify-content: flex-end; padding-left: 26px; min-width: 0; }
      .tz-tema-tematico .tz-tema-preset-nombre { font-size: 13px; text-shadow: 0 1px 2px #000; }
      .tz-tema-tematico-desc { font-size: 10.5px; line-height: 1.25; color: #d5dbe1; text-shadow: 0 1px 2px #000; }
      .tz-tema-pista { margin: -4px 0 0; font-size: 11px; text-align: center; color: var(--text-dim); }
      .tz-tema-ver-mas {
        align-self: center; display: inline-flex; align-items: center; gap: 6px;
        padding: 7px 16px; border-radius: 999px; cursor: pointer; font: inherit; font-size: 12px; font-weight: 700;
        background: rgba(var(--cyan-rgb), 0.1); color: var(--cyan); border: 1.5px solid rgba(var(--cyan-rgb), 0.4);
      }
      .tz-tema-ver-mas:hover { background: rgba(var(--cyan-rgb), 0.18); }
      @media (max-width: 520px) {
        .tz-tema-tematico { min-height: 78px; padding: 8px 6px 8px 14px; gap: 4px; }
        .tz-tema-tematico .tz-tema-preset-nombre { font-size: 11.5px; }
        .tz-tema-tematico-desc { display: none; }
      }
      /* Dentro de la vista previa los botones/cabecera no ocupan todo
         el ancho como en la app real. */
      .tz-tema-preview .tz-header { border-radius: 0; }
      .tz-tema-libre { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 12px; border: 1.5px solid rgba(var(--fg-rgb), 0.12); }
      .tz-tema-libre-activo { border-color: var(--cyan); }
      .tz-tema-libre input[type="color"] { width: 46px; height: 38px; border: none; background: none; padding: 0; cursor: pointer; flex-shrink: 0; }
      /* La vista previa recibe las variables del tema por style={...}:
         todo lo de adentro se pinta con ese tema. */
      .tz-tema-preview {
        border-radius: 14px;
        overflow: hidden;
        border: 1px solid var(--border-soft);
        color: var(--text);
        background:
          radial-gradient(ellipse 300px 160px at 15% 0%, rgba(var(--cyan-rgb), 0.12), transparent 60%),
          radial-gradient(ellipse 300px 160px at 95% 10%, rgba(var(--pink-rgb), 0.12), transparent 60%),
          linear-gradient(160deg, var(--bg-1), var(--bg-2) 55%, var(--bg-1));
      }
      .tz-tema-preview-cabecera {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 8px;
        padding: 10px;
        border-bottom: 1px solid var(--border-soft);
      }
      .tz-tema-preview-cabecera .tz-header-btn { pointer-events: none; padding: 6px 8px; }
      .tz-tema-preview-centro { display: flex; flex-direction: column; align-items: center; gap: 4px; }
      .tz-tema-preview-centro img { width: 54px; height: auto; }
      .tz-tema-preview-cuerpo { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 10px; }
      .tz-tema-preview-cuerpo > :nth-child(n+3) { grid-column: 1 / -1; }
      .tz-tema-preview-cuerpo button { pointer-events: none; }
      .tz-tema-preview-producto {
        display: flex; flex-direction: column; gap: 2px;
        padding: 10px 12px; border-radius: 12px;
        background: var(--panel); border: 1px solid rgba(var(--cyan-rgb), 0.3);
        font-size: 13px; color: var(--text-dim);
      }
      .tz-tema-preview-producto strong { color: var(--text); font-size: 14px; }
      .tz-tema-preview-precio { align-self: flex-end; font-family: 'Orbitron', sans-serif; color: var(--pink); font-size: 15px; }

      /* ---- Texto debajo del logo de la tienda: mensajes en secuencia
         que se escriben desde el centro y se borran al revés. ---- */
      /* --tz-sub-dy: en la tienda se centra entre el logo y la barra de
         filtros (CatalogPage lo mide); "translate" no toca a "transform"
         ni mueve nada más. */
      .tz-subtitle-maquina { min-height: 1.6em; white-space: pre; translate: 0 var(--tz-sub-dy, 0px); --tz-sub-ajuste: -23px; }
      /* Tienda: el texto flota centrado sobre un espacio de alto fijo (una
         línea), así pasar a 2 líneas no empuja el borde de la cabecera. */
      .tz-subtitle-slot { position: relative; width: 100%; height: 24px; flex: 0 0 auto; }
      .tz-subtitle-slot > .tz-subtitle-maquina {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: max-content;
        margin: 0;
      }
      /* Caja: el nombre de la sucursal y la etiqueta de estado suben un
         poco (el logo cuadrado deja aire transparente abajo); así la
         cabecera queda más baja. La tienda centra su texto aparte. */
      .tz-subtitle-hueco {
        /* El centro del hueco (donde va el texto) queda 8 px más arriba;
           su borde de abajo —y la etiqueta de estado— no se mueven. */
        height: 58px;
        margin-top: -50px;
        display: flex;
        align-items: center;
        justify-content: center;
        max-width: 100%;
      }
      .tz-header-center > .tz-conn-indicator { margin-top: 0; }
      /* Más de ~20 caracteres → pasa a una 2.ª línea (como máximo 2), en
         la caja y en los mensajes programados de la tienda. */
      .tz-subtitle-hueco .tz-subtitle,
      .tz-header .tz-subtitle-maquina {
        max-width: min(100%, 230px);
        box-sizing: border-box;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      /* Celular (todos los diseños): el texto no pasa del espacio entre
         las dos columnas de botones; si no entra, baja a una 2.ª línea. */
      @media (max-width: 767px) {
        .tz-header .tz-subtitle {
          white-space: pre-wrap;
          max-width: 100%;
          box-sizing: border-box;
          overflow-wrap: anywhere;
          font-size: 10px;
          letter-spacing: 0.05em;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      }
      .tz-subtitle-cursor {
        display: inline-block;
        width: 2px;
        height: 1em;
        margin-left: 2px;
        vertical-align: -0.12em;
        background: currentColor;
        animation: tz-subtitle-parpadeo 0.9s steps(1) infinite;
      }
      @keyframes tz-subtitle-parpadeo { 50% { opacity: 0; } }

      /* Tarjetas de datos del gestor (igual que el gestor de Taxi-PE). */
      .tz-gestor-recarga-datos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-bottom: 14px; }
      .tz-gestor-recarga-dato {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 10px 12px;
        border-radius: 12px;
        background: rgba(var(--fg-rgb),0.03);
        border: 1px solid var(--border-soft);
        font-size: 13px;
      }
      .tz-gestor-recarga-dato strong { color: var(--text); font-size: 14px; }
      .tz-gestor-recarga-dato span { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.04em; }
      .tz-recarga-bloqueada { line-height: 1.3; text-align: center; }
      .tz-recarga-comprobante-botones { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .tz-recarga-vuelto-rapidos { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
      .tz-recarga-vuelto-rapidos .tz-gasto-tipo-btn { flex: 0 0 auto; padding: 6px 10px; font-size: 12px; }
      .tz-recarga-vuelto-resultado { margin: 8px 0 0; font-family: 'Orbitron', sans-serif; font-size: 18px; color: var(--green); }
      .tz-recarga-vuelto-falta { color: var(--danger); }
      .tz-plan-pagos li { align-items: center; }
      .tz-plan-pago-codigo { font-family: 'Orbitron', sans-serif; font-size: 12px; color: var(--cyan); }
      .tz-plan-pago-anulado { opacity: 0.55; }
      .tz-plan-pago-anulado > span:not(.tz-tag) { text-decoration: line-through; }
      .tz-plan-pago-ver {
        border: none;
        background: none;
        padding: 0;
        color: var(--cyan);
        text-decoration: underline;
        cursor: pointer;
        font-family: inherit;
        font-size: 12px;
      }
      .tz-plan-pago-confirmar { flex-basis: 100%; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 12px; color: var(--yellow); }
      .tz-receipt.tz-plan-pago-anulado .tz-receipt-row { text-decoration: line-through; }
      .tz-receipt .tz-plan-pago-ver { margin-top: 8px; }
      /* Visor chico del comprobante adjunto (historiales): miniatura que
         se amplía al tocarla. */
      .tz-comprobante-mini {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        margin-top: 10px;
        padding: 6px;
        border-radius: 10px;
        border: 1px dashed rgba(var(--cyan-rgb),0.35);
        background: rgba(var(--cyan-rgb),0.05);
        color: var(--cyan);
        font-family: inherit;
        font-size: 12px;
        text-align: left;
        cursor: pointer;
      }
      .tz-comprobante-mini img { width: 52px; height: 52px; object-fit: cover; border-radius: 8px; flex-shrink: 0; background: #fff; }
      .tz-comprobante-mini:hover { background: rgba(var(--cyan-rgb),0.12); }
      button.tz-history-row-photo-link { border: none; background: none; padding: 0; cursor: zoom-in; }
      /* Lista arrastrable (gestor de Planes, igual que Configurar
         Membresías de Taxi-PE). */
      .tz-paquete-draggable-li { display: flex; align-items: stretch; gap: 4px; }
      .tz-paquete-draggable-li.tz-paquete-dragging {
        z-index: 5;
        box-shadow: 0 8px 24px rgba(var(--shadow-rgb),0.4), 0 0 0 1.5px var(--cyan);
      }
      .tz-drag-handle {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        border: none;
        background: transparent;
        color: var(--text-dim);
        cursor: grab;
        touch-action: none;
      }
      .tz-drag-handle:hover { color: var(--cyan); background: rgba(var(--cyan-rgb),0.1); }
      .tz-drag-handle:active { cursor: grabbing; }
      /* Desplegable de venta registrada (super admin / Recarga rápida):
         la misma barra inferior de la caja, encima de los modales. */
      .tz-submitbar.tz-panel-venta { z-index: 140; }
      .tz-panel-venta .tz-submitbar-content { max-width: 520px; width: 100%; margin: 0 auto; }
      .tz-panel-venta .tz-whatsapp-send-btn { width: 100%; justify-content: center; box-sizing: border-box; }
      /* Historial (solo consulta): filtro + buscador */
      .tz-historial-filtros { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 12px; }
      .tz-historial-filtros .tz-gasto-tipo-btn { flex: 0 0 auto; padding: 7px 12px; }
      .tz-footer-btn-2lineas { display: inline-block; line-height: 1.15; text-align: center; }

      /* ---- Renovar plan (admin del negocio) ---- */
      .tz-renovar-planes { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }
      .tz-renovar-plan {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
        padding: 12px 14px;
        border-radius: 14px;
        border: 1.5px solid var(--border-soft);
        background: rgba(var(--fg-rgb),0.03);
        color: var(--text);
        text-align: left;
        cursor: pointer;
        font-family: inherit;
        transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
      }
      .tz-renovar-plan:hover { transform: translateY(-1px); }
      .tz-renovar-plan-activo { border-color: var(--green); box-shadow: 0 0 16px rgba(var(--green-rgb),0.35); }
      .tz-renovar-plan-nombre { font-weight: 700; display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
      .tz-renovar-plan-actual {
        font-size: 10px;
        padding: 1px 7px;
        border-radius: 999px;
        border: 1px solid var(--cyan);
        color: var(--cyan);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .tz-renovar-plan-precio { font-family: 'Orbitron', sans-serif; font-size: 18px; color: var(--green); }
      .tz-renovar-plan-detalle { font-size: 12px; color: var(--text-dim); }
      .tz-renovar-plan-detalle strong { color: var(--yellow); }
      .tz-renovar-datos { display: flex; flex-direction: column; gap: 8px; }
      .tz-renovar-copiar {
        display: grid;
        grid-template-columns: 1fr auto;
        grid-template-areas: "etiqueta accion" "valor accion";
        align-items: center;
        gap: 2px 12px;
        width: 100%;
        padding: 10px 14px;
        border-radius: 12px;
        border: 1.5px dashed rgba(var(--cyan-rgb),0.55);
        background: rgba(var(--cyan-rgb),0.06);
        color: var(--text);
        text-align: left;
        cursor: pointer;
        font-family: inherit;
      }
      .tz-renovar-copiar-ok { border-style: solid; border-color: var(--green); background: rgba(var(--green-rgb),0.1); }
      .tz-renovar-copiar-etiqueta { grid-area: etiqueta; font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; }
      .tz-renovar-copiar-valor { grid-area: valor; font-size: 16px; font-weight: 700; letter-spacing: 0.03em; word-break: break-all; }
      .tz-renovar-copiar-accion { grid-area: accion; display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; color: var(--cyan); }
      .tz-renovar-copiar-ok .tz-renovar-copiar-accion { color: var(--green); }
      .tz-renovar-comprobante { display: block; max-width: 100%; max-height: 260px; margin: 10px auto 0; border-radius: 12px; border: 1px solid var(--border-soft); }
      .tz-renovar-estado { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; padding: 10px 0; }
      .tz-renovar-estado h3 { margin: 0; color: var(--yellow); }
      .tz-renovar-estado-icono {
        width: 58px;
        height: 58px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--yellow);
        background: rgba(var(--yellow-rgb),0.1);
        box-shadow: 0 0 22px rgba(var(--yellow-rgb),0.35);
      }

      /* ---- Centro de Peticiones (super admin) ---- */
      .tz-peticiones-plan-lista { display: flex; flex-direction: column; gap: 12px; }
      .tz-peticion-plan {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 14px;
        border-radius: 14px;
        border: 1.5px solid color-mix(in srgb, var(--tz-negocio-color) 55%, transparent);
        background: color-mix(in srgb, var(--tz-negocio-color) 6%, transparent);
      }
      .tz-peticion-plan-cabecera { display: flex; align-items: center; gap: 12px; }
      .tz-peticion-plan-logo { width: 44px; height: 44px; border-radius: 12px; object-fit: contain; background: rgba(var(--fg-rgb),0.06); flex: 0 0 auto; }
      .tz-peticion-plan-logo-vacio { display: flex; align-items: center; justify-content: center; color: var(--text-dim); }
      .tz-peticion-plan-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1 1 auto; font-size: 13px; }
      .tz-peticion-plan-info b { color: var(--green); }
      .tz-peticion-plan-fecha { font-size: 12px; color: var(--text-dim); }
      .tz-peticion-plan-estado { flex: 0 0 auto; font-size: 11px; font-weight: 800; padding: 3px 9px; border-radius: 999px; text-transform: uppercase; }
      .tz-peticion-plan-estado-aprobado { color: var(--green); border: 1px solid var(--green); }
      .tz-peticion-plan-estado-rechazado { color: var(--danger); border: 1px solid var(--danger); }
      .tz-peticion-plan-comprobante { padding: 0; border: none; background: none; cursor: zoom-in; align-self: flex-start; }
      .tz-peticion-plan-comprobante img { max-height: 180px; max-width: 100%; border-radius: 10px; border: 1px solid var(--border-soft); }
      .tz-peticion-plan-rechazo { display: flex; flex-direction: column; gap: 8px; }
      .tz-plan-suspendido-pagar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-top: 14px;
        text-decoration: none;
      }
      .tz-dir-afiliar {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin: 22px auto 6px;
        max-width: 420px;
        padding: 14px 18px;
        border-radius: 14px;
        border: 1px dashed rgba(var(--cyan-rgb),0.55);
        background: rgba(var(--cyan-rgb),0.06);
        color: var(--cyan);
        text-decoration: none;
        font-size: 14px;
        text-align: center;
      }
      .tz-dir-afiliar strong { color: var(--text); }
      .tz-dir-afiliar:hover { background: rgba(var(--cyan-rgb),0.12); }
      @media (max-width: 480px) {
        .tz-plan-pago-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .tz-plan-aviso { flex-wrap: wrap; }
      }
      .tz-sa-negocio-admin-ok {
        margin: 0;
        font-size: 11.5px;
        color: var(--yellow);
        text-align: center;
      }

      /* ---- Gestor de Cuentas (super-admin) ---- */
      .tz-sa-cuentas-btn {
        background: transparent;
        border: 1px solid rgba(var(--cyan-rgb),0.4);
        color: var(--cyan);
      }
      .tz-cuentas-filtros {
        display: flex;
        gap: 10px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }
      .tz-cuentas-filtros .tz-text-input { flex: 1 1 200px; }
      .tz-cuentas-row {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 12px 14px;
        width: 100%;
      }
      .tz-cuentas-nombre {
        font-weight: 700;
        color: var(--text);
        display: flex;
        align-items: center;
      }
      .tz-cuentas-detalle {
        font-size: 12.5px;
        color: var(--text-dim);
      }
      .tz-cuentas-search-icon {
        position: absolute;
        left: 11px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-dim);
        pointer-events: none;
      }
      .tz-cuentas-search-input { padding-left: 32px; }

      /* ---- Estadísticas (super-admin) ---- */
      .tz-est-table-wrap { overflow-x: auto; }
      .tz-est-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }
      .tz-est-table th, .tz-est-table td {
        padding: 10px 12px;
        text-align: left;
        white-space: nowrap;
        border-bottom: 1px solid var(--border-soft);
      }
      .tz-est-table th {
        font-family: 'Orbitron', sans-serif;
        font-size: 10.5px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--text-dim);
      }
      .tz-est-table tbody tr:hover { background: rgba(var(--fg-rgb),0.03); }
      .tz-est-table tfoot td {
        font-weight: 700;
        color: var(--cyan);
        border-bottom: none;
        border-top: 1.5px solid rgba(var(--cyan-rgb),0.4);
      }

      .tz-sa-negocio-card-new {
        align-items: stretch;
        justify-content: center;
        border-style: dashed;
        border-color: rgba(var(--cyan-rgb),0.3);
        min-height: 180px;
        gap: 10px;
      }
      .tz-sa-add-negocio-btn {
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: none;
        border: none;
        color: var(--cyan);
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        cursor: pointer;
      }
    `}</style>
  );
}
