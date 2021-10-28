-- Deploy ss2:function-output-insert to pg
-- requires: table-transaction
-- requires: table-output
-- requires: function-json-array-cast

BEGIN;

CREATE OR REPLACE FUNCTION <%=schema%>.output_insert (
    IN in_transaction_id <%=schema%>.transaction.id%TYPE,
    IN in_outputs jsonb
) RETURNS void AS $$
    DECLARE
        var_output jsonb;
    BEGIN
        FOR var_output IN SELECT jsonb_array_elements_text(in_outputs) LOOP
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
                    in_transaction_id,
                    (var_output->>'vout')::integer,
                    (var_output->>'amount')::bigint,
                    var_output->>'asm',
                    var_output->>'hex',
                    (var_output->>'reqSigs')::integer,
                    var_output->>'type',
                    (var_output->>'address')::varchar,
                    json_array_cast(var_output->'addresses')
                );
            EXCEPTION WHEN unique_violation THEN
                RAISE NOTICE 'output already exists with transaction_id(%) and vout(%)', in_transaction_id, var_output->>'vout';
            END;
        END LOOP;
    END;
$$ LANGUAGE PLPGSQL VOLATILE;

SET search_path=<%=schema%>;

COMMIT;
