const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;

const coinQueryURL = process.env.COIN_QUERY_ETH_SERVER;
const etherscanURL = 'https://api.etherscan.io/';

// Test parameters
const userAccounts = '0x6b67c94fc31510707F9c0f1281AaD5ec9a2EEFF0';

// ------------------------*
// Reference Specification:
// https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_getTransactionCount
// ------------------------*

const eth_getTransactionCountRequest = async (host, blockNumber) => new Promise((resolve, reject) =>
    request({
        uri: `${host}api?module=proxy&action=eth_getTransactionCount&apikey=42&address=${userAccounts}&tag=${blockNumber}`,
        json: true,
        rejectUnauthorized : false,
    }).then(res => {
        resolve(res);
    }).catch(err => {
        reject(err);
    }));

describe('GET eth_getTransactionCount', () => {   

    it('proxy request for eth_getTransactionCount should match api.etherscan.io for latest block number', async () => {
        try {
            const coinqueryResponse = await eth_getTransactionCountRequest(coinQueryURL, 'latest');
            const etherscanResponse = await eth_getTransactionCountRequest(etherscanURL, 'latest');
            expect(coinqueryResponse).to.have.property('result');
            expect(coinqueryResponse.result).to.be.a('string');
            expect(coinqueryResponse.result).to.equal(etherscanResponse.result);
        } catch (e) {
            throw new Error(e);
        }
    });
});
