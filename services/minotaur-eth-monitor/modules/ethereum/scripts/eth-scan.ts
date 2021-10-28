require('source-map-support').install()
import { createEthereumVillage, ethereumMonitorServiceActionSource } from '../src'
import { startServiceCron } from 'common'

const { ethereumConfig } = require('../config/config')

async function main(): Promise<void> {
  // TODO: Remove this temporary config hard coding
  ethereumConfig.blockQueue.maxSize = 20
  const village = await createEthereumVillage(ethereumConfig)
  const partition = { blocks: true, transactions: true }
  const actionSource = await ethereumMonitorServiceActionSource(village, ethereumConfig, partition)
  await startServiceCron(village.model, 'eth-scan', actionSource)
}

main()
console.log('Starting Ethereum Monitor')
