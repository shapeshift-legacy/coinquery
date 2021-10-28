
ALTER TABLE "transactions" ADD COLUMN "receiptsRoot" character(66) DEFAULT '' NOT NULL;
ALTER TABLE "transactions" ADD COLUMN "transactionsRoot" character(66) DEFAULT '' NOT NULL;

ALTER TABLE "transactions" ADD COLUMN "gasLimit" numeric DEFAULT '0' NOT NULL;
ALTER TABLE "transactions" ADD COLUMN "gasUsed" numeric DEFAULT '0' NOT NULL;
ALTER TABLE "transactions" ADD COLUMN "v" character varying(255) DEFAULT '' NOT NULL;
ALTER TABLE "transactions" ADD COLUMN "r" character varying(255) DEFAULT '' NOT NULL;
ALTER TABLE "transactions" ADD COLUMN "s" character varying(255) DEFAULT '' NOT NULL;
ALTER TABLE "transactions" ADD COLUMN "extraData" text; -- Temporarily nullable, though maybe it will be good to always have '0x' be stored as null

UPDATE "blocks"
  "receiptsRoot" = "receiptTrie",
  "transactionsRoot" = "transactionsTrie"
  ;
