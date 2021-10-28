const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;

/* Example response
//
// https://github.com/shapeshift-legacy/coinquery/blob/master/V2/docs/API/V2.md#block
*/

describe('GET /block endpoint', () => {
    let coinQueryURL;
    let blockRequest;
    let _blockhash;
    const expected = {
        "hash": "000000000000000001ccff5b5355f4879377bb0e31e59b7ae740f780164cfdb4",
        "height": 582547,
        "time": 1557852822,
        "mediantime": 1557845979,
        "nonce": 213329723,
        "previousblockhash": "000000000000000002e12d9686d940ef564692698b90e327b6b2024c32d42685",
        "nextblockhash": "00000000000000000347e4bfee9b4bb742234c85f10a31a9f6400b919f6b42f4",
        "bits": "18038012",
        "difficulty": "314116735949.0665",
        "chainwork": "000000000000000000000000000000000000000000eada9f22edc2ac8ac3e651",
        "version": 541065216,
        "versionHex": "20400000",
        "merkleroot": "1ea166cf91bcd34a3596457c10ca81a9731ac30e774e3d0c158ce10a06fef3a3",
        "size": 135725,
        "strippedsize": 0,
        "weight": 0,
        "nTx": 0,
        "isOrphan": false,
        "confirmations": 1
    };

    beforeEach(() => {
        coinQueryURL = process.env.COIN_QUERY_BCH_SERVER;
        _blockhash = '000000000000000001ccff5b5355f4879377bb0e31e59b7ae740f780164cfdb4';
        const uri = `${coinQueryURL}block/${_blockhash}`
        blockRequest = () => request({
            uri,
            json: true,
            rejectUnauthorized : false,
        });
    });

    it('should be able to retrieve block details by block hash', async () => {
        try {
            const response = await blockRequest();

            expect({
                ...response,
                confirmations: 1 // this value increases over time, so overwrite for test
            }).to.eql(expected);
        } catch (e) {
            throw new Error(e.message);
        }
    });
});