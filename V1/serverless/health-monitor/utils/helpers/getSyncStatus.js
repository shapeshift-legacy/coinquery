const httpRequest = require('./httpRequest.js')

module.exports = async (symbol, url) => {
  try {
    const syncObject = await httpRequest(url)

    let syncing, currentBlock, highestBlock

    if (symbol === 'ETH') {
      syncing = syncObject.result === false ? false : true
      currentBlock = +syncObject.result.currentBlock || null
      highestBlock = +syncObject.result.highestBlock || null
    } else {
      syncing = syncObject.status === 'finished' ? false : true
      currentBlock = syncObject.height
      highestBlock = syncObject.blockChainHeight
    }

    return {syncing, currentBlock, highestBlock}
  } catch (err) {
    throw err
  }
}
