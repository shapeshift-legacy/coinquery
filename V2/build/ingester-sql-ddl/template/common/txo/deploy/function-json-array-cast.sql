-- Deploy ss2:json-array-cast to pg
-- requires: schema

BEGIN;

CREATE OR REPLACE FUNCTION <%=schema%>.json_array_cast(
    in_json_array jsonb
) RETURNS text[] AS $$
    DECLARE 
        var_addresses text[];
    BEGIN
        SELECT
            array_agg(v) INTO var_addresses
        FROM
            jsonb_array_elements_text(in_json_array) AS v;
        RETURN var_addresses;
    EXCEPTION WHEN OTHERS THEN
        RETURN NULL;
    END;
$$ LANGUAGE plpgsql IMMUTABLE;

SET search_path=<%=schema%>;

COMMIT;
