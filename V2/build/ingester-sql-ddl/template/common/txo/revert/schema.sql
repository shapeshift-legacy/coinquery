-- Revert ss2:schema from pg

BEGIN;

DROP SCHEMA IF EXISTS <%=schema%> CASCADE;

COMMIT;
