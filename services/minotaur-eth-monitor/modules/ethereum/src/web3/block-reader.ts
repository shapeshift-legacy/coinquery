import { getBlockIndex, getFullBlock, initializeMultiProvider, initializeWeb3, Web3Client } from './client-functions'
import { blockchain } from 'common'
import { HttpListenerSource } from './exported-types'
import { Web3EthereumClientConfig } from './types'
import { StatsD } from 'hot-shots'
import { ContractTransaction, EthereumBlock } from '../types'
const Web3 = require('web3')

const dogstatsd = new StatsD()

function incrementDatadogCounters() {
  dogstatsd.increment('geth.rpc.gettransactionreceipt')
  dogstatsd.increment('geth.rpc.getblock')
  dogstatsd.increment('geth.rpc.getlogs')
}

export class EthereumBlockReader
  implements blockchain.BlockReader<EthereumBlock, ContractTransaction> {

  private web3: any

  constructor(web3: any) {
    this.web3 = web3
  }

  getHeighestBlockIndex(): Promise<number> {
    dogstatsd.increment('geth.rpc.getblocknumber')
    return getBlockIndex(this.web3)
  }

  getBlockBundle(
    blockIndex: number
  ): Promise<blockchain.BlockBundle<EthereumBlock, ContractTransaction>> {
    incrementDatadogCounters()
    return getFullBlock(this.web3, blockIndex)
  }

  static createFromConfig(config: Web3EthereumClientConfig, httpListenerSource?: HttpListenerSource) {
    const web3 = new Web3(initializeMultiProvider(config, httpListenerSource))
    return new EthereumBlockReader(web3)
  }
}
