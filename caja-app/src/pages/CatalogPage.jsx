import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, LogIn, LogOut, Loader2, ShoppingCart, Plus, Minus, ClipboardList, CreditCard, CalendarClock } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCatalog } from "../hooks/useCatalog";
import { usePedidosBadge } from "../hooks/usePedidosBadge";
import { supabase } from "../supabaseClient";
import LoginModal from "../components/LoginModal";
import AnimacionNeonBienvenida from "../components/AnimacionNeonBienvenida";
import { useBienvenidaNeon } from "../hooks/useBienvenidaNeon";
import ClienteFiadoView from "./ClienteFiadoView";
import Styles from "../components/Styles";
import CardDetail from "../components/CardDetail";
import ComboIngredients from "../components/ComboIngredients";
import ProductImage from "../components/ProductImage";
import LogoEasterEgg from "../components/LogoEasterEgg";
import ScrollSpySidebar from "../components/ScrollSpySidebar";
import PedidoCheckoutModal from "../components/PedidoCheckoutModal";
import MisPedidosModal from "../components/MisPedidosModal";
import { formatSoles, formatDate } from "../utils/format";
import { safeGetItem, safeSetItem } from "../utils/safeStorage";
import { distanciaMetros } from "../lib/haversine";
import logo from "../assets/logo.png";
import logoTaxiPe from "../assets/logo-taxipe.png";

// URL pública de Taxi-PE — botón del filtro abre en pestaña nueva, no
// toca la sesión de Caja para nada (login ya unificado del otro lado).
const TAXI_PE_URL = import.meta.env.VITE_TAXI_PE_URL || "https://taxi-pe-app.vercel.app";

// Copiado tal cual de App.jsx: mismo cálculo, mismo criterio de
// "disponible" — el catálogo público necesita saber si algo está
// agotado sin duplicar ninguna lógica de venta real. Incluye el mismo
// stock "virtual" para Combos (resuelve 'comboItems' contra la
// disponibilidad ACTUAL de cada ingrediente, en vez del 'consumos'
// congelado desde que se creó el combo).
function availabilityFor(product, stock, productsById) {
  if (product.esCombo && Array.isArray(product.comboItems) && productsById) {
    return Math.min(
      ...product.comboItems.map(({ productoId, cantidad }) => {
        const ingrediente = productsById[productoId];
        if (!ingrediente) return 0;
        const disponibleIngrediente = availabilityFor(ingrediente, stock, productsById);
        return disponibleIngrediente === Infinity
          ? Infinity
          : Math.floor(disponibleIngrediente / cantidad);
      })
    );
  }

  if (!product.consumes || product.consumes.length === 0) return Infinity;
  return Math.min(
    ...product.consumes.map((c) => Math.floor((stock[c.key] ?? 0) / c.qty))
  );
}

// Precio real con el descuento PERMANENTE del producto ya aplicado
// (migración 0043: 'productos.valor_descuento' + 'tipo_descuento',
// 'porcentaje' o 'fijo' en soles) — único sistema de descuento de la
// app, el catálogo público SÍ necesita mostrar este precio: es una
// rebaja de lista real, configurada desde el botón "%" en /admin.
function effectivePrice(product) {
  if (!product) return 0;
  const valor = product.valorDescuento || 0;
  if (valor <= 0) return product.price;
  const raw =
    product.tipoDescuento === "porcentaje"
      ? product.price * (1 - Math.min(valor, 100) / 100)
      : product.price - valor;
  return Math.max(0, Math.round(raw * 100) / 100);
}

// Copiado de App.jsx (formatDescuentoBadge) — mismo criterio, el
// carrito de pedidos necesita mostrar el mismo badge de descuento que
// ya usa el POS.
function formatDescuentoBadge(product) {
  const valor = product?.valorDescuento || 0;
  if (valor <= 0) return null;
  return product.tipoDescuento === "porcentaje" ? `-${valor}%` : `-${formatSoles(valor)}`;
}

// Ruta pública "/": mostrador de solo lectura, clon visual exacto del
// panel de Admin (mismo <Styles/>, mismas clases tz-) pero sin ninguna
// función operativa/contable — nada de stats, historial, ni acciones
// de venta. Los productos se ven, no se seleccionan: sin onClick, sin
// checkbox, sin selector de cantidad (ver .tz-card-readonly abajo).
export default function CatalogPage() {
  const { session, loading: authLoading, signOut, isCliente, tieneFiado, nombre, saldoTaxi } = useAuth();
  const { mostrar: mostrarBienvenida, marcarVista: marcarBienvenidaVista } = useBienvenidaNeon(
    session?.user?.id,
    isCliente
  );

  // Animación del botón "Fiados": 'hidden' (no renderizado) -> 'in'
  // (recién asignado, pop de entrada) -> al QUITAR el fiado, primero
  // 'out' (reproduce la animación en reversa) y RECIÉN AHÍ 'hidden' —
  // sin este estado intermedio, tieneFiado pasando a false desmontaría
  // el botón de golpe, sin poder verse ninguna salida animada.
  const [fiadosAnim, setFiadosAnim] = useState(isCliente && tieneFiado ? "in" : "hidden");
  useEffect(() => {
    const mostrar = isCliente && tieneFiado;
    setFiadosAnim((prev) => {
      if (mostrar) return "in";
      return prev === "hidden" ? "hidden" : "out";
    });
  }, [isCliente, tieneFiado]);
  useEffect(() => {
    if (fiadosAnim !== "out") return undefined;
    const t = setTimeout(() => setFiadosAnim("hidden"), 600);
    return () => clearTimeout(t);
  }, [fiadosAnim]);

  // Saldo de Taxi-PE (unificación pasajero/cliente) — ya viene de
  // useAuth() (copia local en clientes_fiado, mantenida al día por
  // Realtime nativo de este proyecto — ver AuthContext.jsx). Acá solo
  // se deriva si la membresía sigue vigente.
  const membresiaTaxiVigente =
    !!saldoTaxi?.membresia_vencimiento && new Date(saldoTaxi.membresia_vencimiento) > new Date();

  /* ---- Fase 1 "Pedidos Delivery": carrito del cliente logueado.
     Mismo shape que 'selection' en App.jsx ({ productId: qty }) — un
     cliente sin sesión (o logueado pero no como 'cliente', ej. un
     cajero mirando el catálogo público desde otra pestaña) solo ve el
     catálogo de siempre, de solo lectura, sin carrito. */
  const [carrito, setCarrito] = useState({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [misPedidosOpen, setMisPedidosOpen] = useState(false);
  const misPedidosBadge = usePedidosBadge({ clienteId: session?.user?.id || null });
  const puedeComprar = !!session && isCliente;

  /* ---- Filtro Público de Sucursales: el cliente elige en qué
     Localidad/Sucursal quiere comprar — el catálogo (productos Y
     stock) se recarga solo al cambiar, vía 'useCatalog(publicSucursalId)'
     más abajo (ya reactivo a ese parámetro). La selección se guarda en
     localStorage: un cliente que siempre compra en la misma sucursal no
     debería tener que re-elegirla cada visita.

     Localidades/sucursales se cargan UNA vez (lista completa, activas)
     — es una lista chica, no hace falta lazy/paginado. Mientras carga,
     si lo persistido ya no existe (o nunca hubo nada guardado), cae a
     "Santa Rosa 6.50" como default razonable (la única sucursal
     realmente operando hasta ahora), y si ni esa existe, a la primera
     sucursal disponible — así el catálogo público NUNCA se queda sin
     stock que mostrar por falta de selección. ---- */
  const [publicLocalidades, setPublicLocalidades] = useState([]);
  const [publicSucursales, setPublicSucursales] = useState([]);
  const [publicLocalesLoading, setPublicLocalesLoading] = useState(true);
  const [publicLocalidadId, setPublicLocalidadId] = useState(() =>
    safeGetItem("tz_public_localidad_id", "")
  );
  const [publicSucursalId, setPublicSucursalId] = useState(() =>
    safeGetItem("tz_public_sucursal_id", "")
  );

  useEffect(() => {
    let active = true;
    async function loadLocales() {
      const [{ data: locRows, error: locErr }, { data: sucRows, error: sucErr }] = await Promise.all([
        supabase.from("localidades").select("id, nombre").eq("activo", true).order("nombre"),
        supabase
          .from("sucursales")
          .select("id, nombre, localidad_id, lat, lng")
          .eq("activo", true)
          .order("nombre"),
      ]);
      if (!active) return;
      if (locErr) console.error("[CatalogPage] Error cargando localidades:", locErr);
      if (sucErr) console.error("[CatalogPage] Error cargando sucursales:", sucErr);
      setPublicLocalidades(locRows || []);
      setPublicSucursales(sucRows || []);
      setPublicLocalesLoading(false);
    }
    loadLocales();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (publicLocalesLoading) return;
    // Ya hay una sucursal elegida (persistida o recién seleccionada) y
    // sigue existiendo — no tocar nada.
    if (publicSucursalId && publicSucursales.some((s) => s.id === publicSucursalId)) return;

    const preferida =
      publicSucursales.find((s) => s.nombre === "Santa Rosa 6.50") || publicSucursales[0];
    if (!preferida) return;
    setPublicSucursalId(preferida.id);
    setPublicLocalidadId(preferida.localidad_id);
  }, [publicLocalesLoading, publicSucursales, publicSucursalId]);

  // Sucursal automática por geolocalización — se recalcula CADA VEZ que
  // se abre la tienda (nunca se guarda "la última detectada": si el
  // cliente viaja, tiene que reflejar dónde está ahora). Mismo patrón
  // getCurrentPosition que ya usa RadarGlobal.jsx en Taxi-PE —
  // denegado/sin soporte no toca nada, se queda con lo que ya haya
  // (localStorage restaurado, o el default "Santa Rosa 6.50" del efecto
  // de arriba). Corre DESPUÉS de ese efecto a propósito: el default es
  // un placeholder seguro mientras se resuelve el GPS, y si el GPS
  // contesta, lo pisa con la sucursal real más cercana.
  const geolocalizacionIntentada = useRef(false);
  useEffect(() => {
    if (geolocalizacionIntentada.current) return;
    if (publicLocalesLoading) return;
    const conCoordenadas = publicSucursales.filter((s) => s.lat != null && s.lng != null);
    if (conCoordenadas.length === 0) return;
    if (!navigator.geolocation) return;
    geolocalizacionIntentada.current = true;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const masCercana = conCoordenadas.reduce((mejor, s) => {
          const d = distanciaMetros(latitude, longitude, s.lat, s.lng);
          return d < mejor.distancia ? { fila: s, distancia: d } : mejor;
        }, { fila: conCoordenadas[0], distancia: distanciaMetros(latitude, longitude, conCoordenadas[0].lat, conCoordenadas[0].lng) }).fila;
        setPublicSucursalId(masCercana.id);
        setPublicLocalidadId(masCercana.localidad_id);
      },
      () => {
        // Denegado o falló — se queda con el default/lo restaurado de localStorage.
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [publicLocalesLoading, publicSucursales]);

  useEffect(() => {
    safeSetItem("tz_public_localidad_id", publicLocalidadId || "");
    safeSetItem("tz_public_sucursal_id", publicSucursalId || "");
  }, [publicLocalidadId, publicSucursalId]);

  const publicSucursalesDeLocalidad = publicSucursales.filter(
    (s) => s.localidad_id === publicLocalidadId
  );

  const {
    sections,
    productsById,
    stock,
    loading: catalogLoading,
    error,
  } = useCatalog(publicSucursalId);
  const [activeTab, setActiveTab] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [fiadoOpen, setFiadoOpen] = useState(false);

  // El admin puede ocultar productos puntuales del catálogo público
  // (desde "Editar Stock" en /admin) sin dejar de venderlos en el POS.
  // Acá se filtran, y se descartan grupos/secciones que queden vacíos.
  const visibleSections = useMemo(
    () =>
      sections
        .map((section) => ({
          ...section,
          groups: section.groups
            .map((group) => ({
              ...group,
              items: group.items.filter((item) => item.visiblePublico !== false),
            }))
            .filter((group) => group.items.length > 0),
        }))
        .filter((section) => section.groups.length > 0),
    [sections]
  );

  useEffect(() => {
    setActiveTab((prev) => prev || visibleSections[0]?.key || "");
  }, [visibleSections]);

  // Un pedido pertenece a UNA sola sucursal — si el cliente cambia de
  // sucursal a mitad de armar su carrito, lo vaciamos (mezclar
  // productos de dos sucursales distintas en un mismo pedido no tiene
  // sentido: cada una tiene su propio stock/inventario_sucursales).
  useEffect(() => {
    setCarrito({});
  }, [publicSucursalId]);

  // Agregar al carrito es SIEMPRE aditivo (a diferencia del
  // toggleProduct de App.jsx, que deselecciona si ya estaba elegido):
  // acá no hay "deseleccionar tocando la tarjeta de nuevo", el cliente
  // usa el stepper +/- una vez que el producto ya está en su carrito.
  // Clampa al stock disponible, mismo criterio que selectProductForSale
  // en App.jsx. La Venta por Peso queda fuera del carrito público (acá
  // no hay balanza — pesar el producto sigue siendo tarea del cajero al
  // recibir el pedido, no algo que el cliente pueda estimar solo).
  const agregarAlCarrito = (product) => {
    if (product.ventaPorPeso) return;
    const avail = availabilityFor(product, stock, productsById);
    if (avail <= 0) return;
    setCarrito((prev) => {
      const current = prev[product.id] ?? 0;
      return { ...prev, [product.id]: Math.min(current + 1, avail) };
    });
  };

  const cambiarCantidadCarrito = (productId, qty) => {
    setCarrito((prev) => ({ ...prev, [productId]: qty }));
  };

  const quitarDelCarrito = (productId) => {
    setCarrito((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const carritoIds = Object.keys(carrito);
  const carritoTotalItems = carritoIds.reduce((sum, id) => sum + carrito[id], 0);
  const carritoTotalPrecio = carritoIds.reduce(
    (sum, id) => sum + effectivePrice(productsById[id]) * carrito[id],
    0
  );

  const activeSection = visibleSections.find((s) => s.key === activeTab);

  /* ---- Navegación estilo "Fortnite" (ScrollSpySidebar) — copiado tal
     cual del mismo mecanismo en App.jsx: un ref por Subgrupo de la
     categoría activa (acá también se renderizan todos seguidos, sin
     accordion), para poder saltar entre ellos. ---- */
  const groupSectionRefs = useRef({});
  const scrollspyItems = (activeSection?.groups || [])
    .map((g, gi) => ({ id: gi, label: g.title }))
    .filter((it) => it.label);

  // El botón que llama a esto solo se muestra con isCliente && tieneFiado
  // (o sea, ya con sesión) — sin rama "sin sesión" que abra el login.
  const handleFiadosClick = () => setFiadoOpen(true);

  if (catalogLoading) {
    return (
      <div className="tz-root tz-loading">
        <Styles />
        <Loader2 className="tz-spin" size={34} />
        <p>Cargando catálogo…</p>
      </div>
    );
  }

  return (
    <div className="tz-root">
      <Styles />
      {mostrarBienvenida && (
        <AnimacionNeonBienvenida
          eyebrow="✦ Bienvenido a Tonazo ✦"
          titulo={nombre}
          descripcion="Ya puedes comprar en la tienda — ¡Qué disfrutes! 😉"
          onTerminar={marcarBienvenidaVista}
        />
      )}
      <header className="tz-header">
        <div className="tz-header-row">
          <div className="tz-header-side tz-header-side-left">
            {fiadosAnim !== "hidden" && (
              <span
                className={`tz-fiados-pop-wrap ${fiadosAnim === "out" ? "tz-fiados-pop-wrap-out" : ""}`}
              >
                <button
                  className="tz-header-btn"
                  onClick={handleFiadosClick}
                  aria-label="Fiados"
                >
                  <BookOpen size={19} />
                  <span className="tz-header-btn-label">Fiados</span>
                </button>
              </span>
            )}
            {puedeComprar && (
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
            <LogoEasterEgg src={logo} alt="TONAZO!" className="tz-logo" />
            <p className="tz-subtitle">Compra Ya</p>
          </div>

          <div className="tz-header-side tz-header-side-right">
            {authLoading ? (
              <span className="tz-header-btn" style={{ visibility: "hidden" }} />
            ) : session ? (
              <button
                className="tz-header-btn"
                onClick={signOut}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut size={19} />
                <span className="tz-header-btn-label">Salir</span>
              </button>
            ) : (
              <button
                className="tz-header-btn"
                onClick={() => setLoginOpen(true)}
                aria-label="Ingresar"
              >
                <LogIn size={19} />
                <span className="tz-header-btn-label">Login</span>
              </button>
            )}
            {/* Mismo tz-stat-chip que usa el conductor en Taxi-PE para
               este par (Créditos/Vigencia) — acá se muestra UNO SOLO,
               el que corresponda a lo que el cliente tiene: si tiene
               membresía vigente, esa; si no, sus créditos (si tiene
               algo); si no tiene ninguno de los dos, no se muestra
               nada. */}
            {isCliente && session && saldoTaxi && membresiaTaxiVigente && (
              <div className="tz-header-saldo tz-stat-chip tz-stat-chip-green">
                <span className="tz-stat-label">
                  <CalendarClock size={13} /> Vigencia
                </span>
                <span className="tz-stat-value tz-green">{formatDate(saldoTaxi.membresia_vencimiento)}</span>
              </div>
            )}
            {isCliente && session && saldoTaxi && !membresiaTaxiVigente && Number(saldoTaxi.creditos_disponibles) > 0 && (
              <div className="tz-header-saldo tz-stat-chip">
                <span className="tz-stat-label">
                  <CreditCard size={13} /> Créditos
                </span>
                <span className="tz-stat-value tz-cyan">{saldoTaxi.creditos_disponibles}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ---------------- Filtro Público de Sucursales ---------------- */}
      {!publicLocalesLoading && publicLocalidades.length > 0 && (
        <div className="tz-admin-filterbar">
          <div className="tz-admin-filter-group">
            <label className="tz-admin-filter-label">Localidad</label>
            <select
              className="tz-admin-filter-select"
              value={publicLocalidadId}
              onChange={(e) => {
                const locId = e.target.value;
                setPublicLocalidadId(locId);
                // La sucursal elegida puede no pertenecer a la nueva
                // localidad — se limpia para forzar a elegir una de
                // verdad, en vez de dejar el catálogo mostrando el
                // stock de una sucursal que ya no coincide con lo
                // elegido arriba.
                const sigueValiendo = publicSucursales.some(
                  (s) => s.id === publicSucursalId && s.localidad_id === locId
                );
                if (!sigueValiendo) setPublicSucursalId("");
              }}
            >
              {publicLocalidades.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="tz-admin-filter-group">
            <label className="tz-admin-filter-label">Sucursal</label>
            <select
              className="tz-admin-filter-select"
              value={publicSucursalId}
              onChange={(e) => setPublicSucursalId(e.target.value)}
            >
              <option value="">Elige una sucursal…</option>
              {publicSucursalesDeLocalidad.map((suc) => (
                <option key={suc.id} value={suc.id}>
                  {suc.nombre}
                </option>
              ))}
            </select>
          </div>
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
      )}

      <main className="tz-main">
        <ScrollSpySidebar
          items={scrollspyItems}
          getSectionEl={(id) => groupSectionRefs.current[id]}
        />
        {/* ---------------- TABS ---------------- */}
        {visibleSections.length > 0 && (
          <nav className="tz-tabs">
            {visibleSections.map((s) => (
              <button
                key={s.key}
                className={`tz-tab ${activeTab === s.key ? "tz-tab-active" : ""} ${
                  s.label.trim().toLowerCase() === "combos" ? "tz-tab-combos" : ""
                }`}
                onClick={() => setActiveTab(s.key)}
              >
                {s.label}
              </button>
            ))}
          </nav>
        )}

        {/* ---------------- MOSTRADOR (solo lectura) ---------------- */}
        <section className="tz-products">
          {error ? (
            <div className="tz-empty">
              <p>{error}</p>
            </div>
          ) : !activeSection ? (
            <div className="tz-empty">
              <p>Todavía no hay productos publicados.</p>
            </div>
          ) : (
            activeSection.groups.map((group, gi) => (
              <div key={gi} className="tz-group" ref={(el) => (groupSectionRefs.current[gi] = el)}>
                {group.title && (
                  <div className="tz-group-heading">
                    <span className="tz-badge">{group.numero}</span>
                    <h2>{group.title}</h2>
                  </div>
                )}
                <div className="tz-grid">
                  {group.items.map((item) => {
                    const avail = availabilityFor(item, stock, productsById);
                    const soldOut = avail <= 0;
                    const low = avail > 0 && avail <= 3;

                    return (
                      <div
                        key={item.id}
                        className={`tz-card tz-card-readonly ${
                          soldOut ? "tz-card-disabled" : ""
                        } ${item.esCombo ? "tz-card-combo" : ""}`}
                      >
                        <div className="tz-card-row">
                          <ProductImage item={item} editable={false} />
                          <div className="tz-card-main">
                            <div className="tz-card-top">
                              <div className="tz-card-info">
                                {item.combo && <span className="tz-combo">{item.combo}</span>}
                                <h3 className="tz-card-name">
                                  {item.name.split(/(\+)/).map((part, i) =>
                                    part === "+" ? (
                                      <span className="tz-name-plus" key={i}>
                                        +
                                      </span>
                                    ) : (
                                      <span key={i}>{part}</span>
                                    )
                                  )}
                                </h3>
                                <CardDetail item={item} />
                                <ComboIngredients item={item} productsById={productsById} />
                              </div>
                            </div>

                            <div className="tz-card-bottom">
                              <div className="tz-card-stockrow">
                                {soldOut ? (
                                  <span className="tz-tag tz-tag-danger">AGOTADO</span>
                                ) : low ? (
                                  <span className="tz-tag tz-tag-warn">¡Quedan {avail}!</span>
                                ) : (
                                  <span className="tz-tag tz-tag-ok">Disponible</span>
                                )}
                              </div>
                              <div className="tz-card-priceqty">
                                <div className="tz-price-block">
                                  <span className="tz-price-label">Precio</span>
                                  {item.valorDescuento > 0 ? (
                                    <>
                                      <span className="tz-price-original">
                                        {formatSoles(item.price)}
                                      </span>
                                      <span className="tz-price tz-price-discounted">
                                        {formatSoles(effectivePrice(item))}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="tz-price">{formatSoles(item.price)}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Fase 1 "Pedidos Delivery": solo un cliente
                               logueado puede agregar al carrito — la
                               Venta por Peso queda fuera (no hay balanza
                               acá, ver agregarAlCarrito). */}
                            {puedeComprar && !item.ventaPorPeso && !soldOut && (
                              <div className="tz-card-cart-controls">
                                {carrito[item.id] ? (
                                  <div className="tz-qty-stepper">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        carrito[item.id] <= 1
                                          ? quitarDelCarrito(item.id)
                                          : cambiarCantidadCarrito(item.id, carrito[item.id] - 1)
                                      }
                                      aria-label={`Quitar una unidad de ${item.name}`}
                                    >
                                      <Minus size={14} />
                                    </button>
                                    <span>{carrito[item.id]}</span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        cambiarCantidadCarrito(
                                          item.id,
                                          Math.min(carrito[item.id] + 1, avail)
                                        )
                                      }
                                      disabled={carrito[item.id] >= avail}
                                      aria-label={`Agregar una unidad más de ${item.name}`}
                                    >
                                      <Plus size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    className="tz-card-add-btn"
                                    onClick={() => agregarAlCarrito(item)}
                                  >
                                    <Plus size={14} /> Agregar
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      {/* Fase 1 "Pedidos Delivery": barra flotante del carrito — solo
         aparece con algo adentro, y con el checkout cerrado (mientras
         el checkout está abierto ya se ve el mismo resumen ahí). */}
      {puedeComprar && carritoTotalItems > 0 && !checkoutOpen && (
        <button
          type="button"
          className="tz-cart-floating-bar"
          onClick={() => setCheckoutOpen(true)}
        >
          <span className="tz-cart-floating-bar-count">{carritoTotalItems}</span>
          {/* Color explícito (no heredado): en algunos navegadores/SO en
             modo claro, el ícono terminaba heredando el negro del
             index.css base de Vite (:root { color } cambia con
             prefers-color-scheme) en vez del blanco de la app — mismo
             problema que ya se documentó y resolvió para h1/h2 más
             arriba en Styles.jsx. */}
          <ShoppingCart size={18} color="#f4f2ff" />
          <span className="tz-cart-floating-bar-total">{formatSoles(carritoTotalPrecio)}</span>
        </button>
      )}

      {loginOpen && (
        <LoginModal onClose={() => setLoginOpen(false)} onSuccess={() => setLoginOpen(false)} />
      )}
      {fiadoOpen && <ClienteFiadoView onClose={() => setFiadoOpen(false)} />}
      {checkoutOpen && (
        <PedidoCheckoutModal
          carrito={carritoIds.map((id) => ({
            product: productsById[id],
            qty: carrito[id],
            avail: availabilityFor(productsById[id], stock, productsById),
            discountLabel: formatDescuentoBadge(productsById[id]),
          }))}
          total={carritoTotalPrecio}
          sucursalId={publicSucursalId}
          session={session}
          onQtyChange={cambiarCantidadCarrito}
          onRemove={quitarDelCarrito}
          onClose={() => setCheckoutOpen(false)}
          onPedidoConfirmado={() => setCarrito({})}
        />
      )}
      {misPedidosOpen && (
        <MisPedidosModal session={session} onClose={() => setMisPedidosOpen(false)} />
      )}
    </div>
  );
}
