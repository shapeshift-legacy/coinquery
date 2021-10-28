-- Deploy ss2:function-delete-invalid-transactions to pg
-- requires: schema
-- requires: table-transaction

BEGIN;

CREATE OR REPLACE FUNCTION <%=schema%>.delete_invalid_txs(
    IN in_ids bigint[] 
)
    RETURNS void
    LANGUAGE plpgsql
AS $$
    BEGIN
        DELETE FROM transaction
        WHERE id = ANY(in_ids)
        AND block_id IS NULL;
    END
$$

SET search_path=<%=schema%>;

COMMIT;