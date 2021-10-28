const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;

const coinQueryURL = process.env.COIN_QUERY_DOGE_SERVER;

/* Example response

{
    "status": "finished",
    "blockChainHeight": 2298520,
    "syncPercentage": 100,
    "height": 2298610,
    "error": null,
    "type": "from RPC calls",
    "startTs": 1531258574240,
    "endTs": 1531258578415
}
*/

describe('GET /sync endpoint', () => {
    it('should be able to retrieve sync info', done => {
        const syncRequest = () => new Promise((resolve, reject) => {
            return request({
                uri: `${coinQueryURL}api/sync`,
                json: true,
                rejectUnauthorized: false,
            }).then(res => {
                console.log(`Server response:\n`);
                console.log(res);
                resolve(res);
            }).catch(err => {
                reject(err);
            });
        });
        syncRequest()
            .then(res => {
                expect(res).to.have.property('status');
                expect(res).to.have.property('blockChainHeight');
                expect(res).to.have.property('syncPercentage');
                expect(res).to.have.property('height');
                expect(res).to.have.property('error');
                expect(res).to.have.property('type');
                expect(res.status).to.be.oneOf(['syncing', 'finished']);
                expect(res.error).to.equal(null);
                return done();
            })
            .catch(err => {
                return done(err);
            });
    });
});
