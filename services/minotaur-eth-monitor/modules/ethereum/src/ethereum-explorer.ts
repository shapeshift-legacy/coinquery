import { BigNumber } from 'bignumber.js'
import { Collection, Modeler } from 'vineyard-data/legacy'
import {
  Address,
  AddressMap,
  blockchain,
  CommonModel,
  createIndexedLastBlockDao,
  flatMap,
  LastBlock,
  MonitorDao,
  Profiler,
  saveAddresses,
  ValidationRecord
} from 'common'
import {
  ContractTransaction,
  EthereumBlock,
  EthereumTransaction,
  PartitionConfig,
  Receipt,
  TransactionLog
} from './types'
import { convertStatus } from '../src'
import { getNullableChecksumAddress } from './web3'
import { StatsD } from 'hot-shots';

const dogstatsd = new StatsD()

type BlockBundle = blockchain.BlockBundle<EthereumBlock, ContractTransaction>

export type SingleTransactionBlockClient = blockchain.BlockReader<EthereumBlock,
  ContractTransaction>

export type AddressDelegate = (externalAddress: string) => Promise<number>

export interface EthereumModel extends CommonModel {
  Address: Collection<Address>
  Currency: Collection<any>
  Contract: Collection<blockchain.Contract & { id: number }>
  Block: Collection<EthereumBlock>
  Transaction: Collection<EthereumTransaction & { id: number }>
  LastBlock: Collection<LastBlock>
  TransactionLog: Collection<TransactionLog>
  Receipt: Collection<Receipt>
  ValidationRecord: Collection<ValidationRecord>
  ground: Modeler
}

export interface EthereumMonitorDao extends MonitorDao {
  getOrCreateAddress: AddressDelegate
  ground: Modeler
}

export async function getOrCreateAddressReturningId(
  addressCollection: Collection<Address>,
  externalAddress: string
): Promise<number> {
  const internalAddress = await addressCollection.first({ address: externalAddress })
  return internalAddress
    ? internalAddress.id
    : (await addressCollection.create({ address: externalAddress })).id
}

export function createEthereumExplorerDao(model: EthereumModel): EthereumMonitorDao {
  return {
    // blockDao: {
    //   saveBlock: (block: any) => saveSingleCurrencyBlock(model.Block, block)
    // },
    lastBlockDao: createIndexedLastBlockDao(model.ground, 2),
    // transactionDao: createSingleCurrencyTransactionDao(model),
    getOrCreateAddress: (externalAddress: string) =>
      getOrCreateAddressReturningId(model.Address, externalAddress),
    ground: model.ground
  }
}

function gatherAddresses(
  bundles: BlockBundle[],
  contracts: blockchain.Contract[]
) {
  const addresses: AddressMap = {}
  for (const bundle of bundles) {
    for (const transaction of bundle.transactions) {
      if (transaction.to) addresses[transaction.to] = -1

      if (transaction.from) addresses[transaction.from] = -1
    }
  }

  for (const contract of contracts) {
    addresses[contract.address] = -1
  }

  return addresses
}

function gatherTransactionLogs(transactions: ContractTransaction[]): TransactionLog[] {
  const logs: TransactionLog[] = []
  transactions.forEach(t => {
    t.logs.forEach(log => {
      logs.push(log)
    })
  })
  return logs
}

export async function saveEthereumBlocks(ground: Modeler, blocks: EthereumBlock[]) {
  if (blocks.length === 0) {
    throw new Error('blocks array must not be empty')
  }
  const header =
    'INSERT INTO "blocks" ("index", "hash", "timeMined", "bloom", "coinbase", "difficulty", "extraData", "gasLimit", "parentHash", "receiptsRoot", "stateRoot", "transactionsRoot", "uncleHash", "gasUsed", "mixHash", "nonce", "created") VALUES\n'
  const inserts: string[] = []
  for (const block of blocks) {
    inserts.push(
      `(${block.index}, '${block.hash}', '${block.timeMined.toISOString()}', '${block.bloom}', '${block.coinbase}', '${block.difficulty}', '${block.extraData}', '${block.gasLimit}', '${block.parentHash}', '${block.receiptsRoot}', '${block.stateRoot}', '${block.transactionsRoot}', '${block.uncleHash}', ${block.gasUsed}, '${block.mixHash}', '${block.nonce}', NOW())`
    )
  }

  const sql = header + inserts.join(',\n') + ' ON CONFLICT DO NOTHING;'
  return ground.querySingle(sql)
}

export async function saveEthereumBlock(ground: Modeler, block: EthereumBlock) {
  const header =
    'INSERT INTO "blocks" ("index", "hash", "timeMined", "bloom", "coinbase", "difficulty", "extraData", "gasLimit", "parentHash", "receiptsRoot", "stateRoot", "transactionsRoot", "uncleHash", "gasUsed", "mixHash", "nonce", "created") values\n'
  const inserts = `(${block.index}, '${block.hash}', '${block.timeMined.toISOString()}', '${block.bloom}', '${block.coinbase}', '${block.difficulty}', '${block.extraData}', '${block.gasLimit}', '${block.parentHash}', '${block.receiptsRoot}', '${block.stateRoot}', '${block.transactionsRoot}', '${block.uncleHash}', ${block.gasUsed}, '${block.mixHash}', '${block.nonce}', NOW())`
  const sql = `${header} ${inserts} ON CONFLICT DO NOTHING;`
  return ground.querySingle(sql)
}

export function saveTransactionLogs(ground: any, transactionLogs: TransactionLog[]) {
  const header =
    'INSERT INTO "transaction_logs" ("transaction", "index", "data", "removed", "topics", "created") VALUES\n'

  const transactionLogClauses = transactionLogs.map(log => {
    return `('${log.transactionHash}', ${log.logIndex}, '${log.data}', ${log.removed}, '${JSON.stringify(log.topics)}', NOW())`
  })

  if (transactionLogClauses.length == 0) return Promise.resolve()

  const sql = header + transactionLogClauses.join(',\n') + ' ON CONFLICT DO NOTHING;'
  return ground.querySingle(sql)
}

function stringOrNull(value: any): string | null {
  return value !== undefined && value !== null
    ? `'${value}'`
    : null
}

export function saveEthereumTransactions(
  ground: any,
  transactions: ContractTransaction[],
  tableName: string = 'transactions'
) {
  const header =
    `INSERT INTO "${tableName}" ("postRoot", "status", "to", "from", "hash", "amount", "gasLimit", "gasUsed", "gasPrice", "cumulativeGasUsed", "nonce", "timeReceived", "blockIndex", "v", "r", "s", "inputData", "transactionIndex", "created") VALUES\n`
  const transactionClauses = transactions.map(t => {
    const postRoot = t.postRoot ? t.postRoot : null
    const status = t.status ? t.status : null
    return `(${postRoot}, ${status}, ${stringOrNull(t.to)}, ${stringOrNull(t.from)}, '${t.txid}', ${t.amount}, ${t.gasLimit}, ${t.gasUsed}, ${t.gasPrice}, ${t.cumulativeGasUsed}, ${t.nonce}, '${t.timeReceived.toISOString()}', ${t.blockIndex}, '${t.v}', '${t.r}', '${t.s}', '${t.inputData}', ${t.transactionIndex}, NOW())`
  })

  if (transactionClauses.length == 0) return Promise.resolve()

  const sql = header + transactionClauses.join(',\n')
  return ground.querySingle(sql)
}

export function formatWeb3Transactions(transactions: any[], blockTimestamp: number): any[] {
  return transactions.map(tx =>
    (
      {
        postRoot: undefined,
        status: 3,
        to: getNullableChecksumAddress(tx.to),
        from: getNullableChecksumAddress(tx.from),
        txid: tx.hash,
        amount: tx.value,
        gasLimit: tx.gas,
        gasUsed: -1,
        gasPrice: tx.gasPrice,
        cumulativeGasUsed: -1,
        nonce: tx.nonce,
        timeReceived: new Date(blockTimestamp * 1000),
        blockIndex: tx.blockNumber,
        v: tx.v,
        r: tx.r,
        s: tx.s,
        inputData: tx.input,
        transactionIndex: tx.transactionIndex
      }
    )
  )
}

export async function saveFullBlocks(
  ground: Modeler,
  bundles: BlockBundle[],
  profiler: Profiler,
  partitionConfig: PartitionConfig
): Promise<void> {
  const transactions = flatMap(bundles, b => b.transactions)
  const events = flatMap(transactions, t => t.events || [])

  async function profile(name: string, operation: () => Promise<any>): Promise<void> {
    profiler.start(name)
    await operation()
    profiler.stop(name)
  }

  const transactionLogs = gatherTransactionLogs(transactions)
  const addresses = gatherAddresses(bundles, [])
  dogstatsd.increment('eth.db.saveBlocks', bundles.length)
  dogstatsd.increment('eth.db.saveTransactions', transactions.length)
  dogstatsd.increment('eth.db.saveAddresses', Object.keys(addresses).length)
  await Promise.all([
    profile('db.blocks', () => saveEthereumBlocks(ground, bundles.map(b => b.block))),
    profile('db.addresses', () => saveAddresses(ground, addresses)),
    profile('db.transactions', () => saveEthereumTransactions(ground, transactions)),
    saveTransactionLogs(ground, transactionLogs),
  ])
}

export async function saveFullBlock(
  ground: Modeler,
  bundle: BlockBundle,
): Promise<void> {
  const transactions = bundle.transactions
  const events = transactions.map(t => t.events || [])
  const transactionLogs = gatherTransactionLogs(transactions)
  await saveEthereumBlock(ground, bundle.block)
  await saveEthereumTransactions(ground, transactions)
  await saveTransactionLogs(ground, transactionLogs)
}

export function getEthereumExplorerSchema(): any {
  return require('./ethereum-explorer-schema.json')
}
