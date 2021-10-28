const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;

/* Example response
// 
// https://insight.bitpay.com/api/tx/dafb36c13077175a15941a33cbce062643ec12bb81ed96c4438538eaafe94722

{"txid":"dafb36c13077175a15941a33cbce062643ec12bb81ed96c4438538eaafe94722","version":1,"locktime":0,"vin":[{"txid":"ce50664046791942770631d7178e1e92d158f75f669c32f69ea36b458a3fe4f4","vout":1,"sequence":4294967295,"n":0,"scriptSig":{"hex":"4830450221009536c0c84b91b2ccb13bd4b54a5a9369efb63aa1f995d93ad19cad62cbdcc5750220078c7adbdfa533a3ec6229032d5a4a8f322c9db6647ecaef65ac8cabfa068344012102f5b03a1d8042175d6052d1cb63e2e6b3edcac0cc733778a3191bcfe394c2724a","asm":"30450221009536c0c84b91b2ccb13bd4b54a5a9369efb63aa1f995d93ad19cad62cbdcc5750220078c7adbdfa533a3ec6229032d5a4a8f322c9db6647ecaef65ac8cabfa068344[ALL] 02f5b03a1d8042175d6052d1cb63e2e6b3edcac0cc733778a3191bcfe394c2724a"},"addr":"1LSv14zeqxi7xbTQkB9renUXwJVknLiGvk","valueSat":22484223,"value":0.22484223,"doubleSpentTxID":null},{"txid":"681e7e933c1a1fc790f01f536f6a3e61fd6a4ec611bbc58e771def18d754411b","vout":5,"sequence":4294967295,"n":1,"scriptSig":{"hex":"473044022057df52909635200e1d303410c88249ca3e3813f96eb4d7bc0471b08bd9dfa39c02206bb5f1c146032378c7995fd1a5710518b95f9c92345a9bdd144ead5e5f0d53520121030becc53697783afcd7eabedcb6affd34647129baf3114ffcbe984b00a63a78e0","asm":"3044022057df52909635200e1d303410c88249ca3e3813f96eb4d7bc0471b08bd9dfa39c02206bb5f1c146032378c7995fd1a5710518b95f9c92345a9bdd144ead5e5f0d5352[ALL] 030becc53697783afcd7eabedcb6affd34647129baf3114ffcbe984b00a63a78e0"},"addr":"1BaMQzbFQZMcK4fc8Ttfh1pFyM1UPs84Pr","valueSat":154236,"value":0.00154236,"doubleSpentTxID":null}],"vout":[{"value":"0.22623499","n":0,"scriptPubKey":{"hex":"a9149ef8a06958392646c039f50b3c8272c9014f27b687","asm":"OP_HASH160 9ef8a06958392646c039f50b3c8272c9014f27b6 OP_EQUAL","addresses":["3GBaXjSMv1N4peYU3xPJEW2X6cEK3tp74e"],"type":"scripthash"},"spentTxId":"35dff0ac5301ae122492e383881676c97c02d6b44704399ec42cf9e931e4b1ad","spentIndex":9,"spentHeight":513553}],"blockhash":"0000000000000000004dcc39acd8f0da141e9ea704193fed4ea4c63891b9d065","blockheight":513543,"confirmations":10659,"time":1521060481,"blocktime":1521060481,"valueOut":0.22623499,"size":337,"valueIn":0.22638459,"fees":0.0001496}
*/

describe('GET /tx endpoint', () => {
    let coinQueryURL;
    let txRequest;
    let _blockhash;
    let _txid;

    beforeEach(() => {
        coinQueryURL = process.env.COIN_QUERY_BTC_SERVER;
        _blockhash = '00000000018bca603a7fbe68ebb226004076e0ac35d4faf47840f8546fdf2ad1';
        _txid = 'dafb36c13077175a15941a33cbce062643ec12bb81ed96c4438538eaafe94722';
        txRequest = () => request({
            uri: `${coinQueryURL}api/tx/${_txid}`,
            json: true,
            rejectUnauthorized : false,
        });
    });

    it('should be able to retrieve tx details by txid', async () => {
        try {
            const { txid, blockhash } = await txRequest();
            expect(txid).to.equal(_txid);
            expect(blockhash).to.equal(_blockhash);
        } catch (e) {
            throw new Error(e.message);
        }
    });
});
