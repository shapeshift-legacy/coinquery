const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;
const coinQueryURL = process.env.COIN_QUERY_BCH_SERVER;

// The /txs endpoint returns an array of transactions

const blockhash = '00000000018bca603a7fbe68ebb226004076e0ac35d4faf47840f8546fdf2ad1';
const pageNum = 0;

// Example response
// https://insight.bitpay.com/api/txs/?block=00000000018bca603a7fbe68ebb226004076e0ac35d4faf47840f8546fdf2ad1&pageNum=0

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
                return done();
            }).catch(err => {
                return done(err);
            });
    });
});
