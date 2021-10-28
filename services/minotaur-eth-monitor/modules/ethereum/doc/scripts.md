# Minotaur Ethereum Scripts

## Block and Transaction Scanner
The Ethereum monitor scans current Ethereum state and saves the information to a database. See [installation instructions](../README.md) for full details on setting up the monitor.

1. To start the service run either:
    * `node scripts/eth-scan` or
    * `pm2 start scripts/eth-scan.js`
1. Once the service has been started it can be turned on and off through its entry in the `services` table of the database ([General service docs](../common/doc/service.md)).

## Receipt Scanner
Fills in receipt data **only**. For use after a scan that does **not** include receipt data (such as only blocks and transactions). The scan will only save data matching transactions that already exist in the database.

1. To start the service run either:
    * `node modules/ethereum/scripts/scan-receipts` or
    * `pm2 start modules/ethereum/scripts/scan-receipts.js`
1. Once the service has been started it can be turned on and off through its entry in the `services` table of the database ([General service docs](../common/doc/service.md)).

## Block Validator
Finds missing blocks and hashes/validates block headers, transaction hashes and transaction roots (AKA transaction tries). To run the block validator:

1. To start the service run either:
    * `node modules/ethereum/scripts/eth-validate-blocks` or
    * `pm2 start modules/ethereum/scripts/eth-validate-blocks.js`
1. Once the service has been started it can be turned on and off through its entry in the `services` table of the database ([General service docs](../common/doc/service.md)).
1. Validation records will be saved to the `validation_records` table in the database with a boolean indicating validity.

## Block Rescan
Deletes and rescans a single block and all its associated data. The block is specified by block index. To rescan a block, run:

`node modules/ethereum/scripts/eth-rescan-block <block number>`