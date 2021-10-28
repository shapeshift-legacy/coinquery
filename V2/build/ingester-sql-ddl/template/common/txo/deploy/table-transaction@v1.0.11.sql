-- Deploy ss2:table-transaction to pg
-- requires: schema
-- requires: table-transaction
-- requires: table-block

BEGIN;

CREATE TABLE <%=schema%>.transaction (
  id BIGSERIAL PRIMARY KEY,
  index INTEGER,
  block_id INTEGER REFERENCES <%=schema%>.block(id) ON DELETE CASCADE,
  txid CHARACTER VARYING NOT NULL UNIQUE,
  hash CHARACTER VARYING NOT NULL UNIQUE,
  version INTEGER NOT NULL,
  size INTEGER NOT NULL,
  v_size INTEGER NOT NULL,
  weight INTEGER NOT NULL,
  locktime BIGINT NOT NULL,
  raw_transaction CHARACTER VARYING NOT NULL
);

CREATE INDEX idx_transaction_block_id ON <%=schema%>.transaction(block_id);
CREATE INDEX idx_transaction_txid ON <%=schema%>.transaction(txid);

COMMIT;