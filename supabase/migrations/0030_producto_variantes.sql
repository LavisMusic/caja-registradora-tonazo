-- Refactor de variantes: hasta ahora "nombre" mezclaba base+medida+sabor
-- en un solo string ("Mikes 650ml - Limón"), y la agrupación visual del
-- POS tenía que ADIVINAR dónde cortarlo (separador " - ", o el campo
-- libre 'descripcion'). Esto agrupaba mal y el buscador de "Agregar
-- Unidades al Stock" (que buscaba sobre 'stock.etiqueta', no sobre
-- 'productos') podía omitir variantes recién creadas si su etiqueta de
-- stock no calzaba con lo que el cajero escribía.
--
-- Estas columnas separan el dato en origen — la agrupación del POS deja
-- de adivinar y agrupa ESTRICTO por 'nombre_base'. 'nombre'/'descripcion'
-- se siguen escribiendo (compose ProductoNombre/Descripcion en
-- productLookup.js) porque decenas de lugares ya leen esos dos campos
-- para boletas, WhatsApp, historial, búsqueda, etc. — no se tocan esos
-- call-sites, solo se vuelve confiable cómo se arman.
alter table public.productos
  add column if not exists nombre_base text,
  add column if not exists variante text,
  add column if not exists presentacion text,
  add column if not exists color_variante text;

-- Backfill: los productos que ya existían no tenían este concepto, así
-- que cada uno se trata como su propia "base" (no se agrupan entre sí
-- hasta que alguien los edite a mano y les asigne un nombre_base
-- compartido real). Evita que queden sin agrupar por tener nombre_base
-- NULL (lo cual los excluiría silenciosamente de la grilla si el
-- frontend llegara a asumir que siempre existe).
update public.productos set nombre_base = nombre where nombre_base is null;
