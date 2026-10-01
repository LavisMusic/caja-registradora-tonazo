import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Lock, Loader2 } from "lucide-react";
import { supabase, setAuthPersistence } from "../supabaseClient";
import { usuarioToDummyEmail } from "../lib/auth";
import { useAuth } from "../contexts/AuthContext";
import Styles from "../components/Styles";
import App from "../App.jsx";

/* /:slug — login propio de UN negocio puntual (ej. /tonazo), con su
   logo. Reemplaza la vieja ruta única /admin (3 pestañas Admin/Cajero/
   Super Admin, todas mezcladas) — ahora cada negocio tiene su propia
   URL, y esta MISMA pantalla sirve tanto para su admin como para sus
   cajeros: el rol real (admin/cajero) lo decide profiles.role, acá no
   hace falta elegir un modo de antemano, solo usuario+clave.

   'negocios' tiene una política de lectura pública para negocios
   activos (ver migración 0075) — por eso este fetch funciona SIN
   sesión todavía, necesario para mostrar el logo correcto antes del
   login. Tras loguearse, se verifica que profiles.negocio_id
   coincida con el negocio de ESTA url — si alguien inicia sesión con
   una cuenta de OTRO negocio (o un cliente/super_admin, que no
   pintan nada acá), se le avisa y se le ofrece cerrar esa sesión en
   vez de mostrarle el POS de un negocio ajeno. */
export default function NegocioAccessPage() {
  const { slug } = useParams();
  const { session, role, negocioId, loading: authLoading, signOut } = useAuth();

  const [negocio, setNegocio] = useState(null);
  const [negocioLoading, setNegocioLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setNegocioLoading(true);
    setNotFound(false);
    supabase
      .from("negocios")
      .select("id, nombre, logo_url, slug")
      .eq("slug", slug)
      .eq("activo", true)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        if (!data) setNotFound(true);
        else setNegocio(data);
        setNegocioLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!usuario.trim() || !clave) {
      setError("Ingresa tu usuario y clave.");
      return;
    }
    setSubmitting(true);
    setAuthPersistence(rememberMe);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: usuarioToDummyEmail(usuario),
      password: clave,
    });
    setSubmitting(false);
    if (signInError) {
      setError("Usuario o clave incorrectos.");
      return;
    }
  };

  if (negocioLoading || authLoading) {
    return (
      <div className="tz-root tz-loading">
        <Styles />
        <Loader2 className="tz-spin" size={28} />
        <p>Cargando...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="tz-root tz-loading">
        <Styles />
        <p>No encontramos ese negocio.</p>
      </div>
    );
  }

  const wrongAccount =
    !!session && (role === "cliente" || role === "super_admin" || negocioId !== negocio.id);

  if (session && !wrongAccount && (role === "admin" || role === "cajero")) {
    return <App />;
  }

  return (
    <div className="tz-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <Styles />
      <div className="tz-modal" style={{ position: "static" }}>
        {negocio.logo_url && <img src={negocio.logo_url} alt={negocio.nombre} className="tz-modal-logo" />}
        <p className="tz-brand-sub">{negocio.nombre}</p>

        {wrongAccount && (
          <p className="tz-error" style={{ marginBottom: 10 }}>
            Esa cuenta no pertenece a {negocio.nombre}.{" "}
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
            <label className="tz-field-label" htmlFor="negocio-usuario">
              Usuario
            </label>
            <input
              id="negocio-usuario"
              type="text"
              autoFocus
              className="tz-text-input"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoCapitalize="off"
              autoCorrect="off"
            />
          </div>
          <div className="tz-login-field">
            <label className="tz-field-label" htmlFor="negocio-clave">
              Clave
            </label>
            <input
              id="negocio-clave"
              type="password"
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
