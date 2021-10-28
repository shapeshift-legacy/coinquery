const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;

const coinQueryURL = process.env.COIN_QUERY_ETH_SERVER;
const etherscanURL = 'https://api.etherscan.io/';

// ------------------------*
// Reference Specification:
// https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_gasprice
// - returns current gas price in wei
// ------------------------*

const gasPriceRequest = async (host) => new Promise((resolve, reject) =>
    request({
        uri: `${host}api?module=proxy&action=eth_gasPrice&apikey=42`,
        json: true,
        rejectUnauthorized : false,
    }).then(res => {
        resolve(res);
    }).catch(err => {
        reject(err);
    }));

describe('GET eth_gasPrice', () => { 

    it('proxy request for eth_gasPrice should match result from api.etherscan.io', async () => {
        try {
            const coinqueryResponse = await gasPriceRequest(coinQueryURL);
            const etherscanResponse = await gasPriceRequest(etherscanURL);
            expect(coinqueryResponse).to.have.property('result');
            expect(coinqueryResponse.result).to.be.a('string');

            const cqResultAsDecimal = +coinqueryResponse.result;
            const esResultAsDecimal = +etherscanResponse.result;

            if (coinqueryResponse.result !== etherscanResponse.result) {
              console.log(`
                 WARNING: GAS Price Mismatch
                 etherscan -> ${esResultAsDecimal/1000000000} Gwei
                 coinquery -> ${cqResultAsDecimal/1000000000} Gwei
              `);
            } else {
                console.log(`
                 INFO: GAS Prices match!`
                );
            }

        } catch (e) {
            throw new Error(e);
        }
    });
});
