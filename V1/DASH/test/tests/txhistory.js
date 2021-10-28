const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;
const coinQueryURL = process.env.COIN_QUERY_DASH_SERVER;

/* The /addrs endpoint returns an array of transactions, with the most recent 
 * (aka highest block number) at index 0.  This means the transaction at index 0 
 * will change over time as more transactions are added to the blockchain.
 *
 * For this reason, only the oldest transaction is verified.
 */

const address = 'XuZ3G9XykJCibcGtauedVAFFEqnoWh42sw'; 
const maxItems = 50;

// Expected response
// 20180514212133
// https://insight.dash.org/api/addrs/XuZ3G9XykJCibcGtauedVAFFEqnoWh42sw/txs?from=0&to=2

const expectedResponse = {
  "totalItems": 2,
  "from": 0,
  "to": 2,
  "items": [
    {
      "txid": "21263e5ba26ec76b10895f89668cb3adce3ce1f749a99ebce9fd801415df266a",
      "version": 1,
      "locktime": 0,
      "vin": [
        {
          "txid": "836f0f697b6d3a6283c7c264a5a144c893e7b077ef4aea87dbb4f32d81ac86c5",
          "vout": 4,
          "sequence": 4294967295,
          "n": 0,
          "scriptSig": {
            "hex": "483045022100fbb841b80a3763d61f9d0f1e63d36c0a450e641f0b3291c53b7def2af7ecfabc02205d7403f4889683ec12561349898720ac610f1947e3b554a35bf3f8a7729b6b5e012102e43c1a6ad091854d53388446f137df544bf3cca769ffc37100121dd393b30abc",
            "asm": "3045022100fbb841b80a3763d61f9d0f1e63d36c0a450e641f0b3291c53b7def2af7ecfabc02205d7403f4889683ec12561349898720ac610f1947e3b554a35bf3f8a7729b6b5e[ALL] 02e43c1a6ad091854d53388446f137df544bf3cca769ffc37100121dd393b30abc"
          },
          "addr": "XuZ3G9XykJCibcGtauedVAFFEqnoWh42sw",
          "valueSat": 61046380,
          "value": 0.6104638,
          "doubleSpentTxID": null
        }
      ],
      "vout": [
        {
          "value": "0.14693435",
          "n": 0,
          "scriptPubKey": {
            "hex": "76a91418f6f0cb0864fc34911e139c5b374cab1bfc6b3288ac",
            "asm": "OP_DUP OP_HASH160 18f6f0cb0864fc34911e139c5b374cab1bfc6b32 OP_EQUALVERIFY OP_CHECKSIG",
            "addresses": [
              "XcxqsbEAjQ6YvnyyvJQNn4SniJyKn1tfN5"
            ],
            "type": "pubkeyhash"
          },
          "spentTxId": "9630754ab6a83de77b167b5ba4277b99384bf1d15e744152d8a0b5b10c23a58a",
          "spentIndex": 2,
          "spentHeight": 100018
        },
        {
          "value": "0.46252945",
          "n": 1,
          "scriptPubKey": {
            "hex": "76a914235c09beb1cde74c05d137a3b0a4dd6cb6a4959c88ac",
            "asm": "OP_DUP OP_HASH160 235c09beb1cde74c05d137a3b0a4dd6cb6a4959c OP_EQUALVERIFY OP_CHECKSIG",
            "addresses": [
              "XduojtFb2iJHeM2SJyZBstmPnUb8k1wZiz"
            ],
            "type": "pubkeyhash"
          },
          "spentTxId": "0c067777f167823d22b76b45d824f8700042c4125aecf6353e81e357e3e3d05e",
          "spentIndex": 0,
          "spentHeight": 100013
        }
      ],
      "blockhash": "0000000000068da510d8ceba576f0d35ebafd4e555428f7738cce286bbebdf68",
      "blockheight": 100012,
      "confirmations": 770162,
      "time": 1405043840,
      "blocktime": 1405043840,
      "valueOut": 0.6094638,
      "size": 226,
      "valueIn": 0.6104638,
      "fees": 0.001,
      "txlock": false
    },
    {
      "txid": "836f0f697b6d3a6283c7c264a5a144c893e7b077ef4aea87dbb4f32d81ac86c5",
      "version": 1,
      "locktime": 0,
      "vin": [
        {
          "txid": "d4335acf189fdb8f6a296bdd2a29357bb92be23aee787e0006c7ca5332db9ed1",
          "vout": 0,
          "sequence": 4294967295,
          "n": 0,
          "scriptSig": {
            "hex": "47304402202bb80c4397ddb48ffe9cb32748bf4c7e8e54f93d335b09cf85f96437824fa69002207df1d7d1b6879e1086ea49bfd00d1938ab87880832029d2b5097069be2aa3de901210270230dbc0812c6c9a6a2c22c34aa08b8ca0ab179733988d645917225ade3b422",
            "asm": "304402202bb80c4397ddb48ffe9cb32748bf4c7e8e54f93d335b09cf85f96437824fa69002207df1d7d1b6879e1086ea49bfd00d1938ab87880832029d2b5097069be2aa3de9[ALL] 0270230dbc0812c6c9a6a2c22c34aa08b8ca0ab179733988d645917225ade3b422"
          },
          "addr": "Xw43GxB6uYmGZYwV61vhf46DsPvHY4popZ",
          "valueSat": 400080000,
          "value": 4.0008,
          "doubleSpentTxID": null
        }
      ],
      "vout": [
        {
          "value": "2.00071486",
          "n": 0,
          "scriptPubKey": {
            "hex": "76a914fba48a8e7ec38a8363cedf28678fcc03ab9974b588ac",
            "asm": "OP_DUP OP_HASH160 fba48a8e7ec38a8363cedf28678fcc03ab9974b5 OP_EQUALVERIFY OP_CHECKSIG",
            "addresses": [
              "XydQYvoaQdhEqADNPE8XJD9h91mYF5Cvwc"
            ],
            "type": "pubkeyhash"
          },
          "spentTxId": "bf00369bd5c9bf142d66528900604f14b333cb7e9ec3ea9a64cb4ae41d2091d5",
          "spentIndex": 67,
          "spentHeight": 237604
        },
        {
          "value": "0.01379694",
          "n": 1,
          "scriptPubKey": {
            "hex": "76a9144e2935b77de8fbdb9de2afc465262856292566cb88ac",
            "asm": "OP_DUP OP_HASH160 4e2935b77de8fbdb9de2afc465262856292566cb OP_EQUALVERIFY OP_CHECKSIG",
            "addresses": [
              "Xhp7uXS2PBxEvcnRZChwkdLpBAd9eG2uZU"
            ],
            "type": "pubkeyhash"
          },
          "spentTxId": null,
          "spentIndex": null,
          "spentHeight": null
        },
        {
          "value": "0.09940781",
          "n": 2,
          "scriptPubKey": {
            "hex": "76a914c92c647f3ec47cbffac891a44c252df5b0dffe5688ac",
            "asm": "OP_DUP OP_HASH160 c92c647f3ec47cbffac891a44c252df5b0dffe56 OP_EQUALVERIFY OP_CHECKSIG",
            "addresses": [
              "Xu2YqG6BUWLXu67cS3exohu7o5373EYkqp"
            ],
            "type": "pubkeyhash"
          },
          "spentTxId": "23647b18b450cf9f28fd179faa48be7823b146cf0d7a56d90e6a253fe6579c47",
          "spentIndex": 36,
          "spentHeight": 113221
        },
        {
          "value": "1.02794800",
          "n": 3,
          "scriptPubKey": {
            "hex": "76a9144ded7cf2ab1561ec5dd9248f31da1119447af67d88ac",
            "asm": "OP_DUP OP_HASH160 4ded7cf2ab1561ec5dd9248f31da1119447af67d OP_EQUALVERIFY OP_CHECKSIG",
            "addresses": [
              "XhntMz6ujxQhUCEB4F3qjKCkr72ppwiQgb"
            ],
            "type": "pubkeyhash"
          },
          "spentTxId": "0327b22c66ef68d0f587ced53bc230dfc4c2e7a230198e5551ce6bd1cd521b92",
          "spentIndex": 431,
          "spentHeight": 101535
        },
        {
          "value": "0.61046380",
          "n": 4,
          "scriptPubKey": {
            "hex": "76a914cef09a52cec6753cddf7482c7ac631b53a97663b88ac",
            "asm": "OP_DUP OP_HASH160 cef09a52cec6753cddf7482c7ac631b53a97663b OP_EQUALVERIFY OP_CHECKSIG",
            "addresses": [
              "XuZ3G9XykJCibcGtauedVAFFEqnoWh42sw"
            ],
            "type": "pubkeyhash"
          },
          "spentTxId": "21263e5ba26ec76b10895f89668cb3adce3ce1f749a99ebce9fd801415df266a",
          "spentIndex": 0,
          "spentHeight": 100012
        },
        {
          "value": "0.09948180",
          "n": 5,
          "scriptPubKey": {
            "hex": "76a914d76628c03800818cb44649fc05d04bac774f92f688ac",
            "asm": "OP_DUP OP_HASH160 d76628c03800818cb44649fc05d04bac774f92f6 OP_EQUALVERIFY OP_CHECKSIG",
            "addresses": [
              "XvKmVeABUR6X2Auk2xQedRMFije3HuiyTs"
            ],
            "type": "pubkeyhash"
          },
          "spentTxId": "5ff1b3a5681c5532c9f677830a829588befc6f1178ebd412d9753def52e8b6b9",
          "spentIndex": 98,
          "spentHeight": 100161
        },
        {
          "value": "0.10582087",
          "n": 6,
          "scriptPubKey": {
            "hex": "76a91432b8ba284d79e635fb6f4421b4dcbe052d35ede488ac",
            "asm": "OP_DUP OP_HASH160 32b8ba284d79e635fb6f4421b4dcbe052d35ede4 OP_EQUALVERIFY OP_CHECKSIG",
            "addresses": [
              "XfK2uuyuwC2axsQgV9P7osK6xf4C1sh6jV"
            ],
            "type": "pubkeyhash"
          },
          "spentTxId": "90e2e16a8cb7c200048430fa356480f7f7a02040d33b4ee98edff1713b6c8c25",
          "spentIndex": 2,
          "spentHeight": 100125
        },
        {
          "value": "0.00909144",
          "n": 7,
          "scriptPubKey": {
            "hex": "76a91448bafccfd8e3f2619c564ef21bf83232afabe32988ac",
            "asm": "OP_DUP OP_HASH160 48bafccfd8e3f2619c564ef21bf83232afabe329 OP_EQUALVERIFY OP_CHECKSIG",
            "addresses": [
              "XhKQVBqqmWJxaq5U2kXe8tdEsKRoiC42vd"
            ],
            "type": "pubkeyhash"
          },
          "spentTxId": null,
          "spentIndex": null,
          "spentHeight": null
        },
        {
          "value": "0.00912058",
          "n": 8,
          "scriptPubKey": {
            "hex": "76a9147533cf8bb432dc71a1cc72174b2ee9b3090b6b6a88ac",
            "asm": "OP_DUP OP_HASH160 7533cf8bb432dc71a1cc72174b2ee9b3090b6b6a OP_EQUALVERIFY OP_CHECKSIG",
            "addresses": [
              "XmNYxa1WszPwycTxYyVLrXNePdWMzQq83S"
            ],
            "type": "pubkeyhash"
          },
          "spentTxId": "581152a4b4074a310b67ed2b06e1adabbfbcbddfe11979028db9b23d66194d81",
          "spentIndex": 2,
          "spentHeight": 101025
        },
        {
          "value": "0.02495390",
          "n": 9,
          "scriptPubKey": {
            "hex": "76a914657eae6bb7d0533b923a54083d1984241335289588ac",
            "asm": "OP_DUP OP_HASH160 657eae6bb7d0533b923a54083d19842413352895 OP_EQUALVERIFY OP_CHECKSIG",
            "addresses": [
              "XjwVqbqoUiy6pa4a9UxmkPtLAhkPoP8JC4"
            ],
            "type": "pubkeyhash"
          },
          "spentTxId": "d22cf4e0c02f6f3abcd45c2e41046f6d7488812beaffa8e7997b681cfc858f8c",
          "spentIndex": 436,
          "spentHeight": 199319
        }
      ],
      "blockhash": "00000000000fd08c2fb661d2fcb0d49abb3a91e5f27082ce64feed3b4dede2e2",
      "blockheight": 100000,
      "confirmations": 770174,
      "time": 1405041879,
      "blocktime": 1405041879,
      "valueOut": 4.0008,
      "size": 497,
      "valueIn": 4.0008,
      "fees": 0,
      "txlock": false
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
