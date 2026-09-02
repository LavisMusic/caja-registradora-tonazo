import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import { Check, Loader2, X, ZoomIn } from "lucide-react";

// Recorta 'imageSrc' (data URL) al rectángulo 'pixelCrop' dibujándolo
// en un canvas del tamaño exacto del recorte — el resultado es un
// Blob nuevo, nunca se toca el archivo original.
function getCroppedImageBlob(imageSrc, pixelCrop, mimeType) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(pixelCrop.width);
      canvas.height = Math.round(pixelCrop.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No se pudo preparar el recorte."));
        return;
      }
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        canvas.width,
        canvas.height
      );
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("No se pudo generar el recorte."));
            return;
          }
          resolve(blob);
        },
        mimeType || "image/jpeg",
        0.92
      );
    };
    image.onerror = () => reject(new Error("No se pudo cargar la imagen para recortar."));
    image.src = imageSrc;
  });
}

// Modal de recorte 1:1 que se interpone entre "elegir/tomar foto" y la
// subida real a Supabase Storage — arrastrar centra, el slider hace
// zoom. "Confirmar Recorte" arma el Blob final y se lo pasa a
// onConfirm; el llamador decide qué hacer con él (subirlo).
export default function ImageCropModal({ imageSrc, mimeType, onCancel, onConfirm }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const onCropComplete = useCallback((_croppedArea, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    setError("");
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels, mimeType);
      onConfirm(blob);
    } catch (err) {
      console.error("Error recortando la imagen:", err);
      setError(err.message || "No se pudo recortar la imagen. Intenta de nuevo.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="tz-modal-backdrop tz-modal-backdrop-nested">
      <div className="tz-modal tz-crop-modal" onClick={(e) => e.stopPropagation()}>
        <button className="tz-modal-close" onClick={onCancel} aria-label="Cerrar" disabled={processing}>
          <X size={18} />
        </button>

        <h2>Recortar Foto</h2>
        <p className="tz-stock-editor-sub">
          Arrastra la imagen para centrarla y usa el control para hacer zoom.
        </p>

        <div className="tz-crop-area">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
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

        {error && <p className="tz-error">{error}</p>}

        <div className="tz-add-entry-actions">
          <button type="button" className="tz-camera-cancel" onClick={onCancel} disabled={processing}>
            Cancelar
          </button>
          <button
            type="button"
            className="tz-pw-submit tz-payment-save"
            onClick={handleConfirm}
            disabled={processing || !croppedAreaPixels}
          >
            {processing ? <Loader2 size={16} className="tz-spin" /> : <Check size={16} />}
            Confirmar Recorte
          </button>
        </div>
      </div>
    </div>
  );
}
