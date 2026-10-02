import { useEffect, useMemo, useState } from "react";
import AnimacionNeonBienvenida from "../components/AnimacionNeonBienvenida";
import { useBienvenidaNeon } from "../hooks/useBienvenidaNeon";
import { Link } from "react-router-dom";
import {
  Loader2,
  Store,
  LogIn,
  LogOut,
  ClipboardList,
  CreditCard,
  CalendarClock,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { usePedidosBadge } from "../hooks/usePedidosBadge";
import { supabase } from "../supabaseClient";
import Styles from "../components/Styles";
import LoginModal from "../components/LoginModal";
import MisPedidosModal from "../components/MisPedidosModal";
import { formatDate } from "../utils/format";
import logo from "../assets/logo.webp";
import logoTaxiPe from "../assets/logo-taxipe.webp";
import { planPermiteOnline, calcularEstadoPlan } from "../lib/planes";
import { useContactoPlataforma } from "../hooks/useContactoPlataforma";
import { buildWhatsappLink } from "../lib/whatsapp";

const TAXI_PE_URL = import.meta.env.VITE_TAXI_PE_URL || "https://taxi-pe-app.vercel.app";

/* Fase 2: directorio público en "/directorio" — grilla estilo Friv de
   todos los negocios activos, cada tarjeta lleva a su propia tienda
   (/directorio/:slug, ver CatalogPage.jsx). Mismo <Styles/>/clases tz-
   que el resto de la app, pero acá la barra que en el catálogo separa
   Subgrupos por Categoría se convierte en un cuadro FIJO a la
   izquierda con Rubros, y el resto de la pantalla es pura vidriera de
   negocios en vez de productos. Sin theming/personalización todavía
   (decidido con el usuario: eso queda para el final, cuando se
   retome).

   "Mis Pedidos"/Login/Taxi-PE/saldo — Y el filtro de Localidad/
   Sucursal — viven acá TAMBIÉN (no solo dentro del catálogo de cada
   negocio, pedido explícito). El filtro de Localidad/Sucursal es
   distinto del que usa el catálogo: ahí elige DÓNDE comprar DENTRO de
   un negocio ya elegido; acá filtra QUÉ NEGOCIOS mostrar, agrupando
   por nombre de localidad — localidades/sucursales no son una tabla
   compartida entre negocios (cada uno arma la suya), así que agrupar
   por nombre (case-insensitive) es la única forma de que "San Ramón"
   junte los negocios que tienen una sede ahí. */
export default function DirectorioPage() {
  const { session, loading: authLoading, signOut, isCliente, saldoTaxi, nombre } = useAuth();
  // Botón "¿Tienes un negocio? Súmate a Tonazo" → WhatsApp de afiliación
  // (lo configura el super admin en su gestor de contacto).
  const { whatsapp_afiliacion } = useContactoPlataforma();
  const linkAfiliacion = buildWhatsappLink(
    whatsapp_afiliacion,
    "Hola, tengo un negocio y quiero sumarlo al directorio de Tonazo."
  );
  // Bienvenida del cliente — una vez por acceso. Comparte la clave
  // (session.user.id) con la del catálogo de cada negocio
  // (CatalogPage.jsx), así sale UNA sola vez: en el primer lugar donde
  // entre, directorio o catálogo.
  const { mostrar: mostrarBienvenida, marcarVista: marcarBienvenidaVista } = useBienvenidaNeon(
    session?.user?.id,
    isCliente
  );
  const [loginOpen, setLoginOpen] = useState(false);
  const [misPedidosOpen, setMisPedidosOpen] = useState(false);
  const misPedidosBadge = usePedidosBadge({ clienteId: session?.user?.id || null });

  const membresiaTaxiVigente =
    !!saldoTaxi?.membresia_vencimiento && new Date(saldoTaxi.membresia_vencimiento) > new Date();
  const saldoChipContenido =
    isCliente && session && saldoTaxi && membresiaTaxiVigente ? (
      <div className="tz-stat-chip tz-stat-chip-green">
        <span className="tz-stat-label">
          <CalendarClock size={13} /> Vigencia
        </span>
        <span className="tz-stat-value tz-green">{formatDate(saldoTaxi.membresia_vencimiento)}</span>
      </div>
    ) : isCliente && session && saldoTaxi && !membresiaTaxiVigente && Number(saldoTaxi.creditos_disponibles) > 0 ? (
      <div className="tz-stat-chip">
        <span className="tz-stat-label">
          <CreditCard size={13} /> Créditos
        </span>
        <span className="tz-stat-value tz-cyan">{saldoTaxi.creditos_disponibles}</span>
      </div>
    ) : null;

  const [rubros, setRubros] = useState([]);
  const [negocios, setNegocios] = useState([]);
  const [localidades, setLocalidades] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rubroActivoId, setRubroActivoId] = useState("todos");
  const [localidadFiltro, setLocalidadFiltro] = useState("todas");
  const [sucursalFiltro, setSucursalFiltro] = useState("todas");
  // Sube cada vez que cambia algún negocio (Realtime): se vuelve a leer
  // la vidriera, así un negocio que vence o se renueva sale/entra solo.
  const [versionNegocios, setVersionNegocios] = useState(0);
  useEffect(() => {
    const canal = supabase
      .channel("directorio-negocios")
      .on("postgres_changes", { event: "*", schema: "public", table: "negocios" }, () =>
        setVersionNegocios((v) => v + 1)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const [
        { data: rubrosData, error: rubrosErr },
        { data: negociosData, error: negociosErr },
        { data: localidadesData, error: localidadesErr },
        { data: sucursalesData, error: sucursalesErr },
      ] = await Promise.all([
        supabase.from("rubros").select("*").eq("activo", true).order("orden"),
        supabase.from("negocios").select("*").eq("activo", true).order("orden"),
        supabase.from("localidades").select("id, nombre, negocio_id").eq("activo", true),
        supabase.from("sucursales").select("id, nombre, localidad_id").eq("activo", true),
      ]);
      if (!active) return;
      if (rubrosErr || negociosErr || localidadesErr || sucursalesErr) {
        setError("No se pudo cargar el directorio.");
        setLoading(false);
        return;
      }
      setRubros(rubrosData || []);
      // Un negocio sin slug todavía no tiene URL de tienda — no tiene
      // sentido mostrarlo en la vidriera pública (el super-admin lo ve
      // igual en su propio panel, con el aviso de "sin slug").
      // Fase 4: con el plan vencido (gracia/suspendido) sale de la vidriera.
      setNegocios((negociosData || []).filter((n) => n.slug && planPermiteOnline(calcularEstadoPlan(n))));
      setLocalidades(localidadesData || []);
      setSucursales(sucursalesData || []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [versionNegocios]);

  // Agrupa localidades de TODOS los negocios por nombre (sin distinguir
  // mayúsculas) — es lo más parecido a "ciudad/zona" que hay, ya que
  // localidades no es una tabla compartida entre negocios.
  const localidadesPorNombre = useMemo(() => {
    const map = {};
    localidades.forEach((l) => {
      const key = l.nombre.trim().toLowerCase();
      (map[key] ||= { label: l.nombre, negocioIds: new Set(), localidadIds: [] });
      map[key].negocioIds.add(l.negocio_id);
      map[key].localidadIds.push(l.id);
    });
    return map;
  }, [localidades]);

  const opcionesLocalidad = useMemo(
    () => Object.entries(localidadesPorNombre).sort((a, b) => a[1].label.localeCompare(b[1].label)),
    [localidadesPorNombre]
  );

  const sucursalesDeLocalidad = useMemo(() => {
    if (localidadFiltro === "todas") return [];
    const grupo = localidadesPorNombre[localidadFiltro];
    if (!grupo) return [];
    return sucursales.filter((s) => grupo.localidadIds.includes(s.localidad_id));
  }, [localidadFiltro, localidadesPorNombre, sucursales]);

  const negocioIdPorSucursalId = useMemo(() => {
    const localidadPorId = Object.fromEntries(localidades.map((l) => [l.id, l.negocio_id]));
    return Object.fromEntries(
      sucursales.map((s) => [s.id, localidadPorId[s.localidad_id] || null])
    );
  }, [sucursales, localidades]);

  const negociosFiltrados = useMemo(() => {
    return negocios.filter((n) => {
      if (rubroActivoId !== "todos" && n.rubro_id !== rubroActivoId) return false;
      if (sucursalFiltro !== "todas") {
        if (negocioIdPorSucursalId[sucursalFiltro] !== n.id) return false;
      } else if (localidadFiltro !== "todas") {
        const grupo = localidadesPorNombre[localidadFiltro];
        if (!grupo || !grupo.negocioIds.has(n.id)) return false;
      }
      return true;
    });
  }, [negocios, rubroActivoId, localidadFiltro, sucursalFiltro, localidadesPorNombre, negocioIdPorSucursalId]);

  if (loading) {
    return (
      <div className="tz-root tz-loading">
        <Styles />
        <Loader2 className="tz-spin" size={34} />
      </div>
    );
  }

  return (
    <div className="tz-root">
      <Styles />
      {mostrarBienvenida && (
        <AnimacionNeonBienvenida
          eyebrow="✦ Bienvenido a Tonazo ✦"
          titulo={nombre || "Cliente"}
          descripcion="Encuentra tus negocios favoritos y pide sin salir de casa — ¡Qué disfrutes! 😉"
          onTerminar={marcarBienvenidaVista}
        />
      )}
      <header className="tz-header">
        <div className="tz-header-row">
          <div className="tz-header-side tz-header-side-left">
            {!!session && isCliente && (
              <button
                className="tz-header-btn"
                onClick={() => setMisPedidosOpen(true)}
                aria-label="Mis Pedidos"
                style={{ position: "relative" }}
              >
                <ClipboardList size={19} />
                <span className="tz-header-btn-label">Mis Pedidos</span>
                {misPedidosBadge > 0 && (
                  <span className="tz-badge-dot">{misPedidosBadge > 9 ? "9+" : misPedidosBadge}</span>
                )}
              </button>
            )}
          </div>
          <div className="tz-header-center">
            <img src={logo} alt="Directorio" className="tz-logo" />
            <p className="tz-subtitle">Elige una tienda</p>
          </div>
          <div className="tz-header-side tz-header-side-right">
            {authLoading ? (
              <span className="tz-header-btn" style={{ visibility: "hidden" }} />
            ) : session ? (
              <button className="tz-header-btn" onClick={signOut} aria-label="Cerrar sesión" title="Cerrar sesión">
                <LogOut size={19} />
                <span className="tz-header-btn-label">Salir</span>
              </button>
            ) : (
              <button className="tz-header-btn" onClick={() => setLoginOpen(true)} aria-label="Ingresar">
                <LogIn size={19} />
                <span className="tz-header-btn-label">Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {opcionesLocalidad.length > 0 && (
        <div className="tz-admin-filterbar">
          <div className="tz-filtrobar-grid">
            <div className="tz-filtrobar-side tz-filtrobar-side-left">
              {TAXI_PE_URL && (
                <a
                  href={TAXI_PE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tz-admin-filter-taxipe-btn"
                  aria-label="Ir a Taxi-PE"
                  title="Ir a Taxi-PE"
                >
                  <img src={logoTaxiPe} alt="Taxi-PE" />
                </a>
              )}
            </div>

            <div className="tz-admin-filter-pareja">
              <div className="tz-admin-filter-group tz-filtro-localidad-group">
                <label className="tz-admin-filter-label tz-filtro-localidad-label">Localidad</label>
                <select
                  className="tz-admin-filter-select"
                  value={localidadFiltro}
                  onChange={(e) => {
                    setLocalidadFiltro(e.target.value);
                    setSucursalFiltro("todas");
                  }}
                >
                  <option value="todas">Todas</option>
                  {opcionesLocalidad.map(([key, grupo]) => (
                    <option key={key} value={key}>
                      {grupo.label}
                    </option>
                  ))}
                </select>
              </div>
              {localidadFiltro !== "todas" && sucursalesDeLocalidad.length > 0 && (
                <div className="tz-admin-filter-group tz-filtro-sucursal-group">
                  <label className="tz-admin-filter-label tz-filtro-sucursal-label">Sucursal</label>
                  <select
                    className="tz-admin-filter-select"
                    value={sucursalFiltro}
                    onChange={(e) => setSucursalFiltro(e.target.value)}
                  >
                    <option value="todas">Todas</option>
                    {sucursalesDeLocalidad.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="tz-filtrobar-side tz-filtrobar-side-right">
              {saldoChipContenido && <div className="tz-filtrobar-saldo">{saldoChipContenido}</div>}
            </div>
          </div>
        </div>
      )}

      <main className="tz-main tz-dir-main">
        <nav className="tz-dir-sidebar">
          <button
            type="button"
            className={`tz-dir-sidebar-item ${rubroActivoId === "todos" ? "tz-dir-sidebar-item-active" : ""}`}
            onClick={() => setRubroActivoId("todos")}
          >
            Todos
          </button>
          {rubros.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`tz-dir-sidebar-item ${rubroActivoId === r.id ? "tz-dir-sidebar-item-active" : ""}`}
              onClick={() => setRubroActivoId(r.id)}
            >
              {r.nombre}
            </button>
          ))}
        </nav>

        <section className="tz-dir-grid-wrap">
          {error ? (
            <div className="tz-empty">
              <p>{error}</p>
            </div>
          ) : negociosFiltrados.length === 0 ? (
            <div className="tz-empty">
              <p>Todavía no hay tiendas que coincidan con el filtro.</p>
            </div>
          ) : (
            <div className="tz-dir-grid">
              {negociosFiltrados.map((n) => (
                <Link key={n.id} to={`/directorio/${n.slug}`} className="tz-dir-card">
                  {n.logo_url ? (
                    <img src={n.logo_url} alt={n.nombre} className="tz-dir-card-logo" />
                  ) : (
                    <span className="tz-dir-card-logo-placeholder">
                      <Store size={30} />
                    </span>
                  )}
                  <span className="tz-dir-card-nombre">{n.nombre}</span>
                </Link>
              ))}
            </div>
          )}
          {linkAfiliacion && (
            <a className="tz-dir-afiliar" href={linkAfiliacion} target="_blank" rel="noopener noreferrer">
              <Store size={18} />
              <span>
                <strong>¿Tienes un negocio?</strong> Súmate a Tonazo
              </span>
            </a>
          )}
        </section>
      </main>

      {loginOpen && (
        <LoginModal onClose={() => setLoginOpen(false)} onSuccess={() => setLoginOpen(false)} />
      )}
      {misPedidosOpen && (
        <MisPedidosModal session={session} onClose={() => setMisPedidosOpen(false)} />
      )}
    </div>
  );
}
