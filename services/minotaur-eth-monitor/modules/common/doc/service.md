# Services and Configuration

Configuration is divided into two parts, a more general `config.ts` file (documentation on that is [here](index.md)) and the service-specific `services` table in the database.

Services exist as entries in the `services` table. They allow for the creation of separate scanners that can all have independent block indexes. Some provide the ability to both increment and decrement block indexes per use case. The service structure allows configuration to be adjusted in realtime from the database rather than having to work directly with the code.

## Service properties

* `name`: string - the name of the service.
* `enabled`: boolean - whether the service is set to run or not. Setting this value to true or false will start or stop the service.
* `state`: JSON - set of additional configuration options for each service. See below for details.

## Config options in the `state` column

### Available on all services:

* `blockIndex`: integer - block index at which to start a service.
* `interval`: integer - the pause in milliseconds between scans. A single scan will start at a specified `blockIndex` and finish either when the monitor scans all available blocks or throws an error.

### Also available on `receipt-scan` and `eth-validate-blocks` services:

* `step`: integer - direction to scan or validate. May be set ot 1 or -1. A value of `1` scans forward until there are no more blocks available. A value of `-1` scans backwards until reaching block 0.
* `batchSize`: integer - number of blocks to scan or validate in a single batch.

## Updating service configuration

To change service configuration, directly update fields on the service's entry in the `services` table.