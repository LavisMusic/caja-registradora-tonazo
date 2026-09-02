// Bug crítico en producción: la app crasheaba con el Error Boundary
// ("Algo salió mal") apenas se entraba desde un dispositivo nuevo.
//
// Causa real: 'localStorage.getItem/setItem' puede LANZAR una excepción
// de verdad (no solo devolver null) en ciertos navegadores/dispositivos
// — modo privado de Safari en versiones viejas, políticas de privacidad
// más estrictas, webviews embebidos (apps de mensajería, ciertos
// navegadores corporativos) que bloquean el storage por completo, cuota
// excedida, storage corrupto. Varios estados de App.jsx/CatalogPage.jsx
// lo leen dentro de 'useState(() => localStorage.getItem(...))' — el
// inicializador corre en FASE DE RENDER, así que una excepción ahí tira
// abajo TODO el árbol de React y la agarra el Error Boundary. En la PC
// del dev nunca pasa porque su navegador nunca restringe ese storage;
// en un dispositivo con políticas más estrictas, revienta apenas carga.
//
// Estas funciones NUNCA lanzan: cualquier error se traga (con un aviso
// en consola, para no ocultarlo del todo) y cae a un valor por defecto
// seguro — el mismo criterio que ya usaba el resto de la app con
// 'typeof window !== "undefined"', pero cubriendo también el caso de
// que el storage SÍ exista y aun así tire una excepción al usarlo.

export function safeGetItem(key, fallback = null) {
  try {
    if (typeof window === "undefined") return fallback;
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch (err) {
    console.warn(`[safeStorage] No se pudo leer "${key}" de localStorage:`, err);
    return fallback;
  }
}

export function safeSetItem(key, value) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`[safeStorage] No se pudo guardar "${key}" en localStorage:`, err);
  }
}

export function safeRemoveItem(key) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[safeStorage] No se pudo borrar "${key}" de localStorage:`, err);
  }
}
