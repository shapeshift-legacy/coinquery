import { createEthereumVillage } from '../src'
import { startServiceCron } from 'common'
import { validateBlocksAction } from '../src/validation/block-validation';

const { ethereumConfig } = require('../config/config')

async function main() {
  const village = await createEthereumVillage(ethereumConfig)
  const actionSource = await validateBlocksAction(village.model)
  await startServiceCron(village.model, 'eth-validate-blocks', actionSource)
}

main()