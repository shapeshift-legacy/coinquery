
# CoinQuery Zcash Service
 
* The Zcash service processes client API requests such as transaction details and account transaction history.

* Production server:
[https://zec.redacted.example.com](https://zec.redacted.example.com)

## Development Environment

### Build and run 
`ZEC/`  
* `make zec` - build the docker image  
* `make run` - run the service  

Other make targets:  
`ZEC/`  
* `make shell-zec` - start docker container with interactive shell  
* `make shell-attach-zec` - attach to already running container  


### Docker image `coinquery/zcash`

1. [Bitcore](https://bitcore.io) - Suite of Bitcoin services created by Bitpay.  Includes a Bitcoin Node, Wallet Service, and Insight API service.  CoinQuery uses the Insight service combined with a third-party Zcash node.

2. [Zcash](https://github.com/str4d/zcash) - Zcash full node.  Compiles to `zcashd` daemon.

3. [Insight API - BitMEX fork](https://github.com/BitMEX/zcash-insight-api) - Bitcore block explorer service.  Requires that the following [RPC endpoints](https://bitcore.io/guides/bitcoin/#new-rpc-methods-and-updates) be available from Zcash

### Block Diagram

```
+---------------------------------------------------------+
|   Docker: coinquery/zcashd                             |
|                                                         |
|  --------------------------------------------------+    |
|  | Bitcore-node                                    |    |
|  |                                                 |    |
|  |   +---------------+        +---------------+    |    |
|  |   |               |        |               |    |    |   HTTP
|  |   |   Zcash       |  RPC   |  Insight API  |    |    |
|  |   |  (zcashd)     +--------+    service    +----------------+
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

`ZEC/test/`  
* `make deps` - install dependencies in the test fixture  

### Test
 
`ZEC/test/`  
* `make test-dev` - tests against locally running service [http://localhost:3001](http://localhost:3001)  
* `make test-stage` - test against [zec-stage.redacted.example.com](https://zec-stage.redacted.example.com)  
* `make test-prod` - test against [zec.redacted.example.com](https://zec.redacted.example.com)  


## Other Bitcoin Cash block explorers
[Zcash Block Explorer]
(https://zcash.blockexplorer.com/)  

## References
