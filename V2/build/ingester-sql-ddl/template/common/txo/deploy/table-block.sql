-- Deploy ss2:table-block to pg
-- requires: schema

CREATE INDEX CONCURRENTLY idx_block_not_ophaned_join ON <%=schema%>.block(id, is_orphaned);
