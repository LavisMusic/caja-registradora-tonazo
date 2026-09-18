// Espejo de cuentas (Caja -> Taxi-PE): cuando un CLIENTE (nunca un
// cajero/admin) registra o cambia su PIN acá, se replica la MISMA
// cuenta (celular+PIN) en Taxi-PE para que pueda entrar ahí con las
// mismas credenciales — primer paso de la unificación pasajero/cliente
// (ver notas de sesión / DELIVERY.md).
//
// Reusa exactamente la infra HMAC de WEBHOOKS.md (mismo patrón que
// entrega-iniciar): sin vault ni secretos nuevos, mismo
// WEBHOOK_SECRET_CAJA_TO_TAXI ya configurado para esa dirección.
//
// Best-effort: si Taxi-PE no responde, se loguea y no se revierte ni
// bloquea nada del lado de Caja — el cliente sigue pudiendo usar Caja
// con total normalidad, el espejo simplemente queda pendiente hasta
// el próximo cambio de PIN.

const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET_CAJA_TO_TAXI") ?? "";
const TAXI_MIRROR_URL =
  Deno.env.get("TAXI_MIRROR_CUENTA_URL") ||
  "https://silfhbdmfdryjdzpwzvh.supabase.co/functions/v1/webhook-caja-mirror-cuenta";

const enc = new TextEncoder();

async function hmacB64(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

export async function mirrorCuentaATaxi(params: {
  telefono: string;
  pin: string;
  nombre?: string | null;
}): Promise<void> {
  if (!WEBHOOK_SECRET) {
    console.error("[mirrorCuentaATaxi] falta WEBHOOK_SECRET_CAJA_TO_TAXI — se omite el espejo.");
    return;
  }
  try {
    const eventId = crypto.randomUUID();
    const sobre = JSON.stringify({
      event_id: eventId,
      event_type: "caja.mirror_cliente",
      occurred_at: new Date().toISOString(),
      source: "caja",
      data: { telefono: params.telefono, pin: params.pin, nombre: params.nombre ?? null },
    });
    const ts = Math.floor(Date.now() / 1000);
    const sig = await hmacB64(WEBHOOK_SECRET, `${ts}.${sobre}`);

    const r = await fetch(TAXI_MIRROR_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Id": eventId,
        "X-Webhook-Timestamp": String(ts),
        "X-Webhook-Signature": sig,
      },
      body: sobre,
    });
    if (!r.ok) {
      console.error("[mirrorCuentaATaxi] Taxi-PE respondió", r.status, await r.text());
    }
  } catch (err) {
    console.error("[mirrorCuentaATaxi] error de red", err);
  }
}
