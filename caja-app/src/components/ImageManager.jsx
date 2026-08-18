import { useState } from "react";
import { Camera, Check, Loader2, Package, Scissors, Upload, Wand2, X } from "lucide-react";
import ImageCropModal from "./ImageCropModal";

// Versión exacta del paquete instalado (ver package.json) — no se
// puede leer en tiempo de ejecución porque "@imgly/background-removal"
// solo expone su entrypoint principal en su campo "exports"
// (import("…/package.json") rompe el build). Si se actualiza la
// dependencia, actualizar este número también.
const BG_REMOVAL_VERSION = "1.7.0";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("No se pudo leer la imagen elegida."));
    reader.readAsDataURL(file);
  });
}

async function urlToDataUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("No se pudo cargar la imagen actual.");
  const blob = await res.blob();
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("No se pudo leer la imagen actual."));
    reader.readAsDataURL(blob);
  });
  return { dataUrl, mimeType: blob.type || "image/jpeg" };
}

/* ---- Gestor de Imágenes reutilizable — Subir/Tomar Foto, Recortar
   (manual, bajo demanda vía botón explícito, NUNCA automático al
   elegir una foto) y Mejorar con IA. No sabe nada de Supabase ni de
   "producto": cada vez que hay una imagen final lista (recién
   elegida, recortada, o con el fondo removido) llama a
   onConfirm(blob, ext, mimeType) — quien use el componente decide si
   esa imagen se sube YA MISMO (producto existente, ver App.jsx
   handleExistingProductImageConfirm) o se guarda en su propio estado
   hasta confirmar el formulario (producto nuevo, todavía sin id, ver
   handleNewProductoImageConfirm). Por eso es embebible en dos lugares
   distintos sin duplicar nada: el modal "Gestión de Imagen" de un
   producto ya existente, y el formulario de alta rápida al escanear
   un código que no existe. ---- */
export default function ImageManager({ imageUrl, title, onConfirm, saving, error }) {
  const [displayUrl, setDisplayUrl] = useState(imageUrl || null);
  // Último File/Blob elegido en ESTA sesión del componente — fuente
  // para Recortar/Mejorar con IA sin tener que re-descargar lo que ya
  // se acaba de subir/staged.
  const [rawFile, setRawFile] = useState(null);
  const [rawMimeType, setRawMimeType] = useState("image/jpeg");
  const [cropSrc, setCropSrc] = useState(null);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiPreviewBlob, setAiPreviewBlob] = useState(null);
  const [aiPreviewUrl, setAiPreviewUrl] = useState("");
  const [localError, setLocalError] = useState("");

  const hasImage = !!(rawFile || displayUrl);
  const busy = !!saving || aiProcessing;

  const discardAiPreview = () => {
    if (aiPreviewUrl) URL.revokeObjectURL(aiPreviewUrl);
    setAiPreviewBlob(null);
    setAiPreviewUrl("");
    setAiError("");
  };

  const applyConfirmed = async (blob, ext, mimeType) => {
    setLocalError("");
    setRawFile(blob);
    setRawMimeType(mimeType);
    setDisplayUrl(URL.createObjectURL(blob));
    await onConfirm(blob, ext, mimeType);
  };

  const handlePick = async (file) => {
    if (!file) return;
    setLocalError("");
    discardAiPreview();
    const ext =
      (file.type ? file.type.split("/")[1] : "") || (file.name?.split(".").pop() || "jpg");
    try {
      await applyConfirmed(file, ext.toLowerCase(), file.type || "image/jpeg");
    } catch (err) {
      console.error("Error confirmando la foto elegida:", err);
    }
  };

  const resolveEditSource = async () => {
    if (rawFile) return { dataUrl: await fileToDataUrl(rawFile), mimeType: rawMimeType };
    if (displayUrl) return urlToDataUrl(displayUrl);
    throw new Error("Primero sube o toma una foto.");
  };

  // "Recortar" ahora es 100% manual: elegir/tomar una foto NUNCA abre
  // el recorte solo — solo este botón lo hace, para no bloquear el
  // flujo cuando el admin no necesita ajustarla.
  const openCrop = async () => {
    setLocalError("");
    try {
      const { dataUrl, mimeType } = await resolveEditSource();
      setRawMimeType(mimeType);
      setCropSrc(dataUrl);
    } catch (err) {
      setLocalError(err.message || "No se pudo abrir la imagen para recortar.");
    }
  };

  const handleCropConfirm = async (blob) => {
    setCropSrc(null);
    const ext = (rawMimeType.split("/")[1] || "jpg").toLowerCase();
    try {
      await applyConfirmed(blob, ext, rawMimeType);
    } catch (err) {
      console.error("Error confirmando el recorte:", err);
    }
  };

  /* "Mejorar con IA": quita el fondo 100% en el navegador con
     @imgly/background-removal (import dinámico — el modelo ONNX/WASM
     pesa varios MB, no tiene sentido bajarlo si nunca se toca este
     botón). La librería descarga su modelo de la CDN pública de
     IMG.LY recién en este momento — el error "'text/html' is not a
     valid JavaScript MIME type" pasa cuando esa descarga no devuelve
     el binario esperado (bloqueador de contenido/firewall filtrando
     el dominio); se detecta esa firma específica para dar un mensaje
     diagnosticable en vez de uno genérico. */
  const handleAiEnhance = async () => {
    setAiError("");
    setAiProcessing(true);
    try {
      const { dataUrl, mimeType } = await resolveEditSource();
      const sourceBlob = await (await fetch(dataUrl)).blob();

      const { removeBackground } = await import("@imgly/background-removal");
      const resultBlob = await removeBackground(sourceBlob, {
        publicPath: `https://staticimgly.com/@imgly/background-removal-data/${BG_REMOVAL_VERSION}/dist/`,
      });

      setRawMimeType(mimeType);
      setAiPreviewBlob(resultBlob);
      setAiPreviewUrl(URL.createObjectURL(resultBlob));
    } catch (err) {
      console.error("Error quitando el fondo con IA:", err);
      const rawMsg = err?.message || String(err || "");
      const esFalloDeDescargaModelo =
        /valid javascript mime type|unexpected token ?['"<]|failed to fetch|networkerror|load failed/i.test(
          rawMsg
        );
      setAiError(
        esFalloDeDescargaModelo
          ? "Error en el servidor de IA: no se pudo descargar el modelo de recorte automático. " +
              "Puede ser un bloqueador de anuncios/contenido o un firewall filtrando 'staticimgly.com'."
          : rawMsg
            ? `No se pudo procesar la imagen: ${rawMsg}`
            : "No se pudo procesar la imagen con IA."
      );
    } finally {
      setAiProcessing(false);
    }
  };

  const confirmAiResult = async () => {
    if (!aiPreviewBlob) return;
    try {
      await applyConfirmed(aiPreviewBlob, "png", "image/png");
      discardAiPreview();
    } catch (err) {
      console.error("Error confirmando el resultado de IA:", err);
    }
  };

  return (
    <>
      <div className="tz-image-manager-preview">
        {displayUrl ? (
          <img src={displayUrl} alt={title || "Producto"} />
        ) : (
          <div className="tz-product-image-placeholder">
            <Package size={32} />
          </div>
        )}
      </div>

      {(error || localError) && <p className="tz-error">{error || localError}</p>}
      {saving && (
        <p className="tz-stock-editor-sub">
          <Loader2 size={14} className="tz-spin" /> Subiendo imagen…
        </p>
      )}

      {!aiPreviewBlob && (
        <>
          <div className="tz-image-manager-actions">
            <label className="tz-camera-cancel tz-image-manager-btn">
              <Upload size={15} /> Subir Foto
              <input
                type="file"
                accept="image/*"
                hidden
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  handlePick(file);
                  e.target.value = "";
                }}
              />
            </label>
            <label className="tz-camera-cancel tz-image-manager-btn">
              <Camera size={15} /> Tomar Foto
              <input
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  handlePick(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          <div className="tz-image-manager-actions">
            <button
              type="button"
              className="tz-camera-cancel tz-image-manager-btn"
              onClick={openCrop}
              disabled={!hasImage || busy}
            >
              <Scissors size={15} /> Recortar
            </button>
            <button
              type="button"
              className="tz-ai-magic-btn"
              onClick={handleAiEnhance}
              disabled={!hasImage || busy}
            >
              {aiProcessing ? (
                <>
                  <Loader2 size={16} className="tz-spin" /> Procesando…
                </>
              ) : (
                <>
                  <Wand2 size={16} /> Mejorar con IA
                </>
              )}
            </button>
          </div>
        </>
      )}
      {aiError && <p className="tz-error">{aiError}</p>}

      {aiPreviewUrl && (
        <div className="tz-ai-result">
          <p className="tz-field-label">Vista previa — fondo removido</p>
          <div className="tz-ai-result-preview">
            <img src={aiPreviewUrl} alt="Sin fondo" />
          </div>
          <div className="tz-image-manager-actions">
            <button
              type="button"
              className="tz-camera-cancel tz-image-manager-btn"
              onClick={discardAiPreview}
              disabled={saving}
            >
              <X size={15} /> Descartar
            </button>
            <button
              type="button"
              className="tz-stock-save tz-image-manager-btn"
              onClick={confirmAiResult}
              disabled={saving}
            >
              {saving ? <Loader2 size={15} className="tz-spin" /> : <Check size={15} />}
              Guardar recorte
            </button>
          </div>
        </div>
      )}

      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          mimeType={rawMimeType}
          onCancel={() => setCropSrc(null)}
          onConfirm={handleCropConfirm}
        />
      )}
    </>
  );
}
