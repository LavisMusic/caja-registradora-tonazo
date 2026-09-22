import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext(null);

// Aviso a pantalla completa cuando el Admin elimina la cuenta MIENTRAS
// la persona la sigue teniendo abierta en su dispositivo — mismo
// patrón que TaxiAuthContext.jsx en taxi-pe-app.
function CuentaEliminadaOverlay({ onCerrar }) {
  return (
    <div className="tz-modal-backdrop" style={{ zIndex: 999999 }}>
      <div
        className="tz-modal tz-cuenta-eliminada-modal"
        style={{ textAlign: "center" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tz-cuenta-eliminada-icono">
          <ShieldAlert size={36} />
        </div>
        <h2 style={{ marginTop: 14, color: "var(--danger, #ff5470)" }}>Tu cuenta ha sido eliminada</h2>
        <p className="tz-brand-sub" style={{ marginTop: 8 }}>
          Un administrador eliminó esta cuenta. Si crees que es un error, comunícate con soporte.
        </p>
        <button
          type="button"
          className="tz-scan-btn tz-cuenta-eliminada-salir-btn"
          style={{ marginTop: 16, width: "100%" }}
          onClick={() => {
            onCerrar();
            window.location.href = "/";
          }}
        >
          Salir
        </button>
      </div>
    </div>
  );
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  // Fiados restringido a usuarios asignados: 'clientes_fiado.fiado_habilitado'
  // (no alcanza con tener cuenta — ver migración 0068). Solo tiene
  // sentido consultarlo para un rol 'cliente'.
  const [tieneFiado, setTieneFiado] = useState(false);
  const [cuentaEliminada, setCuentaEliminada] = useState(false);

  // Único punto de entrada para "esta cuenta ya no existe" — lo usan
  // TANTO el listener de Realtime (la cuenta se borra MIENTRAS esta
  // pestaña sigue conectada) COMO el fetch inicial de perfil (la
  // cuenta YA estaba borrada de antes: alguien reabre/recarga la
  // pestaña después de que el admin la eliminó — un DELETE que ya
  // pasó es invisible para un canal de Realtime que recién se
  // suscribe ahora, así que antes esto solo hacía setProfile(null) en
  // silencio, sin avisar nada ni cerrar la sesión).
  const marcarCuentaEliminada = useCallback(() => {
    supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setCuentaEliminada(true);
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      if (!data.session) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        setProfile(null);
        setTieneFiado(false);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;

    let active = true;
    setLoading(true);

    supabase
      .from("profiles")
      .select("role, nombre, sucursal_id, caja_id")
      .eq("id", session.user.id)
      // maybeSingle (no single): 0 filas es un resultado VÁLIDO acá —
      // significa que esta cuenta ya fue eliminada por el admin, no un
      // error de red. single() lo hubiera reportado como error
      // (PGRST116), indistinguible de una falla real.
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error("Error cargando profile:", error);
          setProfile(null);
        } else if (!data) {
          marcarCuentaEliminada();
        } else {
          setProfile(data);
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session?.user?.id, marcarCuentaEliminada]);

  useEffect(() => {
    if (!session?.user?.id || profile?.role !== "cliente") {
      setTieneFiado(false);
      return undefined;
    }
    let active = true;
    supabase
      .from("clientes_fiado")
      .select("fiado_habilitado")
      .eq("auth_user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setTieneFiado(data?.fiado_habilitado === true);
      });

    // Realtime: el admin puede asignar Fiados (AsignarFiadoModal) MIENTRAS
    // este mismo cliente sigue con la tienda abierta — sin esto, recién
    // se enteraba recargando la página.
    const channel = supabase
      .channel(`tiene-fiado-${session.user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "clientes_fiado", filter: `auth_user_id=eq.${session.user.id}` },
        (payload) => {
          setTieneFiado(payload.new?.fiado_habilitado === true);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, profile?.role]);

  // Cuenta eliminada por el Admin (manage-usuario action:'delete')
  // MIENTRAS esta sesión sigue abierta en este dispositivo —
  // profiles.id cascadea al borrar auth.users, así que basta con
  // escuchar el DELETE de 'profiles' sobre la propia fila. Sin esto,
  // la sesión local seguía "viva" (JWT de Supabase Auth no se invalida
  // solo al borrar el usuario) mostrando datos de una cuenta que ya no
  // existe hasta que alguien recargara a mano.
  useEffect(() => {
    if (!session?.user?.id) return undefined;
    const channel = supabase
      .channel(`profile-eliminado-${session.user.id}`)
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "profiles", filter: `id=eq.${session.user.id}` },
        marcarCuentaEliminada
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, marcarCuentaEliminada]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  const value = {
    session,
    role: profile?.role ?? null,
    nombre: profile?.nombre ?? null,
    // Arquitectura Multi-Sucursal (migración 0048): la sucursal/caja
    // asignada a ESTE usuario (solo tiene sentido para un cajero — un
    // admin/cliente siempre trae null acá). Es la fuente de verdad que
    // usa App.jsx para saber "cuál fila de la tabla 'cajas' es LA MÍA",
    // en vez de depender de la vieja fila global 'estado_caja'.
    sucursalId: profile?.sucursal_id ?? null,
    cajaId: profile?.caja_id ?? null,
    loading,
    isAdmin: profile?.role === "admin",
    isCliente: profile?.role === "cliente",
    isCajero: profile?.role === "cajero",
    tieneFiado,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {cuentaEliminada && <CuentaEliminadaOverlay onCerrar={() => setCuentaEliminada(false)} />}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
