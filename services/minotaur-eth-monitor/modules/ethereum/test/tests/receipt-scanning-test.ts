const { ethereumConfig } = require('../config/config')
import { createEthereumVillage, startEthereumMonitor, createPartitionConfig } from '../../src'
import { resetEthereumDb } from '../../src/fixtures'
import { assert } from 'chai'
import { scanReceipts } from '../../scripts/scan-receipts'
import { blockService, IndexRange, BlockServiceState } from 'common';
require('source-map-support').install()

describe('receipt scanner', function () {
  this.timeout(300000)

  xit('can scan and add missing receipt data for block 3000013', async function() {
    const village = await createEthereumVillage(ethereumConfig)
    await resetEthereumDb(village)
    let model = village.model
    await model.ground.query(sqlNoReceipts)
    blockService(village.model, async (state: BlockServiceState) => {
      return async (state: BlockServiceState, range: IndexRange) =>
        await scanReceipts(model, state, range).then(async function () {
          const newTransactionLogs = await model.TransactionLog.all()
          assert(newTransactionLogs.length > 0, 'There should be transaction logs in the DB')

          const newTransactions = await model.Transaction.all()
          assert.isNotNull(newTransactions[0].status, 'There should be a value for status')
          assert.isNotNull(newTransactions[0].logsBloom, 'There should be a value for logsBloom')
        }).then(() => {
          return {
            state,
            shouldContinue: true
          }
        })
    })

    const transactionLogs = await model.TransactionLog.all()
    assert.equal(transactionLogs.length, 0, 'There should be no transaction logs in the DB')

    const transactions = await model.Transaction.all()
    assert.isNull(transactions[0].status, 'There should be no value for status')
    assert.isNull(transactions[0].logsBloom, 'There should be no value for logsBloom')


  })
})

const sqlNoReceipts = `
  INSERT INTO "blocks" ("index", "hash", "timeMined", "bloom", "coinbase", "difficulty", "extraData", "gasLimit", "parentHash", "receiptsRoot", "stateRoot", "transactionsRoot", "created") VALUES
  (3000013, '0xf85b10dbf536130b04fc5d08cdf8fac0d1c6bc33edcdc577cf3f700d260ed7eb', '2017-01-15T10:13:25.000Z', '0x00000000000000000000000000000000000000000400000000000000000000000000000000000000000000000080000048000000000000000000000000000000000000000000000000000080000000000001000000000000000000000020000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000100000000000000000000000000000400000000000000000000000', '0x1e9939daaad6924ad004c2560e90804164900341', '104131093534280', '0x706f6f6c2e65746866616e732e6f7267', '4004921', '0x5a2e13348d3281cf5912e74ec9868595986996d436e2685f15312583a8ee6634', '0x28c1929090a908249b5135f576ada305ebda310556df54c3888d0a35d855f117', '0xf4804b14847063138583c78533db6bf6865d9888a6bf3b896a08aefc48054153', '0xba3237eaec340c878683e354b5645b0232f27e7a6d459dba1a23741f4efd4984', NOW()) ON CONFLICT DO NOTHING;

  INSERT INTO "addresses" ("hash", "created") VALUES
  ('0x221F0c419AEeEd36F35ffdEAcbb31A5f3D8E12DD', NOW()),
  ('0x1E9939DaaAd6924AD004C2560e90804164900341', NOW()),
  ('0x9e9c23d2fA02fdD10D2A0421a73D2382b7746963', NOW()),
  ('0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8', NOW()) ON CONFLICT DO NOTHING RETURNING "hash";

  INSERT INTO "transactions" ("postRoot", "status","to", "from", "hash", "amount", "gasLimit", "gasUsed", "gasPrice", "cumulativeGasUsed", "nonce", "timeReceived", "blockIndex", "v", "r", "s", "inputData", "created") VALUES
  (null, null, 1, 2, '0x03d8d64479371820b88018b632a6c1e6b55b511b2f63dc4c673f31a75c47f41b', 1003466290031548800, 39000, 1234, 20000000000, 1234, 163070, '2017-01-15T10:13:25.000Z', 3000013, '0x26', '0x2542b2f2be0cb1d9ee8fc67eeac0e4c3451d872c6e48db92d407a11a414e080c', '0x76b7a5cc072e95e5b89483f61e316a200abadbe20e90615dfd5e9fd813ccd01e', '0x', NOW()),
  (null, null, 3, 4, '0xe8bb7b582eeb7c5167fe533193a04a6fe43617175cde65cfc4da44f86958fb0a', 1000704809326069600, 90000, 1234, 20000000000, 1234, 1092112, '2017-01-15T10:13:25.000Z', 3000013, '0x25', '0xc537c3a73896bd8ef75b23c392595a6b3e5ab612685c4fb208be9d49b576f826', '0x1309734db64d4be7d9a769079989eab691cf8675ad4ef160394c717a6714785d', '0x', NOW()) ON CONFLICT DO NOTHING;
`