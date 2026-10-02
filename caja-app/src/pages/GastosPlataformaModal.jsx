import { useEffect, useMemo, useState } from "react";
import { X, Loader2, Plus, Trash2, TrendingDown } from "lucide-react";
import { supabase } from "../supabaseClient";
import Styles from "../components/Styles";
import { formatSoles } from "../utils/format";
import { formatFechaCorta } from "../lib/planes";

// Gestor de gastos del super admin (pie de página): los gastos se cargan
// a mano — no hay un costo operativo fijo predefinido. Entran en el
// Cierre de caja (cobrado − gastos = balance).
const CATEGORIAS = ["Servidores", "Publicidad", "Personal", "Transporte", "Servicios", "Otros"];

export default function GastosPlataformaModal({ onClose }) {
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("mes");
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

  const visibles = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const limite = filtro === "hoy" ? hoy : mes;
    return gastos.filter((g) => new Date(g.fecha) >= limite);
  }, [gastos, filtro]);
  const total = visibles.reduce((s, g) => s + Number(g.monto || 0), 0);

  const agregar = async () => {
    setError("");
    const m = Number(String(monto).replace(",", "."));
    if (!descripcion.trim()) return setError("Escribe en qué se gastó.");
    if (!Number.isFinite(m) || m <= 0) return setError("Monto inválido.");
    setGuardando(true);
    const { error: err } = await supabase.from("gastos_plataforma").insert({ descripcion: descripcion.trim(), monto: m, categoria });
    setGuardando(false);
    if (err) return setError(err.message || "No se pudo guardar.");
    setDescripcion("");
    setMonto("");
    cargar();
  };

  const borrar = async (g) => {
    setBorrandoId(g.id);
    const { error: err } = await supabase.from("gastos_plataforma").delete().eq("id", g.id);
    setBorrandoId(null);
    if (err) return setError(err.message || "No se pudo borrar.");
    setGastos((prev) => prev.filter((x) => x.id !== g.id));
  };

  return (
    <div className="tz-modal-backdrop">
      <Styles />
      <div className="tz-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <h2>
          <TrendingDown size={17} /> Gastos
        </h2>

        <div className="tz-gastos-sa-form">
          <input className="tz-text-input" placeholder="Descripción (ej. Hosting de octubre)" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          <input className="tz-text-input" inputMode="decimal" placeholder="Monto S/" value={monto} onChange={(e) => setMonto(e.target.value)} />
          <select className="tz-text-input" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button type="button" className="tz-cliente-action-btn tz-cliente-action-pago" onClick={agregar} disabled={guardando}>
            {guardando ? <Loader2 size={13} className="tz-spin" /> : <Plus size={13} />} Agregar
          </button>
        </div>
        {error && <p className="tz-error">{error}</p>}

        <div className="tz-plan-filtros" style={{ marginTop: 14 }}>
          <button type="button" className={`tz-gasto-tipo-btn ${filtro === "hoy" ? "tz-gasto-tipo-active" : ""}`} onClick={() => setFiltro("hoy")}>
            Hoy
          </button>
          <button type="button" className={`tz-gasto-tipo-btn ${filtro === "mes" ? "tz-gasto-tipo-active" : ""}`} onClick={() => setFiltro("mes")}>
            Este mes
          </button>
        </div>
        <div className="tz-method-totals">
          <div className="tz-method-total">
            <span>Total {filtro === "hoy" ? "de hoy" : "del mes"}</span>
            <strong className="tz-pink">{formatSoles(total)}</strong>
          </div>
        </div>

        {loading ? (
          <Loader2 size={18} className="tz-spin" />
        ) : visibles.length === 0 ? (
          <p className="tz-stock-editor-sub">No hay gastos en este período.</p>
        ) : (
          <ul className="tz-plan-pagos">
            {visibles.map((g) => (
              <li key={g.id}>
                <span>{formatFechaCorta(g.fecha)}</span>
                <strong>{g.descripcion}</strong>
                <span>{g.categoria || "—"}</span>
                <span className="tz-pink">{formatSoles(g.monto)}</span>
                <button type="button" className="tz-vis-reject-btn" onClick={() => borrar(g)} disabled={borrandoId === g.id} aria-label="Borrar gasto">
                  {borrandoId === g.id ? <Loader2 size={13} className="tz-spin" /> : <Trash2 size={13} />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
