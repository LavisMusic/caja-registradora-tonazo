import { useCallback, useEffect, useState } from "react";
import { supabaseTaxi } from "../lib/supabaseTaxi";

// Estado + chat + acciones de UNA entrega delivery, desde la app de Caja
// (cajero o cliente), contra el Supabase de Taxi-PE. Ver DELIVERY.md §2/§7.
//
//   sessionToken  — lo devuelve la Edge Function `entrega-iniciar`
//   rol           — 'cajero' | 'cliente' (para el emisor de los mensajes)
//
// Polling 8 s + Broadcast en `entrega-<id>` para refresco instantáneo.

export function canalEntrega(id) {
  return `entrega-${id}`;
}

export function useEntregaCaja(sessionToken, { rol = "cajero" } = {}) {
  const [entrega, setEntrega] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    if (!sessionToken) {
      setEntrega(null);
      setMensajes([]);
      setOfertas([]);
      setLoading(false);
      return;
    }
    const [estRes, msgRes, ofRes] = await Promise.all([
      supabaseTaxi.rpc("rpc_entrega_estado", { p_session_token: sessionToken }),
      supabaseTaxi.rpc("rpc_entrega_mensajes", {
        p_session_token: sessionToken,
        p_entrega_id: null,
        p_conductor_id: null,
        p_desde: "-infinity",
      }),
      supabaseTaxi.rpc("rpc_entrega_ofertas_de_entrega", { p_session_token: sessionToken }),
    ]);
    if (!estRes.error) setEntrega((estRes.data && estRes.data[0]) || null);
    if (!msgRes.error) setMensajes(msgRes.data || []);
    if (!ofRes.error) setOfertas(ofRes.data || []);
    setLoading(false);
  }, [sessionToken]);

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 8000);
    return () => clearInterval(t);
  }, [cargar]);

  useEffect(() => {
    if (!entrega?.id) return;
    const ch = supabaseTaxi
      .channel(canalEntrega(entrega.id))
      .on("broadcast", { event: "estado" }, cargar)
      .on("broadcast", { event: "mensaje" }, cargar)
      .on("broadcast", { event: "oferta" }, cargar)
      .subscribe();
    return () => {
      supabaseTaxi.removeChannel(ch);
    };
  }, [entrega?.id, cargar]);

  const marcarLeido = useCallback(
    async (hilo) => {
      if (!hilo || !sessionToken) return;
      await supabaseTaxi.rpc("rpc_entrega_marcar_leido", {
        p_hilo: hilo,
        p_rol_propio: rol,
        p_session_token: sessionToken,
        p_entrega_id: null,
        p_conductor_id: null,
      });
    },
    [sessionToken, rol]
  );

  const ofertar = useCallback(
    async (conductorId, tarifa) => {
      const { data, error } = await supabaseTaxi.rpc("rpc_entrega_ofertar", {
        p_session_token: sessionToken,
        p_conductor_id: conductorId,
        p_tarifa: tarifa ?? null,
      });
      await cargar();
      return { status: error ? "error" : data?.status, error };
    },
    [sessionToken, cargar]
  );

  const cancelar = useCallback(
    async (motivo) => {
      const { data, error } = await supabaseTaxi.rpc("rpc_entrega_cancelar", {
        p_session_token: sessionToken,
        p_motivo: motivo || null,
      });
      await cargar();
      return { status: error ? "error" : data?.status, error };
    },
    [sessionToken, cargar]
  );

  const enviarMensaje = useCallback(
    async (hilo, texto) => {
      const t = String(texto || "").trim();
      if (!t) return { error: new Error("Mensaje vacío") };
      const { data, error } = await supabaseTaxi.rpc("rpc_entrega_mensaje_nuevo", {
        p_hilo: hilo,
        p_emisor_rol: rol,
        p_mensaje: t,
        p_session_token: sessionToken,
        p_entrega_id: null,
        p_conductor_id: null,
      });
      if (!error && data?.status === "ok") {
        if (entrega?.id) {
          await supabaseTaxi
            .channel(canalEntrega(entrega.id))
            .send({ type: "broadcast", event: "mensaje", payload: { hilo } })
            .catch(() => {});
        }
        await cargar();
        return { error: null };
      }
      return { error: error || new Error(data?.status || "No se pudo enviar") };
    },
    [sessionToken, rol, entrega?.id, cargar]
  );

  return { entrega, mensajes, ofertas, loading, recargar: cargar, ofertar, cancelar, enviarMensaje, marcarLeido };
}
