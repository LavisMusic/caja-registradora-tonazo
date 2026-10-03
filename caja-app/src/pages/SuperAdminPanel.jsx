import { useEffect, useMemo, useState } from "react";
import {
  LogOut,
  Loader2,
  UserCog,
  BarChart3,
  Layers,
  Phone,
  Inbox,
  Building2,
  Receipt,
  LayoutGrid,
  Wallet,
  CreditCard,
  TrendingDown,
  Lock,
} from "lucide-react";
import AnimacionNeonBienvenida from "../components/AnimacionNeonBienvenida";
import { useBienvenidaNeon } from "../hooks/useBienvenidaNeon";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import Styles from "../components/Styles";
import NegocioClientesModal from "./NegocioClientesModal.jsx";
import CuentasManagerModal from "./CuentasManagerModal.jsx";
import EstadisticasModal from "./EstadisticasModal.jsx";
import PlanesModal from "./PlanesModal.jsx";
import PlanNegocioModal from "./PlanNegocioModal.jsx";
import ContactoPlataformaModal from "./ContactoPlataformaModal.jsx";
import PeticionesPlanModal from "./PeticionesPlanModal.jsx";
import GestorNegociosModal from "./GestorNegociosModal.jsx";
import GestorRubrosModal from "./GestorRubrosModal.jsx";
import HistorialPagosModal from "./HistorialPagosModal.jsx";
import NegociosDirectorio, { grupoDeNegocio } from "./NegociosDirectorio.jsx";
import NegocioEstrellaChip from "./NegocioEstrellaChip.jsx";
import ComprobantesPlataformaModal, { METODOS_PAGO_SA, grupoMetodo } from "./ComprobantesPlataformaModal.jsx";
import GastosPlataformaModal from "./GastosPlataformaModal.jsx";
import CierreCajaPlataformaModal from "./CierreCajaPlataformaModal.jsx";
import { usePeticionesPlanSuperAdmin } from "../hooks/usePeticionesPlan";
import { formatSoles } from "../utils/format";
import logo from "../assets/logo.webp";

/* Panel del super admin — mismo diseño que el panel del admin de Taxi-PE
   (pedido explícito: "reusar totalmente el diseño de las demás
   interfaces de admin"):
     * cabecera: Peticiones (contador en tiempo real), Estadísticas,
       Cuentas | logo | Gestor de negocios, Salir;
     * estadísticas: negocios por estado del plan + ingresos del mes;
     * Directorio de Negocios: pestañas = rubros, acordeones = estado del
       plan, tarjetas = negocios (ver NegociosDirectorio.jsx);
     * pie de página: Cerrar caja (Excel), Gastos, Planes, Historial de
       ventas, Rubros, Contacto y pagos;
     * menú Pagos: gestor de comprobantes por método (con Efectivo).
   Pantalla aparte de App.jsx — montada desde SuperAdminAccessPage.jsx
   (ruta /superadmin) cuando profile.role === 'super_admin'. */
export default function SuperAdminPanel() {
  const { signOut, nombre, session } = useAuth();
  const { mostrar: mostrarBienvenida, marcarVista: marcarBienvenidaVista } = useBienvenidaNeon(session?.user?.id, true);

  const [rubros, setRubros] = useState([]);
  const [negocios, setNegocios] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [sucursalesPorNegocio, setSucursalesPorNegocio] = useState({});
  const [ingresosMes, setIngresosMes] = useState(0);
  // Recaudado HOY por método (menú Pagos, como en las cajas).
  const [hoyPorMetodo, setHoyPorMetodo] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [verClientesNegocio, setVerClientesNegocio] = useState(null);
  const [planNegocio, setPlanNegocio] = useState(null);
  const [modal, setModal] = useState(null); // 'peticiones' | 'estadisticas' | 'cuentas' | 'negocios' | 'planes' | 'historial' | 'rubros' | 'contacto' | 'gastos' | 'cierre'
  // Menú "Pagos" de la cabecera (gestor de comprobantes por método).
  const [pagosMenuOpen, setPagosMenuOpen] = useState(false);
  const [metodoAbierto, setMetodoAbierto] = useState(null);

  const { peticiones: peticionesPlan, pendientes: peticionesPendientes, loading: peticionesLoading } =
    usePeticionesPlanSuperAdmin();

  const leerTodo = async () => {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    const [r, n, p, l, s, pagos] = await Promise.all([
      supabase.from("rubros").select("*").order("orden", { ascending: true }),
      supabase.from("negocios").select("*, plan_estado").order("orden", { ascending: true }),
      supabase.from("planes").select("*").order("orden", { ascending: true }),
      supabase.from("localidades").select("id, negocio_id"),
      supabase.from("sucursales").select("id, localidad_id, activo"),
      supabase.from("pagos_plataforma").select("monto, metodo, created_at").eq("anulado", false).gte("created_at", inicioMes.toISOString()),
    ]);
    return { r, n, p, l, s, pagos };
  };

  const aplicar = ({ r, n, p, l, s, pagos }) => {
    if (r.data) setRubros(r.data);
    if (n.data) setNegocios(n.data);
    if (p.data) setPlanes(p.data);
    if (l.data && s.data) {
      const negocioDeLocalidad = Object.fromEntries(l.data.map((x) => [x.id, x.negocio_id]));
      const conteo = {};
      s.data.forEach((x) => {
        if (x.activo === false) return;
        const negocioId = negocioDeLocalidad[x.localidad_id];
        if (negocioId) conteo[negocioId] = (conteo[negocioId] || 0) + 1;
      });
      setSucursalesPorNegocio(conteo);
    }
    if (pagos.data) {
      setIngresosMes(pagos.data.reduce((sum, x) => sum + Number(x.monto || 0), 0));
      const inicioHoy = new Date();
      inicioHoy.setHours(0, 0, 0, 0);
      const hoy = {};
      pagos.data.forEach((x) => {
        if (new Date(x.created_at) < inicioHoy) return;
        const k = grupoMetodo(x.metodo);
        hoy[k] = (hoy[k] || 0) + Number(x.monto || 0);
      });
      setHoyPorMetodo(hoy);
    }
  };

  useEffect(() => {
    let activo = true;
    leerTodo().then((res) => {
      if (!activo) return;
      if (res.r.error || res.n.error) {
        setLoadError((res.r.error || res.n.error).message || "No se pudo cargar el panel.");
      }
      aplicar(res);
      setLoading(false);
    });
    return () => {
      activo = false;
    };
  }, []);

  // Tiempo real: negocios, planes, pagos y sucursales — desde otra
  // pestaña o dispositivo, el panel se actualiza solo (sin spinner).
  useEffect(() => {
    const refrescar = () => leerTodo().then(aplicar);
    const canal = supabase
      .channel(`super-admin-panel-${Math.random().toString(36).slice(2, 10)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "negocios" }, refrescar)
      .on("postgres_changes", { event: "*", schema: "public", table: "planes" }, refrescar)
      .on("postgres_changes", { event: "*", schema: "public", table: "pagos_plataforma" }, refrescar)
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  const stats = useMemo(() => {
    const c = { por_vencer: 0, gracia: 0, suspendido: 0, prueba: 0, activo: 0, exento: 0 };
    negocios.forEach((n) => {
      const g = grupoDeNegocio(n);
      c[g] = (c[g] || 0) + 1;
    });
    return c;
  }, [negocios]);

  /* ---- Acciones de las tarjetas ---- */
  const actualizarNegocio = async (negocio, campos) => {
    setNegocios((prev) => prev.map((n) => (n.id === negocio.id ? { ...n, ...campos } : n)));
    const { error } = await supabase.from("negocios").update(campos).eq("id", negocio.id);
    if (error) setNegocios((prev) => prev.map((n) => (n.id === negocio.id ? negocio : n)));
    return { error };
  };

  const cambiarLogo = async (negocio, file) => {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const fileName = `${negocio.id}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("negocio-logos")
      .upload(fileName, file, { contentType: file.type || "image/jpeg", upsert: false });
    if (uploadError) return { error: uploadError };
    const url = supabase.storage.from("negocio-logos").getPublicUrl(fileName).data?.publicUrl;
    if (!url) return { error: new Error("Sin URL pública") };
    return actualizarNegocio(negocio, { logo_url: url });
  };

  // Alta de un admin del negocio — Edge Function create-cliente
  // (tipo:'admin'): cuenta de Auth + profiles.role='admin' en ese negocio.
  const crearAdmin = async (negocio, { nombre: n, usuario, pin }) => {
    const { error } = await supabase.functions.invoke("create-cliente", {
      body: { tipo: "admin", nombre: n, usuario, pin, negocioId: negocio.id },
    });
    if (error) {
      const body = await error.context?.json?.().catch(() => null);
      return { error: body?.error || "No se pudo crear el acceso." };
    }
    return { error: null };
  };

  return (
    <div className="tz-root">
      <Styles />
      {mostrarBienvenida && (
        <AnimacionNeonBienvenida
          eyebrow="✦ Bienvenido a Tonazo ✦"
          titulo={nombre || "Super Admin"}
          descripcion="Todos los negocios bajo control — ¡a por un gran día! 💪"
          onTerminar={marcarBienvenidaVista}
        />
      )}

      <header className="tz-header">
        <div className="tz-header-row">
          <div className="tz-header-side tz-header-side-left">
            <button className="tz-header-btn" onClick={() => setModal("peticiones")} aria-label="Centro de Peticiones" style={{ position: "relative" }}>
              <Inbox size={19} />
              <span className="tz-header-btn-label">Peticiones</span>
              {peticionesPendientes.length > 0 && <span className="tz-header-btn-badge">{peticionesPendientes.length}</span>}
            </button>
            <button className="tz-header-btn" onClick={() => setModal("estadisticas")} aria-label="Estadísticas">
              <BarChart3 size={19} />
              <span className="tz-header-btn-label">Estadísticas</span>
            </button>
            <button className="tz-header-btn" onClick={() => setModal("cuentas")} aria-label="Gestor de cuentas">
              <UserCog size={19} />
              <span className="tz-header-btn-label">Cuentas</span>
            </button>
          </div>

          <div className="tz-header-center">
            <img src={logo} alt="TONAZO" className="tz-logo" />
            <p className="tz-subtitle">Panel Super Admin</p>
          </div>

          <div className="tz-header-side tz-header-side-right">
            {/* Menú Pagos: igual que en las cajas — cada método con lo
               recaudado HOY al lado. */}
            <div className="tz-header-payment-wrap">
              <button className="tz-header-btn" onClick={() => setPagosMenuOpen((v) => !v)} aria-label="Métodos de pago">
                <Wallet size={19} />
                <span className="tz-header-btn-label">Pagos</span>
              </button>
              {pagosMenuOpen && (
                <>
                  <div className="tz-dropdown-backdrop" onClick={() => setPagosMenuOpen(false)} />
                  <div className="tz-payment-menu">
                    {METODOS_PAGO_SA.map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        className="tz-payment-menu-item"
                        onClick={() => {
                          setMetodoAbierto(m.key);
                          setPagosMenuOpen(false);
                        }}
                      >
                        <CreditCard size={14} />
                        {m.label}
                        {hoyPorMetodo[m.key] > 0 && (
                          <span className="tz-payment-menu-amount">{formatSoles(hoyPorMetodo[m.key])}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button className="tz-header-btn" onClick={signOut} aria-label="Cerrar sesión" title="Cerrar sesión">
              <LogOut size={19} />
              <span className="tz-header-btn-label">Salir</span>
            </button>
            <button className="tz-header-btn" onClick={() => setModal("negocios")} aria-label="Gestor de negocios">
              <Building2 size={19} />
              <span className="tz-header-btn-label">Negocios</span>
            </button>
          </div>
        </div>
      </header>

      <main className="tz-main">
        {loading ? (
          <div className="tz-loading" style={{ minHeight: "40vh" }}>
            <Loader2 className="tz-spin" size={28} />
            <p>Cargando panel…</p>
          </div>
        ) : (
          <>
            {loadError && <p className="tz-error">{loadError}</p>}

            <section className="tz-stats">
              <div className="tz-stat-chip tz-stat-chip-green">
                <span className="tz-stat-label">Ingresos del mes</span>
                <span className="tz-stat-value">{formatSoles(ingresosMes)}</span>
              </div>
              <div className="tz-stat-chip">
                <span className="tz-stat-label">Negocios</span>
                <span className="tz-stat-value tz-cyan">{negocios.length}</span>
                <span className="tz-stat-sub">
                  {stats.activo} activos · {stats.prueba} en prueba · {stats.exento} exentos
                </span>
              </div>
              <div className="tz-stat-chip">
                <span className="tz-stat-label">Por vencer</span>
                <span className="tz-stat-value tz-yellow">{stats.por_vencer}</span>
              </div>
              <div className="tz-stat-chip">
                <span className="tz-stat-label">En gracia / suspendidos</span>
                <span className="tz-stat-value tz-pink">
                  {stats.gracia} / {stats.suspendido}
                </span>
              </div>
              <NegocioEstrellaChip negocios={negocios} />
            </section>

            <h2 style={{ margin: "22px 0 10px" }}>Directorio de Negocios</h2>
            <NegociosDirectorio
              negocios={negocios}
              rubros={rubros}
              planes={planes}
              sucursalesPorNegocio={sucursalesPorNegocio}
              onUpdate={actualizarNegocio}
              onLogoChange={cambiarLogo}
              onCreateAdmin={crearAdmin}
              onRecargar={setPlanNegocio}
              onVerClientes={setVerClientesNegocio}
            />
          </>
        )}
      </main>

      <footer className="tz-page-footer tz-page-footer-admin-grid">
        <button className="tz-footer-btn tz-footer-btn-cierre" onClick={() => setModal("cierre")}>
          <Lock size={18} />
          Cerrar Caja
        </button>
        <button className="tz-footer-btn tz-footer-btn-gastos" onClick={() => setModal("gastos")}>
          <TrendingDown size={18} />
          Gastos
        </button>
        <button className="tz-footer-btn tz-footer-btn-stock" onClick={() => setModal("planes")}>
          <Layers size={18} />
          Planes
        </button>
        <button className="tz-footer-btn tz-footer-btn-misventas" onClick={() => setModal("historial")}>
          <Receipt size={18} />
          Historial de Ventas
        </button>
        <button className="tz-footer-btn tz-footer-btn-catalogo" onClick={() => setModal("rubros")}>
          <LayoutGrid size={18} />
          Rubros
        </button>
        <button className="tz-footer-btn tz-footer-btn-localidades" onClick={() => setModal("contacto")}>
          <Phone size={18} />
          Contacto y Pagos
        </button>
      </footer>

      {modal === "peticiones" && (
        <PeticionesPlanModal peticiones={peticionesPlan} loading={peticionesLoading} onClose={() => setModal(null)} />
      )}
      {modal === "estadisticas" && <EstadisticasModal negocios={negocios} onClose={() => setModal(null)} />}
      {modal === "cuentas" && <CuentasManagerModal negocios={negocios} onClose={() => setModal(null)} />}
      {modal === "negocios" && (
        <GestorNegociosModal negocios={negocios} setNegocios={setNegocios} rubros={rubros} onClose={() => setModal(null)} />
      )}
      {modal === "planes" && <PlanesModal negocios={negocios} onClose={() => setModal(null)} onCambio={setPlanes} />}
      {modal === "historial" && <HistorialPagosModal negocios={negocios} planes={planes} onClose={() => setModal(null)} />}
      {modal === "rubros" && (
        <GestorRubrosModal rubros={rubros} setRubros={setRubros} negocios={negocios} onClose={() => setModal(null)} />
      )}
      {modal === "contacto" && <ContactoPlataformaModal onClose={() => setModal(null)} />}
      {modal === "gastos" && <GastosPlataformaModal onClose={() => setModal(null)} />}
      {modal === "cierre" && <CierreCajaPlataformaModal negocios={negocios} planes={planes} onClose={() => setModal(null)} />}
      {metodoAbierto && (
        <ComprobantesPlataformaModal metodo={metodoAbierto} negocios={negocios} onClose={() => setMetodoAbierto(null)} />
      )}

      {verClientesNegocio && (
        <NegocioClientesModal negocio={verClientesNegocio} onClose={() => setVerClientesNegocio(null)} />
      )}
      {planNegocio && (
        <PlanNegocioModal
          negocio={planNegocio}
          planes={planes}
          onClose={() => setPlanNegocio(null)}
          onActualizado={(actualizado) => setNegocios((prev) => prev.map((n) => (n.id === actualizado.id ? actualizado : n)))}
        />
      )}
    </div>
  );
}
