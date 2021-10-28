
# CoinQuery ZCash API

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
`{ROOT} = https://zec.redacted.example.com/`

2) Endpoints are compatible with [Insight API](https://github.com/str4d/insight-api-zcash/blob/master/README.md) unless otherwise noted.

3) CoinQuery API supports "t" addresses, but not "z" addresses

* Zcash is built upon and extends the Bitcoin protocol. Addresses which start with "t" behave exactly like Bitcoin, including their globally public properties and we refer to these as "transparent addresses". Addresses which start with "z" include the privacy enhancements provided by zero-knowledge proofs and we refer to these as "shielded addresses". It is possible to send ZEC between these two address types.  The [difference between t and z addresses]
(https://z.cash/support/faq.html#difference-between-t-and-z-addrs)


### Blockchain Status

Request:  
`{ROOT}/api/status`

Example response:  

```
{
  "info": {
    "version": 1001550,
    "protocolversion": 170003,
    "blocks": 323308,
    "timeoffset": -5,
    "connections": 8,
    "proxy": "",
    "difficulty": 10186751.13666759,
    "testnet": false,
    "relayfee": 0.000001,
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
  "blockChainHeight": 323332,
  "syncPercentage": 100,
  "height": 323332,
  "error": null,
  "type": "bitcore node"
}
```

### Transaction Info
Get details of a transaction:

Request:  
`{ROOT}/api/tx/{txid}`

Example Request:   
`{ROOT}/api/tx/208c210272cf3668e96795bd288ade9ac6446a75c4ae15550e9ee64a42a4d554 `

Example Response:  

```
{
  "txid": "208c210272cf3668e96795bd288ade9ac6446a75c4ae15550e9ee64a42a4d554",
  "version": 1,
  "locktime": 0,
  "vin": [
    {
      "txid": "89bd3f3dd7b9ef6911d89a0b22f20a3d618f22fc341b3fc824dc53fac7b7c5c0",
      "vout": 0,
      "sequence": 4294967295,
      "n": 0,
      "scriptSig": {
        "hex": "483045022100e89ddd976526bc7a574ba94024a88c57558e8ca3a88540fc3f4c506a2b71365c02203ab8f072649e40a0babf8d6d946cf5468212f7b4ac9d8c1d0a3021108ac110b2012102a4a121c09a827a189720c05c8985d4aa1ce4c7bf4cd9703b879ef4d8a6f486ab",
        "asm": "3045022100e89ddd976526bc7a574ba94024a88c57558e8ca3a88540fc3f4c506a2b71365c02203ab8f072649e40a0babf8d6d946cf5468212f7b4ac9d8c1d0a3021108ac110b201 02a4a121c09a827a189720c05c8985d4aa1ce4c7bf4cd9703b879ef4d8a6f486ab"
      },
      "addr": "t1fzwNKU6MSff6jye2X2gxtAhk52p4uU7xF",
      "valueSat": 3698977,
      "value": 0.03698977,
      "doubleSpentTxID": null
    },
    {
      "txid": "40a4b9c6cf5615c28d69097c6f1d5ba3225c3432275857393f119d7f75288e35",
      "vout": 147,
      "sequence": 4294967295,
      "n": 1,
      "scriptSig": {
        "hex": "473044022067e8e85ebd0d4e01f7fde336121847f7f3c9f078ec84f5c5da03139937169c6c0220117d09dd84f51471c56cddd1386b80547dae4d84f3482937aea159fcc549652b012102a4a121c09a827a189720c05c8985d4aa1ce4c7bf4cd9703b879ef4d8a6f486ab",
        "asm": "3044022067e8e85ebd0d4e01f7fde336121847f7f3c9f078ec84f5c5da03139937169c6c0220117d09dd84f51471c56cddd1386b80547dae4d84f3482937aea159fcc549652b01 02a4a121c09a827a189720c05c8985d4aa1ce4c7bf4cd9703b879ef4d8a6f486ab"
      },
      "addr": "t1fzwNKU6MSff6jye2X2gxtAhk52p4uU7xF",
      "valueSat": 8362185,
      "value": 0.08362185,
      "doubleSpentTxID": null
    }
  ],
  "vout": [
    {
      "value": "0.12055162",
      "n": 0,
      "scriptPubKey": {
        "hex": "76a91415e14c4c87cd9f27c06ab6ab0000ea39dcfca38a88ac",
        "asm": "OP_DUP OP_HASH160 15e14c4c87cd9f27c06ab6ab0000ea39dcfca38a OP_EQUALVERIFY OP_CHECKSIG",
        "addresses": [
          "t1KsJ6M3kKJopTS2sbKrY9oX3fvy7WyWBLM"
        ],
        "type": "pubkeyhash"
      },
      "spentTxId": "2d0d23c7707d07ec72b206ce86a7a9956e76e4fc84fe92173fe31ebc0de84776",
      "spentIndex": 0,
      "spentHeight": 10016
    }
  ],
  "blockhash": "00000000d9c69beb1860a1e952d1c9800867a4f18a6012ca32117ccd9b772893",
  "blockheight": 9961,
  "confirmations": 313353,
  "time": 1479090845,
  "blocktime": 1479090845,
  "valueOut": 0.12055162,
  "size": 339,
  "valueIn": 0.12061162,
  "fees": 0.00006
}
```

### Transaction History for Multiple Addresses
Get transaction history for a list of addresses.  Returns an array of transactions.

Request:  
`{ROOT}/api/addrs/{ADDR1, ADDR2 ... ADDRN}/txs?from={FROM}&to={TO}`  

* Where `{ADDR1, ADDR2 ... ADDRN}` are Zcash addresses]  
* Where `{FROM}` and `{TO}` are optional start and end index of the transaction array

Example:  
`{ROOT}/api/addrs/t1ZVfakn7outDdcTgZW4CKEjihiBnZb4jLV/txs?from=0&to=1`

Example Response:  

```
{
  "totalItems": 2,
  "from": 0,
  "to": 2,
  "items": [
    {
      "txid": "2d0d23c7707d07ec72b206ce86a7a9956e76e4fc84fe92173fe31ebc0de84776",
      "version": 1,
      "locktime": 10003,
      "vin": [
        {
          "txid": "208c210272cf3668e96795bd288ade9ac6446a75c4ae15550e9ee64a42a4d554",
          "vout": 0,
          "sequence": 4294967294,
          "n": 0,
          "scriptSig": {
            "hex": "47304402202b4eeaad4737d30e94ac452425b55e0512af3e0c97869ee56f10033cbcf80eb9022044ebb7956ad4b9c085d241f877412715c4595a4da96270b4429742c73ebe5d6a0121028f65828c09358392513997e84454d8acdac2ba2d1dc3ec13a57678beaefdca6d",
            "asm": "304402202b4eeaad4737d30e94ac452425b55e0512af3e0c97869ee56f10033cbcf80eb9022044ebb7956ad4b9c085d241f877412715c4595a4da96270b4429742c73ebe5d6a01 028f65828c09358392513997e84454d8acdac2ba2d1dc3ec13a57678beaefdca6d"
          },
          "addr": "t1KsJ6M3kKJopTS2sbKrY9oX3fvy7WyWBLM",
          "valueSat": 12055162,
          "value": 0.12055162,
          "doubleSpentTxID": null
        },
        {
          "txid": "e08b7a3902cf026e901c0e07cc82dbf6965d2732f2de7a942fff0023f9833006",
          "vout": 142,
          "sequence": 4294967294,
          "n": 1,
          "scriptSig": {
            "hex": "483045022100c6488bacfafce1471ef0dbd1e1c52bed7ef592dfa12d4a867695e8695c58bced02203bdd2bde52ad00d033ce83dea2a3354342567509981d59b6c5217fac4d0c6ec80121039e15191feaefa90d949db71992e9cba56728ba8a100083815cb4ab43b3f46649",
            "asm": "3045022100c6488bacfafce1471ef0dbd1e1c52bed7ef592dfa12d4a867695e8695c58bced02203bdd2bde52ad00d033ce83dea2a3354342567509981d59b6c5217fac4d0c6ec801 039e15191feaefa90d949db71992e9cba56728ba8a100083815cb4ab43b3f46649"
          },
          "addr": "t1dzTY7xhxfjbLs5PC3r31VAFmZo69bi2tS",
          "valueSat": 1030179,
          "value": 0.01030179,
          "doubleSpentTxID": null
        },
        {
          "txid": "773a069808727a8b75b65b0f03de9cb5d95627a281cd21071ecdd2e01afcc8cf",
          "vout": 1,
          "sequence": 4294967294,
          "n": 2,
          "scriptSig": {
            "hex": "4830450221009c60a52ddb6330d0a27743d48d4fded91ab0c3824f070cd5b593a6c7f26df469022071b6310ca951f78e09e8dcc324e137a437b378be42c4001b7f2527e9b375b1f0012102c09620c915e5b25fb55795aa377a31869c63a81ffb2ad60dd763dfced4f0401c",
            "asm": "30450221009c60a52ddb6330d0a27743d48d4fded91ab0c3824f070cd5b593a6c7f26df469022071b6310ca951f78e09e8dcc324e137a437b378be42c4001b7f2527e9b375b1f001 02c09620c915e5b25fb55795aa377a31869c63a81ffb2ad60dd763dfced4f0401c"
          },
          "addr": "t1JUVjhD3TYGy9aFvN5WJLz4rmy9X6rb2yf",
          "valueSat": 22900000,
          "value": 0.229,
          "doubleSpentTxID": null
        },
        {
          "txid": "90092b6fae7840282d55984047c58c3e962b3bfcfe4e958f828a081f605bc626",
          "vout": 1,
          "sequence": 4294967294,
          "n": 3,
          "scriptSig": {
            "hex": "473044022003623895da90a2a4bd382bcff0fea168002b87a2130fbc90affe6bac406eedd202205589bc6aa6fbc79686a0d8f5358a92671d1fa6ad07baa8015644f703bd7f283101210363e288964b409ff615782712ddd88a8baa7692af707c76a91454934f55127870",
            "asm": "3044022003623895da90a2a4bd382bcff0fea168002b87a2130fbc90affe6bac406eedd202205589bc6aa6fbc79686a0d8f5358a92671d1fa6ad07baa8015644f703bd7f283101 0363e288964b409ff615782712ddd88a8baa7692af707c76a91454934f55127870"
          },
          "addr": "t1ZVfakn7outDdcTgZW4CKEjihiBnZb4jLV",
          "valueSat": 5477244,
          "value": 0.05477244,
          "doubleSpentTxID": null
        }
      ],
      "vout": [
        {
          "value": "0.40458730",
          "n": 0,
          "scriptPubKey": {
            "hex": "76a914fa014ab7689ecbffd641042b2a6d84680d33c75f88ac",
            "asm": "OP_DUP OP_HASH160 fa014ab7689ecbffd641042b2a6d84680d33c75f OP_EQUALVERIFY OP_CHECKSIG",
            "addresses": [
              "t1gfWV43SPDAx4pi2wy7G79DpknyKeeK31s"
            ],
            "type": "pubkeyhash"
          },
          "spentTxId": "221bbe5deed2d4d16d9095a26b026d445bb5330e49e2bd6e08f8ad51689cea0d",
          "spentIndex": 3,
          "spentHeight": 14094
        },
        {
          "value": "0.01000417",
          "n": 1,
          "scriptPubKey": {
            "hex": "76a914d4185bc7d735b4cd852214f56de44e15ec9faa3a88ac",
            "asm": "OP_DUP OP_HASH160 d4185bc7d735b4cd852214f56de44e15ec9faa3a OP_EQUALVERIFY OP_CHECKSIG",
            "addresses": [
              "t1dD4STpEdDDYg7SYsnZgPsz6SU2PcD1mou"
            ],
            "type": "pubkeyhash"
          },
          "spentTxId": "249a6d4c2aab5f015853f7b4e7574ceab43e0695dab8a7e553143a23ef572448",
          "spentIndex": 44,
          "spentHeight": 11035
        }
      ],
      "blockhash": "00000000f25f468addb906b32b14a7c2ddf8255ea6a898c90491cb9d0b5e847c",
      "blockheight": 10016,
      "confirmations": 313320,
      "time": 1479100117,
      "blocktime": 1479100117,
      "valueOut": 0.41459147,
      "size": 668,
      "valueIn": 0.41462585,
      "fees": 0.00003438
    },
    {
      "txid": "90092b6fae7840282d55984047c58c3e962b3bfcfe4e958f828a081f605bc626",
      "version": 1,
      "locktime": 0,
      "vin": [
        {
          "txid": "f61b43b0ff448b5461d857f4ec78ab0e81787ba58a514a8b4107868dc13f0d92",
          "vout": 176,
          "sequence": 4294967295,
          "n": 0,
          "scriptSig": {
            "hex": "47304402207815fac97bf6a1d4b3a10a8e3b7cd81d00b5f1c109c92fb1c4fb609b22f4676a02202664b370a5093908b6abb209e42d91cc2ed82ac29a2615fd04576a36f9cafb160121032540f40d50a34d1f56d4a8da114dbc3e8cc3c36338efc67c3b64952e957eac38",
            "asm": "304402207815fac97bf6a1d4b3a10a8e3b7cd81d00b5f1c109c92fb1c4fb609b22f4676a02202664b370a5093908b6abb209e42d91cc2ed82ac29a2615fd04576a36f9cafb1601 032540f40d50a34d1f56d4a8da114dbc3e8cc3c36338efc67c3b64952e957eac38"
          },
          "addr": "t1KtAqx2q3hnbm5krv7y6FY8eJRU9iqAQQz",
          "valueSat": 10336460,
          "value": 0.1033646,
          "doubleSpentTxID": null
        }
      ],
      "vout": [
        {
          "value": "0.04849216",
          "n": 0,
          "scriptPubKey": {
            "hex": "76a91407db150eacaee6a92a77b23636f9312f335323f088ac",
            "asm": "OP_DUP OP_HASH160 07db150eacaee6a92a77b23636f9312f335323f0 OP_EQUALVERIFY OP_CHECKSIG",
            "addresses": [
              "t1Jb9BnDKccr2N8ryQ5zdWrAmkNT9eVKFAX"
            ],
            "type": "pubkeyhash"
          },
          "spentTxId": "0feefd44aadbc30b856f7ef6c11d6b5d89ce9aa35692298b16f0093f6357fae5",
          "spentIndex": 12,
          "spentHeight": 10078
        },
        {
          "value": "0.05477244",
          "n": 1,
          "scriptPubKey": {
            "hex": "76a914ab5bd8bdf7e115ad879bd1962617695b1b0e136088ac",
            "asm": "OP_DUP OP_HASH160 ab5bd8bdf7e115ad879bd1962617695b1b0e1360 OP_EQUALVERIFY OP_CHECKSIG",
            "addresses": [
              "t1ZVfakn7outDdcTgZW4CKEjihiBnZb4jLV"
            ],
            "type": "pubkeyhash"
          },
          "spentTxId": "2d0d23c7707d07ec72b206ce86a7a9956e76e4fc84fe92173fe31ebc0de84776",
          "spentIndex": 3,
          "spentHeight": 10016
        }
      ],
      "blockhash": "000000002c2063bab0acae547bab7e0309db8e1b7003e9c01eb423c0166d5ac9",
      "blockheight": 10000,
      "confirmations": 313336,
      "time": 1479096667,
      "blocktime": 1479096667,
      "valueOut": 0.1032646,
      "size": 225,
      "valueIn": 0.1033646,
      "fees": 0.0001
    }
  ]
}
```

### Transaction Broadcast 

Send a signed transaction

* POST Request:  
`{ROOT}/api/tx/send/` 
 
 * Where POST request includes parameter `{RAWTX}` is a JSON object with a signed transaction as a hex string  

```
{
"rawtx": "{RAWTX}"
}
```

* Example Params:  

```
{
"rawtx": ""
}
```

* Example Response:  

```
{
    txid: ""
}
```


### Examples from third party block explorer - for reference only

Block  
[https://zcash.blockexplorer.com/block/000000002c2063bab0acae547bab7e0309db8e1b7003e9c01eb423c0166d5ac9](https://zcash.blockexplorer.com/block/000000002c2063bab0acae547bab7e0309db8e1b7003e9c01eb423c0166d5ac9)

Transaction info  
[https://zcash.blockexplorer.com/tx/2a03a4110c62047af28a44ab78ec9af9d020c9b8128051b46d89c22cd34777d5](https://zcash.blockexplorer.com/tx/2a03a4110c62047af28a44ab78ec9af9d020c9b8128051b46d89c22cd34777d5)

Transaction history  
[https://zcash.blockexplorer.com/address/t1KHa9CJeCy3b9rUX2BhqkFJXSxSSrhM7LJ](https://zcash.blockexplorer.com/address/t1KHa9CJeCy3b9rUX2BhqkFJXSxSSrhM7LJ)