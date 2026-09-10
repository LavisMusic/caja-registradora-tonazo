// Recibe de Taxi-PE el estado de una entrega y actualiza el pedido de la
// Caja. Firma HMAC (WEBHOOK_SECRET_TAXI_TO_CAJA, misma dirección que el
// webhook de pago de fiado). Ver DELIVERY.md §5 / §7.
//
//   data = { caja_pedido_ref, entrega_id, estado }
//     estado 'en_ruta'      → pedidos.entrega_estado = 'en_ruta' (+ estado
//                             = 'en_atencion'). El repartidor recogió y
//                             pagó en el mostrador → el Gestor le habilita
//                             al cajero "Confirmar recojo y cobro".
//     estado 'entregado'    → pedidos.estado = 'confirmado'
//     estado 'cancelado' | 'no_entregado' → pedidos.estado = 'cancelado'
//   En todos los casos se guarda data.estado en pedidos.entrega_estado.
//
// Deploy: supabase functions deploy webhook-taxi-entrega-estado --no-verify-jwt --project-ref xaerfywydzwifohjsvwa

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SECRET = Deno.env.get("WEBHOOK_SECRET_TAXI_TO_CAJA")!;

const MAX_SKEW = 300;
const enc = new TextEncoder();

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
async function hmacB64(secret: string, msg: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}
function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "method not allowed" });

  const sig = req.headers.get("X-Webhook-Signature") ?? "";
  const ts = Number(req.headers.get("X-Webhook-Timestamp") ?? "");
  if (!sig || !Number.isFinite(ts)) return json(401, { error: "faltan headers de firma" });
  if (Math.abs(Math.floor(Date.now() / 1000) - ts) > MAX_SKEW) return json(401, { error: "timestamp fuera de ventana" });

  const raw = await req.text();
  if (!timingSafeEqual(sig, await hmacB64(SECRET, `${ts}.${raw}`))) {
    return json(401, { error: "firma no coincide" });
  }

  let env: { event_type?: string; data?: Record<string, unknown> };
  try {
    env = JSON.parse(raw);
  } catch {
    return json(400, { error: "cuerpo no es JSON" });
  }
  if (env.event_type !== "taxi.entrega_estado") return json(400, { error: `event_type inesperado: ${env.event_type}` });

  const ref = String(env.data?.caja_pedido_ref ?? "");
  const estadoEntrega = String(env.data?.estado ?? "");
  if (!ref) return json(400, { error: "sin caja_pedido_ref" });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // 'en_ruta' no cierra el pedido: solo lo marca en curso y guarda el
  // estado de la entrega. El cierre (confirmado / cancelado) es para los
  // estados terminales.
  const patch: Record<string, unknown> = { entrega_estado: estadoEntrega };
  if (estadoEntrega === "entregado") patch.estado = "confirmado";
  else if (estadoEntrega === "cancelado" || estadoEntrega === "no_entregado") patch.estado = "cancelado";
  else if (estadoEntrega === "en_ruta") patch.estado = "en_atencion";

  const { error } = await supabase
    .from("pedidos")
    .update(patch)
    .eq("id", ref)
    .in("estado", ["nuevo", "en_atencion"]); // no pisar un cierre ya hecho a mano

  if (error) {
    console.error("[webhook-taxi-entrega-estado] update error:", error);
    return json(500, { error: "no se pudo actualizar el pedido", detail: error.message });
  }

  const msg =
    estadoEntrega === "entregado"
      ? "✅ El repartidor confirmó la entrega. ¡Gracias por tu compra!"
      : estadoEntrega === "en_ruta"
      ? "📦 El repartidor recogió tu pedido y va en camino."
      : estadoEntrega === "no_entregado"
      ? "↩️ La entrega no se concretó: el repartidor devolvió el pedido a la tienda. Fue cancelado."
      : "❌ La entrega no se concretó. El pedido fue cancelado.";

  await supabase.from("pedido_mensajes").insert([{ pedido_id: ref, remitente: "sistema", mensaje: msg }]);

  return json(200, { status: "ok" });
});
