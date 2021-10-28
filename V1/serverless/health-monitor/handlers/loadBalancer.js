/* Description:
 * This function monitors the status of CoinQuery production services.
 */

const { inspectLoadBalancer } = require('../utils')

const coins = require('../config/coins.js')

const alertCount = {}

// main lambda function
module.exports.checkHealth = async (event, context) => {
  console.log(`-------------------------------------------------------------------`)
  console.log(`Health check of CoinQuery production services`)
  console.log(`OpsGenie enabled: ${process.env.OPS_GENIE_ENABLE}`)
  console.log(`-------------------------------------------------------------------`)

  // Initialize alert count for each coin to 0
  Object.keys(coins).map(coin => alertCount[coins[coin].symbol] = 0)

  let retry
  for (let coin of Object.keys(coins)) {
    console.log(`******************************* ${coins[coin].symbol} *******************************`)

    // Retry check health to ensure error is not a one off
    do {
      retry = await inspectLoadBalancer.checkProdCoin(coins[coin], alertCount)
    } while (retry)
  }

  console.log('Load balancer health check complete')

  return 'Load balancer health check completed'
}
