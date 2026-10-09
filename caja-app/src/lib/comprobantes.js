import imageCompression from "browser-image-compression";
import { supabase } from "../supabaseClient";

// Sube la foto de un comprobante de pago al bucket público
// comprobantes-fotos, COMPRIMIDA igual que en la caja registradora
// (App.jsx/compressReceiptImage): 1280 px de lado mayor, calidad 0.8 —
// se sigue leyendo el número de operación y el monto, pero el archivo
// pesa una fracción. Si la compresión falla, se sube el original (mejor
// gastar algo de espacio que perder un comprobante).
//   carpeta: "planes/<negocio_id>" (el negocio, al renovar) o
//            "plataforma/<negocio_id>" (el super admin, Recarga rápida).
// Devuelve { url } o { error }.
export async function subirComprobante(archivo, carpeta) {
  let blob = archivo;
  try {
    // Siempre JPEG: así una foto HEIC/PNG del celular no choca con los
    // tipos de archivo que acepta el bucket.
    blob = await imageCompression(archivo, {
      maxWidthOrHeight: 1280,
      initialQuality: 0.8,
      fileType: "image/jpeg",
      useWebWorker: true,
    });
  } catch (err) {
    console.error("[comprobantes] no se pudo comprimir, se sube el original:", err);
  }
  const ruta = `${carpeta}/${Date.now()}.jpg`;
  const { data, error } = await supabase.storage
    .from("comprobantes-fotos")
    .upload(ruta, blob, { contentType: blob.type || "image/jpeg", upsert: false });
  if (error) return { error };
  return { url: supabase.storage.from("comprobantes-fotos").getPublicUrl(data.path).data.publicUrl };
}
