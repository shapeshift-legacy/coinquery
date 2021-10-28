import { Modeler } from 'vineyard-data/legacy'
import * as fs from 'fs'
import { MinotaurVillage } from './village'
import { BlockServiceState, CommonConfig, ServiceRecord } from 'common'

export type SharedModel = { ground: Modeler; LastBlock: any; Currency: any }

const header = '-- This file is auto-generated and should not be directly modified.\n\n'

const commonSql = `
INSERT INTO "last_blocks" ("currency","blockIndex","created","modified") VALUES (1, NULL, NOW(), NOW());
INSERT INTO "last_blocks" ("currency","blockIndex","created","modified") VALUES (2, NULL, NOW(), NOW());
INSERT INTO "currencies" ("id","name","created","modified") VALUES (1, 'Bitcoin', NOW(), NOW());
INSERT INTO "currencies" ("id","name","created","modified") VALUES (2, 'Ethereum', NOW(), NOW());
`

export function sanitizeSqlLine(line: string): string {
  const trimmed = line.trim()
  return trimmed[trimmed.length - 1] == ';'
    ? trimmed
    : trimmed + ';'
}

export async function initializeDb(model: any, additionalSql: string): Promise<string> {
  let logs = ''
  const logger = (message: string) => {
    logs += message + '\n'
  }
  const { ground } = model as any
  await ground.db.sync({
    force: true,
    logging: logger
  })

  await model.ground.query(additionalSql)
  const filtered = logs
    .split('Executing (default): ')
    .slice(1)
    .filter(line => line.substr(0, 6) != 'SELECT')
    .map(sanitizeSqlLine)
    .join('\n')

  return header + filtered + additionalSql
}

function saveSqlScript(sql: string, sqlFilePath: string) {
  fs.writeFileSync(sqlFilePath, sql, 'utf8')
  console.log('Saved SQL to', sqlFilePath)
}

export interface DatabaseInitializationProps<Model, Config> {
  village: MinotaurVillage<Model, Config>
  sqlFilePath: string
}

export async function resetMonitorDb<Model extends SharedModel, Config extends CommonConfig>(
  village: MinotaurVillage<Model, Config>,
  sqlFilePath: string,
  services: ServiceRecord<BlockServiceState>[]
): Promise<void> {
  if (!village.config.database.devMode) throw new Error('Can only reset db in devMode.')

  const additionalSql = commonSql +
    services.map(w =>
      `INSERT INTO "services" ("name", "enabled", "state") VALUES ('${w.name}', ${w.enabled}, '${w.state ? JSON.stringify(w.state) : null}');`
    )
      .join('\n')

  const sql = await initializeDb(village.model, additionalSql)

  if (process.argv.some(i => i == '--save')) saveSqlScript(sql, sqlFilePath)

}
