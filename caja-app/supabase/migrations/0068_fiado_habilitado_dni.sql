-- =========================================================================
-- Fiados restringido a usuarios asignados (no todo el que tiene cuenta).
--
-- Hasta ahora, tener una fila en 'clientes_fiado' (= tener cuenta de
-- login) era el único requisito para ver/usar Fiados. Con el registro
-- propio (nombre+celular+PIN, sin intervención del admin) eso deja de
-- alcanzar: cualquiera podría registrarse y verse a sí mismo como
-- "cliente fiado" sin que el admin lo haya autorizado.
--
-- 'fiado_habilitado': arranca en true para TODAS las filas YA
-- existentes (preserva el comportamiento actual para quien ya usaba
-- Fiados) y en false por default de acá en más (un registro nuevo
-- propio nace SIN fiado — el admin lo habilita a mano, ver
-- manage-usuario action 'set-fiado').
--
-- 'dni': para el buscador del admin (nombre/DNI/teléfono) al asignar
-- fiado a un cliente existente — opcional, nadie lo pide en el
-- registro propio.
--
-- Proyecto: Caja Tonazo. Idempotente.
-- =========================================================================

alter table public.clientes_fiado add column if not exists fiado_habilitado boolean;
update public.clientes_fiado set fiado_habilitado = true where fiado_habilitado is null;
alter table public.clientes_fiado alter column fiado_habilitado set default false;
alter table public.clientes_fiado alter column fiado_habilitado set not null;

alter table public.clientes_fiado add column if not exists dni text;
create index if not exists clientes_fiado_dni_idx on public.clientes_fiado (dni) where dni is not null;
