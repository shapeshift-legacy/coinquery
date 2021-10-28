import { BigNumber } from 'bignumber.js'
import { Block, Web3Block, Web3EthereumClientConfig, Web3Transaction, Web3TransactionReceipt } from './types'
import { blockchain, Resolve } from 'common'
import { ContractTransaction, EthereumBlock, PartialPartitionConfig, PartitionConfig } from '../types'
import { HttpProviderWrapper } from './http-provider-wrapper';
import { HttpListenerSource } from './exported-types';

const Web3 = require('web3')
const SolidityCoder = require('web3/lib/solidity/coder')
const SolidityFunction = require('web3/lib/web3/function')
const SolidityEvent = require('web3/lib/web3/event')
const promisify = require('util').promisify
const axios = require('axios')
const formatters = require('web3/lib/web3/formatters')
const rlp = require('rlp')
const ethereumJsUtil = require('ethereumjs-util')

export type Resolve2<T> = (value: T) => void

export type Web3Client = any

export type EthereumBlockBundle = blockchain.BlockBundle<EthereumBlock,
  ContractTransaction>

export interface SendTransaction {
  from: string
  to: string
  value: BigNumber
  gas?: number
  gasPrice?: BigNumber
}

export function getTransaction(web3: Web3Client, hash: string): Promise<any> {
  return new Promise((resolve: Resolve<Web3Transaction>, reject) => {
    web3.eth.getTransaction(hash, (err: any, transaction: Web3Transaction) => {
      if (err) {
        reject(new Error(err))
      } else {
        resolve(transaction || undefined)
      }
    })
  })
}

export function getBlock(web3: Web3Client, blockIndex: number): Promise<Web3Block | undefined> {
  return new Promise((resolve: Resolve<Web3Block>, reject) => {
    web3.eth.getBlock(blockIndex, true, (err: any, block: Web3Block) => {
      if (err) {
        reject(new Error(err))
      } else {
        resolve(block || undefined)
      }
    })
  })
}

export function getBlockIndex(web3: Web3Client): Promise<number> {
  return new Promise((resolve: Resolve<number>, reject) => {
    web3.eth.getBlockNumber((err: any, blockNumber: number) => {
      if (err) {
        reject(new Error(err))
      } else {
        resolve(blockNumber - 1)
      }
    })
  })
}

export function getTransactionReceipt(
  web3: Web3Client,
  txid: string
): Promise<Web3TransactionReceipt> {
  return new Promise((resolve: Resolve<Web3TransactionReceipt>, reject) => {
    web3.eth.getTransactionReceipt(txid, (err: any, transaction: Web3TransactionReceipt) => {
      if (err) {
        reject(err)
      } else {
        resolve(transaction)
      }
    })
  })
}

export function convertStatus(gethStatus: string): blockchain.TransactionStatus {
  switch (gethStatus) {
    case '0x1':
      return blockchain.TransactionStatus.accepted

    default:
      return blockchain.TransactionStatus.rejected
  }
}

export const toChecksumAddress = Web3.prototype.toChecksumAddress

export function getNullableChecksumAddress(address?: string): string | undefined {
  return typeof address === 'string' ? Web3.prototype.toChecksumAddress(address) : undefined
}

interface Erc20Grouped {
  attributes: any[]
  balance: any[]
  events: any[]
}

const erc20GroupedAbi = require('./abi/erc20-grouped.json') as Erc20Grouped
const erc20AttributesAbi = erc20GroupedAbi.attributes
// const erc20BalanceAbi = erc20GroupedAbi.balance
const erc20TransferEventAbi = erc20GroupedAbi.events.filter(e => e.name == 'Transfer')[0]

// const erc20ReadonlyAbi = erc20AttributesAbi.concat(erc20BalanceAbi)

export function checkContractMethod(
  contract: any,
  methodName: string,
  args: any[] = []
): Promise<boolean> {
  const method = contract[methodName]
  const payload = method.toPayload(args)
  const defaultBlock = method.extractDefaultBlock(args)

  return new Promise((resolve: Resolve<boolean>, reject) => {
    method._eth.call(payload, defaultBlock, (error: Error, output: string) => {
      if (error) {
        reject(false)
      } else {
        resolve(output !== '0x')
      }
    })
  })
}

export interface ContractEvent {
  transactionHash: string
  address: string
}

export interface EventFilter {
  address?: string | string[]
  to?: string
  from?: string
  toBlock?: number
  fromBlock?: number
  topics?: any[]
}

export function getEvents(web3: any, filter: EventFilter): Promise<ContractEvent[]> {
  const processedFilter = {
    address: filter.address,
    from: filter.from,
    to: filter.to,
    fromBlock: formatters.inputBlockNumberFormatter(filter.fromBlock),
    toBlock: formatters.inputBlockNumberFormatter(filter.toBlock),
    topics: filter.topics
  }

  const body = {
    jsonrpc: '2.0',
    method: 'eth_getLogs',
    id: 1,
    params: [processedFilter]
  }

  return axios.post(web3.currentProvider.getHost(), body).then((response: any) => response.data.result)
}

export function mapTransactionEvents(events: ContractEvent[], txid: string) {
  return events.filter(c => c.transactionHash == txid)
}

export async function loadTransaction(
  web3: Web3Client,
  tx: Web3Transaction,
  block: Block,
  events: ContractEvent[]
): Promise<ContractTransaction> {

  const receipt = {
    gasUsed: -1,
    cumulativeGasUsed: -1,
    logsBloom: '',
    logs: []
  }
  const status = 3
  const postRoot = undefined
  const contract = undefined

  return {
    postRoot,
    status,
    txid: tx.hash,
    to: getNullableChecksumAddress(tx.to),
    from: getNullableChecksumAddress(tx.from),
    amount: tx.value,
    timeReceived: new Date(block.timestamp * 1000),
    blockIndex: block.number,
    gasLimit: tx.gas,
    gasUsed: receipt.gasUsed,
    gasPrice: tx.gasPrice,
    cumulativeGasUsed: receipt.cumulativeGasUsed,
    newContract: contract,
    events: mapTransactionEvents(events, tx.hash),
    nonce: tx.nonce,
    v: tx.v,
    r: tx.r,
    s: tx.s,
    inputData: tx.input,
    logsBloom: receipt.logsBloom,
    logs: receipt.logs,
    transactionIndex: tx.transactionIndex
  }
}

export function partitionArray<T>(partitionSize: number, items: T[]): T[][] {
  const result: T[][] = []
  for (let i = 0; i < items.length; i += partitionSize) {
    result.push(items.slice(i, i + partitionSize))
  }

  return result
}

export async function partitionedMap<T, O>(
  partitionSize: number,
  action: (item: T) => Promise<O>,
  items: T[]
): Promise<O[]> {
  const groups = partitionArray(partitionSize, items)
  let result: O[] = []
  for (const group of groups) {
    const promises = group.map(action)
    const newItems = await Promise.all(promises)
    result = result.concat(newItems)
  }

  return result
}

export async function getFullBlock(
  web3: Web3Client,
  blockIndex: number
): Promise<blockchain.BlockBundle<EthereumBlock, ContractTransaction>> {
  const block = await getBlock(web3, blockIndex)
  if (!block)
    throw new Error('Web3 returned null for block ' + blockIndex)

  const events = await getEvents(web3, {
    toBlock: blockIndex,
    fromBlock: blockIndex
  })
  for (const event of events) {
    event.address = toChecksumAddress(event.address)
  }

  const transactions = await partitionedMap(
    30,
    tx => loadTransaction(web3, tx, block, events),
    block.transactions
  )
  const finalBlock: EthereumBlock = {
    index: blockIndex,
    hash: block.hash,
    parentHash: block.parentHash,
    uncleHash: block.sha3Uncles,
    coinbase: block.miner,
    stateRoot: block.stateRoot,
    transactionsRoot: block.transactionsRoot,
    receiptsRoot: block.receiptsRoot || block.receiptsRoot!,
    bloom: block.logsBloom,
    difficulty: block.difficulty.toString(),
    number: block.number,
    gasLimit: block.gasLimit,
    gasUsed: block.gasUsed,
    timestamp: block.timestamp,
    extraData: block.extraData,
    mixHash: block.mixHash,
    nonce: block.nonce,
    timeMined: new Date(block.timestamp * 1000)
  }

  return {
    transactions,
    block: finalBlock
  }
}

export function initializeWeb3(ethereumConfig: Web3EthereumClientConfig, web3?: Web3Client) {
  if (!web3) {
    const web3 = new Web3()
    const provider = new web3.providers.HttpProvider(ethereumConfig.http)
    if (ethereumConfig.logRequests) {
      // Much of this code block could be abstracted into a wrapper function
      // but it's not that much duplication and this way is easier to trace.
      const originalSend = provider.send
      provider.send = (payload: any) => {
        console.log('web3-request', 'sync', web3.currentProvider.host)
        originalSend.call(provider, payload)
      }
      const originalSendAsync = provider.sendAsync
      provider.sendAsync = (payload: any, callback: any) => {
        console.log('web3-request', web3.currentProvider.host, payload.method)
        originalSendAsync.call(provider, payload, callback)
      }
    }
    web3.setProvider(provider)
    return web3
  }
  return web3
}

export function createPartitionConfig(values?: PartialPartitionConfig): PartitionConfig {
  if (!values) {
    return {
      blocks: false,
      transactions: false,
    }
  }
  return {
    blocks: values.blocks ? values.blocks : false,
    transactions: values.transactions ? values.transactions : false,
  }
}

export function initializeMultiProvider(config: Web3EthereumClientConfig, httpListenerSource?: HttpListenerSource): HttpProviderWrapper {
  const configs: Web3EthereumClientConfig[] = typeof config.http === 'string'
    ? [config]
    : (config.http as string[]).map(h => ({ http: h, logRequests: config.logRequests }))
  const providers = configs.map(c => new Web3.providers.HttpProvider(c.http))
  const httpProviderConfig = {
    logRequests: config.logRequests
  }
  return new HttpProviderWrapper(providers, httpProviderConfig, httpListenerSource)
}

export function getContractAddress(from: string, nonce: number): string {
  return ethereumJsUtil.toChecksumAddress(ethereumJsUtil.generateAddress(from, nonce).toString('hex'))
}