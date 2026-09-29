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

// Imprime SOLO la boleta, formateada para ticketera térmica estándar:
// rollo de 80 mm con 72 mm de área imprimible (576 puntos a 203 dpi,
// el formato más común de las ticketeras POS). Se imprime desde un
// iframe aislado en vez de window.print() sobre la página entera —
// antes se ocultaba todo lo demás con visibility:hidden, que sigue
// ocupando espacio (salían hojas en blanco) y la boleta quedaba chica,
// arriba a la izquierda de una hoja A4. Fondo blanco + texto negro
// puro: una térmica no imprime grises, los degrada a puntos sueltos.
export function imprimirBoleta(nodeRef) {
  const nodo = nodeRef.current;
  if (!nodo) throw new Error("No se pudo preparar la boleta. Intenta de nuevo.");

  const clon = nodo.cloneNode(true);
  // URLs absolutas: el iframe no comparte la base relativa de la app.
  clon.querySelectorAll("img").forEach((img) => img.setAttribute("src", img.src));

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  doc.open();
  // La hoja ES la boleta: 80 mm de ancho, y el contenido la ocupa entera
  // (4 mm de margen a cada lado = los 72 mm imprimibles del cabezal).
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>Boleta</title><style>
    html, body { margin: 0; padding: 0; background: #fff; }
    body { width: 80mm; }
    .boleta > div {
      width: 80mm !important;
      box-sizing: border-box !important;
      padding: 4mm 4mm 6mm !important;
      background: #fff !important;
    }
    .boleta, .boleta * { color: #000 !important; border-color: #000 !important; }
    .boleta img { max-width: 40mm !important; height: auto !important; filter: grayscale(1) contrast(1.4); }
  </style></head><body><div class="boleta">${clon.innerHTML}</div></body></html>`);
  doc.close();

  const imprimir = () => {
    // Sin @page size, el navegador usa el papel POR DEFECTO de la
    // impresora (A4 en la mayoría de los drivers): la boleta quedaba
    // chica en el medio de una hoja entera. Acá la hoja se define con el
    // ancho del rollo y el alto EXACTO del contenido ya renderizado
    // (logo incluido — por eso se mide recién después de cargarlo), así
    // el rollo corta justo donde termina la boleta, sin papel en blanco.
    const altoPx = doc.documentElement.scrollHeight;
    const altoMm = Math.ceil((altoPx * 25.4) / 96) + 2;
    const pagina = doc.createElement("style");
    pagina.textContent = `@page { size: 80mm ${altoMm}mm; margin: 0; }`;
    doc.head.appendChild(pagina);

    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    // El diálogo de impresión es bloqueante en la mayoría de navegadores;
    // el margen extra cubre a los que no lo son.
    setTimeout(() => iframe.remove(), 1500);
  };
  const pendientes = [...doc.images].filter((img) => !img.complete);
  if (pendientes.length === 0) {
    imprimir();
    return;
  }
  Promise.all(
    pendientes.map((img) => new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; }))
  ).then(imprimir);
}
