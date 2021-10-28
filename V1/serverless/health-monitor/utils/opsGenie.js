const opsgenie = require('opsgenie-sdk')

if (!process.env.OPS_GENIE_API_KEY) {
  throw new Error('Environment variable OPS_GENIE_API_KEY not set.')
}

opsgenie.configure({
  api_key: process.env.OPS_GENIE_API_KEY
})

const createOpsGenieAlert = (source, entity, message, description, priority) => {
  return new Promise((resolve, reject) => {
    opsgenie.alertV2.create({source, entity, message, description, priority}, (error, alert) => {
      if (error) {
        return reject(error);
      } else {
        console.log(`OpsGenie alert created, incident key: ${entity}`);
        return resolve(alert);
      }
    })
  })
}

module.exports = {
  createOpsGenieAlert
}
