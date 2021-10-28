# Minotaur Ethereum Monitor

## Installation

The Ethereum Monitor needs a Node.js server, a Geth node and a Postgres database.

On the Node.js server run the following commands:

1. Git clone the minotaur repo
1. Run `cd minotaur/modules/ethereum`
1. Run `cp config/config-sample.ts config/config.ts`.
1. Run `cp test/config/config-sample.ts test/config/config.ts`
1. Edit the database and ethereum settings in `config.ts`. ([General config docs](../common/doc/index.md))
1. Run `tsc` to compile the config.  (The rest of the TypeScript should already be compiled to JavaScript)
1. To start the service run either:
    * `node scripts/eth-scan` or
    * `pm2 start scripts/eth-scan.js`
1. Once the service has been started it can be turned on and off through its entry in the `services` table of the database ([General service docs](../common/doc/service.md)).

Note: these steps assume there is a working database.

### Database Initialization

During development, execute `scripts/reset-ethereum-db.js` to initialize a local database.
That script can be run with a `--save` flag to write SQL to `scripts/sql/ethereum-db.sql`
Example: `node scripts/reset-ethereum-db --save`

For server deployment, use `scripts/sql/ethereum-db.sql`.

[View documentation for scripts](doc/scripts.md)