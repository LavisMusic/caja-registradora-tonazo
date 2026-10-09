import { useState } from "react";
import { X, Loader2, Check, XCircle, Inbox, Store } from "lucide-react";
import { supabase } from "../supabaseClient";
import Styles from "../components/Styles";
import { formatSoles } from "../utils/format";
import { duracionPlan, formatFechaCorta } from "../lib/planes";

// Centro de Peticiones del super admin (Fase 4, bloque B): pagos de plan
// que mandan los negocios con su comprobante. Aprobar → RPC
// aprobar_peticion_plan (extiende el vencimiento y pasa el negocio al
// plan pedido). Rechazar → motivo obligatorio, que el negocio ve en su
// modal "Renovar plan". Todo se actualiza en tiempo real (la lista viene
// de usePeticionesPlanSuperAdmin, montado en SuperAdminPanel).
function TarjetaPeticion({ peticion }) {
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [verGrande, setVerGrande] = useState(false);
  const n = peticion.negocio || {};
  const pendiente = peticion.estado === "pendiente";

  const aprobar = async () => {
    setError("");
    setBusy("aprobar");
    const { error: err } = await supabase.rpc("aprobar_peticion_plan", { p_peticion_id: peticion.id });
    setBusy("");
    if (err) setError(err.message);
  };

  const rechazar = async () => {
    setError("");
    if (!motivo.trim()) return setError("Escribe el motivo del rechazo.");
    setBusy("rechazar");
    const { error: err } = await supabase.rpc("rechazar_peticion_plan", { p_peticion_id: peticion.id, p_motivo: motivo.trim() });
    setBusy("");
    if (err) return setError(err.message);
    setRechazando(false);
  };

  return (
    <div className={`tz-peticion-plan tz-peticion-plan-${peticion.estado}`} style={{ "--tz-negocio-color": n.color || "var(--cyan)" }}>
      <div className="tz-peticion-plan-cabecera">
        {n.logo_url ? (
          <img src={n.logo_url} alt={n.nombre} className="tz-peticion-plan-logo" />
        ) : (
          <span className="tz-peticion-plan-logo tz-peticion-plan-logo-vacio">
            <Store size={18} />
          </span>
        )}
        <div className="tz-peticion-plan-info">
          <strong>{n.nombre || "Negocio"}</strong>
          <span>
            {peticion.plan_nombre || "Plan"} · {duracionPlan(peticion.meses)} · <b>{formatSoles(peticion.monto)}</b> por {peticion.metodo}
          </span>
          <span className="tz-peticion-plan-fecha">
            Enviado el {formatFechaCorta(peticion.created_at)}
            {!pendiente && peticion.resuelto_at ? ` · ${peticion.estado} el ${formatFechaCorta(peticion.resuelto_at)}` : ""}
          </span>
        </div>
        {!pendiente && (
          <span className={`tz-peticion-plan-estado tz-peticion-plan-estado-${peticion.estado}`}>
            {peticion.estado === "aprobado" ? "Aprobado" : "Rechazado"}
          </span>
        )}
      </div>

      {peticion.comprobante_url && (
        <button type="button" className="tz-peticion-plan-comprobante" onClick={() => setVerGrande(true)}>
          <img src={peticion.comprobante_url} alt="Comprobante" />
        </button>
      )}
      {peticion.estado === "rechazado" && peticion.motivo_rechazo && (
        <p className="tz-stock-editor-sub">Motivo: {peticion.motivo_rechazo}</p>
      )}

      {pendiente && (
        <>
          {rechazando ? (
            <div className="tz-peticion-plan-rechazo">
              <input
                className="tz-text-input"
                placeholder="Motivo (ej. el monto no coincide)"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                autoFocus
              />
              <div className="tz-vis-confirm-actions">
                <button type="button" className="tz-cliente-action-btn tz-cliente-action-deuda" onClick={rechazar} disabled={!!busy}>
                  {busy === "rechazar" ? <Loader2 size={13} className="tz-spin" /> : <XCircle size={13} />} Rechazar
                </button>
                <button type="button" className="tz-cliente-action-btn" onClick={() => setRechazando(false)} disabled={!!busy}>
                  <X size={13} /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="tz-vis-confirm-actions">
              <button type="button" className="tz-cliente-action-btn tz-cliente-action-pago" onClick={aprobar} disabled={!!busy}>
                {busy === "aprobar" ? <Loader2 size={13} className="tz-spin" /> : <Check size={13} />} Aprobar
              </button>
              <button type="button" className="tz-cliente-action-btn tz-cliente-action-deuda" onClick={() => setRechazando(true)} disabled={!!busy}>
                <XCircle size={13} /> Rechazar
              </button>
            </div>
          )}
        </>
      )}
      {error && <p className="tz-error">{error}</p>}

      {verGrande && (
        <div className="tz-modal-backdrop" style={{ zIndex: 120 }}>
          <div className="tz-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="tz-modal-close" onClick={() => setVerGrande(false)} aria-label="Cerrar">
              <X size={18} />
            </button>
            <h2>Comprobante · {n.nombre}</h2>
            <img src={peticion.comprobante_url} alt="Comprobante" style={{ width: "100%", borderRadius: 12 }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function PeticionesPlanModal({ peticiones, loading, onClose }) {
  const [pestana, setPestana] = useState("pendientes");
  const pendientes = peticiones.filter((p) => p.estado === "pendiente");
  const resueltas = peticiones.filter((p) => p.estado !== "pendiente");
  const lista = pestana === "pendientes" ? pendientes : resueltas;

  return (
    <div className="tz-modal-backdrop">
      <Styles />
      <div className="tz-modal tz-modal-wide" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <h2>
          <Inbox size={17} /> Centro de Peticiones
        </h2>
        <p className="tz-brand-sub" style={{ marginBottom: 12 }}>
          Pagos de plan enviados por los negocios. Revisa el comprobante antes de aprobar.
        </p>
        <div className="tz-plan-filtros">
          <button
            type="button"
            className={`tz-gasto-tipo-btn ${pestana === "pendientes" ? "tz-gasto-tipo-active" : ""}`}
            onClick={() => setPestana("pendientes")}
          >
            Pendientes ({pendientes.length})
          </button>
          <button
            type="button"
            className={`tz-gasto-tipo-btn ${pestana === "resueltas" ? "tz-gasto-tipo-active" : ""}`}
            onClick={() => setPestana("resueltas")}
          >
            Resueltas ({resueltas.length})
          </button>
        </div>
        {loading ? (
          <div className="tz-loading">
            <Loader2 className="tz-spin" size={24} />
          </div>
        ) : lista.length === 0 ? (
          <p className="tz-stock-editor-sub">
            {pestana === "pendientes" ? "No hay pagos esperando revisión." : "Todavía no hay pagos resueltos."}
          </p>
        ) : (
          <div className="tz-peticiones-plan-lista">
            {lista.map((p) => (
              <TarjetaPeticion key={p.id} peticion={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
