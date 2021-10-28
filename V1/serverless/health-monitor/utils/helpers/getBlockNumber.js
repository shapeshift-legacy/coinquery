const { at } = require('lodash')

const httpRequest = require('./httpRequest.js')

module.exports = async (url, key) => {
  try {
    const blockNumberObject = await httpRequest(url)

    const blockNumber = at(blockNumberObject, [key])

    if (isNaN(blockNumber) || blockNumber === 0) {
      console.log(blockNumberObject)
    }

    return blockNumber
  } catch (err) {
    throw err
  }
}
