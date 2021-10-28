-- Deploy ss2:table-metadata to pg
-- requires: schema

BEGIN;

CREATE TABLE <%=schema%>.metadata(
  id BIGSERIAL PRIMARY KEY,
  key TEXT,
  value TEXT
);

CREATE UNIQUE INDEX idx_metadata_key ON <%=schema%>.metadata(key);

INSERT INTO <%=schema%>.metadata(key, value) VALUES('orphanCount', '0');
INSERT INTO <%=schema%>.metadata(key, value) VALUES('validatedBlock', '0');

COMMIT;
