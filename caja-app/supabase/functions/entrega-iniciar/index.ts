// Handshake de delivery — lado Caja. El frontend (cajero/admin logueado)
// llama acá; esta función valida el rol y hace la llamada FIRMADA (HMAC) a
// la Edge Function `entrega-crear` del proyecto Taxi-PE. El secreto HMAC
// vive solo acá (server-side), nunca en el frontend. Ver DELIVERY.md §2.
//
// Deploy: supabase functions deploy entrega-iniciar --no-verify-jwt --project-ref xaerfywydzwifohjsvwa
//   (--no-verify-jwt para que el preflight CORS OPTIONS —que va sin token—
//    no lo rechace la plataforma; la autenticación se hace ACÁ adentro:
//    se exige Bearer + rol admin|cajero.)
// Secrets: WEBHOOK_SECRET_CAJA_TO_TAXI (ya está de los webhooks).
//          SUPABASE_URL / SUPABASE_ANON_KEY son automáticos.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CAJA_URL = Deno.env.get("SUPABASE_URL")!;
const CAJA_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SECRET = Deno.env.get("WEBHOOK_SECRET_CAJA_TO_TAXI")!;
const TAXI_ENTREGA_CREAR =
  Deno.env.get("TAXI_ENTREGA_CREAR_URL") ||
  "https://silfhbdmfdryjdzpwzvh.supabase.co/functions/v1/entrega-crear";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "method not allowed" });

  const authz = req.headers.get("Authorization") || "";
  if (!authz.startsWith("Bearer ")) return json(401, { error: "sin sesión" });

  // Validar rol del que llama (admin | cajero).
  const caja = createClient(CAJA_URL, CAJA_ANON, { global: { headers: { Authorization: authz } } });
  const { data: userData, error: userErr } = await caja.auth.getUser();
  if (userErr || !userData?.user) return json(401, { error: "sesión inválida" });

  const { data: perfil } = await caja
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();
  if (!perfil || !["admin", "cajero"].includes(perfil.role)) {
    return json(403, { error: "solo admin o cajero pueden asignar repartidor" });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "cuerpo inválido" });
  }
  const pedido = (body?.pedido ?? {}) as Record<string, unknown>;

  const eventId = crypto.randomUUID();
  const sobre = JSON.stringify({
    event_id: eventId,
    event_type: "caja.entrega_crear",
    occurred_at: new Date().toISOString(),
    source: "caja",
    data: { pedido },
  });
  const ts = Math.floor(Date.now() / 1000);
  const sig = await hmacB64(SECRET, `${ts}.${sobre}`);

  const r = await fetch(TAXI_ENTREGA_CREAR, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Id": eventId,
      "X-Webhook-Timestamp": String(ts),
      "X-Webhook-Signature": sig,
    },
    body: sobre,
  });

  const txt = await r.text();
  if (!r.ok) {
    console.error("[entrega-iniciar] Taxi-PE respondió", r.status, txt);
    return json(502, { error: "Taxi-PE rechazó la creación de la entrega", detail: txt });
  }
  return new Response(txt, { status: 200, headers: { "Content-Type": "application/json", ...CORS } });
});
