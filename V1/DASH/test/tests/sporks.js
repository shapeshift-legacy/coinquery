const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;
const coinQueryURL = process.env.COIN_QUERY_DASH_SERVER;

const sporksResponse = {
    "sporks": {
      "SPORK_2_INSTANTSEND_ENABLED": 0,
      "SPORK_3_INSTANTSEND_BLOCK_FILTERING": 0,
      "SPORK_5_INSTANTSEND_MAX_VALUE": 2000,
      "SPORK_6_NEW_SIGS": 4000000000,
      "SPORK_9_SUPERBLOCKS_ENABLED": 0,
      "SPORK_12_RECONSIDER_BLOCKS": 0,
      "SPORK_15_DETERMINISTIC_MNS_ENABLED": 1047200,
      "SPORK_16_INSTANTSEND_AUTOLOCKS": 0,
      "SPORK_17_QUORUM_DKG_ENABLED": 4070908800,
      "SPORK_19_CHAINLOCKS_ENABLED": 4070908800,
      "SPORK_20_INSTANTSEND_LLMQ_BASED": 4070908800
      }
};

describe('GET /sporks endpoint', () => {
  it('should be able to retrieve sporks endpoint info', done => {
    request({
      uri: `${coinQueryURL}api/sporks`,
      json: true,
      rejectUnauthorized: false,
    }).then(res => {
      console.log('Server response:');
      console.log(res.sporks);
      expect(res).to.eql(sporksResponse);
      return done();
    }).catch(err => {
      return done(err);
    });
  });
});
