import { useState } from "react";
import { X, Lock, ShieldCheck, UserPlus, PartyPopper } from "lucide-react";
import { supabase, setAuthPersistence } from "../supabaseClient";
import { celularToDummyEmail } from "../lib/auth";
import Styles from "./Styles";
import Confetti from "./Confetti";
import logo from "../assets/logo.png";

/* Login de clientes: solo Celular + PIN, sin correo, sin SMS. Por
   dentro arma un "dummy email" y usa signInWithPassword de Supabase
   Auth.

   Los DOS inputs (Celular y PIN) están visibles juntos desde el
   arranque — la "inteligencia" del flujo pasa en el submit, no en
   qué se muestra:
   1) Se valida el celular y se consulta check-pin-status (Edge
      Function pública, sin sesión — el cliente TODAVÍA no puede
      autenticarse en este punto) para saber si esa cuenta ya tiene un
      PIN real configurado.
   2a) Si YA lo tiene: el PIN escrito es obligatorio y se valida contra
       la cuenta real (signInWithPassword). Si el campo está vacío, ni
       siquiera se llama a Supabase — se avisa ahí mismo.
   2b) Si NO lo tiene (el admin la registró solo con nombre+teléfono):
       lo que haya en el campo PIN se IGNORA por completo — ni se lee
       ni se manda a ningún lado — y se pasa directo a la pantalla
       "Crea tu PIN", donde el cliente elige su PIN de verdad. Ahí se
       llama a set-initial-pin (reemplaza el password placeholder
       aleatorio por este PIN) y RECIÉN AHÍ se hace signInWithPassword
       con el PIN nuevo para entrar.

   Usa la estética "Tonazo" (tz-, Styles.jsx) igual que el resto del
   sistema. Se renderiza como overlay (backdrop + modal) porque se abre
   encima del catálogo público, que sigue con su propio tema claro/oscuro. */
export default function LoginModal({ onClose, onSuccess }) {
  // 'screen': 'login' (celular + PIN juntos) | 'crear-pin' (primer login)
  // | 'registro' (alta propia, nombre+celular+PIN) | 'registro-exito'
  // (confeti antes de entrar)
  const [screen, setScreen] = useState("login");
  const [celular, setCelular] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Registro propio — campos separados de los de login para no
  // pisarlos si el visitante va y vuelve entre las dos pestañas.
  const [regNombre, setRegNombre] = useState("");
  const [regCelular, setRegCelular] = useState("");
  const [regPin, setRegPin] = useState("");
  const [regPinConfirm, setRegPinConfirm] = useState("");

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const celularTrim = celular.trim();
    if (!/^\d{6,15}$/.test(celularTrim)) {
      setError("Ingresa un celular válido (solo números).");
      return;
    }

    setSubmitting(true);
    const { data, error: fnError } = await supabase.functions.invoke("check-pin-status", {
      body: { celular: celularTrim },
    });

    if (fnError) {
      setSubmitting(false);
      // check-pin-status usa el cliente service_role adentro (bypassa
      // RLS por completo) y SIEMPRE responde 200, incluso cuando el
      // celular no existe — así que si esto se dispara, no es un
      // rechazo de datos: es que la llamada HTTP en sí falló. El caso
      // más común de lejos es 404 (la función todavía no está
      // desplegada en el proyecto). Se muestra el status/body reales
      // en vez de un mensaje genérico para no volver a adivinar a
      // ciegas la próxima vez que esto falle.
      const status = fnError?.context?.status;
      const body = await fnError?.context?.json?.().catch(() => null);
      console.error("Error consultando check-pin-status:", { status, body, fnError });
      setError(
        status === 404
          ? "El sistema de verificación de PIN no está desplegado (check-pin-status) — avisa al administrador."
          : body?.error || `No se pudo verificar el celular (${status ?? "sin conexión"}). Intenta de nuevo.`
      );
      return;
    }
    if (!data?.exists) {
      setSubmitting(false);
      setError("No hay ninguna cuenta registrada con ese celular.");
      return;
    }

    // Cuenta nueva (el admin la registró solo con nombre+teléfono,
    // todavía sin PIN real): lo que haya en el campo PIN no importa —
    // se ignora a propósito, ni se valida ni se usa — y se pasa
    // directo a que el cliente cree el suyo.
    if (!data.pinConfigured) {
      setSubmitting(false);
      setPin("");
      setError("");
      setScreen("crear-pin");
      return;
    }

    // Cuenta con PIN real: acá SÍ es obligatorio.
    if (!pin) {
      setSubmitting(false);
      setError("Ingresa tu PIN.");
      return;
    }

    setAuthPersistence(rememberMe);
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

  const handleCrearPinSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^\d{6,10}$/.test(pin)) {
      setError("El PIN debe tener entre 6 y 10 dígitos.");
      return;
    }
    if (pin !== pinConfirm) {
      setError("Los dos PIN no coinciden.");
      return;
    }

    setSubmitting(true);
    const celularTrim = celular.trim();
    const { error: fnError } = await supabase.functions.invoke("set-initial-pin", {
      body: { celular: celularTrim, pin },
    });

    if (fnError) {
      setSubmitting(false);
      const status = fnError?.context?.status;
      const body = await fnError?.context?.json?.().catch(() => null);
      console.error("Error configurando el PIN inicial:", { status, body, fnError });
      setError(
        status === 404
          ? "El sistema de creación de PIN no está desplegado (set-initial-pin) — avisa al administrador."
          : body?.error || "No se pudo configurar el PIN. Intenta de nuevo."
      );
      return;
    }

    // El PIN ya quedó configurado server-side — ahora sí se puede
    // iniciar sesión de verdad con él.
    setAuthPersistence(rememberMe);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: celularToDummyEmail(celularTrim),
      password: pin,
    });
    setSubmitting(false);

    if (signInError) {
      setError("Tu PIN se guardó, pero no se pudo iniciar sesión. Intenta ingresar de nuevo.");
      setScreen("login");
      setPin("");
      return;
    }

    // Confeti: este es el primer ingreso REAL de esta cuenta (recién
    // ahora deja de tener el password placeholder aleatorio) — mismo
    // criterio que el registro propio, no en un login normal.
    setScreen("crear-pin-exito");
    setTimeout(() => onSuccess?.(), 1900);
  };

  // Registro propio (sin admin de por medio): nombre + celular + PIN.
  // Nace SIN Fiados habilitado (ver registro-cliente / migración
  // 0068) — el admin lo asigna después si corresponde. Al terminar
  // muestra la pantalla de confeti (screen 'registro-exito') antes de
  // entrar de verdad, en vez de cerrar de una.
  const handleRegistroSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const nombreTrim = regNombre.trim();
    const celularTrim = regCelular.trim();
    if (!nombreTrim) {
      setError("Ingresa tu nombre.");
      return;
    }
    if (!/^\d{6,15}$/.test(celularTrim)) {
      setError("Ingresa un celular válido (solo números).");
      return;
    }
    if (!/^\d{6,10}$/.test(regPin)) {
      setError("El PIN debe tener entre 6 y 10 dígitos.");
      return;
    }
    if (regPin !== regPinConfirm) {
      setError("Los dos PIN no coinciden.");
      return;
    }

    setSubmitting(true);
    const { error: fnError } = await supabase.functions.invoke("registro-cliente", {
      body: { nombre: nombreTrim, celular: celularTrim, pin: regPin },
    });

    if (fnError) {
      setSubmitting(false);
      const body = await fnError?.context?.json?.().catch(() => null);
      setError(body?.error || "No se pudo crear tu cuenta. Intenta de nuevo.");
      return;
    }

    setAuthPersistence(rememberMe);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: celularToDummyEmail(celularTrim),
      password: regPin,
    });
    setSubmitting(false);

    if (signInError) {
      setError("Tu cuenta se creó, pero no se pudo iniciar sesión. Intenta ingresar de nuevo.");
      setScreen("login");
      return;
    }

    setScreen("registro-exito");
    setTimeout(() => onSuccess?.(), 1900);
  };

  return (
    <div className="tz-root" style={{ minHeight: 0, width: "auto", background: "transparent" }}>
      <Styles />
      <div className="tz-modal-backdrop">
        <div className="tz-modal" onClick={(e) => e.stopPropagation()}>
          <button className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>

          <img src={logo} alt="TONAZO" className="tz-modal-logo" />

          {(screen === "login" || screen === "registro") && (
            <div className="tz-gasto-tipo-buttons" style={{ marginBottom: 14 }}>
              <button
                type="button"
                className={`tz-gasto-tipo-btn ${screen === "login" ? "tz-gasto-tipo-active" : ""}`}
                onClick={() => {
                  setScreen("login");
                  setError("");
                }}
              >
                Ingresar
              </button>
              <button
                type="button"
                className={`tz-gasto-tipo-btn ${screen === "registro" ? "tz-gasto-tipo-active" : ""}`}
                onClick={() => {
                  setScreen("registro");
                  setError("");
                }}
              >
                Registrarme
              </button>
            </div>
          )}

          {screen === "login" && (
            <>
              <p className="tz-brand-sub">Ingresa con tu celular y PIN</p>
              <form onSubmit={handleLoginSubmit}>
                <div className="tz-login-field">
                  <label className="tz-field-label" htmlFor="login-celular">
                    Celular
                  </label>
                  <input
                    id="login-celular"
                    type="tel"
                    inputMode="numeric"
                    autoFocus
                    className="tz-text-input"
                    value={celular}
                    onChange={(e) => setCelular(e.target.value)}
                    placeholder="999999999"
                  />
                </div>
                <div className="tz-login-field">
                  <label className="tz-field-label" htmlFor="login-pin">
                    PIN
                  </label>
                  <input
                    id="login-pin"
                    type="password"
                    inputMode="numeric"
                    className="tz-text-input"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••••"
                  />
                  <p className="tz-field-hint">
                    ¿Primera vez? Deja el PIN en blanco — te dejamos crear uno nuevo.
                  </p>
                </div>

                <label className="tz-checkbox-row">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Mantener sesión iniciada
                </label>

                {error && <p className="tz-error">{error}</p>}
                <button type="submit" className="tz-scan-btn tz-payment-save" disabled={submitting}>
                  <Lock size={16} />
                  {submitting ? "Verificando..." : "Ingresar"}
                </button>
              </form>
            </>
          )}

          {screen === "registro" && (
            <>
              <p className="tz-brand-sub">Regístrate con tu nombre, celular y un PIN</p>
              <form onSubmit={handleRegistroSubmit}>
                <div className="tz-login-field">
                  <label className="tz-field-label" htmlFor="reg-nombre">
                    Nombre
                  </label>
                  <input
                    id="reg-nombre"
                    type="text"
                    autoFocus
                    className="tz-text-input"
                    value={regNombre}
                    onChange={(e) => setRegNombre(e.target.value)}
                    placeholder="Tu nombre"
                  />
                </div>
                <div className="tz-login-field">
                  <label className="tz-field-label" htmlFor="reg-celular">
                    Celular
                  </label>
                  <input
                    id="reg-celular"
                    type="tel"
                    inputMode="numeric"
                    className="tz-text-input"
                    value={regCelular}
                    onChange={(e) => setRegCelular(e.target.value)}
                    placeholder="999999999"
                  />
                </div>
                <div className="tz-login-field">
                  <label className="tz-field-label" htmlFor="reg-pin">
                    PIN (6 a 10 dígitos)
                  </label>
                  <input
                    id="reg-pin"
                    type="password"
                    inputMode="numeric"
                    className="tz-text-input"
                    value={regPin}
                    onChange={(e) => setRegPin(e.target.value)}
                    placeholder="••••••"
                  />
                </div>
                <div className="tz-login-field">
                  <label className="tz-field-label" htmlFor="reg-pin-confirm">
                    Confirma tu PIN
                  </label>
                  <input
                    id="reg-pin-confirm"
                    type="password"
                    inputMode="numeric"
                    className="tz-text-input"
                    value={regPinConfirm}
                    onChange={(e) => setRegPinConfirm(e.target.value)}
                    placeholder="••••••"
                  />
                </div>

                <label className="tz-checkbox-row">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Mantener sesión iniciada
                </label>

                {error && <p className="tz-error">{error}</p>}
                <button type="submit" className="tz-scan-btn tz-payment-save" disabled={submitting}>
                  <UserPlus size={16} />
                  {submitting ? "Creando cuenta..." : "Crear mi cuenta"}
                </button>
              </form>
            </>
          )}

          {(screen === "registro-exito" || screen === "crear-pin-exito") && (
            <>
              <Confetti />
              <div className="tz-qr-confirmado">
                <div className="tz-qr-confirmado-icono">
                  <PartyPopper size={32} />
                </div>
                <h3>
                  {screen === "registro-exito"
                    ? "¡Cuenta creada! Bienvenido a Tonazo."
                    : "¡Listo! Tu PIN quedó configurado."}
                </h3>
              </div>
            </>
          )}

          {screen === "crear-pin" && (
            <>
              <p className="tz-brand-sub">
                <ShieldCheck size={14} style={{ verticalAlign: "-2px" }} /> Es tu primera vez —
                crea tu PIN
              </p>
              <form onSubmit={handleCrearPinSubmit}>
                <div className="tz-login-field">
                  <label className="tz-field-label" htmlFor="crear-pin">
                    Nuevo PIN (6 a 10 dígitos)
                  </label>
                  <input
                    id="crear-pin"
                    type="password"
                    inputMode="numeric"
                    autoFocus
                    className="tz-text-input"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••••"
                  />
                </div>
                <div className="tz-login-field">
                  <label className="tz-field-label" htmlFor="crear-pin-confirm">
                    Confirma tu PIN
                  </label>
                  <input
                    id="crear-pin-confirm"
                    type="password"
                    inputMode="numeric"
                    className="tz-text-input"
                    value={pinConfirm}
                    onChange={(e) => setPinConfirm(e.target.value)}
                    placeholder="••••••"
                  />
                </div>

                <label className="tz-checkbox-row">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Mantener sesión iniciada
                </label>

                {error && <p className="tz-error">{error}</p>}
                <button type="submit" className="tz-scan-btn tz-payment-save" disabled={submitting}>
                  <ShieldCheck size={16} />
                  {submitting ? "Guardando..." : "Crear PIN e ingresar"}
                </button>
                <button
                  type="button"
                  className="tz-camera-cancel"
                  style={{ marginTop: 8, width: "100%" }}
                  onClick={() => {
                    setScreen("login");
                    setPin("");
                    setPinConfirm("");
                    setError("");
                  }}
                >
                  Cambiar celular
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
