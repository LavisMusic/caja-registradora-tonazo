-- Flujo "Crear PIN en el primer login": el admin ahora puede registrar
-- un cliente con SOLO nombre + teléfono (sin PIN todavía) — la cuenta
-- de Supabase Auth se crea igual (siempre hace falta un password para
-- crearla), pero con un placeholder aleatorio que nadie conoce. Este
-- flag marca si el usuario YA reemplazó ese placeholder por su propio
-- PIN real.
--
-- default true: las cuentas que YA existían antes de esta migración
-- tienen un PIN real desde que se crearon (el flujo viejo lo pedía
-- siempre) — no hay que obligarlas a "crear PIN" de nuevo.
alter table public.profiles
  add column if not exists pin_configurado boolean not null default true;
