import { EthereumNetwork, getTransaction, initializeMultiProvider } from '../../src/index'
import { assert } from 'chai'
import BigNumber from 'bignumber.js'
import { log } from 'util';
import { HttpProviderWrapper } from '../../src/web3/http-provider-wrapper';
import { EthereumHttpProfiler } from '../src/ethereum-profiling';
const Web3 = require('web3');

require('source-map-support').install()

const minute = 60 * 1000

const { ethereumConfig } = require('../config/config')

describe('a local ethereum network', function () {
 this.timeout(2 * minute)
 
 xit('works', async function () {
  const provider = new Web3.providers.HttpProvider(ethereumConfig.ethereum.client.http)
  const httpProfiler = new EthereumHttpProfiler(ethereumConfig.ethereum.client.http.length)
  const web3 = new Web3(new HttpProviderWrapper([provider], {} as any, httpProfiler.getHttpListenerSource()))
  const network = new EthereumNetwork(ethereumConfig.ethereum, web3)
  network.initialize()
  const miner = await network.createMiner()
  const node = await network.createControlNode()
  const pw = 'password'
  const address1: any = await node.createAddress(pw)
  const sendAmount = new BigNumber('124004000010000')
  await node.unlockAccount({ address: address1, password: pw, unlockDuration: 1500})
  const transactionObj = await node.createTransactionObj(address1, sendAmount)
  await node.send(transactionObj)
  await miner.mineBlocks(5)
  const amount = await node.getBal(address1)

  await assert.equal(sendAmount.toString(), amount.toString())
  httpProfiler.log()
  httpProfiler.stop()
 })

 xit('the paces', async function () {
  const provider = new Web3.providers.HttpProvider(ethereumConfig.ethereum.client.http)
  const httpProfiler = new EthereumHttpProfiler(ethereumConfig.ethereum.client.http.length)
  const web3 = new Web3(new HttpProviderWrapper([provider], {} as any, httpProfiler.getHttpListenerSource()))
  const network = new EthereumNetwork(ethereumConfig.ethereum, web3)
  network.initialize()
  const miner = await network.createMiner()
  const node = await network.createControlNode()
  for (let index = 1; index < 40; index++) {
   console.log('getting block', index)
   await node.getGasPrice()
   await node.getBlock(index)
   await node.getBalance('0x06012c8cf97bead5deae237070f9587f8e7a266d')
  }
  await miner.mineBlocks(5)
  httpProfiler.log()
  httpProfiler.stop()
 })

 it('can get a tx from web3', async function () {
  const web3 = await new Web3(initializeMultiProvider(ethereumConfig.ethereum.client))
  const transaction = await getTransaction(web3, '0x31a6633c9ff816f274510f894a2264a49c958c6a26fc5490499c1a96da49dd98')
  console.log(transaction)
  assert(transaction, 'web3 should be able to get a transaction from geth')
 })
})