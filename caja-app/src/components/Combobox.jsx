import { useEffect, useRef, useState } from "react";

// Combobox de texto libre con sugerencias flotantes — mismo look &
// feel que el buscador de productos de la pantalla principal
// (tz-global-search-wrap/-dropdown/-item), reciclado acá para
// reemplazar los <datalist> nativos que no funcionan en Safari/iOS.
// Deja escribir cualquier texto (no fuerza a elegir de la lista) y
// abre las sugerencias tanto al enfocar como al escribir.
export default function Combobox({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  autoFocus,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  const term = value.trim().toLowerCase();
  const filtered = term ? options.filter((opt) => opt.toLowerCase().includes(term)) : options;

  return (
    <div className="tz-global-search-wrap" ref={wrapRef}>
      <input
        type="text"
        className="tz-text-input"
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && !disabled && filtered.length > 0 && (
        <div className="tz-global-search-dropdown">
          {filtered.map((opt) => (
            <button
              type="button"
              key={opt}
              className="tz-global-search-item"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
            >
              <span className="tz-global-search-item-name">{opt}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
