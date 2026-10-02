import { useEffect, useMemo, useState } from "react";
import { X, Loader2, Check, Plus, Layers, Trash2 } from "lucide-react";
import { supabase } from "../supabaseClient";
import Styles from "../components/Styles";
import { formatSoles } from "../utils/format";
import { precioPlan, duracionPlan, grupoDuracion } from "../lib/planes";

// Gestor de planes de suscripción (super admin, Fase 4). Cada plan:
// nombre, precio MENSUAL, cuántos meses cubre, % de descuento y límite
// de sucursales activas (vacío = sin límite). Precio total = mensual ×
// meses − descuento. Pestañas Mensual / Anual / Otros según los meses.
// El límite lo hace cumplir la base (triggers de sucursales y
// localidades, migraciones 0087/0088): nunca borra sucursales
// existentes, solo impide crear/reactivar de más.
const PESTANAS = [
  { id: "mensual", label: "Mensual", meses: 1 },
  { id: "anual", label: "Anual", meses: 12 },
  { id: "otros", label: "Otros", meses: 3 },
];

function FilaPlan({ plan, planes, usoPorPlan, onGuardado, onEliminado }) {
  const [nombre, setNombre] = useState(plan.nombre);
  const [precio, setPrecio] = useState(String(plan.precio_mensual ?? 0));
  const [meses, setMeses] = useState(String(plan.meses ?? 1));
  const [descuento, setDescuento] = useState(String(plan.descuento_pct ?? 0));
  const [maxSuc, setMaxSuc] = useState(plan.max_sucursales == null ? "" : String(plan.max_sucursales));
  const [activo, setActivo] = useState(plan.activo !== false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [reemplazo, setReemplazo] = useState("");
  const [eliminando, setEliminando] = useState(false);

  const enUso = usoPorPlan[plan.id] || 0;
  const otrosPlanes = planes.filter((p) => p.id !== plan.id);

  const cambiado =
    nombre !== plan.nombre ||
    precio !== String(plan.precio_mensual ?? 0) ||
    meses !== String(plan.meses ?? 1) ||
    descuento !== String(plan.descuento_pct ?? 0) ||
    maxSuc !== (plan.max_sucursales == null ? "" : String(plan.max_sucursales)) ||
    activo !== (plan.activo !== false);

  const vistaPrevia = precioPlan({
    precio_mensual: Number(precio.replace(",", ".")) || 0,
    meses: Number(meses) || 1,
    descuento_pct: Number(descuento.replace(",", ".")) || 0,
  });

  const guardar = async () => {
    setError("");
    setOk(false);
    const n = nombre.trim();
    const p = Number(precio.replace(",", "."));
    const me = Number(meses);
    const d = Number(descuento.replace(",", "."));
    const m = maxSuc.trim() === "" ? null : Number(maxSuc);
    if (!n) return setError("Escribe un nombre.");
    if (!Number.isFinite(p) || p < 0) return setError("Precio inválido.");
    if (!Number.isInteger(me) || me < 1 || me > 36) return setError("Los meses van de 1 a 36.");
    if (!Number.isFinite(d) || d < 0 || d >= 100) return setError("El descuento va de 0 a 99 %.");
    if (m !== null && (!Number.isInteger(m) || m < 1)) return setError("El límite debe ser 1 o más (vacío = sin límite).");
    setSaving(true);
    const { data, error: err } = await supabase
      .from("planes")
      .update({ nombre: n, precio_mensual: p, meses: me, descuento_pct: d, max_sucursales: m, activo })
      .eq("id", plan.id)
      .select()
      .single();
    setSaving(false);
    if (err) return setError(err.code === "23505" ? "Ya existe un plan con ese nombre." : err.message);
    setOk(true);
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

  return (
    <div className="tz-plan-fila">
      <input className="tz-text-input" value={nombre} onChange={(e) => { setOk(false); setNombre(e.target.value); }} aria-label="Nombre del plan" />
      <label className="tz-plan-campo">
        <span>S/ al mes</span>
        <input className="tz-text-input" inputMode="decimal" value={precio} onChange={(e) => { setOk(false); setPrecio(e.target.value); }} />
      </label>
      <label className="tz-plan-campo">
        <span>Meses</span>
        <input className="tz-text-input" inputMode="numeric" value={meses} onChange={(e) => { setOk(false); setMeses(e.target.value); }} />
      </label>
      <label className="tz-plan-campo">
        <span>Descuento %</span>
        <input className="tz-text-input" inputMode="decimal" value={descuento} onChange={(e) => { setOk(false); setDescuento(e.target.value); }} />
      </label>
      <label className="tz-plan-campo">
        <span>Sucursales</span>
        <input className="tz-text-input" inputMode="numeric" placeholder="Sin límite" value={maxSuc} onChange={(e) => { setOk(false); setMaxSuc(e.target.value); }} />
      </label>
      <p className="tz-plan-total">
        Total {duracionPlan(Number(meses) || 1).toLowerCase()}: <strong>{formatSoles(vistaPrevia)}</strong>
        {Number(descuento) > 0 && <span className="tz-plan-total-desc"> (−{Number(descuento)}%)</span>}
        {enUso > 0 && <span className="tz-plan-total-uso"> · {enUso} negocio{enUso === 1 ? "" : "s"}</span>}
      </p>
      <label className="tz-toggle" title={activo ? "Disponible" : "Oculto"}>
        <input type="checkbox" checked={activo} onChange={(e) => { setOk(false); setActivo(e.target.checked); }} />
        <span className="tz-toggle-slider" />
        <span className="tz-sa-negocio-toggle-label">{activo ? "Disponible" : "Oculto"}</span>
      </label>
      <div className="tz-plan-fila-acciones">
        <button type="button" className="tz-cliente-action-btn tz-cliente-action-pago" onClick={guardar} disabled={!cambiado || saving}>
          {saving ? <Loader2 size={13} className="tz-spin" /> : <Check size={13} />} {ok ? "Guardado" : "Guardar"}
        </button>
        <button
          type="button"
          className="tz-cliente-action-btn tz-cliente-action-deuda"
          onClick={() => { setError(""); setConfirmando((v) => !v); }}
          aria-label={`Eliminar plan ${plan.nombre}`}
        >
          <Trash2 size={13} /> Eliminar
        </button>
      </div>
      {confirmando && (
        <div className="tz-vis-confirm-delete tz-plan-fila-confirmar">
          <p>
            ¿Eliminar <strong>{plan.nombre}</strong>?
            {enUso > 0 ? ` Lo usan ${enUso} negocio${enUso === 1 ? "" : "s"}: elige a qué plan pasarlos.` : ""}
          </p>
          {enUso > 0 && (
            <select className="tz-text-input" value={reemplazo} onChange={(e) => setReemplazo(e.target.value)}>
              <option value="">Pasar sus negocios a…</option>
              {otrosPlanes.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre} ({duracionPlan(p.meses)})</option>
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
      {error && <p className="tz-error tz-plan-fila-error">{error}</p>}
    </div>
  );
}

export default function PlanesModal({ negocios = [], onClose, onCambio }) {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creando, setCreando] = useState(false);
  const [pestana, setPestana] = useState("mensual");

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

  const nuevoPlan = async () => {
    setCreando(true);
    setError("");
    const def = PESTANAS.find((p) => p.id === pestana);
    const orden = planes.length ? Math.max(...planes.map((p) => p.orden ?? 0)) + 1 : 0;
    const { data, error: err } = await supabase
      .from("planes")
      .insert({
        nombre: `Plan ${def.label} ${planes.filter((p) => grupoDuracion(p.meses) === pestana).length + 1}`,
        precio_mensual: 0,
        meses: def.meses,
        descuento_pct: 0,
        max_sucursales: 1,
        orden,
      })
      .select()
      .single();
    setCreando(false);
    if (err) return setError(err.code === "23505" ? "Ya existe un plan con ese nombre; renombra el anterior." : err.message);
    cambiar((prev) => [...prev, data]);
  };

  const visibles = planes.filter((p) => grupoDuracion(p.meses) === pestana);

  return (
    <div className="tz-modal-backdrop">
      <Styles />
      <div className="tz-modal tz-modal-wide" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <h2>
          <Layers size={17} /> Planes
        </h2>
        <p className="tz-brand-sub" style={{ marginBottom: 12 }}>
          Total = precio mensual × meses − descuento. Límite de sucursales activas (vacío = sin límite); cambiarlo nunca
          borra sucursales, solo impide crear más.
        </p>

        <div className="tz-plan-filtros">
          {PESTANAS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`tz-gasto-tipo-btn ${pestana === p.id ? "tz-gasto-tipo-active" : ""}`}
              onClick={() => setPestana(p.id)}
            >
              {p.label} ({planes.filter((pl) => grupoDuracion(pl.meses) === p.id).length})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="tz-loading">
            <Loader2 className="tz-spin" size={24} />
          </div>
        ) : (
          <>
            {visibles.length === 0 && <p className="tz-stock-editor-sub">Todavía no hay planes en esta pestaña.</p>}
            {visibles.map((p) => (
              <FilaPlan
                key={`${p.id}-${p.meses}`}
                plan={p}
                planes={planes}
                usoPorPlan={usoPorPlan}
                onGuardado={(plan) => cambiar((prev) => prev.map((x) => (x.id === plan.id ? plan : x)))}
                onEliminado={(id) => cambiar((prev) => prev.filter((x) => x.id !== id))}
              />
            ))}
            {error && <p className="tz-error">{error}</p>}
            <button type="button" className="tz-sa-add-btn" style={{ marginTop: 10 }} onClick={nuevoPlan} disabled={creando}>
              {creando ? <Loader2 size={14} className="tz-spin" /> : <Plus size={14} />} Nuevo plan{" "}
              {PESTANAS.find((p) => p.id === pestana).label.toLowerCase()}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
