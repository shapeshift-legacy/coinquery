
WITH distinct_tos AS (
    SELECT DISTINCT transactions.to FROM transactions WHERE transactions.to IS NOT NULL
),

distinct_froms AS (
    SELECT DISTINCT transactions.from FROM transactions WHERE transactions.from IS NOT NULL
),

distinct_addresses AS (
    SELECT froms.from, NOW() FROM distinct_froms AS froms 
    UNION
    SELECT tos.to, NOW() FROM distinct_tos AS tos
)

INSERT INTO addresses (hash, created) 
SELECT * FROM distinct_addresses;