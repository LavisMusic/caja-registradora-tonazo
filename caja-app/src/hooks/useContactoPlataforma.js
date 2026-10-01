import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

// WhatsApp de contacto de la plataforma (pagos / soporte / afiliación),
// tabla plataforma_contacto (una sola fila, migración 0087). Lo edita el
// super admin en su panel (ContactoPlataformaModal) y se copia solo a
// Taxi-PE por webhook. Cache a nivel de módulo: varios botones en la
// misma pantalla comparten UNA consulta.
let cache = null;
let enVuelo = null;

function cargar() {
  if (!enVuelo) {
    enVuelo = supabase
      .from("plataforma_contacto")
      .select("whatsapp_pagos, whatsapp_soporte, whatsapp_afiliacion")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        cache = data || {};
        return cache;
      })
      .catch(() => {
        enVuelo = null;
        return {};
      });
  }
  return enVuelo;
}

// Después de guardar cambios en el gestor: la próxima lectura va a la base.
export function invalidarContactoPlataforma(nuevo) {
  cache = nuevo || null;
  enVuelo = nuevo ? Promise.resolve(nuevo) : null;
}

export function useContactoPlataforma() {
  const [contacto, setContacto] = useState(cache);

  useEffect(() => {
    if (cache) return undefined;
    let activo = true;
    cargar().then((c) => {
      if (activo) setContacto(c);
    });
    return () => {
      activo = false;
    };
  }, []);

  return contacto || {};
}
