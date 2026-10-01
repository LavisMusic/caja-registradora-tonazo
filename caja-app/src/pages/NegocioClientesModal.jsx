import { useEffect, useMemo, useState } from "react";
import { X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "../supabaseClient";
import { formatSoles } from "../utils/format";
import FiadoDetalle from "../components/FiadoDetalle";
import Styles from "../components/Styles";

/* Vista de solo lectura para el super-admin: clientes de UN negocio
   puntual, con su saldo de fiado y el detalle completo (productos
   adeudados + cobros), reusando FiadoDetalle — el mismo componente que
   ya usan la Libreta del admin y la vista propia del cliente, para no
   duplicar la lógica de "cómo se arma el saldo" en un tercer lugar. */
export default function NegocioClientesModal({ negocio, onClose }) {
  const [clientes, setClientes] = useState([]);
  const [fiadoItems, setFiadoItems] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    (async () => {
      const { data: clienteRows, error: clienteErr } = await supabase
        .from("clientes_fiado")
        .select("id, nombre, whatsapp, dni, fiado_habilitado")
        .eq("negocio_id", negocio.id)
        .order("fecha", { ascending: false });

      if (!active) return;
      if (clienteErr) {
        setError("No se pudo cargar los clientes de este negocio.");
        setLoading(false);
        return;
      }

      const clienteIds = (clienteRows || []).map((c) => c.id);
      let itemRows = [];
      let movRows = [];
      if (clienteIds.length > 0) {
        const [{ data: fiRows, error: fiErr }, { data: mvRows, error: mvErr }] = await Promise.all([
          supabase
            .from("fiado_items")
            .select("id, cliente_id, producto_nombre, detalle, cantidad, monto, saldo_restante, fecha")
            .in("cliente_id", clienteIds),
          supabase
            .from("movimientos_fiado")
            .select("id, cliente_id, tipo, monto, descripcion, foto_url, fecha")
            .in("cliente_id", clienteIds),
        ]);
        if (!active) return;
        if (fiErr || mvErr) {
          setError("No se pudo cargar el detalle de fiados.");
          setLoading(false);
          return;
        }
        itemRows = fiRows || [];
        movRows = mvRows || [];
      }

      setClientes(clienteRows || []);
      setFiadoItems(itemRows);
      setMovimientos(movRows);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [negocio.id]);

  // Misma lógica que clienteSaldos en App.jsx (Libreta) — un mapa por
  // cliente con saldo total + items/pagos ordenados, para que
  // FiadoDetalle reciba exactamente la forma que espera.
  const saldosPorCliente = useMemo(() => {
    const map = {};
    clientes.forEach((c) => {
      map[c.id] = { saldo: 0, items: [], pagos: [] };
    });
    fiadoItems.forEach((row) => {
      const entry = map[row.cliente_id];
      if (!entry) return;
      const item = {
        id: row.id,
        productoNombre: row.producto_nombre,
        detalle: row.detalle || "",
        cantidad: Number(row.cantidad),
        monto: Number(row.monto),
        saldoRestante: Number(row.saldo_restante),
        timestamp: Number(row.fecha),
      };
      entry.items.push(item);
      entry.saldo += item.saldoRestante;
    });
    movimientos.forEach((row) => {
      const entry = map[row.cliente_id];
      if (!entry) return;
      if (row.tipo === "DEUDA") {
        entry.saldo += Number(row.monto);
      } else {
        entry.pagos.push({
          id: row.id,
          descripcion: row.descripcion || "",
          monto: Number(row.monto),
          fotoUrl: row.foto_url || null,
          rechazado: row.tipo === "PAGO_RECHAZADO",
          timestamp: Number(row.fecha),
        });
      }
    });
    Object.values(map).forEach((v) => {
      v.items.sort((a, b) => b.timestamp - a.timestamp);
      v.pagos.sort((a, b) => b.timestamp - a.timestamp);
    });
    return map;
  }, [clientes, fiadoItems, movimientos]);

  return (
    <div className="tz-modal-backdrop" onClick={onClose}>
      <Styles />
      <div className="tz-modal tz-modal-wide" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <h2>Clientes — {negocio.nombre}</h2>
        <p className="tz-brand-sub" style={{ marginBottom: 14 }}>
          Solo lectura: saldo de fiado y detalle de cada cliente de este negocio.
        </p>

        {loading ? (
          <div className="tz-loading" style={{ minHeight: "auto", padding: "20px 0" }}>
            <Loader2 className="tz-spin" size={26} />
          </div>
        ) : error ? (
          <p className="tz-error">{error}</p>
        ) : clientes.length === 0 ? (
          <p className="tz-method-history-empty">Este negocio todavía no tiene clientes registrados.</p>
        ) : (
          <ul className="tz-history-rows">
            {clientes.map((c) => {
              const info = saldosPorCliente[c.id] || { saldo: 0, items: [], pagos: [] };
              const open = openId === c.id;
              return (
                <li key={c.id} className="tz-history-row">
                  <button
                    type="button"
                    className="tz-history-row-head"
                    onClick={() => setOpenId(open ? null : c.id)}
                  >
                    <span className="tz-history-row-method tz-cliente-nombre">
                      {c.nombre}
                      {/* Misma etiqueta que ya usa el panel de Usuarios
                         del admin (App.jsx) — .tz-metodo-tag-fiado,
                         solo cuando el fiado está habilitado. */}
                      {c.fiado_habilitado && (
                        <span className="tz-metodo-tag tz-metodo-tag-fiado" style={{ marginLeft: 6 }}>
                          Fiado
                        </span>
                      )}
                    </span>
                    <span
                      className={`tz-history-row-amount ${
                        info.saldo > 0.009 ? "tz-cliente-debe" : "tz-cliente-aldia"
                      }`}
                    >
                      {info.saldo > 0.009 ? `${formatSoles(info.saldo)} debe` : "Al día"}
                    </span>
                    {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {open && (
                    <div className="tz-history-row-detail tz-cliente-detail">
                      <FiadoDetalle info={info} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
