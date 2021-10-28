import { StatsD } from 'hot-shots'
import { logger } from '../../../common/src/winston/winston-loggers'
const dogstatsd = new StatsD()
const winston = require('winston')

// Test Metrics
dogstatsd.increment('geth.rpc.gettransactionreceipt')
dogstatsd.increment('geth.rpc.getblock')
dogstatsd.increment('geth.rpc.getblocknumber')
dogstatsd.increment('geth.rpc.getlogs')
// check in metrics explorer on datadog
