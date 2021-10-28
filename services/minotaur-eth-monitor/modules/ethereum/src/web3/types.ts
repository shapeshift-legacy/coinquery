import { BigNumber } from 'bignumber.js'
import { TransactionLog } from '../types';

export interface Web3Transaction {
  hash: string
  to: string
  from: string
  value: BigNumber
  block: string
  gas: number
  gasPrice: BigNumber
  nonce: number
  v: string
  r: string
  s: string
  input: string
  transactionIndex: number
}

export interface Web3TransactionReceipt {
  blockHash: string
  blockNumber: number
  transactionHash: string
  transactionIndex: number
  from: string
  to: string
  cumulativeGasUsed: number
  gasUsed: number
  contractAddress: string
  logs: TransactionLog[]
  root?: string
  status?: string
  logsBloom: string
}

export interface Web3Block {
  hash: string
  index: number
  number: number
  miner: string
  timeMined: Date
  parentHash: string
  difficulty: string
  sha3Uncles: string
  stateRoot: string
  transactionsRoot: string
  receiptsRoot?: string
  logsBloom: string
  gasLimit: number
  gasUsed: number
  timestamp: number
  extraData: string
  mixHash: string
  nonce: number
  transactions: Web3Transaction[]
}

export interface Block {
  transactions: Web3Transaction[]
  hash: string
  number: number
  timestamp: number
}

export const gasWei = new BigNumber('21000000000000')

export interface Web3EthereumClientConfig {
  http: string | string[]
  logRequests?: boolean
}
