const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;

/* Example response
// 20180514144515
// https://zcash.blockexplorer.com/api/tx/208c210272cf3668e96795bd288ade9ac6446a75c4ae15550e9ee64a42a4d554

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
*/

describe('GET /tx endpoint', () => {
    let coinQueryURL;
    let txRequest;
    let _blockhash;
    let _txid;

    beforeEach(() => {
        coinQueryURL = process.env.COIN_QUERY_ZEC_SERVER;
        _blockhash = '00000000d9c69beb1860a1e952d1c9800867a4f18a6012ca32117ccd9b772893';
        _txid = '208c210272cf3668e96795bd288ade9ac6446a75c4ae15550e9ee64a42a4d554';
        txRequest = () => request({
            uri: `${coinQueryURL}api/tx/${_txid}`,
            json: true,
            rejectUnauthorized : false,
        });
    });

    it('should be able to ping for status', async () => {
        try {
            const { txid, blockhash } = await txRequest();
            expect(txid).to.equal(_txid);
            expect(blockhash).to.equal(_blockhash);
        } catch (e) {
            throw new Error(e.message);
        }
    });
});
