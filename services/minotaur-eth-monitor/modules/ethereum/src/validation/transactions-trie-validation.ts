import { 
  createEthereumVillage,
  EthereumModel,
  initializeMultiProvider,
  formatWeb3Transactions,
  saveEthereumTransactions 
} from '../../src'
import { 
  ServiceResult,
  ServiceState,
  startServiceCron,
  getEndBlock,
  BlockServiceState 
} from 'common'
import { getBlock } from '../../src/web3/client-functions'
import { StatsD } from 'hot-shots'
const { ethereumConfig } = require('../config/config')
const Web3 = require('web3')
const dogstatsd = new StatsD()

async function rescanTransactionTrieAction(model: EthereumModel, web3: any, stopBlock: number): Promise<any> {
 return async (state: ServiceState) => {
  return async () => {
   const result = await rescanTransactionsTrie(state, model, web3, stopBlock)
   return result
  }
 }
}

export async function rescanTransactionsTrie(state: any, model: EthereumModel, web3: any, stopBlock: number): Promise<ServiceResult<BlockServiceState>> {
 if (state.blockIndex > stopBlock) {
  return {
   state,
   shouldContinue: false
  }
 }

 const validation = await model.ValidationRecord.filter({ blockIndex: state.blockIndex }).first()
 if (!validation) {
  return {
   shouldContinue: true,
   state: Object.assign(state, { blockIndex: state.blockIndex + 1 })
  }
 }

 if (!validation.valid) {
  await model.ground.query(`DELETE FROM transactions WHERE "blockIndex" = ${state.blockIndex};`)

  const block = await getBlock(web3, state.blockIndex)
  const formattedTransactions = formatWeb3Transactions(block!.transactions, block!.timestamp)

  await saveEthereumTransactions(model.ground, formattedTransactions)
  dogstatsd.increment('eth.db.rescan-transaction-tries')
  dogstatsd.increment('eth.db.rescan-transaction-tries-transactions', block!.transactions.length)
 }

 return {
  shouldContinue: true,
  state: Object.assign(state, { blockIndex: state.blockIndex + 1 })
 }
}

async function startRescanTransactionTries() {
 const village = await createEthereumVillage(ethereumConfig)
 const web3 = await new Web3(initializeMultiProvider(ethereumConfig.ethereum.client))
 const stopBlock = await getEndBlock(village.model.ground, 1)
 const actionSource = await rescanTransactionTrieAction(village.model, web3, stopBlock)
 await startServiceCron(village.model, 'rescan-transaction-tries', actionSource)
}

startRescanTransactionTries()