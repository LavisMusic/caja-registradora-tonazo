import { useEffect, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, Loader2, Plus, Pencil, Check, GripVertical, Trash2, ChevronDown, ChevronUp, MapPin, EyeOff } from "lucide-react";
import { supabase } from "../supabaseClient";
import Styles from "./Styles";

/* Gestor de Localidades/Sucursales (botón rosa del pie de página, solo
   admin): mismo patrón de "fila arrastrable con lápiz/tacho" que ya
   usa el panel de Rubros/Negocios del super-admin (SuperAdminPanel.jsx)
   — acá aplicado a la jerarquía Localidad -> Sucursal de ESTE negocio.
   Autocontenido (fetch propio, no comparte el estado 'localidades'/
   'sucursales' de App.jsx) para no tener que enhebrar setters por toda
   la jerarquía del componente principal; al cerrar, avisa a App.jsx
   (onChanged) para que refetchJerarquia() traiga los nombres/orden
   nuevos a los selects de arriba. */

function useDragItem(id) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  return {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    isDragging,
    style: {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    },
  };
}

function SucursalRow({ sucursal, onRename, onDelete, onDesactivar }) {
  const drag = useDragItem(`sucursal:${sucursal.id}`);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(sucursal.nombre);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [desactivando, setDesactivando] = useState(false);
  const [error, setError] = useState("");
  const [fkConflict, setFkConflict] = useState(false);

  const save = async () => {
    const nombre = value.trim();
    if (!nombre) return;
    setSaving(true);
    setError("");
    const { error: err } = await onRename(sucursal, nombre);
    setSaving(false);
    if (err) {
      setError("No se pudo guardar.");
      return;
    }
    setEditing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    setFkConflict(false);
    setError("");
    const { error: err, fkConflict: isFk } = await onDelete(sucursal);
    setDeleting(false);
    if (err) {
      if (isFk) setFkConflict(true);
      else setError(err.message ? `No se pudo eliminar: ${err.message}` : "No se pudo eliminar.");
      return;
    }
  };

  const handleDesactivar = async () => {
    setDesactivando(true);
    setError("");
    const { error: err } = await onDesactivar(sucursal);
    setDesactivando(false);
    if (err) {
      setError(err.message ? `No se pudo desactivar: ${err.message}` : "No se pudo desactivar.");
    }
    // Si funcionó, el padre ya la sacó de la lista (deja de ser 'activo').
  };

  if (confirming) {
    return (
      <div className="tz-vis-confirm-delete tz-gl-confirm">
        <p>¿Eliminar la sucursal <strong>{sucursal.nombre}</strong>?</p>
        {fkConflict && (
          <>
            <p className="tz-error">
              No se puede eliminar: todavía tiene cajas, ventas o cajeros asociados.
            </p>
            <p className="tz-stock-editor-sub">
              Podés desactivarla en su lugar — deja de verse en selectores/catálogo, sin borrar nada de su historial.
            </p>
          </>
        )}
        {error && <p className="tz-error">{error}</p>}
        <div className="tz-vis-confirm-actions">
          {!fkConflict ? (
            <button type="button" className="tz-cliente-action-btn tz-cliente-action-deuda" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 size={13} className="tz-spin" /> : <Trash2 size={13} />} Sí, eliminar
            </button>
          ) : (
            <button type="button" className="tz-cliente-action-btn tz-cliente-action-pago" onClick={handleDesactivar} disabled={desactivando}>
              {desactivando ? <Loader2 size={13} className="tz-spin" /> : <EyeOff size={13} />} Desactivar
            </button>
          )}
          <button type="button" className="tz-cliente-action-btn" onClick={() => { setConfirming(false); setFkConflict(false); setError(""); }} disabled={deleting || desactivando}>
            <X size={13} /> Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={drag.setNodeRef} style={drag.style} className="tz-gl-sucursal-row">
      <span className="tz-sa-drag-handle" ref={drag.setActivatorNodeRef} {...drag.listeners} {...drag.attributes} aria-label={`Arrastrar ${sucursal.nombre}`}>
        <GripVertical size={13} />
      </span>
      <MapPin size={13} className="tz-gl-sucursal-icon" />
      {editing ? (
        <>
          <input
            className="tz-text-input tz-sa-inline-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
          <button type="button" className="tz-vis-edit-btn" onClick={save} disabled={saving}>
            {saving ? <Loader2 size={13} className="tz-spin" /> : <Check size={13} />}
          </button>
          <button type="button" className="tz-vis-edit-btn" onClick={() => setEditing(false)} disabled={saving}>
            <X size={13} />
          </button>
        </>
      ) : (
        <>
          <span className="tz-gl-sucursal-nombre">{sucursal.nombre}</span>
          <button type="button" className="tz-vis-edit-btn" onClick={() => { setValue(sucursal.nombre); setEditing(true); }} aria-label={`Renombrar ${sucursal.nombre}`}>
            <Pencil size={13} />
          </button>
          <button type="button" className="tz-vis-delete-btn" onClick={() => setConfirming(true)} aria-label={`Eliminar ${sucursal.nombre}`}>
            <Trash2 size={13} />
          </button>
        </>
      )}
      {error && !confirming && <p className="tz-error tz-sa-inline-error">{error}</p>}
    </div>
  );
}

function LocalidadRow({ localidad, sucursales, onRenameLocalidad, onDeleteLocalidad, onDesactivarLocalidad, onSucursalDragEnd, onRenameSucursal, onDeleteSucursal, onDesactivarSucursal, onCrearSucursal }) {
  const drag = useDragItem(`localidad:${localidad.id}`);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(localidad.nombre);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [desactivando, setDesactivando] = useState(false);
  const [error, setError] = useState("");
  const [fkConflict, setFkConflict] = useState(false);
  const [creating, setCreating] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const save = async () => {
    const nombre = value.trim();
    if (!nombre) return;
    setSaving(true);
    setError("");
    const { error: err } = await onRenameLocalidad(localidad, nombre);
    setSaving(false);
    if (err) {
      setError("No se pudo guardar.");
      return;
    }
    setEditing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    setFkConflict(false);
    setError("");
    const { error: err, fkConflict: isFk } = await onDeleteLocalidad(localidad);
    setDeleting(false);
    if (err) {
      if (isFk) setFkConflict(true);
      else setError(err.message ? `No se pudo eliminar: ${err.message}` : "No se pudo eliminar.");
      return;
    }
  };

  const handleDesactivar = async () => {
    setDesactivando(true);
    setError("");
    const { error: err } = await onDesactivarLocalidad(localidad);
    setDesactivando(false);
    if (err) {
      setError(err.message ? `No se pudo desactivar: ${err.message}` : "No se pudo desactivar.");
    }
  };

  const handleCrear = async () => {
    setCreating(true);
    await onCrearSucursal(localidad.id);
    setCreating(false);
  };

  return (
    <div ref={drag.setNodeRef} style={drag.style} className="tz-gl-localidad">
      <div className="tz-gl-localidad-head">
        <span className="tz-sa-drag-handle" ref={drag.setActivatorNodeRef} {...drag.listeners} {...drag.attributes} aria-label={`Arrastrar ${localidad.nombre}`}>
          <GripVertical size={14} />
        </span>
        {editing ? (
          <>
            <input
              className="tz-text-input tz-sa-inline-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && save()}
            />
            <button type="button" className="tz-vis-edit-btn" onClick={save} disabled={saving}>
              {saving ? <Loader2 size={13} className="tz-spin" /> : <Check size={13} />}
            </button>
            <button type="button" className="tz-vis-edit-btn" onClick={() => setEditing(false)} disabled={saving}>
              <X size={13} />
            </button>
          </>
        ) : (
          <>
            <button type="button" className="tz-gl-localidad-toggle" onClick={() => setExpanded((v) => !v)}>
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              <span className="tz-gl-localidad-nombre">{localidad.nombre}</span>
              <span className="tz-gl-localidad-count">({sucursales.length})</span>
            </button>
            <button type="button" className="tz-vis-edit-btn" onClick={() => { setValue(localidad.nombre); setEditing(true); }} aria-label={`Renombrar ${localidad.nombre}`}>
              <Pencil size={13} />
            </button>
            <button type="button" className="tz-vis-delete-btn" onClick={() => setConfirming(true)} aria-label={`Eliminar ${localidad.nombre}`}>
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>

      {confirming && (
        <div className="tz-vis-confirm-delete tz-gl-confirm">
          <p>¿Eliminar la localidad <strong>{localidad.nombre}</strong>?</p>
          {fkConflict && (
            <>
              <p className="tz-error">
                No se puede eliminar: todavía tiene sucursales adentro. Movelas o eliminalas primero.
              </p>
              <p className="tz-stock-editor-sub">
                Podés desactivarla en su lugar — deja de verse en selectores/catálogo, sin borrar nada de su historial.
              </p>
            </>
          )}
          {error && <p className="tz-error">{error}</p>}
          <div className="tz-vis-confirm-actions">
            {!fkConflict ? (
              <button type="button" className="tz-cliente-action-btn tz-cliente-action-deuda" onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 size={13} className="tz-spin" /> : <Trash2 size={13} />} Sí, eliminar
              </button>
            ) : (
              <button type="button" className="tz-cliente-action-btn tz-cliente-action-pago" onClick={handleDesactivar} disabled={desactivando}>
                {desactivando ? <Loader2 size={13} className="tz-spin" /> : <EyeOff size={13} />} Desactivar
              </button>
            )}
            <button type="button" className="tz-cliente-action-btn" onClick={() => { setConfirming(false); setFkConflict(false); setError(""); }} disabled={deleting || desactivando}>
              <X size={13} /> Cancelar
            </button>
          </div>
        </div>
      )}

      {expanded && !confirming && (
        <div className="tz-gl-sucursales">
          <DndContext sensors={sensors} onDragEnd={(e) => onSucursalDragEnd(localidad.id, e)}>
            <SortableContext items={sucursales.map((s) => `sucursal:${s.id}`)} strategy={verticalListSortingStrategy}>
              {sucursales.map((s) => (
                <SucursalRow key={s.id} sucursal={s} onRename={onRenameSucursal} onDelete={onDeleteSucursal} onDesactivar={onDesactivarSucursal} />
              ))}
            </SortableContext>
          </DndContext>
          <button type="button" className="tz-sa-add-btn tz-gl-add-sucursal-btn" onClick={handleCrear} disabled={creating}>
            {creating ? <Loader2 size={13} className="tz-spin" /> : <Plus size={13} />} Nueva sucursal
          </button>
        </div>
      )}
    </div>
  );
}

export default function GestorLocalidadesModal({ negocioId, onClose }) {
  const [localidades, setLocalidades] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creatingLocalidad, setCreatingLocalidad] = useState(false);
  const [nuevaLocalidad, setNuevaLocalidad] = useState("");
  const [localidadSaving, setLocalidadSaving] = useState(false);
  const [changed, setChanged] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const cargar = async () => {
    setLoading(true);
    setError("");
    let locQuery = supabase.from("localidades").select("*").eq("activo", true).order("orden");
    if (negocioId) locQuery = locQuery.eq("negocio_id", negocioId);
    const { data: locRows, error: locErr } = await locQuery;
    if (locErr) {
      setError("No se pudo cargar las localidades.");
      setLoading(false);
      return;
    }
    const localidadIds = (locRows || []).map((r) => r.id);
    const { data: sucRows, error: sucErr } = await supabase
      .from("sucursales")
      .select("*")
      .eq("activo", true)
      .in("localidad_id", localidadIds.length ? localidadIds : ["00000000-0000-0000-0000-000000000000"])
      .order("orden");
    if (sucErr) {
      setError("No se pudo cargar las sucursales.");
      setLoading(false);
      return;
    }
    setLocalidades(locRows || []);
    setSucursales(sucRows || []);
    setLoading(false);
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [negocioId]);

  const sucursalesPorLocalidad = (localidadId) => sucursales.filter((s) => s.localidad_id === localidadId);

  const handleCrearLocalidad = async () => {
    const nombre = nuevaLocalidad.trim();
    if (!nombre) return;
    setLocalidadSaving(true);
    const orden = localidades.length;
    const { data, error: err } = await supabase
      .from("localidades")
      .insert({ nombre, activo: true, negocio_id: negocioId, orden })
      .select()
      .single();
    setLocalidadSaving(false);
    if (err) {
      setError(err.message || "No se pudo crear la localidad.");
      return;
    }
    setLocalidades((prev) => [...prev, data]);
    setChanged(true);
    setNuevaLocalidad("");
    setCreatingLocalidad(false);
  };

  const handleCrearSucursal = async (localidadId) => {
    const nombre = (window.prompt("Nombre de la nueva sucursal:") || "").trim();
    if (!nombre) return;
    const orden = sucursalesPorLocalidad(localidadId).length;
    const { data: sucursalData, error: err } = await supabase
      .from("sucursales")
      .insert({ localidad_id: localidadId, nombre, activo: true, orden })
      .select()
      .single();
    if (err) {
      setError(err.message || "No se pudo crear la sucursal.");
      return;
    }
    await supabase.from("cajas").insert({ sucursal_id: sucursalData.id, nombre: "Caja 1", estado: "cerrada" });
    setSucursales((prev) => [...prev, sucursalData]);
    setChanged(true);
  };

  const handleRenameLocalidad = async (localidad, nombre) => {
    const { error: err } = await supabase.from("localidades").update({ nombre }).eq("id", localidad.id);
    if (!err) {
      setLocalidades((prev) => prev.map((l) => (l.id === localidad.id ? { ...l, nombre } : l)));
      setChanged(true);
    }
    return { error: err };
  };

  // 23503 = foreign_key_violation — mismo criterio que el resto de la
  // app (categorías, rubros, negocios): si la localidad todavía tiene
  // sucursales adentro, se bloquea el borrado en vez de arrastrarlas
  // solas o perder historial por accidente.
  const handleDeleteLocalidad = async (localidad) => {
    const { error: err } = await supabase.from("localidades").delete().eq("id", localidad.id);
    if (err) return { error: err, fkConflict: err.code === "23503" };
    setLocalidades((prev) => prev.filter((l) => l.id !== localidad.id));
    setChanged(true);
    return { error: null };
  };

  // Alternativa cuando el borrado choca con historial real: mismo
  // criterio que negocios/rubros/productos en el resto de la app — se
  // oculta (activo=false) en vez de borrar, sin perder nada.
  const handleDesactivarLocalidad = async (localidad) => {
    const { error: err } = await supabase.from("localidades").update({ activo: false }).eq("id", localidad.id);
    if (err) return { error: err };
    setLocalidades((prev) => prev.filter((l) => l.id !== localidad.id));
    setChanged(true);
    return { error: null };
  };

  const handleRenameSucursal = async (sucursal, nombre) => {
    const { error: err } = await supabase.from("sucursales").update({ nombre }).eq("id", sucursal.id);
    if (!err) {
      setSucursales((prev) => prev.map((s) => (s.id === sucursal.id ? { ...s, nombre } : s)));
      setChanged(true);
    }
    return { error: err };
  };

  const handleDeleteSucursal = async (sucursal) => {
    const { error: err } = await supabase.from("sucursales").delete().eq("id", sucursal.id);
    if (err) return { error: err, fkConflict: err.code === "23503" };
    setSucursales((prev) => prev.filter((s) => s.id !== sucursal.id));
    setChanged(true);
    return { error: null };
  };

  const handleDesactivarSucursal = async (sucursal) => {
    const { error: err } = await supabase.from("sucursales").update({ activo: false }).eq("id", sucursal.id);
    if (err) return { error: err };
    setSucursales((prev) => prev.filter((s) => s.id !== sucursal.id));
    setChanged(true);
    return { error: null };
  };

  const handleLocalidadDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localidades.findIndex((l) => `localidad:${l.id}` === active.id);
    const newIndex = localidades.findIndex((l) => `localidad:${l.id}` === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(localidades, oldIndex, newIndex).map((l, i) => ({ ...l, orden: i }));
    setLocalidades(reordered);
    setChanged(true);
    await Promise.all(reordered.map((l) => supabase.from("localidades").update({ orden: l.orden }).eq("id", l.id)));
  };

  const handleSucursalDragEnd = async (localidadId, event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const subset = sucursalesPorLocalidad(localidadId);
    const oldIndex = subset.findIndex((s) => `sucursal:${s.id}` === active.id);
    const newIndex = subset.findIndex((s) => `sucursal:${s.id}` === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reorderedSubset = arrayMove(subset, oldIndex, newIndex).map((s, i) => ({ ...s, orden: i }));
    setSucursales((prev) => {
      const others = prev.filter((s) => s.localidad_id !== localidadId);
      return [...others, ...reorderedSubset];
    });
    setChanged(true);
    await Promise.all(reorderedSubset.map((s) => supabase.from("sucursales").update({ orden: s.orden }).eq("id", s.id)));
  };

  return (
    <div className="tz-modal-backdrop" onClick={() => onClose(changed)}>
      <Styles />
      <div className="tz-modal tz-modal-wide" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tz-modal-close" onClick={() => onClose(changed)} aria-label="Cerrar">
          <X size={18} />
        </button>
        <h2>Gestor de Localidades</h2>
        <p className="tz-stock-editor-sub">
          Arrastra para ordenar, tocá el lápiz para renombrar. Localidad/sucursal con historial no se
          puede eliminar hasta vaciarla.
        </p>

        {error && <p className="tz-error">{error}</p>}

        {loading ? (
          <div className="tz-loading" style={{ minHeight: "auto", padding: "20px 0" }}>
            <Loader2 className="tz-spin" size={26} />
          </div>
        ) : (
          <>
            <DndContext sensors={sensors} onDragEnd={handleLocalidadDragEnd}>
              <SortableContext items={localidades.map((l) => `localidad:${l.id}`)} strategy={verticalListSortingStrategy}>
                <div className="tz-gl-list">
                  {localidades.map((l) => (
                    <LocalidadRow
                      key={l.id}
                      localidad={l}
                      sucursales={sucursalesPorLocalidad(l.id)}
                      onRenameLocalidad={handleRenameLocalidad}
                      onDeleteLocalidad={handleDeleteLocalidad}
                      onDesactivarLocalidad={handleDesactivarLocalidad}
                      onSucursalDragEnd={handleSucursalDragEnd}
                      onRenameSucursal={handleRenameSucursal}
                      onDeleteSucursal={handleDeleteSucursal}
                      onDesactivarSucursal={handleDesactivarSucursal}
                      onCrearSucursal={handleCrearSucursal}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {creatingLocalidad ? (
              <div className="tz-sa-new-row">
                <input
                  className="tz-text-input"
                  placeholder="Nombre de la localidad"
                  value={nuevaLocalidad}
                  onChange={(e) => setNuevaLocalidad(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCrearLocalidad()}
                  autoFocus
                />
                <div className="tz-vis-confirm-actions">
                  <button type="button" className="tz-cliente-action-btn tz-cliente-action-pago" onClick={handleCrearLocalidad} disabled={localidadSaving}>
                    {localidadSaving ? <Loader2 size={13} className="tz-spin" /> : <Check size={13} />} Crear
                  </button>
                  <button type="button" className="tz-cliente-action-btn" onClick={() => setCreatingLocalidad(false)} disabled={localidadSaving}>
                    <X size={13} /> Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="tz-sa-add-btn" style={{ marginTop: 12 }} onClick={() => { setNuevaLocalidad(""); setCreatingLocalidad(true); }}>
                <Plus size={14} /> Nueva localidad
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
