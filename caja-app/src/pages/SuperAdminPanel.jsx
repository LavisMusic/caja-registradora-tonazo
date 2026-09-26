import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  LogOut,
  Loader2,
  Plus,
  Pencil,
  Check,
  X,
  GripVertical,
  Store,
  ImagePlus,
  Trash2,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import Styles from "../components/Styles";
import logo from "../assets/logo.webp";

/* Fase 1 del super-admin: gestor de rubros (columna izquierda, estilo
   directorio) + gestor de negocios (grilla de 3 columnas estilo Friv) +
   alta del primer admin de cada negocio, ver acuerdo con el usuario en
   la conversación. Todavía falta: el logo propagado a las boletas.

   Pantalla COMPLETAMENTE aparte de App.jsx (no comparte su lógica de
   POS) — montada directo desde SuperAdminAccessPage.jsx (ruta
   /superadmin) cuando profile.role === 'super_admin'. */

// slug de la URL de login del negocio (/:slug, ver NegocioAccessPage) —
// minúsculas, sin tildes/ñ, solo [a-z0-9-]. Se usa tanto para
// sugerir un slug a partir del nombre como para normalizar lo que el
// super-admin haya escrito a mano antes de guardarlo.
function slugify(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

function RubroRow({ rubro, selected, onSelect, onRename, onToggleActivo, onDelete }) {
  const drag = useDragItem(`rubro:${rubro.id}`);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(rubro.nombre);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fkConflict, setFkConflict] = useState(false);

  const save = async () => {
    const nombre = value.trim();
    if (!nombre) return;
    setSaving(true);
    setError("");
    const { error: err } = await onRename(rubro, nombre);
    setSaving(false);
    if (err) {
      setError("No se pudo guardar.");
      return;
    }
    setEditing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    setFkConflict(false);
    const { error: err, fkConflict: isFk } = await onDelete(rubro);
    setDeleting(false);
    if (err) {
      if (isFk) setFkConflict(true);
      else setError(err.message ? `No se pudo eliminar: ${err.message}` : "No se pudo eliminar.");
      return;
    }
    // Si funcionó, el padre ya sacó esta fila de la lista.
  };

  if (confirming) {
    return (
      <div className="tz-vis-confirm-delete tz-sa-rubro-confirm">
        <p>¿Eliminar <strong>{rubro.nombre}</strong> definitivamente?</p>
        {fkConflict && (
          <p className="tz-error">
            No se puede eliminar: todavía tiene negocios asignados. Movelos a otro rubro o
            desactivalos primero.
          </p>
        )}
        {error && <p className="tz-error">{error}</p>}
        <div className="tz-vis-confirm-actions">
          {!fkConflict && (
            <button
              type="button"
              className="tz-cliente-action-btn tz-cliente-action-deuda"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 size={13} className="tz-spin" /> : <Trash2 size={13} />}
              Sí, eliminar
            </button>
          )}
          <button
            type="button"
            className="tz-cliente-action-btn"
            onClick={() => {
              setConfirming(false);
              setFkConflict(false);
              setError("");
            }}
            disabled={deleting}
          >
            <X size={13} /> Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={drag.setNodeRef} style={drag.style} className={`tz-sa-rubro-row ${selected ? "tz-sa-rubro-row-active" : ""}`}>
      <span
        className="tz-sa-drag-handle"
        ref={drag.setActivatorNodeRef}
        {...drag.listeners}
        {...drag.attributes}
        aria-label={`Arrastrar ${rubro.nombre}`}
      >
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
          <button type="button" className="tz-sa-rubro-label" onClick={() => onSelect(rubro.id)}>
            {rubro.nombre}
          </button>
          <button
            type="button"
            className="tz-vis-edit-btn"
            onClick={() => {
              setValue(rubro.nombre);
              setEditing(true);
            }}
            aria-label={`Editar ${rubro.nombre}`}
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            className="tz-vis-delete-btn"
            onClick={() => setConfirming(true)}
            aria-label={`Eliminar ${rubro.nombre}`}
            title="Eliminar rubro"
          >
            <Trash2 size={13} />
          </button>
          <label className="tz-toggle tz-sa-rubro-toggle" title={rubro.activo ? "Activo" : "Oculto"}>
            <input
              type="checkbox"
              checked={rubro.activo}
              onChange={(e) => onToggleActivo(rubro, e.target.checked)}
            />
            <span className="tz-toggle-slider" />
          </label>
        </>
      )}
      {error && <p className="tz-error tz-sa-inline-error">{error}</p>}
    </div>
  );
}

function NegocioCard({ negocio, onRename, onToggleActivo, onLogoChange, onDelete, onCreateAdmin }) {
  const drag = useDragItem(`negocio:${negocio.id}`);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(negocio.nombre);
  const [slugValue, setSlugValue] = useState(negocio.slug || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fkConflict, setFkConflict] = useState(false);

  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminNombre, setAdminNombre] = useState("");
  const [adminUsuario, setAdminUsuario] = useState("");
  const [adminClave, setAdminClave] = useState("");
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminOk, setAdminOk] = useState("");

  const handleCreateAdmin = async () => {
    const nombre = adminNombre.trim();
    const usuario = adminUsuario.trim();
    if (!nombre || !usuario || !adminClave) {
      setAdminError("Completá nombre, usuario y clave.");
      return;
    }
    setAdminSaving(true);
    setAdminError("");
    const { error: err } = await onCreateAdmin(negocio, { nombre, usuario, pin: adminClave });
    setAdminSaving(false);
    if (err) {
      setAdminError(err);
      return;
    }
    setAdminOk(`Admin "${usuario}" creado.`);
    setAdminNombre("");
    setAdminUsuario("");
    setAdminClave("");
    setCreatingAdmin(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    setFkConflict(false);
    const { error: err, fkConflict: isFk } = await onDelete(negocio);
    setDeleting(false);
    if (err) {
      if (isFk) setFkConflict(true);
      else setError(err.message ? `No se pudo eliminar: ${err.message}` : "No se pudo eliminar.");
      return;
    }
    // Si funcionó, el padre ya sacó esta tarjeta de la lista.
  };

  const save = async () => {
    const nombre = value.trim();
    const slug = slugify(slugValue);
    if (!nombre || !slug) return;
    setSaving(true);
    setError("");
    const { error: err } = await onRename(negocio, { nombre, slug });
    setSaving(false);
    if (err) {
      setError(err.message || "No se pudo guardar.");
      return;
    }
    setEditing(false);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    const { error: err } = await onLogoChange(negocio, file);
    setUploading(false);
    if (err) setError("No se pudo subir el logo.");
  };

  return (
    <div ref={drag.setNodeRef} style={drag.style} className="tz-sa-negocio-card">
      <span
        className="tz-sa-drag-handle tz-sa-negocio-drag"
        ref={drag.setActivatorNodeRef}
        {...drag.listeners}
        {...drag.attributes}
        aria-label={`Arrastrar ${negocio.nombre}`}
      >
        <GripVertical size={14} />
      </span>

      <label className="tz-sa-negocio-logo-wrap" title="Cambiar logo">
        {negocio.logo_url ? (
          <img src={negocio.logo_url} alt={negocio.nombre} className="tz-sa-negocio-logo" />
        ) : (
          <span className="tz-sa-negocio-logo-placeholder">
            <Store size={28} />
          </span>
        )}
        <span className="tz-sa-negocio-logo-overlay">
          {uploading ? <Loader2 size={16} className="tz-spin" /> : <ImagePlus size={16} />}
        </span>
        <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} hidden />
      </label>

      {editing ? (
        <div className="tz-sa-negocio-edit-col">
          <input
            className="tz-text-input tz-sa-inline-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Nombre"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
          <input
            className="tz-text-input tz-sa-inline-input"
            value={slugValue}
            onChange={(e) => setSlugValue(e.target.value)}
            placeholder="slug (para /slug)"
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
          <div className="tz-sa-negocio-edit-row">
            <button type="button" className="tz-vis-edit-btn" onClick={save} disabled={saving}>
              {saving ? <Loader2 size={13} className="tz-spin" /> : <Check size={13} />}
            </button>
            <button type="button" className="tz-vis-edit-btn" onClick={() => setEditing(false)} disabled={saving}>
              <X size={13} />
            </button>
          </div>
        </div>
      ) : (
        <div className="tz-sa-negocio-name-row">
          <span className="tz-sa-negocio-name">{negocio.nombre}</span>
          <button
            type="button"
            className="tz-vis-edit-btn"
            onClick={() => {
              setValue(negocio.nombre);
              setSlugValue(negocio.slug || "");
              setEditing(true);
            }}
            aria-label={`Editar ${negocio.nombre}`}
          >
            <Pencil size={13} />
          </button>
        </div>
      )}
      {!editing && (
        <p className="tz-sa-negocio-slug">
          {negocio.slug ? `/${negocio.slug}` : "Sin slug — no tiene URL de login todavía"}
        </p>
      )}

      {!confirming && (
        <label className="tz-toggle tz-sa-negocio-toggle" title={negocio.activo ? "Activo" : "Oculto"}>
          <input
            type="checkbox"
            checked={negocio.activo}
            onChange={(e) => onToggleActivo(negocio, e.target.checked)}
          />
          <span className="tz-toggle-slider" />
          <span className="tz-sa-negocio-toggle-label">{negocio.activo ? "Activo" : "Oculto"}</span>
        </label>
      )}

      {!confirming && (
        creatingAdmin ? (
          <div className="tz-sa-new-row tz-sa-negocio-admin-form">
            <input
              className="tz-text-input"
              placeholder="Nombre del admin"
              value={adminNombre}
              onChange={(e) => setAdminNombre(e.target.value)}
              autoFocus
            />
            <input
              className="tz-text-input"
              placeholder="Usuario (para el login)"
              value={adminUsuario}
              onChange={(e) => setAdminUsuario(e.target.value)}
              autoCapitalize="off"
              autoCorrect="off"
            />
            <input
              type="password"
              className="tz-text-input"
              placeholder="Clave (6 a 10 dígitos)"
              value={adminClave}
              onChange={(e) => setAdminClave(e.target.value)}
            />
            {adminError && <p className="tz-error">{adminError}</p>}
            <div className="tz-vis-confirm-actions">
              <button
                type="button"
                className="tz-cliente-action-btn tz-cliente-action-pago"
                onClick={handleCreateAdmin}
                disabled={adminSaving}
              >
                {adminSaving ? <Loader2 size={13} className="tz-spin" /> : <Check size={13} />} Crear acceso
              </button>
              <button
                type="button"
                className="tz-cliente-action-btn"
                onClick={() => setCreatingAdmin(false)}
                disabled={adminSaving}
              >
                <X size={13} /> Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="tz-sa-add-btn tz-sa-negocio-admin-btn"
            onClick={() => {
              setAdminError("");
              setAdminOk("");
              setCreatingAdmin(true);
            }}
          >
            <Plus size={14} /> Dar acceso a un admin
          </button>
        )
      )}
      {adminOk && !creatingAdmin && <p className="tz-sa-negocio-admin-ok">{adminOk}</p>}

      {confirming ? (
        <div className="tz-vis-confirm-delete tz-sa-negocio-confirm">
          <p>¿Eliminar <strong>{negocio.nombre}</strong> definitivamente?</p>
          {fkConflict && (
            <p className="tz-error">
              No se puede eliminar: todavía tiene datos asociados (localidades, productos, ventas...).
              Desactivalo en su lugar con el interruptor de arriba.
            </p>
          )}
          <div className="tz-vis-confirm-actions">
            {!fkConflict && (
              <button
                type="button"
                className="tz-cliente-action-btn tz-cliente-action-deuda"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <Loader2 size={13} className="tz-spin" /> : <Trash2 size={13} />}
                Sí, eliminar
              </button>
            )}
            <button
              type="button"
              className="tz-cliente-action-btn"
              onClick={() => {
                setConfirming(false);
                setFkConflict(false);
              }}
              disabled={deleting}
            >
              <X size={13} /> Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="tz-sa-negocio-delete-btn"
          onClick={() => setConfirming(true)}
          aria-label={`Eliminar ${negocio.nombre}`}
          title="Eliminar negocio"
        >
          <Trash2 size={13} /> Eliminar
        </button>
      )}

      {error && <p className="tz-error tz-sa-inline-error">{error}</p>}
    </div>
  );
}

export default function SuperAdminPanel() {
  const { signOut, nombre } = useAuth();
  const [rubros, setRubros] = useState([]);
  const [negocios, setNegocios] = useState([]);
  const [selectedRubroId, setSelectedRubroId] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [creatingRubro, setCreatingRubro] = useState(false);
  const [nuevoRubro, setNuevoRubro] = useState("");
  const [rubroSaving, setRubroSaving] = useState(false);
  const [rubroError, setRubroError] = useState("");

  const [creatingNegocio, setCreatingNegocio] = useState(false);
  const [nuevoNegocioNombre, setNuevoNegocioNombre] = useState("");
  const [nuevoNegocioSlug, setNuevoNegocioSlug] = useState("");
  const [nuevoNegocioRubroId, setNuevoNegocioRubroId] = useState("");
  const [negocioSaving, setNegocioSaving] = useState(false);
  const [negocioError, setNegocioError] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const cargar = async () => {
    setLoading(true);
    setLoadError("");
    const [{ data: rubrosData, error: rubrosErr }, { data: negociosData, error: negociosErr }] = await Promise.all([
      supabase.from("rubros").select("*").order("orden", { ascending: true }),
      supabase.from("negocios").select("*").order("orden", { ascending: true }),
    ]);
    if (rubrosErr || negociosErr) {
      setLoadError((rubrosErr || negociosErr).message || "No se pudo cargar el directorio.");
      setLoading(false);
      return;
    }
    setRubros(rubrosData || []);
    setNegocios(negociosData || []);
    setLoading(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  const negociosFiltrados = useMemo(() => {
    if (selectedRubroId === "todos") return negocios;
    return negocios.filter((n) => n.rubro_id === selectedRubroId);
  }, [negocios, selectedRubroId]);

  /* ---- Rubros ---- */
  const handleCreateRubro = async () => {
    const nombre = nuevoRubro.trim();
    if (!nombre) {
      setRubroError("Escribe un nombre.");
      return;
    }
    setRubroSaving(true);
    setRubroError("");
    const orden = rubros.length ? Math.max(...rubros.map((r) => r.orden ?? 0)) + 1 : 0;
    const { data, error } = await supabase
      .from("rubros")
      .insert({ nombre, orden })
      .select()
      .single();
    setRubroSaving(false);
    if (error) {
      setRubroError(error.message ? `No se pudo crear: ${error.message}` : "No se pudo crear el rubro.");
      return;
    }
    setRubros((prev) => [...prev, data]);
    setNuevoRubro("");
    setCreatingRubro(false);
  };

  const handleRenameRubro = async (rubro, nombre) => {
    const { error } = await supabase.from("rubros").update({ nombre }).eq("id", rubro.id);
    if (!error) setRubros((prev) => prev.map((r) => (r.id === rubro.id ? { ...r, nombre } : r)));
    return { error };
  };

  const handleToggleRubroActivo = async (rubro, activo) => {
    setRubros((prev) => prev.map((r) => (r.id === rubro.id ? { ...r, activo } : r)));
    const { error } = await supabase.from("rubros").update({ activo }).eq("id", rubro.id);
    if (error) setRubros((prev) => prev.map((r) => (r.id === rubro.id ? { ...r, activo: !activo } : r)));
  };

  // 23503 = foreign_key_violation — mismo criterio que handleDeleteNegocio
  // más abajo: un rubro con negocios asignados (negocios.rubro_id, sin
  // ON DELETE CASCADE a propósito) no se borra solo, hay que
  // reasignarlos o desactivarlos primero.
  const handleDeleteRubro = async (rubro) => {
    const { error } = await supabase.from("rubros").delete().eq("id", rubro.id);
    if (error) {
      return { error, fkConflict: error.code === "23503" };
    }
    setRubros((prev) => prev.filter((r) => r.id !== rubro.id));
    setSelectedRubroId((prev) => (prev === rubro.id ? "todos" : prev));
    return { error: null };
  };

  const handleRubroDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rubros.findIndex((r) => `rubro:${r.id}` === active.id);
    const newIndex = rubros.findIndex((r) => `rubro:${r.id}` === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(rubros, oldIndex, newIndex).map((r, i) => ({ ...r, orden: i }));
    setRubros(reordered);
    await Promise.all(
      reordered.map((r) => supabase.from("rubros").update({ orden: r.orden }).eq("id", r.id))
    );
  };

  /* ---- Negocios ---- */
  const handleCreateNegocio = async () => {
    const nombre = nuevoNegocioNombre.trim();
    const slug = slugify(nuevoNegocioSlug || nombre);
    const rubroId = nuevoNegocioRubroId || rubros[0]?.id;
    if (!nombre) {
      setNegocioError("Escribe un nombre.");
      return;
    }
    if (!slug) {
      setNegocioError("Escribe un slug (para la URL de login, ej. tonazo).");
      return;
    }
    if (!rubroId) {
      setNegocioError("Creá primero un rubro.");
      return;
    }
    setNegocioSaving(true);
    setNegocioError("");
    const orden = negocios.length ? Math.max(...negocios.map((n) => n.orden ?? 0)) + 1 : 0;
    const { data, error } = await supabase
      .from("negocios")
      .insert({ nombre, slug, rubro_id: rubroId, orden })
      .select()
      .single();
    setNegocioSaving(false);
    if (error) {
      setNegocioError(
        error.code === "23505"
          ? `Ya existe un negocio con el slug "${slug}" — probá con otro.`
          : error.message
            ? `No se pudo crear: ${error.message}`
            : "No se pudo crear el negocio."
      );
      return;
    }
    setNegocios((prev) => [...prev, data]);
    setNuevoNegocioNombre("");
    setNuevoNegocioSlug("");
    setCreatingNegocio(false);
  };

  const handleRenameNegocio = async (negocio, { nombre, slug }) => {
    const { error } = await supabase.from("negocios").update({ nombre, slug }).eq("id", negocio.id);
    if (!error) setNegocios((prev) => prev.map((n) => (n.id === negocio.id ? { ...n, nombre, slug } : n)));
    return {
      error: error
        ? { message: error.code === "23505" ? `Ya existe un negocio con el slug "${slug}".` : error.message }
        : null,
    };
  };

  const handleToggleNegocioActivo = async (negocio, activo) => {
    setNegocios((prev) => prev.map((n) => (n.id === negocio.id ? { ...n, activo } : n)));
    const { error } = await supabase.from("negocios").update({ activo }).eq("id", negocio.id);
    if (error) setNegocios((prev) => prev.map((n) => (n.id === negocio.id ? { ...n, activo: !activo } : n)));
  };

  const handleNegocioLogoChange = async (negocio, file) => {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const fileName = `${negocio.id}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("negocio-logos")
      .upload(fileName, file, { contentType: file.type || "image/jpeg", upsert: false });
    if (uploadError) return { error: uploadError };

    const { data } = supabase.storage.from("negocio-logos").getPublicUrl(fileName);
    const url = data?.publicUrl;
    if (!url) return { error: new Error("Sin URL pública") };

    const { error: updateError } = await supabase.from("negocios").update({ logo_url: url }).eq("id", negocio.id);
    if (updateError) return { error: updateError };

    setNegocios((prev) => prev.map((n) => (n.id === negocio.id ? { ...n, logo_url: url } : n)));
    return { error: null };
  };

  // 23503 = foreign_key_violation (Postgres) — el negocio ya tiene
  // localidades/productos/etc. apuntándole (negocio_id, ver migración
  // 0073). No hay ON DELETE CASCADE a propósito: perder ese rastro por
  // error sería mucho peor que solo bloquear el borrado y ofrecer
  // desactivar en su lugar (mismo criterio que ya usa el borrado de
  // categoría/producto en el catálogo).
  const handleDeleteNegocio = async (negocio) => {
    const { error } = await supabase.from("negocios").delete().eq("id", negocio.id);
    if (error) {
      return { error, fkConflict: error.code === "23503" };
    }
    setNegocios((prev) => prev.filter((n) => n.id !== negocio.id));
    return { error: null };
  };

  // Alta del primer admin de un negocio (Fase 1, parte 5) — vía Edge
  // Function (create-cliente, tipo:'admin'): crea la cuenta de Auth +
  // su fila en 'profiles' con role='admin' y negocio_id = este negocio.
  // No hay tope de "un solo admin por negocio" acá: el super-admin
  // puede repetir esto tantas veces como quiera si un negocio necesita
  // más de un usuario con acceso admin.
  const handleCreateAdminForNegocio = async (negocio, { nombre, usuario, pin }) => {
    const { error } = await supabase.functions.invoke("create-cliente", {
      body: { tipo: "admin", nombre, usuario, pin, negocioId: negocio.id },
    });
    if (error) {
      const body = await error.context?.json?.().catch(() => null);
      return { error: body?.error || "No se pudo crear el acceso." };
    }
    return { error: null };
  };

  const handleNegocioDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    // Reordena dentro de la lista COMPLETA (no solo la filtrada) para
    // que el 'orden' guardado tenga sentido también viendo "Todos".
    const oldIndex = negocios.findIndex((n) => `negocio:${n.id}` === active.id);
    const newIndex = negocios.findIndex((n) => `negocio:${n.id}` === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(negocios, oldIndex, newIndex).map((n, i) => ({ ...n, orden: i }));
    setNegocios(reordered);
    await Promise.all(
      reordered.map((n) => supabase.from("negocios").update({ orden: n.orden }).eq("id", n.id))
    );
  };

  return (
    <div className="tz-root tz-sa-root">
      <Styles />
      <header className="tz-sa-header">
        <img src={logo} alt="TONAZO" className="tz-sa-header-logo" />
        <div className="tz-sa-header-title">
          <h1>Super Admin</h1>
          <p>{nombre || "Directorio de negocios"}</p>
        </div>
        <button type="button" className="tz-header-btn tz-sa-logout" onClick={signOut}>
          <LogOut size={15} /> Salir
        </button>
      </header>

      {loading ? (
        <div className="tz-loading">
          <Loader2 className="tz-spin" size={28} />
          <p>Cargando...</p>
        </div>
      ) : loadError ? (
        <p className="tz-error" style={{ margin: 20 }}>{loadError}</p>
      ) : (
        <div className="tz-sa-body">
          <aside className="tz-sa-rubros-col">
            <h2 className="tz-sa-col-title">Rubros</h2>
            <button
              type="button"
              className={`tz-sa-rubro-row tz-sa-rubro-todos ${selectedRubroId === "todos" ? "tz-sa-rubro-row-active" : ""}`}
              onClick={() => setSelectedRubroId("todos")}
            >
              Todos
            </button>

            <DndContext sensors={sensors} onDragEnd={handleRubroDragEnd}>
              <SortableContext items={rubros.map((r) => `rubro:${r.id}`)} strategy={verticalListSortingStrategy}>
                {rubros.map((r) => (
                  <RubroRow
                    key={r.id}
                    rubro={r}
                    selected={selectedRubroId === r.id}
                    onSelect={setSelectedRubroId}
                    onRename={handleRenameRubro}
                    onToggleActivo={handleToggleRubroActivo}
                    onDelete={handleDeleteRubro}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {creatingRubro ? (
              <div className="tz-sa-new-row">
                <input
                  className="tz-text-input"
                  placeholder="Nombre del rubro"
                  value={nuevoRubro}
                  onChange={(e) => setNuevoRubro(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateRubro()}
                  autoFocus
                />
                {rubroError && <p className="tz-error">{rubroError}</p>}
                <div className="tz-vis-confirm-actions">
                  <button type="button" className="tz-cliente-action-btn tz-cliente-action-pago" onClick={handleCreateRubro} disabled={rubroSaving}>
                    {rubroSaving ? <Loader2 size={13} className="tz-spin" /> : <Check size={13} />} Crear
                  </button>
                  <button type="button" className="tz-cliente-action-btn" onClick={() => setCreatingRubro(false)} disabled={rubroSaving}>
                    <X size={13} /> Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="tz-sa-add-btn" onClick={() => { setNuevoRubro(""); setRubroError(""); setCreatingRubro(true); }}>
                <Plus size={14} /> Nuevo rubro
              </button>
            )}
          </aside>

          <section className="tz-sa-negocios-col">
            <h2 className="tz-sa-col-title">
              Negocios {selectedRubroId !== "todos" && rubros.find((r) => r.id === selectedRubroId)
                ? `· ${rubros.find((r) => r.id === selectedRubroId).nombre}`
                : ""}
            </h2>

            <DndContext sensors={sensors} onDragEnd={handleNegocioDragEnd}>
              <SortableContext items={negociosFiltrados.map((n) => `negocio:${n.id}`)} strategy={verticalListSortingStrategy}>
                <div className="tz-sa-negocios-grid">
                  {negociosFiltrados.map((n) => (
                    <NegocioCard
                      key={n.id}
                      negocio={n}
                      onRename={handleRenameNegocio}
                      onToggleActivo={handleToggleNegocioActivo}
                      onLogoChange={handleNegocioLogoChange}
                      onDelete={handleDeleteNegocio}
                      onCreateAdmin={handleCreateAdminForNegocio}
                    />
                  ))}

                  <div className="tz-sa-negocio-card tz-sa-negocio-card-new">
                    {creatingNegocio ? (
                      <>
                        <input
                          className="tz-text-input"
                          placeholder="Nombre del negocio"
                          value={nuevoNegocioNombre}
                          onChange={(e) => setNuevoNegocioNombre(e.target.value)}
                          autoFocus
                        />
                        <input
                          className="tz-text-input"
                          placeholder={`Slug (ej. ${slugify(nuevoNegocioNombre) || "mi-negocio"}) — URL de login`}
                          value={nuevoNegocioSlug}
                          onChange={(e) => setNuevoNegocioSlug(e.target.value)}
                        />
                        <select
                          className="tz-text-input"
                          value={nuevoNegocioRubroId || rubros[0]?.id || ""}
                          onChange={(e) => setNuevoNegocioRubroId(e.target.value)}
                        >
                          {rubros.map((r) => (
                            <option key={r.id} value={r.id}>{r.nombre}</option>
                          ))}
                        </select>
                        {negocioError && <p className="tz-error">{negocioError}</p>}
                        <div className="tz-vis-confirm-actions">
                          <button type="button" className="tz-cliente-action-btn tz-cliente-action-pago" onClick={handleCreateNegocio} disabled={negocioSaving}>
                            {negocioSaving ? <Loader2 size={13} className="tz-spin" /> : <Check size={13} />} Crear
                          </button>
                          <button type="button" className="tz-cliente-action-btn" onClick={() => setCreatingNegocio(false)} disabled={negocioSaving}>
                            <X size={13} /> Cancelar
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="tz-sa-add-btn tz-sa-add-negocio-btn"
                        onClick={() => {
                          setNuevoNegocioNombre("");
                          setNuevoNegocioRubroId(selectedRubroId !== "todos" ? selectedRubroId : rubros[0]?.id || "");
                          setNegocioError("");
                          setCreatingNegocio(true);
                        }}
                      >
                        <Plus size={22} />
                        <span>Nuevo negocio</span>
                      </button>
                    )}
                  </div>
                </div>
              </SortableContext>
            </DndContext>
          </section>
        </div>
      )}
    </div>
  );
}
