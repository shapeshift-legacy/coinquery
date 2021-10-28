-- Revert ss2:table-input from pg
-- requires: schema

BEGIN;

DROP TABLE IF EXISTS <%=schema%>.input CASCADE;

COMMIT;
