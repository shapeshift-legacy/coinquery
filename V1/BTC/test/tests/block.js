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
        "hash": "00000000000000000008f57af80d13bcd5d545e0e184a40720bf7b7d7592bca2",
        "height": 574159,
        "time": 1556748729,
        "mediantime": 1556745382,
        "nonce": 1485092789,
        "previousblockhash": "0000000000000000000faa8d22ba1032ab2b6a8af50f3ac97556656979c7d769",
        "nextblockhash": "000000000000000000233a6beaeb50f25a3b77f508466468ecea9be7d94ee66d",
        "bits": "172c4e11",
        "difficulty": "6353030562983.983",
        "chainwork": "0000000000000000000000000000000000000000060c67c3bdcd206e67a84bf0",
        "version": 536870912,
        "versionHex": "20000000",
        "merkleroot": "baaebe0937631f63b00a92e436b6ca1a6ffe5e6245ffcdbf546d02dcde02172a",
        "size": 1250965,
        "strippedsize": 914136,
        "weight": 3993373,
        "nTx": 3175,
        "isOrphan": false,
        "confirmations": 32
    };

    beforeEach(() => {
        coinQueryURL = process.env.COIN_QUERY_BTC_SERVER;
        _blockhash = '00000000000000000008f57af80d13bcd5d545e0e184a40720bf7b7d7592bca2';
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
                confirmations: 32 // this value increases over time, so overwrite for test
            }).to.eql(expected);
        } catch (e) {
            throw new Error(e.message);
        }
    });
});