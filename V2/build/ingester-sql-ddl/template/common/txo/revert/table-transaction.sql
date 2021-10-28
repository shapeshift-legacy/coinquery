-- Revert ss2:table-transaction from pg
-- requires: schema

CREATE INDEX idx_transaction_txid ON <%=schema%>.transaction(txid);
