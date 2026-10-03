import { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import { Check, Crosshair, Loader2, X, ZoomIn, ZoomOut } from "lucide-react";

// Adapta el logo del negocio antes de subirlo (Perfil del negocio).
// Formato único: CUADRADO 512×512 — se ve parejo en la cabecera, la
// tienda, las tarjetas del directorio y la boleta.
// Zoom: 100 % = el logo entra COMPLETO en el cuadrado. La barra aleja
// hasta 50 % (le queda aire transparente alrededor) y acerca hasta
// 150 %. El logo se arrastra libre en el marco y lo que sobra queda
// TRANSPARENTE. "Centrar" lo deja al 100 % y centrado.
// Solo PNG sin fondo (lo valida PerfilNegocioModal antes de abrir esto).
// Sale en PNG (conserva la transparencia). onConfirm(blob).
const LADO = 512;
const ZOOM_OUT = 0.5; // alejar: hasta 50 % del tamaño "completo"
const ZOOM_IN = 1.5; // acercar: hasta 150 %

function cargarImagen(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar la imagen."));
    img.src = src;
  });
}

// Zoom con el que el logo entra COMPLETO en el cuadrado (en
// react-easy-crop zoom 1 = el marco cubierto por la imagen).
function zoomCompleto(img) {
  if (!img) return 1;
  const ia = img.width / img.height;
  return Math.min(ia, 1) / Math.max(ia, 1);
}

// Dibuja la imagen donde quedó dentro del marco; lo que el marco tenga
// fuera de la imagen queda transparente. Se calcula a mano (en vez de
// drawImage con un recorte que se sale de la imagen) porque Safari
// maneja mal los recortes fuera de los bordes.
async function generarLogo(src, area) {
  const img = await cargarImagen(src);
  const canvas = document.createElement("canvas");
  canvas.width = LADO;
  canvas.height = LADO;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  const escala = canvas.width / area.width;
  ctx.drawImage(img, -area.x * escala, -area.y * escala, img.width * escala, img.height * escala);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo generar el logo."))), "image/png")
  );
}

export default function LogoAdaptadorModal({ imageSrc, onCancel, onConfirm }) {
  const [img, setImg] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState(null);
  const [preview, setPreview] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  const completo = zoomCompleto(img);
  const zoomMin = completo * ZOOM_OUT;
  const zoomMax = completo * ZOOM_IN;

  useEffect(() => {
    cargarImagen(imageSrc).then(setImg).catch(() => setError("No se pudo cargar la imagen."));
  }, [imageSrc]);

  const centrar = useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(zoomCompleto(img));
  }, [img]);

  // Al cargar la imagen: logo completo y centrado.
  useEffect(() => {
    if (img) centrar();
  }, [img, centrar]);

  const onCropComplete = useCallback((_a, pixels) => setArea(pixels), []);

  // Vista previa del resultado final (lo que se va a guardar).
  useEffect(() => {
    if (!area) return undefined;
    let vivo = true;
    let url = "";
    const t = setTimeout(async () => {
      try {
        const blob = await generarLogo(imageSrc, area);
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
  }, [imageSrc, area]);

  const confirmar = async () => {
    if (!area) return;
    setProcesando(true);
    setError("");
    try {
      onConfirm(await generarLogo(imageSrc, area));
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
          Aleja o acerca con la barra y arrastra para centrar. Lo que quede vacío se guarda transparente.
        </p>

        <div className="tz-crop-area tz-crop-area-logo">
          {img && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              minZoom={zoomMin}
              maxZoom={zoomMax}
              aspect={1}
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
            max={zoomMax}
            step="0.01"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="tz-crop-zoom-slider"
            aria-label="Zoom"
          />
          <ZoomIn size={16} />
          <span className="tz-crop-porcentaje">{Math.round((zoom / completo) * 100)}%</span>
          <button type="button" className="tz-gasto-tipo-btn tz-crop-centrar" onClick={centrar} disabled={!img}>
            <Crosshair size={13} /> Centrar
          </button>
        </div>

        <p className="tz-field-label" style={{ marginTop: 10 }}>
          Así se verá ({LADO}×{LADO})
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
