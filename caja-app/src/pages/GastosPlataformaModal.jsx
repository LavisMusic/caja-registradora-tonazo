import { useEffect, useMemo, useState } from "react";
import { X, Loader2, Plus, Trash2, TrendingDown, Save, Download, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "../supabaseClient";
import Styles from "../components/Styles";
import { formatSoles } from "../utils/format";
import { formatFechaCorta } from "../lib/planes";
import { descargarXLSX } from "../lib/excel";

// Gestor de gastos del super admin (pie de página): los gastos se cargan
// a mano — no hay un costo operativo fijo predefinido. Entran en el
// Cierre de caja (cobrado − gastos = balance). Mismo diseño que el
// gestor de Gastos de las cajas: medidores, "Registrar gasto" y el
// historial en filas desplegables con su Excel.
const CATEGORIAS = ["Servidores", "Publicidad", "Personal", "Transporte", "Servicios", "Otros"];

const formatHora = (iso) => new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });

export default function GastosPlataformaModal({ onClose }) {
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formAbierto, setFormAbierto] = useState(false);
  const [abiertoId, setAbiertoId] = useState(null);
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [guardando, setGuardando] = useState(false);
  const [borrandoId, setBorrandoId] = useState(null);
  const [error, setError] = useState("");

  const cargar = async () => {
    const desde = new Date();
    desde.setMonth(desde.getMonth() - 3);
    const { data } = await supabase
      .from("gastos_plataforma")
      .select("*")
      .gte("fecha", desde.toISOString())
      .order("fecha", { ascending: false });
    setGastos(data || []);
    setLoading(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  const inicioHoy = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const inicioMes = new Date(inicioHoy.getFullYear(), inicioHoy.getMonth(), 1);
  const totalHoy = gastos.filter((g) => new Date(g.fecha) >= inicioHoy).reduce((s, g) => s + Number(g.monto || 0), 0);
  const totalMes = gastos.filter((g) => new Date(g.fecha) >= inicioMes).reduce((s, g) => s + Number(g.monto || 0), 0);

  const cerrarForm = () => {
    setFormAbierto(false);
    setDescripcion("");
    setMonto("");
    setCategoria(CATEGORIAS[0]);
    setError("");
  };

  const agregar = async () => {
    setError("");
    const m = Number(String(monto).replace(",", "."));
    if (!descripcion.trim()) return setError("Escribe en qué se gastó.");
    if (!Number.isFinite(m) || m <= 0) return setError("Monto inválido.");
    setGuardando(true);
    const { error: err } = await supabase.from("gastos_plataforma").insert({ descripcion: descripcion.trim(), monto: m, categoria });
    setGuardando(false);
    if (err) return setError(err.message || "No se pudo guardar.");
    cerrarForm();
    cargar();
  };

  const borrar = async (g) => {
    setBorrandoId(g.id);
    const { error: err } = await supabase.from("gastos_plataforma").delete().eq("id", g.id);
    setBorrandoId(null);
    if (err) return setError(err.message || "No se pudo borrar.");
    setGastos((prev) => prev.filter((x) => x.id !== g.id));
  };

  const exportar = () => {
    const filas = [
      ["Fecha", "Hora", "Categoría", "Descripción", "Monto (S/)"],
      ...gastos.map((g) => [formatFechaCorta(g.fecha), formatHora(g.fecha), g.categoria || "", g.descripcion, Number(g.monto || 0)]),
    ];
    descargarXLSX(`historial-gastos-tonazo-${Date.now()}.xlsx`, [{ nombre: "Gastos", filas }]);
  };

  return (
    <div className="tz-modal-backdrop">
      <Styles />
      <div className="tz-modal tz-modal-wide" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <div className="tz-payment-modal">
          <h2>
            <TrendingDown size={17} /> Gastos
          </h2>

          <div className="tz-method-totals">
            <div className="tz-method-total">
              <span>Hoy</span>
              <strong className="tz-cliente-debe">{formatSoles(totalHoy)}</strong>
            </div>
            <div className="tz-method-total">
              <span>Este mes</span>
              <strong className="tz-cliente-debe">{formatSoles(totalMes)}</strong>
            </div>
            <div className="tz-method-total">
              <span>Registrados</span>
              <strong>{gastos.length}</strong>
            </div>
          </div>

          {!formAbierto ? (
            <button className="tz-scan-btn tz-add-entry-toggle" onClick={() => setFormAbierto(true)}>
              <Plus size={16} /> Registrar gasto
            </button>
          ) : (
            <div className="tz-add-entry tz-gasto-form">
              <label className="tz-field-label">Categoría</label>
              <div className="tz-gasto-tipo-buttons">
                {CATEGORIAS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`tz-gasto-tipo-btn ${categoria === c ? "tz-gasto-tipo-active" : ""}`}
                    onClick={() => setCategoria(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <label className="tz-field-label">Descripción</label>
              <input
                className="tz-text-input"
                placeholder="Ej. Hosting de octubre"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
              <label className="tz-field-label">Monto (S/)</label>
              <input
                className="tz-text-input"
                inputMode="decimal"
                placeholder="0.00"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
              />
              {error && <p className="tz-error">{error}</p>}
              <div className="tz-add-entry-actions">
                <button className="tz-camera-cancel" onClick={cerrarForm}>
                  Cancelar
                </button>
                <button className="tz-pw-submit tz-payment-save" onClick={agregar} disabled={guardando}>
                  {guardando ? <Loader2 size={16} className="tz-spin" /> : <Save size={16} />}
                  Guardar
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <Loader2 size={18} className="tz-spin" />
          ) : gastos.length === 0 ? (
            <p className="tz-method-history-empty">No hay gastos registrados todavía.</p>
          ) : (
            <div className="tz-method-history">
              <span className="tz-method-history-label">Historial de gastos</span>
              <div className="tz-export-buttons">
                <button type="button" className="tz-csv-btn" onClick={exportar}>
                  <Download size={13} /> Historial de Gastos
                </button>
              </div>
              <ul className="tz-history-rows">
                {gastos.map((g) => {
                  const abierto = abiertoId === g.id;
                  return (
                    <li key={g.id} className="tz-history-row">
                      <button className="tz-history-row-head" onClick={() => setAbiertoId(abierto ? null : g.id)}>
                        <span className="tz-history-row-method">
                          {g.categoria || "Gasto"} · {g.descripcion}
                        </span>
                        <span className="tz-history-row-amount tz-cliente-debe">{formatSoles(g.monto)}</span>
                        {abierto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      {abierto && (
                        <div className="tz-history-row-detail">
                          <span>
                            <strong>Fecha:</strong> {formatFechaCorta(g.fecha)} · {formatHora(g.fecha)}
                          </span>
                          <span>
                            <strong>Categoría:</strong> {g.categoria || "—"}
                          </span>
                          <span>
                            <strong>Descripción:</strong> {g.descripcion}
                          </span>
                          <button
                            type="button"
                            className="tz-cliente-action-btn tz-cliente-action-deuda"
                            style={{ alignSelf: "flex-start", marginTop: 4 }}
                            onClick={() => borrar(g)}
                            disabled={borrandoId === g.id}
                          >
                            {borrandoId === g.id ? <Loader2 size={13} className="tz-spin" /> : <Trash2 size={13} />} Eliminar gasto
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
