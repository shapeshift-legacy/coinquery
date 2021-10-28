import { EthereumModel } from '../ethereum-explorer'
import {
 batchUpsert,
 blockService,
 BlockServiceState,
 ServiceActionSource,
 ValidationResult,
 ServiceResult,
 ValidationServiceState
} from 'common'

async function validateMissingBlock(model: EthereumModel, start: number, end: number): Promise<ValidationResult> {
 const sql = `
    SELECT "blockIndex", blocks.hash
    FROM generate_series(:start, :end) block_range("blockIndex")
    LEFT JOIN blocks ON blocks.index = block_range."blockIndex"
    ORDER BY "blockIndex"
  `
 const blocks = await model.ground.query(sql, { start, end })

 return blocks.map(block => ({
  blockIndex: block.blockIndex,
  valid: !!block.hash,
  data: {}
 }))
}

async function validateBlock(model: EthereumModel, state: BlockServiceState, batchSize: number): Promise<ServiceResult<BlockServiceState>> {
 const missingBlocks = await validateMissingBlock(model, state.blockIndex, state.blockIndex + batchSize)
 const records = missingBlocks
 await batchUpsert(model.ground, model.ValidationRecord.getTrellis(), records)
 return {
  state,
  shouldContinue: true
 }
}

export function validateMissingBlocksAction(model: EthereumModel): any {
  return false
//  return blockService(model,
//   (state, range) => validateBlock(model, state, range)
//  )
}