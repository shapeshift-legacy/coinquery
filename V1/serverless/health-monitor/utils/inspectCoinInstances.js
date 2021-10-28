/* Description:
 * This function monitors the status of Insight-based block explorers
 * in the region in which it is deployed.  It assumes all instances have
 * /sync endpoint.  Logs error message if the
 * instance is more than `deltaBlocks` behind a reference third party service.
 */

// Amazon Web services
const AWS = require('aws-sdk')  // Load the AWS SDK for Node.js
const { sendAlert, getBlockNumber, getSyncStatus } = require('./helpers')

let config, retry, alertCount, instanceName, instance

const reportError = async (errorMessage, priority, retryAlert) => {
  console.log(errorMessage)

  try {
    const incidentDetails = `
      coin: ${config.symbol}
      deployRegion: ${process.env.AWS_REGION}
      monitorRegion: ${process.env.AWS_MONITOR_REGION}
      instanceName: ${instanceName}
      instanceId: ${instance.InstanceId}
      cq: ${config.cqURL}
      ref: ${config.refURL}
    `

    // If using alert count for retry, increment and send alert if count hits 3
    if (retryAlert && ++alertCount < 3) {
      retry = true
      console.log('Retry check health')
    } else {
      retry = false
      console.log(await sendAlert('CQ Health Monitor AWS - Coin Instances', config.opsGenieIncidentKey, errorMessage, incidentDetails, priority))
    }
  } catch (err) {
    console.log(`ERROR OpsGenie alert failed: ${err}`)
  }
}

// Check if instance block number is within range of reference block number
const checkBlockNumber = async instanceURL => {
  let cqBlocknumber, refBlocknumber

  try {
    cqBlocknumber = +await getBlockNumber(`${instanceURL}${config.blockNumberEndpoint}`, config.cqKeyName)
  } catch (err) {
    throw await reportError(`ERROR retrieving blocknumber ${instanceURL}${config.blockNumberEndpoint}: ${err}`, 'P1', false)
  }

  try {
    refBlocknumber = +await getBlockNumber(config.refURL, config.refKeyName)
  } catch (err) {
    throw await reportError(`ERROR retrieving blocknumber ${config.refURL}: ${err}`, 'P1', false)
  }

  if (isNaN(cqBlocknumber)) {
    throw await reportError(`ERROR: retrieving blocknumber - not a number, ${instanceURL}${config.blockNumberEndpoint}`, 'P3', true)
  }

  if (isNaN(refBlocknumber)) {
    throw await reportError(`ERROR: retrieving blocknumber - not a number, ${config.refURL}`, 'P3', true)
  }

  console.log(`BlockNumber (CQ ${instanceURL}${config.blockNumberEndpoint}): ${cqBlocknumber}`)
  console.log(`BlockNumber (REF ${config.refURL}): ${refBlocknumber}`)

  const minBlockNumber = refBlocknumber - config.deltaBlocks

  if (cqBlocknumber < minBlockNumber) {
    throw await reportError(`ERROR: CoinQuery ${config.symbol} is ${refBlocknumber - cqBlocknumber} blocks behind REF: ${config.refURL}`, 'P3', true)
  } else {
    console.log(`CQ block number is within expected range of REF`)
  }

  return cqBlocknumber
}

// Check if instance is syncing or not
const checkSync = async instanceIP => {
  try {
    const syncStatus = await getSyncStatus(config.symbol, `${instanceIP}${config.syncEndpoint}`)

    if (syncStatus.syncing === true) {
      console.log('Node is syncing')
      console.log(`Current Block: ${syncStatus.currentBlock} Highest Block: ${syncStatus.highestBlock}`)
    }

    return syncStatus.syncing
  } catch (err) {
    throw await reportError(`ERROR retrieving sync status ${instanceIP}${config.syncEndpoint}: ${err}`, 'P1', false)
  }
}

// check health of all EC2 instances in this region
const checkAllInstances = async (_config) => {
  config = _config

  const params = {
    Filters: [{
      Name: 'tag:Name',
      Values: [config.stack]
    }]
  }

  try {
    for (let region of process.env.AWS_MONITOR_REGION.split(':')) {
      AWS.config.update({ region }) // Set the region

      const ec2 = new AWS.EC2()

      const data = await ec2.describeInstances(params).promise()

      console.log(`Health check of CoinQuery ${config.symbol} instances in region: ${region}, with stack name: ${config.stack}`)

      for (let j = 0; j < data.Reservations.length; j++) {
        for (let i = 0; i < data.Reservations[j].Instances.length; i++) {
          instance = data.Reservations[j].Instances[i]
          instanceName = instance.Tags.find(tag => tag.Key === 'Name').Value

          console.log(`--------------------------------------------------------------------`)
          console.log(`Instance ID: ${instance.InstanceId}`)
          console.log(`Instance Name: ${instanceName}`)

          alertCount = 0

          try {
            do {
              await checkInstance()
            } while (retry)
          } catch (err) {
            console.log(`Error checking instance`, err)
          }
        }
      }

      console.log(`Done checking CoinQuery ${config.symbol} instances in region ${region}`)
      console.log(`--------------------------------------------------------------------`)
    }
  } catch (err) {
    console.log(err)
  }
}

// check health of a specified instance
const checkInstance = async () => {
  const instanceIP = `http://${instance.PublicIpAddress}:${config.cqApiPort}/`
  const initialSync = instance.Tags.find(tag => tag.Key === 'InitialSync')

  try {
    if (!instanceName) {
      throw await reportError('ERROR: Instance name not found', 'P2', false)
    }

    if (instance.State.Name === 'running') {
      if (instanceName.includes('snapshot')) {
        console.log(`Snapshot node - not checking health`)
      } else if (initialSync && initialSync === 'True') {
        console.log(`Initial sync - not checking health`)
      } else {
        const syncing = await checkSync(instanceIP)

        if (!syncing) {
          const blockNumber = await checkBlockNumber(instanceIP)
        }
      }
    } else {
      console.log(`WARNING: Instance in state "${instance.State.Name}" - not checking health`)
    }

    retry = false
  } catch (err) {}
}

module.exports = { checkAllInstances }
