-- =========================================================================
-- Historial de cierres: quién cerró la caja (cajero o admin).
-- cajero_nombre ya guardaba el nombre; esto agrega el rol.
--
-- Idempotente.
-- =========================================================================
alter table public.cierres_caja add column if not exists cerrado_por_rol text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'cierres_caja_cerrado_por_rol_valido') then
    alter table public.cierres_caja add constraint cierres_caja_cerrado_por_rol_valido
      check (cerrado_por_rol is null or cerrado_por_rol in ('admin', 'cajero'));
  end if;
end $$;
notify pgrst, 'reload schema';
