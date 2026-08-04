import { Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import AdminLoginGate from "./AdminLoginGate";
import "../styles/public.css";

// Guarda de ruta para /admin: exige una sesión real de Supabase Auth
// con profiles.role === 'admin' (no solo "hay sesión" — un cliente
// logueado con su Celular+PIN NO debe poder entrar aquí).
export default function RequireAdmin({ children }) {
  const { session, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="tzp-page tzp-loading">
        <Loader2 className="tzp-spin" size={28} />
        <p>Cargando...</p>
      </div>
    );
  }

  if (!session || role !== "admin") {
    return <AdminLoginGate />;
  }

  return children;
}
