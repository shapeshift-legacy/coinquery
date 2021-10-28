const { sendAlert, getBlockNumber } = require('./helpers')

let config

const reportError = async (errorMessage, priority, alertCount) => {
  let result, retry

  console.log(`${config.symbol}: ${config.cqURL}:`)
  console.log(errorMessage)

  try {
    const incidentDetails = `
      coin: ${config.symbol}
      deployRegion: ${process.env.AWS_REGION}
      cq: ${config.cqURL}
      ref: ${config.refURL}
    `

    // If using alert count for retry, increment and send alert if count hits 3
    if (alertCount && ++alertCount[config.symbol] < 3) {
      retry = true
      console.log('Retry check health')
    } else {
      retry = false
      console.log(await sendAlert('CQ Health Monitor AWS - Load Balancer', config.opsGenieIncidentKey, errorMessage, incidentDetails, priority))
    }
  } catch (err) {
    console.log(`ERROR OpsGenie alert failed: ${err}`)
  }

  console.log(`-------------------------------------------------------------------`)

  return retry
}

const checkProdCoin = async (_config, alertCount) => {
  config = _config

  let cqBlocknumber, refBlocknumber

  try {
    cqBlocknumber = +await getBlockNumber(config.cqURL, config.cqKeyName)
  } catch (err) {
    return reportError(`ERROR retrieving blocknumber, ${config.cqURL}: ${err}`, 'P1')
  }

  try {
    refBlocknumber = +await getBlockNumber(config.refURL, config.refKeyName)
  } catch (err) {
    return reportError(`ERROR retrieving blocknumber, ${config.refURL}: ${err}`, 'P2', alertCount)
  }

  if (isNaN(cqBlocknumber)) {
    return reportError(`ERROR retrieving blocknumber - not a number, ${config.cqURL}`, 'P3', alertCount)
  }

  if (isNaN(refBlocknumber)) {
    return reportError(`ERROR retrieving blocknumber - not a number, ${config.refURL}`, 'P3', alertCount)
  }

  console.log(`CQ [${config.cqURL}]blockNumber: ${cqBlocknumber}`)
  console.log(`REF [${config.refURL}] blockNumber: ${refBlocknumber}`)

  const minBlockNumber = refBlocknumber - config.deltaBlocks

  if (cqBlocknumber < minBlockNumber) {
    return await reportError(`ERROR: CoinQuery ${config.symbol} is ${refBlocknumber - cqBlocknumber} blocks behind REF: ${config.refURL}`, 'P3', alertCount)
  } else {
    console.log(`BlockNumber is within required range: ${config.deltaBlocks}`)
    console.log(`-------------------------------------------------------------------`)
    return false
  }
}

module.exports = { checkProdCoin }
