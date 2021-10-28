const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;
const coinQueryURL = process.env.COIN_QUERY_ZEC_SERVER;

/* The /addrs endpoint returns an array of transactions, with the most recent 
 * (aka highest block number) at index 0.  This means the transaction at index 0 
 * will change over time as more transactions are added to the blockchain.
 *
 * For this reason, only the oldest transaction is verified.
 */

const address = 't1ZVfakn7outDdcTgZW4CKEjihiBnZb4jLV'; // from CoinQuery test wallet
const maxItems = 50;

// Example response
// 20180514144312
// https://zcash.blockexplorer.com/api/addrs/t1ZVfakn7outDdcTgZW4CKEjihiBnZb4jLV/txs?from=0&to=1
const expectedResponse = {
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
      "confirmations": 313299,
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
      "confirmations": 313315,
      "time": 1479096667,
      "blocktime": 1479096667,
      "valueOut": 0.1032646,
      "size": 225,
      "valueIn": 0.1033646,
      "fees": 0.0001
    }
  ]
};

describe('GET /addrs endpoint', () => {
    it('should be able to retrieve transaction history', done => {
        const txhistRequest = () => new Promise((resolve, reject) => {
            const uri = `${coinQueryURL}api/addrs/${address}/txs?from=0&to=${maxItems}`
            console.log('uri', uri)
            return request({
                uri: uri,
                json: true,
                rejectUnauthorized : false,
            }).then(res => {
                resolve(res);
            }).catch(err => {
                reject(err);
            });
        });

        txhistRequest()
        .then(res => {
            //console.log(res);
            expect(res).to.have.property('totalItems');
            expect(res).to.have.property('from');
            expect(res).to.have.property('to');
            expect(res).to.have.property('items');
            expect(res.totalItems).to.be.below(maxItems);
            const totalItemsActual = res.totalItems;
            const totalItemsExpected = expectedResponse.totalItems;
            expect(res.items[totalItemsActual-1].txid).to.equal(expectedResponse.items[totalItemsExpected-1].txid);
            expect(res.items[totalItemsActual-1].blockheight).to.equal(expectedResponse.items[totalItemsExpected-1].blockheight);
            expect(res.items[totalItemsActual-1].blockhash).to.equal(expectedResponse.items[totalItemsExpected-1].blockhash);
            expect(res.items[totalItemsActual-1].vin[0].txid).to.equal(expectedResponse.items[totalItemsExpected-1].vin[0].txid);
            expect(res.items[totalItemsActual-1].vout[0].txid).to.equal(expectedResponse.items[totalItemsExpected-1].vout[0].txid);
            return done();
        }).catch(err => {
            return done(err);
        });
    });
});
