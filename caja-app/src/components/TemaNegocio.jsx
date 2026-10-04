import { useEffect } from "react";
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

  if (!tema) return null;
  const escena = tematicoDe(tema)?.escena;
  return (
    <>
      <style data-tema-negocio="">{cssTema(tema)}</style>
      {escena && (
        <div className="tz-escena" aria-hidden="true">
          {escena.map((el, i) => (
            <div key={i} className={el.clase} style={el.estilo} />
          ))}
        </div>
      )}
    </>
  );
}
