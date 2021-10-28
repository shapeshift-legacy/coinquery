-- Deploy ss2:function-transaction-insert to pg
-- requires: schema
-- requires: table-block
-- requires: table-transaction
-- requires: function-input-insert
-- requires: function-output-insert

BEGIN;

CREATE OR REPLACE FUNCTION <%=schema%>.transaction_insert (
    IN in_block_id <%=schema%>.block.id%TYPE, 
    IN in_tx_def jsonb,
    IN in_raw_transaction <%=schema%>.transaction.raw_transaction%TYPE,
    IN in_transaction_index <%=schema%>.transaction.index%TYPE
) RETURNS void AS $$
    DECLARE
        var_transaction_id transaction.id%TYPE := NULL;
        var_transaction_index transaction.index%TYPE := NULL;
        var_block_id block.id%TYPE := NULL;
    BEGIN
        IF in_tx_def->>'txid' IS NOT NULL THEN
            IF in_block_id >= 0 THEN
                var_block_id := in_block_id;
            END IF;

            IF in_transaction_index >= 0 THEN
                var_transaction_index := in_transaction_index;
            END IF;

            SELECT id INTO var_transaction_id
                FROM transaction
                WHERE txid = in_tx_def->>'txid';

            IF var_transaction_id IS NULL THEN
                -- This is a new transaction we haven't seen before
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
                    var_transaction_index,
                    var_block_id,
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
                IF var_block_id IS NOT NULL THEN
                    -- This is a mempool transaction that has been mined
                    -- Update the block information
                    UPDATE transaction
                        SET
                            block_id = var_block_id,
                            index = var_transaction_index
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
