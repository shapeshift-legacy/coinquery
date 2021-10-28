-- Revert ss2:table-block from pg
-- requires: schema

BEGIN;

DROP TABLE IF EXISTS <%=schema%>.block CASCADE;

COMMIT;
