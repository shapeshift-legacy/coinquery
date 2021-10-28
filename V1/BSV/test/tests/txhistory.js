const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;

const coinQueryURL = process.env.COIN_QUERY_BCH_SERVER;

/* The /addrs endpoint returns an array of transactions, with the most recent 
 * (aka highest block number) at index 0.  This means the transaction at index 0 
 * will change over time as more transactions are added to the blockchain.
 *
 * For this reason, only the oldest transaction is verified.
 */

const address = '1DQmHcQqmoHfmqJcc19GoqHjAvJWGs1265'; // from CoinQuery test wallet
const maxItems = 50;

// Example response
const expectedResponse = {
    "totalItems": 4,
    "from": 0,
    "to": 4,
    "items": [
      {
        "txid": "64398da6f500d33bc6001194a5266246080c3c978c8ac92c085583dc87635c2a",
        "version": 1,
        "locktime": 0,
        "vin": [
          {
            "txid": "5acd71fad069c910302047fc838242500237ee5eaf3496c7bb8937a71eb334d6",
            "vout": 0,
            "sequence": 4294967295,
            "n": 0,
            "scriptSig": {
              "hex": "483045022100a8a0ec1857d570ccb5f7e01b25b9af0955590eb7350eb88b823f9135c151093202206a6386af05b9108de6e29f18ad769d439bf9e17e67b30687ebc917ce917affee412103becd1bad4a3539438519189231a120394de6a9900913f087cb04c0dda0040df8",
              "asm": "3045022100a8a0ec1857d570ccb5f7e01b25b9af0955590eb7350eb88b823f9135c151093202206a6386af05b9108de6e29f18ad769d439bf9e17e67b30687ebc917ce917affee[ALL|FORKID] 03becd1bad4a3539438519189231a120394de6a9900913f087cb04c0dda0040df8"
            },
            "addr": "1DQmHcQqmoHfmqJcc19GoqHjAvJWGs1265",
            "valueSat": 500000,
            "value": 0.005,
            "doubleSpentTxID": null
          }
        ],
        "vout": [
          {
            "value": "0.00001000",
            "n": 0,
            "scriptPubKey": {
              "hex": "76a914f2d0dd63a904b9a7e9caec3bf6902c9971aaad0588ac",
              "asm": "OP_DUP OP_HASH160 f2d0dd63a904b9a7e9caec3bf6902c9971aaad05 OP_EQUALVERIFY OP_CHECKSIG",
              "addresses": [
                "1P8tjc2EoQ2ykhpE9RUqZqvmdzT3GMbQKT"
              ],
              "type": "pubkeyhash"
            },
            "spentTxId": null,
            "spentIndex": null,
            "spentHeight": null
          },
          {
            "value": "0.00489000",
            "n": 1,
            "scriptPubKey": {
              "hex": "76a91488200b81505488d6356279b3ca839c324588950588ac",
              "asm": "OP_DUP OP_HASH160 88200b81505488d6356279b3ca839c3245889505 OP_EQUALVERIFY OP_CHECKSIG",
              "addresses": [
                "1DQmHcQqmoHfmqJcc19GoqHjAvJWGs1265"
              ],
              "type": "pubkeyhash"
            },
            "spentTxId": null,
            "spentIndex": null,
            "spentHeight": null
          }
        ],
        "blockhash": "000000000000000000c30fa7f2dd6c0b054e2e71f6aa069abb15f88ccd015274",
        "blockheight": 527761,
        "confirmations": 1020,
        "time": 1524849849,
        "blocktime": 1524849849,
        "valueOut": 0.0049,
        "size": 226,
        "valueIn": 0.005,
        "fees": 0.0001
      },
      {
        "txid": "9faebb8c2ef4342ebeee75a7334db83c57e85275beb556375b1859b7c3182065",
        "version": 1,
        "locktime": 0,
        "vin": [
          {
            "txid": "2273c7a1b21e7796c055087da0ae01be46f933f47081bea6cdce1310c85e58c9",
            "vout": 0,
            "sequence": 4294967295,
            "n": 0,
            "scriptSig": {
              "hex": "473044022027a961d1a6f31295946c59a9f7be4e170d2a5c38f6bd7153d4ac1ca3699c018d022036f5822bb80ffe074810bdb686b0910c9815140fde283f930f023bb6380de9c8412103becd1bad4a3539438519189231a120394de6a9900913f087cb04c0dda0040df8",
              "asm": "3044022027a961d1a6f31295946c59a9f7be4e170d2a5c38f6bd7153d4ac1ca3699c018d022036f5822bb80ffe074810bdb686b0910c9815140fde283f930f023bb6380de9c8[ALL|FORKID] 03becd1bad4a3539438519189231a120394de6a9900913f087cb04c0dda0040df8"
            },
            "addr": "1DQmHcQqmoHfmqJcc19GoqHjAvJWGs1265",
            "valueSat": 1800000,
            "value": 0.018,
            "doubleSpentTxID": null
          }
        ],
        "vout": [
          {
            "value": "0.00001000",
            "n": 0,
            "scriptPubKey": {
              "hex": "76a914f2d0dd63a904b9a7e9caec3bf6902c9971aaad0588ac",
              "asm": "OP_DUP OP_HASH160 f2d0dd63a904b9a7e9caec3bf6902c9971aaad05 OP_EQUALVERIFY OP_CHECKSIG",
              "addresses": [
                "1P8tjc2EoQ2ykhpE9RUqZqvmdzT3GMbQKT"
              ],
              "type": "pubkeyhash"
            },
            "spentTxId": null,
            "spentIndex": null,
            "spentHeight": null
          }
        ],
        "blockhash": "000000000000000001acdaa2c1257ec3b9b792722c33b7955e169fe3b105166a",
        "blockheight": 527757,
        "confirmations": 1024,
        "time": 1524845525,
        "blocktime": 1524845525,
        "valueOut": 0.00001,
        "size": 191,
        "valueIn": 0.018,
        "fees": 0.01799
      },
      {
        "txid": "5acd71fad069c910302047fc838242500237ee5eaf3496c7bb8937a71eb334d6",
        "version": 1,
        "locktime": 0,
        "vin": [
          {
            "txid": "2273c7a1b21e7796c055087da0ae01be46f933f47081bea6cdce1310c85e58c9",
            "vout": 1,
            "sequence": 4294967295,
            "n": 0,
            "scriptSig": {
              "hex": "483045022100c82f6eaa82c5c80f7140103e710fcbe252d8fd1979bf43d9a8cf16c5a4b042e8022008e982ca450e83b9f95c02120c9199b1d8450f41b50e58f4243a5a505203c4e141210352ed55aefd6f03d20386ffc5723078debc36b682f6b3ba46935b5af50ba8bb79",
              "asm": "3045022100c82f6eaa82c5c80f7140103e710fcbe252d8fd1979bf43d9a8cf16c5a4b042e8022008e982ca450e83b9f95c02120c9199b1d8450f41b50e58f4243a5a505203c4e1[ALL|FORKID] 0352ed55aefd6f03d20386ffc5723078debc36b682f6b3ba46935b5af50ba8bb79"
            },
            "addr": "1HoxPCnSpcBgGTu277Mt9wNhgUovYtuCsm",
            "valueSat": 49644260,
            "value": 0.4964426,
            "doubleSpentTxID": null
          }
        ],
        "vout": [
          {
            "value": "0.00500000",
            "n": 0,
            "scriptPubKey": {
              "hex": "76a91488200b81505488d6356279b3ca839c324588950588ac",
              "asm": "OP_DUP OP_HASH160 88200b81505488d6356279b3ca839c3245889505 OP_EQUALVERIFY OP_CHECKSIG",
              "addresses": [
                "1DQmHcQqmoHfmqJcc19GoqHjAvJWGs1265"
              ],
              "type": "pubkeyhash"
            },
            "spentTxId": "64398da6f500d33bc6001194a5266246080c3c978c8ac92c085583dc87635c2a",
            "spentIndex": 0,
            "spentHeight": 527761
          },
          {
            "value": "0.49134260",
            "n": 1,
            "scriptPubKey": {
              "hex": "76a91401cd6d5a02bf3384bcc954d544689eab720494da88ac",
              "asm": "OP_DUP OP_HASH160 01cd6d5a02bf3384bcc954d544689eab720494da OP_EQUALVERIFY OP_CHECKSIG",
              "addresses": [
                "1AXmXCs18FvPYnep3MFykhdo5skSSGMPe"
              ],
              "type": "pubkeyhash"
            },
            "spentTxId": "63d8ac877ce6dad05ac3af375286f13559aa150a5d40718194337749722fb3e0",
            "spentIndex": 0,
            "spentHeight": 528203
          }
        ],
        "blockhash": "000000000000000001acdaa2c1257ec3b9b792722c33b7955e169fe3b105166a",
        "blockheight": 527757,
        "confirmations": 1024,
        "time": 1524845525,
        "blocktime": 1524845525,
        "valueOut": 0.4963426,
        "size": 226,
        "valueIn": 0.4964426,
        "fees": 0.0001
      },
      {
        "txid": "2273c7a1b21e7796c055087da0ae01be46f933f47081bea6cdce1310c85e58c9",
        "version": 1,
        "locktime": 0,
        "vin": [
          {
            "txid": "a4fa12eb6088488ade3f57c3183b0a20aec17b9253d1a36271b361de9c3f6259",
            "vout": 1,
            "sequence": 4294967295,
            "n": 0,
            "scriptSig": {
              "hex": "473044022045dc4c77f113ad4d7cb1f9b7253965f85956f880384c997c708d44571603c58b022048736681480694778f69acb2df3b3c101c941147c1fb556d6e533274ee63f767412102a94a34389ddbfc4efa92646da4bbcdae7df2858dcc06812d0a3768daf7a57e24",
              "asm": "3044022045dc4c77f113ad4d7cb1f9b7253965f85956f880384c997c708d44571603c58b022048736681480694778f69acb2df3b3c101c941147c1fb556d6e533274ee63f767[ALL|FORKID] 02a94a34389ddbfc4efa92646da4bbcdae7df2858dcc06812d0a3768daf7a57e24"
            },
            "addr": "12s7uG9s8FpgdHbmQxf7T95VSw6qqYEhRC",
            "valueSat": 51454260,
            "value": 0.5145426,
            "doubleSpentTxID": null
          }
        ],
        "vout": [
          {
            "value": "0.01800000",
            "n": 0,
            "scriptPubKey": {
              "hex": "76a91488200b81505488d6356279b3ca839c324588950588ac",
              "asm": "OP_DUP OP_HASH160 88200b81505488d6356279b3ca839c3245889505 OP_EQUALVERIFY OP_CHECKSIG",
              "addresses": [
                "1DQmHcQqmoHfmqJcc19GoqHjAvJWGs1265"
              ],
              "type": "pubkeyhash"
            },
            "spentTxId": "9faebb8c2ef4342ebeee75a7334db83c57e85275beb556375b1859b7c3182065",
            "spentIndex": 0,
            "spentHeight": 527757
          },
          {
            "value": "0.49644260",
            "n": 1,
            "scriptPubKey": {
              "hex": "76a914b86360c660aa09a61f89b6b1e15ed10dfdb6b9f988ac",
              "asm": "OP_DUP OP_HASH160 b86360c660aa09a61f89b6b1e15ed10dfdb6b9f9 OP_EQUALVERIFY OP_CHECKSIG",
              "addresses": [
                "1HoxPCnSpcBgGTu277Mt9wNhgUovYtuCsm"
              ],
              "type": "pubkeyhash"
            },
            "spentTxId": "5acd71fad069c910302047fc838242500237ee5eaf3496c7bb8937a71eb334d6",
            "spentIndex": 0,
            "spentHeight": 527757
          }
        ],
        "blockhash": "000000000000000000d1c4e2d719db3e5e8f10dc2d38f443d9f00898f829a8cc",
        "blockheight": 527613,
        "confirmations": 1168,
        "time": 1524767718,
        "blocktime": 1524767718,
        "valueOut": 0.5144426,
        "size": 225,
        "valueIn": 0.5145426,
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
