const { createOpsGenieAlert } = require('../opsGenie.js')

module.exports = async (title, incidentKey, errorMessage, incidentDetails, priority) => {
  if (JSON.parse(process.env.OPS_GENIE_ENABLE)) {
    try {
      await createOpsGenieAlert(title, incidentKey, errorMessage, incidentDetails, priority)
    } catch (err) {
      throw err
    }
    return 'OpsGenie alert sent.'
  } else {
    return 'OpsGenie alerts disabled.  Set environment variable OPS_GENIE_ENABLE to "true" to enable.'
  }
}
