-- Deploy ss2:function-transaction-insert to pg
-- requires: schema
-- requires: table-block
-- requires: table-transaction
-- requires: table-input
-- requires: table-output
-- requires: function-json-array-cast

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
) RETURNS jsonb AS $$
    DECLARE
        var_transaction_id transaction.id%TYPE := NULL;
        var_item jsonb;
    BEGIN
        IF in_tx_def->>'txid' IS NOT NULL THEN
            -- Normalize inputs:
            -- Unmined (mempool) transactions will have invalid transaction index and block id
            -- So set them to NULL
            IF in_block_id = -1 THEN
                in_block_id := NULL;
            END IF;  

            IF in_transaction_index = -1 THEN
                in_transaction_index := NULL;
            END IF;

            -- TRANSACTION STUFF --
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
            ELSE
                IF in_block_id IS NULL THEN
                    -- This is a duplicate mempool transaction
                    -- Return transaction id
                    RETURN var_transaction_id;
                ELSE
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

            -- INPUT STUFF --
            FOR var_item IN SELECT jsonb_array_elements_text(in_tx_def->'inputs') LOOP
                BEGIN
                    INSERT INTO input (
                        transaction_id,
                        vin,
                        spent_txid,
                        spent_vout,
                        asm,
                        hex,
                        sequence_num,
                        tx_in_witness,
                        coinbase
                    ) VALUES (
                        var_transaction_id,
                        (var_item->>'vin')::integer,
                        var_item->>'spent_txid',
                        (var_item->>'spent_vout')::integer,
                        var_item->>'asm',
                        var_item->>'hex',
                        (var_item->>'sequence')::bigint,
                        var_item->>'txinwitness',
                        var_item->>'coinbase'
                    );
                EXCEPTION WHEN unique_violation THEN
                    -- TODO all input data should be available in mempool
                    -- We shouldn't need to update anything, but here is where we would if needed
                END;
            END LOOP;

            -- OUTPUT STUFF --
            FOR var_item IN SELECT jsonb_array_elements_text(in_tx_def->'outputs') LOOP
                BEGIN
                    INSERT INTO output (
                        transaction_id,
                        vout,
                        amount,
                        asm,
                        hex,
                        req_sigs,
                        output_type,
                        address,
                        addresses
                    ) VALUES (
                        var_transaction_id,
                        (var_item->>'vout')::integer,
                        (var_item->>'amount')::bigint,
                        var_item->>'asm',
                        var_item->>'hex',
                        (var_item->>'reqSigs')::integer,
                        var_item->>'type',
                        (var_item->>'address')::varchar,
                        json_array_cast(var_item->'addresses')
                    );
                EXCEPTION WHEN unique_violation THEN
                    -- TODO all output data should be available in mempool
                    -- We shouldn't need to update anything, but here is where we would if needed
                END;
            END LOOP;
            RETURN var_transaction_id;
        ELSE
            RAISE EXCEPTION 'no txid supplied';
        END IF;
    EXCEPTION WHEN unique_violation THEN
    END
$$ LANGUAGE PLPGSQL VOLATILE
SET search_path=<%=schema%>;

COMMIT;
