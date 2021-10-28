# CoinQuery Bitcoin Gold API

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
`{ROOT} = https://btg.redacted.example.com/`

2) Endpoints are compatible with [Insight API](https://github.com/bitpay/insight-api/blob/master/README.md) unless otherwise noted.

3) Address format:  
BTG mainnet address format is different than Bitcoin. Bitcoin Gold addresses start with "G" or "A".  
* Legacy format: `1DtZRvwzYEBijBqqkQbYVXGeFxtvCRU8RU`  
* BTG format: `GWjUr4GwX5o1of98gMFevHcYB8gmGCKQtE`  
* Address converter [here](https://sopaxorztaker.github.io/gold-address/)  

### Blockchain Status

Request:  
`{ROOT}/api/status`

Example response:  

```
{
  "info": {
    "version": 150001,
    "protocolversion": 70016,
    "blocks": 288,
    "timeoffset": -93,
    "connections": 8,
    "proxy": "",
    "difficulty": 1,
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
  "blockChainHeight": 282500,
  "syncPercentage": 10,
  "height": 282500,
  "error": null,
  "type": "bitcore node"
}
```

Example response (fully synced):  

```
{
  "status": "finished",
  "blockChainHeight": 530261,
  "syncPercentage": 100,
  "height": 530261,
  "error": null,
  "type": "bitcore node"
}
```

### Transaction Info
Get details of a transaction:

Request:  
`{ROOT}/api/tx/{txid}`

Example Request:   
`{ROOT}/api/tx/0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098`

Example Response:  

```
{
  "txid": "0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098",
  "version": 1,
  "locktime": 0,
  "vin": [
    {
      "coinbase": "04ffff001d0104",
      "sequence": 4294967295,
      "n": 0
    }
  ],
  "vout": [
    {
      "value": "50.00000000",
      "n": 0,
      "scriptPubKey": {
        "hex": "410496b538e853519c726a2c91e61ec11600ae1390813a627c66fb8be7947be63c52da7589379515d4e0a604f8141781e62294721166bf621e73a82cbf2342c858eeac",
        "asm": "0496b538e853519c726a2c91e61ec11600ae1390813a627c66fb8be7947be63c52da7589379515d4e0a604f8141781e62294721166bf621e73a82cbf2342c858ee OP_CHECKSIG",
        "addresses": [
          "GKT1da3R3HSLTXsFvez5RcfyFw92rbi11r"
        ],
        "type": "pubkeyhash"
      },
      "spentTxId": null,
      "spentIndex": null,
      "spentHeight": null
    }
  ],
  "blockhash": "00000000839a8e6886ab5951d76f411475428afc90947ee320161bbf18eb6048",
  "blockheight": 1,
  "confirmations": 530770,
  "time": 1231469665,
  "blocktime": 1231469665,
  "isCoinBase": true,
  "valueOut": 50,
  "size": 134
}
```

### Transaction History for Multiple Addresses
Get transaction history for a list of addresses.  Returns an array of transactions.

Request:  
`{ROOT}/api/addrs/{ADDR1, ADDR2 ... ADDRN}/txs?from={FROM}&to={TO}`  
* Where `{ADDR1, ADDR2 ... ADDRN}` are Bitcoin Gold addresses  
* Where `{FROM}` and `{TO}` are optional start and end index of the transaction array (min 0, max 50)

Example:
`{ROOT}/api/addrs/Gbg9Pj5ymN4XTKbDHvEn2CsRodXvYLZs6n/txs?from=0&to=1`

Example Response:  

```
{
  "totalItems": 2,
  "from": 0,
  "to": 1,
  "items": [
    {
      "txid": "5aa8e36f9423ee5fcf17c1d0d45d6988b8a5773eae8ad25d945bf34352040009",
      "version": 1,
      "locktime": 0,
      "vin": [
        {
          "txid": "791dca118db6358e66f15a5cafafe762f06ce909baee235685f03a0fefbe3382",
          "vout": 1,
          "sequence": 4294967295,
          "n": 0,
          "scriptSig": {
            "hex": "483045022100dcd443f70a1ca9246d1271842d4725db4b3f90d72690555a545bbeaf50f9bfd8022035ba5c03384bd93c5b33540fa83bc5c46001f8e05ab53d32299758fbaf1ff22d0141044888318b7c43164f3bb2de4599e7fe08b60da985ce7de7b9af68e140e48f26539c9dfc5df37d14586c086ab496a74f060fc3d5e941cbea2fad6c40a3193ba5ea",
            "asm": "3045022100dcd443f70a1ca9246d1271842d4725db4b3f90d72690555a545bbeaf50f9bfd8022035ba5c03384bd93c5b33540fa83bc5c46001f8e05ab53d32299758fbaf1ff22d[ALL] 044888318b7c43164f3bb2de4599e7fe08b60da985ce7de7b9af68e140e48f26539c9dfc5df37d14586c086ab496a74f060fc3d5e941cbea2fad6c40a3193ba5ea"
          },
          "addr": "GdCik4ijFvcCc6MRghwwH2eYKv6gH66JJe",
          "valueSat": 1888000000,
          "value": 18.88,
          "doubleSpentTxID": null
        },
        {
          "txid": "356b5251663a62c12601bc0a8e5bf814b501eba97424a4478ea47d15c676bd03",
          "vout": 1,
          "sequence": 4294967295,
          "n": 1,
          "scriptSig": {
            "hex": "47304402207eaca01fccabdb82921157278f743b89fa9d5354d627ae65b1f60cb45b51f3130220039f1af96b26b46ec7c21ab4583dcab38b6a2d9fc3b79eff600071767e4c8d9601410427332771d3d7da5e4feca7cc5dac712ddf9537637966d161ae1cead99dffadad5d994d0a9c2ada8ae0ca3cd12150bbc9c4c85ef2c97952dba9dda76aaa03a528",
            "asm": "304402207eaca01fccabdb82921157278f743b89fa9d5354d627ae65b1f60cb45b51f3130220039f1af96b26b46ec7c21ab4583dcab38b6a2d9fc3b79eff600071767e4c8d96[ALL] 0427332771d3d7da5e4feca7cc5dac712ddf9537637966d161ae1cead99dffadad5d994d0a9c2ada8ae0ca3cd12150bbc9c4c85ef2c97952dba9dda76aaa03a528"
          },
          "addr": "GWLPi2UD7hhVm9JtM4zDrGc3EggphcZy1j",
          "valueSat": 362000000,
          "value": 3.62,
          "doubleSpentTxID": null
        },
        {
          "txid": "9b9167a1fc127f659f76ed8d9610d02250b3e19b4a65554d978ef14c891a640e",
          "vout": 0,
          "sequence": 4294967295,
          "n": 2,
          "scriptSig": {
            "hex": "47304402202758c2225501af4c4fafc0f6bc7792aaa25b4599e0011bd29d104736a9c507f10220084f5c1bdfdca0938562f221af93bd5551257fcb41cfe063fdf59ecd286f074b014104f46db5e9d61a9dc27b8d64ad23e7383a4e6ca164593c2527c038c0857eb67ee8e825dca65046b82c9331586c82e0fd1f633f25f87c161bc6f8a630121df2b3d3",
            "asm": "304402202758c2225501af4c4fafc0f6bc7792aaa25b4599e0011bd29d104736a9c507f10220084f5c1bdfdca0938562f221af93bd5551257fcb41cfe063fdf59ecd286f074b[ALL] 04f46db5e9d61a9dc27b8d64ad23e7383a4e6ca164593c2527c038c0857eb67ee8e825dca65046b82c9331586c82e0fd1f633f25f87c161bc6f8a630121df2b3d3"
          },
          "addr": "GUDsNQbXETFmGCC7fugHJ6ABwKLSwUayUt",
          "valueSat": 5000000000,
          "value": 50,
          "doubleSpentTxID": null
        },
        {
          "txid": "bef395d6dab2b18f0c29457d87957a3c52b1788075967ddf26dc8d3509b1cb3e",
          "vout": 1,
          "sequence": 4294967295,
          "n": 3,
          "scriptSig": {
            "hex": "473044022000d848d59c30e95ec72bb66565c39df6ad50b136f21ff160722c14e5fcf1b7a90220324bc6715ed70a10ccb793fe97f37f035e53857798080680127cacf67ea63285014104fbde61e09918ca461345c5bed2380f0d4c0cc02177460be6a52e70b6af0ebfbddbdfeb1a99860655084080064275a8380aaf8d1551d18730516b975af47c6bb7",
            "asm": "3044022000d848d59c30e95ec72bb66565c39df6ad50b136f21ff160722c14e5fcf1b7a90220324bc6715ed70a10ccb793fe97f37f035e53857798080680127cacf67ea63285[ALL] 04fbde61e09918ca461345c5bed2380f0d4c0cc02177460be6a52e70b6af0ebfbddbdfeb1a99860655084080064275a8380aaf8d1551d18730516b975af47c6bb7"
          },
          "addr": "GMUq7WbwHD3eGhZ8LPQLGvseMS3oJfnhNg",
          "valueSat": 3000000,
          "value": 0.03,
          "doubleSpentTxID": null
        },
        {
          "txid": "a898d050b4e28598bc1985c1d2cc1e6442f78ea9f267f4a3c0ac29c40505cb9b",
          "vout": 0,
          "sequence": 4294967295,
          "n": 4,
          "scriptSig": {
            "hex": "493046022100f043b7b3e19f01095cb315657fe1be9c2962a3a1b43417682b48508dd2c455d6022100abf5cde3b8aeca869e613eb1dd14e3628e2f8a77a65192da8b57b8be3ab12083014104dc71d7d5090af35d5ec7285b4244baa65e3d96b2923326358c509df50623bc9403d0cb77048b4e3b0c774809674913a2eb309939b9a8669430fec84d18ddfe71",
            "asm": "3046022100f043b7b3e19f01095cb315657fe1be9c2962a3a1b43417682b48508dd2c455d6022100abf5cde3b8aeca869e613eb1dd14e3628e2f8a77a65192da8b57b8be3ab12083[ALL] 04dc71d7d5090af35d5ec7285b4244baa65e3d96b2923326358c509df50623bc9403d0cb77048b4e3b0c774809674913a2eb309939b9a8669430fec84d18ddfe71"
          },
          "addr": "GTZ1By4AuBmUFn67uhXycXQug4QbawbNdC",
          "valueSat": 186000000,
          "value": 1.86,
          "doubleSpentTxID": null
        },
        {
          "txid": "a529830b6fb3c4e00bf2bba434b6dc063b2abcabcb3fc26b4cbe5c11e430eda3",
          "vout": 0,
          "sequence": 4294967295,
          "n": 5,
          "scriptSig": {
            "hex": "4730440220076fcb83dfed0bb2beba4a45397705e9786681da2a825f5ff18771d4c0509615022065d1b5a41099ca2ecdd3c6fa4dcae48cf5d4b8003c47fa9e161a35d225b85e6d0141047e868eefc8e24ff89af5017da1baf8fc528c7566ed2026cc80244ba76a0adbca50ba4d2e0ec4744c4d55ab6a3f442657f9d0981099d2e4e3339e210c6efee647",
            "asm": "30440220076fcb83dfed0bb2beba4a45397705e9786681da2a825f5ff18771d4c0509615022065d1b5a41099ca2ecdd3c6fa4dcae48cf5d4b8003c47fa9e161a35d225b85e6d[ALL] 047e868eefc8e24ff89af5017da1baf8fc528c7566ed2026cc80244ba76a0adbca50ba4d2e0ec4744c4d55ab6a3f442657f9d0981099d2e4e3339e210c6efee647"
          },
          "addr": "GLcL2jpg7w4iMAqWU22YXurgb4qioJkVTP",
          "valueSat": 21000000,
          "value": 0.21,
          "doubleSpentTxID": null
        },
        {
          "txid": "fff2525b8931402dd09222c50775608f75787bd2b87e56995a7bdd30f79702c4",
          "vout": 0,
          "sequence": 4294967295,
          "n": 6,
          "scriptSig": {
            "hex": "48304502202f3fa1413d769eee26c2ecef3f3ef826b52bc40fcaa177fcb60a238c24ad306a022100a82a2bd54f8874b4142f76b127189a9bf4d0c5f4c43dbd71bbdccdf58f0e3f9b014104ef709b5379567ce8b5b2c4bd0efd01ff1b6f56dcd213937f56ac2370202630a7d1fd5086b5e806090857a0a009b08a87ce283274d8178d71b4f2718d790645eb",
            "asm": "304502202f3fa1413d769eee26c2ecef3f3ef826b52bc40fcaa177fcb60a238c24ad306a022100a82a2bd54f8874b4142f76b127189a9bf4d0c5f4c43dbd71bbdccdf58f0e3f9b[ALL] 04ef709b5379567ce8b5b2c4bd0efd01ff1b6f56dcd213937f56ac2370202630a7d1fd5086b5e806090857a0a009b08a87ce283274d8178d71b4f2718d790645eb"
          },
          "addr": "Gbg9Pj5ymN4XTKbDHvEn2CsRodXvYLZs6n",
          "valueSat": 556000000,
          "value": 5.56,
          "doubleSpentTxID": null
        },
        {
          "txid": "fbde5d03b027d2b9ba4cf5d4fecab9a99864df2637b25ea4cbcb1796ff6550ca",
          "vout": 1,
          "sequence": 4294967295,
          "n": 7,
          "scriptSig": {
            "hex": "493046022100cabd732acf7306b9565e676179b3d144cc5af5de2d0618d700ba2863a53da662022100aa2cff8a4164904a6b1a6ef0279f022bc7a02dfa9a59b88ef50a87efdbf0f5ef01410456d53467bd7d2afc5ca6003e510dec95d59d658b9e3e8af4950f170f392e8aafbb8387bc1eba8ea5d4e27dad8a2c603966f2e0e0618dd78847b39fd8cf7f81d5",
            "asm": "3046022100cabd732acf7306b9565e676179b3d144cc5af5de2d0618d700ba2863a53da662022100aa2cff8a4164904a6b1a6ef0279f022bc7a02dfa9a59b88ef50a87efdbf0f5ef[ALL] 0456d53467bd7d2afc5ca6003e510dec95d59d658b9e3e8af4950f170f392e8aafbb8387bc1eba8ea5d4e27dad8a2c603966f2e0e0618dd78847b39fd8cf7f81d5"
          },
          "addr": "GJxTxv8xinHTbXDV6xgcuFDotdLWFHFkup",
          "valueSat": 556000000,
          "value": 5.56,
          "doubleSpentTxID": null
        },
        {
          "txid": "1a8f0b19d50fb25aa81994b7420224de49d2805bddf1bca981e1dfd264528af9",
          "vout": 0,
          "sequence": 4294967295,
          "n": 8,
          "scriptSig": {
            "hex": "48304502201410751ad9a8c5689895fa8861481757cea323b8310e6cf18ec8c90d2feb6bfe022100d94e567ebef06ffb06c5ad678f50778cd687780ff7c3df3fea177b78e3f762220141041609784269e43dcc8bd9918e06b868f5c1f171408ad26543753aad9dc7791c57af9e0da56abc6b3b528db2770760c9bd0c06669620945446515a98f8573e7c07",
            "asm": "304502201410751ad9a8c5689895fa8861481757cea323b8310e6cf18ec8c90d2feb6bfe022100d94e567ebef06ffb06c5ad678f50778cd687780ff7c3df3fea177b78e3f76222[ALL] 041609784269e43dcc8bd9918e06b868f5c1f171408ad26543753aad9dc7791c57af9e0da56abc6b3b528db2770760c9bd0c06669620945446515a98f8573e7c07"
          },
          "addr": "GgXjv3RtkUN2uhfEbXDTkyoYcnRuSCZw5g",
          "valueSat": 498000000,
          "value": 4.98,
          "doubleSpentTxID": null
        }
      ],
      "vout": [
        {
          "value": "90.70000000",
          "n": 0,
          "scriptPubKey": {
            "hex": "76a9149490023a1f27c8f0956a963f365f726872dc359288ac",
            "asm": "OP_DUP OP_HASH160 9490023a1f27c8f0956a963f365f726872dc3592 OP_EQUALVERIFY OP_CHECKSIG",
            "addresses": [
              "GXPSwRC2fLg7gahTZaRL9rL1gArFPz7uAd"
            ],
            "type": "pubkeyhash"
          },
          "spentTxId": "ca7c337e531dde28d4af367f1b8fe282a06c42f17355966bf637d05d00011c67",
          "spentIndex": 1,
          "spentHeight": 105016
        }
      ],
      "blockhash": "000000000000265dad8db0728e318aabd0098e69a82984f8c1c5b9d55de5fd9a",
      "blockheight": 105001,
      "confirmations": 425839,
      "time": 1296211474,
      "blocktime": 1296211474,
      "valueOut": 90.7,
      "size": 1662,
      "valueIn": 90.7,
      "fees": 0
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
"rawtx": "01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff0704ffff001d0104ffffffff0100f2052a0100000043410496b538e853519c726a2c91e61ec11600ae1390813a627c66fb8be7947be63c52da7589379515d4e0a604f8141781e62294721166bf621e73a82cbf2342c858eeac00000000"
}
```

Example Response:  

```
{
    txid: "0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098"
}
```