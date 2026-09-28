import { useEffect, useMemo, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { supabase } from "../supabaseClient";
import Styles from "../components/Styles";

/* Gestor de Cuentas del super-admin: solo lectura (altas/bajas/reset de
   PIN siguen siendo trabajo del admin de cada negocio, o del propio
   super-admin desde "Dar acceso a un admin" en la tarjeta del
   negocio) — acá el objetivo es poder FILTRAR y ver el detalle de
   quién tiene acceso admin/cajero en cada negocio, todo junto, sin
   tener que entrar negocio por negocio. */
export default function CuentasManagerModal({ negocios, onClose }) {
  const [cuentas, setCuentas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [cajas, setCajas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [filtroNegocioId, setFiltroNegocioId] = useState("todos");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    (async () => {
      const [{ data: profileRows, error: profileErr }, { data: sucRows, error: sucErr }, { data: cajaRows, error: cajaErr }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id, nombre, usuario, role, negocio_id, sucursal_id, caja_id")
            .in("role", ["admin", "cajero"])
            .order("role", { ascending: true })
            .order("nombre", { ascending: true }),
          supabase.from("sucursales").select("id, nombre"),
          supabase.from("cajas").select("id, nombre, sucursal_id"),
        ]);

      if (!active) return;
      if (profileErr || sucErr || cajaErr) {
        setError("No se pudo cargar las cuentas.");
        setLoading(false);
        return;
      }
      setCuentas(profileRows || []);
      setSucursales(sucRows || []);
      setCajas(cajaRows || []);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  const negociosPorId = useMemo(
    () => Object.fromEntries(negocios.map((n) => [n.id, n.nombre])),
    [negocios]
  );
  const sucursalesPorId = useMemo(
    () => Object.fromEntries(sucursales.map((s) => [s.id, s.nombre])),
    [sucursales]
  );
  const cajasPorId = useMemo(
    () => Object.fromEntries(cajas.map((c) => [c.id, c.nombre])),
    [cajas]
  );

  const cuentasFiltradas = useMemo(() => {
    return cuentas.filter((c) => {
      if (filtroRol !== "todos" && c.role !== filtroRol) return false;
      if (filtroNegocioId !== "todos" && c.negocio_id !== filtroNegocioId) return false;
      return true;
    });
  }, [cuentas, filtroRol, filtroNegocioId]);

  return (
    <div className="tz-modal-backdrop" onClick={onClose}>
      <Styles />
      <div className="tz-modal tz-modal-wide" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <h2>Gestor de Cuentas</h2>
        <p className="tz-brand-sub" style={{ marginBottom: 14 }}>
          Solo lectura: admins y cajeros de todos los negocios, con su detalle.
        </p>

        <div className="tz-cuentas-filtros">
          <select
            className="tz-text-input"
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
          >
            <option value="todos">Todos los roles</option>
            <option value="admin">Solo admins</option>
            <option value="cajero">Solo cajeros</option>
          </select>
          <select
            className="tz-text-input"
            value={filtroNegocioId}
            onChange={(e) => setFiltroNegocioId(e.target.value)}
          >
            <option value="todos">Todos los negocios</option>
            {negocios.map((n) => (
              <option key={n.id} value={n.id}>
                {n.nombre}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="tz-loading" style={{ minHeight: "auto", padding: "20px 0" }}>
            <Loader2 className="tz-spin" size={26} />
          </div>
        ) : error ? (
          <p className="tz-error">{error}</p>
        ) : cuentasFiltradas.length === 0 ? (
          <p className="tz-method-history-empty">No hay cuentas que coincidan con el filtro.</p>
        ) : (
          <ul className="tz-history-rows">
            {cuentasFiltradas.map((c) => (
              <li key={c.id} className="tz-history-row">
                <div className="tz-cuentas-row">
                  <span className="tz-cuentas-nombre">
                    {c.nombre}
                    <span
                      className={`tz-metodo-tag ${
                        c.role === "admin" ? "tz-metodo-tag-fiado" : "tz-metodo-tag-efectivo"
                      }`}
                      style={{ marginLeft: 6 }}
                    >
                      {c.role === "admin" ? "Admin" : "Cajero"}
                    </span>
                  </span>
                  <span className="tz-cuentas-detalle">
                    @{c.usuario || "—"} · {negociosPorId[c.negocio_id] || "Sin negocio"}
                    {c.role === "cajero" && c.sucursal_id && (
                      <> · {sucursalesPorId[c.sucursal_id] || "Sucursal eliminada"}
                        {c.caja_id ? ` - ${cajasPorId[c.caja_id] || "Caja eliminada"}` : ""}
                      </>
                    )}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
