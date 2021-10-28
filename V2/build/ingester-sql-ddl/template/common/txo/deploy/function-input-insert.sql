-- Deploy ss2:function-input-insert to pg
-- requires: table-transaction
-- requires: table-input

BEGIN;

CREATE OR REPLACE FUNCTION <%=schema%>.input_insert (
    IN in_transaction_id <%=schema%>.transaction.id%TYPE,
    IN in_inputs jsonb
) RETURNS void AS $$
    DECLARE
        var_input jsonb;
    BEGIN
        FOR var_input IN SELECT jsonb_array_elements_text(in_inputs) LOOP
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
                    in_transaction_id,
                    (var_input->>'vin')::integer,
                    var_input->>'spent_txid',
                    (var_input->>'spent_vout')::integer,
                    var_input->>'asm',
                    var_input->>'hex',
                    (var_input->>'sequence')::bigint,
                    var_input->>'txinwitness',
                    var_input->>'coinbase'
                );
            EXCEPTION WHEN unique_violation THEN
                RAISE NOTICE 'input already exists with transaction_id(%) and vin(%)', in_transaction_id, var_input->>'vin';
            END;
        END LOOP;
    END;
$$ LANGUAGE PLPGSQL VOLATILE;

SET search_path=<%=schema%>;

COMMIT;
