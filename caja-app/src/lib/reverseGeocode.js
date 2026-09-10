import { MAPBOX_TOKEN } from "./mapboxConfig";

// Geocodificación inversa (coords → dirección) con Mapbox. Best-effort:
// si falla, se devuelve "" y el cliente escribe la referencia a mano.
export async function reverseGeocode(lat, lng) {
  try {
    const r = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
        `?access_token=${MAPBOX_TOKEN}&language=es&limit=1`
    );
    const j = await r.json();
    return j?.features?.[0]?.place_name || "";
  } catch {
    return "";
  }
}
