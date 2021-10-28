const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;
const coinQueryURL = process.env.COIN_QUERY_DASH_SERVER;

// The /txs endpoint returns an array of transactions

const blockhash = '0000000000000021a14f4e0e34dea1423b7ecebc15873c266a3769225df75546';
const pageNum = 0;

// Example response
// https://insight.dash.org/api/txs?block=0000000000000021a14f4e0e34dea1423b7ecebc15873c266a3769225df75546&pageNum=0

describe('GET /txs endpoint', () => {
    it('should be able to retrieve transactions by block', done => {
        const txhistRequest = () => new Promise((resolve, reject) => {
            const uri = `${coinQueryURL}api/txs?block=${blockhash}&pageNum=${pageNum}`
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
