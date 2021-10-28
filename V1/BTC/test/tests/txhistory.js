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

const address = '122m5XTfngY3WQEhfw779Exd2XLd1hpPqi';
const maxItems = 50;

// Example response
// 
// https://insight.bitpay.com/api/addrs/122m5XTfngY3WQEhfw779Exd2XLd1hpPqi/txs?from0&to=50
const expectedResponse =
{
    "totalItems": 2,
    "from": 0,
    "to": 2,
    "items": [
        {
            "txid": "dafb36c13077175a15941a33cbce062643ec12bb81ed96c4438538eaafe94722",
            "version": 1,
            "locktime": 0,
            "vin": [
                {
                    "txid": "6bfe0a971cda46af1609ea0b5629ce9558eee011c7f27d07b8e92008539eae07",
                    "vout": 1,
                    "sequence": 4294967295,
                    "n": 0,
                    "scriptSig": {
                        "hex": "4930460221008d988f8b9dde18c9a8bbb98a3a9cb8cddf54f9773fe46fa0cc75c73a9b10667a022100cf529068451418eb9ae7b170677c0df8a03f7d4fb42449bbc10df1425a7ff626014104d539578a64c03caa52ef2c0680ab0e33fbdfd789c6825c5f94744e0998bcc6987f3ba38b2cdcf790a336fcf132dadea7325eda62a50748727581e6e5a983c75e",
                        "asm": "30460221008d988f8b9dde18c9a8bbb98a3a9cb8cddf54f9773fe46fa0cc75c73a9b10667a022100cf529068451418eb9ae7b170677c0df8a03f7d4fb42449bbc10df1425a7ff626[ALL] 04d539578a64c03caa52ef2c0680ab0e33fbdfd789c6825c5f94744e0998bcc6987f3ba38b2cdcf790a336fcf132dadea7325eda62a50748727581e6e5a983c75e"
                    },
                    "addr": "122m5XTfngY3WQEhfw779Exd2XLd1hpPqi",
                    "valueSat": 2396000000,
                    "value": 23.96,
                    "doubleSpentTxID": null
                }
            ],
            "vout": [
                {
                    "value": "23.95000000",
                    "n": 0,
                    "scriptPubKey": {
                        "hex": "76a91423c09f06bfda3f73e8488638806566ab6998ab0188ac",
                        "asm": "OP_DUP OP_HASH160 23c09f06bfda3f73e8488638806566ab6998ab01 OP_EQUALVERIFY OP_CHECKSIG",
                        "addresses": [
                            "14G3QGdQffKybkaMAX3GLU28gxdZQmiPM4"
                        ],
                        "type": "pubkeyhash"
                    },
                    "spentTxId": "ab21b0d07d758ffbc78cef8331a41e7f3a69ef98ccd8532b0238fc4b29512792",
                    "spentIndex": 0,
                    "spentHeight": 67320
                },
                {
                    "value": "0.01000000",
                    "n": 1,
                    "scriptPubKey": {
                        "hex": "76a9145431ec2a065938df9412407a5610ff75a59e32e888ac",
                        "asm": "OP_DUP OP_HASH160 5431ec2a065938df9412407a5610ff75a59e32e8 OP_EQUALVERIFY OP_CHECKSIG",
                        "addresses": [
                            "18gBZnsuSrhYLjvPUgwvDUJmksfREUGBTT"
                        ],
                        "type": "pubkeyhash"
                    },
                    "spentTxId": "fe5e7a550b9db63eebcc2296053347ab3d35fea310d949df198da62026e7229d",
                    "spentIndex": 57,
                    "spentHeight": 77288
                }
            ],
            "blockhash": "00000000018bca603a7fbe68ebb226004076e0ac35d4faf47840f8546fdf2ad1",
            "blockheight": 67320,
            "confirmations": 483668,
            "time": 1279129456,
            "blocktime": 1279129456,
            "valueOut": 23.96,
            "size": 259,
            "valueIn": 23.96,
            "fees": 0
        },
        {
            "txid": "6bfe0a971cda46af1609ea0b5629ce9558eee011c7f27d07b8e92008539eae07",
            "version": 1,
            "locktime": 0,
            "vin": [
                {
                    "txid": "75ad211b5689d891e2d1a1f29007a07d1ef35caf3c6dbaa4f9d9f7ca1a2735c5",
                    "vout": 1,
                    "sequence": 4294967295,
                    "n": 0,
                    "scriptSig": {
                        "hex": "48304502202bb757d9050bdc08c250dadef9d616e096fd873e62cfae4bbeba8f408b8efc71022100e1c6903a5e0f33ee2c047d4e9e36b99cfefe0af5b86379d94a4a67961494644b014104109f882c1808ec524f33876332f612c336d489bbca9afd7d9d569c60024f0a26e628a3a2913fbf8030e63658e0e8353ce43f2e957176937131aabc082903c6ae",
                        "asm": "304502202bb757d9050bdc08c250dadef9d616e096fd873e62cfae4bbeba8f408b8efc71022100e1c6903a5e0f33ee2c047d4e9e36b99cfefe0af5b86379d94a4a67961494644b[ALL] 04109f882c1808ec524f33876332f612c336d489bbca9afd7d9d569c60024f0a26e628a3a2913fbf8030e63658e0e8353ce43f2e957176937131aabc082903c6ae"
                    },
                    "addr": "196zMhxev2q7xnTbKk7j6TJMpn2nfUxgHc",
                    "valueSat": 2397000000,
                    "value": 23.97,
                    "doubleSpentTxID": null
                }
            ],
            "vout": [
                {
                    "value": "0.01000000",
                    "n": 0,
                    "scriptPubKey": {
                        "hex": "76a9145431ec2a065938df9412407a5610ff75a59e32e888ac",
                        "asm": "OP_DUP OP_HASH160 5431ec2a065938df9412407a5610ff75a59e32e8 OP_EQUALVERIFY OP_CHECKSIG",
                        "addresses": [
                            "18gBZnsuSrhYLjvPUgwvDUJmksfREUGBTT"
                        ],
                        "type": "pubkeyhash"
                    },
                    "spentTxId": "2fb4856494cc682786202fe7b601700c20a967715db40af75ebad7307b2493d3",
                    "spentIndex": 35,
                    "spentHeight": 77554
                },
                {
                    "value": "23.96000000",
                    "n": 1,
                    "scriptPubKey": {
                        "hex": "76a9140b4d5612c3edf17d213bb5059d8c99fb9926498188ac",
                        "asm": "OP_DUP OP_HASH160 0b4d5612c3edf17d213bb5059d8c99fb99264981 OP_EQUALVERIFY OP_CHECKSIG",
                        "addresses": [
                            "122m5XTfngY3WQEhfw779Exd2XLd1hpPqi"
                        ],
                        "type": "pubkeyhash"
                    },
                    "spentTxId": "dafb36c13077175a15941a33cbce062643ec12bb81ed96c4438538eaafe94722",
                    "spentIndex": 0,
                    "spentHeight": 67320
                }
            ],
            "blockhash": "00000000018bca603a7fbe68ebb226004076e0ac35d4faf47840f8546fdf2ad1",
            "blockheight": 67320,
            "confirmations": 483668,
            "time": 1279129456,
            "blocktime": 1279129456,
            "valueOut": 23.97,
            "size": 258,
            "valueIn": 23.97,
            "fees": 0
        }
    ]
}

describe('GET /addrs endpoint', () => {
    it('should be able to retrieve transaction history', done => {
        const txhistRequest = () => new Promise((resolve, reject) => {
            const uri = `${coinQueryURL}api/addrs/${address}/txs?from=0&to=${maxItems}`
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
            	const myTxid = "6bfe0a971cda46af1609ea0b5629ce9558eee011c7f27d07b8e92008539eae07"
	            const got = res.items.find(({ txid }) => txid === myTxid);
            	const want = expectedResponse.items[1];

                expect(res).to.have.property('totalItems');
                expect(res).to.have.property('from');
                expect(res).to.have.property('to');
                expect(res).to.have.property('items');
                expect(res.totalItems).to.be.below(maxItems);

                expect(got.txid).to.equal(want.txid);
                expect(got.blockheight).to.equal(want.blockheight);
                expect(got.blockhash).to.equal(want.blockhash);
                expect(got.vin[0].txid).to.equal(want.vin[0].txid);
                expect(got.vout[0].txid).to.equal(want.vout[0].txid);
                return done();
            }).catch(err => {
                return done(err);
            });
    });
});
