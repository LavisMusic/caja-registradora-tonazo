import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { supabaseTaxi } from "../../lib/supabaseTaxi";
import { canalEntrega } from "../../hooks/useEntregaCaja";
import { MAPBOX_TILE_URL, MAPBOX_ATTRIBUTION } from "../../lib/mapboxConfig";

// Mapa en vivo de una entrega, para la app de Caja (cliente / cajero).
// Mismo canal Broadcast `entrega-<id>` contra el Supabase de Taxi-PE que
// usa el repartidor. Pin del repartidor con el ícono de su categoría
// (rpc_conductor_marcador), sin asientos NI el badge LIBRE/EN CARRERA
// que tenía antes: mostraba el switch de disponibilidad para VIAJES del
// conductor (conductores.estado) — nada que ver con esta entrega, y
// parecía cambiar solo al aceptar/entregar el pedido sin ninguna
// relación real de causa.

const NIVEL_COLOR = {
  economico: "#39ffac",
  ejecutivo: "#00e0ff",
  premium: "#b98bff",
  vip: "#ffd23d",
};

const ICONO_DESTINO = L.divIcon({
  className: "tz-dlv-marker-wrap",
  html: '<span class="tz-dlv-destino">🚩</span>',
  iconSize: [26, 26],
  iconAnchor: [13, 24],
});
const ICONO_ORIGEN = L.divIcon({
  className: "tz-dlv-marker-wrap",
  html: '<span class="tz-dlv-destino">🏪</span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function iconoRepartidor(color, iconoUrl) {
  const veh = iconoUrl
    ? `<img class="tz-dlv-veh-img" src="${iconoUrl}" alt="" />`
    : `<span class="tz-dlv-veh" style="--c:${color}">🚖</span>`;
  return L.divIcon({
    className: "tz-dlv-marker-wrap",
    html: `<div class="tz-dlv-veh-group" style="--c:${color}">${veh}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function AjustarVista({ puntos }) {
  const map = useMap();
  useEffect(() => {
    const v = puntos.filter(Boolean);
    if (v.length >= 2) map.fitBounds(v.map((p) => [p.lat, p.lng]), { padding: [40, 40], maxZoom: 16 });
    else if (v.length === 1) map.setView([v[0].lat, v[0].lng], 15, { animate: true });
  }, [puntos, map]);
  return null;
}

function frescura(atMs) {
  if (!atMs) return { txt: "sin ubicación", clase: "tz-dlv-fresh-none" };
  const s = Math.round((Date.now() - atMs) / 1000);
  if (s < 45) return { txt: "en vivo", clase: "tz-dlv-fresh-live" };
  if (s < 3600) return { txt: `hace ${Math.round(s / 60)} min`, clase: "tz-dlv-fresh-stale" };
  return { txt: `hace ${Math.round(s / 3600)} h`, clase: "tz-dlv-fresh-stale" };
}

export default function MapaEntregaCaja({ entregaId, conductorId = null, destino = null, origen = null, posInicial = null }) {
  const [repartidor, setRepartidor] = useState(
    posInicial && typeof posInicial.lat === "number" ? { lat: posInicial.lat, lng: posInicial.lng } : null
  );
  const [mk, setMk] = useState({ iconoUrl: null, nivel: "economico", estado: null });
  const [oculto, setOculto] = useState(false);
  const [posAt, setPosAt] = useState(posInicial?.at ? new Date(posInicial.at).getTime() : 0);
  const ultimo = useRef(0);
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 20000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!conductorId) return;
    let cancel = false;
    supabaseTaxi.rpc("rpc_conductor_marcador", { p_conductor_id: conductorId }).then(({ data }) => {
      if (cancel || !data || !data[0]) return;
      setMk({
        iconoUrl: data[0].icono_url || null,
        nivel: data[0].nivel_servicio || "economico",
        estado: data[0].estado || null,
      });
    });
    return () => {
      cancel = true;
    };
  }, [conductorId]);

  useEffect(() => {
    if (!entregaId) return;
    const ch = supabaseTaxi
      .channel(canalEntrega(entregaId))
      .on("broadcast", { event: "gps" }, ({ payload }) => {
        if (typeof payload?.lat !== "number" || typeof payload?.lng !== "number") return;
        if (payload.t && payload.t < ultimo.current) return;
        ultimo.current = payload.t || Date.now();
        setRepartidor({ lat: payload.lat, lng: payload.lng });
        setPosAt(Date.now());
      })
      .subscribe();
    return () => {
      supabaseTaxi.removeChannel(ch);
    };
  }, [entregaId]);

  const color = NIVEL_COLOR[mk.nivel] || NIVEL_COLOR.economico;
  const centro = repartidor || destino || origen || { lat: -12.0464, lng: -77.0428 };

  const fr = frescura(posAt);

  return (
    <div className="tz-dlv-mapa-wrap">
      <StyleOnce />
      <div className="tz-dlv-mapa-bar">
        <button type="button" className="tz-dlv-mapa-toggle" onClick={() => setOculto((v) => !v)}>
          {oculto ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          {oculto ? "Mostrar mapa" : "Ocultar mapa"}
        </button>
        <span className={`tz-dlv-fresh ${fr.clase}`}>{fr.txt}</span>
      </div>
      {!oculto && (
        <div style={{ position: "relative" }}>
          {/* Vista previa del trayecto (todavía sin repartidor asignado,
             ej. el radar de "Asignar repartidor"): solo sucursal +
             destino, sin este aviso — "ubicando al repartidor" no tiene
             sentido cuando todavía no hay NINGÚN repartidor elegido. */}
          {conductorId && !repartidor && (
            <div className="tz-dlv-mapa-loading">
              <Loader2 size={14} className="tz-spin" /> <span>Ubicando al repartidor…</span>
            </div>
          )}
          <MapContainer center={[centro.lat, centro.lng]} zoom={15} className="tz-dlv-mapa" zoomControl={false} scrollWheelZoom={false}>
            <AjustarVista puntos={[repartidor, destino, origen]} />
            <TileLayer attribution={MAPBOX_ATTRIBUTION} url={MAPBOX_TILE_URL} />
            {origen && <Marker position={[origen.lat, origen.lng]} icon={ICONO_ORIGEN} />}
            {destino && <Marker position={[destino.lat, destino.lng]} icon={ICONO_DESTINO} />}
            {repartidor && <Marker position={[repartidor.lat, repartidor.lng]} icon={iconoRepartidor(color, mk.iconoUrl)} />}
          </MapContainer>
        </div>
      )}
    </div>
  );
}

// CSS local (caja-app/Styles.jsx no tiene las clases de marcador de Taxi-PE).
let inyectado = false;
function StyleOnce() {
  useEffect(() => {
    if (inyectado) return;
    inyectado = true;
    const s = document.createElement("style");
    s.textContent = `
      .tz-dlv-mapa-wrap { margin-top: 10px; display: flex; flex-direction: column; align-items: center; }
      .tz-dlv-mapa-wrap > div { width: 100%; }
      .tz-dlv-mapa { height: 220px; width: 100%; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.12); }
      .tz-dlv-mapa .leaflet-container { background: #10141c; }
      .tz-dlv-mapa-bar { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 6px; }
      .tz-dlv-mapa-toggle { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px;
        border-radius: 999px; background: rgba(0,224,255,0.12); border: 1px solid rgba(0,224,255,0.4); color: #00e0ff;
        font-size: 12px; font-weight: 600; cursor: pointer; }
      .tz-dlv-fresh { display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border-radius: 999px; font-size: 11px; font-weight: 700; }
      .tz-dlv-fresh::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
      .tz-dlv-fresh-live { color: #39ffac; background: rgba(57,255,172,0.12); }
      .tz-dlv-fresh-stale { color: #ff9d3d; background: rgba(255,157,61,0.12); }
      .tz-dlv-fresh-none { color: #8a8a98; background: rgba(255,255,255,0.06); }
      .tz-dlv-mapa-loading { position: absolute; z-index: 500; top: 8px; left: 50%; transform: translateX(-50%);
        display: flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; font-size: 12px;
        background: rgba(0,0,0,0.6); color: #fff; }
      .tz-dlv-marker-wrap { background: none; border: 0; }
      .tz-dlv-veh-group { position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; }
      .tz-dlv-veh, .tz-dlv-veh-img {
        width: 100%; height: 100%;
        display: flex; align-items: center; justify-content: center;
        border-radius: 50%;
        background: rgba(5,3,12,0.85);
        border: 2px solid var(--c, #00e0ff);
        box-shadow: 0 0 12px var(--c, #00e0ff);
      }
      .tz-dlv-veh { font-size: 15px; line-height: 1; }
      .tz-dlv-veh-img { object-fit: cover; }
      .tz-dlv-destino { font-size: 22px; }
      .tz-dlv-estado { position: absolute; top: -15px; left: 50%; transform: translateX(-50%); white-space: nowrap;
        padding: 1px 6px; border-radius: 999px; font-size: 9px; font-weight: 800; color: #05030c; box-shadow: 0 2px 6px rgba(0,0,0,0.4); }
      .tz-dlv-libre { background: #00e0ff; }
      .tz-dlv-carrera { background: #ff9d3d; }
    `;
    document.head.appendChild(s);
  }, []);
  return null;
}
