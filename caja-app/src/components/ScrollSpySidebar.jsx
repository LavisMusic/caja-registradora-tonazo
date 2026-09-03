import { useEffect, useRef, useState } from "react";

/* ---- Navegación estilo "Fortnite" (minimapa lateral): puntos
   luminosos discretos por defecto — al pasar el mouse sobre la barra
   entera, cada punto revela el nombre de su sección (Subgrupo) con una
   transición suave. IntersectionObserver decide cuál sección está "en
   pantalla ahora mismo" en tiempo real (sin escuchar 'scroll' a mano,
   más barato y sin jank); un clic hace scrollIntoView suave hacia esa
   sección.

   'items': [{ id, label }] — normalmente los Subgrupos de la categoría
   activa (App.jsx/CatalogPage.jsx ya renderizan TODOS los grupos de
   'activeSection' seguidos en una sola página larga, así que "saltar
   entre subgrupos" es exactamente lo que hace falta acá).
   'getSectionEl(id)': función que devuelve el nodo DOM real de esa
   sección — vive en el padre (el que arma los refs de '.tz-group'),
   no acá, para no duplicar el mecanismo de refs.

   Se re-arma el observer cada vez que cambia la LISTA de ids (cambiar
   de categoría cambia qué subgrupos hay) — 'itemsKey' hace ese chequeo
   barato sin comparar arrays por referencia. */
export default function ScrollSpySidebar({ items, getSectionEl, side = "right" }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? null);
  const [hovering, setHovering] = useState(false);
  const observerRef = useRef(null);
  const itemsKey = items.map((it) => it.id).join("|");

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (items.length === 0) return undefined;

    // Fallback al primer ítem apenas cambia la lista (nueva categoría,
    // o el catálogo recién terminó de cargar) — 'useState(items[0]?.id)'
    // solo corre en el montaje INICIAL, así que si 'items' llegó vacío
    // esa primera vez (típico: useCatalog todavía no trajo los datos),
    // 'activeId' se quedaba en null para siempre hasta el primer evento
    // del observer — y si en ese momento nada cruza todavía la franja
    // angosta de abajo (recién abierta la sección, sin scrollear), NADA
    // se veía activo. Esto se pisa solo apenas el observer real
    // encuentra una sección intersectando de verdad.
    setActiveId((prev) => (items.some((it) => it.id === prev) ? prev : items[0].id));

    // 'dataset.scrollspyId' es SIEMPRE string (así es el DOM), pero
    // 'it.id' acá es un número (gi) — sin este mapa de vuelta, activeId
    // termina guardando el string "0" mientras el render sigue
    // comparando contra el número 0, así que 'activeId === it.id'
    // (comparación estricta) nunca vuelve a ser true después del
    // PRIMER evento del observer: el punto activo se apaga para
    // siempre. Resolvemos el string de vuelta al id ORIGINAL (su tipo
    // real) antes de guardarlo.
    const idByString = new Map(items.map((it) => [String(it.id), it.id]));

    // Ratios de intersección por sección, actualizados en cada evento
    // — la sección "activa" es la que tiene MÁS área visible ahora
    // mismo (más robusto que "la primera que cruza el borde", que
    // salta feo con secciones de alturas muy distintas).
    const ratios = new Map();
    const updateActive = () => {
      let bestId = null;
      let bestRatio = 0;
      ratios.forEach((ratio, id) => {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestId = id;
        }
      });
      if (bestId != null) setActiveId(idByString.get(bestId) ?? bestId);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.dataset.scrollspyId;
          ratios.set(id, entry.isIntersecting ? entry.intersectionRatio : 0);
        });
        updateActive();
      },
      // Franja angosta en el centro-superior del viewport: una sección
      // "cuenta" apenas su encabezado cruza esa franja, sin esperar a
      // que ocupe toda la pantalla — se siente más parecido a "dónde
      // estoy leyendo" que a "qué ocupa más píxeles".
      { rootMargin: "-15% 0px -70% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    items.forEach((it) => {
      const el = getSectionEl(it.id);
      if (!el) return;
      el.dataset.scrollspyId = String(it.id);
      observer.observe(el);
    });

    observerRef.current = observer;
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey]);

  if (items.length < 2) return null; // nada que "navegar" con una sola sección

  const handleClick = (id) => {
    const el = getSectionEl(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
  };

  return (
    <nav
      className={`tz-scrollspy tz-scrollspy-${side} ${hovering ? "tz-scrollspy-expanded" : ""}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      aria-label="Navegación de subgrupos"
    >
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          className={`tz-scrollspy-item ${activeId === it.id ? "tz-scrollspy-item-active" : ""}`}
          onClick={() => handleClick(it.id)}
        >
          <span className="tz-scrollspy-dot" />
          <span className="tz-scrollspy-label">{it.label}</span>
        </button>
      ))}
    </nav>
  );
}
