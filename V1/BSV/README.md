# CoinQuery Bitcoin Cash Service
 
* The Bitcoin Cash service processes client API requests such as transaction details and account transaction history.

* Production server:
[https://bch.redacted.example.com](https://bch.redacted.example.com)

## Development Environment

### Build and run 
`BCH/`  
* `make bch` - build the docker image  
* `make run` - run the service  

Other make targets:  
`BCH/`  
* `make shell` - start docker container with interactive shell  
* `make shell-attach` -- attach to already running container  


### Docker image `coinquery/bch-insight`

1. [Bitcore](https://bitcore.io) - Suite of Bitcoin services created by Bitpay.  Includes a Bitcoin Node, Wallet Service, and Insight API service.  CoinQuery uses the Insight service combined with a third-party Bitcoin ABC node.

2. [Bitcoin ABC - Bitprim fork](https://github.com/bitprim/bitcoin-abc/) - Bitcoin Cash full node.  Compiles to `bitcoind` daemon.

3. [Insight API](https://github.com/bitpay/insight-api) - Bitcore block explorer service.  Requires that the following [RPC endpoints](https://bitcore.io/guides/bitcoin/#new-rpc-methods-and-updates) be available from Bitcoin ABC

### Block Diagram

```
+---------------------------------------------------------+
|   Docker: coinquery/bch-insight                         |
|                                                         |
|  --------------------------------------------------+    |
|  | Bitcore-node                                    |    |
|  |                                                 |    |
|  |   +---------------+        +---------------+    |    |
|  |   |               |        |               |    |    |   HTTP
|  |   | Bitcoin ABC   |  RPC   |  Insight API  |    |    |
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

`BCH/test/`   
* `make deps` - install dependencies in the test fixture  

### Test
 
`BCH/test/`  
* `make test-dev` - tests against locally running service [http://localhost:3001](http://localhost:3001)  
* `make test-stage` - test against [bch-stage.redacted.example.com](https://bch-stage.redacted.example.com)  
* `make test-prod` - test against [bch.redacted.example.com](https://bch.redacted.example.com)   
* `make tests-that-spend` - tests that send real BCH transactions via the CoinQuery service


## Other Bitcoin Cash block explorers
[BlockDozer]
(https://blockdozer.com)  

[Bitpay Insight]
(https://bch-insight.bitpay.com)  

[Bitcoin.com]
(https://explorer.bitcoin.com/bch)  

## References

[Bitcore Node]
(https://bitcore.io/guides/bitcoin/#new-rpc-methods-and-updates)

[Bitpay Insight API]
(https://github.com/bitpay/insight-api)

[BitcoinABC official Github repo]
(https://github.com/Bitcoin-ABC/bitcoin-abc)

[Bitcoin command line arguments]
(https://en.bitcoin.it/wiki/Running_Bitcoin)

[Example bitcoin.conf]
(https://github.com/bitcoin/bitcoin/blob/master/contrib/debian/examples/bitcoin.conf)

[BCH / BTC address conversion]
(https://support.exodus.io/article/235-how-to-convert-bch-cash-address-to-legacy-address)
