const request = require('requestretry')

// When the connection fails with one of ECONNRESET, ENOTFOUND, ESOCKETTIMEDOUT,
// ETIMEDOUT, ECONNREFUSED, EHOSTUNREACH, EPIPE, EAI_AGAIN or when an HTTP 5xx
// error occurrs, the request will automatically be re-attempted as these are
// often recoverable errors and will go away on retry.
//
// Wait 30 seconds before timeout.  On timeout or error, retry 5 more times
// before throwing an error.
module.exports = async (url) => {
  try {
    const res = await request({
      method: 'GET',
      timeout: 30000,
      maxAttempts: 5,
      retryDelay: 5000,
      retryStrategy: request.RetryStrategies.HTTPOrNetworkError,
      uri: url,
      json: true,
      fullResponse: false,
    })
    return res
  } catch (err) {
    console.log(err)
    throw err
  }
}
