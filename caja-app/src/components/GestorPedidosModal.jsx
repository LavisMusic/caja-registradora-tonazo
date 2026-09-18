import { useEffect, useRef, useState } from "react";
import { X, MessageCircle, Check, Ban, Copy, Loader2, AlertTriangle, Bike, Store, Trash2 } from "lucide-react";
import { supabase } from "../supabaseClient";
import { supabaseTaxi } from "../lib/supabaseTaxi";
import { usePedidos } from "../hooks/usePedidos";
import { usePedidosNoLeidos } from "../hooks/usePedidosNoLeidos";
import ChatPedidoModal from "./ChatPedidoModal";
import EntregaCajaModal from "./delivery/EntregaCajaModal";
import TicketBoleta from "./TicketBoleta";
import { formatSoles, formatDate, formatTime } from "../utils/format";
import { buildWhatsappLink } from "../lib/whatsapp";
import { copiarBoletaAlPortapapeles } from "../lib/boleta";
import { iniciarEntrega } from "../lib/entregaIniciar";

const ESTADO_LABELS = {
  nuevo: "Nuevo",
  en_atencion: "En atención",
  confirmado: "Entregado",
  cancelado: "Cancelado",
};

// Agrupa el 'estado' del pedido en los 3 baldes del filtro secundario
// del Gestor — "en carrera" (activo, todavía sin cerrar) junta 'nuevo'
// y 'en_atencion' porque para el admin ambos son "esto sigue en curso".
function estadoGrupo(pedido) {
  if (pedido.estado === "confirmado") return "entregado";
  if (pedido.estado === "cancelado") return "cancelado";
  return "en_carrera";
}

const METODO_LABELS = {
  YAPE: "Yape",
  PLIN: "Plin",
  OTROS: "Otros",
  EFECTIVO: "Efectivo",
  FIADO: "Fiado",
};

// Gestor de Pedidos (Fase 1): modal en la cabecera de admin/cajero que
// lista los pedidos hechos por clientes desde la tienda pública,
// filtrados por la sucursal operativa (misma que ya usa el resto de la
// app — RLS además lo garantiza del lado del servidor). El punto
// celeste antes de cada fila marca que es un chat de un CLIENTE de la
// tienda (a futuro, cuando existan chats de conductores en este mismo
// modal, ese punto es lo que los va a distinguir).
export default function GestorPedidosModal({
  sucursalId,
  cajaId,
  vendedorLabel,
  onVentaRegistrada,
  resolverItemPedido,
  onClose,
}) {
  const { pedidos, loading, error, refetch } = usePedidos(sucursalId);
  const [clientesInfo, setClientesInfo] = useState({}); // { [authUserId]: {nombre, whatsapp} }
  const [chatPedido, setChatPedido] = useState(null);
  const [procesandoId, setProcesandoId] = useState(null);
  const [accionError, setAccionError] = useState("");
  const [entregaModal, setEntregaModal] = useState(null); // { sessionToken, telefono }
  const [asignandoId, setAsignandoId] = useState(null);
  const [filtro, setFiltro] = useState("retirar"); // 'retirar' | 'repartir'
  // Filtro secundario, debajo de Para retirar/Para repartir — por
  // estado, para no tener que scrollear toda la lista buscando un
  // pedido puntual. null = sin filtrar (todos).
  const [filtroEstado, setFiltroEstado] = useState(null); // 'en_carrera' | 'entregado' | 'cancelado' | null
  const [comprobanteVer, setComprobanteVer] = useState(null); // url
  // Sucursal que el cliente eligió al hacer el pedido — es la misma
  // 'sucursalId' operativa del cajero (los pedidos ya vienen filtrados
  // por ella), pero se muestra igual en cada tarjeta a pedido explícito
  // (contexto rápido sin tener que mirar la cabecera).
  const [sucursalNombre, setSucursalNombre] = useState("");
  useEffect(() => {
    if (!sucursalId) {
      setSucursalNombre("");
      return;
    }
    let active = true;
    supabase
      .from("sucursales")
      .select("nombre")
      .eq("id", sucursalId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setSucursalNombre(data?.nombre || "");
      });
    return () => {
      active = false;
    };
  }, [sucursalId]);
  const { counts: noLeidos, refrescar: refrescarNoLeidos } = usePedidosNoLeidos(
    pedidos.map((p) => p.id),
    "cajero"
  );

  // ChatPedidoModal marca los mensajes como leídos al abrirse; acá solo
  // refrescamos el contador al cerrar.
  const cerrarChat = () => {
    refrescarNoLeidos();
    setChatPedido(null);
  };
  const [boletaPedido, setBoletaPedido] = useState(null);
  const [boletaExtra, setBoletaExtra] = useState(null); // { sede, entrega }
  const boletaRef = useRef(null);
  // Ventana de WhatsApp: se ABRE EN BLANCO acá, de forma SÍNCRONA dentro
  // del click (ver el botón "Copiar boleta y WhatsApp" más abajo) — es
  // lo único que hace que el navegador la trate como resultado directo
  // de un toque del usuario. Recién más tarde, cuando termina el
  // trabajo async (copiar la imagen, etc.), se la redirige con
  // `.location.href`. Si se llamara a `window.open(link)` DESPUÉS de un
  // `await`, el celular (sobre todo mobile Chrome) lo bloquea como
  // popup — funcionaba en desktop por pura tolerancia del navegador,
  // nunca en mobile.
  const whatsappWinRef = useRef(null);

  // La reversión de la venta de un pedido cancelado (repone stock + borra
  // 'historial') vive en App.jsx — corre mientras el admin tenga la app
  // abierta, no solo con este modal abierto. Ver DELIVERY.md §5.

  // Nombre/whatsapp del cliente de cada pedido: 'pedidos.cliente_id' es
  // el auth.users.id (mismo que usa la sesión de Supabase Auth del
  // cliente) — se resuelve contra 'clientes_fiado.auth_user_id', igual
  // patrón que ClienteFiadoView.jsx usa a la inversa.
  useEffect(() => {
    const ids = [...new Set(pedidos.map((p) => p.clienteId).filter(Boolean))];
    if (ids.length === 0) return;
    let active = true;
    supabase
      .from("clientes_fiado")
      .select("auth_user_id, nombre, whatsapp")
      .in("auth_user_id", ids)
      .then(({ data, error: err }) => {
        if (!active) return;
        if (err) {
          console.error("[GestorPedidosModal] Error cargando datos de clientes:", err);
          return;
        }
        const map = {};
        (data || []).forEach((row) => {
          map[row.auth_user_id] = { nombre: row.nombre, whatsapp: row.whatsapp };
        });
        setClientesInfo(map);
      });
    return () => {
      active = false;
    };
  }, [pedidos]);

  // Correlativo V-000X para el pedido — mismo formato que las ventas
  // normales del POS. Se calcula una vez y se congela en el pedido, así
  // un reintento (p.ej. si falló el update de estado) reusa el mismo
  // número en vez de quemar otro.
  const resolverPurchaseId = async (pedido) => {
    if (pedido.ventaPurchaseId) return { code: pedido.ventaPurchaseId, error: null };

    const { data: code, error: corrError } = await supabase.rpc("rpc_siguiente_correlativo_venta");
    if (corrError || !code) return { code: null, error: corrError || new Error("No se pudo generar el correlativo.") };

    // Reclama el número con guarda por si dos confirmaciones corren a la
    // vez: solo lo escribe quien lo encuentra en null; el que pierde
    // relee y usa el que quedó guardado.
    const { data: claimed, error: claimError } = await supabase
      .from("pedidos")
      .update({ venta_purchase_id: code })
      .eq("id", pedido.id)
      .is("venta_purchase_id", null)
      .select("venta_purchase_id");
    if (claimError) return { code: null, error: claimError };
    if (claimed && claimed.length) return { code: claimed[0].venta_purchase_id, error: null };

    const { data: existing, error: readError } = await supabase
      .from("pedidos")
      .select("venta_purchase_id")
      .eq("id", pedido.id)
      .single();
    if (readError || !existing?.venta_purchase_id) {
      return { code: null, error: readError || new Error("No se pudo asignar el correlativo.") };
    }
    return { code: existing.venta_purchase_id, error: null };
  };

  // Registra la venta (descuenta stock, suma a métricas del día) — una
  // sola vez por pedido: en el RETIRO se hace al ACEPTAR la petición
  // (pago ya verificado); en DELIVERY se hace al confirmar la entrega.
  const registrarVentaPedido = async (pedido) => {
    const { code, error: idError } = await resolverPurchaseId(pedido);
    if (idError) return { error: idError };
    return supabase.rpc("registrar_venta", {
      p_purchase_id: code,
      p_items: pedido.items.map((it) => {
        // nombre/detalle CANÓNICOS del catálogo + costo real — así
        // revertirVenta (que matchea por nombre+detalle) puede encontrar
        // los 'consumes' y reponer stock si el pedido se cancela. Sin
        // costo, la Ganancia Neta contaría el precio de venta entero.
        const r = resolverItemPedido ? resolverItemPedido(it) : {};
        const cu = r.costoUnitario != null ? r.costoUnitario : null;
        return {
          producto_id: it.productoId,
          nombre: r.nombre || it.nombre,
          detalle: r.detalle || "",
          cantidad: it.cantidad,
          precio: it.precioUnitario,
          total: it.subtotal,
          costo_unitario: cu,
          costo_total: cu != null ? cu * it.cantidad : null,
          venta_por_peso: it.ventaPorPeso,
        };
      }),
      p_metodo_pago: pedido.metodoPago,
      p_vendedor: vendedorLabel,
      p_fecha: Date.now(),
      p_monto_recibido: pedido.montoRecibido,
      p_vuelto: pedido.vuelto,
      p_ruc: null,
      p_caja_id: cajaId,
      p_sucursal_id: sucursalId,
    });
  };

  // Cobro del repartidor: al recoger el pedido paga en el mostrador y esa
  // plata es una venta más del día (DELIVERY.md §5). Se dispara desde el
  // Gestor cuando la entrega ya está en_ruta/entregado y todavía no se
  // cobró (venta_purchase_id nulo). Reusa registrarVentaPedido, que
  // congela el correlativo V-000X en el pedido.
  const cobrarRecojo = async (pedido) => {
    setAccionError("");
    setProcesandoId(pedido.id);
    try {
      const { error: rpcError } = await registrarVentaPedido(pedido);
      if (rpcError) throw rpcError;
      onVentaRegistrada?.();
      await supabase.from("pedido_mensajes").insert([
        {
          pedido_id: pedido.id,
          remitente: "sistema",
          mensaje: "💵 La tienda registró el pago del repartidor por tu pedido.",
        },
      ]);
      refetch();
    } catch (err) {
      console.error("[GestorPedidosModal] Error cobrando recojo:", err);
      setAccionError(err?.message || "No se pudo registrar el cobro del repartidor.");
    } finally {
      setProcesandoId(null);
    }
  };

  const confirmarEntrega = async (pedido) => {
    setAccionError("");
    setProcesandoId(pedido.id);
    try {
      // Retiro en tienda → la venta ya se registró al aceptar la petición.
      // Delivery → la venta se registra con "Confirmar recojo y cobro"
      // (cobrarRecojo) y el cierre lo hace el webhook del repartidor; este
      // botón queda solo como cierre manual de respaldo.
      const { error: updateError } = await supabase
        .from("pedidos")
        .update({ estado: "confirmado" })
        .eq("id", pedido.id);
      if (updateError) throw updateError;

      await supabase.from("pedido_mensajes").insert([
        {
          pedido_id: pedido.id,
          remitente: "sistema",
          mensaje: "✅ Tu pedido fue entregado. ¡Gracias por tu compra!",
        },
      ]);

      refetch();
    } catch (err) {
      console.error("[GestorPedidosModal] Error confirmando entrega:", err);
      setAccionError(err?.message || "No se pudo registrar la venta. Intenta de nuevo.");
    } finally {
      setProcesandoId(null);
    }
  };

  // Delivery: crea (o reabre) la sesión de entrega en Taxi-PE y abre el
  // modal de asignación. La dirección/ubicación ya viene en el pedido
  // (la puso el cliente al hacer el pedido) — el admin solo asigna un
  // repartidor, no re-ingresa nada. Ver DELIVERY.md §7.
  const asignarRepartidor = async (pedido) => {
    const cliente = clientesInfo[pedido.clienteId];
    const telefono = pedido.contactoTelefono || cliente?.whatsapp || "";

    // Ya tiene sesión → solo reabrir.
    if (pedido.entregaSessionToken) {
      setEntregaModal({ sessionToken: pedido.entregaSessionToken, telefono });
      return;
    }

    setAccionError("");
    setAsignandoId(pedido.id);
    try {
      // Coordenadas de origen = la sucursal (punto A). Las fija el admin
      // en el Gestor de Cajas (sucursales.lat/lng).
      const { data: suc } = await supabase
        .from("sucursales")
        .select("nombre, lat, lng")
        .eq("id", sucursalId)
        .single();

      const res = await iniciarEntrega({
        caja_pedido_ref: pedido.id,
        sucursal: suc?.nombre || sucursalId,
        cliente_nombre: pedido.contactoNombre || cliente?.nombre || "Cliente",
        cliente_telefono: telefono,
        direccion_entrega: pedido.direccionEntrega || "",
        entrega_lat: pedido.entregaLat,
        entrega_lng: pedido.entregaLng,
        origen_lat: suc?.lat ?? null,
        origen_lng: suc?.lng ?? null,
        items: pedido.items.map((it) => ({ nombre: it.nombre, cantidad: it.cantidad })),
        total: pedido.total,
      });

      const { error: updErr } = await supabase
        .from("pedidos")
        .update({
          requiere_delivery: true,
          entrega_id: res.entrega_id,
          entrega_session_token: res.session_token,
          entrega_pin: res.pin,
        })
        .eq("id", pedido.id);
      if (updErr) throw updErr;

      refetch();
      setEntregaModal({ sessionToken: res.session_token, telefono });
    } catch (err) {
      console.error("[GestorPedidosModal] Error asignando repartidor:", err);
      setAccionError(err?.message || "No se pudo iniciar la entrega.");
    } finally {
      setAsignandoId(null);
    }
  };

  // "Eliminar del historial" solo lo saca de la vista de la CAJA — el
  // cliente sigue viéndolo en el suyo (y viceversa). Ver 0059_pedidos_ocultar.
  const eliminarPedido = async (pedido) => {
    if (!confirm("¿Sacar este pedido de tu historial? (El cliente lo seguirá viendo en el suyo.)")) return;
    setAccionError("");
    setProcesandoId(pedido.id);
    const { error: updErr } = await supabase.from("pedidos").update({ oculto_caja: true }).eq("id", pedido.id);
    if (updErr) {
      console.error("[GestorPedidosModal] Error ocultando pedido:", updErr);
      setAccionError(updErr.message || "No se pudo quitar el pedido del historial.");
    } else {
      refetch();
    }
    setProcesandoId(null);
  };

  // Retiro en tienda: verificar el comprobante y aceptar/rechazar la
  // petición. Al ACEPTAR se registra la venta (descuenta stock, suma a
  // las métricas del día) — el pago ya está verificado.
  const resolverRetiro = async (pedido, aceptar) => {
    setAccionError("");
    setProcesandoId(pedido.id);
    try {
      if (aceptar) {
        const { error: rpcError } = await registrarVentaPedido(pedido);
        if (rpcError) throw rpcError; // p.ej. stock insuficiente → no se acepta
        onVentaRegistrada?.(); // refresca historial/stock/métricas en App
      }
      const nuevoEstado = aceptar ? "en_atencion" : "cancelado";
      const { error } = await supabase.from("pedidos").update({ estado: nuevoEstado }).eq("id", pedido.id);
      if (error) throw error;

      await supabase.from("pedido_mensajes").insert([
        {
          pedido_id: pedido.id,
          remitente: "sistema",
          mensaje: aceptar
            ? "✅ La tienda confirmó tu pago. Estamos preparando tu pedido para el retiro."
            : "❌ La tienda no pudo verificar tu comprobante. El pedido fue cancelado.",
        },
      ]);
      refetch();
    } catch (err) {
      console.error("[GestorPedidosModal] Error resolviendo retiro:", err);
      setAccionError(err?.message || "No se pudo procesar la petición.");
    } finally {
      setProcesandoId(null);
    }
  };

  const cancelarPedido = async (pedido) => {
    setAccionError("");
    setProcesandoId(pedido.id);
    const { error: updateError } = await supabase
      .from("pedidos")
      .update({ estado: "cancelado" })
      .eq("id", pedido.id);
    if (updateError) {
      console.error("[GestorPedidosModal] Error cancelando pedido:", updateError);
      setAccionError("No se pudo cancelar el pedido.");
    } else {
      await supabase.from("pedido_mensajes").insert([
        { pedido_id: pedido.id, remitente: "sistema", mensaje: "❌ El pedido fue cancelado." },
      ]);
      refetch();
    }
    setProcesandoId(null);
  };

  // Copiar boleta + abrir WhatsApp: monta TicketBoleta oculto con los
  // datos de ESTE pedido, espera a que pinte, la copia al portapapeles
  // y recién ahí abre el chat de WhatsApp del cliente — mismo patrón de
  // "copiar y pegar a mano" que ya usa App.jsx (wa.me no admite adjuntar
  // una imagen directo).
  useEffect(() => {
    if (!boletaPedido) return;
    const cliente = clientesInfo[boletaPedido.clienteId];
    let alive = true;
    (async () => {
      const extra = { sede: "", entrega: null };
      try {
        if (boletaPedido.sucursalId) {
          const { data: suc } = await supabase
            .from("sucursales")
            .select("nombre")
            .eq("id", boletaPedido.sucursalId)
            .maybeSingle();
          if (suc?.nombre) extra.sede = suc.nombre;
        }
        if (boletaPedido.entregaSessionToken) {
          const { data: est } = await supabaseTaxi.rpc("rpc_entrega_estado", {
            p_session_token: boletaPedido.entregaSessionToken,
          });
          const e = Array.isArray(est) ? est[0] : est;
          if (e) {
            extra.entrega = {
              repartidor: e.conductor_nombre || "",
              direccion: e.direccion_entrega || boletaPedido.direccionEntrega || "",
              tarifa: e.tarifa != null ? Number(e.tarifa) : null,
            };
            if (e.caja_sucursal && !extra.sede) extra.sede = e.caja_sucursal;
          }
        } else if (boletaPedido.requiereDelivery) {
          extra.entrega = { repartidor: "", direccion: boletaPedido.direccionEntrega || "" };
        }
      } catch {
        /* la boleta igual sale sin esos datos */
      }
      if (!alive) return;
      setBoletaExtra(extra);
      await new Promise((r) => setTimeout(r, 60));
      if (!alive) return;
      try {
        const res = await copiarBoletaAlPortapapeles(boletaRef);
        if (res?.descargado) {
          setAccionError("Este navegador no deja copiar la imagen — se descargó la boleta. Adjuntala en el chat.");
        }
        const link = buildWhatsappLink(
          cliente?.whatsapp,
          "Atento tu pedido está en camino! Aquí está tu boleta"
        );
        const win = whatsappWinRef.current;
        if (link) {
          if (win && !win.closed) win.location.href = link;
          else window.open(link, "_blank");
        } else {
          if (win && !win.closed) win.close();
          if (!res?.descargado) setAccionError("Este cliente no tiene un WhatsApp válido registrado.");
        }
      } catch (err) {
        console.error("[GestorPedidosModal] Error copiando boleta:", err);
        setAccionError(err?.message || "No se pudo generar la boleta.");
        if (whatsappWinRef.current && !whatsappWinRef.current.closed) whatsappWinRef.current.close();
      } finally {
        whatsappWinRef.current = null;
        if (alive) {
          setBoletaPedido(null);
          setBoletaExtra(null);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [boletaPedido, clientesInfo]);

  const pedidosVisibles = pedidos
    .filter((p) => (filtro === "repartir" ? p.requiereDelivery : !p.requiereDelivery))
    .filter((p) => !filtroEstado || estadoGrupo(p) === filtroEstado);

  return (
    <div className="tz-modal-backdrop">
      <div className="tz-modal tz-modal-wide" onClick={(e) => e.stopPropagation()}>
        <button className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <h2>Gestor de Pedidos</h2>

        {accionError && (
          <p className="tz-error">
            <AlertTriangle size={14} /> {accionError}
          </p>
        )}

        <div className="tz-gasto-tipo-buttons" style={{ margin: "6px 0 12px" }}>
          {[
            ["retirar", "Para retirar", Store, pedidos.filter((p) => !p.requiereDelivery && ["nuevo", "en_atencion"].includes(p.estado)).length],
            ["repartir", "Para repartir", Bike, pedidos.filter((p) => p.requiereDelivery && ["nuevo", "en_atencion"].includes(p.estado)).length],
          ].map(([k, txt, Icono, n]) => (
            <button
              key={k}
              type="button"
              className={`tz-gasto-tipo-btn ${filtro === k ? "tz-gasto-tipo-active" : ""}`}
              onClick={() => setFiltro(k)}
            >
              <Icono size={14} /> {txt}{n > 0 ? ` (${n})` : ""}
            </button>
          ))}
        </div>

        <div className="tz-gasto-tipo-buttons" style={{ margin: "0 0 12px", gap: 6 }}>
          {[
            ["en_carrera", "En carrera"],
            ["entregado", "Entregado"],
            ["cancelado", "Cancelado"],
          ].map(([k, txt]) => (
            <button
              key={k}
              type="button"
              className={`tz-filtro-estado-chip tz-filtro-estado-chip-${k} ${
                filtroEstado === k ? "tz-filtro-estado-chip-activo" : ""
              }`}
              onClick={() => setFiltroEstado((prev) => (prev === k ? null : k))}
            >
              {txt}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="tz-stock-editor-sub">
            <Loader2 className="tz-spin" size={16} /> Cargando pedidos...
          </p>
        ) : error ? (
          <p className="tz-error">{error}</p>
        ) : pedidosVisibles.length === 0 ? (
          <p className="tz-stock-editor-sub">
            {filtroEstado
              ? "Ningún pedido coincide con ese filtro."
              : filtro === "repartir"
              ? "No hay pedidos para repartir."
              : "No hay pedidos para retirar en tienda."}
          </p>
        ) : (
          <div className="tz-pedidos-list">
            {pedidosVisibles
              .map((pedido) => {
              const cliente = clientesInfo[pedido.clienteId];
              const procesando = procesandoId === pedido.id;
              const activo = pedido.estado === "nuevo" || pedido.estado === "en_atencion";
              const enProceso = pedido.estado === "nuevo" || pedido.estado === "en_atencion";
              const esPeticionRetiro = !pedido.requiereDelivery && pedido.estado === "nuevo";

              if (esPeticionRetiro) {
                return (
                  <div key={pedido.id} className="tz-pedido-card tz-peticion-card">
                    <div className="tz-pedido-card-head">
                      <span className="tz-peticion-badge">Petición de retiro</span>
                      <span className="tz-pedido-cliente-nombre">{cliente?.nombre || "Cliente"}</span>
                    </div>
                    <div className="tz-pedido-card-meta">
                      {formatDate(pedido.createdAt)} {formatTime(pedido.createdAt)} ·{" "}
                      {METODO_LABELS[pedido.metodoPago] || pedido.metodoPago} · Total {formatSoles(pedido.total)}
                    </div>
                    <ul className="tz-pedido-items-list">
                      {pedido.items.map((it) => (
                        <li key={it.id}>{it.cantidad}x {it.nombre} — {formatSoles(it.subtotal)}</li>
                      ))}
                    </ul>
                    {pedido.comprobanteUrl ? (
                      <button type="button" className="tz-peticion-comprobante" onClick={() => setComprobanteVer(pedido.comprobanteUrl)}>
                        <img src={pedido.comprobanteUrl} alt="Comprobante de pago" />
                        <span>Ver comprobante</span>
                      </button>
                    ) : (
                      <p className="tz-error"><AlertTriangle size={13} /> Sin comprobante adjunto.</p>
                    )}
                    <div className="tz-pedido-card-actions">
                      <button
                        type="button"
                        className="tz-pedido-action-btn tz-pedido-action-confirmar"
                        onClick={() => resolverRetiro(pedido, true)}
                        disabled={procesando}
                      >
                        {procesando ? <Loader2 size={14} className="tz-spin" /> : <Check size={14} />} Aceptar
                      </button>
                      <button
                        type="button"
                        className="tz-pedido-action-btn tz-pedido-action-cancelar"
                        onClick={() => resolverRetiro(pedido, false)}
                        disabled={procesando}
                      >
                        <Ban size={14} /> Rechazar
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={pedido.id} className="tz-pedido-card">
                  <div className="tz-pedido-card-head">
                    <span className={`tz-chat-dot ${activo ? "tz-chat-dot-activo" : ""}`} />
                    <span className="tz-pedido-cliente-nombre tz-pedido-cliente-nombre-fijo">
                      {cliente?.nombre || "Cliente"}
                    </span>
                    <div className="tz-pedido-card-tags">
                      {sucursalNombre && (
                        <span className="tz-pedido-sucursal-tag">{sucursalNombre}</span>
                      )}
                      <span className={`tz-pedido-modo-tag ${pedido.requiereDelivery ? "tz-pedido-modo-delivery" : "tz-pedido-modo-tienda"}`}>
                        {pedido.requiereDelivery ? <Bike size={12} /> : <Store size={12} />}
                        {pedido.requiereDelivery ? "Delivery" : "Retiro en tienda"}
                      </span>
                      <span className={`tz-pedido-estado tz-pedido-estado-${pedido.estado}`}>
                        {ESTADO_LABELS[pedido.estado] || pedido.estado}
                      </span>
                    </div>
                  </div>
                  <div className="tz-pedido-card-meta">
                    {formatDate(pedido.createdAt)} {formatTime(pedido.createdAt)} ·{" "}
                    {METODO_LABELS[pedido.metodoPago] || pedido.metodoPago}
                    {pedido.metodoPago === "EFECTIVO" && pedido.montoRecibido != null && (
                      <> · Paga con {formatSoles(pedido.montoRecibido)} (vuelto {formatSoles(pedido.vuelto || 0)})</>
                    )}
                  </div>
                  <ul className="tz-pedido-items-list">
                    {pedido.items.map((it) => (
                      <li key={it.id}>
                        {it.cantidad}x {it.nombre} — {formatSoles(it.subtotal)}
                      </li>
                    ))}
                  </ul>
                  <div className="tz-pedido-card-total">Total: {formatSoles(pedido.total)}</div>

                  <div className="tz-pedido-card-actions">
                    {pedido.estado !== "confirmado" && pedido.estado !== "cancelado" && (
                      <button
                        type="button"
                        className="tz-pedido-action-btn"
                        style={{ position: "relative" }}
                        onClick={() => setChatPedido(pedido)}
                      >
                        <MessageCircle size={14} /> Ver chat
                        {noLeidos[pedido.id] > 0 && (
                          <span className="tz-badge-dot">{noLeidos[pedido.id] > 9 ? "9+" : noLeidos[pedido.id]}</span>
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      className="tz-pedido-action-btn"
                      onClick={() => {
                        whatsappWinRef.current = window.open("", "_blank");
                        setBoletaPedido(pedido);
                      }}
                      disabled={boletaPedido?.id === pedido.id}
                    >
                      <Copy size={14} /> Copiar boleta y WhatsApp
                    </button>
                    {pedido.requiereDelivery && (activo || pedido.entregaSessionToken) && (
                      <button
                        type="button"
                        className="tz-pedido-action-btn"
                        onClick={() => asignarRepartidor(pedido)}
                        disabled={asignandoId === pedido.id}
                      >
                        {asignandoId === pedido.id ? <Loader2 size={14} className="tz-spin" /> : <Bike size={14} />}
                        {pedido.entregaSessionToken ? "Ver entrega" : "Asignar repartidor"}
                      </button>
                    )}
                    {pedido.requiereDelivery &&
                      !pedido.ventaPurchaseId &&
                      ["en_ruta", "entregado"].includes(pedido.entregaEstado) &&
                      pedido.estado !== "cancelado" && (
                        <button
                          type="button"
                          className="tz-pedido-action-btn tz-pedido-action-confirmar"
                          onClick={() => cobrarRecojo(pedido)}
                          disabled={procesando}
                        >
                          {procesando ? <Loader2 size={14} className="tz-spin" /> : <Check size={14} />}
                          Confirmar recojo y cobro
                        </button>
                      )}
                    {activo && (
                      <>
                        {!(pedido.requiereDelivery && pedido.entregaSessionToken) && (
                          <button
                            type="button"
                            className="tz-pedido-action-btn tz-pedido-action-confirmar"
                            onClick={() => confirmarEntrega(pedido)}
                            disabled={procesando}
                          >
                            {procesando ? <Loader2 size={14} className="tz-spin" /> : <Check size={14} />}
                            Confirmar entregado
                          </button>
                        )}
                        <button
                          type="button"
                          className="tz-pedido-action-btn tz-pedido-action-cancelar"
                          onClick={() => cancelarPedido(pedido)}
                          disabled={procesando}
                        >
                          <Ban size={14} /> Cancelar
                        </button>
                      </>
                    )}
                    {!enProceso && (
                      <button
                        type="button"
                        className="tz-pedido-action-btn tz-pedido-action-cancelar"
                        onClick={() => eliminarPedido(pedido)}
                        disabled={procesando}
                      >
                        {procesando ? <Loader2 size={14} className="tz-spin" /> : <Trash2 size={14} />}
                        Eliminar del historial
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {comprobanteVer && (
        <div className="tz-modal-backdrop" style={{ zIndex: 80 }} onClick={() => setComprobanteVer(null)}>
          <div className="tz-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420, textAlign: "center" }}>
            <button className="tz-modal-close" onClick={() => setComprobanteVer(null)} aria-label="Cerrar">
              <X size={18} />
            </button>
            <h2>Comprobante de pago</h2>
            <img src={comprobanteVer} alt="Comprobante" style={{ width: "100%", borderRadius: 10, marginTop: 8 }} />
          </div>
        </div>
      )}

      {chatPedido && (
        <ChatPedidoModal
          pedidoId={chatPedido.id}
          remitentePropio="cajero"
          tituloChat={`Chat con ${clientesInfo[chatPedido.clienteId]?.nombre || "cliente"}`}
          onClose={cerrarChat}
        />
      )}

      {entregaModal && (
        <EntregaCajaModal
          sessionToken={entregaModal.sessionToken}
          rol="cajero"
          esAdmin
          telefonoCliente={entregaModal.telefono}
          onClose={() => {
            setEntregaModal(null);
            refetch();
          }}
        />
      )}

      {boletaPedido && (
        <div style={{ position: "fixed", top: 0, left: "-9999px" }}>
          <div ref={boletaRef}>
            <TicketBoleta
              orden={{
                id: boletaPedido.id.slice(0, 8),
                fecha: formatDate(boletaPedido.createdAt),
                hora: formatTime(boletaPedido.createdAt),
                cajero: vendedorLabel,
              }}
              cliente={{ nombre: clientesInfo[boletaPedido.clienteId]?.nombre || "" }}
              sede={boletaExtra?.sede || ""}
              entrega={boletaExtra?.entrega || null}
              productos={boletaPedido.items.map((it) => ({
                cantidad: it.cantidad,
                nombre: it.nombre,
                precioUnitario: it.precioUnitario,
                subtotal: it.subtotal,
                ventaPorPeso: it.ventaPorPeso,
              }))}
              totales={{
                metodoPago: METODO_LABELS[boletaPedido.metodoPago] || boletaPedido.metodoPago,
                totalPagar: boletaPedido.total,
                efectivoRecibido: boletaPedido.metodoPago === "EFECTIVO" ? boletaPedido.montoRecibido : null,
                vuelto: boletaPedido.vuelto,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
