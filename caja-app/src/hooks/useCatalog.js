import { useCallback, useEffect, useState } from "react";
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

/* "Combo Fiesta" -> "combo" (primera palabra, sin tildes/mayúsculas) —
   la clave de "cluster" que usa clusterizarPorPrefijo para juntar
   productos "hermanos" que arrancan igual, aunque no compartan
   'nombre_base' (ej. "Combo Fiesta" y "Combo Lopezaaa" son productos
   DISTINTOS, no variantes uno del otro, pero igual deben quedar
   contiguos en la carta). */
function prefijoCluster(nombre) {
  const primera = (nombre || "").trim().split(/\s+/)[0] || "";
  return primera
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/* Reordena los productos de UN subgrupo/categoría agrupando (cluster)
   los que comparten prefijo, SIN ordenarlos alfabéticamente: el orden
   relativo entre clusters queda tal cual el de 'orden' original —
   respeta dónde apareció CADA cluster por primera vez ("sin importar
   si la 'C' va antes o después en el orden global"), solo jala hacia
   ahí a los demás miembros dispersos del mismo cluster. Estable: los
   productos dentro de un mismo cluster mantienen su orden relativo
   entre sí. Un producto de nombre único (sin "hermanos") es su propio
   cluster de 1 y no se mueve de su posición relativa. */
function clusterizarPorPrefijo(productos) {
  const ordenClusters = [];
  const porCluster = new Map();
  productos.forEach((p) => {
    const key = prefijoCluster(p.nombre_base || p.nombre);
    if (!porCluster.has(key)) {
      porCluster.set(key, []);
      ordenClusters.push(key);
    }
    porCluster.get(key).push(p);
  });
  return ordenClusters.flatMap((key) => porCluster.get(key));
}

/* Arma [{ key, label, groups: [{ numero, title, items: [...] }] }] a
   partir de las filas planas de 'categorias' + 'productos'. Es la
   MISMA forma que antes producía el array SECTIONS hardcodeado. */
function buildSectionsFromRows(categoriaRows, productoRows) {
  return categoriaRows.map((cat) => {
    const productosDeCategoria = productoRows
      .filter((p) => p.categoria === cat.nombre)
      .sort((a, b) => a.orden - b.orden);

    // Agrupa por 'subgrupo'.
    const groupsMap = new Map();
    productosDeCategoria.forEach((p) => {
      const groupKey = p.subgrupo || "__sin_subgrupo__";
      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, []);
      }
      groupsMap.get(groupKey).push(p);
    });

    // Orden ESTRICTO por el número al inicio del nombre del subgrupo
    // (ej. "01 RON CARTAVIO" antes que "02 OTRO PACK"), no por el
    // orden de aparición de los productos — el negocio depende de este
    // orden para que la carta se vea como espera. Natural/numeric
    // sort: "2" antes que "10" (localeCompare alfabético pondría "10"
    // primero). Los productos sin subgrupo van siempre al final.
    const groupsOrder = Array.from(groupsMap.keys()).sort((a, b) => {
      if (a === "__sin_subgrupo__") return 1;
      if (b === "__sin_subgrupo__") return -1;
      return a.localeCompare(b, undefined, { numeric: true });
    });

    const groups = groupsOrder.map((groupKey) => {
      const { numero, title } = parseSubgrupo(
        groupKey === "__sin_subgrupo__" ? null : groupKey
      );
      return {
        numero,
        title,
        items: clusterizarPorPrefijo(groupsMap.get(groupKey)).map((p) => ({
          id: p.id,
          combo: p.etiqueta || undefined,
          name: p.nombre,
          detail: p.descripcion || "",
          // Campos separados del refactor de variantes: 'baseName' es
          // la clave ESTRICTA de agrupación en el POS (ya no se adivina
          // por un separador en 'name'). Los productos cargados antes
          // de este refactor tienen baseName = su nombre completo
          // (backfill en la migración), así que quedan solos en su
          // propio grupo hasta que alguien los edite.
          baseName: p.nombre_base || p.nombre,
          variant: p.variante || "",
          presentation: p.presentacion || "",
          color: p.color_variante || null,
          // Puede quedar null/"" al duplicar un producto ("+ Añadir
          // Variante") — de ahí sale el botón "Asignar Código de
          // Barras" en Visibilidad en Catálogo.
          codigoBarras: p.codigo_barras || null,
          subgrupoRaw: p.subgrupo || null,
          price: Number(p.precio),
          // Descuento PERMANENTE (migración 0043) — único sistema de
          // descuento de la app: se configura desde el botón "%" de la
          // tarjeta y aplica a toda venta futura hasta que se cambie
          // desde ahí mismo. 0 = sin descuento.
          valorDescuento: p.valor_descuento != null ? Number(p.valor_descuento) : 0,
          tipoDescuento: p.tipo_descuento || "fijo",
          cost: p.costo != null ? Number(p.costo) : null,
          consumes: Array.isArray(p.consumos) ? p.consumos : JSON.parse(p.consumos || "[]"),
          visiblePublico: p.visible_publico ?? true,
          esCombo: p.es_combo ?? false,
          comboItems: Array.isArray(p.combo_items)
            ? p.combo_items
            : p.combo_items
              ? JSON.parse(p.combo_items)
              : null,
          imagenUrl: p.imagen_url || null,
          // "Venta a Granel / Por Peso": si es true, la cantidad en el
          // carrito/boletas son kilos (decimales), no unidades enteras.
          ventaPorPeso: p.venta_por_peso ?? false,
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
//
// Refactor de Stock (Multi-Sucursal): 'sucursalId' es OBLIGATORIO para
// que el stock salga poblado — la cantidad real de cada clave ya no
// vive en la columna 'stock.cantidad' (esa tabla ahora solo guarda la
// 'etiqueta', el nombre humano de la clave, que no varía por sucursal),
// sino en 'inventario_sucursales', una fila por (producto, sucursal).
// Sin 'sucursalId' (el admin todavía no eligió una arriba), el catálogo
// se arma igual (categorías/productos/precios) pero el stock queda
// vacío a propósito — mejor "todo en 0" que mezclar sucursales.
export function useCatalog(sucursalId) {
  const [sections, setSections] = useState([]);
  const [productsById, setProductsById] = useState({});
  const [stock, setStock] = useState({});
  const [stockLabels, setStockLabels] = useState({});
  const [stockCostos, setStockCostos] = useState({});
  const [stockUltimoCosto, setStockUltimoCosto] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Extraído como useCallback (en vez de una función local del efecto)
  // para poder exponerlo como 'refetch': el flujo de "crear producto al
  // vuelo" desde Editar Stock hace un INSERT fuera de este hook y
  // necesita refrescar sections/productsById/stock sin recargar la
  // página.
  const load = useCallback(async () => {
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
      setError(
        "No se pudo cargar el catálogo desde Supabase. Revisa las tablas 'categorias' y 'productos'."
      );
    }

    // 'stock' (global) ya solo aporta la 'etiqueta' (nombre humano de
    // cada clave) — no varía por sucursal, así que se sigue leyendo
    // entera, sin filtro.
    const { data: stockRows, error: stockError } = await supabase
      .from("stock")
      .select("nombre, cantidad, etiqueta");

    if (stockError) {
      console.error("Error cargando stock desde Supabase:", stockError);
    }

    const globalStockByKey = {};
    (stockRows || []).forEach((row) => {
      globalStockByKey[row.nombre] = row;
    });

    // Refactor de Stock: la cantidad/costo REAL, por sucursal, vive en
    // 'inventario_sucursales' — solo se pide si ya hay una sucursal
    // activa (sin ella no hay de dónde leer, ver comentario del hook).
    const invByProductId = {};
    if (sucursalId) {
      const { data: invRows, error: invError } = await supabase
        .from("inventario_sucursales")
        .select("producto_id, stock, precio_costo, ultimo_costo_compra")
        .eq("sucursal_id", sucursalId);

      if (invError) {
        console.error("Error cargando inventario_sucursales desde Supabase:", invError);
      }

      (invRows || []).forEach((row) => {
        invByProductId[row.producto_id] = row;
      });
    }

    const loadedStock = {};
    const loadedStockLabels = {};
    const loadedStockCostos = {};
    const loadedStockUltimoCosto = {};

    // Solo los productos "de stock directo" (una única consumes key, no
    // combo) tienen fila propia en 'inventario_sucursales' — un combo
    // JAMÁS tuvo (ni necesita) stock propio: su disponibilidad se
    // resuelve agregando la de sus ingredientes (availabilityFor en
    // App.jsx), que a su vez son siempre productos de stock directo.
    Object.values(builtProductsById).forEach((product) => {
      const singleKey =
        Array.isArray(product.consumes) && product.consumes.length === 1 && !product.esCombo;
      if (!singleKey) return;

      const key = product.consumes[0].key;
      const globalRow = globalStockByKey[key];
      loadedStockLabels[key] = globalRow?.etiqueta || key;

      const invRow = invByProductId[product.id];
      if (invRow) {
        loadedStock[key] = Number(invRow.stock);
        loadedStockCostos[key] = invRow.precio_costo != null ? Number(invRow.precio_costo) : null;
        loadedStockUltimoCosto[key] =
          invRow.ultimo_costo_compra != null ? Number(invRow.ultimo_costo_compra) : null;
      } else if (sucursalId) {
        // Hay sucursal activa pero esta clave no tiene fila propia ahí
        // todavía (producto creado después del backfill, o nunca
        // asignado a esta sucursal) — se muestra en 0 con costo
        // desconocido, nunca se inventa un número. Corrígelo editando
        // el stock de este producto desde el Gestor de Productos.
        console.warn(
          `"${product.name}" (clave "${key}") no tiene fila en 'inventario_sucursales' para esta sucursal — se muestra en 0.`
        );
        loadedStock[key] = 0;
        loadedStockCostos[key] = null;
        loadedStockUltimoCosto[key] = null;
      } else {
        // Sin sucursal activa todavía (el admin no eligió arriba): no
        // hay ningún stock que mostrar, a propósito.
        loadedStock[key] = 0;
        loadedStockCostos[key] = null;
        loadedStockUltimoCosto[key] = null;
      }
    });

    setSections(builtSections);
    setProductsById(builtProductsById);
    setStock(loadedStock);
    setStockLabels(loadedStockLabels);
    setStockCostos(loadedStockCostos);
    setStockUltimoCosto(loadedStockUltimoCosto);
    setLoading(false);
  }, [sucursalId]);

  useEffect(() => {
    load();
  }, [load]);

  /* ---- Sincronización en tiempo real: cualquier cambio en 'productos'
     (precio, descuento, visibilidad...), 'stock' (cantidad, costo) o
     'categorias' — desde OTRA pestaña/dispositivo (un admin editando
     precios, un cajero registrando una venta, la propia función
     registrar_venta descontando stock) — dispara un refetch completo
     acá, así todos los clientes conectados quedan al día sin recargar.
     Este efecto vive ACÁ (no en App.jsx ni en ningún modal): useCatalog
     ya es el hook COMPARTIDO que llaman tanto App.jsx (admin Y cajero,
     ambos roles renderizan el mismo componente) como CatalogPage.jsx
     (cliente/público) — cualquiera que sea el rol, si su pantalla usa
     useCatalog(), ya se suscribe acá, sin nada extra que "mover".

     Un refetch completo reutiliza TODA la lógica de armado ya probada
     en load() en vez de parchear a mano la fila que cambió —
     sections/productsById/stock siempre terminan construidos igual,
     disparen por Realtime o por la carga inicial.

     'debounce' junta ráfagas de eventos en un solo refetch: una venta
     con 3 productos distintos descuenta 3 filas de 'stock' dentro de
     LA MISMA transacción, y Postgres manda un evento de Realtime por
     cada una — sin esto, dispararía 3 refetches casi simultáneos
     pisándose entre sí.

     El callback de '.subscribe()' (status, err) NO es decorativo: sin
     él, si Realtime no está habilitado para 'productos'/'stock'/
     'categorias' en el lado de Supabase (Database → Replication, o
     falta correr la migración 0045), la suscripción falla EN
     SILENCIO — no hay error de red visible, simplemente nunca llegan
     eventos y todo sigue viéndose "roto" sin ninguna pista en consola.
     Con esto, un CHANNEL_ERROR/TIMED_OUT queda registrado, así se
     puede diferenciar "no está habilitado en la base" de "hay un bug
     acá". */
  useEffect(() => {
    let debounceTimer = null;
    const scheduleReload = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(load, 400);
    };

    const channel = supabase
      .channel(`catalogo-realtime-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "productos" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "stock" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "categorias" }, scheduleReload)
      // Refactor de Stock: 'inventario_sucursales' es ahora la fuente
      // real de la cantidad — sin esto, un descuento por venta desde
      // OTRO dispositivo (o la propia registrar_venta) nunca refrescaría
      // el stock en pantalla. Filtrado por 'sucursal_id' cuando ya hay
      // una activa: un cambio en OTRA sucursal no nos importa (ese
      // catálogo ni siquiera se está mostrando acá).
      .on(
        "postgres_changes",
        sucursalId
          ? {
              event: "*",
              schema: "public",
              table: "inventario_sucursales",
              filter: `sucursal_id=eq.${sucursalId}`,
            }
          : { event: "*", schema: "public", table: "inventario_sucursales" },
        scheduleReload
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log(
            "[Realtime] conectado — escuchando productos/stock/categorias/inventario_sucursales."
          );
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error(
            "[Realtime] no se pudo conectar (status:",
            status,
            "). Revisa que 'productos', 'stock', 'categorias' e 'inventario_sucursales' estén " +
              "agregadas a la publicación 'supabase_realtime' en Supabase (Database → Replication) " +
              "— ver migraciones 0045 y 0048.",
            err || ""
          );
        }
      });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [load, sucursalId]);

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

  // Reordena las categorías (Drag & Drop en "Visibilidad en Catálogo
  // Público"): 'newLabelOrder' es el array completo de nombres de
  // categoría en el orden final deseado. Actualiza 'sections' al toque
  // (optimista, para que el arrastre se sienta instantáneo) y persiste
  // un 'orden' correlativo (0, 1, 2…) por categoría — mucho más chico
  // que safeOrdenValue() (segundos desde 2024), así que una categoría
  // nueva creada después siempre cae al final sin pisar este orden
  // manual.
  async function reorderCategorias(newLabelOrder) {
    const previousSections = sections;
    const byLabel = new Map(sections.map((s) => [s.label, s]));
    const reordered = newLabelOrder.map((label) => byLabel.get(label)).filter(Boolean);
    sections.forEach((s) => {
      if (!newLabelOrder.includes(s.label)) reordered.push(s);
    });
    setSections(reordered);

    const results = await Promise.all(
      newLabelOrder.map((label, index) =>
        supabase.from("categorias").update({ orden: index }).eq("nombre", label).select("id")
      )
    );

    const failed = results.find((r) => r.error);
    const zeroRows = results.find((r) => !r.error && (!r.data || r.data.length === 0));

    if (failed || zeroRows) {
      console.error(
        "Error reordenando categorías:",
        failed?.error || "0 filas afectadas (probable política RLS de UPDATE faltante en 'categorias')"
      );
      setSections(previousSections);
      return { error: failed?.error || new Error("No se pudo guardar el nuevo orden.") };
    }

    return { error: null };
  }

  return {
    sections,
    productsById,
    stock,
    setStock,
    stockLabels,
    stockCostos,
    setStockCostos,
    stockUltimoCosto,
    setStockUltimoCosto,
    loading,
    error,
    setProductVisibility,
    reorderCategorias,
    refetch: load,
  };
}
