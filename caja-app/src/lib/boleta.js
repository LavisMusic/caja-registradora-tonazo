import html2canvas from "html2canvas";

// Rasteriza el nodo de una boleta (TicketBoleta montado fuera de
// pantalla) a PNG. Intenta copiarlo al portapapeles (para pegarlo a mano
// en WhatsApp); si el navegador no lo permite —pasa en HTTP que no sea
// localhost, o en algunos navegadores— DESCARGA la imagen como fallback,
// así el cajero igual la puede adjuntar.
//
// Devuelve { copiado, descargado }.
export async function copiarBoletaAlPortapapeles(nodeRef) {
  if (!nodeRef.current) {
    throw new Error("No se pudo preparar la boleta. Intenta de nuevo.");
  }

  const isMobile = window.innerWidth < 768;
  const canvasPromise = html2canvas(nodeRef.current, {
    scale: isMobile ? 1.5 : 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#f8fafc",
  });
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("TIMEOUT_RENDER")), 12000)
  );

  let canvas;
  try {
    canvas = await Promise.race([canvasPromise, timeoutPromise]);
  } catch (err) {
    if (err?.message === "TIMEOUT_RENDER") {
      throw new Error("No se pudo generar la imagen en este dispositivo (tardó demasiado). Intenta de nuevo.");
    }
    throw err;
  }

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("No se pudo generar la imagen de la boleta.");

  // Camino ideal: copiar al portapapeles (necesita HTTPS o localhost).
  if (navigator.clipboard?.write && typeof window.ClipboardItem === "function") {
    try {
      await navigator.clipboard.write([new window.ClipboardItem({ "image/png": blob })]);
      return { copiado: true, descargado: false };
    } catch {
      /* cae al fallback de descarga */
    }
  }

  // Fallback: descargar la imagen para adjuntarla a mano en el chat.
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `boleta-${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return { copiado: false, descargado: true };
}
