import { useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { supabase, setAuthPersistence } from "../supabaseClient";
import { SUPER_ADMIN_DUMMY_EMAIL } from "../lib/auth";
import { useAuth } from "../contexts/AuthContext";
import Styles from "../components/Styles";
import SuperAdminPanel from "./SuperAdminPanel";
import logo from "../assets/logo.webp";

/* /superadmin: login PROPIO y exclusivo del super-admin, separado de
   todo lo demás (antes era una 3ra pestaña dentro del login general de
   /admin, junto con Admin/Cajero — mezclaba dos audiencias muy
   distintas en la misma pantalla). Cuenta única, clave secreta, mismo
   mecanismo que ya tenía. */
export default function SuperAdminAccessPage() {
  const { session, role, loading, signOut } = useAuth();
  const [clave, setClave] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!clave) {
      setError("Ingresa la clave secreta.");
      return;
    }
    setSubmitting(true);
    setAuthPersistence(rememberMe);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: SUPER_ADMIN_DUMMY_EMAIL,
      password: clave,
    });
    setSubmitting(false);
    if (signInError) {
      setError("Clave incorrecta. Intenta de nuevo.");
      return;
    }
    // AuthContext recoge la sesión sola; este componente re-renderiza
    // y ya matchea la condición de session+role de abajo.
  };

  if (loading) {
    return (
      <div className="tz-root tz-loading">
        <Styles />
        <Loader2 className="tz-spin" size={28} />
        <p>Cargando...</p>
      </div>
    );
  }

  if (session && role === "super_admin") {
    return <SuperAdminPanel />;
  }

  const wrongAccount = !!session && role !== "super_admin";

  return (
    <div className="tz-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <Styles />
      <div className="tz-modal" style={{ position: "static" }}>
        <img src={logo} alt="TONAZO" className="tz-modal-logo" />
        <p className="tz-brand-sub">Panel Super Admin</p>

        {wrongAccount && (
          <p className="tz-error" style={{ marginBottom: 10, flexWrap: "wrap" }}>
            Esa cuenta no es de super-admin.{" "}
            <button
              type="button"
              className="tz-vis-edit-btn"
              onClick={signOut}
              style={{ display: "inline-flex", verticalAlign: "middle" }}
            >
              Cerrar sesión
            </button>
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="tz-login-field">
            <label className="tz-field-label" htmlFor="sa-clave">
              Clave secreta
            </label>
            <input
              id="sa-clave"
              type="password"
              autoFocus
              className="tz-text-input"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <label className="tz-checkbox-row">
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            Mantener sesión iniciada
          </label>
          {error && <p className="tz-error">{error}</p>}
          <button type="submit" className="tz-scan-btn tz-payment-save" disabled={submitting}>
            <Lock size={16} />
            {submitting ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
