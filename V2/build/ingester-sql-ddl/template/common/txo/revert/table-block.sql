-- Deploy ss2:table-block to pg
-- requires: schema

BEGIN;

DROP INDEX CONCURRENTLY IF EXISTS idx_block_not_ophaned_join;

COMMIT;
