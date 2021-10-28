# Minotaur Common Documentation

General configuration settings are found in the `config.ts` file in modules/ethereum/config. This is separate from service configuration (documented [here](service.md)).

## Ethereum Monitor Configuration

* `blockQueue.maxSize`: number - the maximum amount of blocks that can be saved to the database in a single batch.
* `blockQueue.maxBlockRequests`: number *(default: 5)* - the maximum amount of concurrent block requests.
* `blockQueue.minSize`: number - the minimium amount of blocks to save to the database in a single batch.
* `database.database`: string - the name of the database.
* `database.dialect`: string - database dialect, for example 'postgres'.
* `database.host`: string - the host of the database. For local testing, set to 'localhost'.
* `database.logging`: boolean *(default: true)* - enables or disables SQL logging in the console.
* `database.password`: string - password for the database user.
* `database.username`: string - username for the database user.
* `ethereum.client.http`: string - endpoint for the Geth node that the scanner will ping with RPC calls.