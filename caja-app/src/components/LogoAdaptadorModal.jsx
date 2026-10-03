import { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import { Check, Crosshair, Loader2, X, ZoomIn, ZoomOut } from "lucide-react";

// Adapta el logo del negocio antes de subirlo (Perfil del negocio):
//   * Formato: Cuadrado 512×512, Horizontal 900×300 o Vertical 480×640 —
//     el logo se guarda EXACTAMENTE a ese tamaño, así se ve igual de
//     nítido en la cabecera, la tienda, el directorio y la boleta.
//   * Zoom en los dos sentidos: alejar (hasta que el logo entra
//     completo con aire alrededor) o acercar hasta un 50 % más. El logo
//     se arrastra libre dentro del marco y lo que sobra queda
//     TRANSPARENTE. "Centrar" lo deja completo y centrado.
// Solo PNG sin fondo (lo valida PerfilNegocioModal antes de abrir esto).
// Sale en PNG (conserva la transparencia). onConfirm(blob).
export const FORMATOS_LOGO = [
  { id: "cuadrado", label: "Cuadrado", ancho: 512, alto: 512 },
  { id: "horizontal", label: "Horizontal", ancho: 900, alto: 300 },
  { id: "vertical", label: "Vertical", ancho: 480, alto: 640 },
];
const ZOOM_MAX = 1.5; // acercar: hasta un 50 % más

function cargarImagen(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar la imagen."));
    img.src = src;
  });
}

// Zoom con el que el logo entra COMPLETO en el marco (en react-easy-crop
// zoom 1 = el marco cubierto por la imagen).
function zoomCompleto(img, formato) {
  if (!img) return 1;
  const ia = img.width / img.height;
  const ca = formato.ancho / formato.alto;
  return Math.min(ia, ca) / Math.max(ia, ca);
}

// Dibuja la imagen donde quedó dentro del marco; lo que el marco tenga
// fuera de la imagen queda transparente. Se calcula a mano (en vez de
// drawImage con un recorte que se sale de la imagen) porque Safari
// maneja mal los recortes fuera de los bordes.
async function generarLogo(src, formato, area) {
  const img = await cargarImagen(src);
  const canvas = document.createElement("canvas");
  canvas.width = formato.ancho;
  canvas.height = formato.alto;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  const escala = canvas.width / area.width;
  ctx.drawImage(img, -area.x * escala, -area.y * escala, img.width * escala, img.height * escala);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo generar el logo."))), "image/png")
  );
}

export default function LogoAdaptadorModal({ imageSrc, onCancel, onConfirm }) {
  const [formato, setFormato] = useState(FORMATOS_LOGO[0]);
  const [img, setImg] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState(null);
  const [preview, setPreview] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  const completo = zoomCompleto(img, formato);
  // Alejar: hasta un poco menos que "completo", para poder dejarle aire.
  const zoomMin = Math.min(0.3, completo * 0.6);

  useEffect(() => {
    cargarImagen(imageSrc).then(setImg).catch(() => setError("No se pudo cargar la imagen."));
  }, [imageSrc]);

  const centrar = useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(zoomCompleto(img, formato));
  }, [img, formato]);

  // Al cargar la imagen o cambiar de formato: logo completo y centrado.
  useEffect(() => {
    if (img) centrar();
  }, [img, formato, centrar]);

  const onCropComplete = useCallback((_a, pixels) => setArea(pixels), []);

  // Vista previa del resultado final (lo que se va a guardar).
  useEffect(() => {
    if (!area) return undefined;
    let vivo = true;
    let url = "";
    const t = setTimeout(async () => {
      try {
        const blob = await generarLogo(imageSrc, formato, area);
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
  }, [imageSrc, formato, area]);

  const confirmar = async () => {
    if (!area) return;
    setProcesando(true);
    setError("");
    try {
      onConfirm(await generarLogo(imageSrc, formato, area));
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
        <p className="tz-stock-editor-sub">
          Elige la forma, aleja o acerca con la barra y arrastra para centrar. Lo que quede vacío se guarda transparente.
        </p>

        <div className="tz-gasto-tipo-buttons" style={{ marginBottom: 10 }}>
          {FORMATOS_LOGO.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`tz-gasto-tipo-btn ${formato.id === f.id ? "tz-gasto-tipo-active" : ""}`}
              onClick={() => setFormato(f)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="tz-crop-area tz-crop-area-logo">
          {img && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              minZoom={zoomMin}
              maxZoom={ZOOM_MAX}
              aspect={formato.ancho / formato.alto}
              restrictPosition={false}
              cropShape="rect"
              showGrid
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>
        <div className="tz-crop-zoom-row">
          <ZoomOut size={16} />
          <input
            type="range"
            min={zoomMin}
            max={ZOOM_MAX}
            step="0.01"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="tz-crop-zoom-slider"
            aria-label="Zoom"
          />
          <ZoomIn size={16} />
          <button type="button" className="tz-gasto-tipo-btn tz-crop-centrar" onClick={centrar} disabled={!img}>
            <Crosshair size={13} /> Centrar
          </button>
        </div>

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
          <button type="button" className="tz-pw-submit tz-payment-save" onClick={confirmar} disabled={procesando || !area}>
            {procesando ? <Loader2 size={16} className="tz-spin" /> : <Check size={16} />}
            Usar este logo
          </button>
        </div>
      </div>
    </div>
  );
}
