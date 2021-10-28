import { createEthereumVillage, EthereumModel } from '../src'
import { hashReceipts } from '../src/validation/hashing'
import {
  logger,
  saveValidationRecord,
  startServiceCron,
  ServiceState,
  ServiceResult,
  ValidationServiceState
} from 'common'
const { ethereumConfig } = require('../config/config')

async function validateHeaderAction(model: EthereumModel): Promise<any> {
  return async (state: ValidationServiceState) => {
    return async () => {
      const result = await validateReceiptsRoot(state, model)
      return result
    }
  }
}

async function validateReceiptsRoot(state: ValidationServiceState, model: EthereumModel): Promise<ServiceResult<ValidationServiceState>> {
  logger.log({
    level: 'info',
    title: 'Receipt Validator',
    message: 'Scanning for invalid receipts...'
  })

  const block: any = await model.Block.filter({ index: state.blockIndex }).first().range(0, 1)

  if (!block) {
    logger.log({
      level: 'error',
      title: 'Receipt Validation Error',
      message: `Block ${state.blockIndex} does not exist in the DB`
    })
    return {
      state,
      shouldContinue: false
    }
  }

  const transactions = await model.Transaction.filter({ blockIndex: state.blockIndex })
  const receipts: any[] = []
    
  for (const transaction of transactions) {
      const receipt: any = await model.Receipt.filter({ hash: transaction.hash }).first()
      const transactionLogs = await model.TransactionLog.filter({ transaction: transaction.hash }).sort(['index'])
      receipt.logs = transactionLogs
      receipts.push(receipt)
    }
    // TODO: may need to sort the receipts based on cumulativeGasUsed, but right now they are coming back in the right order
    // (receipts must be in the right order for hashing)

  throw new Error('Needs updating')
}

async function startValidateHeaders() {
  const village = await createEthereumVillage(ethereumConfig)
  const actionSource = await validateHeaderAction(village.model)
  await startServiceCron(village.model, 'validate-receipts', actionSource)
}

startValidateHeaders()