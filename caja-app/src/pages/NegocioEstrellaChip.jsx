import { useEffect, useMemo, useState } from "react";
import { Star, Trophy } from "lucide-react";
import { supabase } from "../supabaseClient";
import { formatSoles } from "../utils/format";

// "Negocio Estrella" del super admin — mismo medidor que el "Usuario
// Estrella" del admin de Taxi-PE (UsuarioEstrellaChip): selector arriba
// y carrusel Top 5 (desliza del #1 al #5). Tres rankings:
//   * Pedidos online: pedidos recibidos por el directorio/catálogo.
//   * Clientes: clientes con cuenta en ese negocio (clientes_fiado).
//   * Pagos: lo que pagó en planes (sin los anulados).
const RANKINGS = [
  { key: "pedidos", label: "Pedidos online" },
  { key: "clientes", label: "Clientes" },
  { key: "pagos", label: "Pagos" },
];

export default function NegocioEstrellaChip({ negocios }) {
  const [ranking, setRanking] = useState("pedidos");
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    let activo = true;
    Promise.all([
      supabase.from("localidades").select("id, negocio_id"),
      supabase.from("sucursales").select("id, localidad_id"),
      supabase.from("pedidos").select("sucursal_id, estado"),
      supabase.from("clientes_fiado").select("negocio_id"),
      supabase.from("pagos_plataforma").select("negocio_id, monto, anulado"),
    ]).then(([l, s, pedidos, clientes, pagos]) => {
      if (!activo) return;
      const negocioDeLocalidad = Object.fromEntries((l.data || []).map((x) => [x.id, x.negocio_id]));
      const negocioDeSucursal = Object.fromEntries((s.data || []).map((x) => [x.id, negocioDeLocalidad[x.localidad_id]]));
      const cuenta = { pedidos: {}, clientes: {}, pagos: {} };
      (pedidos.data || []).forEach((p) => {
        if (p.estado === "cancelado") return;
        const id = negocioDeSucursal[p.sucursal_id];
        if (id) cuenta.pedidos[id] = (cuenta.pedidos[id] || 0) + 1;
      });
      (clientes.data || []).forEach((c) => {
        if (c.negocio_id) cuenta.clientes[c.negocio_id] = (cuenta.clientes[c.negocio_id] || 0) + 1;
      });
      (pagos.data || []).forEach((p) => {
        if (p.anulado) return;
        cuenta.pagos[p.negocio_id] = (cuenta.pagos[p.negocio_id] || 0) + Number(p.monto || 0);
      });
      setDatos(cuenta);
    });
    return () => {
      activo = false;
    };
  }, [negocios.length]);

  const top5 = useMemo(() => {
    if (!datos) return [];
    const valores = datos[ranking];
    return negocios
      .map((n) => ({ ...n, valor: valores[n.id] || 0 }))
      .filter((n) => n.valor > 0)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  }, [datos, ranking, negocios]);

  const detalle = (valor) => {
    if (ranking === "pagos") return `${formatSoles(valor)} pagados en planes`;
    if (ranking === "clientes") return `${valor} cliente${valor === 1 ? "" : "s"}`;
    return `${valor} pedido${valor === 1 ? "" : "s"} online`;
  };

  return (
    <div className="tz-stat-chip tz-stat-chip-star">
      <span className="tz-stat-label">
        <Star size={13} /> Negocio Estrella
      </span>
      <div className="tz-gasto-tipo-buttons tz-star-roles" style={{ margin: "2px 0" }}>
        {RANKINGS.map((r) => (
          <button
            key={r.key}
            type="button"
            className={`tz-gasto-tipo-btn ${ranking === r.key ? "tz-gasto-tipo-active" : ""}`}
            onClick={() => setRanking(r.key)}
          >
            {r.label}
          </button>
        ))}
      </div>
      {!datos ? (
        <span className="tz-stat-sub">Cargando…</span>
      ) : top5.length === 0 ? (
        <span className="tz-stat-sub">Aún sin datos</span>
      ) : (
        <div className="tz-star-carousel">
          {top5.map((n, i) => (
            <div key={n.id} className="tz-star-carousel-item">
              <span className="tz-star-carousel-rank">{i === 0 ? <Trophy size={14} /> : `#${i + 1}`}</span>
              <span className="tz-star-carousel-info">
                <span className="tz-star-text tz-star-carousel-name">{n.nombre}</span>
                <span className="tz-stat-sub">{detalle(n.valor)}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
