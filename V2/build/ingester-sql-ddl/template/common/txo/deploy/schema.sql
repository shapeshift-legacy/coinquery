-- Deploy ss2:schema to pg

BEGIN;

CREATE SCHEMA <%=schema%>;

COMMIT;
