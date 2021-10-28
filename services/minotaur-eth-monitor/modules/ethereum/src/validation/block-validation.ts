import { EthereumModel } from '../ethereum-explorer'
import {
  batchUpsert,
  blockService,
  BlockServiceState,
  ValidationResult,
  ServiceResult,
  ServiceActionSource,
  IndexRange,
} from 'common'
import { hashTransactions, formatTransactions, hashSingleTransaction } from './hashing';
import { Block } from '../web3/types';
import { EthereumBlock } from '../types';

interface ValidationError {
  type: string
  target?: string
}

async function getBlocksToValidate(model: EthereumModel, start: number, end: number): Promise<EthereumBlock[]> {
  const sql = `
    SELECT "blockIndex", blocks.*
    FROM generate_series(:start, :end) block_range("blockIndex")
    LEFT JOIN blocks ON blocks.index = block_range."blockIndex"
    ORDER BY "blockIndex"
  `
  const blocks: EthereumBlock[] = await model.ground.query(sql, { start, end })

  return blocks;
  // return blocks.map(block => ({
  //   blockIndex: block.blockIndex,
  //   valid: !!block.hash,
  //   data: {}
  // }))
}

function txisValid(tx: any) {
  const hashedTransaction = hashSingleTransaction(tx)
  const valid = hashedTransaction.toString() === tx.hash.toString()
  return valid
}

async function getCurrentBlocksTransactions(model: EthereumModel, blockIndex: number) {
  const sql = `
    SELECT * from transactions WHERE "blockIndex" = ${blockIndex} ORDER BY "transactionIndex";
    `
  const transactions = await model.ground.query(sql);
  return transactions;
}

async function validateBlock(model: EthereumModel, state: BlockServiceState, range: IndexRange): Promise<ServiceResult<BlockServiceState>> {
  const blocksToValidate = await getBlocksToValidate(model, state.blockIndex, state.blockIndex + state.batchSize)
  const records = [];
  const arrIndex = arrayRange(state.blockIndex, state.blockIndex + state.batchSize);

  for (let i = 0; i < arrIndex.length; i++) {
    const errorInfo: ValidationError[] = [];
    const ourBlock = blocksToValidate.filter(block => block.index === arrIndex[i])
    if (!ourBlock[0])
      errorInfo.push({ type: 'missingBlock' })

    const transactions = await model.Transaction.filter({ blockIndex: arrIndex[i] }).sort(['transactionIndex'])
    const transactionsWithValidationFields = formatTransactions(transactions)
    const generatedTransactionsRoot = await hashTransactions(transactionsWithValidationFields)
    if (ourBlock[0] && ourBlock[0].transactionsRoot != generatedTransactionsRoot)
      errorInfo.push({ type: 'badTxRoot' })
    transactions.map(tx => {
      if (!txisValid(tx))
        errorInfo.push({ type: 'badTx', target: tx.hash })
    })

    Object.keys(errorInfo).length > 0
      ? records.push({ blockIndex: arrIndex[i], valid: false, data: errorInfo })
      : records.push({ blockIndex: arrIndex[i], valid: true, data: errorInfo })
  }
  console.log(records)
  records.filter(i => !!i)
  
  await batchUpsert(model.ground, model.ValidationRecord.getTrellis(), records)
  return {
    state,
    shouldContinue: true
  }
}

export function validateBlocksAction(model: EthereumModel): ServiceActionSource<BlockServiceState> {
  const actionSource = async (state: BlockServiceState) => {
    return (state: BlockServiceState, range: IndexRange) => validateBlock(model, state, range)
  }
  return blockService(model, actionSource)
}

function arrayRange(start: number, end: number): number[] {
  const result: number[] = []
  for (let i = start; i < end; i++) {
    result.push(i)
  }
  return result
}