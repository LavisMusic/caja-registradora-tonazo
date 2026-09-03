import { useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronUp,
  ScanLine,
  Loader2,
  Trash2,
  Check,
  X,
  Pencil,
  Plus,
  Copy,
  GripVertical,
  Sparkles,
} from "lucide-react";
import { buscarProductoPorCodigo } from "../lib/productLookup";
import BarcodeScannerModal from "./BarcodeScannerModal";
import ColorPicker from "./ColorPicker";

/* ---- DnD Multinivel (Categoría -> Subgrupo -> Producto): sobre
   @dnd-kit/core + @dnd-kit/sortable. Cada nivel (categorías dentro del
   acordeón, subgrupos dentro de una categoría, productos dentro de un
   subgrupo/categoría) es su propio <SortableContext> — así el drag se
   siente FÍSICO: al arrastrar, los demás elementos de ESA MISMA lista
   se apartan y hacen hueco en tiempo real (lo calcula @dnd-kit/sortable
   solo, comparando la posición de 'active' contra 'over' dentro del
   array 'items' del contexto — no hace falta mutar ningún estado a
   mano para verlo, solo pasar el array en el orden actual), en vez de
   "saltar y reemplazarse" recién al soltar.

   Cada fila/tarjeta usa un ÚNICO id (mismo para arrastrar Y soltar,
   'useSortable' ya combina ambos) — el grip (GripVertical) es el
   handle real (listeners/attributes ahí, vía 'setActivatorNodeRef'),
   pero el nodo que se mueve/anima es la fila COMPLETA ('setNodeRef').
   Los objetivos "hoja" siguen sin anidarse entre sí (mismo diseño de
   antes, para que pointerWithin nunca quede ambiguo):
     - Categorías se sueltan sobre OTRAS categorías (reordenar, dentro
       del SortableContext superior).
     - Subgrupos se sueltan sobre CABECERAS de categoría (mover al
       final de otra categoría) o sobre OTROS subgrupos (reordenar/
       mover, se inserta ANTES del subgrupo soltado — dentro del
       SortableContext de esa categoría).
     - Productos se sueltan sobre CABECERAS de categoría (agregar sin
       subgrupo), CABECERAS de subgrupo (agregar al final de ese
       subgrupo) o sobre OTROS productos (reordenar/mover, se inserta
       ANTES del producto soltado — dentro del SortableContext de ese
       subgrupo/categoría), o sobre la "zona de crafteo" de Combos.
   El "moverse dentro de otra lista" (cruzar de subgrupo/categoría) NO
   tiene la animación de hueco en vivo de @dnd-kit/sortable (el ítem no
   es miembro del SortableContext ajeno mientras se arrastra) — pero
   el resultado final, vía handleDragEnd, es idéntico a reordenar. ---- */

function useSortableItem(id, data, disabled) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id, data, disabled });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return { attributes, listeners, setNodeRef, setActivatorNodeRef, style, isDragging, isOver };
}

function useDropSlot(id, data) {
  const { setNodeRef, isOver } = useDroppable({ id, data });
  return { setNodeRef, isOver };
}

// Categoría "Combos" es especial: sus productos NO se agregan como
// ítems individuales (arrastrados desde otra categoría, o soltados
// directo sobre su cabecera/subgrupo/fila) — la ÚNICA puerta de
// entrada es la Zona de Crafteo (ComboCraftZone), que arma un producto
// NUEVO vía el modal "Nuevo Combo". Reordenar productos que YA son de
// Combos entre sí sigue funcionando normal (eso no es "entrar como
// ítem individual", ya están ahí).
function esCategoriaCombos(label) {
  return (label || "").trim().toLowerCase() === "combos";
}

/* Fila de un producto: toggle de visibilidad, editar (nombre/detalle)
   y eliminar (con confirmación inline en vez de un modal aparte, para
   no apilar overlays sobre el acordeón). Si el borrado choca con una
   FK (producto con ventas registradas), ofrece desactivar en su lugar
   (soft delete vía 'activo') en el mismo lugar, sin que el usuario
   tenga que repetir la acción desde cero.

   Orden de los controles a la derecha: Toggle, luego Lápiz (editar),
   luego Papelera (eliminar) — el lápiz ocupa el lugar donde antes
   estaba el toggle, y el toggle se corrió un paso a la izquierda.

   DnD: toda la fila es un droppable ("soltar OTRO producto antes de
   este"); el GripVertical al inicio es el ÚNICO punto arrastrable
   (drag handle) — así no interfiere con los botones/toggle/inputs del
   resto de la fila. */
function ProductoRow({
  producto,
  onToggleVisibility,
  onDelete,
  onSoftDelete,
  onEditProducto,
  onAssignBarcode,
  categoriaLabel,
  subgrupoRaw,
  onAddVariante,
  movingId,
  activeDrag,
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fkConflict, setFkConflict] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editNombreBase, setEditNombreBase] = useState(producto.baseName || producto.name);
  const [editVariante, setEditVariante] = useState(producto.variant || "");
  const [editPresentacion, setEditPresentacion] = useState(producto.presentation || "");
  const [editColor, setEditColor] = useState(producto.color || null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // "Asignar Código de Barras": solo aplica si el producto todavía no
  // tiene uno (típico tras "+ Añadir Variante", que duplica sin
  // codigo_barras para no chocar con el producto original).
  const [assigningBarcode, setAssigningBarcode] = useState(false);
  const [barcodeSaving, setBarcodeSaving] = useState(false);
  const [barcodeError, setBarcodeError] = useState("");

  const [addingVariante, setAddingVariante] = useState(false);
  const [varianteSabor, setVarianteSabor] = useState("");
  const [variantePresentacion, setVariantePresentacion] = useState("");
  const [varianteColor, setVarianteColor] = useState(null);
  const [varianteSaving, setVarianteSaving] = useState(false);
  const [varianteError, setVarianteError] = useState("");

  const dragId = `prod:${producto.id}`;
  const sortable = useSortableItem(dragId, {
    type: "producto",
    productoId: producto.id,
    categoriaLabel,
    subgrupoRaw,
  });
  // La BD todavía no confirmó el movimiento que soltó ESTE producto —
  // pulso neón + spinner en el handle en vez de dejar la fila "seca"
  // hasta que refetchCatalog() traiga el nuevo orden.
  const isSaving = movingId === dragId;
  // Bloqueo de Categoría (Combos): mismo criterio que en
  // CategoriaAccordion/SubgrupoSection — un producto AJENO sobrevolando
  // esta fila (para "insertarse antes") tampoco cuenta como aceptado
  // cuando la fila ya es de Combos.
  const isDropForbidden =
    esCategoriaCombos(categoriaLabel) &&
    sortable.isOver &&
    activeDrag?.type === "producto" &&
    activeDrag.productoId !== producto.id &&
    !esCategoriaCombos(activeDrag.categoriaLabel);

  const handleDeleteClick = async () => {
    setBusy(true);
    setError("");
    setFkConflict(false);
    const { error: delError, fkConflict: isFk } = await onDelete(producto);
    setBusy(false);
    if (delError) {
      if (isFk) {
        setFkConflict(true);
      } else {
        setError(
          delError.message
            ? `No se pudo eliminar: ${delError.message}`
            : "No se pudo eliminar el producto."
        );
      }
      return;
    }
    // Si funcionó, el padre ya refrescó el catálogo — esta fila
    // desaparece sola cuando 'productos' se vuelva a construir.
  };

  const handleSoftDeleteClick = async () => {
    setBusy(true);
    const { error: softError } = await onSoftDelete(producto);
    setBusy(false);
    if (softError) {
      setError("No se pudo desactivar el producto. Intenta de nuevo.");
    }
  };

  const startEdit = () => {
    setEditNombreBase(producto.baseName || producto.name);
    setEditVariante(producto.variant || "");
    setEditPresentacion(producto.presentation || "");
    setEditColor(producto.color || null);
    setEditError("");
    setEditing(true);
  };

  const saveEdit = async () => {
    const nombreBase = editNombreBase.trim();
    if (!nombreBase) {
      setEditError("El nombre base no puede quedar vacío.");
      return;
    }
    setEditSaving(true);
    setEditError("");
    const { error: saveError } = await onEditProducto(producto, {
      nombreBase,
      variante: editVariante.trim(),
      presentacion: editPresentacion.trim(),
      color: editColor,
    });
    setEditSaving(false);
    if (saveError) {
      setEditError(
        saveError.message ? `No se pudo guardar: ${saveError.message}` : "No se pudo guardar."
      );
      return;
    }
    setEditing(false);
  };

  const handleAssignBarcode = async (codigo) => {
    setBarcodeSaving(true);
    setBarcodeError("");
    const { error: assignError } = await onAssignBarcode(producto, codigo);
    setBarcodeSaving(false);
    if (assignError) {
      setBarcodeError(
        assignError.message ? assignError.message : "No se pudo guardar el código de barras."
      );
      return;
    }
    setAssigningBarcode(false);
  };

  /* ---- + Añadir Variante: crea un producto NUEVO (con su propia
     clave de stock — es mercadería físicamente distinta, no debe
     compartir inventario con "producto") duplicando nombre base,
     categoría, subgrupo y precio base — solo pide el sabor/variedad
     nuevo (+ presentación y color opcionales). Reusa crearProducto()
     vía onAddVariante, la MISMA función que ya usa el alta rápida al
     escanear un código no encontrado. ---- */
  const startAddVariante = () => {
    setVarianteSabor("");
    setVariantePresentacion("");
    setVarianteColor(null);
    setVarianteError("");
    setAddingVariante(true);
  };

  const saveVariante = async () => {
    const sabor = varianteSabor.trim();
    if (!sabor) {
      setVarianteError("Escribe el sabor o variedad nuevo.");
      return;
    }
    setVarianteSaving(true);
    setVarianteError("");
    const { error: varError } = await onAddVariante(producto, categoriaLabel, subgrupoRaw, {
      variante: sabor,
      presentacion: variantePresentacion.trim(),
      color: varianteColor,
    });
    setVarianteSaving(false);
    if (varError) {
      setVarianteError(
        varError.message ? `No se pudo crear: ${varError.message}` : "No se pudo crear la variante."
      );
      return;
    }
    setAddingVariante(false);
    setVarianteSabor("");
    setVariantePresentacion("");
    setVarianteColor(null);
  };

  let content;

  if (addingVariante) {
    content = (
      <div className="tz-vis-confirm-delete">
        <p>
          Nueva variante de <strong>{producto.baseName || producto.name}</strong> — mismo precio y
          categoría, clave de stock propia.
        </p>
        <input
          type="text"
          className="tz-text-input"
          placeholder='Sabor / variedad (ej. "Fresa")'
          value={varianteSabor}
          onChange={(e) => setVarianteSabor(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveVariante();
          }}
          autoFocus
        />
        <input
          type="text"
          className="tz-text-input"
          placeholder="Presentación / medida (opcional)"
          value={variantePresentacion}
          onChange={(e) => setVariantePresentacion(e.target.value)}
        />
        <ColorPicker value={varianteColor} onChange={setVarianteColor} />
        {varianteError && <p className="tz-error">{varianteError}</p>}
        <div className="tz-vis-confirm-actions">
          <button
            type="button"
            className="tz-cliente-action-btn tz-cliente-action-pago"
            onClick={saveVariante}
            disabled={varianteSaving}
          >
            {varianteSaving ? <Loader2 size={13} className="tz-spin" /> : <Check size={13} />}
            Crear variante
          </button>
          <button
            type="button"
            className="tz-cliente-action-btn"
            onClick={() => setAddingVariante(false)}
            disabled={varianteSaving}
          >
            <X size={13} /> Cancelar
          </button>
        </div>
      </div>
    );
  } else if (confirming) {
    content = (
      <div className="tz-vis-confirm-delete">
        <p>
          ¿Eliminar <strong>{producto.name}</strong> definitivamente?
        </p>
        {error && <p className="tz-error">{error}</p>}
        {fkConflict && (
          <p className="tz-error">
            No se puede eliminar porque tiene ventas registradas — se recomienda solo
            desactivarlo.
          </p>
        )}
        <div className="tz-vis-confirm-actions">
          {fkConflict ? (
            <button
              type="button"
              className="tz-cliente-action-btn tz-cliente-action-pago"
              onClick={handleSoftDeleteClick}
              disabled={busy}
            >
              {busy ? <Loader2 size={13} className="tz-spin" /> : <Check size={13} />}
              Desactivar en su lugar
            </button>
          ) : (
            <button
              type="button"
              className="tz-cliente-action-btn tz-cliente-action-deuda"
              onClick={handleDeleteClick}
              disabled={busy}
            >
              {busy ? <Loader2 size={13} className="tz-spin" /> : <Trash2 size={13} />}
              Sí, eliminar
            </button>
          )}
          <button
            type="button"
            className="tz-cliente-action-btn"
            onClick={() => {
              setConfirming(false);
              setError("");
              setFkConflict(false);
            }}
            disabled={busy}
          >
            <X size={13} /> Cancelar
          </button>
        </div>
      </div>
    );
  } else if (editing) {
    content = (
      <div className="tz-vis-confirm-delete">
        <input
          type="text"
          className="tz-text-input"
          placeholder="Nombre Base"
          value={editNombreBase}
          onChange={(e) => setEditNombreBase(e.target.value)}
          autoFocus
        />
        <div className="tz-nombre-detalle-row">
          <input
            type="text"
            className="tz-text-input"
            placeholder="Sabor / Variedad (opcional)"
            value={editVariante}
            onChange={(e) => setEditVariante(e.target.value)}
          />
          <input
            type="text"
            className="tz-text-input"
            placeholder="Presentación (opcional)"
            value={editPresentacion}
            onChange={(e) => setEditPresentacion(e.target.value)}
          />
        </div>
        <ColorPicker value={editColor} onChange={setEditColor} />
        {editError && <p className="tz-error">{editError}</p>}
        <div className="tz-vis-confirm-actions">
          <button
            type="button"
            className="tz-cliente-action-btn tz-cliente-action-pago"
            onClick={saveEdit}
            disabled={editSaving}
          >
            {editSaving ? <Loader2 size={13} className="tz-spin" /> : <Check size={13} />}
            Guardar
          </button>
          <button
            type="button"
            className="tz-cliente-action-btn"
            onClick={() => setEditing(false)}
            disabled={editSaving}
          >
            <X size={13} /> Cancelar
          </button>
        </div>

        {/* Solo aparece si el producto todavía no tiene código — el
           caso típico es una variante recién duplicada con "+ Añadir
           Variante", que a propósito deja 'codigo_barras' en null para
           no chocar con el producto original. */}
        {!producto.codigoBarras && (
          <>
            <button
              type="button"
              className="tz-cliente-action-btn"
              style={{ marginTop: 8 }}
              onClick={() => {
                setBarcodeError("");
                setAssigningBarcode(true);
              }}
              disabled={barcodeSaving}
            >
              {barcodeSaving ? <Loader2 size={13} className="tz-spin" /> : <ScanLine size={13} />}
              Asignar Código de Barras
            </button>
            {barcodeError && <p className="tz-error">{barcodeError}</p>}
          </>
        )}
        {assigningBarcode && (
          <BarcodeScannerModal
            onScan={handleAssignBarcode}
            onClose={() => setAssigningBarcode(false)}
          />
        )}
      </div>
    );
  } else {
    content = (
      <div className="tz-stock-row">
        <span
          className="tz-vis-drag-handle"
          ref={sortable.setActivatorNodeRef}
          {...sortable.listeners}
          {...sortable.attributes}
          aria-label={`Arrastrar ${producto.name}`}
          title="Arrastrar para reordenar/mover"
        >
          {isSaving ? <Loader2 size={14} className="tz-spin" /> : <GripVertical size={14} />}
        </span>
        <div className="tz-stock-row-info">
          <span className="tz-stock-row-name">
            {producto.color && (
              <span className="tz-variant-dot tz-variant-dot-inline" style={{ background: producto.color }} />
            )}
            {producto.name}
          </span>
          {producto.detail && <span className="tz-vis-row-detail">{producto.detail}</span>}
        </div>
        <div className="tz-vis-row-actions">
          <label className="tz-toggle">
            <input
              type="checkbox"
              checked={producto.visiblePublico ?? true}
              onChange={(e) => onToggleVisibility(producto, e.target.checked)}
            />
            <span className="tz-toggle-slider" />
          </label>
          <button
            type="button"
            className="tz-vis-edit-btn"
            onClick={startEdit}
            aria-label={`Editar ${producto.name}`}
            title="Editar producto"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            className="tz-vis-edit-btn"
            onClick={startAddVariante}
            aria-label={`Añadir variante de ${producto.name}`}
            title="+ Añadir Variante"
          >
            <Copy size={14} />
          </button>
          <button
            type="button"
            className="tz-vis-delete-btn"
            onClick={() => setConfirming(true)}
            aria-label={`Eliminar ${producto.name}`}
            title="Eliminar producto"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    );
  }

  // Al arrancar un drag, dnd-kit suele resolver 'over' como el MISMO
  // ítem que se está arrastrando (el puntero todavía está encima de su
  // punto de origen) — sin este guard, la fila se auto-iluminaba como
  // "aceptando un drop" de sí misma, un glow que además se veía
  // recortado por quedar pegado al borde de su propio contenedor.
  const showAcceptGlow = sortable.isOver && !sortable.isDragging;

  return (
    <div
      ref={sortable.setNodeRef}
      style={sortable.style}
      className={`tz-vis-dnd-slot ${
        isDropForbidden ? "tz-vis-drag-forbidden" : showAcceptGlow ? "tz-vis-dnd-slot-over" : ""
      } ${sortable.isDragging ? "tz-vis-dnd-dragging" : ""} ${isSaving ? "tz-vis-dnd-saving" : ""}`}
    >
      {content}
    </div>
  );
}

/* Búsqueda + escáner CONTEXTUAL: solo busca/filtra dentro de 'items'
   (los productos de la categoría o subgrupo donde vive esta sección),
   nunca en el catálogo completo. Si el código escaneado pertenece a
   otro producto fuera de esta sección, se avisa en vez de mostrarlo. */
function SearchableProductList({
  items,
  onToggleVisibility,
  onDelete,
  onSoftDelete,
  onEditProducto,
  onAssignBarcode,
  categoriaLabel,
  subgrupoRaw,
  onAddVariante,
  movingId,
  activeDrag,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanBusy, setScanBusy] = useState(false);
  const [scanError, setScanError] = useState("");

  const handleScan = async (codigo) => {
    setScannerOpen(false);
    setScanBusy(true);
    setScanError("");
    try {
      const producto = await buscarProductoPorCodigo(codigo);
      if (!producto) {
        setScanError(`No se encontró ningún producto con el código "${codigo}".`);
        return;
      }
      const local = items.find((it) => it.id === producto.id);
      if (!local) {
        setScanError(`"${producto.nombre}" no pertenece a esta sección.`);
        return;
      }
      setSearchTerm(local.name);
    } catch (err) {
      console.error("Error buscando producto escaneado (visibilidad):", err);
      setScanError("Error al buscar el producto. Intenta de nuevo.");
    } finally {
      setScanBusy(false);
    }
  };

  const filtered = items.filter(
    (p) => !searchTerm.trim() || p.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  return (
    <div className="tz-vis-subsection-body">
      <div className="tz-vis-search-row">
        <input
          type="text"
          className="tz-text-input"
          placeholder="Buscar en esta sección…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          type="button"
          className="tz-scan-btn tz-vis-scan-btn"
          onClick={() => {
            setScanError("");
            setScannerOpen(true);
          }}
          disabled={scanBusy}
          aria-label="Escanear producto"
          title="Escanear producto"
        >
          {scanBusy ? <Loader2 size={15} className="tz-spin" /> : <ScanLine size={15} />}
        </button>
      </div>
      {scanError && <p className="tz-error">{scanError}</p>}

      {filtered.length === 0 ? (
        <p className="tz-method-history-empty">Ningún producto coincide.</p>
      ) : (
        <div className="tz-stock-list">
          <SortableContext
            items={filtered.map((p) => `prod:${p.id}`)}
            strategy={verticalListSortingStrategy}
          >
            {filtered.map((p) => (
              <ProductoRow
                key={p.id}
                producto={p}
                onToggleVisibility={onToggleVisibility}
                onDelete={onDelete}
                onSoftDelete={onSoftDelete}
                onEditProducto={onEditProducto}
                onAssignBarcode={onAssignBarcode}
                categoriaLabel={categoriaLabel}
                subgrupoRaw={subgrupoRaw}
                onAddVariante={onAddVariante}
                movingId={movingId}
                activeDrag={activeDrag}
              />
            ))}
          </SortableContext>
        </div>
      )}

      {scannerOpen && (
        <BarcodeScannerModal onScan={handleScan} onClose={() => setScannerOpen(false)} />
      )}
    </div>
  );
}

/* ---- Zona de "Crafteo"/Fusión de Combos: droppable único y fijo
   ("combo-craft-zone") que vive arriba de todo, SOLO dentro de la
   categoría Combos. Sin nada "staged" es una caja vacía a la espera
   del primer producto; con un producto "staged" se convierte en su
   tarjeta (con X para descartar) — sigue siendo el MISMO droppable, así
   que soltar el segundo producto exactamente ahí es lo que dispara la
   fusión (Paso 2/3 del pedido).

   'isFusionHover' (Paso 2, ANTES de soltar): con un producto YA
   staged, si un SEGUNDO producto está siendo arrastrado exactamente
   por encima de esta misma zona, la tarjeta staged se ilumina con un
   pulso — la fusión "se siente venir" mientras se arrastra, no recién
   al soltar (eso lo sigue cubriendo ComboFusionOverlay). ---- */
function ComboCraftZone({ stagedProduct, onDiscard, activeDrag }) {
  const drop = useDropSlot("combo-craft-zone", { type: "combo-craft-zone" });
  const isFusionHover = !!stagedProduct && drop.isOver && activeDrag?.type === "producto";

  return (
    <div
      ref={drop.setNodeRef}
      className={`tz-combo-craft-zone ${drop.isOver ? "tz-combo-craft-zone-over" : ""} ${
        stagedProduct ? "tz-combo-craft-zone-staged" : ""
      } ${isFusionHover ? "tz-combo-craft-zone-fusing-preview" : ""}`}
    >
      {stagedProduct ? (
        <div className={`tz-combo-staged-card ${isFusionHover ? "tz-combo-staged-card-fusing" : ""}`}>
          <Sparkles size={16} />
          <span className="tz-combo-staged-name">{stagedProduct.name}</span>
          <span className="tz-combo-staged-hint">Suelta OTRO producto acá para combinarlos</span>
          <button
            type="button"
            className="tz-combo-staged-discard"
            onClick={onDiscard}
            aria-label="Descartar"
            title="Descartar"
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <p className="tz-combo-craft-zone-empty">
          <Sparkles size={15} /> Arrastra un producto acá para empezar a armar un Combo
        </p>
      )}
    </div>
  );
}

/* ---- Overlay de fusión: se monta un instante (ver 'fusing' en el
   componente raíz) mostrando las dos tarjetas conectadas por líneas
   neón curvas y animadas — puramente decorativo, cubre la pantalla
   entera (position: fixed) y nunca intercepta clics (pointer-events:
   none). Se retira solo, con un setTimeout en el componente raíz que
   coincide con la duración de la animación. ---- */
function ComboFusionOverlay({ productoA, productoB }) {
  return (
    <div className="tz-combo-fusion-overlay">
      <div className="tz-combo-fusion-card tz-combo-fusion-card-a">{productoA.name}</div>
      <svg className="tz-combo-fusion-svg" viewBox="0 0 400 160" preserveAspectRatio="none">
        <path className="tz-combo-fusion-path tz-combo-fusion-path-1" d="M40,80 C140,20 260,140 360,80" />
        <path className="tz-combo-fusion-path tz-combo-fusion-path-2" d="M40,80 C140,140 260,20 360,80" />
      </svg>
      <div className="tz-combo-fusion-card tz-combo-fusion-card-b">{productoB.name}</div>
      <div className="tz-combo-fusion-label">
        <Sparkles size={18} /> Combinando…
      </div>
    </div>
  );
}

/* Una fila de subgrupo (cabecera + su lista de productos si está
   abierto). Extraído como su PROPIO componente (no un .map() inline
   dentro de CategoriaAccordion) por una razón muy concreta: cada fila
   necesita sus propios useDraggable/useDroppable, y las Reglas de los
   Hooks de React PROHÍBEN llamar hooks dentro de un callback de .map()
   — tienen que vivir en el nivel superior de un componente que se
   instancia una vez por elemento del array (mismo motivo por el que
   ProductoRow ya era su propio componente). El estado de "estoy
   editando el nombre" es EXCLUSIVO a nivel de toda la categoría (uno
   a la vez) y sigue viviendo en CategoriaAccordion — acá solo se
   recibe como props. */
function SubgrupoSection({
  section,
  group,
  gi,
  sectionKey,
  openSubgrupos,
  onToggleSubgrupo,
  isEditing,
  editValue,
  onEditValueChange,
  editSaving,
  editError,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeleteSubgrupo,
  onToggleVisibility,
  onDelete,
  onSoftDelete,
  onEditProducto,
  onAssignBarcode,
  onAddVariante,
  rawSubgrupo,
  movingId,
  activeDrag,
}) {
  const key = `${sectionKey}::${group.title ?? "sin-subgrupo"}::${gi}`;
  const subOpen = openSubgrupos.has(key);
  const raw = rawSubgrupo(group);

  const subDragId = `sub:${sectionKey}:${gi}`;
  // 'sectionKey'/'gi'/'title' viajan en la data SOLO para que
  // handleDragOver (auto-despliegue) pueda reconstruir la MISMA clave
  // de 'openSubgrupos' que arma este componente arriba, sin duplicar
  // esa fórmula en otro lado.
  const subSortable = useSortableItem(subDragId, {
    type: "subgroup",
    categoriaLabel: section.label,
    subgrupoRaw: raw,
    sectionKey,
    gi,
    title: group.title,
  });
  const isSaving = movingId === subDragId;
  // Bloqueo de Categoría (Combos): mismo criterio que en
  // CategoriaAccordion — un producto AJENO sobrevolando la cabecera de
  // un subgrupo DENTRO de Combos tampoco cuenta como "aceptado".
  const isDropForbidden =
    esCategoriaCombos(section.label) &&
    subSortable.isOver &&
    activeDrag?.type === "producto" &&
    !esCategoriaCombos(activeDrag.categoriaLabel);
  // Mismo guard de auto-hover que ProductoRow: un subgrupo no se
  // ilumina como "aceptando" un drop de sí mismo.
  const showAcceptGlow = subSortable.isOver && !subSortable.isDragging;

  return (
    <div
      className={`tz-vis-subsection ${
        isDropForbidden ? "tz-vis-drag-forbidden" : showAcceptGlow ? "tz-vis-dnd-slot-over" : ""
      } ${subSortable.isDragging ? "tz-vis-dnd-dragging" : ""} ${isSaving ? "tz-vis-dnd-saving" : ""}`}
      ref={subSortable.setNodeRef}
      style={subSortable.style}
    >
      {isEditing ? (
        <div className="tz-vis-inline-edit-row">
          <input
            type="text"
            className="tz-text-input"
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            autoFocus
          />
          <button
            type="button"
            className="tz-vis-edit-btn"
            onClick={onSaveEdit}
            disabled={editSaving}
            aria-label="Guardar subgrupo"
          >
            {editSaving ? <Loader2 size={13} className="tz-spin" /> : <Check size={13} />}
          </button>
          <button
            type="button"
            className="tz-vis-edit-btn"
            onClick={onCancelEdit}
            disabled={editSaving}
            aria-label="Cancelar"
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <div className="tz-vis-header-row">
          <span
            ref={subSortable.setActivatorNodeRef}
            className="tz-vis-drag-handle"
            {...subSortable.listeners}
            {...subSortable.attributes}
            aria-label={`Arrastrar subgrupo ${group.title || "sin subgrupo"}`}
            title="Arrastrar para reordenar/mover"
          >
            {isSaving ? <Loader2 size={13} className="tz-spin" /> : <GripVertical size={13} />}
          </span>
          <button type="button" className="tz-vis-subgroup-header" onClick={() => onToggleSubgrupo(key)}>
            <span>{group.title || "Sin subgrupo"}</span>
            <span className="tz-vis-category-meta">
              {group.items.length} {subOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          </button>
          {group.title && (
            <>
              <button
                type="button"
                className="tz-vis-edit-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartEdit(key, group);
                }}
                aria-label={`Editar subgrupo ${group.title}`}
                title="Editar subgrupo"
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                className="tz-vis-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSubgrupo(group);
                }}
                aria-label={`Eliminar subgrupo ${group.title}`}
                title="Eliminar subgrupo"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      )}
      {isEditing && editError && <p className="tz-error">{editError}</p>}
      {subOpen && !isEditing && (
        <div className="tz-vis-accordion-inner">
          <SearchableProductList
            items={group.items}
            onToggleVisibility={onToggleVisibility}
            onDelete={onDelete}
            onSoftDelete={onSoftDelete}
            onEditProducto={onEditProducto}
            onAssignBarcode={onAssignBarcode}
            categoriaLabel={section.label}
            subgrupoRaw={raw}
            onAddVariante={onAddVariante}
            movingId={movingId}
            activeDrag={activeDrag}
          />
        </div>
      )}
    </div>
  );
}

/* Acordeón de 2 niveles: Categoría -> (Subgrupo si existe -> productos
   | productos directo si no hay subgrupos). Cada nivel hoja tiene su
   propio buscador/escáner contextual (SearchableProductList). Los
   encabezados de Categoría y Subgrupo llevan un botón de lápiz que
   dispara un UPDATE masivo (todos los productos que comparten ese
   valor) — acá no hay una fila individual que editar, el "nombre de
   categoría/subgrupo" es un string repetido en varias filas.

   'open'/'onToggleOpen' (categoría) y 'openSubgrupos'/'onToggleSubgrupo'
   viven en el componente RAÍZ (no acá) — el auto-despliegue por hover
   durante un drag necesita poder abrir una categoría desde AFUERA,
   sin que el usuario haya hecho clic en nada. */
function CategoriaAccordion({
  section,
  isOpen,
  onToggleOpen,
  openSubgrupos,
  onToggleSubgrupo,
  onToggleVisibility,
  onDelete,
  onSoftDelete,
  onEditProducto,
  onAssignBarcode,
  onRenameCategoria,
  onRenameSubgrupo,
  onDeleteCategoria,
  onDeleteSubgrupo,
  onForceHideCategoria,
  onForceHideSubgrupo,
  onAddVariante,
  isCombosCategoria,
  stagedProduct,
  onDiscardStaged,
  movingId,
  activeDrag,
}) {
  const [editingCategoria, setEditingCategoria] = useState(false);
  const [categoriaValue, setCategoriaValue] = useState(section.label);
  const [categoriaSaving, setCategoriaSaving] = useState(false);
  const [categoriaError, setCategoriaError] = useState("");

  const [editingSubgrupoKey, setEditingSubgrupoKey] = useState(null);
  const [subgrupoValue, setSubgrupoValue] = useState("");
  const [subgrupoSaving, setSubgrupoSaving] = useState(false);
  const [subgrupoError, setSubgrupoError] = useState("");

  const catDragId = `cat:${section.key}`;
  const catSortable = useSortableItem(catDragId, {
    type: "category",
    categoriaLabel: section.label,
  });
  const isSaving = movingId === catDragId;
  // Bloqueo de Categoría (Combos): un producto AJENO sobrevolando esta
  // cabecera no debería sentirse "aceptado" — reemplaza el glow cian
  // normal por uno rojo de "no" en vez del habitual acento cian.
  const isDropForbidden =
    isCombosCategoria &&
    catSortable.isOver &&
    activeDrag?.type === "producto" &&
    !esCategoriaCombos(activeDrag.categoriaLabel);

  const saveCategoriaRename = async () => {
    setCategoriaSaving(true);
    setCategoriaError("");
    const { error, ghostCategoria } = await onRenameCategoria(section.label, categoriaValue);
    setCategoriaSaving(false);
    if (error) {
      setCategoriaError(error.message ? `No se pudo guardar: ${error.message}` : "No se pudo guardar.");
      return;
    }
    // El rename en sí funcionó (productos migrados) — si la categoría
    // vieja quedó como fantasma (RLS/0 filas), se oculta del lado del
    // cliente aunque el refetch la siga trayendo de vuelta.
    if (ghostCategoria) onForceHideCategoria?.(ghostCategoria);
    setEditingCategoria(false);
  };

  // El string real guardado en 'productos.subgrupo' incluye el número
  // ("01 Combos"), pero 'group.title' ya viene sin él (parseSubgrupo
  // lo separó para mostrarlo como encabezado) — hay que reconstruirlo
  // para editar/buscar el valor tal como vive en la base.
  const rawSubgrupo = (group) => (group.numero ? `${group.numero} ${group.title}` : group.title);

  const startEditSubgrupo = (key, group) => {
    setEditingSubgrupoKey(key);
    setSubgrupoValue(rawSubgrupo(group));
    setSubgrupoError("");
  };

  const saveSubgrupoRename = async (group) => {
    setSubgrupoSaving(true);
    setSubgrupoError("");
    const { error, ghostSubgrupo } = await onRenameSubgrupo(
      section.label,
      rawSubgrupo(group),
      subgrupoValue
    );
    setSubgrupoSaving(false);
    if (error) {
      setSubgrupoError(error.message ? `No se pudo guardar: ${error.message}` : "No se pudo guardar.");
      return;
    }
    if (ghostSubgrupo) onForceHideSubgrupo?.(section.label, group.title);
    setEditingSubgrupoKey(null);
  };

  const handleDeleteCategoria = async () => {
    if (
      !window.confirm(
        `¿Eliminar definitivamente la categoría "${section.label}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }
    const { error, fkConflict, zeroRows } = await onDeleteCategoria(section.label);
    if (error) {
      alert(
        fkConflict
          ? "No se puede eliminar la categoría porque aún contiene productos. Elimina o mueve los productos primero."
          : error.message
            ? `No se pudo eliminar: ${error.message}`
            : "No se pudo eliminar la categoría."
      );
      return;
    }
    // 0 filas afectadas (RLS bloqueando en silencio, o ya no existía)
    // se trata como "ya no está" — se oculta del cliente igual.
    if (zeroRows) onForceHideCategoria?.(section.label);
  };

  const handleDeleteSubgrupo = async (group) => {
    if (
      !window.confirm(
        `¿Eliminar el subgrupo "${group.title}"? Los productos que tiene NO se borran — quedan sin subgrupo dentro de "${section.label}".`
      )
    ) {
      return;
    }
    const { error, zeroRows } = await onDeleteSubgrupo(section.label, rawSubgrupo(group));
    if (error) {
      alert(error.message ? `No se pudo eliminar: ${error.message}` : "No se pudo eliminar el subgrupo.");
      return;
    }
    if (zeroRows) onForceHideSubgrupo?.(section.label, group.title);
  };

  // Si solo hay un grupo y no tiene título (== no hay subgrupos reales
  // en esta categoría), se muestran los productos directo, sin un
  // sub-acordeón innecesario de un solo nivel.
  const hasRealSubgroups = section.groups.length > 1 || !!section.groups[0]?.title;
  const totalItems = section.groups.reduce((sum, g) => sum + g.items.length, 0);
  // Mismo guard de auto-hover que ProductoRow/SubgrupoSection: una
  // categoría no se ilumina como "aceptando" un drop de sí misma.
  const showAcceptGlow = catSortable.isOver && !catSortable.isDragging;

  return (
    <div
      ref={catSortable.setNodeRef}
      style={catSortable.style}
      className={`tz-vis-category ${catSortable.isDragging ? "tz-vis-category-dragging" : ""} ${
        isDropForbidden ? "tz-vis-drag-forbidden" : showAcceptGlow ? "tz-vis-category-drag-over" : ""
      } ${isSaving ? "tz-vis-dnd-saving" : ""}`}
    >
      {editingCategoria ? (
        <div className="tz-vis-inline-edit-row">
          <input
            type="text"
            className="tz-text-input"
            value={categoriaValue}
            onChange={(e) => setCategoriaValue(e.target.value)}
            autoFocus
          />
          <button
            type="button"
            className="tz-vis-edit-btn"
            onClick={saveCategoriaRename}
            disabled={categoriaSaving}
            aria-label="Guardar categoría"
          >
            {categoriaSaving ? <Loader2 size={13} className="tz-spin" /> : <Check size={13} />}
          </button>
          <button
            type="button"
            className="tz-vis-edit-btn"
            onClick={() => {
              setEditingCategoria(false);
              setCategoriaError("");
            }}
            disabled={categoriaSaving}
            aria-label="Cancelar"
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <div className="tz-vis-header-row">
          <span
            ref={catSortable.setActivatorNodeRef}
            className="tz-vis-drag-handle"
            {...catSortable.listeners}
            {...catSortable.attributes}
            aria-label={`Arrastrar para reordenar ${section.label}`}
            title="Arrastrar para reordenar"
          >
            {isSaving ? <Loader2 size={15} className="tz-spin" /> : <GripVertical size={15} />}
          </span>
          <button type="button" className="tz-vis-category-header" onClick={onToggleOpen}>
            <span>{section.label}</span>
            <span className="tz-vis-category-meta">
              {totalItems} {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </button>
          <button
            type="button"
            className="tz-vis-edit-btn"
            onClick={(e) => {
              e.stopPropagation();
              setCategoriaValue(section.label);
              setCategoriaError("");
              setEditingCategoria(true);
            }}
            aria-label={`Editar categoría ${section.label}`}
            title="Editar categoría"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            className="tz-vis-delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteCategoria();
            }}
            aria-label={`Eliminar categoría ${section.label}`}
            title="Eliminar categoría"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
      {categoriaError && <p className="tz-error">{categoriaError}</p>}

      {isOpen && (
        <div className="tz-vis-accordion-inner">
          {isCombosCategoria && (
            <ComboCraftZone
              stagedProduct={stagedProduct}
              onDiscard={onDiscardStaged}
              activeDrag={activeDrag}
            />
          )}

          {!hasRealSubgroups ? (
            <SearchableProductList
              items={section.groups[0]?.items ?? []}
              onToggleVisibility={onToggleVisibility}
              onDelete={onDelete}
              onSoftDelete={onSoftDelete}
              onEditProducto={onEditProducto}
              onAssignBarcode={onAssignBarcode}
              categoriaLabel={section.label}
              subgrupoRaw={null}
              onAddVariante={onAddVariante}
              movingId={movingId}
              activeDrag={activeDrag}
            />
          ) : (
            <SortableContext
              items={section.groups.map((_, gi) => `sub:${section.key}:${gi}`)}
              strategy={verticalListSortingStrategy}
            >
              {section.groups.map((group, gi) => {
                const key = `${section.key}::${group.title ?? "sin-subgrupo"}::${gi}`;
                return (
                  <SubgrupoSection
                    key={key}
                    section={section}
                    group={group}
                    gi={gi}
                    sectionKey={section.key}
                    openSubgrupos={openSubgrupos}
                    onToggleSubgrupo={onToggleSubgrupo}
                    isEditing={editingSubgrupoKey === key}
                    editValue={subgrupoValue}
                    onEditValueChange={setSubgrupoValue}
                    editSaving={subgrupoSaving}
                    editError={subgrupoError}
                    onStartEdit={startEditSubgrupo}
                    onSaveEdit={() => saveSubgrupoRename(group)}
                    onCancelEdit={() => {
                      setEditingSubgrupoKey(null);
                      setSubgrupoError("");
                    }}
                    onDeleteSubgrupo={handleDeleteSubgrupo}
                    onToggleVisibility={onToggleVisibility}
                    onDelete={onDelete}
                    onSoftDelete={onSoftDelete}
                    onEditProducto={onEditProducto}
                    onAssignBarcode={onAssignBarcode}
                    onAddVariante={onAddVariante}
                    rawSubgrupo={rawSubgrupo}
                    movingId={movingId}
                    activeDrag={activeDrag}
                  />
                );
              })}
            </SortableContext>
          )}
        </div>
      )}
    </div>
  );
}

/* Reemplaza la lista plana/agrupada anterior de "Visibilidad en
   catálogo público": acordeón Categoría -> Subgrupo -> productos, con
   búsqueda/escaneo contextual por sección, alta+baja de productos
   (toggle + eliminar con confirmación y fallback a soft delete), y
   edición al vuelo (lápiz) de producto/categoría/subgrupo — más DnD
   multinivel (categoría/subgrupo/producto) y la mecánica de "crafteo"
   de Combos, ambos sobre @dnd-kit/core (ver comentario grande arriba). */
export default function CatalogVisibilityAccordion({
  sections,
  onToggleVisibility,
  onDelete,
  onSoftDelete,
  onEditProducto,
  onAssignBarcode,
  onRenameCategoria,
  onRenameSubgrupo,
  onDeleteCategoria,
  onDeleteSubgrupo,
  onCreateCategoria,
  onAddVariante,
  onReorderCategorias,
  onMoverProducto,
  onMoverSubgrupo,
  onCraftCombo,
}) {
  // Blindaje del lado del cliente: si Supabase deja pasar un delete o
  // update sin afectar ninguna fila (RLS bloqueando en silencio, o la
  // fila ya no existía), refetchCatalog() trae de vuelta exactamente
  // la misma "categoría/subgrupo fantasma" que se acababa de intentar
  // borrar/renombrar, porque sigue viva en la base. Estos sets filtran
  // esos nombres del lado del cliente sin importar lo que diga el
  // backend en la próxima carga — así el usuario puede sacárselos de
  // encima de la vista aunque el backend no coopere. Viven acá (no en
  // App.jsx) porque son "ruido visual de esta sesión del modal", no
  // datos reales — se resetean solos si el modal se cierra y se abre
  // de nuevo.
  const [hiddenCategorias, setHiddenCategorias] = useState(() => new Set());
  const [hiddenSubgrupos, setHiddenSubgrupos] = useState(() => new Set());

  const [creatingCategoria, setCreatingCategoria] = useState(false);
  const [newCategoriaValue, setNewCategoriaValue] = useState("");
  const [creatingSaving, setCreatingSaving] = useState(false);
  const [creatingError, setCreatingError] = useState("");

  // Categorías/subgrupos abiertos — lo pide el auto-despliegue por
  // hover (500ms) durante un drag: necesita poder abrir una categoría
  // desde ACÁ (el DndContext), sin esperar un clic del usuario.
  const [openCategorias, setOpenCategorias] = useState(() => new Set());
  const [openSubgrupos, setOpenSubgrupos] = useState(() => new Set());

  const toggleCategoria = (label) => {
    setOpenCategorias((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };
  const toggleSubgrupo = (key) => {
    setOpenSubgrupos((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Mecánica de "Crafteo"/Fusión (categoría Combos): 'stagedProduct' es
  // el primer producto soltado (Paso 1); 'fusing' dispara la animación
  // de líneas neón (Paso 2) antes de delegarle a App.jsx la apertura
  // del modal "Nuevo Combo" ya precargado (Paso 3, ver onCraftCombo).
  const [stagedProduct, setStagedProduct] = useState(null);
  const [fusing, setFusing] = useState(null); // { a, b } | null

  // Lookup plano id -> producto, para resolver 'activeData.productoId'
  // al soltar sobre la zona de crafteo (el active/over de dnd-kit solo
  // trae ids + la 'data' que YA le pusimos, nunca el objeto completo).
  const productosById = useMemo(() => {
    const map = {};
    sections.forEach((s) => s.groups.forEach((g) => g.items.forEach((it) => (map[it.id] = it))));
    return map;
  }, [sections]);

  const [activeDrag, setActiveDrag] = useState(null); // data del draggable activo, para el DragOverlay
  // Id de lo que está "over" ahora mismo (dnd-kit) — SOLO se usa para
  // saber si hay que iluminar el fantasma del DragOverlay con el pulso
  // de fusión (Paso 2 del crafteo: un segundo producto arrastrado
  // exactamente encima de la Zona de Crafteo con algo YA staged).
  const [overId, setOverId] = useState(null);
  // Id (mismo formato que useDragHandle: 'prod:', 'sub:', 'cat:') del
  // ítem cuya mutación hacia Supabase está EN VUELO tras soltar — cada
  // fila/tarjeta lo compara contra su propio id para pintar su propio
  // spinner/pulso, en vez de "congelar" toda la lista mientras se
  // confirma el movimiento.
  const [movingId, setMovingId] = useState(null);
  const hoverTimerRef = useRef(null);
  const hoverTargetRef = useRef(null);

  const clearHoverTimer = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = null;
    hoverTargetRef.current = null;
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const handleCreateCategoria = async () => {
    const nombre = newCategoriaValue.trim();
    if (!nombre) {
      setCreatingError("Escribe un nombre para la categoría.");
      return;
    }
    setCreatingSaving(true);
    setCreatingError("");
    const { error } = await onCreateCategoria(nombre);
    setCreatingSaving(false);
    if (error) {
      setCreatingError(
        error.message ? `No se pudo crear: ${error.message}` : "No se pudo crear la categoría."
      );
      return;
    }
    setNewCategoriaValue("");
    setCreatingCategoria(false);
  };

  const forceHideCategoria = (label) => {
    setHiddenCategorias((prev) => new Set(prev).add(label));
  };
  const forceHideSubgrupo = (categoriaLabel, subgrupoTitle) => {
    setHiddenSubgrupos((prev) => new Set(prev).add(`${categoriaLabel}::${subgrupoTitle}`));
  };

  const visibleSections = sections
    .filter((s) => !hiddenCategorias.has(s.label))
    .map((s) => ({
      ...s,
      groups: s.groups.filter((g) => !hiddenSubgrupos.has(`${s.label}::${g.title}`)),
    }));

  /* ---- Paso 1/2/3 del crafteo: primer producto soltado -> queda
     "staged"; segundo producto soltado sobre esa MISMA tarjeta -> corre
     la animación de fusión y, al terminar, delega a onCraftCombo. ---- */
  const handleDropOnCraftZone = (productoId) => {
    const producto = productosById[productoId];
    if (!producto) return;
    if (!stagedProduct) {
      setStagedProduct(producto);
      return;
    }
    if (stagedProduct.id === producto.id) return; // mismo producto soltado de nuevo: no-op

    const primero = stagedProduct;
    setStagedProduct(null);
    setFusing({ a: primero, b: producto });
    window.setTimeout(() => {
      setFusing(null);
      onCraftCombo?.([primero, producto]);
    }, 650);
  };

  const handleDragStart = (event) => {
    setActiveDrag(event.active?.data?.current || null);
    setOverId(null);
  };

  // Arma (o reutiliza, si ya está corriendo para el MISMO objetivo) un
  // timer de 500ms que aplica 'applyFn' — usado tanto para auto-abrir
  // una categoría como un subgrupo colapsados durante un drag.
  const armHoverTimer = (targetKey, applyFn) => {
    if (hoverTargetRef.current === targetKey) return; // ya está corriendo para este mismo objetivo
    clearHoverTimer();
    hoverTargetRef.current = targetKey;
    hoverTimerRef.current = window.setTimeout(() => {
      applyFn();
      hoverTargetRef.current = null;
    }, 500);
  };

  /* ---- Auto-despliegue (hover-to-open): mientras se arrastra algo
     sobre una CATEGORÍA o SUBGRUPO colapsados, arma un timer de 500ms
     antes de expandirlo (con la misma animación suave de entrada que
     ya tiene '.tz-vis-accordion-inner' al abrir a mano); si el drag se
     mueve a otro lado antes de que termine, se cancela.
       - Categoría: producto O subgrupo arrastrado por encima la
         auto-despliega (subgrupos SÍ pueden "entrar" a otra categoría).
       - Subgrupo: solo un PRODUCTO arrastrado por encima lo
         auto-despliega — los subgrupos no anidan entre sí, no hace
         falta "entrar" a otro subgrupo.
     Las categorías/subgrupos no se auto-despliegan entre sí cuando lo
     arrastrado es su MISMO tipo y el destino ya es "hoja" (reordenar
     no necesita ver el contenido). ---- */
  const handleDragOver = (event) => {
    const { active, over } = event;
    const activeType = active?.data?.current?.type;
    const overData = over?.data?.current;
    setOverId(over?.id ?? null);

    if (!over || !overData) {
      clearHoverTimer();
      return;
    }

    if (
      (activeType === "producto" || activeType === "subgroup") &&
      overData.type === "category" &&
      !openCategorias.has(overData.categoriaLabel)
    ) {
      armHoverTimer(`cat::${overData.categoriaLabel}`, () => {
        setOpenCategorias((prev) => new Set(prev).add(overData.categoriaLabel));
      });
      return;
    }

    if (activeType === "producto" && overData.type === "subgroup") {
      const subKey = `${overData.sectionKey}::${overData.title ?? "sin-subgrupo"}::${overData.gi}`;
      if (!openSubgrupos.has(subKey)) {
        armHoverTimer(`sub::${subKey}`, () => {
          setOpenSubgrupos((prev) => new Set(prev).add(subKey));
        });
        return;
      }
    }

    clearHoverTimer();
  };

  // Marca 'id' como "guardando" mientras 'fn' (la mutación async hacia
  // Supabase) está en vuelo, y lo limpia pase lo que pase (éxito o
  // error) — así el spinner/pulso de la fila SIEMPRE se apaga, incluso
  // si moverProducto/moverSubgrupo/reorderCategorias fallan.
  const runMove = async (id, fn) => {
    setMovingId(id);
    try {
      await fn();
    } finally {
      setMovingId(null);
    }
  };

  const handleDragEnd = async (event) => {
    clearHoverTimer();
    setActiveDrag(null);
    setOverId(null);

    const { active, over } = event;
    if (!over) return;
    const activeData = active.data?.current;
    const overData = over.data?.current;
    if (!activeData || !overData) return;

    if (activeData.type === "category") {
      if (overData.type !== "category") return;
      if (activeData.categoriaLabel === overData.categoriaLabel) return;
      const labels = visibleSections.map((s) => s.label);
      const fromIdx = labels.indexOf(activeData.categoriaLabel);
      if (fromIdx === -1) return;
      const reordered = [...labels];
      reordered.splice(fromIdx, 1);
      const insertAt = reordered.indexOf(overData.categoriaLabel);
      if (insertAt === -1) return;
      reordered.splice(insertAt, 0, activeData.categoriaLabel);
      await runMove(active.id, () => onReorderCategorias?.(reordered));
      return;
    }

    if (activeData.type === "subgroup") {
      if (overData.type === "category") {
        await runMove(active.id, () =>
          onMoverSubgrupo?.({
            categoriaOrigen: activeData.categoriaLabel,
            subgrupoRawOrigen: activeData.subgrupoRaw,
            categoriaDestino: overData.categoriaLabel,
            beforeSubgrupoRaw: null,
          })
        );
      } else if (overData.type === "subgroup") {
        if (
          activeData.categoriaLabel === overData.categoriaLabel &&
          activeData.subgrupoRaw === overData.subgrupoRaw
        ) {
          return;
        }
        await runMove(active.id, () =>
          onMoverSubgrupo?.({
            categoriaOrigen: activeData.categoriaLabel,
            subgrupoRawOrigen: activeData.subgrupoRaw,
            categoriaDestino: overData.categoriaLabel,
            beforeSubgrupoRaw: overData.subgrupoRaw,
          })
        );
      }
      return;
    }

    if (activeData.type === "producto") {
      if (overData.type === "combo-craft-zone") {
        handleDropOnCraftZone(activeData.productoId);
        return;
      }
      // Bloqueo de Categoría: un producto que NO es ya de Combos no
      // puede "aterrizar" ahí de ningún otro modo (cabecera de
      // categoría, cabecera de subgrupo, o encima de otro producto) —
      // se rechaza en silencio, la fila vuelve a su lugar sola (el
      // preview de @dnd-kit/sortable se revierte al no haber mutación).
      if (esCategoriaCombos(overData.categoriaLabel) && !esCategoriaCombos(activeData.categoriaLabel)) {
        return;
      }
      if (overData.type === "category") {
        await runMove(active.id, () =>
          onMoverProducto?.({
            productoId: activeData.productoId,
            categoriaDestino: overData.categoriaLabel,
            subgrupoDestino: null,
            beforeProductoId: null,
          })
        );
      } else if (overData.type === "subgroup") {
        await runMove(active.id, () =>
          onMoverProducto?.({
            productoId: activeData.productoId,
            categoriaDestino: overData.categoriaLabel,
            subgrupoDestino: overData.subgrupoRaw,
            beforeProductoId: null,
          })
        );
      } else if (overData.type === "producto") {
        if (overData.productoId === activeData.productoId) return;
        await runMove(active.id, () =>
          onMoverProducto?.({
            productoId: activeData.productoId,
            categoriaDestino: overData.categoriaLabel,
            subgrupoDestino: overData.subgrupoRaw,
            beforeProductoId: overData.productoId,
          })
        );
      }
    }
  };

  const activeDragLabel = (() => {
    if (!activeDrag) return "";
    if (activeDrag.type === "category") return activeDrag.categoriaLabel;
    if (activeDrag.type === "subgroup") return activeDrag.subgrupoRaw;
    if (activeDrag.type === "producto") return productosById[activeDrag.productoId]?.name || "";
    return "";
  })();

  // Paso 2 del crafteo (ANTES de soltar): este segundo producto está
  // sobrevolando la Zona de Crafteo mientras YA hay uno "staged" — el
  // fantasma que sigue al cursor se ilumina con el mismo pulso que la
  // tarjeta staged, para que la fusión "se sienta venir".
  const isFusionHover =
    activeDrag?.type === "producto" && overId === "combo-craft-zone" && !!stagedProduct;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      // 'Always' (no el default 'WhileDragging', que solo mide una vez
      // al empezar): el auto-despliegue (item 3) puede abrir una
      // categoría/subgrupo A MITAD del arrastre, cambiando el layout
      // por completo — sin re-medir, dnd-kit seguiría calculando
      // colisiones contra las posiciones VIEJAS (de antes de abrirse).
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        clearHoverTimer();
        setActiveDrag(null);
        setOverId(null);
      }}
    >
      <div className="tz-vis-accordion">
        <div className="tz-vis-create-categoria">
          {creatingCategoria ? (
            <div className="tz-vis-inline-edit-row">
              <input
                type="text"
                className="tz-text-input"
                placeholder="Nombre de la nueva categoría"
                value={newCategoriaValue}
                onChange={(e) => setNewCategoriaValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateCategoria();
                }}
                autoFocus
              />
              <button
                type="button"
                className="tz-vis-edit-btn"
                onClick={handleCreateCategoria}
                disabled={creatingSaving}
                aria-label="Guardar categoría"
              >
                {creatingSaving ? <Loader2 size={13} className="tz-spin" /> : <Check size={13} />}
              </button>
              <button
                type="button"
                className="tz-vis-edit-btn"
                onClick={() => {
                  setCreatingCategoria(false);
                  setNewCategoriaValue("");
                  setCreatingError("");
                }}
                disabled={creatingSaving}
                aria-label="Cancelar"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="tz-camera-cancel tz-scanner-upload-btn"
              onClick={() => {
                setCreatingCategoria(true);
                setCreatingError("");
              }}
            >
              <Plus size={15} /> Nueva Categoría
            </button>
          )}
          {creatingError && <p className="tz-error">{creatingError}</p>}
        </div>

        <SortableContext
          items={visibleSections.map((s) => `cat:${s.key}`)}
          strategy={verticalListSortingStrategy}
        >
          {visibleSections.map((section) => (
            <CategoriaAccordion
              key={section.key}
              section={section}
              isOpen={openCategorias.has(section.label)}
              onToggleOpen={() => toggleCategoria(section.label)}
              openSubgrupos={openSubgrupos}
              onToggleSubgrupo={toggleSubgrupo}
              onToggleVisibility={onToggleVisibility}
              onDelete={onDelete}
              onSoftDelete={onSoftDelete}
              onEditProducto={onEditProducto}
              onAssignBarcode={onAssignBarcode}
              onRenameCategoria={onRenameCategoria}
              onRenameSubgrupo={onRenameSubgrupo}
              onDeleteCategoria={onDeleteCategoria}
              onDeleteSubgrupo={onDeleteSubgrupo}
              onForceHideCategoria={forceHideCategoria}
              onForceHideSubgrupo={forceHideSubgrupo}
              onAddVariante={onAddVariante}
              isCombosCategoria={esCategoriaCombos(section.label)}
              stagedProduct={stagedProduct}
              onDiscardStaged={() => setStagedProduct(null)}
              movingId={movingId}
              activeDrag={activeDrag}
            />
          ))}
        </SortableContext>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeDrag ? (
          <div
            className={`tz-vis-drag-ghost tz-vis-drag-ghost-${activeDrag.type} ${
              isFusionHover ? "tz-vis-drag-ghost-fusing" : ""
            }`}
          >
            <GripVertical size={13} />
            {activeDragLabel}
          </div>
        ) : null}
      </DragOverlay>

      {fusing && <ComboFusionOverlay productoA={fusing.a} productoB={fusing.b} />}
    </DndContext>
  );
}
