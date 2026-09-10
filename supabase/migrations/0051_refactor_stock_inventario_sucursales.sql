-- Refactor de Stock (Multi-Sucursal): 'inventario_sucursales' pasa de
-- ser una tabla "espejo" (poblada una sola vez en la migración 0048,
-- nunca más tocada) a ser la ÚNICA fuente real de cantidad/costo de
-- stock, por sucursal. La tabla global 'stock' NO se borra —
-- sigue existiendo solo para su columna 'etiqueta' (el nombre humano
-- de cada clave, que no varía por sucursal) — pero 'stock.cantidad'
-- deja de leerse/escribirse desde el frontend a partir de ahora.
--
-- Riesgo de orden de despliegue: NINGUNO en la venta en sí — el
-- frontend YA desplegado (desde la pasada de Partes 4/5) manda
-- 'p_sucursal_id' en CADA venta (bloquea el checkout si no hay una
-- sucursal activa elegida), así que 'registrar_venta' puede empezar a
-- exigirlo y descontar de 'inventario_sucursales' sin esperar ningún
-- despliegue nuevo. Lo único que SÍ depende del frontend nuevo es la
-- LECTURA (la grilla de productos) y la ESCRITURA MANUAL (Agregar
-- Unidades / Gestor de Productos) — hasta que ese frontend esté en
-- línea, el catálogo simplemente no tendrá de dónde leer cantidades
-- (mostrará todo en 0 con un aviso en consola), no es un estado
-- destructivo ni bloquea vender.

-- ---------------------------------------------------------------------
-- 1) Re-sincroniza 'inventario_sucursales' contra el estado ACTUAL de
--    'stock' (mismo criterio exacto que la migración 0048: por cada
--    producto no-combo con una única clave de consumo, divide su
--    cantidad/costo actual entre las sucursales de San Ramón). Se
--    puede correr las veces que haga falta: 'on conflict ... do
--    update' siempre deja cada fila al día con el valor GLOBAL más
--    reciente — cubre tanto productos creados después de 0048 (nunca
--    tuvieron fila propia) como una resincronización si hiciera falta.
-- ---------------------------------------------------------------------
do $$
declare
  r record;
  v_sucursal record;
  v_key text;
  v_qty numeric;
  v_consumos jsonb;
  v_stock_row record;
begin
  for r in select id, consumos, es_combo from public.productos where activo = true
  loop
    if r.es_combo then
      continue;
    end if;

    v_consumos := public._normalizar_jsonb_array(coalesce(r.consumos, '[]'::jsonb)::jsonb);
    if jsonb_array_length(v_consumos) <> 1 then
      continue;
    end if;

    v_key := v_consumos->0->>'key';
    v_qty := coalesce((v_consumos->0->>'qty')::numeric, 1);
    if v_key is null or v_qty <= 0 then
      continue;
    end if;

    select cantidad, precio_costo, ultimo_costo_compra
      into v_stock_row
      from public.stock
      where nombre = v_key;
    if not found then
      continue;
    end if;

    for v_sucursal in select id from public.sucursales where activo = true
    loop
      -- Solo INSERTA lo que falte — nunca pisa una fila que ya exista.
      -- A diferencia de 0048 (primera población, sin datos previos que
      -- perder), acá ya puede haber ajustes manuales por sucursal desde
      -- el Gestor de Productos que NO deben revertirse a un valor
      -- "global" desactualizado.
      insert into public.inventario_sucursales
        (producto_id, sucursal_id, stock, precio_costo, ultimo_costo_compra)
      values (
        r.id,
        v_sucursal.id,
        coalesce(v_stock_row.cantidad, 0) / v_qty,
        v_stock_row.precio_costo,
        v_stock_row.ultimo_costo_compra
      )
      on conflict (producto_id, sucursal_id) do nothing;
    end loop;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 2) RLS: lectura pública (igual que 'stock' hoy — el catálogo público,
--    sin sesión, siempre pudo leer cantidades) para 'inventario_sucursales'
--    y para 'sucursales' (la página pública necesita resolver el id de
--    la sucursal que muestra, por nombre, antes de poder pedir stock).
-- ---------------------------------------------------------------------
drop policy if exists "inventario_sucursales_public_select" on public.inventario_sucursales;
create policy "inventario_sucursales_public_select" on public.inventario_sucursales
  for select using (true);

drop policy if exists "sucursales_public_select" on public.sucursales;
create policy "sucursales_public_select" on public.sucursales
  for select using (activo = true);

-- Escritura de 'inventario_sucursales': admin sin restricción; cajero
-- solo en la fila de SU PROPIA sucursal (mismo criterio ya aplicado al
-- resto de tablas operativas en la migración 0050).
drop policy if exists "inventario_sucursales_staff_write" on public.inventario_sucursales;
create policy "inventario_sucursales_staff_write" on public.inventario_sucursales
  for all
  using (public.is_admin() or (public.is_staff() and sucursal_id = public.mi_sucursal_id()))
  with check (public.is_admin() or (public.is_staff() and sucursal_id = public.mi_sucursal_id()));

-- ---------------------------------------------------------------------
-- 3) 'registrar_venta': el descuento de stock (paso 2 de la función)
--    pasa de la tabla global 'stock' a 'inventario_sucursales', scoped
--    por 'p_sucursal_id'. Cada clave de stock se resuelve a su producto
--    "dueño" (el único no-combo con exactamente esa key) porque
--    'inventario_sucursales' está indexada por producto, no por texto.
--    'p_sucursal_id' pasa a ser OBLIGATORIO acá (si viene null, la venta
--    se rechaza — el frontend ya nunca lo manda vacío).
-- ---------------------------------------------------------------------
create or replace function public.registrar_venta(
  p_purchase_id text,
  p_items jsonb,
  p_metodo_pago text,
  p_vendedor text,
  p_fecha bigint,
  p_monto_recibido numeric,
  p_vuelto numeric,
  p_ruc text,
  p_caja_id uuid default null,
  p_sucursal_id uuid default null
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
  v_stock_producto_id uuid;
  v_row public.historial;
begin
  v_items := public._normalizar_jsonb_array(p_items);
  if jsonb_array_length(v_items) = 0 then
    raise exception 'No hay productos en la venta.';
  end if;

  if p_sucursal_id is null then
    raise exception 'Falta indicar la sucursal activa para descontar el stock de esta venta.';
  end if;

  -- 1) Acumula cuánto se necesita de cada clave de stock, resolviendo
  --    combos contra sus ingredientes AL MOMENTO de vender (sin cambios
  --    respecto a la versión anterior).
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

  -- 2) Verifica y descuenta el stock en 'inventario_sucursales', SOLO
  --    para 'p_sucursal_id'. 'for update' sigue bloqueando cada fila
  --    tocada hasta el commit/rollback, igual que antes con 'stock'.
  for v_key, v_val_txt in select * from jsonb_each_text(v_necesita)
  loop
    v_val := v_val_txt::numeric;

    select p.id into v_stock_producto_id
      from public.productos p
      where p.es_combo = false
        and jsonb_array_length(public._normalizar_jsonb_array(p.consumos::jsonb)) = 1
        and (public._normalizar_jsonb_array(p.consumos::jsonb)->0->>'key') = v_key
      limit 1;

    if v_stock_producto_id is null then
      raise exception 'No se encontró el producto dueño de la clave de stock "%".', v_key;
    end if;

    select stock into v_disponible
      from public.inventario_sucursales
      where producto_id = v_stock_producto_id and sucursal_id = p_sucursal_id
      for update;

    if not found then
      raise exception
        'No hay fila de inventario para "%" en esta sucursal — asígnale stock desde el Gestor de Productos.',
        v_key;
    end if;
    if v_disponible < v_val then
      raise exception 'Stock insuficiente para "%": disponible %, necesita %.', v_key, v_disponible, v_val;
    end if;

    update public.inventario_sucursales
      set stock = stock - v_val, updated_at = now()
      where producto_id = v_stock_producto_id and sucursal_id = p_sucursal_id;
  end loop;

  -- 3) Recién con el stock ya validado y descontado, inserta el ticket
  --    (sin cambios respecto a la versión anterior).
  for v_item in select * from jsonb_array_elements(v_items)
  loop
    insert into public.historial (
      purchase_id, producto, detalle, cantidad, precio, total,
      costo_unitario, costo_total, monto_recibido, vuelto,
      metodo_pago, vendedor, fecha, venta_por_peso, ruc,
      caja_id, sucursal_id
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
      p_ruc,
      p_caja_id,
      p_sucursal_id
    )
    returning * into v_row;

    return next v_row;
  end loop;
end;
$$;

grant execute on function public.registrar_venta(
  text, jsonb, text, text, bigint, numeric, numeric, text, uuid, uuid
) to authenticated;
