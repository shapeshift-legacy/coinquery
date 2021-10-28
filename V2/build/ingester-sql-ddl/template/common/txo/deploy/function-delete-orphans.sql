-- Deploy ss2:function-delete-orphans to pg
-- requires: schema
-- requires: table-block
-- requires: table-transaction
-- requires: table-input
-- requires: table-output

BEGIN;

CREATE OR REPLACE FUNCTION <%=schema%>.delete_orphans()
    RETURNS void
    LANGUAGE plpgsql
AS $$
    BEGIN
        DELETE FROM input
        WHERE input.id IN (
            SELECT input.id
            FROM input
            JOIN transaction ON transaction_id = transaction.id
            JOIN block on transaction.block_id = block.id
            WHERE is_orphaned = true
        );

        DELETE FROM output
        WHERE output.id IN (
            SELECT output.id
            FROM output
            JOIN transaction ON transaction_id = transaction.id
            JOIN block ON transaction.block_id = block.id
            WHERE is_orphaned = true
        );

        DELETE FROM transaction
        WHERE transaction.id IN (
            SELECT transaction.id
            FROM block
            JOIN transaction ON block.id = transaction.block_id
            WHERE is_orphaned = true
        );
    END
$$

SET search_path=<%=schema%>;

COMMIT;
