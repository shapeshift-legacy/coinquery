import { Web3Client } from './web3';
import { Resolve } from './types';
const promisify = require('util').promisify

const axios = require('axios')

const ChildProcess = require('child_process')
const rimraf = require('rimraf')

enum Status {
 inactive,
 active
}

export interface GethNodeConfig {
  gethPath?: string
  verbosity?: number // 0 - 6
  tempPath?: string
  port?: number
  index?: number
  bootnodes?: string
  coinbase: string
  enodes?: string[]
}

const errorMessagePattern = /err="(.*?)"/

function preparePossibleErrorMessage(message: string) {
 // Currently Geth is outputting non-error messages to stderr.  (Which makes perfect sense in Geth-logic.)
  if (message.substring(0, 4) == 'INFO') {
    return { message, verbosity: 2 }
  }
  else if (message.substring(0, 5) == 'DEBUG') {
    const match = message.match(errorMessagePattern)
    if (match) {
      const message = match[1]
      return { message, verbosity: 1 }
    }
    else {
      return { message, verbosity: 2 }
    }
  }
  else {
    return { message, verbosity: 2 }
  }
}

function handlePossibleErrorMessage(index: number, message: string, verbosity: number = 0) {
 // This may always be a string but just in case...
  if (typeof message !== 'string')
    return

  const info = preparePossibleErrorMessage(message)
  if (info.verbosity >= verbosity) {
  // console.error(message)
  }
}

export class GethNode {
  private static instanceIndex: number = 0
  private childProcess: any
  private client: Web3Client
  private config: GethNodeConfig
  private datadir: string
  private keydir: string
  private rpcPort?: number
  private index: number
  private isMiner = false
  private rpcRequestId = 1 // Probably not needed but just in case.

  constructor(web3: Web3Client, config?: GethNodeConfig, port?: number) {
    this.config = config || {} as any
    this.index = GethNode.instanceIndex++
    this.client = web3;
    this.datadir = './temp/eth/geth' + this.index
    this.keydir = './temp/eth/keystore' + this.index
    this.rpcPort = port
    this.config.gethPath = this.config.gethPath || 'geth'
  }

  getWeb3() {
    return this.client
  }

  async getClient() {
    return await this.client
  }

  getKeydir() {
    return this.keydir
  }

  getBootNodeFlags() {
    return ''
  // return this.config.bootnodes
  //   ? ' --bootnodes ' + this.config.bootnodes + ' '
  //   : ''
  }

  getCommonFlags() {
  // const verbosity = 4 // this.isMiner ? 4 : 1 // this.config.verbosity || 0

  // return ' --ipcdisable --nodiscover --keystore ' + this.keydir
    return ' --nodiscover --keystore ' + this.keydir
   + ' --datadir ' + this.datadir
   + ' --networkid 101 --port=' + (30303 + this.index)
   + ' ' + this.getEtherbaseFlags()
   + ' --ipcdisable'
  }

  getRPCFlags() {
    return ' --rpc --rpcport ' + this.rpcPort
  //  + ' --rpcapi=\"db,eth,net,personal,debug,miner,admin,web3\" '
   + ' --rpcapi db,eth,net,personal,debug,miner,admin,web3 '
  }

  getEtherbaseFlags() {
    return '--etherbase=' + this.config.coinbase
  }

  start(flags = ''): Promise<void> {
    console.log('Starting Geth')
    const command = this.getCommonFlags()
   + ' --verbosity ' + 4
   + this.getRPCFlags()
   + this.getBootNodeFlags()
   + flags + ' console'

    console.log('geth ' + command)
    return this.launch(command)
  }

  startMining() {
    this.isMiner = true
    return this.start('--mine --minerthreads=4')
  }

  execSync(suffix: string) {
    const command = this.config.gethPath
   + this.getCommonFlags()
   + ' --verbosity ' + 2
   + ' ' + suffix
    console.log(command)
    const result = ChildProcess.execSync(command)
    return result.toString()
  }

  initialize(genesisPath: string) {
    this.execSync('init ' + genesisPath)
  }

  async invoke(method: string, params: any[] = []): Promise<any> {
  // console.log('Geth RPC', this.rpcPort, method, params)
    const body = {
      jsonrpc: '2.0',
      method,
      id: this.rpcRequestId++,
      params,
    }

    const response = await axios.post('http://localhost:' + this.rpcPort, body)
    const result = response.data.result

  // console.log('Geth Responded', this.rpcPort, method, result)
    return result
  }

  async getNodeUrl(): Promise<string> {
    const nodeInfo = await this.invoke('admin_nodeInfo')
    return nodeInfo.enode
  // return this.execSync('--exec admin.nodeInfo.enode console')
  //   .replace(/\r|\n/g, '')
  //   .replace('[::]', '127.0.0.1')
  }

  isRunning() {
    return this.childProcess != null
  }

  isConnected() {
    return this.client.isConnected()
  }

  async getGasPrice(): Promise<string | Object> {
    return new Promise((resolve: Resolve<string>, reject) => {
      if (!this.client.isConnected()) {
        reject(new Error('Cannot create address, not connected to client.'))
      }

      this.client.eth.getGasPrice((err: any, result: string) => {
        if (err) {
          reject(new Error('Error creating address: ' + err.message))
        } else {
          console.log('got gas price:: ', result)
          resolve(result)
        }
      })
    })
  }

  async getBlock(block: number): Promise<string | Object> {
    return new Promise((resolve: Resolve<string>, reject) => {
      if (!this.client.isConnected()) {
        reject(new Error('Cannot create address, not connected to client.'))
      }

      this.client.eth.getBlock(block, (err: any, result: string) => {
        if (err) {
          reject(new Error('Error creating address: ' + err.message))
        } else {
          console.log(`got Block ${block}: `, result)
          resolve(result)
        }
      })
    })
  }

  async getTransactionCount(address: string): Promise<string | Object> {
    return new Promise((resolve: Resolve<string>, reject) => {
      if (!this.client.isConnected()) {
        reject(new Error('Cannot create address, not connected to client.'))
      }

      this.client.eth.getTransactionFromBlock(address, 'latest', (err: any, result: string) => {
        if (err) {
          reject(new Error('Error getting transaction from block: ' + err.message))
        } else {
          console.log(`got transactions from ${address}::`, result)
          resolve(result)
        }
      })
    })
  }

  async getBalance(address: string): Promise<string | Object> {
    return new Promise((resolve: Resolve<string>, reject) => {
      if (!this.client.isConnected()) {
        reject(new Error('Cannot create address, not connected to client.'))
      }

      this.client.eth.getBalance(address, 'latest', (err: any, result: string) => {
        if (err) {
          reject(new Error('Error getting transaction from block: ' + err.message))
        } else {
          console.log(`got transactions from ${address}::`, result)
          resolve(result)
        }
      })
    })
  }

  async createAddress(pw: string): Promise<string | Object> {
    return new Promise((resolve: Resolve<string>, reject) => {
      if (!this.client.isConnected()) {
        reject(new Error('Cannot create address, not connected to client.'))
      }

      this.client.personal.newAccount(pw, (err: any, result: string) => {
        if (err) {
          reject(new Error('Error creating address: ' + err.message))
        } else {
          console.log('Created new address', result)
          resolve(result)
        }
      })
    })
  }

  async send(transactionObj: any): Promise<string | Object> {
    const client = await this.getClient();
    return new Promise((resolve: Resolve<string>, reject) => {
      if (!this.client.isConnected()) {
        reject(new Error('Cannot create address, not connected to client.'))
      }
      
      client.eth.sendTransaction(transactionObj, (err: any, result: string) => {
        if (err) {
          reject(new Error('Error sending transaction: ' + err.message))
        } else {
          console.log('transaction sent', result)
          // if (checksum) {
          //   resolve(this.client.toChecksumAddress(result))
          // } else {
          resolve(result)
          // }
        }
      })
    })
  }

  async unlockAccount(unlockAccountObj: any): Promise<string | Object> {
    const client = await this.getClient();
    return new Promise((resolve: Resolve<string>, reject) => {
      if (!this.client.isConnected()) {
        reject(new Error('Cannot create address, not connected to client.'))
      }
      client.personal.unlockAccount(unlockAccountObj.address, unlockAccountObj.password, unlockAccountObj.unlockDuration, (err: any, result: string) => {
        if (err) {
          reject(new Error('Error unlocking account: ' + err.message))
        } else {
          console.log('unlocked account', result)
          resolve(result)
        }
      })
    })
  }

  async getBal(address: string): Promise<Object> {
    return new Promise((resolve: Resolve<string>, reject) => {
      this.client.eth.getBalance(address, (err: any, result: string) => {
        if (err) {
          reject(new Error('Error getting balance: ' + err.message))
        } else {
          resolve(result)
        }
      })
    })
  }

  async getClientAccounts(): Promise<Array<string> | Object> {
    const client = await this.getClient();
    return new Promise((resolve: Resolve<string>, reject) => {
      client.eth.getAccounts((err: any, result: string) => {
        if (err) {
          reject(new Error('Error getting balance: ' + err.message))
        } else {
          resolve(result)
        }
      })
    })
  }

  async createTransactionObj(address: string, sendAmmount: Object) {
    const accounts: Array<string> | any = await this.getClientAccounts();
    return await {
      from: accounts[0],
      to: address,
      value: sendAmmount
    }
  }

  async mineBlocks(blockCount: number, timeout: number = 10000) {
    console.log('Mining', blockCount, 'blocks')
    // const originalBlock = await this.getClient().getBlockNumber()
    // const targetBlock = originalBlock + blockCount
    const pauseDuration = 50

    const next = async (duration: number): Promise<any> => {
      await new Promise<void>(resolve => setTimeout(resolve, pauseDuration))
      const connected = await this.isConnected()
    //   const blockNumber = await this.getClient().getBlockNumber()
    //   if (blockNumber < targetBlock) {
    //     if (duration >= timeout) {
    //       throw new Error('Block mining exceeded timeout of ' + timeout + ' milliseconds. '
    //   + (blockNumber - originalBlock) + ' blocks were mined.'
    //  )
    //     }
    //     else {
    //       return next(duration + pauseDuration)
    //     }
    //     return next(duration + pauseDuration)
    //   }

      // console.log('Mined ' + (blockNumber - originalBlock) + ' blocks')
    }

    return next(0)
  }

  addPeer(enode: string): Promise < void > {
    return this.invoke('admin_addPeer', [enode])
  // console.log(this.index, 'admin.addPeer(' + enode + ')')
  // this.childProcess.stdin.write('admin.addPeer(' + enode + ')\n')
  }

  listPeers() {
    this.childProcess.stdin.write('admin.peers\n')
  }

  stop() {
    if (!this.childProcess) {
      return Promise.resolve()
    }

    console.log(this.index, 'Stopping node.')
    this.client.stop()

    return new Promise((resolve, reject) => {
      this.childProcess.stdin.write('exit\n')
      this.childProcess.kill()
      const onStop = () => {
        if (this.childProcess) {
          this.childProcess = null
          console.log(this.index, 'Node stopped.')
          resolve()
        }
      }

      this.childProcess.on('close', (code: any) => {
        onStop()
      })

      setTimeout(() => {
        onStop()
      }, 500)
    })
  }

  private launch(flags: any): Promise < void > {
    this.childProcess = ChildProcess.exec(this.config.gethPath + flags)
    this.childProcess.stdout.on('data', (data: any) => {
      if (this.config.verbosity)
        console.log(this.index, 'stdout:', `${data}`)
    })

    this.childProcess.stderr.on('data', (data: any) => {
      handlePossibleErrorMessage(this.index, data, this.config.verbosity)
    })

    this.childProcess.on('close', (code: any) => {
      console.log(this.index, `child process exited with code ${code}`)
    })

    // this.client = new web3({
    //   http: 'http://localhost:' + this.rpcPort
    // })
    
    return new Promise<void>(resolve => {
      let isFinished = false
      const finished = () => {
        if (!isFinished) {
          isFinished = true
          console.log(this.index, 'Connected to web3', ' (is connected):', this.isConnected())
          resolve()
        }
      }
      setTimeout(finished, 5500)
      const next = (): any => {
        return new Promise<void>(resolve => setTimeout(resolve, 50))
     .then(() => {
       if (isFinished) {
         return
       }

       if (!this.isConnected()) {
         return next()
       }

       finished()
     })
      }

      next()
    })
   .then(() => {
     const enodes = this.config.enodes || []
     for (let i = 0; i < enodes.length; ++i) {
       this.addPeer(enodes[i])
     }
   })
  }
}
