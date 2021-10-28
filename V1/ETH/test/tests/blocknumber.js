const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;
const _ = require('lodash');
const coinQueryURL = process.env.COIN_QUERY_ETH_SERVER;

const blockNumberRequest = async (host) => new Promise((resolve, reject) =>
  request({
    uri: `${host}api?module=proxy&action=eth_blockNumber&apikey=42`,
    json: true,
    rejectUnauthorized : false,
  }).then(res => {
    resolve(res);
  }).catch(err => {
    reject(err);
  }));

describe('GET /blockNumber endpoint', () => {
  let cq = null;
  before(async function () {
    try {
      cq = await blockNumberRequest(coinQueryURL);
    } catch (e) {
      throw new Error(e);
    }
  });

  it('should be able to retrieve blocknumber from JSON RPC', async () => {
    expect(cq).to.have.property('result');
    expect(cq.result).to.be.a('string');
  });

  it('should be a number', () => {
    const cqResultAsDecimal = +cq.result;
    expect(cqResultAsDecimal).to.be.a('number');
  });
});
