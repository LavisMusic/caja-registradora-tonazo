import { useEffect, useRef, useState } from "react";
import { X, Loader2, AlertTriangle, MessageCircle, Send, Copy, Check } from "lucide-react";
import { supabase } from "../supabaseClient";
import CartRow from "./CartRow";
import PaymentMethodPicker from "./PaymentMethodPicker";
import TicketBoleta from "./TicketBoleta";
import ChatPedidoModal from "./ChatPedidoModal";
import { formatSoles, formatDate, formatTime } from "../utils/format";
import { buildWhatsappLink } from "../lib/whatsapp";
import { copiarBoletaAlPortapapeles } from "../lib/boleta";

const METODO_LABELS = {
  YAPE: "Yape",
  PLIN: "Plin",
  OTROS: "Otros",
  EFECTIVO: "Efectivo",
};

// Mismo cálculo que 'effectivePrice' en CatalogPage.jsx/App.jsx — vive
// acá también porque este componente necesita el precio unitario ya
// descontado tanto para mostrarlo en CartRow como para congelarlo en
// 'pedido_items' al enviar el pedido.
function effectivePriceOf(product) {
  const valor = product.valorDescuento || 0;
  if (valor <= 0) return product.price;
  const raw =
    product.tipoDescuento === "porcentaje"
      ? product.price * (1 - Math.min(valor, 100) / 100)
      : product.price - valor;
  return Math.max(0, Math.round(raw * 100) / 100);
}

function buildResumenTexto(pedido, nombre) {
  const lines = pedido.items.map(
    (it) => `• ${it.nombre} x${it.cantidad} — ${formatSoles(it.subtotal)}`
  );
  return `Hola${nombre ? ` ${nombre}` : ""}, aquí tienes el resumen de tu pedido:\n\n${lines.join(
    "\n"
  )}\n\nTotal: ${formatSoles(pedido.total)}\nMétodo de pago: ${
    METODO_LABELS[pedido.metodoPago] || pedido.metodoPago
  }\n¡Gracias por tu compra!`;
}

// Checkout del cliente: arma el pedido (SIN registrar venta ni tocar
// stock — eso solo pasa cuando el cajero confirma la entrega desde el
// Gestor de Pedidos), y una vez enviado muestra la boleta preliminar +
// los botones para mandársela a SU PROPIO WhatsApp.
export default function PedidoCheckoutModal({
  carrito,
  total,
  sucursalId,
  session,
  onQtyChange,
  onRemove,
  onClose,
  onPedidoConfirmado,
}) {
  const [metodo, setMetodo] = useState(null);
  const [montoRecibido, setMontoRecibido] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pedidoCreado, setPedidoCreado] = useState(null);
  const [misDatos, setMisDatos] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [copiandoBoleta, setCopiandoBoleta] = useState(false);
  const boletaRef = useRef(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    supabase
      .from("clientes_fiado")
      .select("nombre, whatsapp")
      .eq("auth_user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setMisDatos(data || null));
  }, [session]);

  const recibidoNum = parseFloat(montoRecibido);
  const isPaymentValid =
    metodo && (metodo !== "EFECTIVO" || (montoRecibido !== "" && recibidoNum - total >= -0.009));

  const handleEnviarPedido = async () => {
    if (!isPaymentValid || carrito.length === 0) return;
    setSubmitting(true);
    setError("");

    const montoRecibidoNum = metodo === "EFECTIVO" ? recibidoNum : null;
    const vuelto = metodo === "EFECTIVO" ? Math.max(recibidoNum - total, 0) : null;

    const { data: pedidoRow, error: pedidoError } = await supabase
      .from("pedidos")
      .insert([
        {
          cliente_id: session.user.id,
          sucursal_id: sucursalId,
          metodo_pago: metodo,
          monto_recibido: montoRecibidoNum,
          vuelto,
          total,
        },
      ])
      .select()
      .single();

    if (pedidoError || !pedidoRow) {
      console.error("[PedidoCheckoutModal] Error creando pedido:", pedidoError);
      setError("No se pudo enviar tu pedido. Intenta de nuevo.");
      setSubmitting(false);
      return;
    }

    // Precio unitario con el descuento permanente del producto ya
    // aplicado, congelado en la línea del pedido al momento de crearlo.
    const itemsPayload = carrito.map(({ product, qty }) => {
      const precioUnitario = effectivePriceOf(product);
      return {
        pedido_id: pedidoRow.id,
        producto_id: product.id,
        nombre: product.name,
        cantidad: qty,
        precio_unitario: precioUnitario,
        subtotal: precioUnitario * qty,
      };
    });

    const { error: itemsError } = await supabase.from("pedido_items").insert(itemsPayload);
    if (itemsError) {
      console.error("[PedidoCheckoutModal] Error guardando items del pedido:", itemsError);
      setError("Tu pedido se creó, pero hubo un problema guardando los productos. Contacta a la tienda.");
      setSubmitting(false);
      return;
    }

    setPedidoCreado({
      id: pedidoRow.id,
      metodoPago: metodo,
      montoRecibido: montoRecibidoNum,
      vuelto,
      total,
      createdAt: pedidoRow.created_at,
      items: itemsPayload.map((it) => ({
        nombre: it.nombre,
        cantidad: it.cantidad,
        precioUnitario: it.precio_unitario,
        subtotal: it.subtotal,
      })),
    });
    onPedidoConfirmado();
    setSubmitting(false);
  };

  const handleEnviarResumen = () => {
    if (!pedidoCreado) return;
    const link = buildWhatsappLink(misDatos?.whatsapp, buildResumenTexto(pedidoCreado, misDatos?.nombre));
    if (link) window.open(link, "_blank");
    else setError("No encontramos un WhatsApp válido en tu cuenta.");
  };

  const handleEnviarBoleta = async () => {
    setCopiandoBoleta(true);
    setError("");
    try {
      await copiarBoletaAlPortapapeles(boletaRef);
      const link = buildWhatsappLink(misDatos?.whatsapp, "Aquí está tu boleta");
      if (link) {
        window.open(link, "_blank");
      } else {
        setError("No encontramos un WhatsApp válido en tu cuenta.");
      }
    } catch (err) {
      setError(err?.message || "No se pudo copiar la boleta.");
    } finally {
      setCopiandoBoleta(false);
    }
  };

  return (
    <div className="tz-modal-backdrop">
      <div className="tz-modal tz-modal-wide" onClick={(e) => e.stopPropagation()}>
        <button className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>

        {!pedidoCreado ? (
          <>
            <h2>Tu pedido</h2>
            <div className="tz-cart-list">
              {carrito.map(({ product, qty, avail, discountLabel }) => (
                <CartRow
                  key={product.id}
                  product={product}
                  qty={qty}
                  avail={avail}
                  unitPrice={effectivePriceOf(product)}
                  discountLabel={discountLabel}
                  onQtyChange={(newQty) => onQtyChange(product.id, newQty)}
                  onRemove={() => onRemove(product.id)}
                />
              ))}
            </div>
            <p className="tz-checkout-summary-row">
              <strong>Total: {formatSoles(total)}</strong>
            </p>

            <PaymentMethodPicker
              metodo={metodo}
              onMetodoChange={setMetodo}
              total={total}
              montoRecibido={montoRecibido}
              onMontoRecibidoChange={setMontoRecibido}
            />

            {error && (
              <p className="tz-error">
                <AlertTriangle size={14} /> {error}
              </p>
            )}

            <button
              className="tz-submit-btn"
              onClick={handleEnviarPedido}
              disabled={!isPaymentValid || submitting || carrito.length === 0}
            >
              {submitting ? <Loader2 size={16} className="tz-spin" /> : "Enviar pedido"}
            </button>
          </>
        ) : (
          <div className="tz-pedido-confirmacion">
            <Check size={32} color="var(--green)" />
            <h2>¡Pedido enviado!</h2>
            <p className="tz-stock-editor-sub">
              La tienda ya vio tu pedido. Puedes escribirles por el chat si tienes alguna duda.
            </p>

            <div ref={boletaRef}>
              <TicketBoleta
                orden={{
                  id: pedidoCreado.id.slice(0, 8),
                  fecha: formatDate(pedidoCreado.createdAt),
                  hora: formatTime(pedidoCreado.createdAt),
                  cajero: "-",
                }}
                cliente={{ nombre: misDatos?.nombre || "" }}
                productos={pedidoCreado.items}
                totales={{
                  metodoPago: METODO_LABELS[pedidoCreado.metodoPago] || pedidoCreado.metodoPago,
                  totalPagar: pedidoCreado.total,
                }}
              />
            </div>

            {error && (
              <p className="tz-error">
                <AlertTriangle size={14} /> {error}
              </p>
            )}

            <div className="tz-pedido-confirmacion-actions">
              <button type="button" className="tz-pedido-action-btn" onClick={handleEnviarResumen}>
                <Send size={14} /> Enviar resumen por WhatsApp
              </button>
              <button
                type="button"
                className="tz-pedido-action-btn"
                onClick={handleEnviarBoleta}
                disabled={copiandoBoleta}
              >
                {copiandoBoleta ? <Loader2 size={14} className="tz-spin" /> : <Copy size={14} />}
                Enviar boleta por WhatsApp
              </button>
              <button type="button" className="tz-pedido-action-btn" onClick={() => setChatOpen(true)}>
                <MessageCircle size={14} /> Chat con la tienda
              </button>
            </div>
            <button className="tz-submit-btn" onClick={onClose}>
              Cerrar
            </button>
          </div>
        )}
      </div>

      {chatOpen && pedidoCreado && (
        <ChatPedidoModal
          pedidoId={pedidoCreado.id}
          remitentePropio="cliente"
          tituloChat="Chat con la tienda"
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}
