-- Revert ss2:table-output from pg
-- requires: schema

BEGIN;

DROP TABLE IF EXISTS <%=schema%>.output CASCADE;

COMMIT;
