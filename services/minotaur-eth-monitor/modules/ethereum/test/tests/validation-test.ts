import { validateBlocksAction } from '../../src/validation/block-validation';

require('source-map-support').install()
import { createEthereumVillage, validateTransactionAction, EthereumVillage, getContractAddress } from '../../src'
import { resetEthereumDb } from '../../src/fixtures';
import { CommonModel, innerServiceLoop } from 'common'
import { scanTestBlocks, timeoutService } from '../src/ethereum-utility'

const { ethereumConfig } = require('../config/config')
const assert = require('assert')

const second = 1000
const minute = 60 * second

async function prepareService(model: CommonModel, name: string, blockIndex: number) {
  const state = {
    name,
    state: {
      blockIndex,
      enabled: true,
      interval: 60000,
      step: 1,
      batchSize: 20
    }
  }
  await model.Service.update(state)
}

describe('transaction validator', function () {
  let village: EthereumVillage = (undefined as any)

  before(async function () {
    village = await createEthereumVillage(ethereumConfig)
  })

  beforeEach(async function () {
    await resetEthereumDb(village)
  })

  it('missing-blocks does not blow up', async function () {
    this.timeout(2 * minute)

    const actionSource = await timeoutService(10 * second, validateBlocksAction(village.model))
    const blockIndex = 142937
    const serviceName = 'eth-validate-blocks'
    await prepareService(village.model, serviceName, blockIndex)
    await scanTestBlocks(village, 'eth-scan-blocks1', blockIndex, 10, 0)
    await innerServiceLoop(village.model, serviceName, actionSource)
  })

  it('handles forks', async function () {
    this.timeout(2 * minute)

    const blockIndex = 142900
    const serviceName = 'eth-validate-blocks'
    await prepareService(village.model, serviceName, blockIndex)
    const count = 8
    const minConfirmations = 4
    const badIndex = blockIndex + count - minConfirmations / 2
    await scanTestBlocks(village, 'eth-scan-blocks1', blockIndex, count, 0)
    await village.model.ground.query(`UPDATE blocks SET hash = 'badHash' WHERE "index" = '${badIndex}'`)
    await scanTestBlocks(village, 'eth-scan-blocks2', blockIndex + count, count, 4)
  })

  // There is no longer a 'validate-transactions' service
  // it('validate-transactions does not blow up', async function () {
  //   const actionSource = await timeoutService(10 * second, validateTransactionAction(village.model))
  //   const blockIndex = 4000001
  //   const serviceName = 'validate-transactions'
  //   await prepareService(village.model, serviceName, blockIndex)
  //   await scanTestBlocks(village, blockIndex)
  //   await innerServiceLoop(village.model, serviceName, actionSource)
  // })

  after(function () {
    setTimeout(() => process.exit(), 2 * second)
  })
})

describe('contract address generation', function () {
  it('can derive a contract address 1', async function () {
    const address = await getContractAddress('0x5d239fb4d8767745be329d38703cdf4094858766', 44)
    assert.strictEqual(address, '0x4156D3342D5c385a87D264F90653733592000581')
  })

  it('can derive a contract address 2', async function () {
    const address = await getContractAddress('0x970e8128ab834e8eac17ab8e3812f010678cf791', 0)
    assert.strictEqual(address, '0x333c3310824b7c685133F2BeDb2CA4b8b4DF633d')
  })
})