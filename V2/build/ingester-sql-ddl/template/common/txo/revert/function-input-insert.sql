-- Revert ss2:function-input-insert from pg
-- requires: table-transaction
-- requires: table-input

BEGIN;

DROP FUNCTION <%=schema%>.input_insert(
    <%=schema%>.transaction.id%TYPE,
    jsonb
);

COMMIT;
