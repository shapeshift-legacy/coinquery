import { createEthereumVillage, getContractAddress } from '../src'
import { Modeler } from 'vineyard-data/legacy';
import { BlockServiceState, copy, IndexRange, startServiceCron } from 'common';

require('source-map-support').install()

const { ethereumConfig } = require('../config/config')

async function getRecords(ground: Modeler, position: number, count: number): Promise<any[]> {
  const sql = `
  SELECT * FROM z_contracts1
  LIMIT ${count}
  OFFSET ${position}
  `
  return await ground.query(sql)
}

async function saveContracts(ground: Modeler, records: any[]) {
  const inserts: string[] = records.map(record => {
    const address = getContractAddress(record.address, record.nonce)
    return `('${address}', '${record.transaction}', NOW(), NOW())`
  })
  const insertsClause = inserts.join(',\n')
  const sql = `
    INSERT INTO "z_contracts2" ("address", "transaction", "created", "modified") VALUES
    ${insertsClause}
    `
  await ground.query(sql)
}

async function main(): Promise<void> {
  const village = await createEthereumVillage(ethereumConfig)
  const ground = village.model.ground

  const actionSource = async (state: BlockServiceState) => {
    return async (state: BlockServiceState) => {
      const records = await getRecords(ground, state.blockIndex, state.batchSize)
      if (records.length == 0)
        return { shouldContinue: false, state }

      await saveContracts(ground, records)

      return {
        shouldContinue: true,
        state: copy(state, { blockIndex: state.blockIndex + state.batchSize })
      }
    }
  }

  await startServiceCron(village.model, 'eth-extract-contracts', actionSource)
}

main()
