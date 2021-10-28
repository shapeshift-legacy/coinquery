-- Revert ss2:function-transaction-insert from pg
-- requires: schema
-- requires: table-block
-- requires: table-transaction

BEGIN;

DROP FUNCTION <%=schema%>.transaction_insert(
    <%=schema%>.block.id%TYPE, 
    jsonb,
    <%=schema%>.transaction.raw_transaction%TYPE,
    <%=schema%>.transaction.index%TYPE
);

COMMIT;
