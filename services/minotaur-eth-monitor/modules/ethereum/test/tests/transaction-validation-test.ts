require('source-map-support').install()

const { ethereumConfig } = require('../config/config')
import {
  createEthereumVillage,
  hashSingleTransaction,
  initializeMultiProvider,
  validateTransactionAction
} from '../../src'
import { resetEthereumDb } from '../../src/fixtures';
import { BigNumber } from 'bignumber.js';
import { innerServiceLoop } from '../../../common/src'
import { scanTestBlocks, timeoutService } from '../src/ethereum-utility';

const assert = require('assert')
const Web3 = require('web3')

const second = 1000
const minute = 60 * second

describe('transaction validator', function () {
  this.timeout(1 * minute)
  
  it('generates correct tx hash from tx contents', async function () {
    const transactions = [
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
    ]

    const hashedTransaction0 = hashSingleTransaction(transactions[0])
    const hashedTransaction1 = hashSingleTransaction(transactions[1])
    const hashedTransaction2 = hashSingleTransaction(transactions[2])
    assert.equal(hashedTransaction0, transactions[0].hash, 'hashSingleTransaction should generate the correct hash')
    assert.equal(hashedTransaction1, transactions[1].hash, 'hashSingleTransaction should generate the correct hash')
    assert.equal(hashedTransaction2, transactions[2].hash, 'hashSingleTransaction should generate the correct hash')
  })

  it('generates incorrect hash when contents are incorrect', async function () {
    const transaction =
      {
        hash: '0x9c8df496044c924c44b5ca160b02592d9b4dcb242b681f1dab6b843154e2be0d',
        gasLimit: 21000,
        // Incorrect gasPrice
        gasPrice: new BigNumber('6'),
        inputData: '0x',
        nonce: 0,
        to: '0x6de1eb3a111f6e73001f5fec107884c8ab6b97da',
        amount: new BigNumber('99580000000000000'),
        v: '0x1c',
        r: '0x2cdebe859a19bb58e295b58040a07cd3c394cbbd183452c654532a0e2e66df08',
        s: '0x5c8b5490d7c5ca669999c5c2e757a16dfeb8f3d1e31833551b6ba16dd873e84e'
      }

    const hashedTransaction = hashSingleTransaction(transaction)
    assert(hashedTransaction !== transaction.hash)
  })

  it('hashes tx 0x6679d670192a56b6fcbd20b0392f34ff6536a499b50c9924bc3f7869a85e7550 correctly', async function () {
    const hash = '0x6679d670192a56b6fcbd20b0392f34ff6536a499b50c9924bc3f7869a85e7550'
    const transaction = {
      hash: '0x6679d670192a56b6fcbd20b0392f34ff6536a499b50c9924bc3f7869a85e7550',
      gasLimit: 121001,
      gasPrice: new BigNumber(51000000000),
      inputData: '0x',
      nonce: 518969,
      to: '0xB505830ffD0059F9a3d98C1EeBaDe1B8279A40e3',
      amount: new BigNumber(495000000000000000),
      v: '0x25',
      r: '0x9bba22299d4c7203575d0461da459f6cbe59e0aced3fa48e4f61786b907df8f6',
      s: '0x312956f6d97a8910eb998fc20f354091e268456a6bf457308a92ad5a1a6f878d'
    }

    const hashedTransaction = hashSingleTransaction(transaction)
    assert.equal(hashedTransaction, hash, 'hashSingleTransaction should generate the correct hash')
  })

  xit('rescans tx due to invalid tx hash', async function () {
    this.timeout(30 * 1000)

    const village = await createEthereumVillage(ethereumConfig)
    await resetEthereumDb(village)
    const web3 = await new Web3(initializeMultiProvider(ethereumConfig.ethereum.client))

    await village.model.ground.query(`INSERT INTO validated_transactions (id, pass, "valid", "blockIndex", created) VALUES ('0xbdbf1143b3d7f72267095a6b1953975c25b2bb3e9e530a21aebe5104d0d9bb34', 1, 'False', 4000000, NOW());`)

    const state = {
      blockIndex: 4000000,
      enabled: true,
      interval: 60000,
      name: 'rescan-invalid-transactions'
    }

    const transactionsBeforeScan = await village.model.Transaction.all()
    // await rescanInvalidTransactions(state, village.model, web3)
    const transactionsAfterScan = await village.model.Transaction.all()

    assert.equal(transactionsBeforeScan.length, 0, 'There should be no transactions before the rescan')
    assert.equal(transactionsAfterScan.length, 1, 'There should be a new transaction after the rescan')
  })

  xit('rescans tx due to invalid txRoot', async function () {
    this.timeout(30 * 1000)

    const village = await createEthereumVillage(ethereumConfig)
    await resetEthereumDb(village)
    const web3 = await new Web3(initializeMultiProvider(ethereumConfig.ethereum.client))

    await village.model.ground.query(`INSERT INTO validated_transaction_roots (id, pass, "valid", "blockIndex", created) VALUES (4000001, 1, 'False', 4000001, NOW());`)

    const state = {
      blockIndex: 4000001,
      enabled: true,
      interval: 60000,
      name: 'rescan-transaction-tries'
    }

    const transactionsBeforeScan = await village.model.Transaction.all()
    // await rescanTransactionsTrie(state, village.model, web3, 4000001)
    const transactionsAfterScan = await village.model.Transaction.all()

    assert.equal(transactionsBeforeScan.length, 0, 'There should be no transactions before the rescan')
    assert.equal(transactionsAfterScan.length, 16, 'There should be 16 transactions after the rescan')
  })

})