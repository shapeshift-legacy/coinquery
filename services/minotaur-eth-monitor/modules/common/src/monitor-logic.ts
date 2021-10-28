import { deleteFullBlocks } from './database-functions'
import { CompositeProfiler, EmptyProfiler, Profiler, SimpleProfiler } from './utility'
import { BlockQueue, BlockQueueConfig, BlockSource } from './block-queue'
import { LastBlockDao, MonitorConfig } from './types'
import { Modeler } from 'vineyard-data/legacy'
import { blockchain } from './blockchain'
import { logger } from './winston/winston-loggers'
import { StatsD } from 'hot-shots';
import { BlockServiceState, Service, ServiceResult, setServiceBlockIndex } from 'common';

export enum ScannedBlockStatus {
  _new,
  same,
  replaced
}

export type BlockSaver<Block, Transaction> = (
  bundles: blockchain.BlockBundle<Block, Transaction>[],
  profiler: Profiler
) => Promise<void>

export interface IndexedHashedBlock {
  hash: string
  index: number
}

async function getHighestBlockIndex<B, T>(client: blockchain.BlockReader<B, T>): Promise<number> {
  try {
    return await client.getHeighestBlockIndex()
  }
  catch (error) {
    console.error('Http error getting block height', error)
    return getHighestBlockIndex(client)
  }
}

export async function createBlockQueue<Block, Transaction>(
  client: blockchain.BlockReader<Block, Transaction>,
  queueConfig: Partial<BlockQueueConfig>,
  minConfirmations: number,
  startingBlockIndex: number
): Promise<BlockQueue<blockchain.BlockBundle<Block, Transaction>>> {
  const highestBlock = await getHighestBlockIndex(client)
  const startingBlock = Math.max(0, startingBlockIndex - minConfirmations)
  logger.log({
    level: 'info',
    title: 'Debugging Monitor Logic',
    message: `highestBlock: ${highestBlock}, startingBlock1: ${startingBlockIndex}, startingBlock2: ${startingBlock},`
  })
  const blockSource: BlockSource<blockchain.BlockBundle<Block, Transaction>> = (index: number) =>
    client.getBlockBundle(index)
  return new BlockQueue(
    blockSource,
    startingBlock,
    highestBlock,
    queueConfig
  )
}

export function compareBlockHashes<T extends IndexedHashedBlock>(
  ground: Modeler,
  blocks: T[]
): PromiseLike<(IndexedHashedBlock & { status: ScannedBlockStatus })[]> {
  const values: any = blocks.map(block => `(${block.index}, '${block.hash}')`)

  const sql = `
SELECT 
  temp."hash",
  temp."index",
  CASE 
    WHEN blocks.hash IS NULL THEN 0
    WHEN temp.hash = blocks.hash THEN 1
    ELSE 2
  END
  AS status   
FROM (VALUES ${values}) AS temp ("index", "hash")
LEFT JOIN blocks
ON temp."index" = blocks."index" 
  `

  return ground.query(sql)
}

export function mapBlocks<Block extends IndexedHashedBlock, Transaction>(
  fullBlocks: blockchain.BlockBundle<Block, Transaction>[]
): (s: IndexedHashedBlock) => blockchain.BlockBundle<Block, Transaction> {
  return (simple: IndexedHashedBlock) => fullBlocks.filter(b => b.block.index == simple.index)[0]
}

const dogstatsd = new StatsD()

export async function scanBlocks<Block extends IndexedHashedBlock, Transaction>(
  blockQueue: BlockQueue<blockchain.BlockBundle<Block, Transaction>>,
  saveFullBlocks: BlockSaver<Block, Transaction>,
  ground: Modeler,
  lastBlockDao: LastBlockDao,
  config: MonitorConfig,
  service: Service,
  outerProfiler: Profiler,
  model: any
): Promise<any> {
  throw new Error('No longer supported.  Switch to scanBlocks2.')
}

export async function scanBlocks2<Block extends IndexedHashedBlock, Transaction, State extends BlockServiceState>(
  blockQueue: BlockQueue<blockchain.BlockBundle<Block, Transaction>>,
  state: State,
  saveFullBlocks: BlockSaver<Block, Transaction>,
  ground: Modeler,
  lastBlockDao: LastBlockDao,
  config: MonitorConfig,
  outerProfiler: Profiler,
  model: any
): Promise<ServiceResult<State>> {

  const localProfiler = config.profiling ? new SimpleProfiler() : new EmptyProfiler()
  const profiler = new CompositeProfiler([
    outerProfiler,
    localProfiler
  ])

  profiler.start('getBlocks')
  const bundles = await blockQueue.getBlocks()
  profiler.stop('getBlocks')
  if (bundles.length == 0) {
    logger.log({
      level: 'info',
      title: 'Monitor Logic',
      message: 'No more blocks found.'
    })
    return {
      shouldContinue: false,
      state
    }
  }

  dogstatsd.gauge('blockQueue.requestedBlocks', blockQueue.getRequestCount())
  dogstatsd.gauge('blockQueue.readyBlocks', blockQueue.getReadyBlockCount())
  dogstatsd.gauge('blockQueue.consecutiveBlocks', blockQueue.getConsecutiveBlockCount())
  // console.log('blockQueue', blockQueue.getRequestCount(), blockQueue.getReadyBlockCount(), blockQueue.getConsecutiveBlockCount())

  const readyBlockString = bundles
    .map((b: any) => b.block.index)
    .sort()
    .map((i: number) => {
      const bundle = bundles.filter((b: any) => b.block.index === i)[0]
      return '' + i + '(' + bundle.transactions.length + ')'
    })
    .join(', ')

  // console.log('Saving blocks', bundles.length, readyBlockString)
  dogstatsd.gauge('eth.db.blockHeight', bundles[bundles.length - 1].block.index)

  const blocks = bundles.map(b => b.block)
  const blockComparisons = await compareBlockHashes(ground, blocks)

  const blockMapper = mapBlocks(bundles)
  const newBlocks = blockComparisons
    .filter(b => b.status == ScannedBlockStatus._new)
    .map(blockMapper)

  const replacedBlocks = blockComparisons
    .filter(b => b.status == ScannedBlockStatus.replaced)
    .map(blockMapper)

  profiler.start('saveBlocks')
  const blocksToDelete = replacedBlocks.map(bundle => bundle.block.index)
  if (blocksToDelete.length > 0) {
    logger.log({
      level: 'info',
      title: 'Deleting blocks',
      message: 'Deleting blocks',
      data: blocksToDelete
    })
    await deleteFullBlocks(ground, blocksToDelete)
  }

  const blocksToSave = newBlocks.concat(replacedBlocks)

  if (blocksToSave.length > 0) {
    await saveFullBlocks(blocksToSave, profiler)
  }
  else {
    const sortedBlocks = blocks.sort((a, b) => b.index - a.index)
    logger.log({
      level: 'info',
      title: 'No new blocks',
      message: 'No new blocks to save for range ' + sortedBlocks[sortedBlocks.length - 1].index + ' - ' + sortedBlocks[0].index,
      data: blocks.map(block => block.index)
    })
  }
  const lastBlockIndex = blocks.sort((a, b) => b.index - a.index)[0].index
  // await service.setIndex(model, lastBlockIndex)
  profiler.stop('saveBlocks')
  // localProfiler.logFlat()
  return {
    shouldContinue: true,
    state: Object.assign(state, { blockIndex: lastBlockIndex + 1 })
  }
}
