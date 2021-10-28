const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;

/* Example response
// 20180514144515
// https://insight.litecore.io/api/addrs/LMCXsS9d7Fg4kxj6UbisZbdvafRtdRWds3/txs?from=0&to=1
{"totalItems":12820,"from":0,"to":1,"items":[{"txid":"64405326e329f6f703f7265639715a29a14c8f51251f81248814dd7f153bab4e","version":2,"locktime":0,"vin":[{"txid":"c404b71943edb12476b5e505f6bdb60738e206999770429e856933a305f93eb8","vout":1,"sequence":4294967295,"n":0,"scriptSig":{"hex":"4830450221009b96fbcabc51647ffe840b5200f38005b5efc295fccf6a579ae2a1ee508e3de502200fa404d4986a5b34d718c766a800ec91c69d7bcd100acde0688c55c8b886170301210287f9f17218618873c45e8a14550dda7792722ba63319f607b445bb25decbdafc","asm":"30450221009b96fbcabc51647ffe840b5200f38005b5efc295fccf6a579ae2a1ee508e3de502200fa404d4986a5b34d718c766a800ec91c69d7bcd100acde0688c55c8b8861703[ALL] 0287f9f17218618873c45e8a14550dda7792722ba63319f607b445bb25decbdafc"},"addr":"LbQe4nVdqUJVPjytH2WZeyZwAgVR1HzMKa","valueSat":61000000,"value":0.61,"doubleSpentTxID":null}],"vout":[{"value":"0.60072000","n":0,"scriptPubKey":{"hex":"76a914592a4a2bb1ca294e6861ffbd9b4f3bbc8484798288ac","asm":"OP_DUP OP_HASH160 592a4a2bb1ca294e6861ffbd9b4f3bbc84847982 OP_EQUALVERIFY OP_CHECKSIG","addresses":["LTMR4dNEoiCVC2mhb9fPMyLrqQgWPg6pue"],"type":"pubkeyhash"},"spentTxId":null,"spentIndex":null,"spentHeight":null},{"value":"0.00828000","n":1,"scriptPubKey":{"hex":"76a91415ab793c4e95c8b7583e68da13f29f38f710956a88ac","asm":"OP_DUP OP_HASH160 15ab793c4e95c8b7583e68da13f29f38f710956a OP_EQUALVERIFY OP_CHECKSIG","addresses":["LMCXsS9d7Fg4kxj6UbisZbdvafRtdRWds3"],"type":"pubkeyhash"},"spentTxId":null,"spentIndex":null,"spentHeight":null}],"blockhash":"b0a71b5ffa726ea0a415e1fa8556857935a40fbc4240ef996b6652b2d89adaa5","blockheight":1426921,"confirmations":17,"time":1527112469,"blocktime":1527112469,"valueOut":0.609,"size":226,"valueIn":0.61,"fees":0.001}]}
*/

describe('GET /tx endpoint', () => {
  let coinQueryURL;
  let txRequest;
  let _blockhash;
  let _txid;

  beforeEach(() => {
    coinQueryURL = process.env.COIN_QUERY_LTC_SERVER;
    _blockhash = '7d1e3ef2a633c14a78596dd28751a82ab1981c8426e52c3f398ab71db2cce86a';
    _txid = 'f878e44fca8e6903712c61c6b508f99b4ac0762a07d6d79b3a9b7884ca0dfd59';
    const uri = `${coinQueryURL}/api/tx/${_txid}`;
    txRequest = () => request({
      uri,
      json: true,
      rejectUnauthorized: false,
    });
  });

  it('should be able to ping for status', async () => {
    try {
      const { txid, blockhash } = await txRequest();
      expect(txid).to.equal(_txid);
      expect(blockhash).to.equal(_blockhash);
    } catch (e) {
      throw new Error(e.message);
    }
  });
});
