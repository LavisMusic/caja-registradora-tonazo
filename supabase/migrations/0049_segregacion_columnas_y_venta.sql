-- Arquitectura Multi-Sucursal — Partes 4/5 (Segregación Real de Datos),
-- paso 1 de 2: SOLO cambios ADITIVOS — columnas nuevas, backfill de lo
-- que ya existe, y un parámetro nuevo (con default) en 'registrar_venta'.
-- Nada de esto rompe el comportamiento actual: el cajero real que ya
-- está operando sigue funcionando exactamente igual ANTES y DESPUÉS de
-- correr este archivo, incluso si el frontend nuevo todavía no está
-- desplegado.
--
-- El endurecimiento de RLS (que si exige caja_id/sucursal_id correctos
-- para escribir) vive aparte, en 0050_segregacion_rls_estricta.sql —
-- ESE sí es peligroso de correr antes de tiempo. Ver el aviso al
-- principio de ese archivo.
--
-- Todo lo de acá se backfillea a 'Santa Rosa 6.50' / 'Caja 1' — la
-- única sucursal/caja que ha operado alguna vez en este sistema (mismo
-- criterio que ya usó la migración 0048 para 'profiles'/el split de
-- stock). 'Paucartambo' arranca sin historial propio porque nunca
-- vendió nada todavía.

do $$
declare
  v_sucursal_id uuid;
  v_caja_id uuid;
begin
  select id into v_sucursal_id from public.sucursales where nombre = 'Santa Rosa 6.50';
  select c.id into v_caja_id
    from public.cajas c
    where c.sucursal_id = v_sucursal_id and c.nombre = 'Caja 1';

  if v_sucursal_id is null or v_caja_id is null then
    raise exception 'No se encontró Santa Rosa 6.50 / Caja 1 — ¿corriste la migración 0048 primero?';
  end if;

  -- -----------------------------------------------------------------
  -- 1) Columnas nuevas (nullable, igual que las de 'historial'/
  --    'cierres_caja' en 0048) en las tablas que todavía no las tenían.
  -- -----------------------------------------------------------------
  alter table public.clientes_fiado
    add column if not exists sucursal_id uuid references public.sucursales(id),
    add column if not exists caja_id uuid references public.cajas(id);

  alter table public.fiado_items
    add column if not exists sucursal_id uuid references public.sucursales(id),
    add column if not exists caja_id uuid references public.cajas(id);

  alter table public.movimientos_fiado
    add column if not exists sucursal_id uuid references public.sucursales(id),
    add column if not exists caja_id uuid references public.cajas(id);

  alter table public.pagos_pendientes
    add column if not exists sucursal_id uuid references public.sucursales(id),
    add column if not exists caja_id uuid references public.cajas(id);

  alter table public.comprobantes
    add column if not exists sucursal_id uuid references public.sucursales(id),
    add column if not exists caja_id uuid references public.cajas(id);

  -- -----------------------------------------------------------------
  -- 2) Backfill: TODO lo que ya existe (incluido lo que 0048 dejó en
  --    null en 'historial'/'cierres_caja') pasa a pertenecer a Santa
  --    Rosa 6.50 / Caja 1. Sin este paso, apenas el frontend empiece a
  --    filtrar por sucursal activa, todo el historial viejo
  --    "desaparecería" de la vista (nunca fue null a propósito, solo
  --    faltaba escribirlo).
  -- -----------------------------------------------------------------
  update public.historial
    set sucursal_id = v_sucursal_id, caja_id = v_caja_id
    where sucursal_id is null or caja_id is null;

  update public.cierres_caja
    set sucursal_id = v_sucursal_id, caja_id = v_caja_id
    where sucursal_id is null or caja_id is null;

  update public.clientes_fiado
    set sucursal_id = v_sucursal_id, caja_id = v_caja_id
    where sucursal_id is null or caja_id is null;

  update public.fiado_items
    set sucursal_id = v_sucursal_id, caja_id = v_caja_id
    where sucursal_id is null or caja_id is null;

  update public.movimientos_fiado
    set sucursal_id = v_sucursal_id, caja_id = v_caja_id
    where sucursal_id is null or caja_id is null;

  update public.pagos_pendientes
    set sucursal_id = v_sucursal_id, caja_id = v_caja_id
    where sucursal_id is null or caja_id is null;

  update public.comprobantes
    set sucursal_id = v_sucursal_id, caja_id = v_caja_id
    where sucursal_id is null or caja_id is null;
end $$;

create index if not exists clientes_fiado_sucursal_id_idx on public.clientes_fiado (sucursal_id);
create index if not exists fiado_items_caja_id_idx on public.fiado_items (caja_id);
create index if not exists movimientos_fiado_caja_id_idx on public.movimientos_fiado (caja_id);
create index if not exists pagos_pendientes_caja_id_idx on public.pagos_pendientes (caja_id);
create index if not exists comprobantes_caja_id_idx on public.comprobantes (caja_id);
create index if not exists historial_caja_id_idx on public.historial (caja_id);
create index if not exists cierres_caja_caja_id_idx on public.cierres_caja (caja_id);

-- -----------------------------------------------------------------
-- 3) 'registrar_venta': agrega 'p_caja_id'/'p_sucursal_id' AL FINAL
--    (con default null — Postgres permite ampliar una función con
--    'create or replace' siempre que los parámetros existentes no
--    cambien y los nuevos tengan default), y los estampa en el INSERT
--    de 'historial'. Puramente aditivo: la lógica de descuento de
--    stock (contra la tabla 'stock' global) NO se toca en este pase —
--    eso es la Parte 3 pendiente ("Refactorización del Stock"), que se
--    hace aparte por su propio riesgo.
-- -----------------------------------------------------------------
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
  v_row public.historial;
begin
  v_items := public._normalizar_jsonb_array(p_items);
  if jsonb_array_length(v_items) = 0 then
    raise exception 'No hay productos en la venta.';
  end if;

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
