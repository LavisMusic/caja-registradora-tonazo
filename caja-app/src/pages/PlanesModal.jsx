import { useEffect, useState } from "react";
import { X, Loader2, Check, Plus, Layers } from "lucide-react";
import { supabase } from "../supabaseClient";
import Styles from "../components/Styles";

// Gestor de planes de suscripción (super admin, Fase 4). Cada plan:
// nombre, precio mensual y límite de sucursales activas (vacío = sin
// límite). El límite lo hace cumplir la base (trigger de sucursales,
// migración 0087) — nunca borra sucursales existentes, solo impide
// crear/reactivar de más.
function FilaPlan({ plan, onGuardado }) {
  const [nombre, setNombre] = useState(plan.nombre);
  const [precio, setPrecio] = useState(String(plan.precio_mensual ?? 0));
  const [maxSuc, setMaxSuc] = useState(plan.max_sucursales == null ? "" : String(plan.max_sucursales));
  const [activo, setActivo] = useState(plan.activo !== false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  const cambiado =
    nombre !== plan.nombre ||
    precio !== String(plan.precio_mensual ?? 0) ||
    maxSuc !== (plan.max_sucursales == null ? "" : String(plan.max_sucursales)) ||
    activo !== (plan.activo !== false);

  const guardar = async () => {
    setError("");
    setOk(false);
    const n = nombre.trim();
    const p = Number(precio.replace(",", "."));
    const m = maxSuc.trim() === "" ? null : Number(maxSuc);
    if (!n) return setError("Escribe un nombre.");
    if (!Number.isFinite(p) || p < 0) return setError("Precio inválido.");
    if (m !== null && (!Number.isInteger(m) || m < 1)) return setError("El límite debe ser 1 o más (vacío = sin límite).");
    setSaving(true);
    const { data, error: err } = await supabase
      .from("planes")
      .update({ nombre: n, precio_mensual: p, max_sucursales: m, activo })
      .eq("id", plan.id)
      .select()
      .single();
    setSaving(false);
    if (err) return setError(err.code === "23505" ? "Ya existe un plan con ese nombre." : err.message);
    setOk(true);
    onGuardado(data);
  };

  return (
    <div className="tz-plan-fila">
      <input className="tz-text-input" value={nombre} onChange={(e) => { setOk(false); setNombre(e.target.value); }} aria-label="Nombre del plan" />
      <label className="tz-plan-campo">
        <span>S/ al mes</span>
        <input className="tz-text-input" inputMode="decimal" value={precio} onChange={(e) => { setOk(false); setPrecio(e.target.value); }} />
      </label>
      <label className="tz-plan-campo">
        <span>Sucursales</span>
        <input className="tz-text-input" inputMode="numeric" placeholder="Sin límite" value={maxSuc} onChange={(e) => { setOk(false); setMaxSuc(e.target.value); }} />
      </label>
      <label className="tz-toggle" title={activo ? "Disponible" : "Oculto"}>
        <input type="checkbox" checked={activo} onChange={(e) => { setOk(false); setActivo(e.target.checked); }} />
        <span className="tz-toggle-slider" />
        <span className="tz-sa-negocio-toggle-label">{activo ? "Disponible" : "Oculto"}</span>
      </label>
      <button type="button" className="tz-cliente-action-btn tz-cliente-action-pago" onClick={guardar} disabled={!cambiado || saving}>
        {saving ? <Loader2 size={13} className="tz-spin" /> : <Check size={13} />} {ok ? "Guardado" : "Guardar"}
      </button>
      {error && <p className="tz-error tz-plan-fila-error">{error}</p>}
    </div>
  );
}

export default function PlanesModal({ onClose, onCambio }) {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creando, setCreando] = useState(false);

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

  const actualizar = (plan) => {
    setPlanes((prev) => {
      const next = prev.map((p) => (p.id === plan.id ? plan : p));
      onCambio?.(next);
      return next;
    });
  };

  const nuevoPlan = async () => {
    setCreando(true);
    setError("");
    const orden = planes.length ? Math.max(...planes.map((p) => p.orden ?? 0)) + 1 : 0;
    const { data, error: err } = await supabase
      .from("planes")
      .insert({ nombre: `Plan ${planes.length + 1}`, precio_mensual: 0, max_sucursales: 1, orden })
      .select()
      .single();
    setCreando(false);
    if (err) return setError(err.code === "23505" ? "Ya existe un plan con ese nombre; renombra el anterior." : err.message);
    setPlanes((prev) => {
      const next = [...prev, data];
      onCambio?.(next);
      return next;
    });
  };

  return (
    <div className="tz-modal-backdrop" onClick={onClose}>
      <Styles />
      <div className="tz-modal tz-modal-wide" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <h2>
          <Layers size={17} /> Planes
        </h2>
        <p className="tz-brand-sub" style={{ marginBottom: 14 }}>
          Límite de sucursales activas por plan (vacío = sin límite). Cambiar un límite nunca borra sucursales: solo impide crear más.
        </p>

        {loading ? (
          <div className="tz-loading">
            <Loader2 className="tz-spin" size={24} />
          </div>
        ) : (
          <>
            {planes.map((p) => (
              <FilaPlan key={p.id} plan={p} onGuardado={actualizar} />
            ))}
            {error && <p className="tz-error">{error}</p>}
            <button type="button" className="tz-sa-add-btn" style={{ marginTop: 10 }} onClick={nuevoPlan} disabled={creando}>
              {creando ? <Loader2 size={14} className="tz-spin" /> : <Plus size={14} />} Nuevo plan
            </button>
          </>
        )}
      </div>
    </div>
  );
}
