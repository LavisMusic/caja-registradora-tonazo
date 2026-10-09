import { useEffect, useRef } from "react";
import { cssTema, resolverPaleta } from "../lib/tema";
import { tematicoDe } from "../lib/tematicos";

// Aplica el tema de un negocio: inyecta una hoja con las variables del
// tema DESPUÉS de <Styles /> (mismo selector, así gana por orden) para
// .tz-root y .tz-portal. Se monta solo en la caja (admin/cajero) y en la
// tienda pública del negocio — el super admin, el directorio general y
// las bienvenidas se quedan con el tema original. Sin tema → no hace
// nada (queda "Neón Tonazo").
// Si el tema es un temático con `escena` (ej. Marino: agua, peces,
// burbujas, algas), además dibuja esa escena en una capa FIJA detrás de
// todo el contenido (.tz-escena, z-index -1; sus estilos y animaciones
// vienen en la hoja del temático). Debe montarse DENTRO de .tz-root.
// También pinta la barra del navegador del celular (theme-color) con el
// fondo del tema mientras está montado.
export default function TemaNegocio({ tema }) {
  const fondo = tema ? resolverPaleta(tema).fondo1 : null;
  useEffect(() => {
    if (!fondo) return undefined;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return undefined;
    const anterior = meta.getAttribute("content");
    meta.setAttribute("content", fondo);
    return () => {
      if (anterior != null) meta.setAttribute("content", anterior);
    };
  }, [fondo]);

  // La escena sabe dónde termina la barra de filtros (o la cabecera, si
  // no hay barra) con la página arriba del todo: --tz-bajo-barra, en px
  // desde el borde de arriba (incluye el desvanecido de la barra). Así los
  // temas pueden dejar esa zona libre (ej. los animales de la Granja).
  const escenaRef = useRef(null);
  const escena = tema ? tematicoDe(tema)?.escena : null;
  useEffect(() => {
    const el = escenaRef.current;
    if (!el) return undefined;
    let cuadro = 0;
    const medir = () => {
      cuadro = 0;
      const tope = document.querySelector(".tz-header + .tz-admin-filterbar") || document.querySelector(".tz-header");
      if (!tope) return el.style.removeProperty("--tz-bajo-barra");
      el.style.setProperty("--tz-bajo-barra", `${Math.round(tope.getBoundingClientRect().bottom + window.scrollY)}px`);
    };
    // La barra aparece y cambia de alto después (carga de datos, cambio de
    // pantalla): se vuelve a medir con cada cambio, como mucho una vez cada
    // 60 ms (con temporizador: requestAnimationFrame no corre si la pestaña
    // no está a la vista).
    const pedir = () => {
      if (!cuadro) cuadro = setTimeout(medir, 60);
    };
    medir();
    const cambios = new MutationObserver(pedir);
    cambios.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", pedir);
    return () => {
      cambios.disconnect();
      window.removeEventListener("resize", pedir);
      clearTimeout(cuadro);
    };
  }, [escena]);

  if (!tema) return null;
  return (
    <>
      <style data-tema-negocio="">{cssTema(tema)}</style>
      {escena && (
        <div ref={escenaRef} className="tz-escena" aria-hidden="true">
          {escena.map((el, i) => (
            <div key={i} className={el.clase} style={el.estilo} />
          ))}
        </div>
      )}
    </>
  );
}
