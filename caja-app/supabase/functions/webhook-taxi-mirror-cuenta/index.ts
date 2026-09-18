// Receptor de `taxi.mirror_pasajero` (Taxi-PE -> Caja).
//
// Crea o actualiza la MISMA cuenta (celular+PIN) que un pasajero ya
// tiene en Taxi-PE, para que pueda entrar a Caja Tonazo con las mismas
// credenciales — mismo criterio que create-cliente para un cliente
// nuevo (dummy email `${telefono}@tonazo.app`), pero disparado desde
// el otro lado. Si ya existe un `clientes_fiado` con ese whatsapp
// (dado de alta a mano por el admin, sin login todavía), se vincula esa
// misma fila en vez de crear un duplicado.
//
// Deploy: supabase functions deploy webhook-taxi-mirror-cuenta --no-verify-jwt --project-ref xaerfywydzwifohjsvwa

import { createClient } from "npm:@supabase/supabase-js@2";
import { jsonResponse, verifyWebhook } from "../_shared/webhook.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET_TAXI_TO_CAJA")!;

const EXPECTED_EVENT = "taxi.mirror_pasajero";

Deno.serve(async (req) => {
  if (req.method !== "POST") return jsonResponse(405, { error: "method not allowed" });

  const v = await verifyWebhook(req, WEBHOOK_SECRET);
  if (!v.ok) return jsonResponse(v.status, { error: v.error });

  const env = v.envelope!;
  if (env.event_type !== EXPECTED_EVENT) {
    return jsonResponse(400, { error: `event_type inesperado: ${env.event_type}` });
  }

  const telefono = String((env.data as Record<string, unknown>)?.telefono || "").trim();
  const pin = String((env.data as Record<string, unknown>)?.pin || "");
  const nombre = ((env.data as Record<string, unknown>)?.nombre as string) || "Pasajero";

  if (!/^\d{6,15}$/.test(telefono) || !pin) {
    return jsonResponse(400, { error: "payload inválido" });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const dummyEmail = `${telefono}@tonazo.app`;

  const { data: existente, error: findErr } = await admin
    .from("clientes_fiado")
    .select("id, auth_user_id")
    .eq("whatsapp", telefono)
    .maybeSingle();

  if (findErr) {
    console.error("[webhook-taxi-mirror-cuenta] error buscando clientes_fiado:", findErr);
    return jsonResponse(500, { error: "no se pudo verificar el cliente existente" });
  }

  // Ya tiene cuenta de login en Caja — solo actualizar el PIN (por si
  // cambió en Taxi-PE) y confirmar que ya tiene PIN configurado.
  if (existente?.auth_user_id) {
    const { error: updErr } = await admin.auth.admin.updateUserById(existente.auth_user_id, { password: pin });
    if (updErr) return jsonResponse(500, { error: updErr.message });
    await admin.from("profiles").update({ pin_configurado: true }).eq("id", existente.auth_user_id);
    return jsonResponse(200, { status: "ok", accion: "actualizado" });
  }

  // Cuenta nueva de Auth en Caja.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: dummyEmail,
    password: pin,
    email_confirm: true,
  });
  if (createErr) {
    console.error("[webhook-taxi-mirror-cuenta] error creando cuenta Auth:", createErr);
    return jsonResponse(500, { error: createErr.message });
  }

  const newUserId = created.user.id;

  const { error: profErr } = await admin
    .from("profiles")
    .insert({ id: newUserId, role: "cliente", nombre, pin_configurado: true });
  if (profErr) {
    await admin.auth.admin.deleteUser(newUserId);
    console.error("[webhook-taxi-mirror-cuenta] error creando profile:", profErr);
    return jsonResponse(500, { error: "no se pudo crear el perfil" });
  }

  // Si ya había una fila clientes_fiado sin login (alta manual del
  // admin), se vincula en vez de duplicar.
  if (existente) {
    const { error: linkErr } = await admin
      .from("clientes_fiado")
      .update({ auth_user_id: newUserId, nombre })
      .eq("id", existente.id);
    if (linkErr) {
      await admin.auth.admin.deleteUser(newUserId);
      console.error("[webhook-taxi-mirror-cuenta] error vinculando clientes_fiado:", linkErr);
      return jsonResponse(500, { error: "no se pudo vincular el registro de cliente" });
    }
  } else {
    const { error: clienteErr } = await admin
      .from("clientes_fiado")
      .insert({ nombre, whatsapp: telefono, fecha: Date.now(), auth_user_id: newUserId });
    if (clienteErr) {
      await admin.auth.admin.deleteUser(newUserId);
      console.error("[webhook-taxi-mirror-cuenta] error creando clientes_fiado:", clienteErr);
      return jsonResponse(500, { error: "no se pudo crear el registro de cliente" });
    }
  }

  return jsonResponse(200, { status: "ok", accion: "creado" });
});
