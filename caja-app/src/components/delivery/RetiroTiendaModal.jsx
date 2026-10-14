import { useCallback, useEffect, useRef, useState } from "react";
import { X, Store, QrCode, ScanLine, Check, Loader2, Lock, MapPin } from "lucide-react";
import { supabase } from "../../supabaseClient";
import MapaEntregaCaja from "./MapaEntregaCaja";
import { QrVisorModal } from "./EntregaCajaModal";
import BarcodeScannerModal from "../BarcodeScannerModal";
import { formatTime } from "../../utils/format";

// "Ver entrega" de un RETIRO EN TIENDA (migración 0108) — mismo sistema que
// el delivery, pero quien verifica es la tienda:
//   * cliente: mapa con la sede y su ubicación en vivo (la comparte
//     mientras tiene esta ventana abierta), su PIN y "Mostrar QR".
//   * cajero/admin: el mismo mapa con el cliente acercándose, "Escanear
//     QR" y el PIN a mano. Recién verificado se registra la venta
//     (`onVerificado`, lo hace el Gestor de Pedidos). 5 PIN incorrectos →
//     bloqueado 10 minutos.
// El PIN nunca le llega al cajero: lo verifica la base.
const SONDEO_MS = 3000;
const ENVIO_UBICACION_MS = 4000;

export default function RetiroTiendaModal({ pedidoId, rol, onVerificado, onConfirmadoCliente, onClose }) {
  const esCliente = rol === "cliente";
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  const [miPos, setMiPos] = useState(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [aviso, setAviso] = useState("");
  const avisadoRef = useRef(false);

  const cargar = useCallback(async () => {
    const { data, error: err } = await supabase.rpc(esCliente ? "caja_retiro_mio" : "caja_retiro_estado", {
      p_pedido_id: pedidoId,
    });
    if (err) {
      setError("No se pudo cargar la entrega.");
      return;
    }
    if (data?.estado !== "ok") {
      setError(data?.estado === "sin_permiso" ? "No tienes acceso a este pedido." : "Este pedido todavía no está listo para retirar.");
      return;
    }
    setError("");
    setInfo(data);
  }, [esCliente, pedidoId]);

  useEffect(() => {
    cargar();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") cargar();
    }, SONDEO_MS);
    return () => clearInterval(t);
  }, [cargar]);

  // Cliente: comparte su ubicación mientras la ventana está abierta.
  const ultimoEnvio = useRef(0);
  useEffect(() => {
    if (!esCliente || !navigator.geolocation) return undefined;
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude, at: new Date().toISOString() };
        setMiPos(pos);
        if (Date.now() - ultimoEnvio.current < ENVIO_UBICACION_MS) return;
        ultimoEnvio.current = Date.now();
        supabase.rpc("caja_retiro_ubicacion", { p_pedido_id: pedidoId, p_lat: pos.lat, p_lng: pos.lng }).then(() => {});
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [esCliente, pedidoId]);

  // Cliente: apenas la tienda verifica, se cierra con el festejo.
  useEffect(() => {
    if (!esCliente || !info?.verificado || avisadoRef.current) return;
    avisadoRef.current = true;
    onConfirmadoCliente?.();
  }, [esCliente, info?.verificado, onConfirmadoCliente]);

  const finalizar = useCallback(async () => {
    setVerificando(true);
    const r = await onVerificado?.();
    setVerificando(false);
    if (r?.error) setAviso(r.message || "Verificado, pero no se pudo registrar la venta. Intenta de nuevo.");
  }, [onVerificado]);

  const verificar = async (codigo) => {
    const limpio = String(codigo || "").trim();
    if (!limpio) return;
    setAviso("");
    setVerificando(true);
    const { data, error: err } = await supabase.rpc("caja_retiro_verificar", { p_pedido_id: pedidoId, p_codigo: limpio });
    setVerificando(false);
    if (err) return setAviso("No se pudo verificar. Intenta de nuevo.");
    if (data?.estado === "ok") {
      setPin("");
      await finalizar();
      return;
    }
    if (data?.estado === "bloqueado") {
      setAviso(`Demasiados intentos: bloqueado hasta las ${formatTime(data.hasta)}.`);
    } else if (data?.estado === "pin_incorrecto") {
      setAviso(`PIN incorrecto. Te quedan ${data.restantes} intento${data.restantes === 1 ? "" : "s"}.`);
    } else {
      setAviso("No se pudo verificar este retiro.");
    }
    cargar();
  };

  const sede =
    info?.sucursal_lat != null && info?.sucursal_lng != null
      ? { lat: Number(info.sucursal_lat), lng: Number(info.sucursal_lng) }
      : null;
  const cliente = esCliente
    ? miPos
    : info?.cliente_lat != null
      ? { lat: Number(info.cliente_lat), lng: Number(info.cliente_lng), at: info.cliente_pos_at }
      : null;
  const bloqueado = !esCliente && info?.bloqueado_hasta;

  return (
    <div className="tz-modal-backdrop" style={{ zIndex: 70 }}>
      <div className="tz-modal tz-modal-wide" onClick={(e) => e.stopPropagation()}>
        <button className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <div className="tz-payment-modal">
          <h2>
            <Store size={17} /> Retiro en tienda
          </h2>
          {info?.sucursal_nombre && (
            <p className="tz-stock-editor-sub" style={{ textAlign: "center", marginTop: -4 }}>
              <MapPin size={12} style={{ verticalAlign: "-1px" }} /> Sede {info.sucursal_nombre}
            </p>
          )}
          {error && <p className="tz-error">{error}</p>}

          {info && (
            <>
              <MapaEntregaCaja
                entregaId={null}
                origen={sede}
                cliente={cliente || {}}
                textoEspera={esCliente ? "Buscando tu ubicación…" : "Esperando la ubicación del cliente…"}
              />
              {!sede && (
                <p className="tz-stock-editor-sub" style={{ textAlign: "center" }}>
                  La sede todavía no tiene su ubicación fijada en el mapa.
                </p>
              )}

              {esCliente ? (
                <>
                  <p className="tz-stock-editor-sub" style={{ textAlign: "center", marginTop: 10 }}>
                    Al llegar, muestra tu QR o dicta tu PIN en la caja para recibir tu pedido.
                  </p>
                  <div className="tz-dlv-pin-row">
                    <p className="tz-dlv-pin">
                      PIN <b>{String(info.pin).split("").join(" ")}</b>
                    </p>
                    <button type="button" className="tz-btn-mini" onClick={() => setQrOpen(true)}>
                      <QrCode size={14} /> Mostrar QR
                    </button>
                  </div>
                </>
              ) : info.verificado ? (
                <>
                  <p className="tz-success" style={{ textAlign: "center", marginTop: 12 }}>
                    <Check size={14} style={{ verticalAlign: "-2px" }} /> Retiro verificado.
                  </p>
                  {aviso && <p className="tz-error">{aviso}</p>}
                  <button
                    type="button"
                    className="tz-scan-btn tz-payment-save"
                    style={{ width: "100%", marginTop: 8 }}
                    onClick={finalizar}
                    disabled={verificando}
                  >
                    {verificando ? <Loader2 size={15} className="tz-spin" /> : <Check size={15} />} Registrar venta y entregar
                  </button>
                </>
              ) : (
                <>
                  <p className="tz-stock-editor-sub" style={{ textAlign: "center", marginTop: 10 }}>
                    Escanea el QR del cliente o escribe su PIN para entregar el pedido.
                  </p>
                  {bloqueado && (
                    <p className="tz-error" style={{ textAlign: "center" }}>
                      <Lock size={13} style={{ verticalAlign: "-2px" }} /> Bloqueado por intentos fallidos hasta las{" "}
                      {formatTime(info.bloqueado_hasta)}.
                    </p>
                  )}
                  <button
                    type="button"
                    className="tz-scan-btn tz-payment-save"
                    style={{ width: "100%", marginTop: 8 }}
                    onClick={() => setScannerOpen(true)}
                    disabled={verificando || !!bloqueado}
                  >
                    <ScanLine size={15} /> Escanear QR
                  </button>
                  <div className="tz-retiro-pin">
                    <input
                      className="tz-text-input"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="PIN"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      disabled={verificando || !!bloqueado}
                      aria-label="PIN del cliente"
                    />
                    <button
                      type="button"
                      className="tz-scan-btn"
                      onClick={() => verificar(pin)}
                      disabled={verificando || !!bloqueado || pin.length !== 4}
                    >
                      {verificando ? <Loader2 size={15} className="tz-spin" /> : <Check size={15} />} Confirmar
                    </button>
                  </div>
                  {aviso && <p className="tz-error" style={{ textAlign: "center" }}>{aviso}</p>}
                </>
              )}
            </>
          )}
          {!info && !error && (
            <p className="tz-stock-editor-sub" style={{ textAlign: "center" }}>
              <Loader2 size={14} className="tz-spin" /> Cargando…
            </p>
          )}
        </div>
      </div>

      {qrOpen && info?.pin && (
        <QrVisorModal
          pin={info.pin}
          texto="Muéstrale este QR a la tienda para recibir tu pedido."
          onClose={() => setQrOpen(false)}
        />
      )}
      {scannerOpen && (
        <BarcodeScannerModal
          onScan={(texto) => {
            setScannerOpen(false);
            verificar(texto);
          }}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  );
}
