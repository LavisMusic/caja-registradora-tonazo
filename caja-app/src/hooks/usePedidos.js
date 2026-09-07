import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

// Gestor de Pedidos (Fase 1): carga los pedidos de UNA sucursal (mismo
// criterio de aislamiento que ya usa el resto de la app — un cajero
// nunca debe ver pedidos de otra sucursal, ver RLS de 'pedidos' en la
// migración de import de esquema) junto con sus líneas
// ('pedido_items', vía embedding de Supabase igual que gastos/
// gasto_items en App.jsx), y se mantiene sincronizado en tiempo real.
//
// Sin 'sucursalId' (admin que todavía no eligió sucursal activa) no
// hay de dónde filtrar — se deja la lista vacía a propósito, mismo
// criterio que useCatalog con el stock.
export function usePedidos(sucursalId) {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!sucursalId) {
      setPedidos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error: loadError } = await supabase
      .from("pedidos")
      .select("*, pedido_items(*)")
      .eq("sucursal_id", sucursalId)
      .order("created_at", { ascending: false });

    if (loadError) {
      console.error("[usePedidos] Error cargando pedidos:", loadError);
      setError("No se pudieron cargar los pedidos.");
    } else {
      setError("");
    }

    setPedidos(
      (data || []).map((row) => ({
        id: row.id,
        clienteId: row.cliente_id,
        sucursalId: row.sucursal_id,
        estado: row.estado,
        metodoPago: row.metodo_pago,
        montoRecibido: row.monto_recibido != null ? Number(row.monto_recibido) : null,
        vuelto: row.vuelto != null ? Number(row.vuelto) : null,
        total: Number(row.total),
        createdAt: row.created_at,
        items: (row.pedido_items || []).map((it) => ({
          id: it.id,
          productoId: it.producto_id,
          nombre: it.nombre,
          cantidad: Number(it.cantidad),
          precioUnitario: Number(it.precio_unitario),
          subtotal: Number(it.subtotal),
          ventaPorPeso: !!it.venta_por_peso,
        })),
      }))
    );
    setLoading(false);
  }, [sucursalId]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: cualquier cambio en 'pedidos' de ESTA sucursal (nuevo
  // pedido del cliente, cambio de estado) o en 'pedido_items' (no tiene
  // columna sucursal_id propia — se escucha sin filtro y se deja que el
  // debounce dispare un refetch completo, igual criterio que useCatalog
  // con 'inventario_sucursales') dispara un refetch.
  useEffect(() => {
    if (!sucursalId) return undefined;

    let debounceTimer = null;
    const scheduleReload = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(load, 400);
    };

    const channel = supabase
      .channel(`pedidos-realtime-${sucursalId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos", filter: `sucursal_id=eq.${sucursalId}` },
        scheduleReload
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "pedido_items" }, scheduleReload)
      .subscribe((status, err) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("[usePedidos] Realtime no se pudo conectar:", status, err || "");
        }
      });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [sucursalId, load]);

  return { pedidos, loading, error, refetch: load };
}
