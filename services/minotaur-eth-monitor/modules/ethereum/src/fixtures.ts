import { resetMonitorDb, ServiceRecord } from 'common'
import { EthereumVillage } from '../src'
import * as path from 'path'

const ethereumServices: ServiceRecord<any>[] = [
  {
    name: 'eth-scan',
    enabled: true,
    state: {
      blockIndex: 6000000,
      interval: 60000
    }
  },
  {
    name: 'receipt-scan',
    enabled: true,
    state: {
      blockIndex: 6000000,
      interval: 60000,
      step: 1,
      batchSize: 1
    }
  },
  {
    name: 'eth-validate-blocks',
    enabled: true,
    state: {
      blockIndex: 6000000,
      interval: 60000,
      step: 1,
      batchSize: 1
    }
  }
]

export async function resetEthereumDb(village: EthereumVillage) {
  await resetMonitorDb(village, path.resolve(__dirname, '../scripts/sql/ethereum-db.sql'), ethereumServices)
}
