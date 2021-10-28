/* Description:
 *   Requests token balance for several user accounts on a list of tokens
 *   and verifes that CoinQuery response matches Etherscan response
 */

// Dependencies
const RateLimiter = require('request-rate-limiter');
const chai = require('chai');
const expect = chai.expect;
const _ = require('lodash');

// Test parameters
const userAccounts = [
  '0x6b67c94fc31510707F9c0f1281AaD5ec9a2EEFF0',
  '0xe93381fb4c4f14bda253907b18fad305d799241a',
  '0x3cdf0c57abab388d80dafb21d0bd9d9c5fdc7c17'   // dummy address, never used on blockchain
];

const etherscanURL = 'https://api.etherscan.io/'; // API location, Etherscan third-party service
const coinQueryURL = process.env.COIN_QUERY_ETH_SERVER;
const blockNumber = 'latest'; //'0x4C4B40'; // 5,000,000 in hex notation

const limiter = new RateLimiter({
  rate: 3              // requests per interval,
  // defaults to 60
  , interval: 1          // interval for the rate, x
  // requests per interval,
  // defaults to 60
  , backoffCode: 403      // back off when this status is
  // returned, defaults to 429
  , backoffTime: 1       // back off for n seconds,
  // defauts to rate/5
  , maxWaitingTime: 300   // return errors for requests
  // that will have to wait for
  // n seconds or more. defaults
  // to 5 minutes
});

const tokens = {
  ANT: {
    'symbol': 'ANT',
    'contractAddr': '0x960b236A07cf122663c4303350609A66A7B288C0',
    'decimals': 18,
  },
  REP: {
    'symbol': 'REP',
    'contractAddr': '0xe94327d07fc17907b4db788e5adf2ed424addff6',
    'decimals': 18,
  },
  BAT: {
    'symbol': 'BAT',
    'contractAddr': '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
    'decimals': 18,
  },
  CVC: {
    'symbol': 'CVC',
    'contractAddr': '0x41e5560054824ea6b0732e656e3ad64e20e94e45',
    'decimals': 8,
  },
  DNT: {
    'symbol': 'DNT',
    'contractAddr': '0x0abdace70d3790235af448c88547603b945604ea',
    'decimals': 18,
  },
  EOS: {
    'symbol': 'EOS',
    'contractAddr': '0x86fa049857e0209aa7d9e616f7eb3b3b78ecfdb0',
    'decimals': 18,
  },
  FUN: {
    'symbol': 'FUN',
    'contractAddr': '0x419d0d8bdd9af5e606ae2232ed285aff190e711b',
    'decimals': 8,
  },
  GNT: {
    'symbol': 'GNT',
    'contractAddr': '0xa74476443119A942dE498590Fe1f2454d7D4aC0d',
    'decimals': 18,
  },
  GNO: {
    'symbol': 'GNO',
    'contractAddr': '0x6810e776880c02933d47db1b9fc05908e5386b96',
    'decimals': 18,
  },
  OMG: {
    'symbol': 'OMG',
    'contractAddr': '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07',
    'decimals': 18,
  },
  SALT: {
    'symbol': 'SALT',
    'contractAddr': '0x4156D3342D5c385a87D264F90653733592000581',
    'decimals': 8,
  }
};

const getTokenBalance = async function (url, tokenAddress, userAccount) {
  const query = url +
        'api?' +
        'module=account' +
        '&action=tokenbalance' +
        '&contractaddress=' + tokenAddress +
        '&address=' + userAccount +
        '&tag=' + blockNumber +
        '&apikey=42';

  return new Promise((resolve, reject) => {
    return limiter.request({ url: query, method: 'get', rejectUnauthorized : false })
      .then(function(res) {
        if (res.statusCode === 429) {
          return reject(new Error('429 received from remote server'));
        } else if (res.statusCode === 403) {
          return reject(new Error('403 received from remote server'));
        } else {
          return resolve(JSON.parse(res.body).result);
        }
      })
      .catch(function(err) {
        // the err object is set if the limiter is overflowing or is not able to execute your request in time
        return reject('catch Error: ' + err);
      });
  });
};

describe('GET tokenbalance', () => {
  const {
    ANT,
    REP,
    BAT,
    CVC,
    DNT,
    EOS,
    FUN,
    GNT,
    GNO,
    OMG,
    SALT,
  } = tokens;

  it(`${ANT.symbol} - should match balance from etherscan`, async () => {
    const acct = userAccounts[0]; 
    try {
      const coinqueryBalance = await getTokenBalance(coinQueryURL, ANT.contractAddr, acct);
      const etherscanBalance = await getTokenBalance(etherscanURL, ANT.contractAddr, acct);
      expect(coinqueryBalance).to.equal(etherscanBalance);
    } catch (e) {
      throw new Error(e);
    }
  });

  it(`${REP.symbol} - should match balance from etherscan`, async () => {
    const acct = userAccounts[0];
    try {
      const coinqueryBalance = await getTokenBalance(coinQueryURL, REP.contractAddr, acct);
      const etherscanBalance = await getTokenBalance(etherscanURL, REP.contractAddr, acct);
      expect(coinqueryBalance).to.equal(etherscanBalance);
    } catch (e) {
      throw new Error(e);
    }
  });

  it(`${BAT.symbol} - should match balance from etherscan`, async () => {
    const acct = userAccounts[0];
    try {
      const coinqueryBalance = await getTokenBalance(coinQueryURL, BAT.contractAddr, acct);
      const etherscanBalance = await getTokenBalance(etherscanURL, BAT.contractAddr, acct);
      expect(coinqueryBalance).to.equal(etherscanBalance);
    } catch (e) {
      throw new Error(e);
    }
  });

  it(`${CVC.symbol} - should match balance from etherscan`, async () => {
    const acct = userAccounts[0];
    try {
      const coinqueryBalance = await getTokenBalance(coinQueryURL, CVC.contractAddr, acct);
      const etherscanBalance = await getTokenBalance(etherscanURL, CVC.contractAddr, acct);
      expect(coinqueryBalance).to.equal(etherscanBalance);
    } catch (e) {
      throw new Error(e);
    }
  });

  it(`${DNT.symbol} - should match balance from etherscan`, async () => {
    const acct = userAccounts[0];
    try {
      const coinqueryBalance = await getTokenBalance(coinQueryURL, DNT.contractAddr, acct);
      const etherscanBalance = await getTokenBalance(etherscanURL, DNT.contractAddr, acct);
      expect(coinqueryBalance).to.equal(etherscanBalance);
    } catch (e) {
      throw new Error(e);
    }
  });

  it(`${EOS.symbol} - should match balance from etherscan`, async () => {
    const acct = userAccounts[0];
    try {
      const coinqueryBalance = await getTokenBalance(coinQueryURL, EOS.contractAddr, acct);
      const etherscanBalance = await getTokenBalance(etherscanURL, EOS.contractAddr, acct);
      expect(coinqueryBalance).to.equal(etherscanBalance);
    } catch (e) {
      throw new Error(e);
    }
  });

  it(`${FUN.symbol} - should match balance from etherscan`, async () => {
    const acct = userAccounts[0];
    try {
      const coinqueryBalance = await getTokenBalance(coinQueryURL, FUN.contractAddr, acct);
      const etherscanBalance = await getTokenBalance(etherscanURL, FUN.contractAddr, acct);
      expect(coinqueryBalance).to.equal(etherscanBalance);
    } catch (e) {
      throw new Error(e);
    }
  });

  it(`${GNT.symbol} - should match balance from etherscan`, async () => {
    const acct = userAccounts[0];
    try {
      const coinqueryBalance = await getTokenBalance(coinQueryURL, GNT.contractAddr, acct);
      const etherscanBalance = await getTokenBalance(etherscanURL, GNT.contractAddr, acct);
      expect(coinqueryBalance).to.equal(etherscanBalance);
    } catch (e) {
      throw new Error(e);
    }
  });

  it(`${GNO.symbol} - should match balance from etherscan`, async () => {
    const acct = userAccounts[0];
    try {
      const coinqueryBalance = await getTokenBalance(coinQueryURL, GNO.contractAddr, acct);
      const etherscanBalance = await getTokenBalance(etherscanURL, GNO.contractAddr, acct);
      expect(coinqueryBalance).to.equal(etherscanBalance);
    } catch (e) {
      throw new Error(e);
    }
  });

  it(`${OMG.symbol} - should match balance from etherscan`, async () => {
    const acct = userAccounts[0];
    try {
      const coinqueryBalance = await getTokenBalance(coinQueryURL, OMG.contractAddr, acct);
      const etherscanBalance = await getTokenBalance(etherscanURL, OMG.contractAddr, acct);
      expect(coinqueryBalance).to.equal(etherscanBalance);
    } catch (e) {
      throw new Error(e);
    }
  });

  it(`${SALT.symbol} - should match balance from etherscan`, async () => {
    const acct = userAccounts[0];
    try {
      const coinqueryBalance = await getTokenBalance(coinQueryURL, SALT.contractAddr, acct);
      const etherscanBalance = await getTokenBalance(etherscanURL, SALT.contractAddr, acct);
      expect(coinqueryBalance).to.equal(etherscanBalance);
    } catch (e) {
      throw new Error(e);
    }
  });
});
