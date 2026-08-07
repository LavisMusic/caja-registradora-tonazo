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
      /* Distribución en 3 zonas: izquierda (Fiados) / centro (logo) /
         derecha (Métodos de pago). */
      .tz-header-row {
        width: 100%;
        max-width: 100%;
        margin: 0 auto;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        overflow: visible;
      }
      .tz-header-center {
        flex: 1 1 auto;
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
         desaparece del todo). */
      .tz-main {
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
        margin: 0;
        padding-left: 12px;
        padding-right: 12px;
        padding-top: 20px;
        padding-bottom: calc(var(--tz-footer-h, 0px) + 24px);
        overflow-x: hidden;
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
        transition: transform 0.12s ease, box-shadow 0.15s ease;
        display: flex;
        flex-direction: column;
        gap: 14px;
        min-height: 148px;
      }
      .tz-card:hover { transform: translateY(-2px); }
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

      .tz-card-top { display: flex; justify-content: space-between; gap: 10px; }
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
        margin-top: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
        border-top: 1px dashed rgba(255,255,255,0.12);
        padding-top: 12px;
      }
      .tz-card-stockrow { display: flex; }
      .tz-tag {
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

      @keyframes tz-drop-in {
        from { opacity: 0; transform: translateY(-6px); }
        to { opacity: 1; transform: translateY(0); }
      }

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
      }
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
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 7px 10px;
        border-radius: 8px;
        background: rgba(255,255,255,0.03);
        border: 1px solid var(--border-soft);
        font-size: 12.5px;
      }
      .tz-cart-row-name {
        flex: 1 1 auto;
        min-width: 0;
        text-align: left;
        color: var(--text);
        font-weight: 600;
        overflow-wrap: anywhere;
      }
      .tz-cart-row-qty {
        flex: 0 0 auto;
        color: var(--text-dim);
        font-weight: 700;
      }
      .tz-cart-row-amount {
        flex: 0 0 auto;
        color: var(--pink);
        font-weight: 700;
      }

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
      .tz-vis-category {
        border: 1px solid var(--border-soft);
        border-radius: 12px;
        overflow: hidden;
        background: rgba(255,255,255,0.02);
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
      .tz-cliente-action-deuda { border-color: rgba(255,84,112,0.4); color: var(--danger); }
      .tz-cliente-action-deuda:hover { background: rgba(255,84,112,0.12); }
      .tz-cliente-action-pago { border-color: rgba(57,255,176,0.4); color: var(--green); }
      .tz-cliente-action-pago:hover { background: rgba(57,255,176,0.12); }
      .tz-cliente-action-whatsapp { border-color: rgba(37,211,102,0.5); color: #25d366; }
      .tz-cliente-action-whatsapp:hover { background: rgba(37,211,102,0.14); }

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
      .tz-gasto-item-qty { flex: 1 1 64px; text-align: center; padding-left: 4px; padding-right: 4px; }
      .tz-gasto-item-price { flex: 1 1 76px; text-align: center; padding-left: 4px; padding-right: 4px; }
      .tz-gasto-item-subtotal {
        flex: 1 1 auto;
        min-width: 60px;
        font-size: 11.5px;
        font-weight: 700;
        color: var(--text-dim);
        white-space: nowrap;
        text-align: right;
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
    `}</style>
  );
}
