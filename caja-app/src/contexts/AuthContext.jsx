import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  // Fiados restringido a usuarios asignados: 'clientes_fiado.fiado_habilitado'
  // (no alcanza con tener cuenta — ver migración 0068). Solo tiene
  // sentido consultarlo para un rol 'cliente'.
  const [tieneFiado, setTieneFiado] = useState(false);

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
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error("Error cargando profile:", error);
          setProfile(null);
        } else {
          setProfile(data);
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session?.user?.id]);

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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
