import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

function slugify(text) {
  return (text || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* "01 OLD TIME GREEN" -> { numero: "01", title: "Old Time Green" }.
   Si no hay número al inicio, o si subgrupo es null (ej. "BEBIDAS",
   que es una lista plana), no hay encabezado (numero/title = null),
   igual que las categorías sin "groups.title" en el catálogo viejo. */
function parseSubgrupo(subgrupo) {
  if (!subgrupo) return { numero: null, title: null };
  const match = subgrupo.match(/^(\d+)\s+(.*)$/);
  if (match) return { numero: match[1], title: match[2] };
  return { numero: null, title: subgrupo };
}

/* Arma [{ key, label, groups: [{ numero, title, items: [...] }] }] a
   partir de las filas planas de 'categorias' + 'productos'. Es la
   MISMA forma que antes producía el array SECTIONS hardcodeado. */
function buildSectionsFromRows(categoriaRows, productoRows) {
  return categoriaRows.map((cat) => {
    const productosDeCategoria = productoRows
      .filter((p) => p.categoria === cat.nombre)
      .sort((a, b) => a.orden - b.orden);

    // Agrupa por 'subgrupo' preservando el orden de aparición.
    const groupsOrder = [];
    const groupsMap = new Map();
    productosDeCategoria.forEach((p) => {
      const groupKey = p.subgrupo || "__sin_subgrupo__";
      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, []);
        groupsOrder.push(groupKey);
      }
      groupsMap.get(groupKey).push(p);
    });

    const groups = groupsOrder.map((groupKey) => {
      const { numero, title } = parseSubgrupo(
        groupKey === "__sin_subgrupo__" ? null : groupKey
      );
      return {
        numero,
        title,
        items: groupsMap.get(groupKey).map((p) => ({
          id: p.id,
          combo: p.etiqueta || undefined,
          name: p.nombre,
          detail: p.descripcion || "",
          price: Number(p.precio),
          consumes: Array.isArray(p.consumos) ? p.consumos : JSON.parse(p.consumos || "[]"),
          visiblePublico: p.visible_publico ?? true,
        })),
      };
    });

    return { key: slugify(cat.nombre), label: cat.nombre, groups };
  });
}

function buildProductsById(sections) {
  const map = {};
  sections.forEach((section) => {
    section.groups.forEach((group) => {
      group.items.forEach((item) => {
        map[item.id] = { ...item, sectionLabel: section.label };
      });
    });
  });
  return map;
}

// Carga el catálogo (categorías + productos + stock) desde Supabase.
// Extraído de App.jsx para que la vista pública del catálogo y el POS
// de /admin compartan la misma fuente de datos sin duplicar el fetch.
export function useCatalog() {
  const [sections, setSections] = useState([]);
  const [productsById, setProductsById] = useState({});
  const [stock, setStock] = useState({});
  const [stockLabels, setStockLabels] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: categoriaRows, error: categoriaError } = await supabase
        .from("categorias")
        .select("*")
        .eq("activo", true)
        .order("orden", { ascending: true });

      if (categoriaError) {
        console.error("Error cargando categorias desde Supabase:", categoriaError);
      }

      const { data: productoRows, error: productoError } = await supabase
        .from("productos")
        .select("*")
        .eq("activo", true)
        .order("orden", { ascending: true });

      if (productoError) {
        console.error("Error cargando productos desde Supabase:", productoError);
      }

      const builtSections = buildSectionsFromRows(categoriaRows || [], productoRows || []);
      const builtProductsById = buildProductsById(builtSections);

      if (categoriaError || productoError) {
        if (!cancelled) {
          setError(
            "No se pudo cargar el catálogo desde Supabase. Revisa las tablas 'categorias' y 'productos'."
          );
        }
      }

      const { data: stockRows, error: stockError } = await supabase
        .from("stock")
        .select("nombre, cantidad, etiqueta");

      if (stockError) {
        console.error("Error cargando stock desde Supabase:", stockError);
      }

      const loadedStock = {};
      const loadedStockLabels = {};
      (stockRows || []).forEach((row) => {
        loadedStock[row.nombre] = row.cantidad;
        loadedStockLabels[row.nombre] = row.etiqueta || row.nombre;
      });

      Object.values(builtProductsById).forEach((product) => {
        (product.consumes || []).forEach(({ key }) => {
          if (loadedStock[key] == null) {
            console.warn(
              `La key de stock "${key}" (usada por "${product.name}") no existe todavía en la tabla 'stock'. Se muestra en 0.`
            );
            loadedStock[key] = 0;
            loadedStockLabels[key] = key;
          }
        });
      });

      if (!cancelled) {
        setSections(builtSections);
        setProductsById(builtProductsById);
        setStock(loadedStock);
        setStockLabels(loadedStockLabels);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Alterna si un producto se muestra en el catálogo público (no afecta
  // su disponibilidad para vender desde /admin). Actualiza el estado
  // local al toque (optimista) y persiste en 'productos.visible_publico'.
  function applyVisibilityLocally(productId, visible) {
    setSections((prev) =>
      prev.map((section) => ({
        ...section,
        groups: section.groups.map((group) => ({
          ...group,
          items: group.items.map((item) =>
            item.id === productId ? { ...item, visiblePublico: visible } : item
          ),
        })),
      }))
    );
    setProductsById((prev) =>
      prev[productId]
        ? { ...prev, [productId]: { ...prev[productId], visiblePublico: visible } }
        : prev
    );
  }

  async function setProductVisibility(productId, visible) {
    const previous = productsById[productId]?.visiblePublico ?? true;
    applyVisibilityLocally(productId, visible);

    const { data, error: updateError } = await supabase
      .from("productos")
      .update({ visible_publico: visible })
      .eq("id", productId)
      .select("id");

    // Si RLS no tiene una política de UPDATE que cubra a este usuario,
    // Supabase no devuelve un error: simplemente actualiza 0 filas y
    // responde 200 OK. Sin este chequeo, el toggle cambia en pantalla
    // pero nunca se guarda, sin ningún aviso.
    const noRowsAffected = !updateError && (!data || data.length === 0);

    if (updateError || noRowsAffected) {
      console.error(
        "Error al actualizar visibilidad del producto:",
        updateError || "0 filas afectadas (probable política RLS de UPDATE faltante en 'productos')"
      );
      applyVisibilityLocally(productId, previous);
      return { error: updateError || new Error("No se pudo guardar: 0 filas afectadas.") };
    }

    return { error: null };
  }

  return {
    sections,
    productsById,
    stock,
    setStock,
    stockLabels,
    loading,
    error,
    setProductVisibility,
  };
}
