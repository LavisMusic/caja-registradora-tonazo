import { useCallback, useEffect, useState } from "react";
import { supabaseTaxi } from "../lib/supabaseTaxi";

// Mensajes del repartidor sin leer por entrega (delivery de Taxi-PE), para
// el punto rojo del botón "Ver entrega" / "Seguir mi pedido". Se cuentan
// por el session_token de cada entrega (rpc_entrega_no_leidos_repartidor,
// migración 20261014210000 de Taxi-PE) y se marcan leídos al abrir ese
// chat. `miRol`: 'cajero' | 'cliente'. Devuelve { [token]: cantidad }.
const SONDEO_MS = 5000;

export function useEntregasNoLeidos(tokens, miRol) {
  const [counts, setCounts] = useState({});
  const tokensKey = [...new Set((tokens || []).filter(Boolean))].sort().join(",");

  const load = useCallback(async () => {
    const lista = tokensKey ? tokensKey.split(",") : [];
    if (lista.length === 0) {
      setCounts((c) => (Object.keys(c).length ? {} : c));
      return;
    }
    const { data, error } = await supabaseTaxi.rpc("rpc_entrega_no_leidos_repartidor", {
      p_tokens: lista,
      p_rol: miRol,
    });
    if (error) return;
    const c = {};
    for (const fila of data || []) c[fila.session_token] = Number(fila.no_leidos) || 0;
    setCounts(c);
  }, [tokensKey, miRol]);

  useEffect(() => {
    load();
    if (!tokensKey) return undefined;
    const sondeo = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, SONDEO_MS);
    const alVolver = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      clearInterval(sondeo);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [load, tokensKey]);

  return { counts, refrescar: load };
}
