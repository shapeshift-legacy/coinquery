import { BigNumber } from 'bignumber.js'
import { BlockQueueConfig } from './block-queue'
import { blockchain } from './blockchain'
import { GeneralDatabaseConfig } from 'vineyard-ground'
import { Collection, Modeler } from 'vineyard-data/legacy';
import { ServiceRecord } from 'common';

export interface BaseAddress<Identity> {
  id: Identity
  externalAddress: string
  balance: BigNumber
}

export interface BaseBlock {
  hash: string
  index: number
  timeMined: Date
}

export type TransactionDelegate = (
  transaction: blockchain.SingleTransaction
) => Promise<blockchain.SingleTransaction>
export type TransactionCheck = (transaction: blockchain.SingleTransaction) => Promise<boolean>
export type TransactionSaver = (
  source: blockchain.SingleTransaction,
  block: any
) => Promise<blockchain.SingleTransaction | undefined>

export type TransactionQueryDelegateOld = (
  txid: string
) => Promise<blockchain.SingleTransaction | undefined>

export type TransactionSaveDelegateOld = (
  transaction: blockchain.SingleTransaction
) => Promise<void>

export type TransactionStatusDelegateOld = (
  transaction: blockchain.SingleTransaction,
  status: blockchain.TransactionStatus
) => Promise<blockchain.SingleTransaction>

export type TransactionQueryDelegate<Transaction> = (
  txid: string
) => Promise<Transaction | undefined>

export type TransactionSaveDelegate<Transaction> = (transaction: Transaction) => Promise<void>

export type TransactionStatusDelegate<Transaction> = (
  transaction: Transaction,
  status: blockchain.TransactionStatus
) => Promise<Transaction>

export type PendingTransactionDelegate = (
  maxBlockIndex: number
) => Promise<blockchain.SingleTransaction[]>

export type BlockGetterOld = () => Promise<any | undefined>

export type BlockGetter = () => Promise<number | undefined>

export type LastBlockDelegate = (blockIndex: number) => Promise<any | undefined>

export type BlockCurrencyDelegate = (block: BaseBlock) => Promise<void>

export type AddressIdentityDelegate<Identity> = (externalAddress: string) => Promise<Identity>

export interface BlockDao {
  // getBlockByIndex: (index: number) => Promise<blockchain.Block | undefined>
  saveBlock: BlockCurrencyDelegate
}

export interface LastBlockDaoOld {
  getLastBlock: BlockGetterOld
  setLastBlock: LastBlockDelegate
}

export interface LastBlockDao {
  getLastBlock: BlockGetter
  setLastBlock: LastBlockDelegate
}

export interface TransactionDaoOld {
  getTransactionByTxid: TransactionQueryDelegateOld
  saveTransaction: TransactionSaveDelegateOld
  setStatus: TransactionStatusDelegateOld
}

export interface TransactionDao<Transaction> {
  getTransactionByTxid: TransactionQueryDelegate<Transaction>
  saveTransaction: TransactionSaveDelegate<Transaction>
  // setStatus: TransactionStatusDelegate<Transaction>
}

export interface PendingTransactionDao {
  listPendingTransactions: PendingTransactionDelegate
}

export interface MonitorDaoOld {
  blockDao: BlockDao
  lastBlockDao: LastBlockDaoOld
  transactionDao: TransactionDaoOld
}

export interface MonitorDao {
  // blockDao: BlockDao
  lastBlockDao: LastBlockDao
}

export interface LastBlock {
  blockIndex?: number
  currency: number
}

export interface Address {
  id: number
  address: string
}

export interface Currency {
  id: number
  name: string
}

export interface BaseTransaction extends blockchain.BaseTransaction {
}

export interface NewBlock {
  hash: string
  index: number
  currency: number
  timeMined: Date
}

export type Id = string

export interface Block extends NewBlock {
  id: Id
}

export interface ExternalBlock {
  hash: string
  index: number
  timeMined: Date
}

export interface FullBlock<ExternalTransaction> extends ExternalBlock {
  transactions: ExternalTransaction[]
}

export interface NewTransaction {
  txid: string
  amount: BigNumber
  timeReceived: Date
  blockIndex: number
  status: blockchain.TransactionStatus
  to?: string
  from?: string
}

export interface DepositTransaction extends NewTransaction {
  currency: number
  id: Id
}

export interface ExternalTransaction extends NewTransaction {
}

export interface TransactionHandler {
  shouldTrackTransaction(transaction: ExternalTransaction): Promise<boolean>

  onConfirm(transaction: DepositTransaction): Promise<DepositTransaction>

  onSave(transaction: DepositTransaction): Promise<DepositTransaction>
}

export type ID<T extends { id: any }> = T['id']

export interface VillageDatabaseConfig extends GeneralDatabaseConfig {
  devMode?: boolean
}

export type CommonConfig = {
  database: VillageDatabaseConfig
  blockQueue?: BlockQueueConfig
  interval?: number
  profiling?: boolean
}

export interface OptionalMonitorConfig {
  queue: BlockQueueConfig
  minConfirmations?: number
  maxMilliseconds?: number
  maxBlocksPerScan?: number
  profiling?: boolean,
  blockIndex?: number
}

export interface MonitorConfig extends OptionalMonitorConfig {
  minConfirmations: number
}

export interface ValidationRecord {
  blockIndex: number
  valid: boolean
  id?: string
  pass?: number
}

export interface CommonModel {
  ground: Modeler
  Service: Collection<ServiceRecord<any>>
}

export interface IndexRange {
  readonly start: number
  readonly end: number
}
