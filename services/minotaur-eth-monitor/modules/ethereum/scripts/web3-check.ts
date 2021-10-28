const Web3 = require('web3')
const config = require('../config/config')
const web3 = new Web3(new Web3.providers.HttpProvider(config.ethereumConfig.ethereum.client.http))
import { logger } from 'common'

export async function main(startBlock?: any, endBlock?: any): Promise<void> {
  const blockNumber = await web3.eth.getBlockNumber()
  logger.log({
    level: 'info',
    title: 'Web3 Check',
    message: `Successfully grabbed block number from web3 ${blockNumber}`
  })

}

main()
