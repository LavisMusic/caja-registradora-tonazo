import { useEffect, useMemo, useState } from "react";
import { BookOpen, LogIn, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCatalog } from "../hooks/useCatalog";
import { supabase } from "../supabaseClient";
import LoginModal from "../components/LoginModal";
import ClienteFiadoView from "./ClienteFiadoView";
import Styles from "../components/Styles";
import CardDetail from "../components/CardDetail";
import ComboIngredients from "../components/ComboIngredients";
import ProductImage from "../components/ProductImage";
import LogoEasterEgg from "../components/LogoEasterEgg";
import { formatSoles } from "../utils/format";
import logo from "../assets/logo.png";

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

// Ruta pública "/": mostrador de solo lectura, clon visual exacto del
// panel de Admin (mismo <Styles/>, mismas clases tz-) pero sin ninguna
// función operativa/contable — nada de stats, historial, ni acciones
// de venta. Los productos se ven, no se seleccionan: sin onClick, sin
// checkbox, sin selector de cantidad (ver .tz-card-readonly abajo).
export default function CatalogPage() {
  const { session, loading: authLoading, signOut } = useAuth();

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
    typeof window !== "undefined" ? localStorage.getItem("tz_public_localidad_id") || "" : ""
  );
  const [publicSucursalId, setPublicSucursalId] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("tz_public_sucursal_id") || "" : ""
  );

  useEffect(() => {
    let active = true;
    async function loadLocales() {
      const [{ data: locRows, error: locErr }, { data: sucRows, error: sucErr }] = await Promise.all([
        supabase.from("localidades").select("id, nombre").eq("activo", true).order("nombre"),
        supabase
          .from("sucursales")
          .select("id, nombre, localidad_id")
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("tz_public_localidad_id", publicLocalidadId || "");
    localStorage.setItem("tz_public_sucursal_id", publicSucursalId || "");
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

  const activeSection = visibleSections.find((s) => s.key === activeTab);

  const handleFiadosClick = () => {
    if (session) {
      setFiadoOpen(true);
    } else {
      setLoginOpen(true);
    }
  };

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
      <header className="tz-header">
        <div className="tz-header-row">
          <button
            className="tz-header-btn"
            onClick={handleFiadosClick}
            aria-label="Fiados"
          >
            <BookOpen size={19} />
            <span className="tz-header-btn-label">Fiados</span>
          </button>

          <div className="tz-header-center">
            <LogoEasterEgg src={logo} alt="TONAZO!" className="tz-logo" />
            <p className="tz-subtitle">Compra Ya</p>
          </div>

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
        </div>
      )}

      <main className="tz-main">
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
              <div key={gi} className="tz-group">
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

      {loginOpen && (
        <LoginModal
          onClose={() => setLoginOpen(false)}
          onSuccess={() => {
            setLoginOpen(false);
            setFiadoOpen(true);
          }}
        />
      )}
      {fiadoOpen && <ClienteFiadoView onClose={() => setFiadoOpen(false)} />}
    </div>
  );
}
