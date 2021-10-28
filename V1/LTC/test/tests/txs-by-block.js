const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;
const coinQueryURL = process.env.COIN_QUERY_LTC_SERVER;

// The /txs endpoint returns an array of transactions

const blockhash = 'a442dba782b88313c373318d3b92a87342e3d82f5edadd980f402f7e244eb55d';
const pageNum = 0;

// Example response
// https://insight.litecore.io/api/txs/?block=a442dba782b88313c373318d3b92a87342e3d82f5edadd980f402f7e244eb55d&pageNum=0

describe('GET /txs endpoint', () => {
    it('should be able to retrieve transactions by block', done => {
        const txhistRequest = () => new Promise((resolve, reject) => {
            const uri = `${coinQueryURL}/api/txs?block=${blockhash}&pageNum=${pageNum}`
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
                expect(res).to.have.property('pagesTotal');
                expect(res).to.have.property('txs');
                expect(res.txs.length).to.equal(100);
                return done();
            }).catch(err => {
                return done(err);
            });
    });
});
