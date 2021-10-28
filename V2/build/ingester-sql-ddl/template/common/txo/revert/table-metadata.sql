-- Revert ss2:table-metadata from pg
-- requires: schema

BEGIN;

DROP TABLE IF EXISTS <%=schema%>.metadata;

COMMIT;
