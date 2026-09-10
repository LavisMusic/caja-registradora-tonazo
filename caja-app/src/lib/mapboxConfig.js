// Tiles de Mapbox (estilo oscuro) — mismo estilo que la app de Taxi-PE,
// para que el mapa de la entrega se vea igual en las dos apps. El token
// (público, pk.*) se toma SOLO de VITE_MAPBOX_TOKEN — no se hardcodea
// acá (GitHub Push Protection bloquea tokens de Mapbox en el repo).
// Ver .env.example.
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";

export const MAPBOX_TILE_URL = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`;

export const MAPBOX_ATTRIBUTION =
  '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
