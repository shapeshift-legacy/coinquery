import {
  EthereumJSTransactionFields,
  EthereumTransaction,
  LogValidationFields,
  Receipt,
  ReceiptValidationFields,
  TransactionLog,
  TransactionValidationFields,
} from '../types'

import { BigNumber } from 'bignumber.js'

const Trie = require('merkle-patricia-tree')
const ethereumBlocks = require('ethereumjs-block')
const EthereumJsTransaction = require('ethereumjs-tx')
const rlp = require('rlp')

export function hashBlockHeader(block: any) {
  const web3Header = new ethereumBlocks.Header([
    block.parentHash,
    block.uncleHash,
    block.coinbase,
    block.stateRoot,
    block.transactionsRoot,
    block.receiptsRoot,
    block.bloom,
    '0x' + Number(block.difficulty).toString(16),
    '0x' + block.index.toString(16),
    '0x' + Number(block.gasLimit).toString(16),
    '0x' + Number(block.gasUsed).toString(16),
    '0x' + Math.round(block.timeMined.getTime() / 1000).toString(16),
    block.extraData,
    block.mixHash,
    block.nonce
  ])

  return '0x' + web3Header.hash().toString('hex')
}

export function formatTransactions(
  transactions: EthereumTransaction[]
): TransactionValidationFields[] {
  return transactions.map(tx => {
    let toValue
    if (tx.to !== 'undefined' && tx.to !== null) {
      toValue = tx.to
    } else {
      toValue = undefined
    }
    return {
      hash: tx.hash,
      nonce: tx.nonce,
      gasPrice: tx.gasPrice,
      gasLimit: tx.gasLimit,
      amount: tx.amount,
      inputData: tx.inputData,
      to: toValue,
      v: tx.v,
      r: tx.r,
      s: tx.s
    }
  })
}

export function prepareEthereumJsTransaction(
  tx: TransactionValidationFields
): EthereumJSTransactionFields {
  return {
    nonce: tx.nonce,
    gasPrice: '0x' + tx.gasPrice.toString(16),
    gasLimit: tx.gasLimit,
    to: tx.to,
    value: '0x' + tx.amount.toString(16),
    data: tx.inputData,
    v: tx.v,
    r: tx.r,
    s: tx.s
  }
}

export async function arrayToRlpTrie(items: any[]): Promise<any> {
  const txTrie = new Trie()
  for (let i = 0; i < items.length; ++i) {
    const item = items[i]
    // txTrie.put is asynchronous, possibly because it supports writing to disk,
    // even though this function isn't performing any disk IO.
    await new Promise(resolve => txTrie.put(rlp.encode(i), item, resolve))
  }
  return txTrie
}

export async function hashTransactions(
  transactions: TransactionValidationFields[]
): Promise<string> {
  const txTrie = new Trie()
  for (let i = 0; i < transactions.length; ++i) {
    const input = transactions[i]
    const converted = prepareEthereumJsTransaction(input)
    const transaction = new EthereumJsTransaction(converted)
    const hash = '0x' + transaction.hash().toString('hex')
    // if (hash != input.hash)
    //   throw new Error('Invalid transaction contents: tx.hash = ' + input.hash + ', derived hash = ' + hash)

    // txTrie.put is asynchronous, possibly because it supports writing to disk,
    // even though this function isn't performing any disk IO.
    await new Promise(resolve => txTrie.put(rlp.encode(i), transaction.serialize(), resolve))
  }
  return '0x' + txTrie.root.toString('hex')
}

export function hashSingleTransaction(
  transaction: TransactionValidationFields
): string {
  const converted = prepareEthereumJsTransaction(transaction)
  const ethereumJsTransaction = new EthereumJsTransaction(converted)
  return '0x' + ethereumJsTransaction.hash().toString('hex')
}

export function formatReceipts(transactions: EthereumTransaction[], logs: TransactionLog[]): ReceiptValidationFields[] {
  return transactions.map(t => {
    let transactionStatus = '0x0'
    if (t.status === 3) transactionStatus = '0x1'

    const transactionLogs: any = []
    logs.forEach(log => {
      if (log.transactionHash === t.hash) {
        const formattedLog = formatLog(log)
        transactionLogs.push(formattedLog)
      }
    })

    return {
      cumulativeGasUsed: '0x' + t.cumulativeGasUsed.toString(16),
      logs: transactionLogs,
      logsBloom: t.logsBloom,
      status: transactionStatus
    }
  })
}

function toHexString(value: number | BigNumber): string {
  return '0x' + value.toString(16)
}

function formatLog(log: TransactionLog): LogValidationFields {
  return {
    address: log.address,
    blockHash: log.blockHash,
    blockNumber: '0x' + log.blockNumber.toString(16),
    data: log.data,
    logIndex: '0x' + log.logIndex.toString(16),
    removed: log.removed,
    topics: log.topics,
    transactionHash: log.transactionHash,
    transactionIndex: '0x' + log.transactionIndex.toString(16)
  }
}

interface HexReceiptLog {
  address: string
  topics: string[]
  data: string
}

interface HexReceipt {
  status?: string
  cumulativeGasUsed: string
  logsBloom: string
  logs?: HexReceiptLog[] | null
  root?: string
}

async function asyncMap<I, O>(items: I[], action: (i: I) => Promise<O>): Promise<O[]> {
  const result = []
  for (let i = 0; i < items.length; ++i) {
    const item = items[i]
    result.push(await action(item))
  }
  return result
}

async function encodeReceipt(receipt: HexReceipt): Promise<any[]> {
  const receiptBuffers = [
    receipt.root || receipt.status || '0x0',
    receipt.cumulativeGasUsed,
    receipt.logsBloom,
    receipt.logs ? receipt.logs.map(log => [
        log.address,
        log.topics,
        log.data
      ])
      : []
  ]
  return rlp.encode(receiptBuffers)
}

export async function encodeReceipts(receipts: HexReceipt[]): Promise<any[]> {
  return await asyncMap(receipts, async receipt => await encodeReceipt(receipt))
}

export async function hashHexReceipts(receipts: HexReceipt[]): Promise<string> {
  const data = await encodeReceipts(receipts)
  // const inputDataHex = data.map(i => i.toString('hex'))
  const recTrie = await arrayToRlpTrie(data)
  return '0x' + recTrie.root.toString('hex')
}

export async function hashReceipts(receipts: Receipt[]): Promise<string> {
  const hexReceipts: HexReceipt[] = receipts.map(r => ({
    root: r.postRoot,
    status: r.status ? toHexString(r.status) : undefined,
    cumulativeGasUsed: toHexString(r.cumulativeGasUsed),
    logsBloom: r.logsBloom,
    logs: r.logs ? r.logs.map(log => ({
      address: log.address,
      topics: log.topics,
      data: log.data
    })) : [],
  }))

  return hashHexReceipts(hexReceipts)
}