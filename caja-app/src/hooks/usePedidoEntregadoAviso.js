import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";

// Celebración "¡Pedido entregado!" del cliente (fase C): cuando uno de sus
// pedidos online pasa a 'confirmado' (entregado por el repartidor o
// retirado en la tienda) —aunque haya pasado con la app cerrada—, se
// festeja una vez al volver a la tienda o al directorio. Después el
// contador de créditos anima los puntos que le dio esa compra. Lo ya
// festejado se recuerda por cliente en este navegador.
const DIAS_ATRAS = 7;
const CAPAS_ENCIMA = ".tz-modal-backdrop, .tz-exito-overlay, .tz-neon-bienvenida-overlay";
const claveDe = (clienteId) => `tz-pedidos-festejados-${clienteId}`;

function leer(clave) {
  try {
    const v = window.localStorage.getItem(clave);
    return v == null ? null : new Set(JSON.parse(v));
  } catch {
    return null;
  }
}
function guardar(clave, ids) {
  try {
    window.localStorage.setItem(clave, JSON.stringify([...ids].slice(-200)));
  } catch {
    // Sin almacenamiento: a lo sumo se repite un festejo.
  }
}

// Mis Pedidos festeja la entrega que el cliente confirma ahí mismo: la
// marca para que la tienda no la vuelva a festejar.
export function marcarPedidoFestejado(clienteId, pedidoId) {
  if (!clienteId || !pedidoId) return;
  const vistos = leer(claveDe(clienteId)) ?? new Set();
  vistos.add(pedidoId);
  guardar(claveDe(clienteId), vistos);
}

export function usePedidoEntregadoAviso(clienteId) {
  const [pedido, setPedido] = useState(null);
  // Pedido por festejar, esperando a que no haya nada encima de la tienda.
  const [candidato, setCandidato] = useState(null);
  const candidatoRef = useRef(null);
  candidatoRef.current = candidato;
  const clave = clienteId ? claveDe(clienteId) : null;

  const revisar = useCallback(async () => {
    if (!clave) return;
    const desde = new Date(Date.now() - DIAS_ATRAS * 86400000).toISOString();
    const { data, error } = await supabase
      .from("pedidos")
      .select("id, total, requiere_delivery")
      .eq("cliente_id", clienteId)
      .eq("estado", "confirmado")
      .gte("created_at", desde);
    if (error || !data) return;
    const vistos = leer(clave);
    if (!vistos) {
      // Primera vez en este navegador: lo anterior no se festeja.
      guardar(clave, new Set(data.map((p) => p.id)));
      return;
    }
    const nuevo = data.find((p) => !vistos.has(p.id));
    if (nuevo && !candidatoRef.current) setCandidato(nuevo);
  }, [clienteId, clave]);

  // Se muestra recién sin modales ni otras animaciones encima, y solo si
  // nadie lo festejó mientras tanto.
  useEffect(() => {
    if (!candidato || !clave) return undefined;
    let pendiente = 0;
    const intentar = () => {
      pendiente = 0;
      if (document.visibilityState !== "visible" || document.querySelector(CAPAS_ENCIMA)) return;
      const vistos = leer(clave) ?? new Set();
      if (!vistos.has(candidato.id)) {
        vistos.add(candidato.id);
        guardar(clave, vistos);
        setPedido(candidato);
      }
      setCandidato(null);
    };
    const programar = () => {
      if (!pendiente) pendiente = requestAnimationFrame(intentar);
    };
    const obs = new MutationObserver(programar);
    obs.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("visibilitychange", programar);
    programar();
    return () => {
      obs.disconnect();
      document.removeEventListener("visibilitychange", programar);
      if (pendiente) cancelAnimationFrame(pendiente);
    };
  }, [candidato, clave]);

  useEffect(() => {
    if (!clave) return undefined;
    revisar();
    const channel = supabase
      .channel(`pedido-entregado-${clienteId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "pedidos", filter: `cliente_id=eq.${clienteId}` },
        ({ new: fila }) => {
          if (fila?.estado === "confirmado") revisar();
        }
      )
      .subscribe();
    const alVolver = () => {
      if (document.visibilityState === "visible") revisar();
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      document.removeEventListener("visibilitychange", alVolver);
      supabase.removeChannel(channel);
    };
  }, [clienteId, clave, revisar]);

  const cerrar = useCallback(() => {
    setPedido(null);
    // Si quedó otro pendiente, aparece después de este.
    setTimeout(revisar, 300);
  }, [revisar]);

  return { pedido, cerrar };
}
