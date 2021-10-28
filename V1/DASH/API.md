# CoinQuery BitCoin Cash API

The following endpoints are available.

Server status
* `/status`
* `/sync`

Transactions
* `/tx/${hash}`
* `/addrs/${addresses}/txs?from=${from}&to=${to}`
* `/tx/send`

### Notes

1) CoinQuery host:
`{ROOT} = https://bch.redacted.example.com/`

2) Endpoints are compatible with [Insight API](https://github.com/bitpay/insight-api/README.md) unless otherwise noted.

### Blockchain Status

Request:
`{ROOT}/api/status?q={QEURY}`

Where {QUERY} is:  <===== should we support these sub commands?  or just `/status`?
* `getInfo`
* `getDifficulty`
* `getBestBlockHash`
* `getLastBlockHash`

Example response:
```
{
  "info": {
    "version": 120100,
    "protocolversion": 70012,
    "blocks": 518523,
    "timeoffset": -3,
    "connections": 8,
    "proxy": "",
    "difficulty": 3839316899029.672,
    "testnet": false,
    "relayfee": 0.00001,
    "errors": "Warning: unknown new rules activated (versionbit 1)",
    "network": "livenet"
  }
}
```

### Node Sync Status
Get the sync status of the node  (note, goes thru the loadbalanceer, need to specify node for accurate details).

Request:
`{ROOT}/api/sync`

Example Response:
```
{
  "status": "syncing",
  "blockChainHeight": 200210,
  "syncPercentage": 2,
  "height": 200210,
  "error": null,
  "type": "bitcore node"
}
```

### Transaction Info
Get details of a transaction:

Request:
`{ROOT}/api/tx/{txid}`

Example Request:
`{ROOT}/api/tx/tx/13150289fab32cdd2744958b6eca455df058ea1605471fd5d9102cbd1fa10d20`  <====note: not a valid bch txid>

Response:
```
{
  "txid": "13150289fab32cdd2744958b6eca455df058ea1605471fd5d9102cbd1fa10d20",
  "version": 2,
  "locktime": 518477,
  "vin": [
    {
      "txid": "1969d80b56e13bd11bb47fc32fbb2166b16d18ce2eea658e727997e5c60dc15f",
      "vout": 1,
      "sequence": 4294967294,
      "n": 0,
      "scriptSig": {
        "hex": "1600149a571aa71e331e0c41e424411c8a0329530e35b8",
        "asm": "00149a571aa71e331e0c41e424411c8a0329530e35b8"
      },
      "addr": "3FV5rYR5TeirtSbFd6htnJhzn3WyqjWX3e ",
      "valueSat": 97183691,
      "value": 0.97183691,
      "doubleSpentTxID": null
    }
  ],
  "vout": [
    {
      "value": "0.00900000",
      "n": 0,
      "scriptPubKey": {
        "hex": "76a9148095931ca42b92f6b3012b49439412d109d4214088ac",
        "asm": "OP_DUP OP_HASH160 8095931ca42b92f6b3012b49439412d109d42140 OP_EQUALVERIFY OP_CHECKSIG",
        "addresses": [
          "1CitgBeYBjCSWEz4X2YM9JZQ19xhDWTjUs "
        ],
        "type": "pubkeyhash"
      },
      "spentTxId": null,
      "spentIndex": null,
      "spentHeight": null
    },
    {
      "value": "0.96282640",
      "n": 1,
      "scriptPubKey": {
        "hex": "a91486012df42251ab8a3e83a3250bfbceb8fa48d8ed87",
        "asm": "OP_HASH160 86012df42251ab8a3e83a3250bfbceb8fa48d8ed OP_EQUAL",
        "addresses": [
          "3DuZtChiKgcmAU12XaSG8qzcLDV8o1WwKg "
        ],
        "type": "scripthash"
      },
      "spentTxId": null,
      "spentIndex": null,
      "spentHeight": null
    }
  ],
  "blockhash": "0000000000000000000c5c92b0a70adb2f165b9312b4c856f8f08fd338632fe7",
  "blockheight": 518527,
  "confirmations": 3,
  "time": 1523919784,
  "blocktime": 1523919784,
  "valueOut": 0.9718264,
  "size": 140,
  "valueIn": 0.97183691,
  "fees": 0.00001051
}
```

### Transaction History for Multiple Addresses
Get transaction history for a list of addresses.  Returns an array of transactions.

Request:
`{ROOT}/api/addrs/{ADDR1, ADDR2 ... ADDRN}/txs?from={FROM}&to={TO}`
* Where {ADDR1, ADDR2 ... ADDRN} are [BitcoinCash addresses](https://www.bitcoinabc.org/cashaddr)
* Where {FROM} and {TO} are -OPTIONAL- start and end index of the transaction array

Example:
`{ROOT}/api/addrs/2NF2baYuJAkCKo5onjUKEPdARQkZ6SYyKd5,2NAre8sX2povnjy4aeiHKeEh97Qhn97tB1f/txs?from=0&to=20`

Example Response:
```
{ totalItems: 100,
  from: 0,
  to: 20,
  items:
    [ { txid: '3e81723d069b12983b2ef694c9782d32fca26cc978de744acbc32c3d3496e915',
       version: 1,
       locktime: 0,
       vin: [Object],
       vout: [Object],
       blockhash: '00000000011a135e5277f5493c52c66829792392632b8b65429cf07ad3c47a6c',
       confirmations: 109367,
       time: 1393659685,
       blocktime: 1393659685,
       valueOut: 0.3453,
       size: 225,
       firstSeenTs: undefined,
       valueIn: 0.3454,
       fees: 0.0001 },
      { ... },
      { ... },
      ...
      { ... }
    ]
 }
 ```

### Transaction Broadcast

Send a signed transaction

Request:
`{ROOT}/api/tx/send/{RAWTX}`
* Where `{RAWTX}` is a signed transaction as a hex string

Example Request:
```
{ROOT}/api/tx/send/ 01000000017b1eabe0209b1fe794124575ef807057c77ada2138ae4fa8d6c4de0398a14f3f00000000494830450221008949f0cb400094ad2b5eb399d59d01c14d73d8fe6e96df1a7150deb388ab8935022079656090d7f6bac4c9a94e0aad311a4268e082a725f8aeae0573fb12ff866a5f01ffffffff01f0ca052a010000001976a914cbc20a7664f2f69e5355aa427045bc15e7c6c77288ac00000000
```

Response:
```
{
    txid: "c7736a0a0046d5a8cc61c8c3c2821d4d7517f5de2bc66a966011aaa79965ffba"
}
```
