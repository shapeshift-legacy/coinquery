-- Revert ss2:function-delete-invalid-transactions from pg
-- requires: schema

 DROP FUNCTION IF EXISTS <%=schema%>.delete_invalid_txs
