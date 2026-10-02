import { useEffect, useMemo, useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, Loader2, Plus, Trash2, Store, GripVertical, Search, AlertTriangle, Building2 } from "lucide-react";
import { supabase } from "../supabaseClient";
import Styles from "../components/Styles";
import { ESTADOS_PLAN, calcularEstadoPlan } from "../lib/planes";

// Gestor de negocios del super admin (cabecera): crear negocios, buscar,
// mostrar/ocultar en el directorio, reordenar (arrastrando) y ELIMINAR.
// El borrado es forzado (migración 0091): muestra todo lo que tiene el
// negocio, pide escribir su nombre y borra TODO de la base en una sola
// transacción (cancela sus deliveries en Taxi-PE, desvincula a los
// clientes sin borrarlos y elimina las cuentas de admin/cajeros).
export function slugify(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const ETIQUETAS_RESUMEN = [
  ["cajas_abiertas", "cajas abiertas ahora"],
  ["deliveries_en_curso", "pedidos con delivery (se cancelan en Taxi-PE)"],
  ["ventas", "ventas registradas"],
  ["pedidos", "pedidos online"],
  ["productos", "productos"],
  ["clientes_con_fiado", "clientes con cuenta en este negocio (no se borran, solo se desvinculan)"],
  ["cuentas_staff", "cuentas de admin/cajeros (se eliminan)"],
  ["localidades", "localidades"],
  ["sucursales", "sucursales"],
  ["cajas", "cajas"],
];

function EliminarNegocio({ negocio, onCancelar, onEliminado }) {
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [confirmacion, setConfirmacion] = useState("");
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    supabase.rpc("resumen_negocio_para_borrar", { p_negocio_id: negocio.id }).then(({ data, error: err }) => {
      if (!activo) return;
      if (err) setError(err.message);
      setResumen(data || {});
      setCargando(false);
    });
    return () => {
      activo = false;
    };
  }, [negocio.id]);

  const coincide = confirmacion.trim().toLowerCase() === negocio.nombre.trim().toLowerCase();

  const borrar = async () => {
    setBorrando(true);
    setError("");
    const { error: err } = await supabase.rpc("eliminar_negocio_forzado", {
      p_negocio_id: negocio.id,
      p_confirmacion: confirmacion,
    });
    setBorrando(false);
    if (err) return setError(err.message || "No se pudo eliminar.");
    onEliminado(negocio.id);
  };

  return (
    <div className="tz-modal-backdrop" style={{ zIndex: 110 }}>
      <div className="tz-modal tz-sa-eliminar" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tz-modal-close" onClick={onCancelar} aria-label="Cerrar" disabled={borrando}>
          <X size={18} />
        </button>
        <h2 style={{ color: "var(--danger)" }}>
          <AlertTriangle size={18} /> Eliminar {negocio.nombre}
        </h2>
        <p className="tz-brand-sub">
          Esto <strong>cancela todas las operaciones</strong> del negocio y <strong>formatea sus cajas</strong>: se borra todo
          de la base de datos y <strong>no se puede deshacer</strong>.
        </p>
        {cargando ? (
          <Loader2 size={18} className="tz-spin" />
        ) : (
          <ul className="tz-sa-eliminar-resumen">
            {ETIQUETAS_RESUMEN.filter(([k]) => Number(resumen?.[k] || 0) > 0).map(([k, etiqueta]) => (
              <li key={k}>
                <strong>{resumen[k]}</strong> {etiqueta}
              </li>
            ))}
            {ETIQUETAS_RESUMEN.every(([k]) => !Number(resumen?.[k] || 0)) && <li>No tiene datos asociados.</li>}
          </ul>
        )}
        <label className="tz-field-label" htmlFor="confirmar-borrado">
          Escribe <strong>{negocio.nombre}</strong> para confirmar
        </label>
        <input
          id="confirmar-borrado"
          className="tz-text-input"
          value={confirmacion}
          onChange={(e) => setConfirmacion(e.target.value)}
          autoComplete="off"
          autoFocus
        />
        {error && <p className="tz-error">{error}</p>}
        <div className="tz-vis-confirm-actions" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="tz-cliente-action-btn tz-cliente-action-deuda"
            onClick={borrar}
            disabled={!coincide || borrando || cargando}
          >
            {borrando ? <Loader2 size={13} className="tz-spin" /> : <Trash2 size={13} />} Confirmar y eliminar todo
          </button>
          <button type="button" className="tz-cliente-action-btn" onClick={onCancelar} disabled={borrando}>
            <X size={13} /> Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function FilaNegocio({ negocio, rubro, arrastrable, onToggle, onEliminar }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: negocio.id,
    disabled: !arrastrable,
  });
  const estado = ESTADOS_PLAN[calcularEstadoPlan(negocio)] || ESTADOS_PLAN.activo;
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, "--tz-negocio-color": negocio.color || "var(--cyan)" }}
      className="tz-sa-negocio-fila"
    >
      {arrastrable && (
        <span className="tz-sa-drag-handle" ref={setActivatorNodeRef} {...listeners} {...attributes} aria-label={`Arrastrar ${negocio.nombre}`}>
          <GripVertical size={14} />
        </span>
      )}
      {negocio.logo_url ? (
        <img src={negocio.logo_url} alt="" className="tz-sa-negocio-fila-logo" />
      ) : (
        <span className="tz-sa-negocio-fila-logo tz-sa-negocio-fila-logo-vacio">
          <Store size={16} />
        </span>
      )}
      <div className="tz-sa-negocio-fila-info">
        <strong>{negocio.nombre}</strong>
        <span>
          /{negocio.slug || "sin-slug"} · {rubro?.nombre || "Sin rubro"}
        </span>
      </div>
      <span className="tz-plan-badge" style={{ "--tz-plan-color": estado.color }}>{estado.label}</span>
      <label className="tz-toggle" title={negocio.activo ? "Visible en el directorio" : "Oculto"}>
        <input type="checkbox" checked={negocio.activo} onChange={(e) => onToggle(negocio, e.target.checked)} />
        <span className="tz-toggle-slider" />
      </label>
      <button type="button" className="tz-vis-delete-btn" onClick={() => onEliminar(negocio)} aria-label={`Eliminar ${negocio.nombre}`} title="Eliminar negocio">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export default function GestorNegociosModal({ negocios, setNegocios, rubros, onClose }) {
  const [busqueda, setBusqueda] = useState("");
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [rubroId, setRubroId] = useState(rubros[0]?.id || "");
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState("");
  const [eliminando, setEliminando] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return negocios;
    return negocios.filter((n) => `${n.nombre} ${n.slug || ""}`.toLowerCase().includes(q));
  }, [negocios, busqueda]);

  const crear = async () => {
    const n = nombre.trim();
    const s = slugify(slug || n);
    const r = rubroId || rubros[0]?.id;
    if (!n) return setError("Escribe un nombre.");
    if (!s) return setError("Escribe un slug (la dirección de login, ej. tonazo).");
    if (!r) return setError("Crea primero un rubro.");
    setCreando(true);
    setError("");
    const orden = negocios.length ? Math.max(...negocios.map((x) => x.orden ?? 0)) + 1 : 0;
    const { data, error: err } = await supabase
      .from("negocios")
      .insert({ nombre: n, slug: s, rubro_id: r, orden })
      .select("*, plan_estado")
      .single();
    setCreando(false);
    if (err) return setError(err.code === "23505" ? `Ya existe un negocio con el slug "${s}".` : err.message);
    setNegocios((prev) => [...prev, data]);
    setNombre("");
    setSlug("");
  };

  const alternar = async (negocio, activo) => {
    setNegocios((prev) => prev.map((n) => (n.id === negocio.id ? { ...n, activo } : n)));
    const { error: err } = await supabase.from("negocios").update({ activo }).eq("id", negocio.id);
    if (err) setNegocios((prev) => prev.map((n) => (n.id === negocio.id ? { ...n, activo: !activo } : n)));
  };

  const alSoltar = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const desde = negocios.findIndex((n) => n.id === active.id);
    const hasta = negocios.findIndex((n) => n.id === over.id);
    if (desde === -1 || hasta === -1) return;
    const reordenados = arrayMove(negocios, desde, hasta).map((n, i) => ({ ...n, orden: i }));
    setNegocios(reordenados);
    await Promise.all(reordenados.map((n) => supabase.from("negocios").update({ orden: n.orden }).eq("id", n.id)));
  };

  return (
    <div className="tz-modal-backdrop">
      <Styles />
      <div className="tz-modal tz-modal-wide" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <h2>
          <Building2 size={17} /> Gestor de negocios
        </h2>

        <h3 className="tz-plan-subtitulo">Nuevo negocio</h3>
        <div className="tz-sa-nuevo-negocio">
          <input className="tz-text-input" placeholder="Nombre del negocio" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <input
            className="tz-text-input"
            placeholder={`Slug (ej. ${slugify(nombre) || "mi-negocio"})`}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          <select className="tz-text-input" value={rubroId} onChange={(e) => setRubroId(e.target.value)}>
            {rubros.map((r) => (
              <option key={r.id} value={r.id}>{r.nombre}</option>
            ))}
          </select>
          <button type="button" className="tz-cliente-action-btn tz-cliente-action-pago" onClick={crear} disabled={creando}>
            {creando ? <Loader2 size={13} className="tz-spin" /> : <Plus size={13} />} Crear
          </button>
        </div>
        {error && <p className="tz-error">{error}</p>}

        <h3 className="tz-plan-subtitulo">Negocios ({negocios.length})</h3>
        <div className="tz-sa-buscador">
          <Search size={15} />
          <input className="tz-text-input" placeholder="Buscar por nombre o slug…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <p className="tz-stock-editor-sub" style={{ margin: "6px 0 10px" }}>
          Arrastra para cambiar el orden del directorio{busqueda ? " (borra la búsqueda para poder arrastrar)" : ""}. El
          interruptor muestra u oculta el negocio en el directorio público.
        </p>
        <DndContext sensors={sensors} onDragEnd={alSoltar}>
          <SortableContext items={filtrados.map((n) => n.id)} strategy={verticalListSortingStrategy}>
            <div className="tz-sa-negocios-lista">
              {filtrados.map((n) => (
                <FilaNegocio
                  key={n.id}
                  negocio={n}
                  rubro={rubros.find((r) => r.id === n.rubro_id)}
                  arrastrable={!busqueda.trim()}
                  onToggle={alternar}
                  onEliminar={setEliminando}
                />
              ))}
              {filtrados.length === 0 && <p className="tz-stock-editor-sub">Ningún negocio coincide.</p>}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {eliminando && (
        <EliminarNegocio
          negocio={eliminando}
          onCancelar={() => setEliminando(null)}
          onEliminado={(id) => {
            setNegocios((prev) => prev.filter((n) => n.id !== id));
            setEliminando(null);
          }}
        />
      )}
    </div>
  );
}
