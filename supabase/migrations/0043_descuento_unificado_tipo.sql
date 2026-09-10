-- Unifica el sistema de descuentos: la migración 0042 (columna única
-- 'descuento', en soles) se reemplaza acá por DOS columnas —
-- 'valor_descuento' (numérico) + 'tipo_descuento' ('porcentaje' o
-- 'fijo') — porque el descuento de sesión/efímero que vivía en
-- App.jsx (estado 'discounts', nunca tocaba la base) queda ELIMINADO:
-- el modal del botón "%" en la tarjeta pasa a ser el único lugar para
-- configurar descuentos, y ahora escribe directo acá. Ya no hay dos
-- sistemas de descuento — solo este.
alter table public.productos
  add column if not exists valor_descuento numeric not null default 0,
  add column if not exists tipo_descuento text not null default 'fijo';

-- Migra lo que ya hubiera en 'descuento' (migración 0042) antes de
-- borrarla — por si esa migración llegó a correrse y alguien ya había
-- guardado algo desde el Gestor de Productos en la versión anterior.
-- 'descuento' siempre fue un monto en soles, así que migra como 'fijo'.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'productos' and column_name = 'descuento'
  ) then
    update public.productos
      set valor_descuento = descuento, tipo_descuento = 'fijo'
      where descuento is not null and descuento > 0;

    alter table public.productos drop constraint if exists productos_descuento_valido;
    alter table public.productos drop column descuento;
  end if;
end $$;

-- 'porcentaje': 0-100. 'fijo': 0 hasta el propio precio (nunca deja el
-- producto en negativo). Envuelto en DO block porque ADD CONSTRAINT no
-- soporta "IF NOT EXISTS" — así corre seguro más de una vez.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'productos_tipo_descuento_valido'
  ) then
    alter table public.productos
      add constraint productos_tipo_descuento_valido
      check (tipo_descuento in ('porcentaje', 'fijo'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'productos_valor_descuento_valido'
  ) then
    alter table public.productos
      add constraint productos_valor_descuento_valido
      check (
        (tipo_descuento = 'porcentaje' and valor_descuento >= 0 and valor_descuento <= 100)
        or
        (tipo_descuento = 'fijo' and valor_descuento >= 0 and valor_descuento <= precio)
      );
  end if;
end $$;
