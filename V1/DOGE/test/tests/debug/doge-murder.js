const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;
const coinQueryURL = process.env.COIN_QUERY_DOGE_SERVER;
const address = 'D59v2SCSjSxXmdqb44LhjBAeCH6bKVewXE';

const httpRequest = () => new Promise((resolve, reject) => {
  const uri = `${coinQueryURL}api/addr/${address}`
  console.log('uri', uri)
  return request({
    uri: uri,
    json: true,
    rejectUnauthorized: false,
    resolveWithFullResponse: true
  }).then(res => {
    console.log(`HTTP status code: ${res.statusCode}\n`);
    return resolve(res);
  }).catch(err => {
    return reject(err);
  });
});

describe('GET /addr endpoint', () => {
  let requestInterval;

  const checkResponse = async (done) => {
    let cqResponse;
    try {
      cqResponse = await httpRequest();
      expect(cqResponse.body).to.have.property('balanceSat');
    } catch (err) {
      console.log(`Error encountered in HTTP response: ${err}`);
      console.log(cqResponse.body);
      clearInterval(requestInterval);
      expect.fail();
      return done();
    }
  };

  it('should be able to get /addr endpoint', done => {
    const retryInterval = 1000; // units of milliseconds
    requestInterval = setInterval(checkResponse, retryInterval, done);
    console.log(`Setting timer to send a request every ${retryInterval/1000} seconds ...`);
  });
});