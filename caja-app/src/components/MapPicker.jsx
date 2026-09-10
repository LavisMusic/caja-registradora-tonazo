import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Crosshair, Loader2 } from "lucide-react";
import { MAPBOX_TILE_URL, MAPBOX_ATTRIBUTION } from "../lib/mapboxConfig";
import { reverseGeocode } from "../lib/reverseGeocode";

// Selector de punto de entrega (punto B del delivery). El cliente toca
// el mapa o arrastra el pin; opcionalmente usa su ubicación actual. La
// dirección se autocompleta (geocoding inverso) y es editable.
// value / onChange: { lat, lng, direccion }.

const PIN = L.divIcon({
  className: "tz-mp-pin-wrap",
  html: '<span class="tz-mp-pin">📍</span>',
  iconSize: [30, 30],
  iconAnchor: [15, 28],
});
const DEFAULT = { lat: -12.0464, lng: -77.0428 };

function ClickHandler({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}
function Recenter({ pos }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.setView([pos.lat, pos.lng], Math.max(map.getZoom(), 16));
  }, [pos, map]);
  return null;
}

export default function MapPicker({ value, onChange }) {
  const [pos, setPos] = useState(value?.lat != null ? { lat: value.lat, lng: value.lng } : null);
  const [dir, setDir] = useState(value?.direccion || "");
  const [buscando, setBuscando] = useState(false);
  const [locating, setLocating] = useState(false);

  const setPunto = async (lat, lng) => {
    setPos({ lat, lng });
    onChange({ lat, lng, direccion: dir });
    setBuscando(true);
    const d = await reverseGeocode(lat, lng);
    setBuscando(false);
    if (d) {
      setDir(d);
      onChange({ lat, lng, direccion: d });
    }
  };

  const usarMiUbicacion = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        setPunto(p.coords.latitude, p.coords.longitude);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const centro = pos || DEFAULT;

  return (
    <div className="tz-mp">
      <div className="tz-mp-map">
        <MapContainer
          center={[centro.lat, centro.lng]}
          zoom={pos ? 16 : 13}
          zoomControl={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url={MAPBOX_TILE_URL} attribution={MAPBOX_ATTRIBUTION} />
          <ClickHandler onPick={setPunto} />
          {pos && (
            <Marker
              position={[pos.lat, pos.lng]}
              icon={PIN}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const ll = e.target.getLatLng();
                  setPunto(ll.lat, ll.lng);
                },
              }}
            />
          )}
          <Recenter pos={pos} />
        </MapContainer>
        <button type="button" className="tz-mp-loc" onClick={usarMiUbicacion} disabled={locating}>
          {locating ? <Loader2 size={15} className="tz-spin" /> : <Crosshair size={15} />} Usar mi ubicación
        </button>
      </div>

      <input
        className="tz-text-input tz-mp-dir"
        placeholder="Dirección / referencia (calle, número, color de casa…)"
        value={dir}
        onChange={(e) => {
          setDir(e.target.value);
          if (pos) onChange({ ...pos, direccion: e.target.value });
        }}
      />
      {buscando ? (
        <p className="tz-stock-editor-sub"><Loader2 size={13} className="tz-spin" /> Buscando dirección…</p>
      ) : !pos ? (
        <p className="tz-stock-editor-sub">Tocá el mapa para marcar dónde te lo llevamos.</p>
      ) : null}
    </div>
  );
}
