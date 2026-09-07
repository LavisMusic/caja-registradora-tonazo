import html2canvas from "html2canvas";

// Rasteriza el nodo de una boleta (TicketBoleta montado fuera de
// pantalla) a PNG y lo copia al portapapeles, para pegarlo a mano en un
// chat de WhatsApp (wa.me no admite adjuntar un archivo directo).
// Copiado de App.jsx (copiarBoletaAlPortapapeles) para reutilizarlo
// también desde el Gestor de Pedidos y el checkout del cliente.
export async function copiarBoletaAlPortapapeles(nodeRef) {
  if (!nodeRef.current) {
    throw new Error("No se pudo preparar la boleta. Intenta de nuevo.");
  }
  if (!navigator.clipboard?.write || typeof window.ClipboardItem !== "function") {
    throw new Error("Este navegador no permite copiar imágenes al portapapeles.");
  }
  try {
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
    const canvas = await Promise.race([canvasPromise, timeoutPromise]);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("No se pudo generar la imagen de la boleta.");
    await navigator.clipboard.write([new window.ClipboardItem({ "image/png": blob })]);
  } catch (err) {
    if (err?.message === "TIMEOUT_RENDER") {
      throw new Error(
        "No se pudo generar la imagen en este dispositivo (tardó demasiado). Intenta de nuevo."
      );
    }
    throw err;
  }
}
