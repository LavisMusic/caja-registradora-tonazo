import { useEffect, useRef, useState } from "react";
import { X, Search, UserCheck, Loader2 } from "lucide-react";
import { supabase } from "../supabaseClient";

// Botón "Asignar a un usuario existente" de la Libreta (Fiados): busca
// entre TODOS los clientes de la plataforma (identidad compartida
// entre negocios, Fase 1) — no solo los que ya tienen una fila de
// clientes_fiado en ESTE negocio — y le crea/habilita Fiados a quien
// elija el admin, para este negocio puntual. clientes_fiado tiene RLS
// negocio-scoped (un admin no puede leer filas de OTRO negocio desde
// su propia sesión), así que tanto la búsqueda como el alta pasan por
// manage-usuario (service_role), no por una consulta directa acá.
export default function AsignarFiadoModal({ onClose, onAsignado }) {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [asignandoId, setAsignandoId] = useState(null);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setResultados([]);
      return undefined;
    }
    debounceRef.current = setTimeout(async () => {
      setBuscando(true);
      const { data, error: err } = await supabase.functions.invoke("manage-usuario", {
        body: { action: "buscar-cliente-fiado", query: q },
      });
      setBuscando(false);
      if (err) {
        console.error("[AsignarFiadoModal] error buscando:", err);
        const body = await err.context?.json?.().catch(() => null);
        setError(body?.error || "No se pudo buscar clientes.");
        return;
      }
      setError("");
      setResultados(data?.resultados || []);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const asignar = async (cliente) => {
    setAsignandoId(cliente.auth_user_id);
    setError("");
    const { error: fnError } = await supabase.functions.invoke("manage-usuario", {
      body: { action: "set-fiado", userId: cliente.auth_user_id, habilitado: true },
    });
    setAsignandoId(null);
    if (fnError) {
      const body = await fnError.context?.json?.().catch(() => null);
      setError(body?.error || "No se pudo asignar Fiados. Intenta de nuevo.");
      return;
    }
    onAsignado?.(cliente);
    onClose();
  };

  return (
    <div className="tz-modal-backdrop" style={{ zIndex: 90 }} onClick={onClose}>
      <div className="tz-modal" onClick={(e) => e.stopPropagation()}>
        <button className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <h2>
          <UserCheck size={17} /> Asignar Fiados
        </h2>
        <p className="tz-stock-editor-sub">
          Buscá por nombre, DNI o celular al cliente que ya tiene cuenta.
        </p>

        <div className="tz-asignar-fiado-search">
          <Search size={15} />
          <input
            type="text"
            autoFocus
            className="tz-text-input"
            placeholder="Nombre, DNI o celular…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {error && <p className="tz-error">{error}</p>}

        <div className="tz-asignar-fiado-sugerencias">
          {buscando ? (
            <p className="tz-stock-editor-sub">
              <Loader2 size={14} className="tz-spin" /> Buscando…
            </p>
          ) : query.trim().length < 2 ? (
            <p className="tz-stock-editor-sub">Escribí al menos 2 caracteres.</p>
          ) : resultados.length === 0 ? (
            <p className="tz-stock-editor-sub">Sin resultados (o ese cliente ya tiene Fiados).</p>
          ) : (
            resultados.map((c) => (
              <button
                key={c.auth_user_id}
                type="button"
                className="tz-asignar-fiado-item"
                disabled={asignandoId === c.auth_user_id}
                onClick={() => asignar(c)}
              >
                <span className="tz-asignar-fiado-info">
                  <span className="tz-asignar-fiado-nombre">{c.nombre}</span>
                  <span className="tz-asignar-fiado-meta">
                    {c.whatsapp || "sin celular"}
                    {c.dni ? ` · DNI ${c.dni}` : ""}
                  </span>
                </span>
                {asignandoId === c.auth_user_id ? <Loader2 size={14} className="tz-spin" /> : <UserCheck size={14} />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
