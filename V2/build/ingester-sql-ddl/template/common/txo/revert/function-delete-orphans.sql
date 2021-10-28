-- Revert ss2:function-delete-orphans from pg
-- requires: schema

 DROP FUNCTION IF EXISTS <%=schema%>.delete_orphans
