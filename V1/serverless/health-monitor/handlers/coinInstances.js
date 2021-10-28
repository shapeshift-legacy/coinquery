/* Description:
 * This function monitors the health of all coin instances.
 * It assumes all instances of a coin share the same blockNumberEndpoint.
 * Logs error message if the coin instance is more than `deltaBlocks` behind a reference third party service.
 */

const { inspectCoinInstances } = require('../utils')

const coins = require('../config/coins.js')

module.exports.checkHealth = async (event, context) => {
  console.log(`--------------------------------------------------------------------`)
  console.log(`Health check of CoinQuery coin instances`)
  console.log(`OpsGenie enabled: ${process.env.OPS_GENIE_ENABLE}`)
  console.log(`--------------------------------------------------------------------`)

  for (let coin of Object.keys(coins)) {
    await inspectCoinInstances.checkAllInstances(coins[coin])
  }

  console.log(`--------------------------------------------------------------------`)
  console.log('Coin instance health check complete')

  return 'Coin instance health check completed'
}
