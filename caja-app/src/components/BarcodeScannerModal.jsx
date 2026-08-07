import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X } from "lucide-react";

const SCANNER_ELEMENT_ID = "tz-barcode-scanner-region";
// Ventana de debounce en modo continuo: mientras la cámara sigue
// enfocando el mismo código físico dispara el callback varias veces
// por segundo — sin este corte, "Modo Hormiga" sumaría de más por un
// solo acercamiento de producto.
const CONTINUOUS_DEBOUNCE_MS = 1500;

/* Escáner híbrido: acepta tanto códigos de barras 1D (EAN/UPC, para
   productos comprados a proveedores) como códigos QR 2D. Usa la
   cámara trasera del dispositivo por defecto.

   Dos modos:
   - continuous=false (default): onScan se dispara UNA sola vez por
     apertura y la cámara se detiene apenas hay un match — quien lo
     use decide si reabre el modal para escanear otro código.
   - continuous=true ("Modo Hormiga"): la cámara sigue activa después
     de cada match, y onScan se puede disparar repetidas veces (con
     debounce) para que escanear el mismo código varias veces seguidas
     sin cerrar la ventana sume de a uno. Quien lo use debe cerrar el
     modal explícitamente (botón X / onClose) cuando termine. También
     acepta un nodo 'feedback' que se muestra debajo de la cámara para
     dar información en vivo (ej. "Producto X — Cantidad: 3") sin
     tener que cerrar el modal para verla. */
export default function BarcodeScannerModal({ onScan, onClose, continuous = false, feedback }) {
  const [cameraError, setCameraError] = useState("");
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      SCANNER_ELEMENT_ID,
      {
        fps: 10,
        qrbox: { width: 260, height: 160 },
        rememberLastUsedCamera: true,
        videoConstraints: { facingMode: "environment" },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.ITF,
        ],
      },
      /* verbose= */ false
    );

    let handled = false; // solo se usa en modo no-continuo
    const lastScan = { code: null, time: 0 }; // solo se usa en modo continuo

    scanner.render(
      (decodedText) => {
        if (!continuous) {
          if (handled) return;
          handled = true;
          // Corta la cámara apenas hay un match — evita seguir leyendo
          // el mismo código en bucle mientras el padre procesa/cierra.
          scanner.clear().catch(() => {});
          onScanRef.current(decodedText);
          return;
        }

        const now = Date.now();
        if (lastScan.code === decodedText && now - lastScan.time < CONTINUOUS_DEBOUNCE_MS) {
          return;
        }
        lastScan.code = decodedText;
        lastScan.time = now;
        onScanRef.current(decodedText);
      },
      () => {
        // Se llama en CADA frame sin código detectado — es el flujo
        // normal, no un error real, así que se ignora.
      }
    );

    // Si el navegador/dispositivo no puede abrir la cámara (permiso
    // denegado, sin HTTPS, sin cámara), html5-qrcode dibuja su propio
    // mensaje de error dentro del contenedor — igual mostramos un
    // aviso propio por si ese mensaje no es visible con el tema oscuro.
    setTimeout(() => {
      const el = document.getElementById(SCANNER_ELEMENT_ID);
      if (el && el.querySelector("img[alt='Info icon']")) {
        setCameraError("No se pudo acceder a la cámara. Revisa los permisos del navegador.");
      }
    }, 1500);

    return () => {
      handled = true;
      scanner.clear().catch(() => {});
    };
  }, [continuous]);

  return (
    <div className="tz-modal-backdrop" onClick={onClose}>
      <div className="tz-modal" onClick={(e) => e.stopPropagation()}>
        <button className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <div className="tz-payment-modal">
          <h2>Escanear Producto</h2>
          <p className="tz-stock-editor-sub">
            {continuous
              ? "Escanea el mismo código varias veces seguidas para sumar unidades, sin cerrar esta ventana."
              : "Apunta la cámara al código de barras o QR del producto."}
          </p>
          {cameraError && <p className="tz-error">{cameraError}</p>}
          <div id={SCANNER_ELEMENT_ID} className="tz-barcode-scanner-region" />
          {feedback && <div className="tz-scanner-feedback">{feedback}</div>}
        </div>
      </div>
    </div>
  );
}
