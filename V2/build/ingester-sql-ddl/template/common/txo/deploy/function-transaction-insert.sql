-- Deploy ss2:function-transaction-insert to pg
-- requires: schema
-- requires: table-block
-- requires: table-transaction
-- requires: function-input-insert
-- requires: function-output-insert

BEGIN;

DROP FUNCTION <%=schema%>.transaction_insert (
    <%=schema%>.block.id%TYPE,
    jsonb,
    <%=schema%>.transaction.raw_transaction%TYPE,
    <%=schema%>.transaction.index%TYPE
);

CREATE OR REPLACE FUNCTION <%=schema%>.transaction_insert (
    IN in_block_id <%=schema%>.block.id%TYPE, 
    IN in_tx_def jsonb,
    IN in_raw_transaction <%=schema%>.transaction.raw_transaction%TYPE,
    IN in_transaction_index <%=schema%>.transaction.index%TYPE
) RETURNS void AS $$
    DECLARE
        var_transaction_id transaction.id%TYPE := NULL;
    BEGIN
        IF in_tx_def->>'txid' IS NOT NULL THEN
            IF in_block_id = -1 THEN
                in_block_id := NULL;
            END IF;

            IF in_transaction_index = -1 THEN
                in_transaction_index := NULL;
            END IF;

            SELECT id INTO var_transaction_id
                FROM transaction
                WHERE txid = in_tx_def->>'txid';
            IF NOT FOUND THEN
                -- This is a new transaction
                -- Insert it
                INSERT INTO transaction (
                    index,
                    block_id,
                    txid,
                    hash,
                    version,
                    size,
                    v_size,
                    weight,
                    locktime,
                    raw_transaction
                ) VALUES (
                    in_transaction_index,
                    in_block_id,
                    in_tx_def->>'txid',
                    in_tx_def->>'hash',
                    (in_tx_def->>'version')::integer,
                    (in_tx_def->>'size')::integer,
                    (in_tx_def->>'vsize')::integer,
                    (in_tx_def->>'weight')::integer,
                    (in_tx_def->>'locktime')::bigint,
                    in_raw_transaction
                ) RETURNING id INTO var_transaction_id;

                PERFORM input_insert(var_transaction_id, in_tx_def->'inputs');
                PERFORM output_insert(var_transaction_id, in_tx_def->'outputs');
            ELSE
                IF in_block_id IS NOT NULL THEN
                    -- This is a mempool transaction that has been mined
                    -- Update the block information
                    UPDATE transaction
                        SET
                            block_id = in_block_id,
                            index = in_transaction_index
                        WHERE
                            id = var_transaction_id;
                END IF;
            END IF;
        ELSE
            RAISE EXCEPTION 'no txid supplied';
        END IF;
    END;
$$ LANGUAGE PLPGSQL VOLATILE
SET search_path=<%=schema%>;

COMMIT;
