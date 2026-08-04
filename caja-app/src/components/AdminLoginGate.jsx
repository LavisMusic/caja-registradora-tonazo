import { useState } from "react";
import { Lock } from "lucide-react";
import { supabase } from "../supabaseClient";
import { ADMIN_DUMMY_EMAIL } from "../lib/auth";
import "../styles/public.css";

// Pantalla de login del admin: un solo campo visible ("Clave secreta"),
// sin correo. Por dentro usa un email fijo (ADMIN_DUMMY_EMAIL) + la clave
// escrita como password, vía signInWithPassword — esto crea una sesión
// real de Supabase Auth para que RLS pueda reconocer auth.uid() como
// admin (is_admin() en la base de datos).
export default function AdminLoginGate() {
  const [claveSecreta, setClaveSecreta] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!claveSecreta) {
      setError("Ingresa la clave secreta.");
      return;
    }

    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: ADMIN_DUMMY_EMAIL,
      password: claveSecreta,
    });
    setSubmitting(false);

    if (signInError) {
      setError("Clave incorrecta. Intenta de nuevo.");
      return;
    }
    // AuthContext recoge la sesión vía onAuthStateChange; RequireAdmin
    // vuelve a evaluar el rol automáticamente.
  };

  return (
    <div className="tzp-page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="tzp-modal" style={{ position: "static" }}>
        <h2>Acceso Admin</h2>
        <p className="tzp-sub">Ingresa la clave secreta para entrar al panel.</p>
        <form onSubmit={handleSubmit}>
          <div className="tzp-field">
            <label htmlFor="admin-clave">Clave secreta</label>
            <input
              id="admin-clave"
              type="password"
              autoFocus
              value={claveSecreta}
              onChange={(e) => setClaveSecreta(e.target.value)}
              placeholder="••••••••"
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
