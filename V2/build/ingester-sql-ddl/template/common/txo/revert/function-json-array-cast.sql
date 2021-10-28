-- Revert ss2:json-array-cast from pg

BEGIN;

DROP FUNCTION <%=schema%>.json_array_cast(
    jsonb
);

COMMIT;
