const chai = require('chai');
const request = require('request-promise');
const expect = chai.expect;
const coinQueryURL = process.env.COIN_QUERY_DOGE_SERVER;

/* The /addrs endpoint returns an array of transactions, with the most recent
 * (aka highest block number) at index 0.  This means the transaction at index 0
 * will change over time as more transactions are added to the blockchain.
 *
 * For this reason, only the oldest transaction is verified.
 */

const address = 'D6cLWQTCnvCxUZS5G99dsDmKc3vGuo26w6';
const maxItems = 50;

// Example response
// https://api.blockcypher.com/v1/doge/main/addrs/D6cLWQTCnvCxUZS5G99dsDmKc3vGuo26w6/full

const blockcypherResponse = {
  "address": "D6cLWQTCnvCxUZS5G99dsDmKc3vGuo26w6",
  "total_received": 319978000000000,
  "total_sent": 319978000000000,
  "balance": 0,
  "unconfirmed_balance": 0,
  "final_balance": 0,
  "n_tx": 6,
  "unconfirmed_n_tx": 0,
  "final_n_tx": 6,
  "txs": [
    {
      "block_hash": "01c8d756172008a3673b2c0722cda0777086b56614131d76bd3d04f465cc0aac",
      "block_height": 289289,
      "block_index": 2,
      "hash": "76c3e87d2adf2d031b65c6a2f6953d50902580c7ade2a1c68d387e99147a2c9d",
      "addresses": [
        "D6cLWQTCnvCxUZS5G99dsDmKc3vGuo26w6",
        "D9C2dFiQSnrRttGf7eSFN6mHJBJxcH6unn"
      ],
      "total": 605311143829170,
      "fees": 0,
      "size": 372,
      "preference": "low",
      "confirmed": "2014-07-07T01:10:43Z",
      "received": "2014-07-07T01:10:43Z",
      "ver": 1,
      "double_spend": false,
      "vin_sz": 2,
      "vout_sz": 1,
      "confirmations": 2010718,
      "confidence": 1,
      "inputs": [
        {
          "prev_hash": "0fe664f94c56578743174dab7564f09490446c6ed5ae3021e6cc1cf11498e4e7",
          "output_index": 0,
          "script": "48304502207d15119ccd57b099b63ea4ea0f1bdedd1c56ccb252ce2c30064996684478b9cd022100a99ebd6878c4b38977fdc6af9e3d16b7af0bf560e263c77222355922afd1acb5014104f4da83f7c607ac00bb41d098c55032a96f73451501493aa86ba0db49cf315bcbeecc5b674cb0d7a2c605dd5b6cc8466df20004d0ad799aaebdf2624413ed2c42",
          "output_value": 295433143829170,
          "sequence": 4294967295,
          "addresses": [
            "D9C2dFiQSnrRttGf7eSFN6mHJBJxcH6unn"
          ],
          "script_type": "pay-to-pubkey-hash",
          "age": 289284
        },
        {
          "prev_hash": "2ac7b42623d7861b44605e069d938794b381552105bcb24cf8997e7741899134",
          "output_index": 0,
          "script": "483045022100f24b060eb3aa247c977316364601c1c2ddf27e1f9b6a721c654df1b543b00d4b022032afbd0363a2d4e0166a4a478408ad34ce2ede925fa8a2bef4e1390d4c004bab012102a6f42739adf1fd5501e922e7c114bb247fb42987a717f7c82991ed2bf8b9f65f",
          "output_value": 309878000000000,
          "sequence": 4294967295,
          "addresses": [
            "D6cLWQTCnvCxUZS5G99dsDmKc3vGuo26w6"
          ],
          "script_type": "pay-to-pubkey-hash",
          "age": 289288
        }
      ],
      "outputs": [
        {
          "value": 605311143829170,
          "script": "76a9142c6e7be07833d7a12ae69fc14cca4f915f053c1988ac",
          "spent_by": "1ddb10d7770036b3a84e4d94644af7d0e7fc5db5a14236833be2ff074157adf1",
          "addresses": [
            "D9C2dFiQSnrRttGf7eSFN6mHJBJxcH6unn"
          ],
          "script_type": "pay-to-pubkey-hash"
        }
      ]
    },
    {
      "block_hash": "f72c630d799864f9415c8c72fcf301eef10d231f60363c7ecf5b0c44cfbd1579",
      "block_height": 289288,
      "block_index": 1,
      "hash": "2ac7b42623d7861b44605e069d938794b381552105bcb24cf8997e7741899134",
      "addresses": [
        "D6cLWQTCnvCxUZS5G99dsDmKc3vGuo26w6",
        "DDuVKLJyHqpPBKZGVt4wREo3c6tR4GaafX"
      ],
      "total": 309878472619250,
      "fees": 100000000,
      "size": 374,
      "preference": "high",
      "confirmed": "2014-07-07T01:09:23Z",
      "received": "2014-07-07T01:09:23Z",
      "ver": 1,
      "double_spend": false,
      "vin_sz": 2,
      "vout_sz": 2,
      "confirmations": 2010719,
      "confidence": 1,
      "inputs": [
        {
          "prev_hash": "2e8337e8c010560e9146ebb590f6fc59619d599afa83478dda37fc56a4f3a101",
          "output_index": 1,
          "script": "48304502207993acbcca914803bf01af5950d6ceabf3bb74b7ea4248db82cd995703ec96ee0221009c7278c17f1b065cf17a81f4f4a4b180003bbaf0469e0f717ceed02ba1db494f012102f8ae61694000cff50ae14e80994c34fa6bb672d8503e904adc0f43dd7ec14f04",
          "output_value": 307178772619250,
          "sequence": 4294967295,
          "addresses": [
            "DDuVKLJyHqpPBKZGVt4wREo3c6tR4GaafX"
          ],
          "script_type": "pay-to-pubkey-hash",
          "age": 283421
        },
        {
          "prev_hash": "51036921387b4d4805986001318bc8c44e49413014036391543bb3474769be8e",
          "output_index": 1,
          "script": "483045022100ecf6ba20f63e59a7299274d0544a85edc960eee2baa8f4da9d60ba501173333f022032f07ac53b3fd30355285f371776ec56b9c716f60543ca22b5fed4cdcb9c8ab9012102f8ae61694000cff50ae14e80994c34fa6bb672d8503e904adc0f43dd7ec14f04",
          "output_value": 2699800000000,
          "sequence": 4294967295,
          "addresses": [
            "DDuVKLJyHqpPBKZGVt4wREo3c6tR4GaafX"
          ],
          "script_type": "pay-to-pubkey-hash",
          "age": 282575
        }
      ],
      "outputs": [
        {
          "value": 309878000000000,
          "script": "76a914101f0445d2cee10c1f820dac0fdab961c35c594088ac",
          "spent_by": "76c3e87d2adf2d031b65c6a2f6953d50902580c7ade2a1c68d387e99147a2c9d",
          "addresses": [
            "D6cLWQTCnvCxUZS5G99dsDmKc3vGuo26w6"
          ],
          "script_type": "pay-to-pubkey-hash"
        },
        {
          "value": 472619250,
          "script": "76a9146026526eeaff25b0dbf335e95241ff7ff990a59888ac",
          "addresses": [
            "DDuVKLJyHqpPBKZGVt4wREo3c6tR4GaafX"
          ],
          "script_type": "pay-to-pubkey-hash"
        }
      ]
    },
    {
      "block_hash": "82e76769e46b13c75a297f30e70b53a1760281df4b73f2694fa20f7be46eb871",
      "block_height": 125110,
      "block_index": 10,
      "hash": "f7cc45d1b7de298f31ca8d2f1a9b10b7090156c2221ce3b56ea4d2f3a3c03552",
      "addresses": [],
      "total": 50000000000191,
      "fees": 7500000000,
      "size": 74224,
      "preference": "high",
      "confirmed": "2014-03-03T18:21:17Z",
      "received": "2014-03-03T18:21:17Z",
      "ver": 1,
      "double_spend": false,
      "vin_sz": 501,
      "vout_sz": 2,
      "confirmations": 2174897,
      "confidence": 1,
      "inputs": [],
      "outputs": [
        {
          "value": 49999900000000,
          "script": "76a914eb17c249135f10a97c34db85e3c1a301c4c3d03e88ac",
          "spent_by": "11e27696176229d228a7dc3fc9c167c02c060cc862505528e47c4c3f6767925e",
          "addresses": [
            "DSa9o8wruryB6QKVMgGn7TRb6PN93WVLXD"
          ],
          "script_type": "pay-to-pubkey-hash"
        },
        {
          "value": 100000191,
          "script": "76a914ff1dae5fa998435e021e189c5bb7702ce59473cc88ac",
          "spent_by": "276143db7c21f9eeae72b499884e857615ada6e469d5bd6342ef36cec9e0eb4c",
          "addresses": [
            "DUQ2QTV99hUNEfZATtn3Jy21wZzaeWdWLt"
          ],
          "script_type": "pay-to-pubkey-hash"
        }
      ],
      "next_inputs": "https://api.blockcypher.com/v1/doge/main/txs/f7cc45d1b7de298f31ca8d2f1a9b10b7090156c2221ce3b56ea4d2f3a3c03552?instart=20\u0026outstart=0\u0026limit=20"
    },
    {
      "block_hash": "cb8253d60d1a117dbab0fec5b57b580a0e0d544982d9a21dac0b58ed834fd342",
      "block_height": 104407,
      "block_index": 3,
      "hash": "a4bbf7a87f683369738cc44eb255dede9fcd992163d53377788b511a635f2c13",
      "addresses": [],
      "total": 4999999901000000,
      "fees": 7600000000,
      "size": 74361,
      "preference": "high",
      "confirmed": "2014-02-17T06:34:46Z",
      "received": "2014-02-17T06:34:46Z",
      "ver": 1,
      "double_spend": false,
      "vin_sz": 502,
      "vout_sz": 2,
      "confirmations": 2195600,
      "confidence": 1,
      "inputs": [],
      "outputs": [
        {
          "value": 4999999900000000,
          "script": "76a9140321ac36a56eb140f1e0fbe9f94f2739c2698e2488ac",
          "spent_by": "3c12d3899f4bb49d18b6f9dc488a7c39702c851e8631ec8bce30a8138a96b611",
          "addresses": [
            "D5ReuTL4BrwNvSLYVnWA1DczBNk9LdaqCu"
          ],
          "script_type": "pay-to-pubkey-hash"
        },
        {
          "value": 1000000,
          "script": "76a914e8661a4fc15acaf63e47f66aaa2a4626eb10665788ac",
          "spent_by": "51b6b4d366d16f6cbc8a53c3f65c26375279f63d3bf4efd9a3589aa5ce0cb56c",
          "addresses": [
            "DSKuczHrMPmeK2Jaxaiigt4Bv3iL8yazGF"
          ],
          "script_type": "pay-to-pubkey-hash"
        }
      ],
      "next_inputs": "https://api.blockcypher.com/v1/doge/main/txs/a4bbf7a87f683369738cc44eb255dede9fcd992163d53377788b511a635f2c13?instart=20\u0026outstart=0\u0026limit=20"
    },
    {
      "block_hash": "13ab3b961fcc500c03f51279385c42e9f055d48a37dfa72d0073c0d3f595036b",
      "block_height": 100000,
      "block_index": 1,
      "hash": "19220173c151925d493a25dbe67798fa11e6e4db01b927b1c04cddead85d3d12",
      "addresses": [
        "D6cLWQTCnvCxUZS5G99dsDmKc3vGuo26w6",
        "DDuVKLJyHqpPBKZGVt4wREo3c6tR4GaafX"
      ],
      "total": 388939672619250,
      "fees": 100000000,
      "size": 226,
      "preference": "high",
      "confirmed": "2014-02-14T02:59:41Z",
      "received": "2014-02-14T02:59:41Z",
      "ver": 1,
      "double_spend": false,
      "vin_sz": 1,
      "vout_sz": 2,
      "confirmations": 2200007,
      "confidence": 1,
      "inputs": [
        {
          "prev_hash": "0b50ae7e1ff3f3c63c44e4f5580d24fda1716cfceca6945f4301c652b662b316",
          "output_index": 1,
          "script": "483045022100ca9176c3eccd6ab443b1259698c35a40f8274e5b87222e2a69a1d1937398c59f02205390042fa802df9a26923e6d972ed837cb7f297e307cb84a3cdee61c8d6f3a08012102f8ae61694000cff50ae14e80994c34fa6bb672d8503e904adc0f43dd7ec14f04",
          "output_value": 388939772619250,
          "sequence": 4294967295,
          "addresses": [
            "DDuVKLJyHqpPBKZGVt4wREo3c6tR4GaafX"
          ],
          "script_type": "pay-to-pubkey-hash",
          "age": 96711
        }
      ],
      "outputs": [
        {
          "value": 10000000000000,
          "script": "76a914101f0445d2cee10c1f820dac0fdab961c35c594088ac",
          "spent_by": "a4bbf7a87f683369738cc44eb255dede9fcd992163d53377788b511a635f2c13",
          "addresses": [
            "D6cLWQTCnvCxUZS5G99dsDmKc3vGuo26w6"
          ],
          "script_type": "pay-to-pubkey-hash"
        },
        {
          "value": 378939672619250,
          "script": "76a9146026526eeaff25b0dbf335e95241ff7ff990a59888ac",
          "spent_by": "ec5f70c3350f6206e61d6472237332da675f15b3828b1bd2e16b64808c7fbdda",
          "addresses": [
            "DDuVKLJyHqpPBKZGVt4wREo3c6tR4GaafX"
          ],
          "script_type": "pay-to-pubkey-hash"
        }
      ]
    },
    {
      "block_hash": "ef15b695f1303604aca4167c531f4ea7285efb4cdd2aead014dbf8d394d55bfe",
      "block_height": 96711,
      "block_index": 2,
      "hash": "0b50ae7e1ff3f3c63c44e4f5580d24fda1716cfceca6945f4301c652b662b316",
      "addresses": [
        "D6cLWQTCnvCxUZS5G99dsDmKc3vGuo26w6",
        "D6jYPgubJ3CwdTa4ACJShj7w8Ytap7uBvY",
        "DDuVKLJyHqpPBKZGVt4wREo3c6tR4GaafX"
      ],
      "total": 389039772619250,
      "fees": 100000000,
      "size": 226,
      "preference": "high",
      "confirmed": "2014-02-11T19:56:27Z",
      "received": "2014-02-11T19:56:27Z",
      "ver": 1,
      "double_spend": false,
      "vin_sz": 1,
      "vout_sz": 2,
      "confirmations": 2203296,
      "confidence": 1,
      "inputs": [
        {
          "prev_hash": "78620ee08fbd6d3638b1eab944d7556a962b25ed4ce685edfd5fcc1321952095",
          "output_index": 0,
          "script": "48304502200215ec86ee623ad6e51e6dcdf6a868c6b352738d6301e3a513d8a8cf12b8b610022100f024241af5e2d6c48ad1511b020904376a366a37433f8a3a1c42c3d6cd859d4e0121024b5e4f2e626480968cc9d8cc549447c5e2fb203aeb4a6c96bd9de0ae68b4f70a",
          "output_value": 389039872619250,
          "sequence": 4294967295,
          "addresses": [
            "D6jYPgubJ3CwdTa4ACJShj7w8Ytap7uBvY"
          ],
          "script_type": "pay-to-pubkey-hash",
          "age": 92745
        }
      ],
      "outputs": [
        {
          "value": 100000000000,
          "script": "76a914101f0445d2cee10c1f820dac0fdab961c35c594088ac",
          "spent_by": "f7cc45d1b7de298f31ca8d2f1a9b10b7090156c2221ce3b56ea4d2f3a3c03552",
          "addresses": [
            "D6cLWQTCnvCxUZS5G99dsDmKc3vGuo26w6"
          ],
          "script_type": "pay-to-pubkey-hash"
        },
        {
          "value": 388939772619250,
          "script": "76a9146026526eeaff25b0dbf335e95241ff7ff990a59888ac",
          "spent_by": "19220173c151925d493a25dbe67798fa11e6e4db01b927b1c04cddead85d3d12",
          "addresses": [
            "DDuVKLJyHqpPBKZGVt4wREo3c6tR4GaafX"
          ],
          "script_type": "pay-to-pubkey-hash"
        }
      ]
    }
  ]
};

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
      .then(cqResponse => {
        expect(cqResponse).to.have.property('from');
        expect(cqResponse).to.have.property('to');
        expect(cqResponse).to.have.property('totalItems');
        expect(cqResponse.totalItems).to.be.below(maxItems);
        const totalItemsActual = cqResponse.totalItems - 1;
        const totalItemsExpected = blockcypherResponse.n_tx - 1;
        expect(cqResponse.items[totalItemsActual].txid).to.equal(blockcypherResponse.txs[totalItemsExpected].hash);
        expect(cqResponse.items[totalItemsActual].blockhash).to.equal(blockcypherResponse.txs[totalItemsExpected].block_hash);
        expect(cqResponse.items[totalItemsActual].vin[0].txid).to.equal(blockcypherResponse.txs[totalItemsExpected].inputs[0].prev_hash);
        expect(cqResponse.items[totalItemsActual].vout[0].txid).to.equal(blockcypherResponse.txs[totalItemsExpected].outputs[0].prev_hash);
        return done();
      }).catch(err => done(err));
  });
});
