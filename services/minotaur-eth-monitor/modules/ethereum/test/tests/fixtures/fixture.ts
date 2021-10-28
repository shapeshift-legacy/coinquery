import { createEthereumVillage } from '../../../src'
const { ethereumConfig } = require('../../config/config')
import { DevModeler } from 'vineyard-ground'
const { exec } = require('child_process')

async function sh(cmd: string) {
  return new Promise(function (resolve, reject) {
    return exec(cmd, (err: Error, stdout: string, stderr: string) => {
      if (err) {
        return reject(err);
      } else {
        return resolve({ stdout, stderr });
      }
    });
  });
}

export default async function main (testName?: string) {
  let thisTest = testName || 'fixture'
  const village = await createEthereumVillage(ethereumConfig)
  await (<DevModeler> village.model.ground).regenerate()
  await sh(`psql ${ethereumConfig.database.database} < ${__dirname}/fix-${thisTest}.dump`)
  console.log('Database seeded successfully.')
}
