import { useEffect, useMemo, useState } from "react";
import { X, Loader2, Search } from "lucide-react";
import { supabase } from "../supabaseClient";
import Styles from "../components/Styles";

/* Gestor de Cuentas del super-admin: solo lectura (altas/bajas/reset de
   PIN siguen siendo trabajo del admin de cada negocio, o del propio
   super-admin desde "Dar acceso a un admin" en la tarjeta del
   negocio) — acá el objetivo es poder FILTRAR y ver el detalle de
   quién tiene acceso admin/cajero/cliente en cada negocio, todo
   junto, sin tener que entrar negocio por negocio.

   'cliente' es distinto de admin/cajero acá: profiles.negocio_id es
   SIEMPRE null para un cliente (identidad de login compartida entre
   negocios, Fase 1) — su relación real con uno o más negocios vive en
   clientes_fiado (una fila por negocio donde compró/tiene fiado), así
   que se arma aparte un mapa authUserId -> [negocios] para poder
   filtrar y mostrar esos casos. */
export default function CuentasManagerModal({ negocios, onClose }) {
  const [cuentas, setCuentas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [cajas, setCajas] = useState([]);
  const [clientesFiado, setClientesFiado] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [filtroNegocioId, setFiltroNegocioId] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    (async () => {
      const [
        { data: profileRows, error: profileErr },
        { data: sucRows, error: sucErr },
        { data: cajaRows, error: cajaErr },
        { data: clienteRows, error: clienteErr },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, nombre, usuario, role, negocio_id, sucursal_id, caja_id")
          .in("role", ["admin", "cajero", "cliente"])
          .order("role", { ascending: true })
          .order("nombre", { ascending: true }),
        supabase.from("sucursales").select("id, nombre"),
        supabase.from("cajas").select("id, nombre, sucursal_id"),
        supabase.from("clientes_fiado").select("auth_user_id, negocio_id, whatsapp, fiado_habilitado"),
      ]);

      if (!active) return;
      if (profileErr || sucErr || cajaErr || clienteErr) {
        setError("No se pudo cargar las cuentas.");
        setLoading(false);
        return;
      }
      setCuentas(profileRows || []);
      setSucursales(sucRows || []);
      setCajas(cajaRows || []);
      setClientesFiado(clienteRows || []);
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
  // Un cliente puede tener fiado en varios negocios (identidad
  // compartida) — se agrupan sus filas de clientes_fiado por
  // auth_user_id para poder filtrar/mostrar "en qué negocios está".
  const clientesFiadoPorAuthId = useMemo(() => {
    const map = {};
    clientesFiado.forEach((row) => {
      if (!row.auth_user_id) return;
      (map[row.auth_user_id] ||= []).push(row);
    });
    return map;
  }, [clientesFiado]);

  const cuentasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return cuentas.filter((c) => {
      if (filtroRol !== "todos" && c.role !== filtroRol) return false;

      if (filtroNegocioId !== "todos") {
        if (c.role === "cliente") {
          const filas = clientesFiadoPorAuthId[c.id] || [];
          if (!filas.some((f) => f.negocio_id === filtroNegocioId)) return false;
        } else if (c.negocio_id !== filtroNegocioId) {
          return false;
        }
      }

      if (q) {
        const filasCliente = c.role === "cliente" ? clientesFiadoPorAuthId[c.id] || [] : [];
        const telefonos = filasCliente.map((f) => f.whatsapp || "").join(" ");
        const haystack = `${c.nombre || ""} ${c.usuario || ""} ${telefonos}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [cuentas, filtroRol, filtroNegocioId, busqueda, clientesFiadoPorAuthId]);

  return (
    <div className="tz-modal-backdrop">
      <Styles />
      <div className="tz-modal tz-modal-wide" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <h2>Gestor de Cuentas</h2>
        <p className="tz-brand-sub" style={{ marginBottom: 14 }}>
          Solo lectura: admins, cajeros y clientes de todos los negocios, con su detalle.
        </p>

        <div className="tz-cuentas-filtros">
          <div className="tz-global-search-wrap" style={{ flex: "1 1 220px" }}>
            <Search size={14} className="tz-cuentas-search-icon" />
            <input
              type="text"
              className="tz-text-input tz-cuentas-search-input"
              placeholder="Buscar por nombre, usuario o teléfono…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <select
            className="tz-text-input"
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
          >
            <option value="todos">Todos los roles</option>
            <option value="admin">Solo admins</option>
            <option value="cajero">Solo cajeros</option>
            <option value="cliente">Solo clientes</option>
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
            {cuentasFiltradas.map((c) => {
              const filasCliente = c.role === "cliente" ? clientesFiadoPorAuthId[c.id] || [] : [];
              return (
                <li key={c.id} className="tz-history-row">
                  <div className="tz-cuentas-row">
                    <span className="tz-cuentas-nombre">
                      {c.nombre}
                      <span
                        className={`tz-metodo-tag ${
                          c.role === "admin"
                            ? "tz-metodo-tag-fiado"
                            : c.role === "cajero"
                              ? "tz-metodo-tag-efectivo"
                              : "tz-metodo-tag-otros"
                        }`}
                        style={{ marginLeft: 6 }}
                      >
                        {c.role === "admin" ? "Admin" : c.role === "cajero" ? "Cajero" : "Cliente"}
                      </span>
                    </span>
                    {c.role === "cliente" ? (
                      <span className="tz-cuentas-detalle">
                        {filasCliente[0]?.whatsapp || "Sin teléfono"} ·{" "}
                        {filasCliente.length === 0
                          ? "Sin negocio"
                          : filasCliente
                              .map((f) => negociosPorId[f.negocio_id] || "Negocio eliminado")
                              .join(", ")}
                      </span>
                    ) : (
                      <span className="tz-cuentas-detalle">
                        @{c.usuario || "—"} · {negociosPorId[c.negocio_id] || "Sin negocio"}
                        {c.role === "cajero" && c.sucursal_id && (
                          <> · {sucursalesPorId[c.sucursal_id] || "Sucursal eliminada"}
                            {c.caja_id ? ` - ${cajasPorId[c.caja_id] || "Caja eliminada"}` : ""}
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
