import { useState } from "react";
import { ChevronDown, ChevronUp, ScanLine, Loader2, Trash2, Check, X } from "lucide-react";
import { buscarProductoPorCodigo } from "../lib/productLookup";
import BarcodeScannerModal from "./BarcodeScannerModal";

/* Fila de un producto: toggle de visibilidad + eliminar (con
   confirmación inline en vez de un modal aparte, para no apilar
   overlays sobre el acordeón). Si el borrado choca con una FK
   (producto con ventas registradas), ofrece desactivar en su lugar
   (soft delete vía 'activo') en el mismo lugar, sin que el usuario
   tenga que repetir la acción desde cero. */
function ProductoRow({ producto, onToggleVisibility, onDelete, onSoftDelete }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fkConflict, setFkConflict] = useState(false);

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

  if (confirming) {
    return (
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
  }

  return (
    <div className="tz-stock-row">
      <div className="tz-stock-row-info">
        <span className="tz-stock-row-name">{producto.name}</span>
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

/* Búsqueda + escáner CONTEXTUAL: solo busca/filtra dentro de 'items'
   (los productos de la categoría o subgrupo donde vive esta sección),
   nunca en el catálogo completo. Si el código escaneado pertenece a
   otro producto fuera de esta sección, se avisa en vez de mostrarlo. */
function SearchableProductList({ items, onToggleVisibility, onDelete, onSoftDelete }) {
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
        <input
          type="text"
          className="tz-text-input"
          placeholder="Buscar en esta sección…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {scanError && <p className="tz-error">{scanError}</p>}

      {filtered.length === 0 ? (
        <p className="tz-method-history-empty">Ningún producto coincide.</p>
      ) : (
        <div className="tz-stock-list">
          {filtered.map((p) => (
            <ProductoRow
              key={p.id}
              producto={p}
              onToggleVisibility={onToggleVisibility}
              onDelete={onDelete}
              onSoftDelete={onSoftDelete}
            />
          ))}
        </div>
      )}

      {scannerOpen && (
        <BarcodeScannerModal onScan={handleScan} onClose={() => setScannerOpen(false)} />
      )}
    </div>
  );
}

/* Acordeón de 2 niveles: Categoría -> (Subgrupo si existe -> productos
   | productos directo si no hay subgrupos). Cada nivel hoja tiene su
   propio buscador/escáner contextual (SearchableProductList). */
function CategoriaAccordion({ section, onToggleVisibility, onDelete, onSoftDelete }) {
  const [open, setOpen] = useState(false);
  const [openSubgrupos, setOpenSubgrupos] = useState(() => new Set());

  const toggleSubgrupo = (key) => {
    setOpenSubgrupos((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Si solo hay un grupo y no tiene título (== no hay subgrupos reales
  // en esta categoría), se muestran los productos directo, sin un
  // sub-acordeón innecesario de un solo nivel.
  const hasRealSubgroups = section.groups.length > 1 || !!section.groups[0]?.title;
  const totalItems = section.groups.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div className="tz-vis-category">
      <button
        type="button"
        className="tz-vis-category-header"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{section.label}</span>
        <span className="tz-vis-category-meta">
          {totalItems} {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      <div className={`tz-vis-accordion-body ${open ? "tz-vis-accordion-open" : ""}`}>
        <div className="tz-vis-accordion-inner">
          {!hasRealSubgroups ? (
            <SearchableProductList
              items={section.groups[0]?.items ?? []}
              onToggleVisibility={onToggleVisibility}
              onDelete={onDelete}
              onSoftDelete={onSoftDelete}
            />
          ) : (
            section.groups.map((group, gi) => {
              const key = `${section.key}::${group.title ?? "sin-subgrupo"}::${gi}`;
              const subOpen = openSubgrupos.has(key);
              return (
                <div className="tz-vis-subsection" key={key}>
                  <button
                    type="button"
                    className="tz-vis-subgroup-header"
                    onClick={() => toggleSubgrupo(key)}
                  >
                    <span>{group.title || "Sin subgrupo"}</span>
                    <span className="tz-vis-category-meta">
                      {group.items.length}{" "}
                      {subOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                  </button>
                  <div
                    className={`tz-vis-accordion-body ${subOpen ? "tz-vis-accordion-open" : ""}`}
                  >
                    <div className="tz-vis-accordion-inner">
                      <SearchableProductList
                        items={group.items}
                        onToggleVisibility={onToggleVisibility}
                        onDelete={onDelete}
                        onSoftDelete={onSoftDelete}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/* Reemplaza la lista plana/agrupada anterior de "Visibilidad en
   catálogo público": acordeón Categoría -> Subgrupo -> productos, con
   búsqueda/escaneo contextual por sección y alta+baja de productos
   (toggle + eliminar con confirmación y fallback a soft delete). */
export default function CatalogVisibilityAccordion({
  sections,
  onToggleVisibility,
  onDelete,
  onSoftDelete,
}) {
  return (
    <div className="tz-vis-accordion">
      {sections.map((section) => (
        <CategoriaAccordion
          key={section.key}
          section={section}
          onToggleVisibility={onToggleVisibility}
          onDelete={onDelete}
          onSoftDelete={onSoftDelete}
        />
      ))}
    </div>
  );
}
