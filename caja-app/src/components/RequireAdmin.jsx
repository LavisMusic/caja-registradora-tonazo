import { Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import AdminLoginGate from "./AdminLoginGate";
import Styles from "./Styles";

// Guarda de ruta para /admin: exige una sesión real de Supabase Auth
// con profiles.role === 'admin', 'cajero' o 'super_admin' (no solo "hay
// sesión" — un cliente logueado con su Celular+PIN NO debe poder entrar
// aquí). App.jsx recibe admin/cajero y decide internamente qué
// mostrar/ocultar — no hay dos componentes separados, para no duplicar
// toda la lógica de ventas/stock/fiados/gastos entre un panel de admin
// y uno de cajero. 'super_admin' en cambio monta un panel COMPLETAMENTE
// aparte (SuperAdminPanel, ver StaffPanel en main.jsx) — no comparte
// nada de esa lógica de POS, así que no vale la pena forzarlo dentro
// del mismo App.jsx.
export default function RequireAdmin({ children }) {
  const { session, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="tz-root tz-loading">
        <Styles />
        <Loader2 className="tz-spin" size={28} />
        <p>Cargando...</p>
      </div>
    );
  }

  if (!session || (role !== "admin" && role !== "cajero" && role !== "super_admin")) {
    return <AdminLoginGate />;
  }

  return children;
}
