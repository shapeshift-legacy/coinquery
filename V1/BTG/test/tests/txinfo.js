const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;

/* Example response
// 20180529102745
// https://btgexplorer.com/api/tx/0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098

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
*/

describe('GET /tx endpoint', () => {
    let coinQueryURL;
    let txRequest;
    let _blockhash;
    let _txid;

    beforeEach(() => {
        coinQueryURL = process.env.COIN_QUERY_BTG_SERVER;
        _blockhash = '00000000839a8e6886ab5951d76f411475428afc90947ee320161bbf18eb6048'; // block number = 1
        _txid = '0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098';
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
