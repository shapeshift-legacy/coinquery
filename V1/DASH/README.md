# CoinQuery Dash Service

* The Dash service processes client API requests such as transaction details and account transaction history.

* Production server:
[https://dash.redacted.example.com](https://dash.redacted.example.com)

## Development Environment

### Build and run
`DASH/`
* `make dash` - build the docker image
* `make run` - run the service

Other make targets:
`DASH/`
* `make shell` - start docker container with interactive shell
* `make shell-attach` -- attach to already running container


### Docker image `coinquery/dash-insight`

1. [insight-api-dash](https://github.com/dashpay/insight-api-dash) - The Dash fork of insight-api

### Block Diagram

```
+---------------------------------------------------------+
|   Docker: coinquery/dash-insight                         |
|                                                         |
|  --------------------------------------------------+    |
|  | Bitcore-node                                    |    |
|  |                                                 |    |
|  |   +---------------+        +---------------+    |    |
|  |   |               |        |               |    |    |   HTTP
|  |   |    Dash       |        |               |    |    |
|  |   |  Masternode   |  RPC   |  Insight API  |    |    |
|  |   | (bitcoind)    +--------+    service    +----------------+
|  |   |               |        |               |    |    |
|  |   |               |        |               |    |    |
|  |   +---------------+        +---------------+    |    |
|  --------------------------------------------------+    |
|             |                                           |
|         +-------+                                       |
|         |-------|                                       |
|         |-------| Chaindata                             |
|         |-------|                                       |
|         +-------+                                       |
|                                                         |
+---------------------------------------------------------+

```


## Test Environment
The test environment is used to verify operation of the block explorer service in the development, staging, and production environments.

### Build

`DASH/test/`
* `make deps` - install dependencies in the test fixture

### Test

`DASH/test/`
* `make test-dev` - tests against locally running service [http://localhost:3001](http://localhost:3001)
* `make test-stage` - test against [dash-stage.redacted.example.com](https://dash-stage.redacted.example.com)
* `make test-prod` - test against [dash.redacted.example.com](https://ash.redacted.example.com)
* `make tests-that-spend` - tests that send real DASH transactions via the CoinQuery service


## Other Dash block explorers
[explorer.dash]
(https://explorer.dash.org/chain/Dash)

[Dash Insight]
(https://insight.dash.org/insight/)

[Dash.com]
(https://www.dash.org/)

## References

[Bitcore Node]
(https://github.com/dashpay/bitcore-node-dash)

[Dash Insight API]
(https://github.com/dashpay/insight-api-dash)

[Bitcoin command line arguments]
(https://en.bitcoin.it/wiki/Running_Bitcoin)

[Example bitcoin.conf]
(https://github.com/bitcoin/bitcoin/blob/master/contrib/debian/examples/bitcoin.conf)
