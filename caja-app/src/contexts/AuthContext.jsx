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
  // Saldo de Taxi-PE (unificación pasajero/cliente) — copia local en
  // clientes_fiado que Taxi-PE mantiene al día por webhook cada vez que
  // cambia (migración 0071/saldo_pasajero_realtime en taxi-pe-app). Se
  // lee de la MISMA fila/canal que tieneFiado, así no hace falta una
  // consulta ni una suscripción aparte.
  const [saldoTaxi, setSaldoTaxi] = useState(null);
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

    const cargarProfile = () =>
      supabase
        .from("profiles")
        .select("role, nombre, sucursal_id, caja_id, negocio_id")
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

    cargarProfile();

    // Con dos pestañas abiertas a la vez, probado en vivo (Taxi-PE):
    // el navegador suspende/cierra el WebSocket de Realtime de la
    // pestaña en segundo plano (o entra al back-forward cache), así
    // que esa pestaña se pierde el DELETE en vivo del listener de más
    // abajo. Sin este re-chequeo al volver a mirarla, se quedaba
    // mostrando la cuenta borrada como si nada.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") cargarProfile();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pageshow", cargarProfile);
    window.addEventListener("focus", cargarProfile);

    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pageshow", cargarProfile);
      window.removeEventListener("focus", cargarProfile);
    };
  }, [session?.user?.id, marcarCuentaEliminada]);

  useEffect(() => {
    if (!session?.user?.id || profile?.role !== "cliente") {
      setTieneFiado(false);
      setSaldoTaxi(null);
      return undefined;
    }
    let active = true;

    // Un cliente puede tener VARIAS filas de clientes_fiado (una por
    // negocio donde compró — identidad compartida, Fase 1) — .maybeSingle()
    // reventaba (PGRST116, "multiple rows") apenas tenía 2+, y el error
    // se ignoraba en silencio: tieneFiado/saldoTaxi quedaban en null
    // para SIEMPRE, aunque el cliente sí tuviera fiado/membresía activa
    // en alguno de esos negocios. creditos_disponibles/
    // membresia_vencimiento SÍ son iguales en todas sus filas (el
    // webhook de Taxi-PE las actualiza TODAS a la vez, ver
    // webhook-taxi-mirror-cuenta), así que cualquiera sirve para el
    // saldo; fiado_habilitado en cambio es real por negocio, así que
    // acá (fuera de un negocio puntual) se toma "tiene fiado en AL
    // MENOS uno" como señal global para mostrar el botón "Fiados".
    const cargarSaldoYFiado = async () => {
      const { data } = await supabase
        .from("clientes_fiado")
        .select("fiado_habilitado, creditos_disponibles, membresia_vencimiento")
        .eq("auth_user_id", session.user.id);
      if (!active) return;
      const filas = data || [];
      setTieneFiado(filas.some((f) => f.fiado_habilitado === true));
      if (filas.length === 0) {
        setSaldoTaxi(null);
        return;
      }
      // Se toma lo MEJOR de todas las filas, no la primera que llegue:
      // una fila creada en otro negocio después del último evento de
      // Taxi-PE nace sin saldo copiado (null/0) y, si justo venía
      // primera, tapaba la membresía real de las demás.
      const membresia = filas
        .map((f) => f.membresia_vencimiento)
        .filter(Boolean)
        .sort()
        .pop() ?? null;
      const creditos = Math.max(0, ...filas.map((f) => Number(f.creditos_disponibles) || 0));
      setSaldoTaxi({ creditos_disponibles: creditos, membresia_vencimiento: membresia });
    };
    cargarSaldoYFiado();

    // Realtime: el admin puede asignar Fiados (AsignarFiadoModal) MIENTRAS
    // este mismo cliente sigue con la tienda abierta — sin esto, recién
    // se enteraba recargando la página. Mismo canal para el saldo de
    // Taxi-PE. Se relee todo en vez de confiar en el payload de UN
    // evento puntual — con varias filas, un solo UPDATE no alcanza para
    // saber el estado combinado real (ej. fiado_habilitado de un
    // negocio distinto al que acaba de cambiar).
    const channel = supabase
      .channel(`tiene-fiado-${session.user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "clientes_fiado", filter: `auth_user_id=eq.${session.user.id}` },
        cargarSaldoYFiado
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, profile?.role]);

  // Logo del negocio de esta sesión (admin/cajero) — para las boletas
  // (TicketBoleta.jsx) y cualquier otro lugar que necesite el logo
  // REAL del negocio en vez del logo estático de Tonazo. 'negocios'
  // tiene lectura pública para filas activas (migración 0075), así que
  // este fetch no depende de ningún permiso especial del rol actual.
  const [negocioLogoUrl, setNegocioLogoUrl] = useState(null);
  useEffect(() => {
    const negocioId = profile?.negocio_id;
    if (!negocioId) {
      setNegocioLogoUrl(null);
      return undefined;
    }
    let active = true;
    supabase
      .from("negocios")
      .select("logo_url")
      .eq("id", negocioId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setNegocioLogoUrl(data?.logo_url || null);
      });
    return () => {
      active = false;
    };
  }, [profile?.negocio_id]);

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
    // negocio al que pertenece este usuario (Fase 0/1 multi-negocio) —
    // null para 'super_admin', que no pertenece a ninguno en particular.
    negocioId: profile?.negocio_id ?? null,
    negocioLogoUrl,
    loading,
    isAdmin: profile?.role === "admin",
    isCliente: profile?.role === "cliente",
    isCajero: profile?.role === "cajero",
    isSuperAdmin: profile?.role === "super_admin",
    tieneFiado,
    saldoTaxi,
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
