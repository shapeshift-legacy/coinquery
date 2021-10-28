require('source-map-support').install()
import { resetEthereumDb } from '../src/fixtures'
import { createEthereumVillage } from '../src'

const { ethereumConfig } = require('../config/config')

async function main() {
  const village = await createEthereumVillage(ethereumConfig)
  await resetEthereumDb(village)
  process.exit(0)
}

main()
