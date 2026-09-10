import { createClient } from "@supabase/supabase-js";

// SEGUNDO cliente Supabase, apuntando al proyecto de Taxi-PE
// (silfhbdmfdryjdzpwzvh). Se usa SOLO para la feature de delivery
// (radar de repartidores, estado/chat/mapa de una entrega). Ver
// DELIVERY.md §2 en el repo de taxi-pe-app.
//
// - URL + anon key de Taxi-PE (variables VITE_TAXI_*, ver .env.example).
// - Sin auth por usuario: todo el acceso a los datos de la entrega pasa
//   por RPCs `security definer` de Taxi-PE que reciben el `session_token`
//   (lo devuelve la Edge Function `entrega-iniciar` de ESTE proyecto).
// - `persistSession: false` para que NO pise la sesión del cajero/cliente
//   en el Supabase propio de la Caja (son dos proyectos distintos).

const url =
  import.meta.env.VITE_TAXI_SUPABASE_URL || "https://silfhbdmfdryjdzpwzvh.supabase.co";
const anonKey =
  import.meta.env.VITE_TAXI_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpbGZoYmRtZmRyeWpkenB3enZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MDc5OTMsImV4cCI6MjEwMjM4Mzk5M30.4oceDaRyxMSPq6171TcHqcdssAxzrakkaNQdh0JiTyg";

export const supabaseTaxi = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
