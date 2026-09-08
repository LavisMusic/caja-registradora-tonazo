// Receptor de `taxi.pago_fiado_conductor` (Taxi-PE → Caja). Ver WEBHOOKS.md §3.3
// en el repo de taxi-pe-app.
//
// Verifica HMAC → llama rpc_webhook_taxi_pago_fiado (idempotencia +
// resuelve el cliente fiado + inserta el PAGO en movimientos_fiado,
// FUERA del arqueo de caja, §6.1). Toda la lógica de dominio vive en el RPC.
//
// Deploy: supabase functions deploy webhook-taxi-pago-fiado --no-verify-jwt

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse, verifyWebhook } from "../_shared/webhook.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET_TAXI_TO_CAJA")!;

const EXPECTED_EVENT = "taxi.pago_fiado_conductor";

Deno.serve(async (req) => {
  if (req.method !== "POST") return jsonResponse(405, { error: "method not allowed" });

  const v = await verifyWebhook(req, WEBHOOK_SECRET);
  if (!v.ok) return jsonResponse(v.status, { error: v.error });

  const env = v.envelope!;
  if (env.event_type !== EXPECTED_EVENT) {
    return jsonResponse(400, { error: `event_type inesperado: ${env.event_type}` });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data, error } = await supabase.rpc("rpc_webhook_taxi_pago_fiado", {
    p_event_id: env.event_id,
    p_payload: env,
  });

  if (error) {
    console.error("[webhook-taxi-pago-fiado] RPC error:", error);
    return jsonResponse(500, { error: "fallo al aplicar el evento", detail: error.message });
  }

  // data.status ∈ { ok, duplicado, sin_match } → todos 200 (no reintentar).
  return jsonResponse(200, data ?? { status: "ok" });
});
