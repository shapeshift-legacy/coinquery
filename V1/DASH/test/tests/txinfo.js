const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;

/* Expected response
// 20180514211957
// https://insight.dash.org/api/tx/21263e5ba26ec76b10895f89668cb3adce3ce1f749a99ebce9fd801415df266a

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
}
*/

describe('GET /tx endpoint', () => {

    let coinQueryURL;
    let txRequest;
    let _blockhash;
    let _txid;

    beforeEach(() => {
        coinQueryURL = process.env.COIN_QUERY_DASH_SERVER;
        _blockhash = '0000000000068da510d8ceba576f0d35ebafd4e555428f7738cce286bbebdf68';
        _txid = '21263e5ba26ec76b10895f89668cb3adce3ce1f749a99ebce9fd801415df266a';
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
