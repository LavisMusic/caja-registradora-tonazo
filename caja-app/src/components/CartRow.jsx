import { useEffect, useState } from "react";
import { Pencil, Minus, Plus, Trash2 } from "lucide-react";
import { formatSoles, formatQty } from "../utils/format";

// Fila del carrito (POS de admin/cajero Y carrito de pedidos del
// cliente): extraída de App.jsx para que ambos flujos compartan
// exactamente la misma UI/interacción en vez de mantener dos copias.
export default function CartRow({
  product,
  qty,
  avail,
  unitPrice,
  discountLabel,
  onQtyChange,
  onRemove,
  onEditWeight,
}) {
  const [localQty, setLocalQty] = useState(String(qty));
  const hasDiscount = !!discountLabel;
  const effectiveUnitPrice = unitPrice ?? product.price;

  useEffect(() => {
    setLocalQty(String(qty));
  }, [qty]);

  const commit = (raw) => {
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed)) {
      setLocalQty(String(qty));
      return;
    }
    const clamped = Math.min(Math.max(parsed, 1), Math.max(avail, 1));
    onQtyChange(clamped);
    setLocalQty(String(clamped));
  };

  return (
    <div className="tz-cart-row">
      <div className="tz-cart-row-info">
        <span className="tz-cart-row-name">
          {product.name}
          {product.detail ? ` · ${product.detail}` : ""}
          {hasDiscount && (
            <span className="tz-discount-badge tz-discount-badge-inline">{discountLabel}</span>
          )}
        </span>
        <span className="tz-cart-row-amount-group">
          {hasDiscount && (
            <span className="tz-cart-row-original">{formatSoles(product.price * qty)}</span>
          )}
          <span className="tz-cart-row-amount">{formatSoles(effectiveUnitPrice * qty)}</span>
        </span>
      </div>
      {hasDiscount && (
        <span className="tz-cart-row-discount-note">
          Descuento aplicado: {formatSoles((product.price - effectiveUnitPrice) * qty)}
        </span>
      )}
      <div className="tz-cart-row-controls">
        {product.ventaPorPeso ? (
          <button
            type="button"
            className="tz-cart-peso-edit-btn"
            onClick={onEditWeight}
            aria-label={`Editar peso de ${product.name}`}
          >
            {formatQty(true, qty)} <Pencil size={13} />
          </button>
        ) : (
          <div className="tz-qty-stepper tz-cart-qty-stepper">
            <button
              type="button"
              onClick={() => onQtyChange(Math.max(qty - 1, 1))}
              disabled={qty <= 1}
              aria-label={`Disminuir cantidad de ${product.name}`}
            >
              <Minus size={14} />
            </button>
            <input
              type="number"
              min="1"
              max={avail}
              className="tz-cart-qty-input"
              value={localQty}
              onChange={(e) => setLocalQty(e.target.value)}
              onBlur={(e) => commit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  commit(e.currentTarget.value);
                  e.currentTarget.blur();
                }
              }}
            />
            <button
              type="button"
              onClick={() => onQtyChange(Math.min(qty + 1, avail))}
              disabled={qty >= avail}
              aria-label={`Aumentar cantidad de ${product.name}`}
            >
              <Plus size={14} />
            </button>
          </div>
        )}
        <button
          type="button"
          className="tz-cart-remove-btn"
          onClick={onRemove}
          aria-label={`Quitar ${product.name} del ticket`}
          title="Quitar del ticket"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
