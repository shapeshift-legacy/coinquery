const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;

const coinQueryURL = process.env.COIN_QUERY_BTG_SERVER;

/* Example response
// 20180529153232
// http://localhost:3001/api/sync

{
  "status": "syncing",
  "blockChainHeight": 282500,
  "syncPercentage": 10,
  "height": 282500,
  "error": null,
  "type": "bitcore node"
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