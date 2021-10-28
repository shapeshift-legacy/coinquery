const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;

/* Example response

// https://doge.redacted.example.com/api/tx/e05ada30bc922d473d723fe6bbef428c955ee5fc3041fff3535472770e0a98a9

{
  "block_hash": "d37f7a1fc177ff1eb526c65c2e63c25946ceaa7fddf79787423677bb5975486b",
  "block_height": 2299761,
  "block_index": 0,
  "hash": "28b3c4056db72aa3d1f730332c29e8bfa29463ac71f2c2ad4cc8b3fa2cb059b5",
  "addresses": [
    "DE15wuLZJ32buLSAHPbcTimV6AWgtZVSr2"
  ],
  "total": 1000000000000,
  "fees": 0,
  "size": 101,
  "preference": "low",
  "confirmed": "2018-07-11T17:36:00.779111578Z",
  "received": "2018-07-11T17:36:00.779111578Z",
  "ver": 1,
  "double_spend": false,
  "vin_sz": 1,
  "vout_sz": 1,
  "confirmations": 22,
  "confidence": 1,
  "inputs": [
    {
      "output_index": -1,
      "script": "037117230101",
      "output_value": 1000000000000,
      "sequence": 4294967295,
      "script_type": "empty",
      "age": 2299761
    }
  ],
  "outputs": [
    {
      "value": 1000000000000,
      "script": "2103f449e1ecf0113d36acf6815266017877f00d2d6366da9356b47e779f915df12cac",
      "addresses": [
        "DE15wuLZJ32buLSAHPbcTimV6AWgtZVSr2"
      ],
      "script_type": "pay-to-pubkey"
    }
  ]
}

*/

describe('GET /tx endpoint', () => {
  let coinQueryURL;
  let txRequest;
  let _blockhash;
  let _txid;

  beforeEach(() => {
    coinQueryURL = process.env.COIN_QUERY_DOGE_SERVER;
    _blockhash = 'd37f7a1fc177ff1eb526c65c2e63c25946ceaa7fddf79787423677bb5975486b';
    _txid = '28b3c4056db72aa3d1f730332c29e8bfa29463ac71f2c2ad4cc8b3fa2cb059b5';
    txRequest = () => request({
      uri: `${coinQueryURL}api/tx/${_txid}`,
      json: true,
      rejectUnauthorized: false,
    });
  });

  it('should be able to retrieve tx info', async () => {
    try {
      const { txid, blockhash } = await txRequest();
      expect(txid).to.equal(_txid);
      expect(blockhash).to.equal(_blockhash);
    } catch (e) {
      throw new Error(e.message);
    }
  });
});
