const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;

const block = '44456116c03891b0ed03033ad4a2658d40032dd2b2aedac223f3cf47fc3c7279';
const cqURL = `${process.env.COIN_QUERY_SERVER}api/blocks/summary/${block}`;
const refURL = `https://cardanoexplorer.com/api/blocks/summary/${block}`

// Example response
// 20181002105616
// https://cardanoexplorer.com/api/blocks/summary/44456116c03891b0ed03033ad4a2658d40032dd2b2aedac223f3cf47fc3c7279

// {
//     "Right": {
//       "cbsEntry": {
//         "cbeEpoch": 7,
//         "cbeSlot": 18935,
//         "cbeBlkHash": "44456116c03891b0ed03033ad4a2658d40032dd2b2aedac223f3cf47fc3c7279",
//         "cbeTimeIssued": 1509605791,
//         "cbeTxNum": 0,
//         "cbeTotalSent": {
//           "getCoin": "0"
//         },
//         "cbeSize": 668,
//         "cbeBlockLead": "5071d8802ddd05c59f4db907bd1749e82e6242caf6512b20a8368fcf",
//         "cbeFees": {
//           "getCoin": "0"
//         }
//       },
//       "cbsPrevHash": "69597898147a8978f6575ca8fda06e1f803840efdbb001016c675fc3c4606915",
//       "cbsNextHash": "3f7ba5b1a113d8e7b687ebc10fd079e467838b8a245f9fbf1095100a659331a1",
//       "cbsMerkleRoot": "0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8"
//     }
//   }

describe('GET /blocks endpoint \n', () => {
    it('should be able to retrieve block info', async function () {
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
        expect(cqResponse.Right.cbsPrevHash).to.equal(refResponse.Right.cbsPrevHash);
        expect(cqResponse.Right.cbsNextHash).to.equal(refResponse.Right.cbsNextHash);
        expect(cqResponse.Right.cbsMerkleRoot).to.equal(refResponse.Right.cbsMerkleRoot);
    });
});
