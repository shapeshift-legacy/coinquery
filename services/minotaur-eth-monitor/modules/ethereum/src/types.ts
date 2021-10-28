import { blockchain, CommonConfig } from 'common'
import { BigNumber } from 'bignumber.js'
import { Web3EthereumClientConfig } from './web3/types';

export const consecutiveTransactionTableCount = 8

export type EthereumConfig = CommonConfig & {
  ethereum: {
    client: Web3EthereumClientConfig
  }
  partition?: PartialPartitionConfig
}

export type Resolve<T> = (value: PromiseLike<T> | T | undefined) => void

export interface PartialPartitionConfig {
  blocks?: boolean
  transactions?: boolean
}

export interface PartitionConfig {
  blocks: boolean
  transactions: boolean
}

export interface EthereumBlock {
  index: number
  hash: string
  parentHash: string
  uncleHash: string
  coinbase: string
  stateRoot: string
  transactionsRoot: string
  receiptsRoot: string
  bloom: string
  difficulty: string
  number: number
  gasLimit: number
  gasUsed: number
  timestamp: number
  extraData: string
  mixHash: string
  nonce: number
  timeMined: Date
}

export interface EthereumTransaction extends blockchain.BlockTransaction {
  to?: string
  from?: string
  hash: string
  gasPrice: BigNumber
  gasLimit: number
  cumulativeGasUsed: number
  amount: BigNumber
  inputData: string
  v: string
  r: string
  s: string
  currency: string
  logsBloom: string
}

export interface ContractTransaction extends blockchain.SingleTransaction {
  txid: string
  to?: string
  from?: string
  amount: BigNumber
  timeReceived: Date
  postRoot: string | undefined
  blockIndex: number
  gasLimit: number
  gasUsed: number
  gasPrice: BigNumber
  cumulativeGasUsed: number
  newContract?: blockchain.AnyContract
  events?: blockchain.BaseEvent[]
  nonce: number
  v: string
  r: string
  s: string
  inputData: string
  logsBloom: string
  logs: TransactionLog[]
  transactionIndex: number
}

export interface EthereumJSTransactionFields {
  nonce: number
  gasPrice: string
  gasLimit: number
  to?: string | undefined
  value: string
  data: string
  v: string
  r: string
  s: string
}

export interface TransactionValidationFields {
  hash: string
  nonce: number
  gasPrice: BigNumber
  gasLimit: number
  to?: string | undefined
  amount: BigNumber
  inputData: string
  v: string
  r: string
  s: string
}

export interface ReceiptValidationFields {
  cumulativeGasUsed: string
  logs: LogValidationFields[]
  logsBloom: string
  status: string
}

export interface LogValidationFields {
  address: string
  blockHash: string
  blockNumber: string
  data: string
  logIndex: string
  removed: boolean
  topics: string[]
  transactionHash: string
  transactionIndex: string
}

export interface InternalTransaction {
  to: string
  from: string
  amount: BigNumber
}

export interface TransactionLog {
  address: string
  blockHash: string
  blockNumber: number
  data: string
  logIndex: number
  removed: boolean
  topics: string[]
  transactionHash: string
  transactionIndex: number
}

export interface Receipt {
  hash: string
  cumulativeGasUsed: BigNumber
  postRoot: string
  status: number
  gasUsed: BigNumber
  logsBloom: string
  logs?: TransactionLog[]
}