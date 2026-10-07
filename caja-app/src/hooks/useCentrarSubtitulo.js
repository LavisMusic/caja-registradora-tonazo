import { useCallback, useRef } from "react";

// Tienda: el texto que se escribe debajo del logo queda PERFECTAMENTE
// centrado entre el borde de abajo del logo y la línea de arriba de la
// barra de filtros (o el final de la cabecera, si no hay barra). Solo se
// mueve el texto (CSS "translate" con --tz-sub-dy, Styles.jsx): la
// cabecera, el logo y la barra quedan donde están. Cada tema tiene una
// cabecera de distinto alto, por eso se mide en vivo y se vuelve a medir
// cuando algo cambia de tamaño (tema, pantalla, logo, texto en 2 líneas).
// Devuelve un "callback ref" para el <header>.
export function useCentrarSubtitulo() {
  const limpiar = useRef(null);

  return useCallback((header) => {
    if (limpiar.current) {
      limpiar.current();
      limpiar.current = null;
    }
    if (!header) return;

    let cuadro = 0;
    const medir = () => {
      const logo = header.querySelector(".tz-logo");
      const sub = header.querySelector(".tz-subtitle-maquina");
      if (!logo || !sub) return;
      const actual = parseFloat(sub.style.getPropertyValue("--tz-sub-dy")) || 0;
      const rl = logo.getBoundingClientRect();
      const rs = sub.getBoundingClientRect();
      const barra = header.nextElementSibling;
      // Si el tema monta una franja sobre el borde de la barra (espuma,
      // pasto, bolas de helado…), la línea que se ve es la de la franja.
      const sobreBarra = parseFloat(getComputedStyle(header).getPropertyValue("--tz-sobre-barra")) || 0;
      const limite = barra?.classList.contains("tz-admin-filterbar") ? barra.getBoundingClientRect().top - sobreBarra : header.getBoundingClientRect().bottom;
      const arribaSinMover = rs.top - actual;
      const objetivo = rl.bottom + (limite - rl.bottom - rs.height) / 2;
      const dy = Math.round(objetivo - arribaSinMover);
      if (dy !== actual) sub.style.setProperty("--tz-sub-dy", `${dy}px`);
    };
    const pedir = () => {
      cancelAnimationFrame(cuadro);
      cuadro = requestAnimationFrame(medir);
    };

    const ro = new ResizeObserver(pedir);
    ro.observe(header);
    const sub = header.querySelector(".tz-subtitle-maquina");
    if (sub) ro.observe(sub);
    const logo = header.querySelector(".tz-logo");
    if (logo) logo.addEventListener("load", pedir);
    window.addEventListener("resize", pedir);
    pedir();

    limpiar.current = () => {
      cancelAnimationFrame(cuadro);
      ro.disconnect();
      if (logo) logo.removeEventListener("load", pedir);
      window.removeEventListener("resize", pedir);
    };
  }, []);
}
