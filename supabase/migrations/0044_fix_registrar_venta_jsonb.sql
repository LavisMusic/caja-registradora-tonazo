-- Corrige el error 22023 "cannot extract elements from a scalar" en
-- registrar_venta (migración 0041).
--
-- Causa: 'productos.consumos'/'productos.combo_items' se escriben
-- desde el cliente con JSON.stringify(...) (ver crearCombo/
-- crearProducto en productLookup.js). Si esas columnas son 'text' (no
-- 'jsonb' nativo) — o si en algún momento terminaron con una vuelta
-- extra de serialización — el valor guardado puede ser un string JSON
-- CUYO CONTENIDO es el array real, en vez del array en sí (ej. la
-- columna contiene literalmente '"[{\"key\":\"a\"}]"', comillas
-- incluidas, no '[{"key":"a"}]'). Un simple '::jsonb' sobre ese texto
-- no arma un array: arma un jsonb de tipo STRING cuyo contenido de
-- texto es el array — y jsonb_array_elements() sobre un string tira
-- exactamente "cannot extract elements from a scalar".
--
-- Arreglo: 'normalizar_jsonb_array()' detecta este caso (jsonb_typeof
-- = 'string') y vuelve a parsear el contenido UNA vez más; si ya es un
-- array de verdad, lo devuelve tal cual; cualquier otra cosa (null,
-- objeto, número) se trata como "sin datos" -> array vacío, en vez de
-- reventar la venta entera. Se aplica a 'p_items' (el carrito que
-- manda el frontend), 'combo_items' y 'consumos' — los tres puntos
-- donde el código anterior llamaba jsonb_array_elements() directo.
create or replace function public._normalizar_jsonb_array(v jsonb)
returns jsonb
language plpgsql
immutable
as $$
declare
  v_reparsed jsonb;
begin
  if v is null then
    return '[]'::jsonb;
  end if;
  if jsonb_typeof(v) = 'array' then
    return v;
  end if;
  if jsonb_typeof(v) = 'string' then
    -- '#>> '{}'' saca el texto SIN comillas del jsonb-string, y se
    -- intenta parsear otra vez como jsonb. Si tampoco es un array
    -- válido (o ni siquiera es JSON parseable), el 'exception' de
    -- abajo lo trata como "sin datos" en vez de reventar la venta.
    begin
      v_reparsed := (v #>> '{}')::jsonb;
      if jsonb_typeof(v_reparsed) = 'array' then
        return v_reparsed;
      end if;
    exception when others then
      return '[]'::jsonb;
    end;
  end if;
  return '[]'::jsonb;
end;
$$;

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
  v_items jsonb;
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
  v_items := public._normalizar_jsonb_array(p_items);
  if jsonb_array_length(v_items) = 0 then
    raise exception 'No hay productos en la venta.';
  end if;

  -- 1) Acumula cuánto se necesita de cada clave de stock, resolviendo
  --    combos contra sus ingredientes AL MOMENTO de vender (no contra
  --    el 'consumos' congelado del combo).
  for v_item in select * from jsonb_array_elements(v_items)
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
      for v_ingrediente in
        select * from jsonb_array_elements(
          public._normalizar_jsonb_array(v_producto.combo_items::jsonb)
        )
      loop
        select id, consumos
          into v_ingrediente_producto
          from public.productos
          where id = (v_ingrediente->>'productoId')::uuid;

        if not found then
          raise exception 'Ingrediente % del combo % ya no existe', v_ingrediente->>'productoId', v_producto.id;
        end if;

        for v_consumo in
          select * from jsonb_array_elements(
            public._normalizar_jsonb_array(v_ingrediente_producto.consumos::jsonb)
          )
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
      for v_consumo in
        select * from jsonb_array_elements(
          public._normalizar_jsonb_array(v_producto.consumos::jsonb)
        )
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
  for v_item in select * from jsonb_array_elements(v_items)
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

grant execute on function public.registrar_venta(text, jsonb, text, text, bigint, numeric, numeric, text) to authenticated;
grant execute on function public._normalizar_jsonb_array(jsonb) to authenticated;
