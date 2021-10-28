import { logger } from './winston/winston-loggers';

export interface BlockRequest {
  blockIndex: number
  promise: any
}

interface BlockWrapper<Block> {
  index: number
  block: Block
}

export interface BlockQueueConfig {
  maxSize: number
  maxBlockRequests?: number
  minSize: number
}

interface InternalBlockQueueConfig {
  maxSize: number
  maxBlockRequests: number
  minSize: number
}

const blockQueueConfigDefaults = {
  maxSize: 10,
  maxBlockRequests: 5,
  minSize: 1
}

type SimpleFunction = () => Promise<any>

export type BlockSource<T> = (index: number) => Promise<T>

export class BlockQueue<Block> {
  private blocks: BlockWrapper<Block>[] = []
  private blockIndex: number
  private highestBlockIndex: number
  private blockSource: BlockSource<Block>
  private config: InternalBlockQueueConfig
  private maxReadySize: number = 100
  requests: BlockRequest[] = []
  private listeners: {
    resolve: (block: Block[]) => void
    reject: (error: Error) => void
  }[] = []

  constructor(
    blockSource: BlockSource<Block>,
    blockIndex: number,
    highestBlockIndex: number,
    config: Partial<BlockQueueConfig>
  ) {
    this.blockSource = blockSource
    this.blockIndex = blockIndex
    this.highestBlockIndex = highestBlockIndex
    this.config = { ...blockQueueConfigDefaults, ...config }
  }

  getRequestCount(): number {
    return this.requests.length
  }

  getReadyBlockCount(): number {
    return this.blocks.length
  }

  getConsecutiveBlockCount(): number {
    return this.getConsecutiveBlocks().length
  }

  getReadyBlocks(): any[] {
    return this.blocks
  }

  getBlockIndex(): number {
    return this.blockIndex
  }

  private removeRequest(blockIndex: number) {
    this.requests = this.requests.filter(r => r.blockIndex != blockIndex)
  }

  private removeBlocks(blocks: BlockWrapper<Block>[]) {
    this.blocks = this.blocks.filter(b => blocks.every(b2 => b2.index != b.index))
  }

  private onResponse(blockIndex: number, block: Block | undefined) {
    this.removeRequest(blockIndex)

    if (!block) {
      if (this.listeners.length > 0) {
        const listeners = this.listeners
        this.listeners = []
        for (const listener of listeners) {
          listener.reject(new Error('Error loading block'))
        }
      }
    } else {
      this.blocks.push({ block, index: blockIndex })
      const listeners = this.listeners
      if (this.listeners.length > 0) {
        const readyBlocks = this.limitReadyBlocks(this.getConsecutiveBlocks())
        if (readyBlocks.length >= this.config.minSize || this.requests.length == 0) {
          this.listeners = []
          this.removeBlocks(readyBlocks)
          for (const listener of listeners) {
            listener.resolve(readyBlocks.map(w => w.block))
          }
        }
      }
    }
    this.fillWithNewRequests()
  }

  private addRequest(index: number) {
    // console.log('add block', index)
    const tryRequest: SimpleFunction = async () => {
      try {
        const block = await this.blockSource(index)
        await this.onResponse(index, block)
      } catch (error) {
        logger.log({
          level: 'error',
          title: 'Block Queue',
          message: `Error reading block ${index} ${error.stack}`
        })
        await tryRequest()
        // this.onResponse(index, undefined)
      }
    }

    const promise = tryRequest()
    this.requests.push({
      promise,
      blockIndex: index
    })
  }

  private getNextRequestCount(): number {
    const remaining = this.highestBlockIndex - this.blockIndex
    const count = Math.min(
      remaining,
      this.config.maxBlockRequests - this.requests.length,
      this.maxReadySize - this.requests.length - this.blocks.length
    )
    return count < 0 ? 0 : count
  }

  private fillWithNewRequests() {
    const requestCount = this.getNextRequestCount()
    if (requestCount < 1) return

    // console.log(
    //   'Adding blocks',
    //   Array.from([requestCount], (x, i) => i + this.blockIndex).join(', ')
    // )
    for (let i = 0; i < requestCount; ++i) {
      this.addRequest(this.blockIndex++)
    }
  }

  // Ensures that batches of blocks are returned in consecutive order
  private getConsecutiveBlocks(): BlockWrapper<Block>[] {
    if (this.blocks.length == 0) return []

    const results = this.blocks.concat([]).sort((a, b) => (a.index > b.index ? 1 : -1))
    const oldestRequest = this.requests.map(r => r.blockIndex).sort()[0]
    const oldestResult = results[0].index
    if (oldestRequest && oldestResult > oldestRequest) {
      return []
    }

    const blocks: BlockWrapper<Block>[] = []
    let i = oldestResult
    for (const r of results) {
      if (r.index != i++) break

      blocks.push(r)
    }

    return blocks
  }

  private async addListener() {
    return new Promise<Block[]>((resolve, reject) => {
      this.listeners.push({
        resolve,
        reject
      })
    })
  }

  private releaseBlocks(blocks: BlockWrapper<Block>[]): Promise<Block[]> {
    this.removeBlocks(blocks)
    this.fillWithNewRequests()
    return Promise.resolve(blocks.map(w => w.block))
  }

  private limitReadyBlocks(blocks: BlockWrapper<Block>[]): BlockWrapper<Block>[] {
    return blocks.slice(0, this.config.maxSize)
  }

  getBlocks(): Promise<Block[]> {
    const readyBlocks = this.limitReadyBlocks(this.getConsecutiveBlocks())
    const nextRequestCount = this.getNextRequestCount()

    if (nextRequestCount == 0 && this.requests.length == 0) {
      return this.releaseBlocks(readyBlocks)
    }
    this.fillWithNewRequests()
    return readyBlocks.length >= this.config.minSize
      ? this.releaseBlocks(readyBlocks)
      : this.addListener()
  }
}
