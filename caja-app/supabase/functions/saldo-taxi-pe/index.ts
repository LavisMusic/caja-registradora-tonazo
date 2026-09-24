// Consulta en vivo (Caja -> Taxi-PE) del saldo de membresía+créditos de
// UN cliente — el propio cliente logueado pide su propio saldo (nunca
// el de otro: el whatsapp sale de SU fila en `clientes_fiado`, resuelta
// server-side a partir de su JWT, nunca de un parámetro que mande el
// navegador). Pensado para pintar el mini-badge de membresía+créditos
// en el header de CatalogPage.jsx (unificación pasajero/cliente) — no
// se guarda nada acá, se relee cada vez.
//
// Server a servidor con Taxi-PE, firmado con la misma infra HMAC que ya
// usa mirrorCuentaATaxi (WEBHOOK_SECRET_CAJA_TO_TAXI, ya configurado
// para esta dirección).
//
// Deploy: supabase functions deploy saldo-taxi-pe --project-ref xaerfywydzwifohjsvwa

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET_CAJA_TO_TAXI") ?? "";
const TAXI_SALDO_URL =
  Deno.env.get("TAXI_SALDO_PASAJERO_URL") ||
  "https://silfhbdmfdryjdzpwzvh.supabase.co/functions/v1/saldo-pasajero";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method not allowed" });
  if (!WEBHOOK_SECRET) return json(500, { error: "falta WEBHOOK_SECRET_CAJA_TO_TAXI" });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace("Bearer ", "");
  if (!jwt) return json(401, { error: "No autenticado." });

  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData?.user) return json(401, { error: "No autenticado." });

  const { data: cliente, error: clienteErr } = await admin
    .from("clientes_fiado")
    .select("whatsapp")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (clienteErr) {
    console.error("[saldo-taxi-pe] error buscando clientes_fiado:", clienteErr);
    return json(500, { error: "no se pudo verificar el cliente" });
  }

  // Sin fila en clientes_fiado (ej. un cajero/admin, o un cliente sin
  // whatsapp cargado): no hay nada que consultar en Taxi-PE.
  if (!cliente?.whatsapp) {
    return json(200, { creditos_disponibles: 0, membresia_vencimiento: null });
  }

  const eventId = crypto.randomUUID();
  const sobre = JSON.stringify({
    event_id: eventId,
    event_type: "caja.consultar_saldo",
    occurred_at: new Date().toISOString(),
    source: "caja",
    data: { telefono: cliente.whatsapp },
  });
  const ts = Math.floor(Date.now() / 1000);
  const sig = await hmacB64(WEBHOOK_SECRET, `${ts}.${sobre}`);

  try {
    const r = await fetch(TAXI_SALDO_URL, {
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
      console.error("[saldo-taxi-pe] Taxi-PE respondió", r.status, await r.text());
      return json(200, { creditos_disponibles: 0, membresia_vencimiento: null });
    }
    const data = await r.json();
    return json(200, {
      creditos_disponibles: data.creditos_disponibles ?? 0,
      membresia_vencimiento: data.membresia_vencimiento ?? null,
    });
  } catch (err) {
    console.error("[saldo-taxi-pe] error de red", err);
    // Best-effort: si Taxi-PE no responde, el badge muestra "sin datos"
    // en vez de romper la carga de la tienda.
    return json(200, { creditos_disponibles: 0, membresia_vencimiento: null });
  }
});
