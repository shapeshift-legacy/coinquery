
# CoinQuery Bitcoin Gold Service
 
* The Bitcoin service processes client API requests such as transaction details and account transaction history.

* Production server:
[https://btg.redacted.example.com](https://btg.redacted.example.com)

## Development Environment

### Build and run 
`BTG/`  
* `make btg` - build the docker image  
* `make run` - run the service

### Docker image `coinquery/btg-insight`

1. [Bitcore](https://bitcore.io) - Suite of Bitcoin services created by Bitpay.  Includes a Bitcoin Node, Wallet Service, and Insight API service.  CoinQuery uses the Insight service combined with a third-party Bitcoin ABC node.

2. [Bitcoin Gold](https://github.com/satoshilabs/bitcoin-gold/releases/download/v0.15.0.1) - Bitcoin Gold full node.  Compiles to `bgoldd` daemon.

3. [Insight API](https://github.com/bitpay/insight-api) - Bitcore block explorer service.  Requires that the following [RPC endpoints](https://bitcore.io/guides/bitcoin/#new-rpc-methods-and-updates) be available from Bitcoin ABC

### Block Diagram

```
+---------------------------------------------------------+
|   Docker: coinquery/btg-insight                             |
|                                                         |
|  --------------------------------------------------+    |
|  | Bitcore-node                                    |    |
|  |                                                 |    |
|  |   +---------------+        +---------------+    |    |
|  |   |               |        |               |    |    |   HTTP
|  |   | Bitcoin Gold  |  RPC   |  Insight API  |    |    |
|  |   | (bgoldd)      +--------+    service    +----------------+
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

`BTG/test/`  
* `make build` - build the test fixture docker image  
* `make deps` - install dependencies in the test fixture  

### Test
 
`BTG/test/`  
* `make test-dev` - tests against locally running service [http://localhost:3001](http://localhost:3001)  
* `make test-stage` - test against [btg-stage.redacted.example.com](https://btg-stage.redacted.example.com)  
* `make test-prod` - test against [btg.redacted.example.com](https://btg.redacted.example.com)   
* `make tests-that-spend` - tests that send real BTG transactions via the CoinQuery service


## Other Bitcoin block explorers

[BTG Explorer Insight](https://btgexplorer.com/)

[Trezor Insight](https://btg-bitcore2.trezor.io/)

## References

[Bitcoin Gold](https://bitcoingold.org/)

[Bitcoin Gold github](https://github.com/BTCGPU/BTCGPU)

[Bitcoin Gold address converter](https://ledgerhq.github.io/btg-convert/)

[Bitcoin Gold Insight fork - Digital Asset Data](https://git@github.com/digital-assets-data/bitcore-node-btg)

[Bitpay Insight API](https://github.com/bitpay/insight-api)

[Bitcoin command line arguments](https://en.bitcoin.it/wiki/Running_Bitcoin)

[Example bitcoin.conf](https://github.com/bitcoin/bitcoin/blob/master/contrib/debian/examples/bitcoin.conf)