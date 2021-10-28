const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;

const coinQueryURL = process.env.COIN_QUERY_BTG_SERVER;

/* Example response

// 20180529110419
// http://localhost:3001/api/status

{
  "info": {
    "version": 150001,
    "protocolversion": 70016,
    "blocks": 288,
    "timeoffset": -93,
    "connections": 8,
    "proxy": "",
    "difficulty": 1,
    "testnet": false,
    "relayfee": 0.00001,
    "errors": "",
    "network": "livenet"
  }
}
*/

describe('GET /status endpoint', () => {
    it('should be able to retrieve status', done => {
        const syncRequest = () => new Promise((resolve, reject) => {
            return request({
                uri: `${coinQueryURL}api/status`,
                json: true,
                rejectUnauthorized: false,
            }).then(res => {
                console.log('Server response:');
                console.log(res.info);
                resolve(res);
            }).catch(err => {
                reject(err);
            });
        });
        syncRequest()
            .then(res => {
                expect(res).to.have.property('info');
                expect(res.info).to.have.property('version');
                expect(res.info).to.have.property('protocolversion');
                expect(res.info).to.have.property('blocks');
                expect(res.info).to.have.property('timeoffset');
                expect(res.info).to.have.property('connections');
                expect(res.info).to.have.property('proxy');
                expect(res.info).to.have.property('difficulty');
                expect(res.info).to.have.property('testnet');
                expect(res.info).to.have.property('relayfee');
                expect(res.info).to.have.property('errors');
                expect(res.info).to.have.property('network');
                expect(res.info.testnet).to.equal(false);
                expect(res.info.errors).to.equal('');
                expect(res.info.network).to.equal('livenet');
                return done();
            })
            .catch(err => {
                return done(err);
            });
    });
});
