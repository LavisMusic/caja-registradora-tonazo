-- Bug en la propia migración 0079: "sucursales_admin_write" (INSERT)
-- quedó con "with check (is_admin() and sucursal_en_mi_negocio(id))",
-- pero 'id' ahí es el id de la sucursal que se está insertando EN ESE
-- MISMO instante — sucursal_en_mi_negocio() busca esa fila dentro de
-- la tabla 'sucursales', que todavía no existe (la fila se está
-- creando). Esa búsqueda siempre da 0 filas, así que el CHECK siempre
-- rechaza, sin importar el negocio: nadie podía crear una sucursal
-- nueva. Se corrige mirando 'localidad_id' (FK a una localidad que sí
-- existe de antes) en vez del propio id de la fila nueva.

drop policy if exists "sucursales_admin_write" on public.sucursales;
create policy "sucursales_admin_write" on public.sucursales
  for insert
  with check (
    is_admin()
    and exists (
      select 1 from public.localidades l
      where l.id = localidad_id and l.negocio_id = mi_negocio_id()
    )
  );
