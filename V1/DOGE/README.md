
![shades](IMG_0094a.jpg)
# CoinQuery Dogecoin Service

* The Dogecoin service processes client API requests such as transaction details and account transaction history.

* Production server:
[https://doge.redacted.example.com](https://doge.redacted.example.com)

## Development Environment

### Build and run
`DOGE/`
* `make doge` - build the docker image
* `make run` - run the service

### Docker image `coinquery/doge-insight`

1. [Dogecoin Core](https://github.com/dogecoin) - Dogecoin full node.  Compiles to `dogecoind` daemon.

2. [Insight API](https://github.com/blockrange/insight-api-dogecoin) - Insight block explorer service.  Note: this is an old version of insight as compared to other coinquery services

### Block Diagram

```
+---------------------------------------------------------+
|   Docker: coinquery/doge-insight                        |
|                                                         |
|  --------------------------------------------------+    |
|  | Bitcore-node                                    |    |
|  |                                                 |    |
|  |   +---------------+        +---------------+    |    |
|  |   |               |        |               |    |    |   HTTP
|  |   |   Dogecoin.   |  RPC   |  Insight API  |    |    |
|  |   | (dogecoind)    +-------+    service    +----------------+
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

`DOGE/test/`
* `make build` - build the test fixture docker image
* `make deps` - install dependencies in the test fixture

### Test

`DOGE/test/`
* `make test-dev` - tests against locally running service [http://localhost:3100](http://localhost:3100)
* `make test-stage` - test against [doge-stage.redacted.example.com](https://doge-stage.redacted.example.com)
* `make test-prod` - test against [doge.redacted.example.com](https://doge.redacted.example.com)


## Other Dogecoin block explorers
[Dogechain.info]
(https://dogechain.info)

[Blockcypher]
(https://live.blockcypher.com/doge)

