import { useState } from "react";
import { Check, X } from "lucide-react";
import { formatSoles } from "../utils/format";

/* Modal Calculadora de Peso: intercepta el agregado al carrito de
   cualquier producto 'venta_por_peso' — en vez de sumar "1 unidad" (un
   default sin sentido físico para algo que se vende a granel), pide
   los kilos exactos y muestra el subtotal en vivo (kilos × precio/Kg)
   antes de confirmar. Reusa esto mismo para EDITAR el peso de un ítem
   que ya está en el carrito (ver 'initialKg'). */
export default function PesoModal({ product, avail, initialKg, onCancel, onConfirm }) {
  const [kgInput, setKgInput] = useState(initialKg != null ? String(initialKg) : "");
  const [error, setError] = useState("");

  const kgNum = parseFloat(kgInput);
  const kgValido = !isNaN(kgNum) && kgNum > 0;
  const subtotal = kgValido ? kgNum * product.price : 0;

  const handleConfirm = () => {
    if (!kgValido) {
      setError("Ingresa un peso válido en kilos (mayor a 0).");
      return;
    }
    if (avail != null && avail !== Infinity && kgNum > avail + 0.0001) {
      setError(`No hay ${kgNum.toFixed(2)} Kg en stock — disponible: ${avail.toFixed(2)} Kg.`);
      return;
    }
    onConfirm(Math.round(kgNum * 1000) / 1000);
  };

  return (
    <div className="tz-modal-backdrop" onClick={onCancel}>
      <div className="tz-modal tz-peso-modal" onClick={(e) => e.stopPropagation()}>
        <button className="tz-modal-close" onClick={onCancel} aria-label="Cerrar">
          <X size={18} />
        </button>

        <h2>Venta por Peso</h2>
        <p className="tz-stock-editor-sub">
          {product.name}
          {product.detail ? ` · ${product.detail}` : ""} — {formatSoles(product.price)}/Kg
        </p>

        <label className="tz-field-label">Peso (Kg)</label>
        <input
          type="text"
          inputMode="decimal"
          autoFocus
          className="tz-amount-input"
          placeholder="0.000"
          value={kgInput}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "" || /^\d*\.?\d{0,3}$/.test(v)) {
              setKgInput(v);
              setError("");
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleConfirm();
          }}
        />

        {avail != null && avail !== Infinity && (
          <p className="tz-stock-editor-sub">Disponible: {avail.toFixed(2)} Kg</p>
        )}

        <p className="tz-peso-subtotal">
          Subtotal: <strong>{formatSoles(subtotal)}</strong>
        </p>

        {error && <p className="tz-error">{error}</p>}

        <div className="tz-add-entry-actions">
          <button type="button" className="tz-camera-cancel" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="tz-pw-submit tz-payment-save" onClick={handleConfirm}>
            <Check size={16} /> Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
