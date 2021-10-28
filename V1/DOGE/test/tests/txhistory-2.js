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

const address = 'D59v2SCSjSxXmdqb44LhjBAeCH6bKVewXE';
const maxItems = 50;

// Example response
// 20180907132250
// https://api.blockcypher.com/v1/doge/main/addrs/D59v2SCSjSxXmdqb44LhjBAeCH6bKVewXE/full

const blockcypherResponse = {
  "address": "D59v2SCSjSxXmdqb44LhjBAeCH6bKVewXE",
  "total_received": 3046411201304,
  "total_sent": 3032033349609,
  "balance": 14377851695,
  "unconfirmed_balance": 0,
  "final_balance": 14377851695,
  "n_tx": 6,
  "unconfirmed_n_tx": 0,
  "final_n_tx": 6,
  "txs": [
    {
      "block_hash": "0fb84533692f423a48948a18b156eff6bbf76b76fc12a9bab14daf8872f81749",
      "block_height": 2379858,
      "block_index": 4,
      "hash": "e94a1639c5ba14610a62661c7ee97558df3b518a2b5aba19582ecdc8e12a55a6",
      "addresses": [
        "DG4kLZH4ioJfy1pN2otGv71eEd7E1c3ckU",
        "DH2n7aLJZYNV23Vm7jgS6GjxgXDFgRVEZr",
        "D59v2SCSjSxXmdqb44LhjBAeCH6bKVewXE",
        "DANY7xPX8FNDdbZUmxkeiD9up9r7HtP1fF",
        "DKiwjYYkg5NK3CPxdYSU9HTuRxBYEtuGZ1",
        "DNtToZjbpVC7ZoE9HustXmXcvWWNBMeUqB"
      ],
      "total": 5016902411340,
      "fees": 100000000,
      "size": 644,
      "preference": "high",
      "confirmed": "2018-09-07T16:00:25Z",
      "received": "2018-09-07T16:00:25Z",
      "ver": 1,
      "lock_time": 2379846,
      "double_spend": false,
      "vin_sz": 5,
      "vout_sz": 2,
      "confirmations": 198,
      "confidence": 1,
      "inputs": [
        {
          "prev_hash": "ccc8e81a1959b3923de4e5a8a311b6e25825d77076c1798f5a6cc27d6cb381ca",
          "output_index": 0,
          "script": "47304402202a4c5965b533454a91a692eb9fd7e83bbc6c1eb0d991f17fbb50e291906347fd022048c159add041dd7ee1b980dc63f6adeebeda2f5fb2d58f1119e17a39d22ddf1101",
          "output_value": 1003946400003,
          "sequence": 4294967294,
          "addresses": [
            "DH2n7aLJZYNV23Vm7jgS6GjxgXDFgRVEZr"
          ],
          "script_type": "pay-to-pubkey",
          "age": 2379216
        },
        {
          "prev_hash": "0ac5aa0129280486397f75037ec6c532864103a1d2872eb68654eb5dbcdc225b",
          "output_index": 0,
          "script": "4730440220143a7c829f90c23f7a5dcc55387ac421506583b712a657c34bd6a907f982168702204e5ebbccde0abbd3ee473e7d77b78f6e7a17fe777d5a9eb6de7ba4dbcfd9050601",
          "output_value": 1003700000000,
          "sequence": 4294967294,
          "addresses": [
            "D59v2SCSjSxXmdqb44LhjBAeCH6bKVewXE"
          ],
          "script_type": "pay-to-pubkey",
          "age": 2379112
        },
        {
          "prev_hash": "df835eeb57ffae2e43217f25401de908750e46b9fd3cd6bbee996e36c9054799",
          "output_index": 0,
          "script": "473044022047365aa79ed2b120a83f036c6cbca42a61cd5e1b587c40218f8f894513cb31c002200e6058a48e56bba1bd80f5bf1c17fdd62f6a0ff59fb894754c0e9c73716aa20e01",
          "output_value": 1000000000000,
          "sequence": 4294967294,
          "addresses": [
            "DANY7xPX8FNDdbZUmxkeiD9up9r7HtP1fF"
          ],
          "script_type": "pay-to-pubkey",
          "age": 2379590
        },
        {
          "prev_hash": "af306d8cd2bb1b5714f0daa7fc13b45cfdf66ba6e9aa6e5eec5f4eda5208119b",
          "output_index": 0,
          "script": "483045022100afbbd3fafc22eaea0d4286f186c9096f5c8b83ca2fcfad1b04100eceba3bd44d022077328d87ce52431670df50c66e38f0a37c08f597e23bf9d29f07a3478ecb14bf01",
          "output_value": 1003700775750,
          "sequence": 4294967294,
          "addresses": [
            "DANY7xPX8FNDdbZUmxkeiD9up9r7HtP1fF"
          ],
          "script_type": "pay-to-pubkey",
          "age": 2379580
        },
        {
          "prev_hash": "7d567dcd3c7d27ef2100d189cf55f4cb602853947a8c438f3c1bf92a4834a700",
          "output_index": 0,
          "script": "4730440220307d3cced77d9f777de2bcf11a40f8a9be2184a59a67773f4ba5d7904de79d8c022051e1f416751bd9f54d1ad43b1323b57a600be9107fa2c00464eb77ddfc46eeaa01",
          "output_value": 1005655235587,
          "sequence": 4294967294,
          "addresses": [
            "DKiwjYYkg5NK3CPxdYSU9HTuRxBYEtuGZ1"
          ],
          "script_type": "pay-to-pubkey",
          "age": 2379609
        }
      ],
      "outputs": [
        {
          "value": 16902411340,
          "script": "76a914c2adc65fc9d248799a72b4eb4fc046c6c9729bdc88ac",
          "addresses": [
            "DNtToZjbpVC7ZoE9HustXmXcvWWNBMeUqB"
          ],
          "script_type": "pay-to-pubkey-hash"
        },
        {
          "value": 5000000000000,
          "script": "76a91477d6db307542799bb420bcb2f05b7a37ef92aacc88ac",
          "addresses": [
            "DG4kLZH4ioJfy1pN2otGv71eEd7E1c3ckU"
          ],
          "script_type": "pay-to-pubkey-hash"
        }
      ]
    },
    {
      "block_hash": "5f884b39009cb31d2e22e473e4507fc841dfcdd38cd3d4884d2a7371232756d0",
      "block_height": 2379544,
      "block_index": 2,
      "hash": "8c3e131b12c0251f980dd08fc366b2001a4bc3b2123aa8b3cf4dc1917ccc42ed",
      "addresses": [
        "D59v2SCSjSxXmdqb44LhjBAeCH6bKVewXE",
        "D6RUF8KgpjznJizF3HgXQbuPRK2Lsoa1wL",
        "DG4kLZH4ioJfy1pN2otGv71eEd7E1c3ckU",
        "DGLU4b7HydUCcDf2N14EkTvXpT81JJC45b",
        "DH2n7aLJZYNV23Vm7jgS6GjxgXDFgRVEZr",
        "DJzBYZT7wunJC3gX4NhY41EBRSMiRYkM3M",
        "DKumgQJ4utZkrokHo7L6GRJBhHmhixXQ1p",
        "DKww3N85wDRiGLoiD1iRCuaLuexWx5wPzL"
      ],
      "total": 11100001090287,
      "fees": 300000000,
      "size": 1362,
      "preference": "high",
      "relayed_by": "47.93.115.207:22556",
      "confirmed": "2018-09-07T10:30:53Z",
      "received": "2018-09-07T10:30:03.447Z",
      "ver": 1,
      "lock_time": 2379533,
      "double_spend": false,
      "vin_sz": 11,
      "vout_sz": 2,
      "confirmations": 512,
      "confidence": 1,
      "inputs": [
        {
          "prev_hash": "ad76c53aeeda259085518b6b1c139a077f7696dc4187db0f5b38923ddb5b1eb3",
          "output_index": 0,
          "script": "47304402207b24259c1be6010561e0d0ef38b44c45a10c6264b5d317601b54183c035b728b022050a60ea7e6752422d0aee17e229793fa14373a23ec8c021d4c43c5792ad8f822012102165d2f794ad53be33e9a9e1aa6c517f56dfaaa45ced251701ee13328f1c0ac70",
          "output_value": 1007400000000,
          "sequence": 4294967294,
          "addresses": [
            "DJzBYZT7wunJC3gX4NhY41EBRSMiRYkM3M"
          ],
          "script_type": "pay-to-pubkey-hash",
          "age": 2379199
        },
        {
          "prev_hash": "a62126d0453362513d8f7993519881127e25311b13bb2bb69186a9142ed8359d",
          "output_index": 0,
          "script": "483045022100f472851cabc4cf6ab244bbcc5141131425ab2df8caaaa4f04118c6991c90377b02205466c5f7449e87cae48a55dfd210820d2ddf0426411465049f30115716d82c5c01",
          "output_value": 1011686303694,
          "sequence": 4294967294,
          "addresses": [
            "D6RUF8KgpjznJizF3HgXQbuPRK2Lsoa1wL"
          ],
          "script_type": "pay-to-pubkey",
          "age": 2379122
        },
        {
          "prev_hash": "299a90ba2fd914c8acb9540c1871f1a11baf7335c1230c29bb06ab2b28375697",
          "output_index": 0,
          "script": "483045022100925f79fdc2da55bc7ada1196feab752378826bae099652c0d4df17b924a0543b02201714d49db656b5bedc05acb42e17afbd70265fcc60d66cf2380939968c558df201",
          "output_value": 1011000000000,
          "sequence": 4294967294,
          "addresses": [
            "DH2n7aLJZYNV23Vm7jgS6GjxgXDFgRVEZr"
          ],
          "script_type": "pay-to-pubkey",
          "age": 2379294
        },
        {
          "prev_hash": "33717f34536171a412acd240db2c3045c0b3e205acabe0248ff92aa4b6624250",
          "output_index": 0,
          "script": "483045022100abc90207be6bbc726a8feb69328e96df28a636a6d4d2009829ed25a49da9b301022072e16334495254d69fb9d0e8e3cb1419ae8af243a4e6672a1116266de1e9be7001",
          "output_value": 1014400000000,
          "sequence": 4294967294,
          "addresses": [
            "D59v2SCSjSxXmdqb44LhjBAeCH6bKVewXE"
          ],
          "script_type": "pay-to-pubkey",
          "age": 2379110
        },
        {
          "prev_hash": "6a71c30f50a1659c9191a4d7635edadf84abb6c1efc0cacc748d373d04e79758",
          "output_index": 0,
          "script": "4730440220527fdcae90d57893d042a15f72489f99bb2b60f7683bb73026be9d77d35e21a002200a16d403f96dfdcfdd354d5cb62a00572bb8009b0db3a62b58000f6699ea9f8301",
          "output_value": 1005966984249,
          "sequence": 4294967294,
          "addresses": [
            "DGLU4b7HydUCcDf2N14EkTvXpT81JJC45b"
          ],
          "script_type": "pay-to-pubkey",
          "age": 2378957
        },
        {
          "prev_hash": "7e08a2bb893f7e2e59c45e0583f8206fca2b168a4d0f0556c8ef5fe4abbf7b5b",
          "output_index": 0,
          "script": "483045022100e334ca435062bebbb6d586d36bf45183315e442ea3242f8db5dac01b11683ddc02204c9502c9d09ec9d003c69b47430dc28d42f6100381eb8922e1b7621e443e7f7c01",
          "output_value": 1006470305906,
          "sequence": 4294967294,
          "addresses": [
            "DH2n7aLJZYNV23Vm7jgS6GjxgXDFgRVEZr"
          ],
          "script_type": "pay-to-pubkey",
          "age": 2379280
        },
        {
          "prev_hash": "86f7ff5e4ef97e84951d8583225fe875da51166a0837642a589fd6fe4ae07ea4",
          "output_index": 0,
          "script": "4730440220409e0c91eb48a08ce77a8577232198c9229efb47f849bb0b36f7a3a65d561e0e0220713b9b2ee5026dd5430f4a45c60041534776c2f83877114386193385ea6fef0c01",
          "output_value": 1000400452000,
          "sequence": 4294967294,
          "addresses": [
            "DKww3N85wDRiGLoiD1iRCuaLuexWx5wPzL"
          ],
          "script_type": "pay-to-pubkey",
          "age": 2352821
        },
        {
          "prev_hash": "5c7c79543cab593a4f8e6de0b9a89f4e14eb0679c39ca339d6d2e78134373aa2",
          "output_index": 0,
          "script": "483045022100e24c56ad6be78a3e53f42aae6a1e2cff840b607e356b6d0e78bec5d9fee0e0da02201defc1ca60bd9ccb8f7047856de2b2447b13237875245384d2027af8333e0d2701",
          "output_value": 1005207086888,
          "sequence": 4294967294,
          "addresses": [
            "DGLU4b7HydUCcDf2N14EkTvXpT81JJC45b"
          ],
          "script_type": "pay-to-pubkey",
          "age": 2378946
        },
        {
          "prev_hash": "bad13c5f9192b39c25629f67a7e641177fd5d80fa6a56491d646b26bcd725b19",
          "output_index": 0,
          "script": "483045022100dd683e58fa068a6cb3b2b28ead21b872d5c9e3de185c9ac5492930d961ae50c402206c0a7ad1083c92974b96397f6b2b5c33d237bd893e369be7c0403608ca89a5c401",
          "output_value": 1016670954584,
          "sequence": 4294967294,
          "addresses": [
            "DH2n7aLJZYNV23Vm7jgS6GjxgXDFgRVEZr"
          ],
          "script_type": "pay-to-pubkey",
          "age": 2379277
        },
        {
          "prev_hash": "1327a765c7de810c6dcb67984b49040e1b7dd42bf6696d826827db8afc1127f6",
          "output_index": 0,
          "script": "47304402206ad419798681a7aa958f7866648a3fbf01eabe830ebc8744ba97c49f6711059702202a7e34d53f371b7212e89c2605f6413a308114dab0d4233207e52b6f0732ace801",
          "output_value": 1007165653357,
          "sequence": 4294967294,
          "addresses": [
            "D6RUF8KgpjznJizF3HgXQbuPRK2Lsoa1wL"
          ],
          "script_type": "pay-to-pubkey",
          "age": 2379132
        },
        {
          "prev_hash": "00a8c8dc72dc85ff674677d43a2c0d09597c1af5973e0e76ec2848fba586d58f",
          "output_index": 0,
          "script": "48304502210080a5e900c2b9185572937e574a2675c45b9221e88838c3245a56b209c7e624360220347179c7815545a938725f658f1389adb11ee80854116aea0d967c82c47b5fa701",
          "output_value": 1013933349609,
          "sequence": 4294967294,
          "addresses": [
            "D59v2SCSjSxXmdqb44LhjBAeCH6bKVewXE"
          ],
          "script_type": "pay-to-pubkey",
          "age": 2379107
        }
      ],
      "outputs": [
        {
          "value": 1090287,
          "script": "76a914a204bc6eab9b974c18b8afb7806cd2991cb9a07288ac",
          "addresses": [
            "DKumgQJ4utZkrokHo7L6GRJBhHmhixXQ1p"
          ],
          "script_type": "pay-to-pubkey-hash"
        },
        {
          "value": 11100000000000,
          "script": "76a91477d6db307542799bb420bcb2f05b7a37ef92aacc88ac",
          "addresses": [
            "DG4kLZH4ioJfy1pN2otGv71eEd7E1c3ckU"
          ],
          "script_type": "pay-to-pubkey-hash"
        }
      ]
    },
    {
      "block_hash": "dfa7cb7311ec7475847d9093f43b1c8ec81a0dbd1182049c07fcc0ec37848563",
      "block_height": 2379115,
      "block_index": 2,
      "hash": "fe4b905f42eba8b0aa5dd4d3ef6eb142a0443e923bee527e75c22f57749a5107",
      "addresses": [
        "D59v2SCSjSxXmdqb44LhjBAeCH6bKVewXE",
        "D61VPRdzw4k2qpnAmGdh9UompQfvDv88db",
        "DG4kLZH4ioJfy1pN2otGv71eEd7E1c3ckU",
        "DHNuvhaaTW5dT897iSt7MRm7G1kyuheCjW",
        "DMMPwGN9Ev6Vyvz38X1QPDnkd46BMAuFCW",
        "DPJJLVoQ3Yk64RDHiEqwr26hgLEb2U1vqN",
        "DQiWHx4nFiVMmEUUCByzSuUujxMjNfdXGm",
        "DTguB9rQQyTgk6SMJaxjGWEugVCBDpb7VM"
      ],
      "total": 7014377851695,
      "fees": 100000000,
      "size": 873,
      "preference": "high",
      "relayed_by": "188.165.235.208:22556",
      "confirmed": "2018-09-07T03:00:51Z",
      "received": "2018-09-07T03:00:04.934Z",
      "ver": 1,
      "lock_time": 2379104,
      "double_spend": false,
      "vin_sz": 7,
      "vout_sz": 2,
      "confirmations": 941,
      "confidence": 1,
      "inputs": [
        {
          "prev_hash": "3437923fdd9e10cc717ad7f5ae2be29a8cadc27077bb52c79bf42b5f4abae5f3",
          "output_index": 0,
          "script": "483045022100d8d4d6cccf237272264eac80e8321eea23b60c8cd5d0a517db01c53162cac30502200db13b93695cab319332d32d093c700eece57b5c0b1b8249f5b31aa549d68ebf01",
          "output_value": 1001500000000,
          "sequence": 4294967294,
          "addresses": [
            "DQiWHx4nFiVMmEUUCByzSuUujxMjNfdXGm"
          ],
          "script_type": "pay-to-pubkey",
          "age": 2377553
        },
        {
          "prev_hash": "ae537d299ba451db2bff62e0eb5db64af0ba92bea358b3555acd4b634b9eacef",
          "output_index": 0,
          "script": "47304402206465cfe1cbe296bdcbb3d426f1f85182cd3bd37838a1429f384de6b1689e89d9022041c0c130c36c46a51e364a85063b023cd8626e75f317ac3fd3c69515a7f6946c01",
          "output_value": 1003431619718,
          "sequence": 4294967294,
          "addresses": [
            "D61VPRdzw4k2qpnAmGdh9UompQfvDv88db"
          ],
          "script_type": "pay-to-pubkey",
          "age": 2378852
        },
        {
          "prev_hash": "3b56928c6ad4440357341c94b86bbb764f4cf715b2523f8a35331c03aa7153e4",
          "output_index": 0,
          "script": "483045022100f3942c0a539d1969b4ed5abcb7a1fbd984564fc510f7e2f3cd021265cdba2c7a022051860680bd834e8f9d4dfaf6b0e32b12710f5e304e5503db9f1515e832f4ba5701",
          "output_value": 1003000000000,
          "sequence": 4294967294,
          "addresses": [
            "DPJJLVoQ3Yk64RDHiEqwr26hgLEb2U1vqN"
          ],
          "script_type": "pay-to-pubkey",
          "age": 2378870
        },
        {
          "prev_hash": "d3c65cb98804bf649d7b0731f1d7a794f6f141d8a37fb3ddba15de74a91c08f4",
          "output_index": 0,
          "script": "483045022100b1341633a079493e1fcafc43ca7a104a8554d875f6bd12266fb87dd78be2c8dd022031dffb30a40eae194d84fdef25b7834819ef046a4b9e6aecb7ab6b8bce29914c01",
          "output_value": 1001599999980,
          "sequence": 4294967294,
          "addresses": [
            "DHNuvhaaTW5dT897iSt7MRm7G1kyuheCjW"
          ],
          "script_type": "pay-to-pubkey",
          "age": 2378765
        },
        {
          "prev_hash": "7560629ce81c03d415d8cfdcb123a11393b5895bb3804467d7e6072fcfc3aeaa",
          "output_index": 0,
          "script": "47304402206dcceddef274b7c9e36da61d0c274d8c783e4a8ca4b5f25e64712fa90ac9fe01022005e867ced6b020ae629d7c172b6b3a910bd2eedcf01bc2b076b66ea18abb04c401",
          "output_value": 1003099999997,
          "sequence": 4294967294,
          "addresses": [
            "D61VPRdzw4k2qpnAmGdh9UompQfvDv88db"
          ],
          "script_type": "pay-to-pubkey",
          "age": 2378850
        },
        {
          "prev_hash": "6e783707240de37742c6a51f26a27d07068fcd4275cb978968f7fd1cb550c7cd",
          "output_index": 0,
          "script": "483045022100a657bc48e0e8f76a8c46c5390cc6981654219e8953b6c333c0d43f8ec3b8fe5202204269dcb4dfd90c4d4fd7f05be42063e551c8534543937519c4f4c282abb5103d01",
          "output_value": 1001542000000,
          "sequence": 4294967294,
          "addresses": [
            "DTguB9rQQyTgk6SMJaxjGWEugVCBDpb7VM"
          ],
          "script_type": "pay-to-pubkey",
          "age": 2377404
        },
        {
          "prev_hash": "a37bcd1c9ac08aaf11d04a0099bc7396e77db5f8951d8b71b12a514fa1a01ec3",
          "output_index": 0,
          "script": "473044022009c383eb4c2e09d2eff9050d2d2a97ec1a37c4b7e94eeb2a9c218bcab1ce936502203ddd5bc3706afd8cc2aab40dc596bd33a3b2187852fb5a2a19207e95ea94a68901",
          "output_value": 1000304232000,
          "sequence": 4294967294,
          "addresses": [
            "DMMPwGN9Ev6Vyvz38X1QPDnkd46BMAuFCW"
          ],
          "script_type": "pay-to-pubkey",
          "age": 2271081
        }
      ],
      "outputs": [
        {
          "value": 14377851695,
          "script": "76a9140027a39fb32decb82e98341877ac5c95caf0af0b88ac",
          "addresses": [
            "D59v2SCSjSxXmdqb44LhjBAeCH6bKVewXE"
          ],
          "script_type": "pay-to-pubkey-hash"
        },
        {
          "value": 7000000000000,
          "script": "76a91477d6db307542799bb420bcb2f05b7a37ef92aacc88ac",
          "addresses": [
            "DG4kLZH4ioJfy1pN2otGv71eEd7E1c3ckU"
          ],
          "script_type": "pay-to-pubkey-hash"
        }
      ]
    },
    {
      "block_hash": "54401c09cfdb00091604e0290094b260f597a311556c6ae3b0283c777bd140f0",
      "block_height": 2379112,
      "block_index": 0,
      "hash": "0ac5aa0129280486397f75037ec6c532864103a1d2872eb68654eb5dbcdc225b",
      "addresses": [
        "D59v2SCSjSxXmdqb44LhjBAeCH6bKVewXE"
      ],
      "total": 1003700000000,
      "fees": 0,
      "size": 101,
      "preference": "low",
      "confirmed": "2018-09-07T02:57:11.066693038Z",
      "received": "2018-09-07T02:57:11.066693038Z",
      "ver": 1,
      "double_spend": false,
      "vin_sz": 1,
      "vout_sz": 1,
      "confirmations": 944,
      "confidence": 1,
      "inputs": [
        {
          "output_index": -1,
          "script": "03684d240101",
          "output_value": 1000000000000,
          "sequence": 4294967295,
          "script_type": "empty",
          "age": 2379112
        }
      ],
      "outputs": [
        {
          "value": 1003700000000,
          "script": "2103a631b2a96aa69930f9c3e9e9592466486cd6349b1b92984313dc6cb4c930827bac",
          "addresses": [
            "D59v2SCSjSxXmdqb44LhjBAeCH6bKVewXE"
          ],
          "script_type": "pay-to-pubkey"
        }
      ]
    },
    {
      "block_hash": "3a53e7584dade37727fdeb9222cffc54dfb2419092a05d1a6b18b6651f67c0e2",
      "block_height": 2379110,
      "block_index": 0,
      "hash": "33717f34536171a412acd240db2c3045c0b3e205acabe0248ff92aa4b6624250",
      "addresses": [
        "D59v2SCSjSxXmdqb44LhjBAeCH6bKVewXE"
      ],
      "total": 1014400000000,
      "fees": 0,
      "size": 101,
      "preference": "low",
      "confirmed": "2018-09-07T02:55:31.48Z",
      "received": "2018-09-07T02:55:31.48Z",
      "ver": 1,
      "double_spend": false,
      "vin_sz": 1,
      "vout_sz": 1,
      "confirmations": 946,
      "confidence": 1,
      "inputs": [
        {
          "output_index": -1,
          "script": "03664d240101",
          "sequence": 4294967295,
          "script_type": "empty",
          "age": 2379110
        }
      ],
      "outputs": [
        {
          "value": 1014400000000,
          "script": "2103a631b2a96aa69930f9c3e9e9592466486cd6349b1b92984313dc6cb4c930827bac",
          "spent_by": "8c3e131b12c0251f980dd08fc366b2001a4bc3b2123aa8b3cf4dc1917ccc42ed",
          "addresses": [
            "D59v2SCSjSxXmdqb44LhjBAeCH6bKVewXE"
          ],
          "script_type": "pay-to-pubkey"
        }
      ]
    },
    {
      "block_hash": "e64a6ee2dda388483d4f24c059c64eee578e8fda718a52f18ed1ac881797bed7",
      "block_height": 2379107,
      "block_index": 0,
      "hash": "00a8c8dc72dc85ff674677d43a2c0d09597c1af5973e0e76ec2848fba586d58f",
      "addresses": [
        "D59v2SCSjSxXmdqb44LhjBAeCH6bKVewXE"
      ],
      "total": 1013933349609,
      "fees": 0,
      "size": 101,
      "preference": "low",
      "confirmed": "2018-09-07T02:51:27.106261877Z",
      "received": "2018-09-07T02:51:27.106261877Z",
      "ver": 1,
      "double_spend": false,
      "vin_sz": 1,
      "vout_sz": 1,
      "confirmations": 949,
      "confidence": 1,
      "inputs": [
        {
          "output_index": -1,
          "script": "03634d240101",
          "output_value": 1000000000000,
          "sequence": 4294967295,
          "script_type": "empty",
          "age": 2379107
        }
      ],
      "outputs": [
        {
          "value": 1013933349609,
          "script": "2103a631b2a96aa69930f9c3e9e9592466486cd6349b1b92984313dc6cb4c930827bac",
          "addresses": [
            "D59v2SCSjSxXmdqb44LhjBAeCH6bKVewXE"
          ],
          "script_type": "pay-to-pubkey"
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
