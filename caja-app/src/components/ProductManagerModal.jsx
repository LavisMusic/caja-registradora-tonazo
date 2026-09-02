import { useEffect, useRef, useState } from "react";
import { X, ChevronDown, ChevronUp, Save, Check, Loader2, Download } from "lucide-react";
import { formatSoles } from "../utils/format";
import ComboIngredients from "./ComboIngredients";

// ¿El producto que hay que enfocar (lápiz "Editar" de una tarjeta)
// vive dentro de esta categoría/subgrupo? Se usa SOLO como initializer
// perezoso de 'open' — una sola vez, al montar (ver CategoriaBlock/
// SubgrupoBlock más abajo), así el acordeón correcto ya nace abierto
// en vez de tener que expandirlo con un efecto después de pintar.
function categoriaContieneId(section, id) {
  if (!id) return false;
  return section.groups.some((g) => g.items.some((it) => it.id === id));
}
function grupoContieneId(group, id) {
  if (!id) return false;
  return group.items.some((it) => it.id === id);
}

/* Una fila de producto dentro de la tabla. 'singleKey' (consume de UNA
   sola clave de stock) es el mismo criterio que ya usa "Agregar
   Unidades al Stock": Stock y Costo Unitario solo son editables acá
   porque, si el producto consume de varias claves (combo) o de
   ninguna, no hay una única clave no ambigua a la que escribirle el
   número. Precio de Venta sí es siempre un campo propio del producto
   (columna 'productos.precio'), así que ese input aparece siempre para
   admin, sea combo o no.

   Stock/Costo/Precio son inputs CONTROLADOS (no defaultValue): el
   Margen Neto se recalcula en cada tecla a partir de lo que el admin
   está escribiendo, no de lo que ya está guardado — así ve el efecto
   del cambio ANTES de tocar "Guardar". El guardado es por fila (cada
   una tiene su propio botón/estado), vía 'onSaveRow' (guardarFilaProducto
   en App.jsx), que escribe en Supabase y al terminar refetchea el
   catálogo — así el resto de la app (tarjetas, checkout, dashboard)
   queda al día sin recargar la página. */
function ProductRow({
  item,
  stock,
  stockCostos,
  isAdmin,
  unitCostFor,
  availabilityFor,
  formatQty,
  formatDescuentoBadge,
  onSaveRow,
  productsById,
  focusProductId,
}) {
  const singleKey = Array.isArray(item.consumes) && item.consumes.length === 1 && !item.esCombo;
  const avail = availabilityFor(item, stock, productsById);
  const costoActual = unitCostFor(item, stockCostos);

  const [stockValue, setStockValue] = useState(avail === Infinity ? "" : String(avail));
  const [costoValue, setCostoValue] = useState(String(costoActual));
  const [precioValue, setPrecioValue] = useState(String(item.price));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Auto-scroll + resplandor temporal: solo corre una vez, al montar
  // (el modal entero se remonta cada vez que se abre, así que "al
  // montar" == "al abrirse el modal desde el lápiz de esta fila"). El
  // acordeón que contiene esta fila ya nace expandido (initializer de
  // 'open' en CategoriaBlock/SubgrupoBlock), así que la fila ya existe
  // en el DOM en el primer render — no hace falta esperar a que el
  // usuario abra nada a mano.
  const rowRef = useRef(null);
  const isFocusTarget = item.id === focusProductId;
  const [highlighted, setHighlighted] = useState(isFocusTarget);

  useEffect(() => {
    if (!isFocusTarget || !rowRef.current) return;
    rowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = setTimeout(() => setHighlighted(false), 2000);
    return () => clearTimeout(timer);
  }, [isFocusTarget]);

  const costoParaMargen = isAdmin && singleKey ? parseFloat(costoValue) : costoActual;
  const precioParaMargen = isAdmin ? parseFloat(precioValue) : item.price;
  const costoNum = isNaN(costoParaMargen) ? 0 : costoParaMargen;
  const precioNum = isNaN(precioParaMargen) ? 0 : precioParaMargen;
  // El Descuento Activo es de solo lectura acá (se configura desde el
  // botón "%" de la tarjeta, único lugar que lo guarda) — pero SÍ se
  // recalcula en vivo si el admin edita Precio/Costo en esta misma
  // fila: un descuento en % es un % de lo que esté escrito AHORA en
  // Precio de Venta, no del precio ya guardado.
  const descuentoSoles =
    item.valorDescuento > 0
      ? item.tipoDescuento === "porcentaje"
        ? precioNum * (Math.min(item.valorDescuento, 100) / 100)
        : Math.min(item.valorDescuento, precioNum)
      : 0;
  // Margen Neto = (Precio de Venta - Descuento) - Costo Unitario.
  const margenSoles = precioNum - descuentoSoles - costoNum;
  const margenPercent = precioNum > 0 ? (margenSoles / precioNum) * 100 : 0;
  const margenClass = margenSoles >= 0 ? "tz-pm-margin-positive" : "tz-pm-margin-negative";

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError("");
    const { error: saveError } = await onSaveRow(item, { stockValue, costoValue, precioValue });
    setSaving(false);
    if (saveError) {
      setError(saveError.message || "No se pudo guardar.");
      return;
    }
    setSaved(true);
  };

  return (
    <tr ref={rowRef} className={`tz-pm-row ${highlighted ? "tz-pm-row-highlight" : ""}`}>
      <td className="tz-pm-cell-nombre">
        {item.color && (
          <span className="tz-variant-dot tz-variant-dot-inline" style={{ background: item.color }} />
        )}
        {item.name}
        {item.detail && <span className="tz-pm-detail"> · {item.detail}</span>}
        {item.esCombo && <ComboIngredients item={item} productsById={productsById} />}
      </td>
      <td>
        {item.esCombo ? (
          // El stock de un combo no se digita: sale de sus
          // ingredientes al momento de vender (ver registrar_venta en
          // Supabase) — nunca un input ni un número acá.
          <span className="tz-pm-detail">Por ingredientes</span>
        ) : isAdmin && singleKey ? (
          <input
            type="number"
            min="0"
            className="tz-text-input tz-pm-input tz-pm-input-stock"
            value={stockValue}
            onChange={(e) => {
              setStockValue(e.target.value);
              setSaved(false);
            }}
          />
        ) : avail === Infinity ? (
          "—"
        ) : (
          formatQty(item.ventaPorPeso, avail)
        )}
      </td>
      <td>
        {isAdmin && singleKey ? (
          <input
            type="number"
            min="0"
            step="0.01"
            className="tz-text-input tz-pm-input"
            value={costoValue}
            onChange={(e) => {
              setCostoValue(e.target.value);
              setSaved(false);
            }}
          />
        ) : (
          formatSoles(costoActual)
        )}
      </td>
      <td>
        {isAdmin ? (
          <input
            type="number"
            min="0"
            step="0.01"
            className="tz-text-input tz-pm-input"
            value={precioValue}
            onChange={(e) => {
              setPrecioValue(e.target.value);
              setSaved(false);
            }}
          />
        ) : (
          formatSoles(item.price)
        )}
      </td>
      <td>
        {/* Solo lectura para todos (admin incluido): este valor se
           configura EXCLUSIVAMENTE desde el botón "%" de la tarjeta
           del catálogo — acá solo se muestra y se usa para el Margen
           Neto de la fila, editar/guardar acá crearía dos lugares que
           hacen lo mismo (justo lo que se quería evitar). */}
        <span
          className={`tz-pm-descuento-dot ${
            item.valorDescuento > 0 ? "tz-pm-dot-green" : "tz-pm-dot-red"
          }`}
        />
        {item.valorDescuento > 0 ? (
          <span className="tz-pm-descuento-badge">{formatDescuentoBadge(item)}</span>
        ) : (
          <span className="tz-pm-detail">Sin descuento</span>
        )}
      </td>
      <td className={margenClass}>
        {formatSoles(margenSoles)} ({margenPercent.toFixed(0)}%)
      </td>
      {isAdmin && (
        <td className="tz-pm-save-cell">
          <button
            type="button"
            className="tz-pm-save-btn"
            onClick={handleSave}
            disabled={saving}
            aria-label={`Guardar cambios de ${item.name}`}
            title="Guardar"
          >
            {saving ? (
              <Loader2 size={14} className="tz-spin" />
            ) : saved ? (
              <Check size={14} />
            ) : (
              <Save size={14} />
            )}
          </button>
          {error && <p className="tz-error tz-pm-row-error">{error}</p>}
        </td>
      )}
    </tr>
  );
}

function ProductTable({ items, ...rowProps }) {
  if (items.length === 0) {
    return <p className="tz-method-history-empty">Ningún producto en esta sección.</p>;
  }
  return (
    <div className="tz-pm-table-wrap">
      <table className="tz-pm-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Stock</th>
            <th>Costo Unit.</th>
            <th>Precio Venta</th>
            <th>Descuento Activo</th>
            <th>Margen Neto</th>
            {rowProps.isAdmin && <th>Guardar</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <ProductRow key={item.id} item={item} {...rowProps} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubgrupoBlock({ group, ...rowProps }) {
  const [open, setOpen] = useState(() => grupoContieneId(group, rowProps.focusProductId));
  return (
    <div className="tz-vis-subsection">
      <div className="tz-vis-header-row">
        <button type="button" className="tz-vis-subgroup-header" onClick={() => setOpen((v) => !v)}>
          <span>{group.title || "Sin subgrupo"}</span>
          <span className="tz-vis-category-meta">
            {group.items.length} {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </button>
      </div>
      {open && (
        <div className="tz-vis-accordion-inner">
          <ProductTable items={group.items} {...rowProps} />
        </div>
      )}
    </div>
  );
}

function CategoriaBlock({ section, ...rowProps }) {
  const [open, setOpen] = useState(() => categoriaContieneId(section, rowProps.focusProductId));
  const hasRealSubgroups = section.groups.length > 1 || !!section.groups[0]?.title;
  const totalItems = section.groups.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div className="tz-vis-category">
      <div className="tz-vis-header-row">
        <button type="button" className="tz-vis-category-header" onClick={() => setOpen((v) => !v)}>
          <span>{section.label}</span>
          <span className="tz-vis-category-meta">
            {totalItems} {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </button>
      </div>
      {open && (
        <div className="tz-vis-accordion-inner">
          {!hasRealSubgroups ? (
            <ProductTable items={section.groups[0]?.items ?? []} {...rowProps} />
          ) : (
            section.groups.map((group, gi) => (
              <SubgrupoBlock key={`${section.key}::${group.title ?? "sin-subgrupo"}::${gi}`} group={group} {...rowProps} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function ProductManagerModal({
  sections,
  productsById,
  stock,
  stockCostos,
  isAdmin,
  unitCostFor,
  availabilityFor,
  formatQty,
  formatDescuentoBadge,
  onSaveRow,
  onExportExcel,
  focusProductId,
  onClose,
}) {
  const rowProps = {
    stock,
    stockCostos,
    isAdmin,
    unitCostFor,
    availabilityFor,
    formatQty,
    formatDescuentoBadge,
    onSaveRow,
    productsById,
    focusProductId,
  };

  return (
    <div className="tz-modal-backdrop">
      <div className="tz-modal tz-modal-fullscreen" onClick={(e) => e.stopPropagation()}>
        <button className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <div className="tz-pm-header">
          <div className="tz-pm-header-top">
            <h2>Gestor de Productos</h2>
            <button type="button" className="tz-pm-export-btn" onClick={onExportExcel}>
              <Download size={15} /> Exportar a Excel
            </button>
          </div>
          <p className="tz-stock-editor-sub">
            {isAdmin
              ? "Edita Stock, Costo, Precio de Venta y Descuento y presiona el ✓ de la fila para guardar — el Margen se recalcula al escribir. El Descuento es permanente: aplica a toda venta futura hasta que lo cambies acá."
              : "Vista de solo lectura: Stock, Costo, Precio de Venta y Margen por producto."}
          </p>
        </div>
        <div className="tz-pm-body">
          {sections.map((section) => (
            <CategoriaBlock key={section.key} section={section} {...rowProps} />
          ))}
        </div>
      </div>
    </div>
  );
}
