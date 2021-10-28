import { 
  startServiceCron,
  ServiceResult,
  BlockServiceState,
  getServiceState,
  IndexRange,
  blockService
} from 'common';
import {
  convertStatus,
  createEthereumVillage,
  EthereumTransaction,
  getTransactionReceipt,
  initializeMultiProvider,
  partitionedMap,
  EthereumModel,
  TransactionLog,
} from '../src'
import { StatsD } from 'hot-shots'

require('source-map-support').install()

const { ethereumConfig } = require('../config/config')
const Web3 = require('web3')

const dogstatsd = new StatsD()

export async function processReceipt(model: any, web3: any, transaction: EthereumTransaction) {
  const receipt = await getTransactionReceipt(web3, transaction.hash)
  if (!receipt)
    return 0

  const transactionLogQuery = generateTransactionLogQuery(receipt.logs)
  const postRoot = receipt.root ? `'${receipt.root}'` : null
  const status = receipt.status ? convertStatus(receipt.status) : null
  const sql = `BEGIN;
      INSERT INTO "receipts" ("hash", "postRoot", "status", "gasUsed", "cumulativeGasUsed", "logsBloom", "created") VALUES
        ('${transaction.hash}', ${postRoot}, ${status}, ${receipt.gasUsed}, ${receipt.cumulativeGasUsed}, '${receipt.logsBloom}', NOW()) ON CONFLICT DO NOTHING;
        ${transactionLogQuery}
        COMMIT;
        ` 

  await model.ground.query(sql)

  if (receipt.contractAddress) {
    const sql = `
      INSERT INTO "contracts" ("address", "transaction", "created", "modified") VALUES
        ('${transaction.hash}', '${receipt.contractAddress}', NOW(), NOW()) ON CONFLICT DO NOTHING;
        `
    await model.ground.query(sql)
  }

  return receipt.logs.length
}

export async function scanReceipts(model: EthereumModel, state: BlockServiceState, range: IndexRange): Promise<ServiceResult<BlockServiceState>> {
  const web3 = await new Web3(initializeMultiProvider(ethereumConfig.ethereum.client))
  
  const transactions = await model.Transaction.filter({ blockIndex: state.blockIndex })

  const logCounts = await partitionedMap(
      10,
    tx => processReceipt(model, web3, tx),
      transactions
    )

  dogstatsd.increment('eth.db.saveReceipts', transactions.length)

  const logCount = logCounts.reduce((a, b) => a + b, 0)
  if (logCount > 0)
      dogstatsd.increment('eth.db.saveLogs', logCount)

  dogstatsd.gauge('eth.db.saveReceiptsBlock', state.blockIndex)

  return {
    shouldContinue: true,
    state
  }
}

function generateTransactionLogQuery(transactionLogs: TransactionLog[]): string {
  if (transactionLogs.length == 0)
    return ''

  const header =
    'INSERT INTO "transaction_logs" ("transaction", "data", "index", "removed", "topics", "created") VALUES\n'

  const transactionLogClauses = transactionLogs.map(log => {
    return `('${log.transactionHash}', '${log.data}', ${log.logIndex}, ${log.removed}, '${JSON.stringify(log.topics)}', NOW())`
  })

  return header + transactionLogClauses.join(',\n') + ' ON CONFLICT DO NOTHING;'
}

async function startValidateHeaders() {
  const village = await createEthereumVillage(ethereumConfig)
  const actionSource = blockService(village.model, async (state: BlockServiceState) => {
    return async (state: BlockServiceState, range: IndexRange) => 
      await scanReceipts(village.model, state, range)
  })
  await startServiceCron(village.model, 'receipt-scan', actionSource)
}

startValidateHeaders()