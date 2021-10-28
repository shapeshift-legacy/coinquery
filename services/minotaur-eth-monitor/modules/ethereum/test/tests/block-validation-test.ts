import BigNumber from 'bignumber.js'
import { hashTransactions, formatTransactions, hashBlockHeader } from '../../src/validation/hashing'
const { ethereumConfig } = require('../config/config')
import { createEthereumVillage, TransactionValidationFields } from '../../src'
import resetDb from './fixtures/fixture'
require('source-map-support').install()
const assert = require('assert')
const minute = 60 * 1000

describe('block validator', function() {
  it('hashes transactions for block 3058779', async function() {
    const transactionsRoot = await hashTransactions([
      {
        hash: '0x9c8df496044c924c44b5ca160b02592d9b4dcb242b681f1dab6b843154e2be0d',
        gasLimit: 21000,
        gasPrice: new BigNumber('20000000000'),
        inputData: '0x',
        nonce: 0,
        to: '0x6de1eb3a111f6e73001f5fec107884c8ab6b97da',
        amount: new BigNumber('99580000000000000'),
        v: '0x1c',
        r: '0x2cdebe859a19bb58e295b58040a07cd3c394cbbd183452c654532a0e2e66df08',
        s: '0x5c8b5490d7c5ca669999c5c2e757a16dfeb8f3d1e31833551b6ba16dd873e84e'
      },
      {
        hash: '0xa8bafb8525dee76b9b36e375083af635cf6375a0e4d00a1d81bfbb3ff7d4f768',
        gasLimit: 90000,
        gasPrice: new BigNumber('20000000000'),
        inputData: '0x',
        nonce: 1139719,
        to: '0x29e891114b021681b20055efada9ce380ebf2d42',
        amount: new BigNumber('1002087733382107800'),
        v: '0x25',
        r: '0xe5f46cc532e14de8b7ae1b976693c2ac9bcd74b6d3038b757ccdef5680a8e589',
        s: '0xf21886a8881f94998288167c9cfc49dee47197add5a821bddc3fb1353d88a32'
      },
      {
        hash: '0x72d881cbef632140b1d546d2c2abf7f9933a81943c8a410222ba81132ff5ac8b',
        gasLimit: 90000,
        gasPrice: new BigNumber('20000000000'),
        inputData: '0x',
        nonce: 1139720,
        to: '0x2f926cc236c12034695c187137f3ab9508289d37',
        amount: new BigNumber('1102208544575080600'),
        v: '0x25',
        r: '0x4e5a8a7147b21d5209edb64470a374ae3f27d21877d8f65d63c0f67a6d4b87d5',
        s: '0x41c3921b2e09b63b6675d23536f17c62954a8dc43d676fc222d73ce3b954724f'
      }
    ])
    assert.strictEqual(
      transactionsRoot,
      '0xc7913b9f058bb9844017e2998803a0987f7f07b592d39a812da9b9cab0b21aa9'
    )
  })

  xit('hashes transactions for block 3826842', async function() {
    const transactionsRoot = await hashTransactions([
      {
        hash: '0x326b12ba6645e0edcacba5eaa8805bb867f6df3df328e4df7caa8a2834d4a644',
        gasLimit: 70000,
        gasPrice: new BigNumber('41000000000'),
        inputData:
          '0xf5537ede000000000000000000000000888666ca69e0f178ded6d75b5726cee99a87d698000000000000000000000000cf40d0d2b44f2b66e07cace1372ca42b73cf21a300000000000000000000000000000000000000000000000ac9ae05a71ebc0000',
        nonce: 19020,
        to: '0xe8ee7d0f82376b2d9307a7a50e1eb9b98944e3c0',
        amount: new BigNumber('0'),
        v: '0x1c',
        r: '0xcf49a28fe2dfc876dfe052aba2adb26c3ebf9e14cc8bc5f21e478fbc2fd84760',
        s: '0x4eb654a8d1617d9b2749649653e84a909cf98a9045a49c1609d2f35b9ff19d98'
      }
    ])
    assert.strictEqual(
      transactionsRoot,
      '0xa4758e62bacdcf5d1fdca32ab933e8072172ed365d787a13da161cb53c60fc62'
    )
  })

  xit('an invalid transaction is identified with hashTransactions', async function() {
    const transactionsRoot = await hashTransactions([
      {
        hash: '0x326b12ba6645e0edcacba5eaa8805bb867f6df3df328e4df7caa8a2834d4a644',
        gasLimit: 395,
        gasPrice: new BigNumber('41000000000'),
        inputData:
          '0xf5537ede000000000000000000000000888666ca69e0f178ded6d75b5726cee99a87d698000000000000000000000000cf40d0d2b44f2b66e07cace1372ca42b73cf21a300000000000000000000000000000000000000000000000ac9ae05a71ebc0000',
        nonce: 19020,
        to: '0xe8ee7d0f82376b2d9307a7a50e1eb9b98944e3c0',
        amount: new BigNumber('0'),
        v: '0x1c',
        r: '0xcf49a28fe2dfc876dfe052aba2adb26c3ebf9e14cc8bc5f21e478fbc2fd84760',
        s: '0x4eb654a8d1617d9b2749649653e84a909cf98a9045a49c1609d2f35b9ff19d98'
      }
    ])
    assert(transactionsRoot !== '0xa4758e62bacdcf5d1fdca32ab933e8072172ed365d787a13da161cb53c60fc62', 'generated transactionsRoot should not be correct')
  })

  xit('scans and generates transactionsRoot for block 4000038', async function() {
    const village = await createEthereumVillage(ethereumConfig)
    const model = village.model
    await resetDb('block-validation')

    const transactions = await model.Transaction.filter({ blockIndex: 4000038 })
    assert(transactions.length > 0, 'Transactions for block 4000038 should exist in the DB')

    const transactionsWithValidationFields = formatTransactions(transactions)
    const generatedTransactionsRoot = await hashTransactions(transactionsWithValidationFields)
    assert.equal(
      '0xbff4f8d9a87bd587652f79dd35b48ff454d309681c9e6896408eeb08fc37f85b',
      generatedTransactionsRoot,
      'The generated transactionsRoot should be correct'
    )
  })

  xit('block 4000105 - saves right data', async function() {
    const village = await createEthereumVillage(ethereumConfig)
    const model = village.model
    await resetDb('block-validation')

    const transactions: TransactionValidationFields[] = [
      {
        hash: '0x1fb85b3284ec03b2e452e767aeb24e78147576c80514a069fab680510e25b31a',
        gasLimit: 21000,
        gasPrice: new BigNumber('51000000000'),
        inputData: '0x',
        nonce: 23057,
        to: '0x2a18Cf51914A075A75e7F6eA987AB98bc732Aa3F',
        amount: new BigNumber('443255720000000000'),
        v: '0x1c',
        r: '0xc931e98e0714653c88085a024351af74665478c11c83154ecbd25a9b6cb7bb1c',
        s: '0x4ce16b0befa14a62710b3be3b2585830b1c8d0c5ac1c73953569e252981bb66b'
      },
      {
        hash: '0xeb5b6bc627312dc42d963067efb1cce5c7553ca33c7f68e937fc85c2f815699d',
        gasLimit: 21000,
        gasPrice: new BigNumber('51000000000'),
        inputData: '0x',
        nonce: 22806,
        to: '0xEC45fC32c8c65eEF67Bd731C4d794eEc5495F4Ec',
        amount: new BigNumber('509294260000000000'),
        v: '0x1c',
        r: '0xa6e59eeba606917785967b308ce67c818beec29a38e929895d395ed65d38a0b8',
        s: '0x4669045354449e6c82d1bc3e5e17897c78fa13d258948de0f5fa5baa8fde4ded'
      },
      {
        hash: '0x815ec1b460a05e094da4cc8e5daf959664abb7d917755c62da2227bbeb9a5a7b',
        gasLimit: 170000,
        gasPrice: new BigNumber('30000000000'),
        inputData:
          '0xa9059cbb000000000000000000000000aca33c43bd8deac8e1d144baa51fe9c7dd7b010f0000000000000000000000000000000000000000000000000000009bf035f980',
        nonce: 53,
        to: '0xB64ef51C888972c908CFacf59B47C1AfBC0Ab8aC',
        amount: new BigNumber('0'),
        v: '0x1b',
        r: '0x618f86c8b064036794bacc11e5b6f10945e54dfcbf07caf20d75e5a2ffe3e223',
        s: '0xfa00578dfa5c54911b9367e8077a5eb9873e5aa6d6844b980719eb9ec75fccb'
      },
      {
        hash: '0x1828175076b519418c4b9e5fe1f6cc384dd707da4cdd3feab9e1680cc7b3e7a8',
        gasLimit: 21000,
        gasPrice: new BigNumber('51000000000'),
        inputData: '0x',
        nonce: 22807,
        to: '0x535572062F89D2469FbC13647Ca8BD7AD13B39Af',
        amount: new BigNumber('5000000000000000'),
        v: '0x1b',
        r: '0x36cec5047df933b97608dde1f408c32c6a8a71ed728a7d11a1b7fa4258ffa840',
        s: '0x6e55567febd43ba8ace26e9b07f3d2916bd61b3a98ca4ba6d4cac153cf4a1720'
      }
    ]

    const unformattedDbTransactions = await model.Transaction.filter({ blockIndex: 4000105 })
    const dbTransactions = formatTransactions(unformattedDbTransactions)

    assert.deepEqual(dbTransactions, transactions, 'Database should have correct data')
  })

  xit('block 4000129 - saves right data', async function() {
    const village = await createEthereumVillage(ethereumConfig)
    const model = village.model
    await resetDb('block-validation')

    const transactions: TransactionValidationFields[] = [
      {
        hash: '0x1a931edc3b92f86d60d487827f673b36a2f0561710593996a0110c3edaebf4b1',
        gasLimit: 250000,
        gasPrice: new BigNumber('21000000000'),
        inputData: '0xdc6dd1520000000000000000000000000000000000000000000000000000000000000057',
        nonce: 68,
        to: '0xEce701C76bD00D1C3f96410a0C69eA8Dfcf5f34E',
        amount: new BigNumber('100000000000000000'),
        v: '0x26',
        r: '0x3a062088e68a65b9a000dbb9640e1915c0ac52fa8577c286d9715a81dbacf0',
        s: '0x4298dedc9f74b9d01044ace61f03a0adc02151d55b757c19dbf9328d21e00cb7'
      },
      {
        hash: '0x98bce053603fa88eb8dd3a7292113315e45305a4b60355032e6a21ce240080d9',
        gasLimit: 300000,
        gasPrice: new BigNumber('21000000000'),
        inputData:
          '0x47872b42f012669f0f506b2259382b3deeefcfc00cdf29996a02d52d26ff69a298d8e84800000000000000000000000000000000000000000000000000b1a2bc2ec5000027e1c480be8d4da943dbb52b63fa36bcdf4b793b9f25633eae3308d2d9a8d7b7',
        nonce: 513,
        to: '0x6090A6e47849629b7245Dfa1Ca21D94cd15878Ef',
        amount: new BigNumber('0'),
        v: '0x26',
        r: '0x2efbe669dd35572b3093ca15ecd92081f91e9118788d8da23fd8e298b701e910',
        s: '0x5313a60f424d35d06b446f09b4982896943d9b891d4257d21fb8279dada2e515'
      },
      {
        hash: '0xcb0673188ffbc2e131d8767cabf36601a9a8369160efee224f744e05cbf39d9b',
        gasLimit: 50000,
        gasPrice: new BigNumber('21000000000'),
        inputData: '0x',
        nonce: 627766,
        to: '0x2462f798756f29e54E8C6CAA93CC421d6a11fDed',
        amount: new BigNumber('1008071092719094800'),
        v: '0x25',
        r: '0x2b40745316f3c6b6bab0ed23bb586b65f556d6c6079174e38dff63ffda58021e',
        s: '0x1ae27605221a37f27da007a34abf167dc923febf1fbb6941def72aea44e0ec78'
      },
      {
        hash: '0xf469f844147ac7fd12f6bc46eab2e8f0a9e90ed3df41810837851ece665e6e6a',
        gasLimit: 31500,
        gasPrice: new BigNumber('21000000000'),
        inputData: '0x',
        nonce: 40,
        to: '0xFeA012E2Ef9B0894ac658630Abc145BA27b76099',
        amount: new BigNumber('250000000000000000'),
        v: '0x25',
        r: '0x51a5aa49c76be2b2099779e4f9190f918406c9747128d1bcdd57cc6cde0080f2',
        s: '0x5033dba9c54715c11929216e940f7ae2f1d68d1344e183fb279c1622684ad2d4'
      },
      {
        hash: '0xfb5ab5fe428fed6d0be8fc629dd330023398ef3c66b7b4e42b0438f16d396220',
        gasLimit: 50000,
        gasPrice: new BigNumber('21000000000'),
        inputData: '0x',
        nonce: 2377874,
        to: '0xF867521F5A502BAe176b6192BF3AB7b0f984A17F',
        amount: new BigNumber('1001050873308843908'),
        v: '0x25',
        r: '0xe3850712fe3c957817a961aa85c99a36da4ff63363d2e20887419445593ee006',
        s: '0x428a2b0870fdefaa221558ccf2c88c9fa0979c2ead67a4619f5e3b4a0867eee7'
      },
      {
        hash: '0x7632d7d9aa56b6931236b57e9259408017d58c861726fec30e775f3d5fde7f95',
        gasLimit: 250000,
        gasPrice: new BigNumber('4000000000'),
        inputData:
          '0x0a19b14a0000000000000000000000002e071d2966aa7d8decb1005885ba1977d6038a650000000000000000000000000000000000000000000000000595aedb9e83400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b34e344a6b0140000000000000000000000000000000000000000000000000000000000003d307900000000000000000000000000000000000000000000000000000000b99f951200000000000000000000000066b11623fd6dbd894f0b3a66996499a80c886751000000000000000000000000000000000000000000000000000000000000001bd4f36b0dccf254205ee91732e3583694916cc960323dd6296c3651a3a329d5a116e438d36cef3274e9f44c0ad315d7d48e4905affba6d24329bf388c85bfa65e00000000000000000000000000000000000000000000000000f8b0a10e470000',
        nonce: 21,
        to: '0x8d12A197cB00D4747a1fe03395095ce2A5CC6819',
        amount: new BigNumber('0'),
        v: '0x26',
        r: '0x5f37f1f19ea8dcaa52ca99b2ffc8d404f5b74794c5b494498b8f71418eb6b5f1',
        s: '0x6e17af104112f698e5fcae4399842fc2e393818b05cd624e00597507c0bf795c'
      },
      {
        hash: '0xf777166c9875d5dabf2403877559074524c310680536f8b465e61e0946a67549',
        gasLimit: 50000,
        gasPrice: new BigNumber('21000000000'),
        inputData: '0x',
        nonce: 2377875,
        to: '0x268B915b8F16CDa06A8Dee578EFB84E6E3e2F4DB',
        amount: new BigNumber('49013146058434898'),
        v: '0x26',
        r: '0x39935bd7059ca90ad0e8f984a5af194accf4cec5ce7c672a3deed8da86822038',
        s: '0x64a012d6349ceff96b2fd33b4cd7eec0848cf771adaa6e273122a936037c02b5'
      }
    ]

    const unformattedDbTransactions = await model.Transaction.filter({ blockIndex: 4000129 })
    const dbTransactions = formatTransactions(unformattedDbTransactions)

    assert.deepEqual(dbTransactions, transactions, 'Data should save correctly')
  })

  xit('hashes header for block 1235813', function () {
    const blockHeader = {
      parentHash: '0x225c2adb8ebc5f13be2d09b2dbc59a4943b86871428ceaa50d259ef26755a4d6',
      uncleHash: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
      coinbase: '0xf8b483dba2c3b7176a3da549ad41a48bb3121069',
      stateRoot: '0xd2c38d2adf269b51852e1ded43ad37a6245b57dfcf601cce0241870f8394d2ea',
      transactionsRoot: '0xcfa91a2154513ba1e8c4b3e6a8c0e819f8976603fc9767eafcf9dcf251a2edc3',
      receiptsRoot: '0xb2bac80b1b4f8bf4dfeaace66721ca5185e3e657befc26142d5d8b0be0b7a5b8',
      bloom:
      '0x00000000000000000010000000000040000000040008000000000000000000000000000000000000000000000000000000001000000000000000000000000010008000000000000000000000000000000000000000002000000000008010000000000000000010000004000000000008000000010000000000001000000000000004000000200000000000000000000000000001000000000000000000010000000000000000000000000000000000000000000000400000010000000000000000000000000000000000000000000010000000000000010040000000000000000000000000000002000000000000000000000000000000400000000000000000',
      // difficulty: '0x14a44b957d64',
      difficulty: '22695875280228',
      // index: '0x12db65',
      index: 1235813,
      // gasLimit: '0x47e7c4',
      gasLimit: '4712388',
      // gasUsed: '0x18f8ce',
      gasUsed: 1636558,
      // timeMined: '0x56f9ce4d',
      timeMined: new Date('Mon Mar 28 2016 18:37:33 GMT-0600 (Mountain Daylight Time)'),
      extraData: '0xd983010305844765746887676f312e342e328777696e646f7773',
      mixHash: '0xf66ccfc627b4bcac907f4aba189e4b40562b745887159055dff711f735977604',
      nonce: '0xdb2882830dbda813'
    }
    const generatedHash = hashBlockHeader(blockHeader)
    assert.equal(generatedHash, '0x517f8681beaef0087c23f6da5e5f92d6dc8cccdda9ce93eb37cc4cad75740c10', 'The generated hash should be correct')
  })

  xit('hashes header for block 1235814', function () {
    const blockHeader = {
      parentHash: '0x517f8681beaef0087c23f6da5e5f92d6dc8cccdda9ce93eb37cc4cad75740c10',
      uncleHash: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
      coinbase: '0x2a65aca4d5fc5b5c859090a6c34d164135398226',
      stateRoot: '0x06d51569e46b18a475d6e5b5c01c85e6cb06c9c41d30d5837c845642884bc401',
      transactionsRoot: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
      receiptsRoot: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
      bloom:
      '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      // difficulty: '0x14a6e01ef413',
      difficulty: '22706957251603',
      // index: '0x12db66',
      index: 1235814,
      // gasLimit: '0x47e7c4',
      gasLimit: '4712388',
      // gasUsed: '0x0',
      gasUsed: 0,
      // timeMined: '0x56f9ce55',
      timeMined: new Date('Mon Mar 28 2016 18:37:41 GMT-0600 (Mountain Daylight Time)'),
      extraData: '0xd783010305844765746887676f312e352e31856c696e7578',
      mixHash: '0x2d54da2b561721511cc898248066b7eea1b0b9c38df0dcb48d5f2402c96acaaf',
      nonce: '0x3f354d861777b482'
    }
    const generatedHash = hashBlockHeader(blockHeader)
    assert.equal(generatedHash, '0xbc038446f1eed4cfc34126d53e1f075eff9d7b39309296ef629251089973061c', 'The generated hash should be correct')
  })

  xit('pulls correct data from DB for block 1235813', async function() {
    const blockHeader = {
      parentHash: '0x225c2adb8ebc5f13be2d09b2dbc59a4943b86871428ceaa50d259ef26755a4d6',
      uncleHash: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
      coinbase: '0xf8b483dba2c3b7176a3da549ad41a48bb3121069',
      stateRoot: '0xd2c38d2adf269b51852e1ded43ad37a6245b57dfcf601cce0241870f8394d2ea',
      transactionsRoot: '0xcfa91a2154513ba1e8c4b3e6a8c0e819f8976603fc9767eafcf9dcf251a2edc3',
      receiptsRoot: '0xb2bac80b1b4f8bf4dfeaace66721ca5185e3e657befc26142d5d8b0be0b7a5b8',
      bloom:
      '0x00000000000000000010000000000040000000040008000000000000000000000000000000000000000000000000000000001000000000000000000000000010008000000000000000000000000000000000000000002000000000008010000000000000000010000004000000000008000000010000000000001000000000000004000000200000000000000000000000000001000000000000000000010000000000000000000000000000000000000000000000400000010000000000000000000000000000000000000000000010000000000000010040000000000000000000000000000002000000000000000000000000000000400000000000000000',
      difficulty: '22695875280228',
      index: 1235813,
      gasLimit: '4712388',
      gasUsed: '1636558',
      timeMined: new Date('Mon Mar 28 2016 18:37:33 GMT-0600 (Mountain Daylight Time)'),
      extraData: '0xd983010305844765746887676f312e342e328777696e646f7773',
      mixHash: '0xf66ccfc627b4bcac907f4aba189e4b40562b745887159055dff711f735977604',
      nonce: '0xdb2882830dbda813'
    }

    const village = await createEthereumVillage(ethereumConfig)
    const model = village.model
    await resetDb('block-validation')

    const block: any = await model.ground.query('SELECT * FROM blocks WHERE index = 1235813;')

    const dbBlockHeader = {
      parentHash: block[0].parentHash,
      uncleHash: block[0].uncleHash,
      coinbase: block[0].coinbase,
      stateRoot: block[0].stateRoot,
      transactionsRoot: block[0].transactionsRoot,
      receiptsRoot: block[0].receiptsRoot,
      bloom: block[0].bloom,
      difficulty: block[0].difficulty,
      index: block[0].index,
      gasLimit: block[0].gasLimit,
      gasUsed: block[0].gasUsed,
      timeMined: block[0].timeMined,
      extraData: block[0].extraData,
      mixHash: block[0].mixHash,
      nonce: block[0].nonce
    }

    assert.deepEqual(dbBlockHeader, blockHeader, 'The data from the DB should be correct')

    const generatedHash = hashBlockHeader(dbBlockHeader)
    assert.equal(generatedHash, '0x517f8681beaef0087c23f6da5e5f92d6dc8cccdda9ce93eb37cc4cad75740c10', 'The hash generated from DB block header data should be correct')
  })

})