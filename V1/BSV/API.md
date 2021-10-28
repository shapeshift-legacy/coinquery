# CoinQuery Bitcoin Cash API

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

2) Endpoints are compatible with [Insight API](https://github.com/bitpay/insight-api/blob/master/README.md) unless otherwise noted.

3) CoinQuery API requests must use legacy Bitcoin address format.  A [new address format](https://support.exodus.io/article/235-how-to-convert-bch-cash-address-to-legacy-address) was introduced with Bitcoin Cash that is backward compatible with legacy Bitcoin addresses.  However this format is not supported by CoinQuery at this time.

#### Example Address

* Legacy format: `1DtZRvwzYEBijBqqkQbYVXGeFxtvCRU8RU`  
* BCH format: `qzxkrjm9ts6mjqv64asysyhv7nkgk0jdl5zun7we9p`  
* Address converter [here](https://cashaddr.bitcoincash.org/)  


### Blockchain Status

Request:  
`{ROOT}/api/status`

Example response:  
```
{
  "info": {
    "version": 160000,
    "protocolversion": 70015,
    "blocks": 528311,
    "timeoffset": 0,
    "connections": 8,
    "proxy": "",
    "difficulty": 548567188865.9665,
    "testnet": false,
    "relayfee": 0.00001,
    "errors": "",
    "network": "livenet"
  }
}
```

### Node Sync Status
Get the sync status of the node  (note, goes through the loadbalanceer, need to specify node for accurate details).
  
Request:  
`{ROOT}/api/sync`  

Example Response (syncing):  
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

Example response (fully synced):  
```
{
  "status": "finished",
  "blockChainHeight": 528310,
  "syncPercentage": 100,
  "height": 528310,
  "error": null,
  "type": "bitcore node"
}
```

### Transaction Info
Get details of a transaction:

Request:  
`{ROOT}/api/tx/{txid}`

Example Request:   
`{ROOT}/api/tx/bc15f9dcbe637c187bb94247057b14637316613630126fc396c22e08b89006ea`

Example Response:  
```
{
  "txid": "bc15f9dcbe637c187bb94247057b14637316613630126fc396c22e08b89006ea",
  "version": 1,
  "locktime": 0,
  "vin": [
    {
      "coinbase": "04ffff001d016a",
      "sequence": 4294967295,
      "n": 0
    }
  ],
  "vout": [
    {
      "value": "50.00000000",
      "n": 0,
      "scriptPubKey": {
        "hex": "41043d44d78421a180a22042e60da571124100de0fa09534279ae8599abf8e46207a9d64330b27c3a3e9736ab6f3c88e6c18c2386966dc3845c7b22178557e86baf7ac",
        "asm": "043d44d78421a180a22042e60da571124100de0fa09534279ae8599abf8e46207a9d64330b27c3a3e9736ab6f3c88e6c18c2386966dc3845c7b22178557e86baf7 OP_CHECKSIG",
        "addresses": [
          "1Pi8agZKamjLJxfeGRUpGWGQimb8N21Hig "
        ],
        "type": "pubkeyhash"
      },
      "spentTxId": null,
      "spentIndex": null,
      "spentHeight": null
    }
  ],
  "blockhash": "0000000062b69e4a2c3312a5782d7798b0711e9ebac065cd5d19f946439f8609",
  "blockheight": 300,
  "confirmations": 528011,
  "time": 1231832435,
  "blocktime": 1231832435,
  "isCoinBase": true,
  "valueOut": 50,
  "size": 134
}
```

### Transaction History for Multiple Addresses
Get transaction history for a list of addresses.  Returns an array of transactions.

Request:  
`{ROOT}/api/addrs/{ADDR1, ADDR2 ... ADDRN}/txs?from={FROM}&to={TO}`  
* Where `{ADDR1, ADDR2 ... ADDRN}` are [BitcoinCash addresses](https://www.bitcoinabc.org/cashaddr)  
* Where `{FROM}` and `{TO}` are optional start and end index of the transaction array (min 0, max 50)

Example:
`{ROOT}/api/addrs/1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu/txs?from=0&to=1`

Example Response:  
```

{
  "totalItems": 6,
  "from": 0,
  "to": 1,
  "items": [
    {
      "txid": "841b5e10604f6f0774078af1c1b634236cf3f7c5c0073a6ca25320f74d92ce9d",
      "version": 1,
      "locktime": 0,
      "vin": [
        {
          "txid": "0d7ba537e854bfb9206d1d7fb20f26dcdaa7a8d36c88c2bf8d1a86a3b64680b4",
          "vout": 0,
          "sequence": 4294967295,
          "n": 0,
          "scriptSig": {
            "hex": "473044022027d4389e0cc928785df80dc1e594f7de968f92ebddea0c12b75091243e21248d022037bd529b91938d25916d13d076a67dd3ce9ffaca8aab91bf8e2bf6d4d1345a57412102fa8143bb0e7c548c87b4f71f0d43f84f855ccb3880df79223e074170e504b424",
            "asm": "3044022027d4389e0cc928785df80dc1e594f7de968f92ebddea0c12b75091243e21248d022037bd529b91938d25916d13d076a67dd3ce9ffaca8aab91bf8e2bf6d4d1345a57[ALL|FORKID] 02fa8143bb0e7c548c87b4f71f0d43f84f855ccb3880df79223e074170e504b424"
          },
          "addr": "1FRpGA7W3LBhdaE1ArJD6iXZ2wBA8UuSQY ",
          "valueSat": 10267507,
          "value": 0.10267507,
          "doubleSpentTxID": null
        }
      ],
      "vout": [
        {
          "value": "0.01224300",
          "n": 0,
          "scriptPubKey": {
            "hex": "76a914d98ef58efcb0ad36aee99101e1d1ee4e9c11f63888ac",
            "asm": "OP_DUP OP_HASH160 d98ef58efcb0ad36aee99101e1d1ee4e9c11f638 OP_EQUALVERIFY OP_CHECKSIG",
            "addresses": [
              "1LqLtcEVz9Vcv8sjkxTX4t3iVQGpZ2Yyhj "
            ],
            "type": "pubkeyhash"
          },
          "spentTxId": null,
          "spentIndex": null,
          "spentHeight": null
        },
        {
          "value": "0.09038322",
          "n": 1,
          "scriptPubKey": {
            "hex": "76a91476a04053bda0a88bda5177b86a15c3b29f55987388ac",
            "asm": "OP_DUP OP_HASH160 76a04053bda0a88bda5177b86a15c3b29f559873 OP_EQUALVERIFY OP_CHECKSIG",
            "addresses": [
              "1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu "
            ],
            "type": "pubkeyhash"
          },
          "spentTxId": null,
          "spentIndex": null,
          "spentHeight": null
        }
      ],
      "blockhash": "000000000000000000035af618ccb3b4ca2de40101cff8c4427bb01e2fac99fb",
      "blockheight": 524181,
      "confirmations": 4132,
      "time": 1522724332,
      "blocktime": 1522724332,
      "valueOut": 0.10262622,
      "size": 225,
      "valueIn": 0.10267507,
      "fees": 0.00004885
    }
  ]
}
```

### Transaction Broadcast 

Send a signed transaction

POST Request:  
`{ROOT}/api/tx/send/` 
 
* Where parameter `{RAWTX}` is a JSON object with a signed transaction as a hex string
```
{
"rawtx": "{RAWTX}"
}
```

Example Params:
```
{
"rawtx": "01000000017b1eabe0209b1fe794124575ef807057c77ada2138ae4fa8d6c4de0398a14f3f00000000494830450221008949f0cb400094ad2b5eb399d59d01c14d73d8fe6e96df1a7150deb388ab8935022079656090d7f6bac4c9a94e0aad311a4268e082a725f8aeae0573fb12ff866a5f01ffffffff01f0ca052a010000001976a914cbc20a7664f2f69e5355aa427045bc15e7c6c77288ac00000000"
}
```

Example Response:  
```
{
    txid: "c7736a0a0046d5a8cc61c8c3c2821d4d7517f5de2bc66a966011aaa79965ffba"
}
```