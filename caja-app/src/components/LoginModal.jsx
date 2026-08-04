import { useState } from "react";
import { X, Lock } from "lucide-react";
import { supabase } from "../supabaseClient";
import { celularToDummyEmail } from "../lib/auth";
import "../styles/public.css";

// Login de clientes: solo Celular + PIN, sin correo, sin SMS. Por dentro
// arma un "dummy email" y usa signInWithPassword de Supabase Auth.
export default function LoginModal({ onClose, onSuccess }) {
  const [celular, setCelular] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const celularTrim = celular.trim();
    if (!/^\d{6,15}$/.test(celularTrim)) {
      setError("Ingresa un celular válido (solo números).");
      return;
    }
    if (!pin) {
      setError("Ingresa tu PIN.");
      return;
    }

    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: celularToDummyEmail(celularTrim),
      password: pin,
    });
    setSubmitting(false);

    if (signInError) {
      setError("Celular o PIN incorrecto.");
      return;
    }

    onSuccess?.();
  };

  return (
    <div className="tzp-modal-backdrop" onClick={onClose}>
      <div className="tzp-modal" onClick={(e) => e.stopPropagation()}>
        <button className="tzp-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <h2>Ingresar</h2>
        <p className="tzp-sub">Usa tu celular y PIN para ver tu fiado.</p>
        <form onSubmit={handleSubmit}>
          <div className="tzp-field">
            <label htmlFor="login-celular">Celular</label>
            <input
              id="login-celular"
              type="tel"
              inputMode="numeric"
              autoFocus
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              placeholder="999999999"
            />
          </div>
          <div className="tzp-field">
            <label htmlFor="login-pin">PIN</label>
            <input
              id="login-pin"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••••"
            />
          </div>
          {error && <p className="tzp-error">{error}</p>}
          <button type="submit" className="tzp-btn tzp-btn-primary tzp-modal-submit" disabled={submitting}>
            <Lock size={16} />
            {submitting ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
