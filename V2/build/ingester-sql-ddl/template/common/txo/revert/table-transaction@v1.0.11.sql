-- Revert ss2:table-transaction from pg
-- requires: schema

BEGIN;

DROP TABLE IF EXISTS <%=schema%>.transaction CASCADE;

COMMIT;
