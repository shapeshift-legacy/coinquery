const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;

const coinQueryURL = process.env.COIN_QUERY_DOGE_SERVER;

/* Example response

{
    "info": {
    "version": 1100000,
    "protocolversion": 70004,
    "walletversion": 60000,
    "balance": 0,
    "blocks": 2298664,
    "timeoffset": -1,
    "connections": 8,
    "proxy": "",
    "difficulty": 3775232.19953372,
    "testnet": false,
    "keypoololdest": 1530567170,
    "keypoolsize": 101,
    "paytxfee": 0,
    "relayfee": 1,
    "errors": ""
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
                expect(res.info.testnet).to.equal(false);
                expect(res.info.errors).to.equal('');
                return done();
            })
            .catch(err => {
                return done(err);
            });
    });
});
