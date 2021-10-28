import {
  createEthereumExplorerDao,
  createEthereumVillage,
  EthereumBlock,
  EthereumTransaction,
  EthereumVillage,
  startEthereumMonitor2
} from '../../src'
import { assert } from 'chai'
import { randomEthereumBundle } from '../src/ethereum-utility'
import { blockchain, createBlockQueue, EmptyProfiler, OptionalMonitorConfig, Service, SimpleProfiler } from 'common'

require('source-map-support').install()
const { ethereumConfig } = require('../config/config')
const second = 1000
const minute = 60 * second

describe('profiling', function () {
  this.timeout(12 * minute)
  let village: EthereumVillage

  xit('populates DB with dummy data', async function () {
    village = await createEthereumVillage(ethereumConfig)
    // await resetEthereumDb(village)
    console.log('Initialized village')

    const monitorConfig = {
      queue: {
        minSize: 5,
        maxSize: 10,
        maxBlockRequests: 20
      },
      maxMilliseconds: 10 * minute,
      profiling: ethereumConfig.profiling
    }

    const transactionsToSave = 1000000
    const fakeElements = await prepareFakeEthereumMonitor(village, monitorConfig, transactionsToSave)

    await startEthereumMonitor2(fakeElements)
    assert(true)
  })
})

export class FakeBlockReader
  implements blockchain.BlockReader<EthereumBlock, EthereumTransaction> {

  transactions: number
  highestBlock: number

  constructor(transactions?: number) {
    // 20 tx per block
    this.transactions = transactions || 1000
    this.highestBlock = transactions ? Math.ceil(transactions / 20) : 50
  }

  getHeighestBlockIndex(): Promise<number> {
    return Promise.resolve(this.highestBlock)
  }

  getBlockBundle(
    blockIndex: number
  ): Promise<any> {
    return Promise.resolve(randomEthereumBundle(blockIndex))
  }

  static createFromConfig(transactions?: number) {
    return new FakeBlockReader(transactions)
  }
}

async function prepareFakeEthereumMonitor(
  village: EthereumVillage,
  config: OptionalMonitorConfig,
  transactions?: number
): Promise<any> {
  const defaults = {
    minConfirmations: 12
  }
  const appliedConfig = Object.assign({}, defaults, config)
  const service = new Service('eth-scan')
  const model = village.model
  const highestBlock = await model.Block.first().sort([['index', 'DESC']] as any).range(0, 1)
  highestBlock === null || highestBlock === undefined ? service.setIndex(model, 0) :
    service.setIndex(model, highestBlock.index)
  const client = FakeBlockReader.createFromConfig(transactions)
  const dao = createEthereumExplorerDao(model)
  console.log('Starting cron')
  const profiler = config.profiling ? new SimpleProfiler() : new EmptyProfiler()
  const blockQueue = await createBlockQueue(client, appliedConfig.queue, appliedConfig.minConfirmations, 0)
  return {
    blockQueue,
    dao,
    client,
    profiler,
    config: appliedConfig,
    model,
    service
  }
}