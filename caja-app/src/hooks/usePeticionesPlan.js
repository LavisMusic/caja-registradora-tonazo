import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

// Peticiones de pago del plan (Fase 4, bloque B — migración 0089).
// Tabla peticiones_plan: el admin de un negocio crea una petición con
// su comprobante; el super admin la aprueba o rechaza. Ambos lados se
// enteran en tiempo real.

// Admin del negocio: su petición más reciente (pendiente, aprobada o
// rechazada) para mostrar "en revisión" / "rechazado: motivo".
export function useMiPeticionPlan(negocioId) {
  const [peticion, setPeticion] = useState(null);

  const cargar = useCallback(async () => {
    if (!negocioId) return;
    const { data } = await supabase
      .from("peticiones_plan")
      .select("*")
      .eq("negocio_id", negocioId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setPeticion(data || null);
  }, [negocioId]);

  useEffect(() => {
    if (!negocioId) {
      setPeticion(null);
      return undefined;
    }
    cargar();
    const canal = supabase
      .channel(`mi-peticion-plan-${negocioId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "peticiones_plan", filter: `negocio_id=eq.${negocioId}` },
        cargar
      )
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [negocioId, cargar]);

  return { peticion, recargar: cargar };
}

// Super admin: pendientes + últimas resueltas, con el nombre del negocio.
export function usePeticionesPlanSuperAdmin(activo = true) {
  const [peticiones, setPeticiones] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    const { data } = await supabase
      .from("peticiones_plan")
      .select("*, negocio:negocios(id, nombre, slug, logo_url, color)")
      .order("created_at", { ascending: false })
      .limit(80);
    setPeticiones(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!activo) return undefined;
    cargar();
    const canal = supabase
      .channel("super-admin-peticiones-plan")
      .on("postgres_changes", { event: "*", schema: "public", table: "peticiones_plan" }, cargar)
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [activo, cargar]);

  const pendientes = peticiones.filter((p) => p.estado === "pendiente");
  return { peticiones, pendientes, loading, recargar: cargar };
}
