import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Store } from "lucide-react";
import { supabase } from "../supabaseClient";
import Styles from "../components/Styles";
import logo from "../assets/logo.webp";

/* Fase 2: directorio público en "/" — grilla estilo Friv de todos los
   negocios activos, cada tarjeta lleva a su propia tienda
   (/:slug/tienda, ver CatalogPage.jsx). Mismo <Styles/>/clases tz- que
   el resto de la app (pedido explícito: "una página idéntica a la que
   ya tenemos para la interfaz del cliente"), pero acá la barra que en
   el catálogo separa Subgrupos por Categoría se convierte en un
   cuadro FIJO a la izquierda con Rubros, y el resto de la pantalla es
   pura vidriera de negocios en vez de productos. Sin theming/
   personalización todavía (decidido con el usuario: eso queda para el
   final, cuando se retome). */
export default function DirectorioPage() {
  const [rubros, setRubros] = useState([]);
  const [negocios, setNegocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rubroActivoId, setRubroActivoId] = useState("todos");

  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data: rubrosData, error: rubrosErr }, { data: negociosData, error: negociosErr }] =
        await Promise.all([
          supabase.from("rubros").select("*").eq("activo", true).order("orden"),
          supabase.from("negocios").select("*").eq("activo", true).order("orden"),
        ]);
      if (!active) return;
      if (rubrosErr || negociosErr) {
        setError("No se pudo cargar el directorio.");
        setLoading(false);
        return;
      }
      setRubros(rubrosData || []);
      // Un negocio sin slug todavía no tiene URL de tienda — no tiene
      // sentido mostrarlo en la vidriera pública (el super-admin lo ve
      // igual en su propio panel, con el aviso de "sin slug").
      setNegocios((negociosData || []).filter((n) => n.slug));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const negociosFiltrados = useMemo(() => {
    if (rubroActivoId === "todos") return negocios;
    return negocios.filter((n) => n.rubro_id === rubroActivoId);
  }, [negocios, rubroActivoId]);

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
      <header className="tz-header">
        <div className="tz-header-row">
          <div className="tz-header-side tz-header-side-left" />
          <div className="tz-header-center">
            <img src={logo} alt="Directorio" className="tz-logo" />
            <p className="tz-subtitle">Elige una tienda</p>
          </div>
          <div className="tz-header-side tz-header-side-right" />
        </div>
      </header>

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
              <p>Todavía no hay tiendas en este rubro.</p>
            </div>
          ) : (
            <div className="tz-dir-grid">
              {negociosFiltrados.map((n) => (
                <Link key={n.id} to={`/${n.slug}/tienda`} className="tz-dir-card">
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
        </section>
      </main>
    </div>
  );
}
