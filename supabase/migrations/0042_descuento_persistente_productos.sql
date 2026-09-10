-- Descuento PERMANENTE por producto/combo — distinto del descuento de
-- sesión (App.jsx, estado 'discounts'): ese es puntual, vive solo en
-- memoria mientras se arma UNA venta y se resetea al cobrar, nunca
-- toca 'productos'. Este 'descuento' es lo opuesto a propósito: un
-- precio rebajado permanente que aplica a TODAS las ventas futuras de
-- ese producto hasta que alguien lo cambie desde el Gestor de
-- Productos — es un cambio real de precio de lista, no una utilidad
-- de caja. Guardado en soles (no porcentaje), restado directo del
-- precio: precio_final = precio - descuento.
alter table public.productos
  add column if not exists descuento numeric not null default 0;

-- Evita un precio final negativo o un descuento mayor al propio precio
-- (ej. escribir 50 de descuento en un producto de S/ 20). Envuelto en
-- un DO block porque ALTER TABLE ... ADD CONSTRAINT no soporta
-- "IF NOT EXISTS" — esto lo hace igual de seguro para correr más de
-- una vez.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'productos_descuento_valido'
  ) then
    alter table public.productos
      add constraint productos_descuento_valido
      check (descuento >= 0 and descuento <= precio);
  end if;
end $$;
