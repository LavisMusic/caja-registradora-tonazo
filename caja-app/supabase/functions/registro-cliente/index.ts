// Edge Function: registro-cliente
//
// Registro PROPIO de un cliente (sin admin de por medio), desde la
// tienda pública, con:
//   supabase.functions.invoke('registro-cliente', { body: { nombre, celular, pin } })
//
// A diferencia de create-cliente (que exige JWT de admin/cajero), esta
// función es pública — la usa cualquier visitante sin sesión. Nace con
// clientes_fiado.fiado_habilitado = false: registrarse solo, sin que
// el admin lo autorice, NO da acceso a Fiados (ver migración
// 0068_fiado_habilitado_dni.sql y manage-usuario acción 'set-fiado').
//
// Contempla 3 casos por celular:
//   1) No existe ninguna cuenta            -> se crea de cero.
//   2) Existe una fila clientes_fiado SIN login (alta manual vieja del
//      admin, sin auth_user_id) -> se crea el login y se vincula esa
//      misma fila (nunca se duplica), respetando su fiado_habilitado
//      actual (puede que ya fuera un fiado de toda la vida).
//   3) Ya existe una cuenta CON login:
//      - sin PIN configurado (alta manual reciente del admin, solo
//        nombre+teléfono) -> se completa con este PIN (mismo criterio
//        que set-initial-pin).
//      - con PIN configurado -> se rechaza, ya tiene cuenta real.
//
// Deploy: supabase functions deploy registro-cliente --no-verify-jwt

import { createClient } from "npm:@supabase/supabase-js@2";
import { mirrorCuentaATaxi } from "../_shared/mirrorTaxi.ts";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let body: { nombre?: string; celular?: string; pin?: string };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Cuerpo de la petición inválido." });
  }

  const nombre = (body.nombre || "").trim();
  const celular = (body.celular || "").trim();
  const pin = (body.pin || "").trim();

  if (!nombre) return json(400, { error: "Ingresa tu nombre." });
  if (!/^\d{6,15}$/.test(celular)) return json(400, { error: "Ingresa un celular válido." });
  // Mínimo 6: es la política real de Supabase Auth para el password
  // (createUser/updateUserById lo rechaza con "Password should be at
  // least 6 characters" por debajo de eso) — validar acá el mismo
  // mínimo evita el 500 genérico y confuso que salía antes con un PIN
  // de 4-5 dígitos.
  if (!/^\d{6,10}$/.test(pin)) return json(400, { error: "El PIN debe tener entre 6 y 10 dígitos." });

  const dummyEmail = `${celular}@tonazo.app`;

  const { data: existente, error: findErr } = await admin
    .from("clientes_fiado")
    .select("id, auth_user_id")
    .eq("whatsapp", celular)
    .maybeSingle();

  if (findErr) {
    console.error("[registro-cliente] error buscando clientes_fiado:", findErr);
    return json(500, { error: "No se pudo verificar el celular. Intenta de nuevo." });
  }

  // Caso 3: ya hay una cuenta con login para este celular.
  if (existente?.auth_user_id) {
    const { data: profile } = await admin
      .from("profiles")
      .select("pin_configurado")
      .eq("id", existente.auth_user_id)
      .maybeSingle();

    if (profile?.pin_configurado) {
      return json(409, { error: "Ya existe una cuenta con ese celular. Inicia sesión." });
    }

    const { error: updAuthErr } = await admin.auth.admin.updateUserById(existente.auth_user_id, { password: pin });
    if (updAuthErr) return json(500, { error: "No se pudo completar tu registro. Intenta de nuevo." });

    await admin
      .from("profiles")
      .update({ pin_configurado: true, nombre })
      .eq("id", existente.auth_user_id);
    await admin.from("clientes_fiado").update({ nombre }).eq("id", existente.id);

    await mirrorCuentaATaxi({ telefono: celular, pin, nombre });
    return json(200, { ok: true });
  }

  // Caso 1 o 2: no hay ninguna cuenta de login todavía para este celular.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: dummyEmail,
    password: pin,
    email_confirm: true,
  });
  if (createErr) {
    console.error("[registro-cliente] error creando cuenta Auth:", createErr);
    return json(500, { error: "No se pudo crear tu cuenta. Intenta de nuevo." });
  }
  const newUserId = created.user.id;

  const { error: profErr } = await admin
    .from("profiles")
    .insert({ id: newUserId, role: "cliente", nombre, pin_configurado: true });
  if (profErr) {
    await admin.auth.admin.deleteUser(newUserId);
    console.error("[registro-cliente] error creando profile:", profErr);
    return json(500, { error: "No se pudo crear tu cuenta. Intenta de nuevo." });
  }

  if (existente) {
    // Caso 2: ya había una fila (posible fiado histórico sin login) — se
    // vincula, sin tocar su fiado_habilitado actual.
    const { error: linkErr } = await admin
      .from("clientes_fiado")
      .update({ auth_user_id: newUserId, nombre })
      .eq("id", existente.id);
    if (linkErr) {
      await admin.auth.admin.deleteUser(newUserId);
      console.error("[registro-cliente] error vinculando clientes_fiado:", linkErr);
      return json(500, { error: "No se pudo crear tu cuenta. Intenta de nuevo." });
    }
  } else {
    // Caso 1: cliente totalmente nuevo — nace SIN fiado.
    const { error: clienteErr } = await admin.from("clientes_fiado").insert({
      nombre,
      whatsapp: celular,
      fecha: Date.now(),
      auth_user_id: newUserId,
      fiado_habilitado: false,
    });
    if (clienteErr) {
      await admin.auth.admin.deleteUser(newUserId);
      console.error("[registro-cliente] error creando clientes_fiado:", clienteErr);
      return json(500, { error: "No se pudo crear tu cuenta. Intenta de nuevo." });
    }
  }

  await mirrorCuentaATaxi({ telefono: celular, pin, nombre });
  return json(200, { ok: true });
});
