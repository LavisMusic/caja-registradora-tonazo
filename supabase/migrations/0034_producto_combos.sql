-- Módulo de Combos: un combo es una fila normal de 'productos' (mismo
-- nombre/precio/categoria de siempre) cuyo 'consumos' combina, en una
-- sola clave por ingrediente físico, lo que ya consume cada producto
-- seleccionado multiplicado por la cantidad elegida en la receta. No
-- necesita stock propio ni lógica de venta especial: availabilityFor()
-- y el descuento de stock al vender ya son genéricos sobre 'consumos'
-- (ver App.jsx) — un combo de 2 gaseosas + 1 hielo simplemente termina
-- con consumos = [{gaseosa, 2}, {hielo, 1}].
--
-- 'es_combo' distingue estas filas para no ofrecerlas donde no
-- corresponde (ej. "Agregar Unidades al Stock" ya las excluye solo por
-- tener más de una clave en 'consumos', pero el flag deja la intención
-- explícita en vez de inferida). 'combo_items' guarda la receta
-- original (qué producto + qué cantidad, por id) para poder mostrarla
-- o editarla más adelante — 'consumos' por sí solo ya perdió esa
-- información al aplanarla a claves de stock.
alter table public.productos
  add column if not exists es_combo boolean not null default false,
  add column if not exists combo_items jsonb;
