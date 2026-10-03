import { useEffect, useMemo, useState } from "react";
import { X, Loader2, Plus, Layers, Trash2, Pencil, Save } from "lucide-react";
import { supabase } from "../supabaseClient";
import Styles from "../components/Styles";
import ListaArrastrable from "../components/ListaArrastrable";
import { formatSoles } from "../utils/format";
import { precioPlan, duracionPlan, grupoDuracion } from "../lib/planes";

// Gestor de planes de suscripción (super admin, Fase 4) — mismo diseño
// que "Configurar Membresías" de Taxi-PE: pestañas Mensual / Anual /
// Otros, "Añadir plan" abre el formulario, y la lista se reordena
// arrastrando del ícono ⠿ (ese orden es el que ven los negocios al
// renovar). Cada plan: nombre, precio MENSUAL, meses que cubre, % de
// descuento, límite de sucursales activas (vacío = sin límite) y si está
// disponible u oculto. Total = mensual × meses − descuento.
// El límite lo hace cumplir la base (triggers de sucursales y
// localidades, migraciones 0087/0088): nunca borra sucursales
// existentes, solo impide crear/reactivar de más.
const PESTANAS = [
  { id: "mensual", label: "Mensual", meses: 1 },
  { id: "anual", label: "Anual", meses: 12 },
  { id: "otros", label: "Otros", meses: 3 },
];

function PlanForm({ initial, onGuardar, onCancelar, saving }) {
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [precio, setPrecio] = useState(initial?.precio_mensual != null ? String(initial.precio_mensual) : "");
  const [meses, setMeses] = useState(String(initial?.meses ?? 1));
  const [descuento, setDescuento] = useState(String(initial?.descuento_pct ?? 0));
  const [maxSuc, setMaxSuc] = useState(initial?.max_sucursales == null ? "" : String(initial.max_sucursales));
  const [activo, setActivo] = useState(initial?.activo !== false);
  const [error, setError] = useState("");

  const total = precioPlan({
    precio_mensual: Number(String(precio).replace(",", ".")) || 0,
    meses: Number(meses) || 1,
    descuento_pct: Number(String(descuento).replace(",", ".")) || 0,
  });

  const guardar = () => {
    const n = nombre.trim();
    const p = Number(String(precio).replace(",", "."));
    const me = Number(meses);
    const d = Number(String(descuento).replace(",", "."));
    const m = maxSuc.trim() === "" ? null : Number(maxSuc);
    if (!n) return setError("Ingresa un nombre.");
    if (!Number.isFinite(p) || p < 0 || precio === "") return setError("Ingresa un precio mensual válido.");
    if (!Number.isInteger(me) || me < 1 || me > 36) return setError("Los meses van de 1 a 36.");
    if (!Number.isFinite(d) || d < 0 || d >= 100) return setError("El descuento va de 0 a 99 %.");
    if (m !== null && (!Number.isInteger(m) || m < 1)) return setError("El límite debe ser 1 o más (vacío = sin límite).");
    setError("");
    onGuardar({ nombre: n, precio_mensual: p, meses: me, descuento_pct: d, max_sucursales: m, activo });
  };

  return (
    <div className="tz-add-entry">
      <label className="tz-field-label">Nombre</label>
      <input className="tz-text-input" placeholder="Ej. Plan Básico" value={nombre} onChange={(e) => setNombre(e.target.value)} />

      <div className="tz-gasto-row-2col">
        <div>
          <label className="tz-field-label">Precio mensual (S/)</label>
          <input className="tz-text-input" inputMode="decimal" placeholder="0.00" value={precio} onChange={(e) => setPrecio(e.target.value)} />
        </div>
        <div>
          <label className="tz-field-label">Meses que cubre</label>
          <input className="tz-text-input" inputMode="numeric" value={meses} onChange={(e) => setMeses(e.target.value)} />
        </div>
      </div>
      <div className="tz-gasto-row-2col">
        <div>
          <label className="tz-field-label">Descuento (%)</label>
          <input className="tz-text-input" inputMode="decimal" value={descuento} onChange={(e) => setDescuento(e.target.value)} />
        </div>
        <div>
          <label className="tz-field-label">Sucursales activas</label>
          <input
            className="tz-text-input"
            inputMode="numeric"
            placeholder="Sin límite"
            value={maxSuc}
            onChange={(e) => setMaxSuc(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
        <label className="tz-toggle">
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} aria-label="Disponible" />
          <span className="tz-toggle-slider" />
        </label>
        <span className="tz-sa-negocio-toggle-label" style={{ fontSize: 13 }}>
          {activo ? "Disponible para los negocios" : "Oculto (no aparece al renovar)"}
        </span>
      </div>

      <p className="tz-plan-total">
        Total {duracionPlan(Number(meses) || 1).toLowerCase()}: <strong>{formatSoles(total)}</strong>
        {Number(descuento) > 0 && <span className="tz-plan-total-desc"> (−{Number(descuento)}%)</span>}
      </p>

      {error && <p className="tz-error">{error}</p>}
      <div className="tz-add-entry-actions">
        <button className="tz-camera-cancel" onClick={onCancelar} disabled={saving}>
          Cancelar
        </button>
        <button className="tz-pw-submit tz-payment-save" onClick={guardar} disabled={saving}>
          {saving ? <Loader2 size={16} className="tz-spin" /> : <Save size={16} />}
          Guardar
        </button>
      </div>
    </div>
  );
}

function PlanRow({ plan, planes, enUso, onGuardado, onEliminado }) {
  const [editando, setEditando] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [reemplazo, setReemplazo] = useState("");
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState("");
  const otrosPlanes = planes.filter((p) => p.id !== plan.id);

  const guardar = async (patch) => {
    setSaving(true);
    const { data, error: err } = await supabase.from("planes").update(patch).eq("id", plan.id).select().single();
    setSaving(false);
    if (err) return setError(err.code === "23505" ? "Ya existe un plan con ese nombre." : err.message || "No se pudo guardar.");
    setError("");
    setEditando(false);
    onGuardado(data);
  };

  const eliminar = async () => {
    setError("");
    if (enUso > 0 && !reemplazo) return setError("Elige a qué plan pasar sus negocios.");
    setEliminando(true);
    const { error: err } = await supabase.rpc("eliminar_plan", { p_plan_id: plan.id, p_reemplazo: reemplazo || null });
    setEliminando(false);
    if (err) return setError(err.message);
    onEliminado(plan.id);
  };

  if (editando) {
    return (
      <div className="tz-history-row-detail" style={{ padding: 12 }}>
        {error && <p className="tz-error">{error}</p>}
        <PlanForm initial={plan} onGuardar={guardar} onCancelar={() => setEditando(false)} saving={saving} />
      </div>
    );
  }

  return (
    <div className="tz-history-row-detail" style={{ padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ minWidth: 0 }}>
          <strong style={{ color: "var(--text)" }}>{plan.nombre}</strong>
          {plan.activo === false && <span className="tz-tag tz-tag-warn" style={{ marginLeft: 8 }}>Oculto</span>}
          <span style={{ display: "block", marginTop: 2 }}>
            {formatSoles(precioPlan(plan))} · {duracionPlan(plan.meses)}
            {Number(plan.descuento_pct) > 0 ? ` · −${Number(plan.descuento_pct)}%` : ""} ·{" "}
            {plan.max_sucursales == null ? "sucursales sin límite" : `hasta ${plan.max_sucursales} sucursal(es)`}
            {enUso > 0 ? ` · ${enUso} negocio${enUso === 1 ? "" : "s"}` : ""}
          </span>
        </span>
        <span style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button type="button" className="tz-vis-edit-btn" onClick={() => setEditando(true)} aria-label="Editar plan" title="Editar">
            <Pencil size={14} />
          </button>
          <button
            type="button"
            className="tz-vis-reject-btn"
            onClick={() => {
              setError("");
              setConfirmando((v) => !v);
            }}
            aria-label="Eliminar plan"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </span>
      </div>
      {confirmando && (
        <div className="tz-vis-confirm-delete" style={{ marginTop: 8 }}>
          <p>
            ¿Eliminar <strong>{plan.nombre}</strong>?
            {enUso > 0 ? ` Lo usan ${enUso} negocio${enUso === 1 ? "" : "s"}: elige a qué plan pasarlos.` : ""}
          </p>
          {enUso > 0 && (
            <select className="tz-text-input" value={reemplazo} onChange={(e) => setReemplazo(e.target.value)}>
              <option value="">Pasar sus negocios a…</option>
              {otrosPlanes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({duracionPlan(p.meses)})
                </option>
              ))}
            </select>
          )}
          <div className="tz-vis-confirm-actions">
            <button type="button" className="tz-cliente-action-btn tz-cliente-action-deuda" onClick={eliminar} disabled={eliminando}>
              {eliminando ? <Loader2 size={13} className="tz-spin" /> : <Trash2 size={13} />} Sí, eliminar
            </button>
            <button type="button" className="tz-cliente-action-btn" onClick={() => setConfirmando(false)} disabled={eliminando}>
              <X size={13} /> Cancelar
            </button>
          </div>
        </div>
      )}
      {error && !editando && <p className="tz-error">{error}</p>}
    </div>
  );
}

export default function PlanesModal({ negocios = [], onClose, onCambio }) {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pestana, setPestana] = useState("mensual");
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [okMsg, setOkMsg] = useState("");

  useEffect(() => {
    let activo = true;
    supabase
      .from("planes")
      .select("*")
      .order("orden", { ascending: true })
      .then(({ data, error: err }) => {
        if (!activo) return;
        if (err) setError("No se pudieron cargar los planes.");
        setPlanes(data || []);
        setLoading(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const usoPorPlan = useMemo(() => {
    const m = {};
    negocios.forEach((n) => {
      if (n.plan_id) m[n.plan_id] = (m[n.plan_id] || 0) + 1;
    });
    return m;
  }, [negocios]);

  const cambiar = (fn) => {
    setPlanes((prev) => {
      const next = fn(prev);
      onCambio?.(next);
      return next;
    });
  };

  const visibles = planes
    .filter((p) => grupoDuracion(p.meses) === pestana)
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

  const crear = async (patch) => {
    setSaving(true);
    setError("");
    const orden = visibles.reduce((max, p) => Math.max(max, Number(p.orden) || 0), -1) + 1;
    const { data, error: err } = await supabase.from("planes").insert({ ...patch, orden }).select().single();
    setSaving(false);
    if (err) return setError(err.code === "23505" ? "Ya existe un plan con ese nombre." : err.message || "No se pudo crear el plan.");
    cambiar((prev) => [...prev, data]);
    setAddOpen(false);
    setOkMsg("Plan guardado — ya aparece para los negocios al renovar.");
    setTimeout(() => setOkMsg(""), 4000);
    // Si los meses no corresponden a esta pestaña, mostrar la suya.
    setPestana(grupoDuracion(data.meses));
  };

  // Orden (arrastrar): se guarda como orden 0..n dentro de la pestaña.
  const reordenar = async (nuevos) => {
    const ordenPorId = Object.fromEntries(nuevos.map((p, i) => [p.id, i]));
    cambiar((prev) => prev.map((p) => (p.id in ordenPorId ? { ...p, orden: ordenPorId[p.id] } : p)));
    const resultados = await Promise.all(
      nuevos.map((p, i) => supabase.from("planes").update({ orden: i }).eq("id", p.id))
    );
    if (resultados.some((r) => r.error)) setError("No se pudo guardar el nuevo orden.");
  };

  const def = PESTANAS.find((p) => p.id === pestana);

  return (
    <div className="tz-modal-backdrop">
      <Styles />
      <div className="tz-modal tz-modal-wide" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <div className="tz-payment-modal">
          <h2>
            <Layers size={17} /> Configurar Planes
          </h2>
          <p className="tz-stock-editor-sub">
            Cada plan que armes acá aparece como opción al renovar y en la Recarga rápida. Total = precio mensual × meses −
            descuento. Arrastra del ícono ⠿ para cambiar el orden en que aparecen.
          </p>

          {okMsg && <p className="tz-success">{okMsg}</p>}

          <div className="tz-gasto-tipo-buttons" style={{ marginBottom: 10 }}>
            {PESTANAS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`tz-gasto-tipo-btn ${pestana === p.id ? "tz-gasto-tipo-active" : ""}`}
                onClick={() => {
                  setPestana(p.id);
                  setAddOpen(false);
                  setError("");
                }}
              >
                {p.label} ({planes.filter((pl) => grupoDuracion(pl.meses) === p.id).length})
              </button>
            ))}
          </div>

          {!addOpen ? (
            <button className="tz-scan-btn tz-add-entry-toggle" onClick={() => setAddOpen(true)}>
              <Plus size={16} /> Añadir plan {def.label.toLowerCase()}
            </button>
          ) : (
            <PlanForm
              key={pestana}
              initial={{ meses: def.meses, max_sucursales: 1 }}
              onGuardar={crear}
              onCancelar={() => {
                setAddOpen(false);
                setError("");
              }}
              saving={saving}
            />
          )}
          {error && <p className="tz-error">{error}</p>}

          {loading ? (
            <div className="tz-loading" style={{ minHeight: 100 }}>
              <Loader2 className="tz-spin" size={22} />
            </div>
          ) : (
            <ListaArrastrable
              key={pestana}
              items={visibles}
              onReordenar={reordenar}
              vacio={<p className="tz-method-history-empty">No hay planes en esta pestaña todavía.</p>}
              renderItem={(p) => (
                <PlanRow
                  plan={p}
                  planes={planes}
                  enUso={usoPorPlan[p.id] || 0}
                  onGuardado={(plan) => cambiar((prev) => prev.map((x) => (x.id === plan.id ? plan : x)))}
                  onEliminado={(id) => cambiar((prev) => prev.filter((x) => x.id !== id))}
                />
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
}
