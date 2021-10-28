const httpRequest = require('./httpRequest.js')
const sendAlert = require('./sendAlert.js')
const getBlockNumber = require('./getBlockNumber.js')
const getSyncStatus = require('./getSyncStatus.js')

module.exports = {
  httpRequest,
  sendAlert,
  getBlockNumber,
  getSyncStatus
}
