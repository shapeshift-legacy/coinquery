// require('source-map-support').install()
import { assert } from 'chai'
import { BlockQueue } from '../../src/block-queue'
import { blockchain } from '../../src/blockchain'
import BlockReader = blockchain.BlockReader
import * as mocha from 'mocha'

describe('queue test', function() {
  // let underTest: BlockQueue<MockBlock>

  beforeEach(async function() {})

  it('test 0 : will not attempt blocks indexed before the beginning of the chain', async function() {
    this.timeout(25000)

    const highestBlock = 10
    const getBlocksResponseSize = 5
    const numberToProcessPerGetBlocksCall = 5

    // const underTest = new BlockQueue(
    //   getMockBlockReader(highestBlock),
    //   0,
    //   highestBlock,
    //   {
    //     maxSize: numberToProcessPerGetBlocksCall,
    //     minSize: getBlocksResponseSize
    //   }
    // )
    //
    // const firstBlocks = await underTest.getBlocks()
    // assert.equal(firstBlocks.length, 5)
    // const secondBlocks = await underTest.getBlocks()
    // assert.equal(secondBlocks.length, 5)
    // const thirdBlocks = await underTest.getBlocks()
    // assert.equal(thirdBlocks.length, 0)
  })

  it('test 00 : will work if no blocks received', async function() {
    this.timeout(25000)

    const highestBlock = 10
    const getBlocksResponseSize = 10
    const numberToProcessPerGetBlocksCall = 5

    // const underTest = new BlockQueue(
    //   getMockBlockReader(highestBlock),
    //   0,
    //   highestBlock,
    //   {
    //     maxSize: 1,
    //     minSize: 20
    //   }
    // )
    //
    // const firstBlocks = await underTest.getBlocks()
    // assert.equal(firstBlocks.length, 5)
    // const secondBlocks = await underTest.getBlocks()
    // assert.equal(secondBlocks.length, 5)
    // const thirdBlocks = await underTest.getBlocks()
    // assert.equal(thirdBlocks.length, 0)
  })

  it('test 1', async function() {
    this.timeout(25000)

    const highestBlock = 10
    const getBlocksResponseSize = 5
    const numberToProcessPerGetBlocksCall = 5

    // const underTest = new BlockQueue(
    //   getMockBlockReader(highestBlock),
    //   0,
    //   highestBlock, // INDEX
    //   { // ACTS AS THE CONFIG!
    //     maxSize: numberToProcessPerGetBlocksCall,
    //     minSize: getBlocksResponseSize
    //   }
    // )
    //
    // const firstBlocks = await underTest.getBlocks()
    // assert.equal(firstBlocks.length, 5)
    // const secondBlocks = await underTest.getBlocks()
    // assert.equal(secondBlocks.length, 5)
  })

  it('test 2', async function() {
    this.timeout(25000)

    const highestBlock = 11
    const getBlocksResponseSize = 5
    const numberToProcessPerGetBlocksCall = 5

    // const underTest = new BlockQueue(
    //   getMockBlockReader(highestBlock),
    //   0,
    //   highestBlock,
    //   {
    //     maxSize: numberToProcessPerGetBlocksCall,
    //     minSize: getBlocksResponseSize
    //   }
    // )
    //
    // const firstBlocks = await underTest.getBlocks()
    // assert.equal(firstBlocks.length, 5)
    // // assert.equal(underTest.queuedUp.length, 5)
    // const secondBlocks = await underTest.getBlocks()
    // assert.equal(secondBlocks.length, 5)
    // // assert.equal(underTest.queuedUp.length, 5)
    // const thirdBlocks = await underTest.getBlocks()
    // assert.equal(thirdBlocks.length, 1)
    // // assert.equal(underTest.queuedUp.length, 1)
  })

  it('test 3', async function() {
    this.timeout(25000)

    const highestBlock = 10
    const getBlocksResponseSize = 4
    const numberToProcessPerGetBlocksCall = 5

    // const underTest = new BlockQueue(
    //   getMockBlockReader(highestBlock),
    //   0,
    //   highestBlock,
    //   {
    //     maxSize: numberToProcessPerGetBlocksCall,
    //     minSize: getBlocksResponseSize
    //   }
    // )
    //
    // const firstBlocks = await underTest.getBlocks()
    // assert.equal(firstBlocks.length, 4)
    // // assert.equal(underTest.queuedUp.length, 5)
    //
    // const secondBlocks = await underTest.getBlocks()
    // assert.equal(secondBlocks.length, 4)
    // // assert.equal(underTest.queuedUp.length, 5)
    //
    // const thirdBlocks = await underTest.getBlocks()
    // assert.equal(thirdBlocks.length, 2)
    // // assert.equal(underTest.queuedUp.length, 0)
  })

  it('test 4: undefined', async function() {
    this.timeout(25000)

    const highestBlock = 10
    const getBlocksResponseSize = 5
    const numberToProcessPerGetBlocksCall = 5

    // const underTest = new BlockQueue(
    //   getMockBlockReader(highestBlock, (index) => index == 2),
    //   0,
    //   highestBlock,
    //   {
    //     maxSize: numberToProcessPerGetBlocksCall,
    //     minSize: getBlocksResponseSize
    //   }
    // )
    //
    // const firstBlocks = await underTest.getBlocks()
    // assert.equal(firstBlocks.length, 2)
    // assert.equal(firstBlocks[1].index, 1)
    // // assert.equal(underTest.queuedUp.length, 5)
    //
    // const secondBlocks = await underTest.getBlocks()
    // assert.equal(secondBlocks.length, 5)
    // assert.equal(secondBlocks[0].index, 3)
    // // assert.equal(underTest.queuedUp.length, 5)
    //
    // const thirdBlocks = await underTest.getBlocks()
    // assert.equal(thirdBlocks.length, 2)
    // // assert.equal(underTest.queuedUp.length, 0)
  })

  it.skip('test 5: undefined', async function() {
    this.timeout(25000)

    const highestBlock = 10
    const getBlocksResponseSize = 5
    const numberToProcessPerGetBlocksCall = 5

    // const underTest = new BlockQueue(
    //   getMockBlockReader(highestBlock, (index) => index == 0),
    //   0,
    //   highestBlock,
    //   {
    //     maxSize: numberToProcessPerGetBlocksCall,
    //     minSize: getBlocksResponseSize
    //   }
    // )
    //
    // const firstBlocks = await underTest.getBlocks()
    // assert.equal(firstBlocks.length, 4) //1, 2, 3, 4
    // // assert.equal(underTest.queuedUp.length, 5)
    //
    // const secondBlocks = await underTest.getBlocks()
    // assert.equal(secondBlocks.length, 5)
  })

  it.skip('test 6: undefined', async function() {
    this.timeout(25000)

    const highestBlock = 10
    const getBlocksResponseSize = 5
    const numberToProcessPerGetBlocksCall = 5

    // const underTest = new BlockQueue(
    //   getMockBlockReader(highestBlock, (index) => index == 4),
    //   0,
    //   highestBlock,
    //   {
    //     maxSize: numberToProcessPerGetBlocksCall,
    //     minSize: getBlocksResponseSize
    //   }
    // )
    //
    // const firstBlocks = await underTest.getBlocks()
    // assert.equal(firstBlocks.length, 4) //0, 1, 2, 3
    // // assert.equal(underTest.queuedUp.length, 5)
    //
    // const secondBlocks = await underTest.getBlocks()
    // assert.equal(secondBlocks.length, 5)
  })

  it.skip('test 7: undefined', async function() {
    this.timeout(25000)

    const highestBlock = 10
    const getBlocksResponseSize = 5
    const numberToProcessPerGetBlocksCall = 8
    console.log('TEST 7 NEVER', never)
    // const underTest = new BlockQueue(
    //   getMockBlockReader(highestBlock, never, (index) => index == 7),
    //   0,
    //   highestBlock,
    //   {
    //     maxSize: numberToProcessPerGetBlocksCall,
    //     minSize: getBlocksResponseSize
    //   }
    // )
    //
    // const firstBlocks = await underTest.getBlocks()
    // assert.equal(firstBlocks.length, 5)
    // // assert.equal(underTest.queuedUp.length, 8)
    //
    // const secondBlocks = await underTest.getBlocks()
    // assert.equal(secondBlocks.length, 4)
    // // assert.equal(underTest.queuedUp.length, 5)
  })
})

export type MockBlockBundle = { block: { index: number } }
export const never = (index: number) => false

// export function getMockBlockReader(
//   highestBlock: number,
//   undefinedCondition: (index: number) => boolean = never,
//   errorCondition: (index: number) => boolean = never)
//   : BlockReader<MockBlock> {
//   console.log('----- mo2ckBlockReader-------', highestBlock, undefinedCondition, errorCondition )
//   return {
//     getHeighestBlockIndex: async () => {
//       return highestBlock
//     },
//
//     getBlockBundle: async (index: number) => {
//       console.log('getBlockBUndle..........errco2nd.....', errorCondition, index)
//       if(errorCondition(index)) throw new Error('Testing an error')
//       if(undefinedCondition(index)) return undefined
//       await timeout(500)
//       return { block: {index} }
//     }
//   }
// }

const timeout = (ms: number) => new Promise(res => setTimeout(res, ms))
