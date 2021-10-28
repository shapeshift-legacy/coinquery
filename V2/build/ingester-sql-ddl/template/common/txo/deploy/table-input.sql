-- Deploy ss2:table-input to pg
-- requires: schema
-- requires: table-transaction

BEGIN;

CREATE TABLE <%=schema%>.input(
  id BIGSERIAL PRIMARY KEY,
  transaction_id BIGINT REFERENCES <%=schema%>.transaction(id) ON DELETE CASCADE,
  vin INTEGER NOT NULL,
  spent_txid CHARACTER VARYING NOT NULL,
  spent_vout INTEGER NOT NULL,
  asm CHARACTER VARYING NOT NULL,
  hex CHARACTER VARYING NOT NULL,
  sequence_num BIGINT NOT NULL,
  tx_in_witness CHARACTER VARYING,
  coinbase CHARACTER VARYING
);

CREATE INDEX idx_input_transaction_id ON <%=schema%>.input(transaction_id);
CREATE INDEX idx_spent_txid ON <%=schema%>.input(spent_txid, spent_vout);
CREATE UNIQUE INDEX idx_transaction_vin ON <%=schema%>.input(transaction_id, vin);

COMMIT;
