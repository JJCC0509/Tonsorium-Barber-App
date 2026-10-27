-- 003_service_role_grants.sql
--
-- Supabase ya no otorga privilegios automáticamente a las tablas nuevas creadas
-- en el esquema `public`. El rol `service_role` tiene BYPASSRLS, pero BYPASSRLS
-- solo omite el filtrado por filas: NO omite los permisos de tabla (GRANT).
-- Sin estos permisos el backend falla con:
--   `42501 permission denied for table shops`
--
-- Se otorgan privilegios ÚNICAMENTE a `service_role` (el backend).
-- `anon` y `authenticated` quedan deliberadamente sin acceso: la app móvil nunca
-- habla directamente con Supabase.

grant usage on schema public to service_role;

grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- Objetos que se creen en el futuro con este mismo rol.
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on functions to service_role;
