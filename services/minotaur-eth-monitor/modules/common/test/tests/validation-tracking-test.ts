import { assert } from 'chai'
import { saveValidationRecord } from 'common'
import { createEthereumVillage, EthereumVillage } from '../../../ethereum/src'
import { resetEthereumDb } from '../../../ethereum/src/fixtures'
import { Modeler } from 'vineyard-data/legacy'
const { ethereumConfig } = require('../../../ethereum/test/config/config')

describe('validation tracking', function () {
  let village: EthereumVillage
  let ground: Modeler

  before(async function() {
    village = await createEthereumVillage(ethereumConfig)
    ground = village.model.ground
    await resetEthereumDb(village)
  })
/*
  it('can save a validation record', async function () {
    const service = await village.model.Service.first({ name: 'validate-transactions' })
    const validationRecord = {
      id: '37EA2CC92CA64CC356E4609FBC020BF3540C519EB195FCF15EC1CA7613CF1282',
      valid: false,
      pass: service.state.pass
    }
    
    await saveValidatedRecord(ground, 'validated_transactions', validationRecord, 1)

    const savedRecord = await ground.query(`SELECT * FROM "validated_transactions" WHERE id = '37EA2CC92CA64CC356E4609FBC020BF3540C519EB195FCF15EC1CA7613CF1282';`)
    assert(savedRecord.length > 0, 'The record should be saved to the DB')
  })

  it('can replace an old validation record', async function () {
    const oldRecord = {
      id: '37EA2CC92CA64CC356E4609FBC020BF3540C519EB195FCF15EC1CA7613CF1282',
      valid: false
    }
    await saveValidatedRecord(ground, 'validated_transactions', 1, oldRecord, 1)

    const newRecord = {
      id: '37EA2CC92CA64CC356E4609FBC020BF3540C519EB195FCF15EC1CA7613CF1282',
      valid: true
    }
    await saveValidatedRecord(ground, 'validated_transactions', 2, newRecord, 1)

    const savedRecord = await ground.query(`SELECT * FROM "validated_transactions" WHERE id = '37EA2CC92CA64CC356E4609FBC020BF3540C519EB195FCF15EC1CA7613CF1282';`)

    assert.equal(savedRecord.length, 1, 'There should only be one record left')
    assert.equal(savedRecord[0].valid, true, 'The old record should have been replaced by the new')
    assert.equal(savedRecord[0].pass, 2, 'The old record should have a pass value of 2')
  })
  */
})