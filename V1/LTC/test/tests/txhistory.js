const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;
const coinQueryURL = process.env.COIN_QUERY_LTC_SERVER;

/* The /addrs endpoint returns an array of transactions, with the most recent
 * (aka highest block number) at index 0.  This means the transaction at index 0
 * will change over time as more transactions are added to the blockchain.
 *
 * For this reason, only the oldest transaction is verified.
 */

const address = 'LdyNJ5b6iQMfhwhydeCkbQ4vstnN9UqMHt';
const maxItems = 50;

// Example response
// 20180514144312
// https://insight.litecore.io/api/addrs/LdyNJ5b6iQMfhwhydeCkbQ4vstnN9UqMHt/txs?from=0&to=50
const expectedResponse = {
  "totalItems": 1,
  "from": 0,
  "to": 1,
  "items": [
    {
      "txid": "c1837436f0d2725623937352770b38f358665d377da1b5396b6c609acb27ad70",
      "version": 1,
      "locktime": 1427476,
      "vin": [
        {
          "txid": "5d6be73050f16aba7a0c329f8b92e4cae2fd4b3904157e8f821f82d302f0b916",
          "vout": 0,
          "sequence": 4294967294,
          "n": 0,
          "scriptSig": {
            "hex": "47304402206e2e7dad777c096217fd519454ff9cc28d6cb4c546a9d363f13a2af65d00004802200c8e85c5078bc1ca55421e7fc6bea6105ac8261d6755ecc3109306bab118110001210269492f6f871cb91442e394311d72da7f0639e698cdb7140cc2d3169ca104e6f1",
            "asm": "304402206e2e7dad777c096217fd519454ff9cc28d6cb4c546a9d363f13a2af65d00004802200c8e85c5078bc1ca55421e7fc6bea6105ac8261d6755ecc3109306bab1181100[ALL] 0269492f6f871cb91442e394311d72da7f0639e698cdb7140cc2d3169ca104e6f1"
          },
          "addr": "LRTr3wqwXKvd31d8ErtY7XoPHungA2DkCD",
          "valueSat": 10000000,
          "value": 0.1,
          "doubleSpentTxID": null
        }
      ],
      "vout": [
        {
          "value": "0.00082572",
          "n": 0,
          "scriptPubKey": {
            "hex": "76a914cda836268476989ae1d9da908bb44b8d07ef30ad88ac",
            "asm": "OP_DUP OP_HASH160 cda836268476989ae1d9da908bb44b8d07ef30ad OP_EQUALVERIFY OP_CHECKSIG",
            "addresses": [
              "LdyNJ5b6iQMfhwhydeCkbQ4vstnN9UqMHt"
            ],
            "type": "pubkeyhash"
          },
          "spentTxId": null,
          "spentIndex": null,
          "spentHeight": null
        }
      ],
      "blockhash": "b9b4c6737a4d4ae44838cae65c006abd1c25ea249d3eb238efacbf00ab119ff8",
      "blockheight": 1427478,
      "confirmations": 105999,
      "time": 1527193725,
      "blocktime": 1527193725,
      "valueOut": 1.21434335,
      "size": 555,
      "valueIn": 1.21504735,
      "fees": 0.000704
    }
  ]
}

describe('GET /addrs endpoint', () => {
  it('should be able to retrieve transaction history', done => {
    const txhistRequest = () => new Promise((resolve, reject) => {
      const uri = `${coinQueryURL}/api/addrs/${address}/txs?from=0&to=${maxItems}`
      return request({
        uri: uri,
        json: true,
        rejectUnauthorized: false,
      }).then(res => {
        resolve(res);
      }).catch(err => {
        reject(err);
      });
    });

    txhistRequest()
      .then(res => {
        expect(res).to.have.property('totalItems');
        expect(res).to.have.property('from');
        expect(res).to.have.property('to');
        expect(res).to.have.property('items');
        var totalItemsActual = 0;
        if (res.totalItems > maxItems) {
          totalItemsActual = maxItems;
        } else {
          totalItemsActual = res.totalItems;
        }
        //expect(res.totalItems).to.be.below(maxItems);
        const totalItemsExpected = (expectedResponse.totalItems > maxItems) ? maxItems : expectedResponse.totalItems
        expect(res.items[totalItemsActual - 1].txid).to.equal(expectedResponse.items[totalItemsExpected - 1].txid);
        expect(res.items[totalItemsActual - 1].blockheight).to.equal(expectedResponse.items[totalItemsExpected - 1].blockheight);
        expect(res.items[totalItemsActual - 1].blockhash).to.equal(expectedResponse.items[totalItemsExpected - 1].blockhash);
        expect(res.items[totalItemsActual - 1].vin[0].txid).to.equal(expectedResponse.items[totalItemsExpected - 1].vin[0].txid);
        expect(res.items[totalItemsActual - 1].vout[0].txid).to.equal(expectedResponse.items[totalItemsExpected - 1].vout[0].txid);
        return done();
      }).catch(err => {
        return done(err);
      });
  });
});
