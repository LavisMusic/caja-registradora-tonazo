import { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import { Check, Loader2, X, ZoomIn } from "lucide-react";

// Adapta el logo del negocio antes de subirlo (Perfil del negocio):
//   * Formato: Cuadrado 512×512, Horizontal 900×300 o Vertical 480×640 —
//     el logo se guarda EXACTAMENTE a ese tamaño, así se ve igual de
//     nítido en la cabecera, la tienda, el directorio y la boleta.
//   * Modo "Recortar": se arrastra/zoomea dentro del marco (llena todo).
//     Modo "Ajustar": el logo entra entero, centrado, con fondo
//     transparente (para logos que no se pueden cortar).
// Sale siempre en PNG (conserva la transparencia). onConfirm(blob).
export const FORMATOS_LOGO = [
  { id: "cuadrado", label: "Cuadrado", ancho: 512, alto: 512 },
  { id: "horizontal", label: "Horizontal", ancho: 900, alto: 300 },
  { id: "vertical", label: "Vertical", ancho: 480, alto: 640 },
];

function cargarImagen(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar la imagen."));
    img.src = src;
  });
}

async function generarLogo(src, formato, modo, areaPixels) {
  const img = await cargarImagen(src);
  const canvas = document.createElement("canvas");
  canvas.width = formato.ancho;
  canvas.height = formato.alto;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  if (modo === "recortar" && areaPixels) {
    ctx.drawImage(img, areaPixels.x, areaPixels.y, areaPixels.width, areaPixels.height, 0, 0, canvas.width, canvas.height);
  } else {
    // Ajustar: "contain" centrado, sin deformar.
    const escala = Math.min(canvas.width / img.width, canvas.height / img.height);
    const w = img.width * escala;
    const h = img.height * escala;
    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  }
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo generar el logo."))), "image/png")
  );
}

export default function LogoAdaptadorModal({ imageSrc, onCancel, onConfirm }) {
  const [formato, setFormato] = useState(FORMATOS_LOGO[0]);
  const [modo, setModo] = useState("recortar");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState(null);
  const [preview, setPreview] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  const onCropComplete = useCallback((_a, pixels) => setArea(pixels), []);

  // Vista previa del resultado final (lo que se va a guardar).
  useEffect(() => {
    let vivo = true;
    let url = "";
    const t = setTimeout(async () => {
      try {
        const blob = await generarLogo(imageSrc, formato, modo, area);
        if (!vivo) return;
        url = URL.createObjectURL(blob);
        setPreview(url);
      } catch {
        /* la vista previa es opcional */
      }
    }, 120);
    return () => {
      vivo = false;
      clearTimeout(t);
      if (url) URL.revokeObjectURL(url);
    };
  }, [imageSrc, formato, modo, area]);

  const confirmar = async () => {
    setProcesando(true);
    setError("");
    try {
      onConfirm(await generarLogo(imageSrc, formato, modo, area));
    } catch (err) {
      setError(err.message || "No se pudo preparar el logo.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="tz-modal-backdrop tz-modal-backdrop-nested" style={{ zIndex: 130 }}>
      <div className="tz-modal tz-crop-modal" onClick={(e) => e.stopPropagation()}>
        <button className="tz-modal-close" onClick={onCancel} aria-label="Cerrar" disabled={procesando}>
          <X size={18} />
        </button>
        <h2>Adaptar logo</h2>
        <p className="tz-stock-editor-sub">Elige la forma de tu logo y si se recorta o entra completo.</p>

        <div className="tz-gasto-tipo-buttons" style={{ marginBottom: 8 }}>
          {FORMATOS_LOGO.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`tz-gasto-tipo-btn ${formato.id === f.id ? "tz-gasto-tipo-active" : ""}`}
              onClick={() => {
                setFormato(f);
                setZoom(1);
                setCrop({ x: 0, y: 0 });
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="tz-gasto-tipo-buttons" style={{ marginBottom: 10 }}>
          <button
            type="button"
            className={`tz-gasto-tipo-btn ${modo === "recortar" ? "tz-gasto-tipo-active" : ""}`}
            onClick={() => setModo("recortar")}
          >
            Recortar
          </button>
          <button
            type="button"
            className={`tz-gasto-tipo-btn ${modo === "ajustar" ? "tz-gasto-tipo-active" : ""}`}
            onClick={() => setModo("ajustar")}
          >
            Ajustar (completo)
          </button>
        </div>

        {modo === "recortar" ? (
          <>
            <div className="tz-crop-area">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={formato.ancho / formato.alto}
                cropShape="rect"
                showGrid
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="tz-crop-zoom-row">
              <ZoomIn size={16} />
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="tz-crop-zoom-slider"
                aria-label="Zoom"
              />
            </div>
          </>
        ) : null}

        <p className="tz-field-label" style={{ marginTop: 10 }}>
          Así se verá ({formato.ancho}×{formato.alto})
        </p>
        <div className="tz-logo-preview">
          {preview ? <img src={preview} alt="Vista previa del logo" /> : <Loader2 size={18} className="tz-spin" />}
        </div>

        {error && <p className="tz-error">{error}</p>}
        <div className="tz-add-entry-actions">
          <button type="button" className="tz-camera-cancel" onClick={onCancel} disabled={procesando}>
            Cancelar
          </button>
          <button type="button" className="tz-pw-submit tz-payment-save" onClick={confirmar} disabled={procesando}>
            {procesando ? <Loader2 size={16} className="tz-spin" /> : <Check size={16} />}
            Usar este logo
          </button>
        </div>
      </div>
    </div>
  );
}
