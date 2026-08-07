import { supabase } from "../supabaseClient";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(codigo) {
  return UUID_REGEX.test(String(codigo || "").trim());
}

/* Busca un producto por el código escaneado. Si el string tiene forma
   de UUID (un QR que codifica el id interno del producto) busca por
   'id'; si no (un código de barras EAN/UPC numérico normal) busca por
   'codigo_barras'. Evita el error de Postgres "invalid input syntax
   for type uuid" que tira .eq('id', codigo) cuando codigo no es un
   UUID válido. Devuelve null si no hay match (no lanza error por
   "no encontrado" — eso lo decide quien llama). */
export async function buscarProductoPorCodigo(codigoRaw) {
  const codigo = String(codigoRaw || "").trim();
  if (!codigo) return null;

  const columna = isUuid(codigo) ? "id" : "codigo_barras";
  const { data, error } = await supabase
    .from("productos")
    .select("id, nombre, descripcion, precio, consumos")
    .eq(columna, codigo)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/* Un producto puede consumir de varias claves de stock a la vez (ej.
   un combo: 2 gaseosas + 1 hielo). Solo se puede reponer stock
   automáticamente al escanear si el producto consume de UNA sola
   clave — si consume de varias, o de ninguna, no hay forma no
   ambigua de saber a cuál sumarle la mercadería recibida. */
export function resolveStockKey(producto) {
  if (!producto) return null;
  const consumos = Array.isArray(producto.consumos)
    ? producto.consumos
    : JSON.parse(producto.consumos || "[]");
  const claves = [...new Set(consumos.map((c) => c.key).filter(Boolean))];
  return claves.length === 1 ? claves[0] : null;
}

// Marcas diacríticas combinantes (acentos) que quedan sueltas después
// de normalize("NFD") — rango ̀-ͯ.
const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");

function slugify(text) {
  return (text || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* Genera una clave de stock única a partir del nombre del producto
   (ej. "Coca Cola 1.5L" -> "coca-cola-1-5l"). Si ya existe esa clave
   en 'stockKeysExistentes' (el objeto 'stock' que ya trae useCatalog),
   le agrega un sufijo corto para no pisar un insumo existente. */
function generateStockKey(nombre, stockKeysExistentes) {
  const base = slugify(nombre) || "producto";
  if (!stockKeysExistentes || stockKeysExistentes[base] == null) return base;
  const sufijo = Math.random().toString(36).slice(2, 6);
  return `${base}-${sufijo}`;
}

/* 'orden' es una columna integer estándar de Postgres (máx.
   2 147 483 647). Date.now() son milisegundos desde 1970 — 13 dígitos,
   ~1 786 000 000 000 en 2026 — que desborda esa columna por completo.
   ESE desborde era el error real de "Crear producto" (Postgres lo
   rechaza como valor fuera de rango para integer); el código de
   barras escaneado, también de 13 dígitos, viajaba correctamente en
   su propia columna de texto y no tenía nada que ver. Acá se arma un
   entero chico y monótono (segundos desde una fecha fija reciente) que
   sigue sirviendo para ordenar "lo más nuevo al final" sin arriesgar
   overflow durante décadas. */
function safeOrdenValue() {
  const EPOCH_BASE = new Date("2024-01-01T00:00:00Z").getTime();
  return Math.floor((Date.now() - EPOCH_BASE) / 1000);
}

/* Crea un producto "al vuelo" desde el flujo de escaneo de Editar
   Stock cuando el código no existe todavía en 'productos'. Un
   producto creado así representa mercadería física simple (no un
   combo), así que se le genera automáticamente una clave de stock 1:1
   propia (consumos: [{key, qty: 1}]) — es lo que permite que, apenas
   se crea, ya se pueda sumarle stock igual que a cualquier otro
   producto escaneado. Si la categoría escrita no existe todavía en
   'categorias', se crea también (si no, el producto quedaría
   "huérfano": buildSectionsFromRows arma las secciones recorriendo
   'categorias', no 'productos', así que un producto con una categoría
   sin fila propia nunca aparecería en el catálogo). */
export async function crearProducto({
  codigoBarras,
  nombre,
  detalle,
  precio,
  categoria,
  subgrupo,
  stockExistente,
}) {
  const categoriaNombre = (categoria || "").trim();
  const { data: catExistente, error: catLookupError } = await supabase
    .from("categorias")
    .select("id")
    .eq("nombre", categoriaNombre)
    .maybeSingle();
  if (catLookupError) throw catLookupError;

  if (!catExistente) {
    const { error: catInsertError } = await supabase
      .from("categorias")
      .insert([{ nombre: categoriaNombre, activo: true, orden: safeOrdenValue() }]);
    if (catInsertError) throw catInsertError;
  }

  const stockKey = generateStockKey(nombre, stockExistente);

  // Precio SIEMPRE numérico real (parseFloat), nunca el string crudo
  // del input — y el código de barras SOLO va a 'codigo_barras' (texto),
  // nunca mezclado con ningún campo numérico.
  const productoPayload = {
    nombre: nombre.trim(),
    descripcion: (detalle || "").trim() || null,
    precio: parseFloat(precio),
    categoria: categoriaNombre,
    subgrupo: (subgrupo || "").trim() || null,
    codigo_barras: String(codigoBarras || "").trim(),
    consumos: JSON.stringify([{ key: stockKey, qty: 1 }]),
    activo: true,
    visible_publico: true,
    orden: safeOrdenValue(),
  };

  // Log explícito del payload exacto antes del INSERT, para poder
  // comparar tipo por tipo contra las columnas reales de Supabase si
  // algo vuelve a fallar.
  console.log("crearProducto: payload enviado a 'productos'", productoPayload);

  const { data: insertedProducto, error: prodError } = await supabase
    .from("productos")
    .insert([productoPayload])
    .select()
    .single();
  if (prodError) throw prodError;

  const { error: stockError } = await supabase
    .from("stock")
    .upsert([{ nombre: stockKey, cantidad: 0, etiqueta: nombre.trim() }], {
      onConflict: "nombre",
    });
  if (stockError) throw stockError;

  return { producto: insertedProducto, stockKey };
}
