import { useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, Loader2, Plus, Pencil, Check, GripVertical, Trash2, LayoutGrid } from "lucide-react";
import { supabase } from "../supabaseClient";
import Styles from "../components/Styles";

// Gestor de rubros del super admin (pie de página). Los rubros son las
// PESTAÑAS del directorio de negocios del panel y del directorio público:
// acá se crean, renombran, reordenan (arrastrando), ocultan o borran.
// Un rubro con negocios no se borra (negocios.rubro_id sin cascada a
// propósito): hay que mover esos negocios a otro rubro primero.
function FilaRubro({ rubro, cantidad, onRename, onToggle, onDelete }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: rubro.id,
  });
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(rubro.nombre);
  const [busy, setBusy] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState("");

  const guardar = async () => {
    const nombre = valor.trim();
    if (!nombre) return;
    setBusy(true);
    setError("");
    const { error: err } = await onRename(rubro, nombre);
    setBusy(false);
    if (err) return setError(err.message || "No se pudo guardar.");
    setEditando(false);
  };

  const borrar = async () => {
    setBusy(true);
    setError("");
    const { error: err } = await onDelete(rubro);
    setBusy(false);
    if (err) {
      setError(
        err.code === "23503" ? "Tiene negocios asignados: muévelos a otro rubro antes de borrarlo." : err.message || "No se pudo borrar."
      );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="tz-sa-rubro-fila"
    >
      <span className="tz-sa-drag-handle" ref={setActivatorNodeRef} {...listeners} {...attributes} aria-label={`Arrastrar ${rubro.nombre}`}>
        <GripVertical size={14} />
      </span>
      {editando ? (
        <>
          <input
            className="tz-text-input tz-sa-inline-input"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && guardar()}
            autoFocus
          />
          <button type="button" className="tz-vis-edit-btn" onClick={guardar} disabled={busy}>
            {busy ? <Loader2 size={13} className="tz-spin" /> : <Check size={13} />}
          </button>
          <button type="button" className="tz-vis-edit-btn" onClick={() => setEditando(false)} disabled={busy}>
            <X size={13} />
          </button>
        </>
      ) : (
        <>
          <span className="tz-sa-rubro-fila-nombre">
            {rubro.nombre} <small>({cantidad})</small>
          </span>
          <button type="button" className="tz-vis-edit-btn" onClick={() => { setValor(rubro.nombre); setEditando(true); }} aria-label={`Editar ${rubro.nombre}`}>
            <Pencil size={13} />
          </button>
          <button type="button" className="tz-vis-delete-btn" onClick={() => setConfirmando((v) => !v)} aria-label={`Eliminar ${rubro.nombre}`}>
            <Trash2 size={13} />
          </button>
          <label className="tz-toggle" title={rubro.activo ? "Visible" : "Oculto"}>
            <input type="checkbox" checked={rubro.activo} onChange={(e) => onToggle(rubro, e.target.checked)} />
            <span className="tz-toggle-slider" />
          </label>
        </>
      )}
      {confirmando && !editando && (
        <div className="tz-vis-confirm-delete tz-sa-rubro-fila-confirmar">
          <p>¿Eliminar <strong>{rubro.nombre}</strong>?</p>
          <div className="tz-vis-confirm-actions">
            <button type="button" className="tz-cliente-action-btn tz-cliente-action-deuda" onClick={borrar} disabled={busy}>
              {busy ? <Loader2 size={13} className="tz-spin" /> : <Trash2 size={13} />} Sí, eliminar
            </button>
            <button type="button" className="tz-cliente-action-btn" onClick={() => setConfirmando(false)} disabled={busy}>
              <X size={13} /> Cancelar
            </button>
          </div>
        </div>
      )}
      {error && <p className="tz-error tz-sa-rubro-fila-error">{error}</p>}
    </div>
  );
}

export default function GestorRubrosModal({ rubros, setRubros, negocios, onClose }) {
  const [nuevo, setNuevo] = useState("");
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const cantidadPorRubro = (id) => negocios.filter((n) => n.rubro_id === id).length;

  const crear = async () => {
    const nombre = nuevo.trim();
    if (!nombre) return setError("Escribe un nombre.");
    setCreando(true);
    setError("");
    const orden = rubros.length ? Math.max(...rubros.map((r) => r.orden ?? 0)) + 1 : 0;
    const { data, error: err } = await supabase.from("rubros").insert({ nombre, orden }).select().single();
    setCreando(false);
    if (err) return setError(err.code === "23505" ? "Ya existe un rubro con ese nombre." : err.message);
    setRubros((prev) => [...prev, data]);
    setNuevo("");
  };

  const renombrar = async (rubro, nombre) => {
    const { error: err } = await supabase.from("rubros").update({ nombre }).eq("id", rubro.id);
    if (!err) setRubros((prev) => prev.map((r) => (r.id === rubro.id ? { ...r, nombre } : r)));
    return { error: err };
  };

  const alternar = async (rubro, activo) => {
    setRubros((prev) => prev.map((r) => (r.id === rubro.id ? { ...r, activo } : r)));
    const { error: err } = await supabase.from("rubros").update({ activo }).eq("id", rubro.id);
    if (err) setRubros((prev) => prev.map((r) => (r.id === rubro.id ? { ...r, activo: !activo } : r)));
  };

  const borrar = async (rubro) => {
    const { error: err } = await supabase.from("rubros").delete().eq("id", rubro.id);
    if (!err) setRubros((prev) => prev.filter((r) => r.id !== rubro.id));
    return { error: err };
  };

  const alSoltar = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const desde = rubros.findIndex((r) => r.id === active.id);
    const hasta = rubros.findIndex((r) => r.id === over.id);
    if (desde === -1 || hasta === -1) return;
    const reordenados = arrayMove(rubros, desde, hasta).map((r, i) => ({ ...r, orden: i }));
    setRubros(reordenados);
    await Promise.all(reordenados.map((r) => supabase.from("rubros").update({ orden: r.orden }).eq("id", r.id)));
  };

  return (
    <div className="tz-modal-backdrop">
      <Styles />
      <div className="tz-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <h2>
          <LayoutGrid size={17} /> Rubros
        </h2>
        <p className="tz-brand-sub" style={{ marginBottom: 12 }}>
          Son las pestañas del directorio. Arrastra para ordenarlos; apaga el interruptor para ocultar uno del directorio público.
        </p>
        <DndContext sensors={sensors} onDragEnd={alSoltar}>
          <SortableContext items={rubros.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className="tz-sa-rubros-lista">
              {rubros.map((r) => (
                <FilaRubro
                  key={r.id}
                  rubro={r}
                  cantidad={cantidadPorRubro(r.id)}
                  onRename={renombrar}
                  onToggle={alternar}
                  onDelete={borrar}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <div className="tz-sa-new-row" style={{ marginTop: 12 }}>
          <input
            className="tz-text-input"
            placeholder="Nuevo rubro (ej. Ferretería)"
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && crear()}
          />
          <button type="button" className="tz-cliente-action-btn tz-cliente-action-pago" onClick={crear} disabled={creando}>
            {creando ? <Loader2 size={13} className="tz-spin" /> : <Plus size={13} />} Crear
          </button>
        </div>
        {error && <p className="tz-error">{error}</p>}
      </div>
    </div>
  );
}
