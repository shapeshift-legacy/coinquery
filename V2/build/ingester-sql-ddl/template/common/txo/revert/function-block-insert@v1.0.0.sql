-- Revert ss2:function-block-insert from pg
-- requires: schema
-- requires: table-block

BEGIN;

DROP FUNCTION <%=schema%>.block_insert(
    jsonb,
    <%=schema%>.block.mined_time%TYPE,
    <%=schema%>.block.median_time%TYPE,
    BOOLEAN
);

COMMIT;
