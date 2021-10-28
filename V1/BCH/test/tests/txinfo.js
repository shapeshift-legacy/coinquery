const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;

/* Example response
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
  "vout": [ ... ],
  "blockhash": "0000000062b69e4a2c3312a5782d7798b0711e9ebac065cd5d19f946439f8609",
  "blockheight": -1,
  "confirmations": 0,
  "time": 1231832435,
  "isCoinBase": true,
  "valueOut": null,
  "size": 134
}
*/

describe('GET /tx endpoint', () => {

    let coinQueryURL;
    let txRequest;
    let _blockhash;
    let _txid;

    beforeEach(() => {
        coinQueryURL = process.env.COIN_QUERY_BCH_SERVER;
        _blockhash = '0000000062b69e4a2c3312a5782d7798b0711e9ebac065cd5d19f946439f8609';
        _txid = 'bc15f9dcbe637c187bb94247057b14637316613630126fc396c22e08b89006ea';
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
