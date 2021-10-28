// import { assert } from 'chai'
// import { createEthereumVillage } from '../../../ethereum/src'
// import { resetEthereumDb } from '../../../ethereum/src/fixtures'
// import { startServiceCron, ServiceRoot, ServiceActionSource } from 'common'
// const { ethereumConfig } = require('../../../ethereum/test/config/config')

// function getAffirmActionSource(): ServiceActionSource {
//   throw new Error('Service types changed and this test function will need to be updated.')
//   // return async () => affirm
// }
// const actionSource = getAffirmActionSource()

// async function affirm(): Promise<boolean> {
//   const village = await createEthereumVillage(ethereumConfig)
//   const model = village.model

//   console.log('You are great!')
//   const serviceState = await model.Service.first({ name: 'affirmation' })
//   await model.Service.update({ name: 'affirmation', blockIndex: serviceState.blockIndex + 1 })
//   return true
// }

// describe('service test', function () {
//   before(async function () {
//     this.timeout(10 * 1000)

//     const village = await createEthereumVillage(ethereumConfig)
//     await resetEthereumDb(village)
//     const model = village.model

//     await model.Service.create({ name: 'affirmation', blockIndex: 0, enabled: true, interval: 10 * 1000 })
//   })

//   it('can start a service', async function () {
//     this.timeout(60 * 1000)

//     const village = await createEthereumVillage(ethereumConfig)
//     const model = village.model

//     startServiceCron(model, 'affirmation', actionSource).then(async () => {
//       const serviceState = await model.Service.update({ name: 'affirmation', enabled: false })
//       assert(serviceState.blockIndex > 0, 'The affirmation service should have an incremented blockIndex')
//     })
//   })
// })