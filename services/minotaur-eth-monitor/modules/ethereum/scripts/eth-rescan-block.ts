import { createEthereumVillage, initializeMultiProvider, EthereumTransaction, saveFullBlock, EthereumModel } from '../src'
import { getFullBlock, partitionedMap, Web3Client } from '../src/web3/client-functions'
import { deleteFullBlocks } from 'common'
import { processReceipt } from './scan-receipts'
const { ethereumConfig } = require('../config/config')
const Web3 = require('web3')

async function saveReceipts(web3: Web3Client, model: EthereumModel, transactions: EthereumTransaction[]): Promise<void> {
  await partitionedMap(
    10,
    tx => processReceipt(model, web3, tx),
    transactions
  )
}

function getTransactionHashes(transactions: any[]): { hash: string }[] {
  return transactions.map(tx => ({
    hash: tx.txid
  }))
}

async function main(): Promise<void> {
  const blockNumber = parseInt(process.argv[2], 10)
  if (isNaN(blockNumber)) {
    console.log('Error: enter a block number to rescan')
  } else {
    try {
      const village = await createEthereumVillage(ethereumConfig)
      const model = village.model
      const web3 = await new Web3(initializeMultiProvider(ethereumConfig.ethereum.client))

      await deleteFullBlocks(model.ground, [blockNumber])

      const blockBundle = await getFullBlock(web3, blockNumber)
      const transactionHashes = getTransactionHashes(blockBundle.transactions)

      await saveFullBlock(model.ground, blockBundle)
      await saveReceipts(web3, model, transactionHashes as any)

      console.log(`Block ${blockNumber} rescanned`)
      process.exit(0)
    } catch (error) {
      console.log(`Error rescanning block ${blockNumber}: ${error}`)
      process.exit(1)
    }
  }
}

main()