import * as XLSX from "xlsx";

// Descarga un .xlsx de una o más hojas a partir de { nombre, filas }[]
// (filas = array de arrays; la primera fila son los encabezados). Misma
// lógica que downloadXLSX de App.jsx (la caja registradora), con
// autoancho estimado por columna.
export function descargarXLSX(nombreArchivo, hojas) {
  const libro = XLSX.utils.book_new();
  hojas.forEach(({ nombre, filas }) => {
    const hoja = XLSX.utils.aoa_to_sheet(filas);
    if (filas.length > 0) {
      hoja["!cols"] = filas[0].map((_, i) => {
        const largo = filas.reduce((max, fila) => Math.max(max, fila[i] == null ? 0 : String(fila[i]).length), 0);
        return { wch: Math.min(Math.max(largo + 2, 8), 45) };
      });
    }
    XLSX.utils.book_append_sheet(libro, hoja, nombre.slice(0, 31));
  });
  XLSX.writeFile(libro, nombreArchivo);
}
