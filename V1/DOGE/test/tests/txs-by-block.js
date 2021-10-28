const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;
const coinQueryURL = process.env.COIN_QUERY_DOGE_SERVER;

// The /txs endpoint returns an array of transactions

const blockhash = 'a92393bff7c68ba8a1aadf7b9f96d865a0902313240318c6529eeb60fcdf28ac';
const pageNum = 0;

// Example response
// https://doge/api/txs/?block=a92393bff7c68ba8a1aadf7b9f96d865a0902313240318c6529eeb60fcdf28ac&pageNum=0

describe('GET /txs endpoint', () => {
    it('should be able to retrieve transactions by block', done => {
        const txhistRequest = () => new Promise((resolve, reject) => {
            const uri = `${coinQueryURL}api/txs/?block=${blockhash}&pageNum=${pageNum}`
            console.log('uri', uri)
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
