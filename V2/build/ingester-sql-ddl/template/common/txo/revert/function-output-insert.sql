-- Revert ss2:function-output-insert from pg
-- requires: table-transaction
-- requires: table-output

BEGIN;

DROP FUNCTION <%=schema%>.output_insert(
    <%=schema%>.transaction.id%TYPE,
    jsonb
);

COMMIT;
