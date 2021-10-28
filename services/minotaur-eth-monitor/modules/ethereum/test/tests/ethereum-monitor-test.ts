import { resetEthereumDb } from '../../src/fixtures';
import { BigNumber } from 'bignumber.js'
import {
  createEthereumVillage,
  EthereumModel,
  ethereumMonitorServiceActionSource,
  EthereumVillage,
  initializeMultiProvider,
  prepareEthereumMonitor,
  saveEthereumBlocks,
  startEthereumMonitor,
  startEthereumMonitor2
} from '../../src'
import { assert } from 'chai'
import { EthereumHttpProfiler } from '../src/ethereum-profiling';
import { assertThrowsErrorMessage } from '../src/ethereum-utility';
import { innerServiceLoop } from 'common';

const Web3 = require('web3')

require('source-map-support').install()
const { ethereumConfig } = require('../config/config')

const second = 1000
const minute = 60 * second

describe('eth-scan', function () {
  this.timeout(12 * minute)
  let village: EthereumVillage
  let model: EthereumModel

  beforeEach(async function () {
    village = await createEthereumVillage(ethereumConfig)
    await resetEthereumDb(village)
    model = village.model
  })

  xit('from start', async function () {
    console.log('Initialized village')
    await startEthereumMonitor(village, {
        queue: { maxSize: 10, minSize: 1 },
        maxMilliseconds: 1 * minute,
        profiling: ethereumConfig.profiling
      },
      { blocks: true, transactions: true }
    )
    assert(true)
  })

  // This block has a contract with a malformed ERC20 token name
  xit('from 142937', async function () {
    await model.Service.create({ name: 'eth-scan-test', blockIndex: 142937, enabled: true })
    console.log('Initialized village')
    const partition = { blocks: true, transactions: true }
    const monitorConfig = {
      queue: { maxSize: 1, minSize: 1 },
      maxMilliseconds: 10 * second,
      profiling: ethereumConfig.profiling,
      blockIndex: 142936,
      minConfirmations: 8
    }
    const actionSource = await ethereumMonitorServiceActionSource(village, monitorConfig, partition)
    await innerServiceLoop(village.model, 'eth-scan-test', actionSource)
    assert(true)
  })

  xit('from 4 mil', async function () {
    await model.LastBlock.update({ currency: 2, blockIndex: 4000000 })
    console.log('Initialized village')
    const httpProfiler = new EthereumHttpProfiler(ethereumConfig.ethereum.client.http.length)
    const monitorConfig = {
      queue: {
        minSize: 5,
        maxSize: 10,
        maxBlockRequests: 40
      },
      maxMilliseconds: 1 * minute,
      profiling: ethereumConfig.profiling
    }
    const elements = await prepareEthereumMonitor(village, monitorConfig, httpProfiler.getHttpListenerSource())
    httpProfiler.blockQueue = elements.blockQueue
    await startEthereumMonitor2(elements)
    assert(true)
    httpProfiler.log()
    httpProfiler.stop()
  })

  xit('from 4847829', async function () {
    await model.LastBlock.update({ currency: 2, blockIndex: 6256491 })
    console.log('Initialized village')
    const batchSize = 40
    const config = {
      queue: { maxSize: batchSize, minSize: batchSize },
      maxMilliseconds: .5 * minute,
      profiling: ethereumConfig.profiling
    }
    const partition = { blocks: true, transactions: true }
    await startEthereumMonitor(village, config, partition)
    assert(true)
  })

  xit('can rescan', async function () {
    await model.LastBlock.update({ currency: 2, blockIndex: 4000000 })
    console.log('Initialized village')
    await startEthereumMonitor(village, {
        queue: { maxSize: 10, minSize: 1 },
        maxMilliseconds: 0.1 * minute,
        profiling: ethereumConfig.profiling
      },
      { blocks: true, transactions: true }
    )

    await model.LastBlock.update({ currency: 2, blockIndex: 4000000 })
    await startEthereumMonitor(village, {
        queue: { maxSize: 10, minSize: 1 },
        maxMilliseconds: 0.2 * minute,
        profiling: ethereumConfig.profiling
      },
      { blocks: true, transactions: true }
    )
    assert(true)
  })

  xit('saveBlocks throws an error when passed an empty blocks array', async function () {
    await assertThrowsErrorMessage(
      () => saveEthereumBlocks(model.ground, []),
      'blocks array must not be empty'
    )
  })

  after(function () { // Notice: not asynchronous
    setTimeout(process.exit, 1000)
  })

})
