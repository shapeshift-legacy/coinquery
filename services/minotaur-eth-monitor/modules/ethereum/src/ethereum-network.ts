import { GethNode, GethNodeConfig } from './geth-node'
import { each as promiseEach } from 'promise-each2'
import { Web3Client } from './web3';

const childProcess = require('child_process')
const rimraf = require('rimraf')
const fs = require('fs')

export class EthereumNetwork {
  private config: GethNodeConfig
  private nextPort = 8546
  private coinbase: string = '0x0b7ffe7140d55b39f200557ef0f9ec1dd2e8f1ba'
  private enodes: string[] = []
  private web3: Web3Client = {}
  private nodes: GethNode[] = []

  constructor(config: GethNodeConfig, web3: Web3Client) {
    this.config = config
    this.config.tempPath = './temp/eth'
    this.config.coinbase = this.coinbase
    this.web3 = web3
  }

  getCoinbase() {
    return this.coinbase
  }

  async createNode(): Promise<GethNode> {
    const config = Object.assign({
      enodes: ([] as string[]).concat(this.enodes)
    }, this.config)
    const node = new GethNode(this.web3, config, this.nextPort++)
    const GenesisPath = config.tempPath + '/genesis.json'
    node.initialize(GenesisPath)
    fs.writeFileSync(node.getKeydir() + '/UTC--2017-08-01T22-03-26.486575100Z--0b7ffe7140d55b39f200557ef0f9ec1dd2e8f1ba', '{"address":"0b7ffe7140d55b39f200557ef0f9ec1dd2e8f1ba","crypto":{"cipher":"aes-128-ctr","ciphertext":"4ce91950a0afbd17a8a171ce0cbac5e16b5c1a326d65d567e3f870324a36605f","cipherparams":{"iv":"1c765de19104d873b165e6043d006c11"},"kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"d5c37ef44846f7fcef185c71e7f4c588a973fbbde13224a6f76ffa8924b7e0e0"},"mac":"b514587de559a69ce5080c8e6820fbc5a30495320d408be07b4f2253526265f7"},"id":"3d845d15-e801-4096-830b-84f8d5d50df9","version":3}')
    this.nodes.push(node)
    return node
  }

  async addEnode(node: GethNode): Promise<void> {
    const enode = await node.getNodeUrl()
    this.enodes.push(enode)
  }

  async createMiner(): Promise<GethNode> {
    const node = await this.createNode()
    await node.startMining()
    await this.addEnode(node)
    return node
  }

  async createControlNode(): Promise<GethNode> {
    const node = await this.createNode()
    await node.start()
    await this.addEnode(node)
    return node
  }

  async createMiners(count: number): Promise<GethNode[]> {
    const result: GethNode[] = []
    for (let i = 0; i < count; ++i) {
      result.push(await this.createMiner())
    }
    return result
  }

  resetTempDir() {
    rimraf.sync('./temp/eth') // Right now still hard-coded because I don't trust rm -rf.
    if (!fs.existsSync(this.config.tempPath)) {
      fs.mkdirSync(this.config.tempPath)
    }
  }

  initialize() {
    // this.resetTempDir()
    const GenesisPath = './temp/eth' + '/genesis.json' // hardcod path for now until we decide how to handle
    console.log('%c GenesisPath', GenesisPath)
    this.createGenesisFile(GenesisPath)
  // this.mainNode = this.createNode()
  }

  start() {
  // return this.mainNode.start()
  }

  stop() {
    return promiseEach(this.nodes, (node: any) => node.stop())
  }

  private createGenesisFile(path: string) {
    const content = {
      config: {
        chainId: 15,
        homesteadBlock: 0,
        eip155Block: 0,
        eip158Block: 0
      },
      alloc: {
        [this.coinbase]: { balance: '111100113120000000000052' }
      },
      coinbase: this.coinbase,
      difficulty: '0x20000',
      extraData: '',
      gasLimit: '0x2fefd8',
      nonce: '0x0000000000000042', // "0x" + Math.floor(Math.random() * 10000000000000000),
      mixhash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      timestamp: '0x00'
    }

    const fs = require('fs')
    fs.writeFileSync(path, JSON.stringify(content), 'utf8')
  }
}