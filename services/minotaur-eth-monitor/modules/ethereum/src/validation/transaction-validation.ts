import { logger, saveValidationRecord, ServiceState, ServiceResult, ValidationServiceState } from 'common'
import { EthereumModel } from '../ethereum-explorer';
import { formatTransactions, hashSingleTransaction } from './hashing';

async function validateTransactions(state: ValidationServiceState, model: EthereumModel): Promise<ServiceResult<ValidationServiceState>> {
  const block = await model.Block.first({ index: state.blockIndex })

  if (block) {
    const transactions = await model.Transaction.filter({ blockIndex: state.blockIndex })
    const transactionsWithValidationFields = formatTransactions(transactions)

    for (const transaction of transactionsWithValidationFields) {
      const hashedTransaction = hashSingleTransaction(transaction)
      const valid = hashedTransaction !== transaction.hash
      await saveValidationRecord(model.ground, 'validated_transactions', {
        id: transaction.hash,
        valid,
        blockIndex:state.blockIndex,
        pass: state.pass
      })
     }
  }
  return {
    shouldContinue: true,
    state: Object.assign(state, { blockIndex: state.blockIndex - 1 })
  }
}

export function validateTransactionAction(model: EthereumModel): any {
  return async (state: ValidationServiceState) => {
    return async () => {
      const result = await validateTransactions(state, model)
      return result
    }
  }
}