import { useEffect, useMemo, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { supabase } from "../supabaseClient";
import { formatSoles } from "../utils/format";
import Styles from "../components/Styles";

/* Panel de Estadísticas del super-admin: movimiento de TODOS los
   negocios en un solo lugar — ventas, pedidos (repartos = los que
   pidieron delivery, no retiro en tienda) y clientes registrados.
   'historial'/'pedidos' no tienen negocio_id propio (igual que
   localidades/sucursales/cajas) — se arma un mapa sucursal -> negocio
   vía localidad, mismo patrón que ya usa el resto de la app. Solo
   lectura, agregado en el cliente (mismo criterio que clienteSaldos/
   productStats en App.jsx) — sin un negocio con volumen realmente
   grande todavía, no hace falta una vista/función agregada en la
   base. */
export default function EstadisticasModal({ negocios, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [localidades, setLocalidades] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [clientesFiado, setClientesFiado] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const [
        { data: locData, error: locErr },
        { data: sucData, error: sucErr },
        { data: histData, error: histErr },
        { data: pedData, error: pedErr },
        { data: cliData, error: cliErr },
      ] = await Promise.all([
        supabase.from("localidades").select("id, negocio_id"),
        supabase.from("sucursales").select("id, localidad_id"),
        supabase.from("historial").select("purchase_id, total, sucursal_id"),
        supabase.from("pedidos").select("id, sucursal_id, requiere_delivery"),
        supabase.from("clientes_fiado").select("id, negocio_id"),
      ]);
      if (!active) return;
      if (locErr || sucErr || histErr || pedErr || cliErr) {
        setError("No se pudo cargar las estadísticas.");
        setLoading(false);
        return;
      }
      setLocalidades(locData || []);
      setSucursales(sucData || []);
      setHistorial(histData || []);
      setPedidos(pedData || []);
      setClientesFiado(cliData || []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const filas = useMemo(() => {
    const negocioPorLocalidad = Object.fromEntries(localidades.map((l) => [l.id, l.negocio_id]));
    const negocioPorSucursal = Object.fromEntries(
      sucursales.map((s) => [s.id, negocioPorLocalidad[s.localidad_id] || null])
    );

    const base = {};
    negocios.forEach((n) => {
      base[n.id] = {
        negocio: n,
        ventasTotal: 0,
        purchaseIds: new Set(),
        pedidosTotal: 0,
        repartos: 0,
        clientes: 0,
      };
    });

    historial.forEach((row) => {
      const negocioId = negocioPorSucursal[row.sucursal_id];
      const entry = base[negocioId];
      if (!entry) return;
      entry.ventasTotal += Number(row.total) || 0;
      entry.purchaseIds.add(row.purchase_id);
    });

    pedidos.forEach((row) => {
      const negocioId = negocioPorSucursal[row.sucursal_id];
      const entry = base[negocioId];
      if (!entry) return;
      entry.pedidosTotal += 1;
      if (row.requiere_delivery) entry.repartos += 1;
    });

    clientesFiado.forEach((row) => {
      const entry = base[row.negocio_id];
      if (!entry) return;
      entry.clientes += 1;
    });

    return Object.values(base)
      .map((e) => ({ ...e, ventasCount: e.purchaseIds.size }))
      .sort((a, b) => b.ventasTotal - a.ventasTotal);
  }, [negocios, localidades, sucursales, historial, pedidos, clientesFiado]);

  const totales = useMemo(
    () =>
      filas.reduce(
        (acc, f) => ({
          ventasTotal: acc.ventasTotal + f.ventasTotal,
          ventasCount: acc.ventasCount + f.ventasCount,
          pedidosTotal: acc.pedidosTotal + f.pedidosTotal,
          repartos: acc.repartos + f.repartos,
          clientes: acc.clientes + f.clientes,
        }),
        { ventasTotal: 0, ventasCount: 0, pedidosTotal: 0, repartos: 0, clientes: 0 }
      ),
    [filas]
  );

  return (
    <div className="tz-modal-backdrop">
      <Styles />
      <div className="tz-modal tz-modal-wide" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <h2>Estadísticas</h2>
        <p className="tz-brand-sub" style={{ marginBottom: 14 }}>
          Movimiento histórico de todos los negocios. Repartos = pedidos con delivery (no retiro en tienda).
        </p>

        {loading ? (
          <div className="tz-loading" style={{ minHeight: "auto", padding: "20px 0" }}>
            <Loader2 className="tz-spin" size={26} />
          </div>
        ) : error ? (
          <p className="tz-error">{error}</p>
        ) : (
          <div className="tz-est-table-wrap">
            <table className="tz-est-table">
              <thead>
                <tr>
                  <th>Negocio</th>
                  <th>Ventas</th>
                  <th>Cant. ventas</th>
                  <th>Pedidos</th>
                  <th>Repartos</th>
                  <th>Clientes</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.negocio.id}>
                    <td>{f.negocio.nombre}</td>
                    <td>{formatSoles(f.ventasTotal)}</td>
                    <td>{f.ventasCount}</td>
                    <td>{f.pedidosTotal}</td>
                    <td>{f.repartos}</td>
                    <td>{f.clientes}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td>{formatSoles(totales.ventasTotal)}</td>
                  <td>{totales.ventasCount}</td>
                  <td>{totales.pedidosTotal}</td>
                  <td>{totales.repartos}</td>
                  <td>{totales.clientes}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
