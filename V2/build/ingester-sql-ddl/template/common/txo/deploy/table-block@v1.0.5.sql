-- Deploy ss2:table-block to pg
-- requires: schema

BEGIN;

CREATE TABLE <%=schema%>.block(
    id BIGSERIAL PRIMARY KEY,
    block_hash CHARACTER VARYING NOT NULL,
    height BIGINT NOT NULL,
    mined_time TIMESTAMP WITH TIME ZONE NOT NULL,
    median_time TIMESTAMP WITH TIME ZONE NOT NULL,
    nonce BIGINT NOT NULL,
    last_block_hash CHARACTER VARYING NOT NULL,
    next_block_hash CHARACTER VARYING NOT NULL,
    bits CHARACTER VARYING NOT NULL,
    difficulty CHARACTER VARYING NOT NULL,
    chainwork CHARACTER VARYING NOT NULL,
    version INTEGER NOT NULL,
    version_hex CHARACTER VARYING NOT NULL,
    merkle_root CHARACTER VARYING NOT NULL,
    size INTEGER NOT NULL,
    stripped_size INTEGER NOT NULL,
    weight INTEGER NOT NULL,
    tx_count INTEGER NOT NULL,
    is_orphaned BOOLEAN DEFAULT 'f'
);

CREATE INDEX idx_block_height ON <%=schema%>.block(height);
CREATE INDEX idx_block_hash ON <%=schema%>.block(block_hash);

COMMIT;
