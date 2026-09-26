import { useState } from "react";
import { Lock } from "lucide-react";
import { supabase, setAuthPersistence } from "../supabaseClient";
import { ADMIN_DUMMY_EMAIL, SUPER_ADMIN_DUMMY_EMAIL, usuarioToDummyEmail } from "../lib/auth";
import Styles from "./Styles";
import logo from "../assets/logo.webp";

// Puerta de entrada del personal (/admin): tres modos sobre la MISMA
// pantalla, sin exponer nunca un campo de correo.
//   - Admin: un solo campo "Clave secreta" (cuenta única de Tonazo,
//     email fijo ADMIN_DUMMY_EMAIL) — tal como se pidió desde el
//     inicio, sin tocar. Queda como el acceso legado de ESTE negocio.
//   - Personal: "Usuario" + "Clave" — cubre tanto cajeros como el
//     admin de un negocio NUEVO (Fase 1 del super-admin): cada cuenta
//     tiene su propio usuario, email dummy = usuario@tonazo.staff. El
//     rol real (admin/cajero) queda guardado en profiles.role, esta
//     pantalla no necesita saber cuál es de antemano.
//   - Super Admin: un solo campo "Clave secreta" (cuenta única, email
//     fijo SUPER_ADMIN_DUMMY_EMAIL).
// Los tres casos crean una sesión real de Supabase Auth vía
// signInWithPassword para que RLS reconozca auth.uid(). App.jsx (o
// SuperAdminPanel) deciden qué mostrar según el rol una vez adentro —
// esta pantalla no sabe ni le importa cuál es.
export default function AdminLoginGate() {
  const [modo, setModo] = useState("admin"); // 'admin' | 'cajero' | 'super_admin'
  const [claveSecreta, setClaveSecreta] = useState("");
  const [usuario, setUsuario] = useState("");
  const [claveCajero, setClaveCajero] = useState("");
  const [claveSuperAdmin, setClaveSuperAdmin] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    let email;
    let password;
    if (modo === "admin") {
      if (!claveSecreta) {
        setError("Ingresa la clave secreta.");
        return;
      }
      email = ADMIN_DUMMY_EMAIL;
      password = claveSecreta;
    } else if (modo === "super_admin") {
      if (!claveSuperAdmin) {
        setError("Ingresa la clave secreta.");
        return;
      }
      email = SUPER_ADMIN_DUMMY_EMAIL;
      password = claveSuperAdmin;
    } else {
      if (!usuario.trim() || !claveCajero) {
        setError("Ingresa tu usuario y clave.");
        return;
      }
      email = usuarioToDummyEmail(usuario);
      password = claveCajero;
    }

    setSubmitting(true);
    setAuthPersistence(rememberMe);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);

    if (signInError) {
      setError(modo === "cajero" ? "Usuario o clave incorrectos." : "Clave incorrecta. Intenta de nuevo.");
      return;
    }
    // AuthContext recoge la sesión vía onAuthStateChange; RequireAdmin
    // vuelve a evaluar el rol automáticamente.
  };

  return (
    <div
      className="tz-root"
      style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <Styles />
      <div className="tz-modal" style={{ position: "static" }}>
        <img src={logo} alt="TONAZO" className="tz-modal-logo" />
        <p className="tz-brand-sub">
          {modo === "admin"
            ? "Panel de Administración"
            : modo === "super_admin"
              ? "Panel Super Admin"
              : "Acceso Personal"}
        </p>

        <div className="tz-gasto-tipo-buttons" style={{ marginBottom: 16 }}>
          <button
            type="button"
            className={`tz-gasto-tipo-btn ${modo === "admin" ? "tz-gasto-tipo-active" : ""}`}
            onClick={() => {
              setModo("admin");
              setError("");
            }}
          >
            Admin
          </button>
          <button
            type="button"
            className={`tz-gasto-tipo-btn ${modo === "cajero" ? "tz-gasto-tipo-active" : ""}`}
            onClick={() => {
              setModo("cajero");
              setError("");
            }}
          >
            Personal
          </button>
          <button
            type="button"
            className={`tz-gasto-tipo-btn ${modo === "super_admin" ? "tz-gasto-tipo-active" : ""}`}
            onClick={() => {
              setModo("super_admin");
              setError("");
            }}
          >
            Super Admin
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {modo === "admin" ? (
            <div className="tz-login-field">
              <label className="tz-field-label" htmlFor="admin-clave">
                Clave secreta
              </label>
              <input
                id="admin-clave"
                type="password"
                autoFocus
                className="tz-text-input"
                value={claveSecreta}
                onChange={(e) => setClaveSecreta(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          ) : modo === "super_admin" ? (
            <div className="tz-login-field">
              <label className="tz-field-label" htmlFor="super-admin-clave">
                Clave secreta
              </label>
              <input
                id="super-admin-clave"
                type="password"
                autoFocus
                className="tz-text-input"
                value={claveSuperAdmin}
                onChange={(e) => setClaveSuperAdmin(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          ) : (
            <>
              <div className="tz-login-field">
                <label className="tz-field-label" htmlFor="cajero-usuario">
                  Usuario
                </label>
                <input
                  id="cajero-usuario"
                  type="text"
                  autoFocus
                  className="tz-text-input"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="caja1"
                  autoCapitalize="off"
                  autoCorrect="off"
                />
              </div>
              <div className="tz-login-field">
                <label className="tz-field-label" htmlFor="cajero-clave">
                  Clave
                </label>
                <input
                  id="cajero-clave"
                  type="password"
                  className="tz-text-input"
                  value={claveCajero}
                  onChange={(e) => setClaveCajero(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </>
          )}

          <label className="tz-checkbox-row">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Mantener sesión iniciada
          </label>

          {error && <p className="tz-error">{error}</p>}
          <button
            type="submit"
            className="tz-scan-btn tz-payment-save"
            disabled={submitting}
          >
            <Lock size={16} />
            {submitting ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
