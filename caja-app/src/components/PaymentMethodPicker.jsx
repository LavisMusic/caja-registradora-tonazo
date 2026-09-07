import { AlertTriangle } from "lucide-react";
import { formatSoles } from "../utils/format";

const MONTOS_RAPIDOS = [20, 50, 100, 200];

export const METODOS_PEDIDO_CLIENTE = [
  { key: "EFECTIVO", label: "Efectivo" },
  { key: "YAPE", label: "Yape" },
  { key: "PLIN", label: "Plin" },
  { key: "OTROS", label: "Otros" },
];

// Selector de método de pago + calculadora de vuelto (Efectivo), para
// el checkout del cliente en la tienda. Mismo patrón visual/UX que ya
// usa App.jsx en el checkout del cajero (clases tz-metodo-btn/
// tz-vuelto-*), pero acá el pago todavía NO se ha hecho — el cliente
// solo está indicando CÓMO va a pagar cuando reciba su pedido, así que
// no hay escaneo de comprobante ni OCR (eso es exclusivo de la venta ya
// cobrada en el POS). Efectivo sigue necesitando la calculadora de
// vuelto porque el repartidor necesita saber cuánto llevar de cambio.
export default function PaymentMethodPicker({
  metodo,
  onMetodoChange,
  total,
  montoRecibido,
  onMontoRecibidoChange,
  methods = METODOS_PEDIDO_CLIENTE,
}) {
  const handleMontoChange = (value) => {
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      onMontoRecibidoChange(value);
    }
  };

  const recibidoNum = parseFloat(montoRecibido);
  const vuelto = !montoRecibido || isNaN(recibidoNum) ? null : recibidoNum - total;

  return (
    <div className="tz-metodo-pago">
      <label className="tz-field-label">Método de pago</label>
      <div className="tz-gasto-tipo-buttons">
        {methods.map((m) => (
          <button
            key={m.key}
            type="button"
            className={`tz-gasto-tipo-btn tz-metodo-btn tz-metodo-btn-${m.key.toLowerCase()} ${
              metodo === m.key ? "tz-gasto-tipo-active" : ""
            }`}
            onClick={() => onMetodoChange(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {metodo === "EFECTIVO" && (
        <div className="tz-checkout-fiado">
          <label className="tz-field-label">¿Con cuánto vas a pagar? (S/)</label>
          <input
            type="text"
            inputMode="decimal"
            className="tz-amount-input"
            placeholder="0.00"
            value={montoRecibido}
            onChange={(e) => handleMontoChange(e.target.value)}
            autoFocus
          />
          <div className="tz-vuelto-quick-buttons">
            {MONTOS_RAPIDOS.map((m) => (
              <button
                type="button"
                key={m}
                className="tz-vuelto-quick-btn"
                onClick={() => handleMontoChange(String(m))}
              >
                S/ {m}
              </button>
            ))}
          </div>
          {vuelto !== null &&
            (vuelto < -0.009 ? (
              <p className="tz-error">
                <AlertTriangle size={14} /> Falta {formatSoles(Math.abs(vuelto))} para cubrir el total.
              </p>
            ) : (
              <p className="tz-vuelto-display">
                VUELTO: <strong>{formatSoles(Math.max(vuelto, 0))}</strong>
              </p>
            ))}
        </div>
      )}
    </div>
  );
}
