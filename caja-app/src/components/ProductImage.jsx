import { Image as ImageIcon, Camera } from "lucide-react";

// Espacio reservado para la foto del producto/combo, arriba de cada
// tarjeta. Clientes y Cajero solo la ven (o el placeholder si todavía
// no tiene una); el Admin puede tocarla para abrir el modal de
// "Gestión de Imagen" (ver ProductImageManagerModal en App.jsx).
export default function ProductImage({ item, editable, onManage, compact }) {
  return (
    <div
      className={`tz-product-image ${compact ? "tz-product-image-sm" : ""} ${
        editable ? "tz-product-image-editable" : ""
      }`}
      onClick={
        editable
          ? (e) => {
              e.stopPropagation();
              onManage(item);
            }
          : undefined
      }
      role={editable ? "button" : undefined}
      tabIndex={editable ? 0 : undefined}
      aria-label={editable ? `Gestionar imagen de ${item.name}` : undefined}
      title={editable ? "Gestionar imagen" : undefined}
    >
      {item.imagenUrl ? (
        <img src={item.imagenUrl} alt={item.name} className="tz-product-image-img" />
      ) : (
        <div className="tz-product-image-placeholder">
          <ImageIcon size={compact ? 16 : 22} />
        </div>
      )}
      {editable && (
        <span className={`tz-product-image-edit-badge ${compact ? "tz-product-image-edit-badge-sm" : ""}`}>
          <Camera size={compact ? 9 : 12} />
        </span>
      )}
    </div>
  );
}
