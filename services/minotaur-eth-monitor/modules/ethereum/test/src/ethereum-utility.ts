import { EthereumBlockReader } from '../../src/web3';

require('source-map-support').install()
import { blockchain, innerServiceLoop, logger } from 'common'
import { ContractTransaction, EthereumBlock, ethereumMonitorServiceActionSource, EthereumVillage } from '../../src'
import { assert } from 'chai'
import { getRandomBigNumberInclusive, getRandomIntInclusive, getRandomString } from 'common/lab'
import { ServiceActionSource, ServiceState } from '../../../common/src/service';

const second = 1000
const minute = 60 * second

export async function assertThrowsErrorMessage(codeToRun: () => any, message: string): Promise<void> {
  try {
    await codeToRun()
    assert(false)
  } catch (e) {
    console.error(e)
    assert.equal(e.message, message)
  }
}

export function randomEthereumBundle(blockIndex?: number): blockchain.BlockBundle<EthereumBlock, ContractTransaction> {
  const block = randomEthereumBlock(blockIndex)
  const transactions = []
  for (let i = 0; i < 20; i++) {
    transactions.push(randomEthereumTransaction(blockIndex))
  }
  return {
    block,
    transactions
  }
}

export function randomEthereumBlock(index?: number): any {
  return {
    index: index || getRandomIntInclusive(1, 1000),
    hash: getRandomString(10),
    parentHash: getRandomString(10),
    uncleHash: getRandomString(10),
    coinbase: getRandomString(10),
    stateRoot: getRandomString(10),
    transactionsRoot: getRandomString(10),
    receiptsRoot: getRandomString(10),
    bloom: getRandomString(10),
    difficulty: getRandomIntInclusive(1, 1000),
    number: getRandomIntInclusive(1, 1000),
    gasLimit: getRandomIntInclusive(1, 1000),
    gasUsed: getRandomIntInclusive(1, 1000),
    timestamp: getRandomIntInclusive(1, 1000),
    extraData: getRandomString(10),
    mixHash: getRandomString(10),
    nonce: getRandomIntInclusive(1, 1000),
    timeMined: new Date()
  }
}

export function randomEthereumTransaction(index?: number): ContractTransaction {
  return {
    to: 'Finn',
    from: 'Jake',
    // toHash: getRandomString(10),
    // hash: getRandomString(10),
    gasPrice: getRandomBigNumberInclusive(1, 1000),
    gasLimit: getRandomIntInclusive(1, 1000),
    gasUsed: 5,
    cumulativeGasUsed: getRandomIntInclusive(1, 1000),
    amount: getRandomBigNumberInclusive(1, 1000),
    inputData: getRandomString(10),
    v: getRandomString(10),
    r: getRandomString(10),
    s: getRandomString(10),
    // currency: getRandomString(10),
    logsBloom: getRandomString(10),
    blockIndex: index || getRandomIntInclusive(1, 1000),
    txid: getRandomString(10),
    timeReceived: new Date(),
    status: 3,
    nonce: getRandomIntInclusive(1, 1000),
    postRoot: undefined,
    logs: [],
    transactionIndex: 0
  }
}

export function timeoutService<State extends ServiceState>(maxMilliseconds: number, actionSource: ServiceActionSource<State>): ServiceActionSource<State> {
  return async (state: State) => {
    const startTime: number = Date.now()
    const action = await actionSource(state)
    return async (state: State) => {
      const elapsed = Date.now() - startTime
      if (elapsed > maxMilliseconds) {
        console.log('Canceled blocks')// , blockQueue.requests.map((b: any) => b.blockIndex).join(', '))
        return {
          state,
          shouldContinue: false
        }
      }
      else {
        return action(state)
      }
    }
  }
}

export async function scanTestBlocks(village: EthereumVillage, serviceName: string, blockIndex: number, count: number, minConfirmations: number) {
  await village.model.Service.create({ name: serviceName, enabled: true, state: { blockIndex } })
  console.log('Initialized village')
  const partition = { blocks: true, transactions: true }
  const monitorConfig = {
    queue: { maxSize: 10, minSize: 1 },
    profiling: false,
    blockIndex,
    minConfirmations
  }
  const client = EthereumBlockReader.createFromConfig(village.config.ethereum.client)
  client.getHeighestBlockIndex = async () => blockIndex + count
  const actionSource = timeoutService(100 * second,
    await ethereumMonitorServiceActionSource(village, monitorConfig, partition, client)
  )
  await innerServiceLoop(village.model, serviceName, actionSource)
}