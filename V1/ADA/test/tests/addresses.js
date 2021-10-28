const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;

const tx = 'DdzFFzCqrht9ZsFs1VNsx6EY3aGyRHUn7befjeTGpE1pBNuznn9B7hmQQwgzBjF9HiFbgbwq27416BGqK5MvQRxVWPnbRvF91TtWVbJp';
const cqURL = `${process.env.COIN_QUERY_SERVER}api/addresses/summary/${tx}`;
const refURL = `https://cardanoexplorer.com/api/addresses/summary/${tx}`


describe('GET /addresses endpoint \n', () => {
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
        expect(cqResponse.Right.caAddress).to.equal(refResponse.Right.caAddress);
        expect(cqResponse.Right.caType).to.equal(refResponse.Right.caType);
        expect(cqResponse.Right.caTxNum).to.equal(refResponse.Right.caTxNum);
        
    });
});


// Example response
// 20181002143316
// https://ada-stage.redacted.example.com/api/addresses/summary/DdzFFzCqrht9ZsFs1VNsx6EY3aGyRHUn7befjeTGpE1pBNuznn9B7hmQQwgzBjF9HiFbgbwq27416BGqK5MvQRxVWPnbRvF91TtWVbJp

// {
//     "Right": {
//       "caAddress": "DdzFFzCqrht9ZsFs1VNsx6EY3aGyRHUn7befjeTGpE1pBNuznn9B7hmQQwgzBjF9HiFbgbwq27416BGqK5MvQRxVWPnbRvF91TtWVbJp",
//       "caType": "CPubKeyAddress",
//       "caTxNum": 2,
//       "caBalance": {
//         "getCoin": "0"
//       },
//       "caTxList": [
//         {
//           "ctbId": "b85648f8b5b4ec566a538a78ac54f910b1b246ae9f693818468152c0ee4f245b",
//           "ctbTimeIssued": 1538511411,
//           "ctbInputs": [
//             [
//               "DdzFFzCqrht9ZsFs1VNsx6EY3aGyRHUn7befjeTGpE1pBNuznn9B7hmQQwgzBjF9HiFbgbwq27416BGqK5MvQRxVWPnbRvF91TtWVbJp",
//               {
//                 "getCoin": "800250079244"
//               }
//             ]
//           ],
//           "ctbOutputs": [
//             [
//               "DdzFFzCqrhssYDE6k5Q8PNKzhCsbmLBwLWCL2VfvztaMgkXRGM9stZg8N3S45BRuqdM32sKWugUbLo4nTXEAcgbaA6pUM28yydgnuwJ1",
//               {
//                 "getCoin": "672152854187"
//               }
//             ],
//             [
//               "DdzFFzCqrhshN8CT8wyWtS2ArHqzMSWJzEDRNxY6SNs2BCKZBXEmzP8f9SjTdpCRva94CmkmWuF8qNaDJ7BM3yr7pCNHfvXBAAPpcxHD",
//               {
//                 "getCoin": "503495000"
//               }
//             ],
//             [
//               "DdzFFzCqrhsqwwEz6cQrZjMx9YHuca7CaoYYakoi7CS8MM7ZtGfppz4kYWxbQvvf2hqoHWwavmoQaaDaN4XEMSABUXhhr9SKWDjHvY3F",
//               {
//                 "getCoin": "3910336000"
//               }
//             ],
//             [
//               "DdzFFzCqrhsqjQN5Bdi9kQinim4dQQnc5iFML4mSUT2i35sGc7dHweEBcK1KX7mfJmR67AMyZPpUxPLmcpGauqPkjN3GDYBRrF8iQzMw",
//               {
//                 "getCoin": "121492385000"
//               }
//             ],
//             [
//               "DdzFFzCqrhsfW9kmZzubTPoPypSU1yvx3W91z4t694zeFSKF2FFnAgtZxwhm6b7p47t49KZjTb7swxqVuf1B7FuyYEwgjG5VYFS4wYSi",
//               {
//                 "getCoin": "2190827000"
//               }
//             ]
//           ],
//           "ctbInputSum": {
//             "getCoin": "800250079244"
//           },
//           "ctbOutputSum": {
//             "getCoin": "800249897187"
//           }
//         },
//         {
//           "ctbId": "b49b04f770337211731c9cc2d6a4bee45f64041e3fb1e1eb5e4498469b2cd03c",
//           "ctbTimeIssued": 1538511091,
//           "ctbInputs": [
//             [
//               "DdzFFzCqrhsfkegDcdUJAGBRoUP2LVakkby6ntdckcURzBsKmNJ7HmQ6LBwLZxTRVBvhZzuFuX9KUpraDcqhJavm35yeXgS2keJPHfKB",
//               {
//                 "getCoin": "885022937792"
//               }
//             ]
//           ],
//           "ctbOutputs": [
//             [
//               "DdzFFzCqrht9ZsFs1VNsx6EY3aGyRHUn7befjeTGpE1pBNuznn9B7hmQQwgzBjF9HiFbgbwq27416BGqK5MvQRxVWPnbRvF91TtWVbJp",
//               {
//                 "getCoin": "800250079244"
//               }
//             ],
//             [
//               "Ae2tdPwUPEZ2vX1x53FXw99tXfksgJ2egUQvtLL3qPC4S1oZSuQkjom5XtJ",
//               {
//                 "getCoin": "2190213000"
//               }
//             ],
//             [
//               "Ae2tdPwUPEZJDowBWg6RnRAW7gYcJCXcPnGwZsLmWpn9EoDXNF8Mr9Tdwpa",
//               {
//                 "getCoin": "73231688000"
//               }
//             ],
//             [
//               "Ae2tdPwUPEZL2sBmNLT3RjxioAP9cPCxpZEMtgYi16htYrso2FHzciSFYRG",
//               {
//                 "getCoin": "9350783270"
//               }
//             ]
//           ],
//           "ctbInputSum": {
//             "getCoin": "885022937792"
//           },
//           "ctbOutputSum": {
//             "getCoin": "885022763514"
//           }
//         }
//       ]
//     }
//   }