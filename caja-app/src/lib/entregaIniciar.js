import { supabase } from "../supabaseClient";

// Handshake de delivery — llama a la Edge Function `entrega-iniciar` de
// ESTE proyecto (valida rol admin/cajero y hace la llamada firmada a
// Taxi-PE). Devuelve { entrega_id, session_token, pin, qr_payload }.
// Ver DELIVERY.md §2.
//
// Se usa `supabase.functions.invoke` (no fetch crudo) para que el
// cliente adjunte solo `apikey` + `Authorization` de la sesión y maneje
// el CORS/preflight como corresponde.

export async function iniciarEntrega(pedido) {
  const { data, error } = await supabase.functions.invoke("entrega-iniciar", {
    body: { pedido },
  });

  if (error) {
    // FunctionsHttpError trae la respuesta en error.context.
    let detalle = error.message || "No se pudo iniciar la entrega.";
    try {
      const body = await error.context?.json();
      if (body?.error) detalle = body.detail ? `${body.error}: ${body.detail}` : body.error;
    } catch {
      /* el cuerpo no era JSON */
    }
    throw new Error(detalle);
  }
  return data; // { entrega_id, session_token, pin, qr_payload }
}
