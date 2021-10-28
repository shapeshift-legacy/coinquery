-- Deploy ss2:table-output to pg
-- requires: schema
-- requires: table-transaction

BEGIN;

CREATE TABLE <%=schema%>.output(
  id BIGSERIAL PRIMARY KEY,
  transaction_id BIGINT REFERENCES <%=schema%>.transaction(id) ON DELETE CASCADE,
  vout INTEGER NOT NULL,
  amount BIGINT NOT NULL,
  asm CHARACTER VARYING NOT NULL,
  hex CHARACTER VARYING NOT NULL,
  req_sigs INTEGER NOT NULL,
  output_type CHARACTER VARYING NOT NULL,
  address VARCHAR NOT NULL,
  addresses TEXT []
);

CREATE INDEX idx_output_transaction_id ON <%=schema%>.output(transaction_id);
CREATE INDEX idx_output_address_id ON <%=schema%>.output(address);
CREATE UNIQUE INDEX idx_transaction_vout ON <%=schema%>.output(transaction_id, vout);

COMMIT;
