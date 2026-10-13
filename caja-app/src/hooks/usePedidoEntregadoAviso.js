import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

// Celebración "¡Pedido entregado!" del cliente (fase C): cuando uno de sus
// pedidos online pasa a 'confirmado' (entregado por el repartidor o
// retirado en la tienda) —aunque haya pasado con la app cerrada—, se
// festeja una vez al volver a la tienda o al directorio. Después el
// contador de créditos anima los puntos que le dio esa compra. Lo ya
// festejado se recuerda por cliente en este navegador.
const DIAS_ATRAS = 7;

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

export function usePedidoEntregadoAviso(clienteId) {
  const [pedido, setPedido] = useState(null);
  const clave = clienteId ? `tz-pedidos-festejados-${clienteId}` : null;

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
    if (!nuevo) return;
    vistos.add(nuevo.id);
    guardar(clave, vistos);
    setPedido((actual) => actual ?? nuevo);
  }, [clienteId, clave]);

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
