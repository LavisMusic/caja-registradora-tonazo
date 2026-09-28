// Edge Function: create-cliente
//
// Invocada desde el admin (App.jsx) con:
//   supabase.functions.invoke('create-cliente', { body: { tipo: 'cliente', nombre, celular, pin } })
//   supabase.functions.invoke('create-cliente', { body: { tipo: 'cajero', nombre, usuario, pin } })
// y desde el super-admin (SuperAdminPanel.jsx, Fase 1) con:
//   supabase.functions.invoke('create-cliente', { body: { tipo: 'admin', nombre, usuario, pin, negocioId } })
// El SDK adjunta automáticamente el JWT de quien llama en el header Authorization.
//
// Usa la service_role key (variable de entorno inyectada por Supabase,
// nunca presente en el bundle del navegador) para:
//   1) confirmar que quien llama es realmente un admin (profiles.role),
//   2) crear el usuario de Auth con el "dummy email" + PIN como password,
//   3) guardar el perfil (y, si es cliente, el registro de clientes_fiado).
//
// La sesión del navegador del admin NUNCA se toca: el cliente admin.* de
// aquí abajo vive únicamente dentro de esta función (server-side), es un
// objeto totalmente distinto del supabase client que corre en el navegador.

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

  // 1) Verificar que quien llama es admin, usando SU JWT (nunca confiar en
  // un flag "isAdmin" que venga en el body de la petición).
  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace("Bearer ", "");
  if (!jwt) return json(401, { error: "No autenticado." });

  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData?.user) {
    return json(401, { error: "No autenticado." });
  }

  const { data: callerProfile, error: callerProfileErr } = await admin
    .from("profiles")
    .select("role, negocio_id")
    .eq("id", userData.user.id)
    .single();

  const callerRole = callerProfileErr ? null : callerProfile?.role;
  // negocio_id de un cajero/cliente nuevo: SIEMPRE el del admin/cajero
  // que lo está creando (nunca del body — un cliente/cajero pertenece
  // al negocio de quien lo dio de alta, no a lo que el navegador diga).
  // Un admin nuevo es la única excepción real: lo crea el super-admin,
  // que no pertenece a ningún negocio en particular, así que ahí sí
  // hace falta indicarlo explícito (ver 'negocioId' de body, abajo).
  const callerNegocioId = callerProfileErr ? null : callerProfile?.negocio_id ?? null;
  if (callerRole !== "admin" && callerRole !== "cajero" && callerRole !== "super_admin") {
    return json(403, { error: "No autorizado." });
  }

  // 2) Validar input
  let body: {
    tipo?: string;
    nombre?: string;
    celular?: string;
    usuario?: string;
    pin?: string;
    sucursalId?: string;
    cajaId?: string;
    negocioId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Cuerpo de la petición inválido." });
  }

  const tipo = body.tipo === "admin" ? "admin" : body.tipo === "cajero" ? "cajero" : "cliente";

  // Un cajero puede dar de alta clientes (fiados nuevos), pero NO otros
  // cajeros/personal — eso sigue siendo exclusivo del admin.
  if (tipo === "cajero" && callerRole !== "admin") {
    return json(403, { error: "Solo el admin puede crear cuentas de cajero." });
  }
  // El primer admin de un negocio nuevo lo da de alta el super-admin
  // desde su panel (Fase 1) — un admin/cajero normal no puede crear
  // otro admin (evita que un negocio se autoasigne acceso a otro).
  if (tipo === "admin" && callerRole !== "super_admin") {
    return json(403, { error: "Solo el super-admin puede crear cuentas de admin." });
  }

  const nombre = (body.nombre || "").trim();
  // Normalización explícita: null, undefined, "" (incluso "   " con
  // solo espacios) son TODOS "no se mandó PIN" — nunca "se mandó un
  // PIN inválido". Antes esto ya funcionaba vía 'body.pin || ""'
  // (undefined/"" ya colapsaban al mismo valor), pero se deja
  // explícito con .trim() para que tampoco un PIN de puros espacios
  // cuele como "truthy" por accidente.
  const pinProvided = typeof body.pin === "string" ? body.pin.trim() : "";
  const pinWasSent = pinProvided.length > 0;

  if (!nombre) return json(400, { error: "Falta el nombre." });

  // Un cajero SIEMPRE necesita su clave puesta por el admin en el
  // momento (es personal de confianza, no pasa por el flujo de
  // "crear tu PIN en el primer login"). Un cliente, en cambio, ahora
  // puede registrarse SOLO con nombre + teléfono — si no viene 'pin',
  // la cuenta se crea con un password placeholder aleatorio que nadie
  // conoce, y 'pin_configurado' queda en false hasta que el cliente
  // mismo lo reemplace por su PIN real (ver set-initial-pin).
  // Mínimo 6: es la política real de Supabase Auth para el password
  // (createUser lo rechaza con "Password should be at least 6
  // characters" por debajo de eso) — validar acá el mismo mínimo evita
  // el 500 genérico y confuso que salía antes con un PIN de 4-5 dígitos.
  if ((tipo === "cajero" || tipo === "admin") && !/^\d{6,10}$/.test(pinProvided)) {
    return json(400, { error: "El PIN/clave debe tener entre 6 y 10 dígitos." });
  }
  const negocioId = (body.negocioId || "").trim();
  if (tipo === "admin" && !negocioId) {
    return json(400, { error: "Falta el negocio." });
  }
  // Bug: este bloque validaba nombre/usuario/pin pero nunca la
  // sucursal/caja — un cajero se creaba SIEMPRE con sucursal_id/caja_id
  // en null en 'profiles' sin importar lo elegido en el formulario, y
  // recién se notaba al loguearse ("no se le ha asignado una sucursal").
  const sucursalId = (body.sucursalId || "").trim();
  const cajaId = (body.cajaId || "").trim();
  if (tipo === "cajero" && (!sucursalId || !cajaId)) {
    return json(400, { error: "Falta la sucursal/caja del cajero." });
  }
  if (tipo === "cliente" && pinWasSent && !/^\d{6,10}$/.test(pinProvided)) {
    return json(400, { error: "El PIN debe tener entre 6 y 10 dígitos." });
  }

  let dummyEmail: string;
  let celular = "";
  let usuario = "";

  if (tipo === "cliente") {
    celular = (body.celular || "").trim();
    if (!/^\d{6,15}$/.test(celular)) {
      return json(400, { error: "El celular debe tener entre 6 y 15 dígitos." });
    }
    dummyEmail = `${celular}@tonazo.app`;
  } else {
    usuario = (body.usuario || "").trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,20}$/.test(usuario)) {
      return json(400, {
        error: "El usuario debe tener 3 a 20 caracteres (letras, números, punto, guion).",
      });
    }
    dummyEmail = `${usuario}@tonazo.staff`;
  }

  // Password real de Supabase Auth para esta cuenta: el PIN si vino
  // (cajero siempre, o un cliente al que el admin igual quiso ponerle
  // uno de una), o si no un placeholder aleatorio de 32 caracteres
  // (crypto.randomUUID, NUNCA expuesto ni guardado en ningún otro
  // lado) — nadie puede loguearse con él porque nadie lo conoce; el
  // cliente entra recién cuando reemplaza este placeholder por su PIN
  // real en su primer login.
  const pinConfigurado = !!pinProvided;
  const password = pinProvided || crypto.randomUUID().replace(/-/g, "");

  // Identidad de cliente compartida entre negocios (decidido con el
  // usuario): antes de intentar crear una cuenta nueva, bloquear el
  // caso real de duplicado — este celular YA es cliente de ESTE mismo
  // negocio.
  if (tipo === "cliente") {
    const { data: yaEnEsteNegocio, error: dupErr } = await admin
      .from("clientes_fiado")
      .select("id")
      .eq("whatsapp", celular)
      .eq("negocio_id", callerNegocioId)
      .maybeSingle();
    if (dupErr) return json(500, { error: "No se pudo verificar el celular." });
    if (yaEnEsteNegocio) {
      return json(409, { error: "Ese celular ya es cliente de este negocio." });
    }
  }

  // 3) Crear el usuario en Supabase Auth (server-side, con service_role).
  let newUserId: string;
  // Se estampa profiles/clientes_fiado más abajo SOLO si esta cuenta es
  // nueva de verdad — si se reusa una existente, ya tiene su fila de
  // profiles (y clientes_fiado nace igual, con el negocio_id de ESTE
  // negocio, más abajo).
  let cuentaNueva = true;

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: dummyEmail,
    password,
    email_confirm: true,
  });

  if (createErr) {
    const yaRegistrado = /already been registered|already registered/i.test(createErr.message || "");
    // Un cliente que YA tiene cuenta (por haber comprado en OTRO
    // negocio) no es un error acá — es exactamente el caso que la
    // identidad compartida entre negocios tiene que soportar: se reusa
    // su auth_user_id y se le crea una fila de clientes_fiado NUEVA
    // para este negocio, en vez de fallar con "ya existe".
    if (tipo === "cliente" && yaRegistrado) {
      const { data: cuentaExistente, error: buscarErr } = await admin
        .from("clientes_fiado")
        .select("auth_user_id")
        .eq("whatsapp", celular)
        .not("auth_user_id", "is", null)
        .limit(1)
        .maybeSingle();
      if (buscarErr || !cuentaExistente?.auth_user_id) {
        return json(409, { error: "Ya existe un cliente registrado con ese celular." });
      }
      newUserId = cuentaExistente.auth_user_id;
      cuentaNueva = false;
    } else {
      const msg = yaRegistrado
        ? tipo === "cliente"
          ? "Ya existe un cliente registrado con ese celular."
          : "Ya existe una cuenta con ese usuario."
        : createErr.message;
      return json(409, { error: msg });
    }
  } else {
    newUserId = created.user.id;
  }

  // 4) profile row (rol según tipo) — solo para una cuenta REALMENTE
  // nueva; si se reusó una existente, 'profiles' ya tiene su fila.
  // 'nombre' se guarda siempre acá — aunque el de cliente TAMBIÉN vive
  // en clientes_fiado.nombre (no se duplica por gusto: el panel de
  // administración de usuarios lista cajeros Y clientes desde
  // 'profiles' en una sola consulta, y necesita poder mostrar el
  // nombre de ambos sin tener que hacer join con clientes_fiado).
  if (cuentaNueva) {
    const { error: profInsertErr } = await admin.from("profiles").insert({
      id: newUserId,
      role: tipo,
      nombre,
      pin_configurado: pinConfigurado,
      sucursal_id: tipo === "cajero" ? sucursalId : null,
      caja_id: tipo === "cajero" ? cajaId : null,
      negocio_id: tipo === "admin" ? negocioId : tipo === "cajero" ? callerNegocioId : null,
      // Espejo de texto plano del "usuario" de login (Gestor de
      // Cuentas del super-admin, migración 0081) — el dato real vive
      // en el email dummy de Auth (usuario@tonazo.staff), que el
      // cliente no puede leer sin service_role.
      usuario: tipo === "admin" || tipo === "cajero" ? usuario : null,
    });

    if (profInsertErr) {
      await admin.auth.admin.deleteUser(newUserId);
      // Conflicto de FK típico acá: negocioId no existe (borrado entre que
      // se abrió el formulario y se envió).
      return json(500, {
        error: profInsertErr.code === "23503" ? "Ese negocio ya no existe." : "No se pudo crear el perfil.",
      });
    }
  }

  if (tipo === "cajero" || tipo === "admin") {
    return json(200, { id: newUserId, nombre, usuario });
  }

  // 5) clientes_fiado row — reutiliza el esquema existente (whatsapp =
  // el mismo celular usado para el login). fiado_habilitado siempre
  // false acá: esta función ya no es un flujo "de Fiados" (el botón
  // que la llamaba se mudó del Gestor de Fiados al Gestor de Usuarios,
  // "Añadir Cliente", de alta general) — el fiado se asigna aparte,
  // fila por fila, mismo criterio que registro-cliente (auto-registro
  // público).
  const { data: clienteRow, error: clienteErr } = await admin
    .from("clientes_fiado")
    .insert({
      nombre,
      whatsapp: celular,
      fecha: Date.now(),
      auth_user_id: newUserId,
      fiado_habilitado: false,
      // negocio_id (Fase 1 del super-admin): clientes_fiado.negocio_id
      // es NOT NULL desde la migración 0073 — sin esto, este insert
      // fallaba siempre con un 500 apenas se probó desde un negocio
      // que no fuera Tonazo (confirmado en vivo).
      negocio_id: callerNegocioId,
    })
    .select()
    .single();

  if (clienteErr) {
    // Solo se borra la cuenta de Auth si se creó DE CERO en esta misma
    // llamada — una cuenta reusada (identidad compartida, otro negocio)
    // sigue siendo válida ahí aunque esta fila puntual haya fallado.
    if (cuentaNueva) await admin.auth.admin.deleteUser(newUserId); // profiles cascadea por FK
    return json(500, { error: "No se pudo crear el registro de cliente." });
  }

  // Espejo a Taxi-PE: solo si de verdad ya hay un PIN real (si el admin
  // registró solo nombre+teléfono, el espejo pasa recién cuando el
  // cliente lo cree en set-initial-pin — nunca con el password
  // placeholder aleatorio) Y solo si la cuenta se creó de cero acá —
  // una cuenta reusada (identidad compartida, ya existía en otro
  // negocio) NO cambió de contraseña en esta llamada, así que "pin"
  // acá no es su clave real y no hay nada que espejar.
  if (pinConfigurado && cuentaNueva) {
    await mirrorCuentaATaxi({ telefono: celular, pin: pinProvided, nombre });
  }

  return json(200, {
    id: clienteRow.id,
    nombre: clienteRow.nombre,
    whatsapp: clienteRow.whatsapp,
    fecha: clienteRow.fecha,
  });
});