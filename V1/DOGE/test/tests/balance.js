const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;
const coinQueryURL = process.env.COIN_QUERY_DOGE_SERVER;

const address = 'D59v2SCSjSxXmdqb44LhjBAeCH6bKVewXE';

// Example response
// 20180907131120
// https://api.blockcypher.com/v1/doge/main/addrs/D59v2SCSjSxXmdqb44LhjBAeCH6bKVewXE/balance

const blockcypherResponse = {
  "address": "D59v2SCSjSxXmdqb44LhjBAeCH6bKVewXE",
  "total_received": 3046411201304,
  "total_sent": 3032033349609,
  "balance": 14377851695,
  "unconfirmed_balance": 0,
  "final_balance": 14377851695,
  "n_tx": 6,
  "unconfirmed_n_tx": 0,
  "final_n_tx": 6
};

describe('GET /addr endpoint', () => {
  it('should be able to retrieve transaction history', done => {
    const txhistRequest = () => new Promise((resolve, reject) => {
      const uri = `${coinQueryURL}api/addr/${address}`
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
      .then(cqResponse => {
        expect(cqResponse).to.have.property('balanceSat');
        return done();
      }).catch(err => done(err));
  });
});
