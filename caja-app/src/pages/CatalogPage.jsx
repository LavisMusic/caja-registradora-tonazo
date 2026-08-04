import { useMemo, useState } from "react";
import { Loader2, LogIn, LogOut, Wallet } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCatalog } from "../hooks/useCatalog";
import ThemeToggle from "../components/ThemeToggle";
import LoginModal from "../components/LoginModal";
import ClienteFiadoView from "./ClienteFiadoView";
import { formatSoles } from "../utils/format";
import "../styles/public.css";

// Ruta pública "/": catálogo de solo lectura + header con toggle de
// tema y acceso de clientes (Celular+PIN). El POS/admin vive aparte en
// /admin (App.jsx, detrás de RequireAdmin).
export default function CatalogPage() {
  const { session, isCliente, isAdmin, loading: authLoading, signOut } = useAuth();
  const { sections, loading: catalogLoading, error } = useCatalog();
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

  return (
    <div className="tzp-page">
      <header className="tzp-header">
        <span className="tzp-header-title">TONAZO</span>
        <div className="tzp-header-actions">
          <ThemeToggle />
          {authLoading ? null : session ? (
            <>
              {isCliente && (
                <button className="tzp-btn" onClick={() => setFiadoOpen(true)}>
                  <Wallet size={16} /> Fiado
                </button>
              )}
              {isAdmin && (
                <a className="tzp-btn" href="/admin">
                  Panel Admin
                </a>
              )}
              <button className="tzp-btn" onClick={signOut}>
                <LogOut size={16} /> Salir
              </button>
            </>
          ) : (
            <button className="tzp-btn tzp-btn-primary" onClick={() => setLoginOpen(true)}>
              <LogIn size={16} /> Login
            </button>
          )}
        </div>
      </header>

      <main className="tzp-catalog">
        {catalogLoading ? (
          <div className="tzp-loading">
            <Loader2 className="tzp-spin" size={28} />
            <p>Cargando catálogo...</p>
          </div>
        ) : error ? (
          <p className="tzp-error">{error}</p>
        ) : visibleSections.length === 0 ? (
          <p className="tzp-empty">Todavía no hay productos publicados.</p>
        ) : (
          visibleSections.map((section) => (
            <section key={section.key}>
              <h2 className="tzp-section-title">{section.label}</h2>
              {section.groups.map((group, gi) => (
                <div key={group.title ?? gi} className="tzp-product-grid">
                  {group.items.map((item) => (
                    <article key={item.id} className="tzp-product-card">
                      <h3>{item.name}</h3>
                      {item.detail && <p>{item.detail}</p>}
                      <span className="tzp-price">{formatSoles(item.price)}</span>
                    </article>
                  ))}
                </div>
              ))}
            </section>
          ))
        )}
      </main>

      {loginOpen && (
        <LoginModal onClose={() => setLoginOpen(false)} onSuccess={() => setLoginOpen(false)} />
      )}
      {fiadoOpen && <ClienteFiadoView onClose={() => setFiadoOpen(false)} />}
    </div>
  );
}
