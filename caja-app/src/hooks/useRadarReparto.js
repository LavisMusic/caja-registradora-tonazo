import { useEffect, useRef, useState } from "react";
import { supabaseTaxi } from "../lib/supabaseTaxi";

// Radar de repartidores para la app de Caja: lista de conductores de
// Taxi-PE en línea + VERIFICADOS (rpc_conductores_para_reparto) con su
// posición. La foto inicial viene por RPC; el movimiento en vivo por
// Broadcast en el canal `radar_publico` (event 'gps_update'), igual que
// el radar de pasajeros de Taxi-PE. Ver DELIVERY.md §2 / §7.

const CANAL_RADAR = "radar_publico";
const REFRESH_MS = 12000; // re-consulta la lista seguido: así los que se
                          // desconectan (ultima_actualizacion vieja) se caen
                          // de las sugerencias en ~12 s, no se quedan pegados.

export function useRadarReparto(activo = true) {
  const [conductores, setConductores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const posiciones = useRef({});

  useEffect(() => {
    if (!activo) return;
    let cancelado = false;

    const aplicar = (data) => {
      if (cancelado || !data) return;
      setConductores(
        data.map((c) => {
          const p = posiciones.current[c.id];
          return {
            id: c.id,
            nombre: c.nombre,
            placa: c.placa,
            foto_url: c.foto_url,
            estado: c.estado,
            lat: p?.lat ?? c.ultima_lat,
            lng: p?.lng ?? c.ultima_lng,
          };
        })
      );
    };

    (async () => {
      const { data, error: e } = await supabaseTaxi.rpc("rpc_conductores_para_reparto");
      if (cancelado) return;
      if (e) setError("No se pudo cargar el radar de repartidores.");
      else {
        posiciones.current = Object.fromEntries(
          (data || []).map((c) => [c.id, { lat: c.ultima_lat, lng: c.ultima_lng }])
        );
        aplicar(data);
      }
      setLoading(false);
    })();

    const ch = supabaseTaxi
      .channel(CANAL_RADAR)
      .on("broadcast", { event: "gps_update" }, ({ payload }) => {
        if (!payload?.conductorId || typeof payload.lat !== "number" || typeof payload.lng !== "number") return;
        posiciones.current[payload.conductorId] = { lat: payload.lat, lng: payload.lng };
        setConductores((prev) =>
          prev.map((c) =>
            c.id === payload.conductorId ? { ...c, lat: payload.lat, lng: payload.lng } : c
          )
        );
      })
      .subscribe();

    const poll = setInterval(async () => {
      const { data } = await supabaseTaxi.rpc("rpc_conductores_para_reparto");
      aplicar(data);
    }, REFRESH_MS);

    return () => {
      cancelado = true;
      supabaseTaxi.removeChannel(ch);
      clearInterval(poll);
    };
  }, [activo]);

  return { conductores, loading, error };
}
