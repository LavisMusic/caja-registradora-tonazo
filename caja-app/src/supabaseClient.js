import { createClient } from '@supabase/supabase-js';

// Colocamos la URL y la Key directamente como texto (asegúrate de mantener las comillas)
const supabaseUrl = 'https://xaerfywydzwifohjsvwa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhZXJmeXd5ZHp3aWZvaGpzdndhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMDA4NjcsImV4cCI6MjEwMDU3Njg2N30.Qi_mb_0wWEtFxnTCpe4-yCvdmvO1vFmatVFGzjiyC8o';

// "Mantener sesión iniciada": el cliente de Supabase solo permite fijar
// UN storage al crearlo, así que este adapter decide en cada operación
// si escribe en localStorage (persiste entre reinicios del navegador) o
// en sessionStorage (se borra al cerrar la pestaña), según lo que haya
// elegido el usuario en el checkbox de login — ver setAuthPersistence().
//
// getItem revisa AMBOS: en una recarga de la misma pestaña, la sesión
// puede estar en sessionStorage aunque "rememberMe" haya vuelto a su
// default (true) al recargar el módulo; sin este fallback, se perdería
// la sesión de "no recordar" con solo refrescar la página.
let rememberMe = true;

export function setAuthPersistence(remember) {
  rememberMe = remember;
}

// Bug crítico: en un dispositivo/navegador que bloquea localStorage o
// sessionStorage (modo privado, políticas de privacidad, webviews
// embebidos), 'window.localStorage.getItem(...)' puede LANZAR en vez de
// devolver null. El SDK de Supabase llama a este storage adapter desde
// su propia inicialización (restaurar la sesión guardada) — una
// excepción ahí puede tirar abajo el arranque de toda la app antes de
// que React llegue a montar nada útil. 'memoryFallback' deja a la
// sesión funcionando igual DENTRO de esta pestaña (se pierde al
// recargar, pero la app no revienta) cuando el storage real no está
// disponible — mismo criterio de "nunca lanzar" que safeStorage.js.
const memoryFallback = new Map();

const dynamicStorage = {
  getItem: (key) => {
    try {
      return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
    } catch (err) {
      console.warn(`[supabaseClient] Storage bloqueado al leer "${key}", usando memoria:`, err);
      return memoryFallback.get(key) ?? null;
    }
  },
  setItem: (key, value) => {
    try {
      const target = rememberMe ? window.localStorage : window.sessionStorage;
      const other = rememberMe ? window.sessionStorage : window.localStorage;
      target.setItem(key, value);
      other.removeItem(key); // evita un resto duplicado/desincronizado en el otro storage
    } catch (err) {
      console.warn(`[supabaseClient] Storage bloqueado al guardar "${key}", usando memoria:`, err);
      memoryFallback.set(key, value);
    }
  },
  removeItem: (key) => {
    try {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    } catch (err) {
      console.warn(`[supabaseClient] Storage bloqueado al borrar "${key}":`, err);
    }
    memoryFallback.delete(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: dynamicStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
