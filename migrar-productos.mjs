/**
 * Migra el catálogo de productos desde un Excel hacia Supabase.
 *
 * Uso:
 *   1. npm install xlsx @supabase/supabase-js
 *   2. Exporta las variables de entorno (o reemplázalas abajo):
 *        SUPABASE_URL=https://xxxx.supabase.co
 *        SUPABASE_SERVICE_KEY=eyJ...   (Service Role Key, NO la anon key —
 *                                       la Service Role es la única que puede
 *                                       saltarse RLS para hacer una carga masiva)
 *   3. node migrar-productos.mjs ./catalogo.xlsx
 *
 * La Service Role Key está en Supabase: Project Settings > API > service_role.
 * NUNCA la pongas en el frontend ni la subas a un repo público — solo se usa
 * una vez, desde tu computadora, para esta migración.
 */

import XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://xaerfywydzwifohjsvwa.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhZXJmeXd5ZHp3aWZvaGpzdndhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTAwMDg2NywiZXhwIjoyMTAwNTc2ODY3fQ.P0n9MvDdd4WaBNnwQ9sUq6VRLvjnOHXR3GGgPgsezlc";
const archivoExcel = process.argv[2];

if (!archivoExcel) {
  console.error("Uso: node migrar-productos.mjs <ruta-al-excel.xlsx>");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function run() {
  const workbook = XLSX.readFile(archivoExcel);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

  if (rows.length === 0) {
    console.error("El Excel no tiene filas de datos.");
    process.exit(1);
  }

  // ---- Validación previa: columnas esperadas ----
  const columnasEsperadas = ["nombre", "precio", "categoria", "consumos"];
  const columnasPresentes = Object.keys(rows[0]);
  const faltantes = columnasEsperadas.filter((c) => !columnasPresentes.includes(c));
  if (faltantes.length > 0) {
    console.error(`Faltan columnas obligatorias en el Excel: ${faltantes.join(", ")}`);
    process.exit(1);
  }

  // ---- Validación previa: consumos debe ser JSON válido en cada fila ----
  let filasConError = 0;
  rows.forEach((r, idx) => {
    try {
      typeof r.consumos === "string" ? JSON.parse(r.consumos) : r.consumos;
    } catch (e) {
      filasConError++;
      console.error(`Fila ${idx + 2} (Excel): 'consumos' no es JSON válido -> ${r.consumos}`);
    }
  });
  if (filasConError > 0) {
    console.error(`\n${filasConError} fila(s) con 'consumos' inválido. Corrige el Excel y reintenta.`);
    process.exit(1);
  }

  // ---- 1) Categorías, en el orden en que aparecen por primera vez ----
  const categoriasVistas = [];
  rows.forEach((r) => {
    if (r.categoria && !categoriasVistas.includes(r.categoria)) {
      categoriasVistas.push(r.categoria);
    }
  });
  const categoriasPayload = categoriasVistas.map((nombre, idx) => ({ nombre, orden: idx }));

  console.log(`Subiendo ${categoriasPayload.length} categorías...`);
  const { error: catError } = await supabase
    .from("categorias")
    .upsert(categoriasPayload, { onConflict: "nombre" });
  if (catError) {
    console.error("Error subiendo categorías:", catError);
    process.exit(1);
  }

  // ---- 2) Productos ----
  const productosPayload = rows.map((r, idx) => ({
    categoria: r.categoria,
    subgrupo: r.subgrupo || null,
    nombre: r.nombre,
    descripcion: r.descripcion || null,
    etiqueta: r.etiqueta || null,
    precio: Number(r.precio),
    consumos: typeof r.consumos === "string" ? JSON.parse(r.consumos) : r.consumos,
    orden: idx,
  }));

  console.log(`Subiendo ${productosPayload.length} productos...`);
  const { error: prodError } = await supabase.from("productos").insert(productosPayload);
  if (prodError) {
    console.error("Error subiendo productos:", prodError);
    process.exit(1);
  }

  // ---- 3) Stock: un valor por cada 'key' de consumo único. Si una misma
  //    key aparece con cantidades distintas en distintas filas (stock
  //    compartido inconsistente en el Excel), se usa el valor MÁS ALTO
  //    como marcador y se imprime una advertencia — debes revisarlo a mano.
  const stockPorKey = {};
  rows.forEach((r) => {
    const consumos = typeof r.consumos === "string" ? JSON.parse(r.consumos) : r.consumos;
    (consumos || []).forEach((c) => {
      if (!stockPorKey[c.key]) stockPorKey[c.key] = { valores: [], etiqueta: r.nombre };
      stockPorKey[c.key].valores.push(Number(r.stock) || 0);
    });
  });

  const advertencias = [];
  const stockPayload = Object.entries(stockPorKey).map(([key, info]) => {
    const unicos = [...new Set(info.valores)];
    if (unicos.length > 1) {
      advertencias.push(`"${key}": valores distintos en el Excel ${JSON.stringify(unicos)} -> se usó ${Math.max(...unicos)}`);
    }
    return {
      nombre: key,
      cantidad: Math.max(...info.valores),
      etiqueta: info.etiqueta,
    };
  });

  console.log(`Subiendo ${stockPayload.length} claves de stock...`);
  const { error: stockError } = await supabase
    .from("stock")
    .upsert(stockPayload, { onConflict: "nombre" });
  if (stockError) {
    console.error("Error subiendo stock:", stockError);
    process.exit(1);
  }

  console.log("\n✅ Migración completa.");
  if (advertencias.length > 0) {
    console.log("\n⚠️  ADVERTENCIAS - revisa estos valores de stock a mano en Supabase:");
    advertencias.forEach((a) => console.log("  - " + a));
  }
}

run().catch((e) => {
  console.error("Error inesperado:", e);
  process.exit(1);
});
