const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;

/* Example response
{
  "syncTipHash": "000000000000000000149ea88d78c4a0ca859ee25d808da3d968f5484bb6f5e9",
  "lastblockhash": "000000000000000000149ea88d78c4a0ca859ee25d808da3d968f5484bb6f5e9"
}
*/

describe('GET /status?q=getLastBlockHash endpoint', () => {

    let coinQueryURL;
    let lastBlockRequest;

    beforeEach(() => {
        coinQueryURL = process.env.COIN_QUERY_BTC_SERVER;
        lastBlockRequest = () => request({
            uri: `${coinQueryURL}api/status?q=getLastBlockHash`,
            json: true,
            rejectUnauthorized : false,
        });
    });

    it('should be able to retrieve last block hash for BTC', async () => {
        try {
            const res = await lastBlockRequest();
            expect(res).to.have.property('syncTipHash');
            expect(res).to.have.property('lastblockhash');
            expect(res).to.have.property('lastblockhash').to.not.be.null;
            expect(res).to.have.property('syncTipHash').to.not.be.null;
        } catch (e) {
            throw new Error(e.message);
        }
    });
});
