const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;

const coinQueryURL = process.env.COIN_QUERY_BTC_SERVER;

/* The /addrs endpoint returns an array of transactions, with the most recent
 * (aka highest block number) at index 0.  This means the transaction at index 0
 * will change over time as more transactions are added to the blockchain.
 *
 * For this reason, only the oldest transaction is verified.
 */

const address = '18zuLTKQnLjp987LdxuYvjekYnNAvXif2b';

describe('GET /addrs/{addr}/utxo endpoint', () => {
    it('should be able to retrieve transaction history for utxos', done => {
        const txhistRequest = () => new Promise((resolve, reject) => {
            const uri = `${coinQueryURL}api/addrs/${address}/utxo`
            return request({
                uri: uri,
                json: true,
                rejectUnauthorized : false,
            }).then(res => {
                resolve(res);
            }).catch(err => {
                reject(err);
            });
        });

        txhistRequest()
        .then(res => {
	        const myTxid = "3bdd34ec039de4742bfd5681924863ac4cb2cf1911df9580719dcc03e59253af"
	        const got = res.find(({ txid }) => txid === myTxid);

	        if (res.length > 0) {
		        expect(got).to.have.property('address');
		        expect(got).to.have.property('txid');
		        expect(got).to.have.property('vout');
		        expect(got).to.have.property('scriptPubKey');
		        expect(got).to.have.property('reqSigs');
		        expect(got).to.have.property('type');
		        expect(got).to.have.property('amount');
		        expect(got).to.have.property('satoshis');
		        expect(got).to.have.property('blockheight');
		        expect(got).to.have.property('confirmations');
		        expect(got).to.have.property('ts');
	        } else {
	        	console.warn(`No UTXOs for ${address}`);
	        }

	        return done();

        }).catch(err => {
            return done(err);
        });
    });
});
