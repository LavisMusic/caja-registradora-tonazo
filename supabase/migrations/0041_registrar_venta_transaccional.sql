-- Venta transaccional: ticket ('historial') + descuento de stock en
-- UNA sola función, para que nunca puedan quedar descuadrados entre sí.
--
-- Aclaración importante sobre el pedido original de esta migración
-- ("un combo resta stock de sí mismo en vez de sus ingredientes"): eso
-- nunca pasó. Desde que existen los combos (migración 0034), un combo
-- NUNCA tuvo una fila de stock propia — su columna 'productos.consumos'
-- ya es, desde que se crea (crearCombo() en productLookup.js), el
-- aplanado de lo que consume cada ingrediente × la cantidad de la
-- receta, y availabilityFor()/el descuento de stock al vender siempre
-- fueron genéricos sobre esa columna, sea el producto un combo o no.
--
-- Lo que sí faltaba, y es lo que esta función arregla:
--   1) Atomicidad: 'historial' y 'stock' se escribían en dos llamadas
--      separadas desde el cliente (App.jsx) — si la segunda fallaba a
--      mitad de camino, la venta quedaba registrada con el stock sin
--      descontar. Una función de Postgres es una transacción implícita:
--      si CUALQUIER paso de acá adentro lanza una excepción, todo lo
--      que hizo esta función se revierte solo.
--   2) Frescura: el 'consumos' de un combo se calcula UNA sola vez, al
--      crearlo — si el 'consumos' de un ingrediente cambia después
--      (ej. le cambian la clave de stock, o su receta), el combo
--      seguiría restando de la clave VIEJA para siempre. Esta función
--      ignora el 'consumos' propio del combo y en su lugar resuelve
--      'combo_items' (la receta: [{productoId, cantidad}]) contra el
--      'consumos' ACTUAL de cada ingrediente, en cada venta.
--
-- 'consumos'/'combo_items' se castean explícitamente a jsonb antes de
-- iterarlos: en este proyecto se han escrito históricamente con
-- JSON.stringify(...) desde el cliente, y el resto del código (ver
-- productLookup.js) los trata de forma defensiva por si la columna
-- termina siendo texto en vez de jsonb nativo — el cast ::jsonb es un
-- no-op si ya es jsonb, y parsea el texto si no lo es, así que es
-- seguro en cualquiera de los dos casos.
create or replace function public.registrar_venta(
  p_purchase_id text,
  p_items jsonb, -- [{producto_id, nombre, detalle, cantidad, precio, total, costo_unitario, costo_total, venta_por_peso}]
  p_metodo_pago text,
  p_vendedor text,
  p_fecha bigint,
  p_monto_recibido numeric,
  p_vuelto numeric,
  p_ruc text
)
returns setof public.historial
language plpgsql
as $$
declare
  v_item jsonb;
  v_ingrediente jsonb;
  v_consumo jsonb;
  v_producto record;
  v_ingrediente_producto record;
  v_necesita jsonb := '{}'::jsonb;
  v_key text;
  v_val_txt text;
  v_val numeric;
  v_qty numeric;
  v_disponible numeric;
  v_row public.historial;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'No hay productos en la venta.';
  end if;

  -- 1) Acumula cuánto se necesita de cada clave de stock, resolviendo
  --    combos contra sus ingredientes AL MOMENTO de vender (no contra
  --    el 'consumos' congelado del combo).
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select id, consumos, es_combo, combo_items
      into v_producto
      from public.productos
      where id = (v_item->>'producto_id')::uuid;

    if not found then
      raise exception 'Producto % no existe', v_item->>'producto_id';
    end if;

    if v_producto.es_combo and v_producto.combo_items is not null then
      -- Combo: cada ingrediente de la receta, resuelto contra SU
      -- consumos actual, multiplicado por (cantidad del ingrediente en
      -- la receta) × (cantidad de combos vendidos en esta línea).
      for v_ingrediente in select * from jsonb_array_elements(v_producto.combo_items::jsonb)
      loop
        select id, consumos
          into v_ingrediente_producto
          from public.productos
          where id = (v_ingrediente->>'productoId')::uuid;

        if not found then
          raise exception 'Ingrediente % del combo % ya no existe', v_ingrediente->>'productoId', v_producto.id;
        end if;

        for v_consumo in select * from jsonb_array_elements(coalesce(v_ingrediente_producto.consumos::jsonb, '[]'::jsonb))
        loop
          v_key := v_consumo->>'key';
          v_qty := (v_consumo->>'qty')::numeric
                   * (v_ingrediente->>'cantidad')::numeric
                   * (v_item->>'cantidad')::numeric;
          v_necesita := jsonb_set(
            v_necesita,
            array[v_key],
            to_jsonb(coalesce((v_necesita->>v_key)::numeric, 0) + v_qty),
            true
          );
        end loop;
      end loop;
    else
      -- Producto normal (o combo legado sin combo_items): su propio
      -- 'consumos', igual que ya funcionaba.
      for v_consumo in select * from jsonb_array_elements(coalesce(v_producto.consumos::jsonb, '[]'::jsonb))
      loop
        v_key := v_consumo->>'key';
        v_qty := (v_consumo->>'qty')::numeric * (v_item->>'cantidad')::numeric;
        v_necesita := jsonb_set(
          v_necesita,
          array[v_key],
          to_jsonb(coalesce((v_necesita->>v_key)::numeric, 0) + v_qty),
          true
        );
      end loop;
    end if;
  end loop;

  -- 2) Verifica y descuenta el stock. 'for update' bloquea cada fila
  --    tocada hasta el final de la transacción: si dos ventas
  --    simultáneas compiten por lo último que queda de una misma
  --    clave, la segunda espera a que la primera termine (commit o
  --    rollback) en vez de que ambas "vean" stock suficiente a la vez.
  for v_key, v_val_txt in select * from jsonb_each_text(v_necesita)
  loop
    v_val := v_val_txt::numeric;

    select cantidad into v_disponible from public.stock where nombre = v_key for update;
    if not found then
      raise exception 'No hay fila de stock para "%".', v_key;
    end if;
    if v_disponible < v_val then
      raise exception 'Stock insuficiente para "%": disponible %, necesita %.', v_key, v_disponible, v_val;
    end if;

    update public.stock set cantidad = cantidad - v_val where nombre = v_key;
  end loop;

  -- 3) Recién con el stock ya validado y descontado, inserta el
  --    ticket. Si cualquier paso anterior lanzó una excepción, Postgres
  --    ya revirtió todo (una función es una transacción), así nunca
  --    puede quedar una venta registrada con el stock intacto, ni el
  --    stock descontado sin su ticket.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.historial (
      purchase_id, producto, detalle, cantidad, precio, total,
      costo_unitario, costo_total, monto_recibido, vuelto,
      metodo_pago, vendedor, fecha, venta_por_peso, ruc
    ) values (
      p_purchase_id,
      v_item->>'nombre',
      v_item->>'detalle',
      (v_item->>'cantidad')::numeric,
      (v_item->>'precio')::numeric,
      (v_item->>'total')::numeric,
      (v_item->>'costo_unitario')::numeric,
      (v_item->>'costo_total')::numeric,
      p_monto_recibido,
      p_vuelto,
      p_metodo_pago,
      p_vendedor,
      p_fecha,
      coalesce((v_item->>'venta_por_peso')::boolean, false),
      p_ruc
    )
    returning * into v_row;

    return next v_row;
  end loop;
end;
$$;

-- SECURITY INVOKER (el default — no se declara SECURITY DEFINER a
-- propósito): la función corre con los mismos permisos/RLS de quien la
-- llama, igual que los INSERT/UPDATE directos que reemplaza. Cualquier
-- cajero/admin autenticado ya podía hacer ambas escrituras por
-- separado, así que no hace falta (ni conviene) escalar privilegios.
grant execute on function public.registrar_venta(text, jsonb, text, text, bigint, numeric, numeric, text) to authenticated;
