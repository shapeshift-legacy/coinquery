require('source-map-support').install()
const { ethereumConfig } = require('../config/config')
import { createEthereumVillage, EthereumModel, formatReceipts, hashReceipts } from '../../src'
const assert = require('assert')

const receipts = [
  {
    cumulativeGasUsed: '0xfd84',
    logs: [{
      data: '0x00000000000000000000000000000000000000000000000044c71f51893fec00',
      removed: false,
      topics: [
        '0x90890809c654f11d6e72a28fa60149770a0d11ec6c92319d6ceb2bb0a4ea1a15',
        '0x000000000000000000000000151255dd9e38e44db38ea06ec66d0d113d6cbe37',
        '0x0000000000000000000000000000000000000000000000000000000000000058'
      ],
      transaction: '0x322eca8c0a96cd4bdecc51620f7bdcd0bdc8fa6bed8d6797b0bcf0c307bc32c0',
      index: '0x2',
    }],
    logsBloom: '0x0000000000000000000000000000000000000000040000000000000000000000000000000000000000000000008000000a000000000000000000000000000000000000000000000000000000000000000001000000000000000100000800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000001020000000000000000000000000000000000000000000000000000100000000000000000000000000000400000000000000000000000',
    status: '0x1'
  }]

/*
describe('receipt validator', function () {
  it.skip('hashes receipt data for block 1235235', async () => {
    const generatedReceiptsRoot = await hashReceipts(receipts)
    assert.equal(generatedReceiptsRoot, '0x34810a8ad1b1b45bf7873a89db5c29aff69d5db41c2c31ee8ff9c62694e3bc71', 'Should generate the correct hash')
  })

  it('pulls receipt info from db', async () => {
    const village = await createEthereumVillage(ethereumConfig)
    const model: EthereumModel = village.model
    const transactions = await model.Transaction.filter({ blockIndex: 1235235 }).sort(['hash'])
    const logs = await model.TransactionLog.filter({ transaction: '0x322eca8c0a96cd4bdecc51620f7bdcd0bdc8fa6bed8d6797b0bcf0c307bc32c0' })
    await resetDb('receipt-validation')

    const dbReceipts = formatReceipts(transactions, logs)
    const thisReceipt = receipts.find(x => x.cumulativeGasUsed === '0xfd84')
    const thisDbReceipt = dbReceipts.find(x => x.cumulativeGasUsed === '0xfd84')
    assert.deepEqual(thisReceipt, thisDbReceipt, 'Receipts pulled from the DB should contain the correct data')
  })
})*/