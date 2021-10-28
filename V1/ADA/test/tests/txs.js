const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;

const tx = 'b49b04f770337211731c9cc2d6a4bee45f64041e3fb1e1eb5e4498469b2cd03c';
const cqURL = `${process.env.COIN_QUERY_SERVER}api/txs/summary/${tx}`;
const refURL = `https://cardanoexplorer.com/api/txs/summary/${tx}`


describe('GET /txs endpoint \n', () => {
    it('should be able to retrieve tx info', async function () {
        const blockRequest = async (url) => {
            console.log(url);
            return request({
                uri: `${url}`,
                json: true,
                rejectUnauthorized : false,
            });
        };
        
        let cqResponse;
        let refResponse;
        try {
            cqResponse = await blockRequest(cqURL);
            refResponse = await blockRequest(refURL);

        } catch(err) {
            console.log(err);
        }

        expect(cqResponse).to.have.property('Right');
        expect(cqResponse.Right.ctsId).to.equal(refResponse.Right.ctsId);
        expect(cqResponse.Right.ctsTxTimeIssued).to.equal(refResponse.Right.ctsTxTimeIssued);
        expect(cqResponse.Right.ctsBlockHeight).to.equal(refResponse.Right.ctsBlockHeight);
    });
});


// Example response
// 20181002141237
// https://ada-stage.redacted.example.com/api/txs/summary/b49b04f770337211731c9cc2d6a4bee45f64041e3fb1e1eb5e4498469b2cd03c

// {
    //     "Right": {
    //       "ctsId": "b49b04f770337211731c9cc2d6a4bee45f64041e3fb1e1eb5e4498469b2cd03c",
    //       "ctsTxTimeIssued": 1538511091,
    //       "ctsBlockTimeIssued": 1538511091,
    //       "ctsBlockHeight": 1615003,
    //       "ctsBlockEpoch": 74,
    //       "ctsBlockSlot": 17000,
    //       "ctsBlockHash": "48bed01dc50520e85cb92bad3e19f32360ceb2715f033fa1568cb81972e643ea",
    //       "ctsRelayedBy": null,
    //       "ctsTotalInput": {
    //         "getCoin": "885022937792"
    //       },
    //       "ctsTotalOutput": {
    //         "getCoin": "885022763514"
    //       },
    //       "ctsFees": {
    //         "getCoin": "174278"
    //       },
    //       "ctsInputs": [
    //         [
    //           "DdzFFzCqrhsfkegDcdUJAGBRoUP2LVakkby6ntdckcURzBsKmNJ7HmQ6LBwLZxTRVBvhZzuFuX9KUpraDcqhJavm35yeXgS2keJPHfKB",
    //           {
    //             "getCoin": "885022937792"
    //           }
    //         ]
    //       ],
    //       "ctsOutputs": [
    //         [
    //           "DdzFFzCqrht9ZsFs1VNsx6EY3aGyRHUn7befjeTGpE1pBNuznn9B7hmQQwgzBjF9HiFbgbwq27416BGqK5MvQRxVWPnbRvF91TtWVbJp",
    //           {
    //             "getCoin": "800250079244"
    //           }
    //         ],
    //         [
    //           "Ae2tdPwUPEZ2vX1x53FXw99tXfksgJ2egUQvtLL3qPC4S1oZSuQkjom5XtJ",
    //           {
    //             "getCoin": "2190213000"
    //           }
    //         ],
    //         [
    //           "Ae2tdPwUPEZJDowBWg6RnRAW7gYcJCXcPnGwZsLmWpn9EoDXNF8Mr9Tdwpa",
    //           {
    //             "getCoin": "73231688000"
    //           }
    //         ],
    //         [
    //           "Ae2tdPwUPEZL2sBmNLT3RjxioAP9cPCxpZEMtgYi16htYrso2FHzciSFYRG",
    //           {
    //             "getCoin": "9350783270"
    //           }
    //         ]
    //       ]
    //     }
    //   }