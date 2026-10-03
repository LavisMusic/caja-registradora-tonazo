import { useEffect } from "react";
import { cssTema, resolverPaleta } from "../lib/tema";

// Aplica el tema de un negocio: inyecta una hoja con las variables del
// tema DESPUÉS de <Styles /> (mismo selector, así gana por orden) para
// .tz-root y .tz-portal. Se monta solo en la caja (admin/cajero) y en la
// tienda pública del negocio — el super admin, el directorio general y
// las bienvenidas se quedan con el tema original. Sin tema → no hace
// nada (queda "Neón Tonazo").
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
  return <style data-tema-negocio="">{cssTema(tema)}</style>;
}
