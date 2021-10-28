import { Modeler, Property, Trellis } from 'vineyard-data/legacy'
import { LastBlockDao, ValidationRecord } from './types'
import { blockchain } from './blockchain'
import { StatsD } from 'hot-shots';

const dogstatsd = new StatsD()

export type AddressMap = { [key: string]: number }

function formatValue(property: Property, value: any): string {
  switch (property.type.name) {
    case 'string':
      return `'${value}'`

    case 'float':
    case 'int':
    case 'long':
      return value.toString()

    case 'bool':
      return value ? "'1'" : "'0'"

    case 'datetime':
      return 'NOW()'

    case 'json':
    case 'jsonb':
      return `'${JSON.stringify(value)}'`

    default:
      throw new Error('Dynamically inserting properties of type ' + property.name + ' is not yet supported.')
  }
}

export async function batchInsert(ground: Modeler, trellis: Trellis, records: any[]) {
  const properties = (Object.values(trellis.properties) as any)
    .concat([
      {
        name: 'created',
        type: {
          name: 'datetime'
        }
      },
      {
        name: 'modified',
        type: {
          name: 'datetime'
        }
      }
    ])
  const fieldNames = properties.map((property: any) => `"${property.name}"`).join(', ')
  const header = `INSERT INTO "${trellis.table.name}" (${fieldNames}) VALUES\n`
  const inserts = records.map(record => {
    const values = properties
      .map((property: any) => formatValue(property, record [property.name]))
      .join(', ')

    return `(${values})`
  })
    .join(',\n')

  const sql = header + inserts + ' ON CONFLICT DO NOTHING;'
  await ground.query(sql)
}

export async function saveAddresses(ground: Modeler, addresses: AddressMap): Promise<void> {
  if (Object.keys(addresses).length == 0)
    return
  const inserts: string[] = []
  for (const i in addresses) {
    const value = addresses[i]
    if (value === -1) {
      inserts.push(`('${i}', 0, NOW())`)
    }
  }
  const insertHeader = 'INSERT INTO "addresses" ("hash", "balance", "created") VALUES\n'
  const sql = insertHeader + inserts.join(',\n') + ' ON CONFLICT DO NOTHING'
  await ground.query(sql)
}

export async function batchUpsert(ground: Modeler, trellis: Trellis, records: any[]) {
  console.log('TRELLIS', records)
  const properties = (Object.values(trellis.properties) as any)
    .concat([
      {
        name: 'created',
        type: {
          name: 'datetime'
        }
      },
      {
        name: 'modified',
        type: {
          name: 'datetime'
        }
      }
    ])
  const fieldNames = properties.map((property: any) => `"${property.name}"`).join(', ')
  const header = `INSERT INTO "${trellis.table.name}" (${fieldNames}) VALUES\n`
  const primaryKey = trellis.primary_keys[0].name
  const inserts = records.map(record => {
    const values = properties
      .map((property: any) => formatValue(property, record [property.name]))
      .join(', ')

    return `(${values})`
  }).join(',\n')
  const updates = properties.filter((p: any) => p.name !== primaryKey).map((property: any) => {
    return `"${property.name}" = excluded.${property.name}`
  }).join(', ')
  const sql = `${header} ${inserts} ON CONFLICT ("${primaryKey}") DO UPDATE SET ${updates};`
  await ground.query(sql)
}

export async function getOrCreateAddresses(ground: Modeler, addresses: AddressMap): Promise<void> {
  {
    const addressClauses: string[] = []
    for (const i in addresses) {
      addressClauses.push(`'${i}'`)
    }
    if (addressClauses.length == 0) return Promise.resolve()

    const header = `SELECT "id", "address" FROM addresses
  WHERE "address" IN (
  `
    const sql = header + addressClauses.join(',\n') + ');'
    const rows = await ground.query(sql)
    for (const row of rows) {
      /* tslint:disable-next-line:radix */
      addresses[row.address.trim()] = parseInt(row.id)
    }
  }
  {
    const inserts: string[] = []
    for (const i in addresses) {
      const value = addresses[i]
      if (value === -1) {
        inserts.push(`('${i}', NOW(), NOW())`)
      }
    }
    if (inserts.length == 0) return Promise.resolve()

    const insertHeader = 'INSERT INTO "addresses" ("address", "created", "modified") VALUES\n'
    const sql =
      insertHeader + inserts.join(',\n') + ' ON CONFLICT DO NOTHING RETURNING "id", "address";'
    const rows = await ground.query(sql)
    for (const row of rows) {
      /* tslint:disable-next-line:radix */
      addresses[row.address.trim()] = parseInt(row.id)
    }
  }
}

export async function getOrCreateAddresses2(
  ground: Modeler,
  addresses: string[]
): Promise<AddressMap> {
  const existingAddresses = await getExistingAddresses(ground, addresses)
  const newlySavedAddresses = await saveNewAddresses(
    ground,
    arrayDiff(addresses, Object.keys(existingAddresses))
  )
  return { ...existingAddresses, ...newlySavedAddresses }
}

export async function getExistingAddresses(
  ground: Modeler,
  addresses: string[]
): Promise<AddressMap> {
  const addressMap: AddressMap = {}
  if (addresses.length === 0) return addressMap

  const header = 'SELECT "id", "address" FROM addresses WHERE "address" IN ('
  const sql = header + addresses.map(add => `'${add}'`).join(',\n') + ');'

  const rows = await ground.query(sql)
  for (const row of rows) {
    /* tslint:disable-next-line:radix */
    addressMap[row.address.trim()] = parseInt(row.id)
  }
  return addressMap
}

export async function saveNewAddresses(ground: Modeler, addresses: string[]): Promise<AddressMap> {
  const addressMap: AddressMap = {}
  if (addresses.length === 0) return addressMap

  const inserts: string[] = addresses.map(add => `('${add}', NOW(), NOW())`)
  const insertHeader = 'INSERT INTO "addresses" ("address", "created", "modified") VALUES\n'
  const sql =
    insertHeader + inserts.join(',\n') + ' ON CONFLICT DO NOTHING RETURNING "id", "address";'

  const rows = await ground.query(sql)
  for (const row of rows) {
    /* tslint:disable-next-line:radix */
    addressMap[row.address.trim()] = parseInt(row.id)
  }
  return addressMap
}

export function arrayDiff<T>(a1: T[], a2: T[]): T[] {
  const set2 = new Set(a2)
  return a1.filter(x => !set2.has(x))
}

export interface CurrencyResult {
  currency: any
  tokenContract: blockchain.TokenContract
}

export async function saveCurrencies(
  ground: Modeler,
  tokenContracts: blockchain.TokenContract[]
): Promise<CurrencyResult[]> {
  const result: CurrencyResult[] = []
  for (const contract of tokenContracts) {
    if (!contract.name) {
      // throw new Error('Contract is missing name property')
      contract.name = 'No name'
    }
    const record = await ground.collections.Currency.create({
      name: contract.name
    })
    result.push({
      currency: record,
      tokenContract: contract
    })
  }

  return result
}

export async function getNextBlock(service: any) {
  const lastBlockIndex = service.blockIndex
  return typeof lastBlockIndex === 'number' ? lastBlockIndex + 1 : 0
}

export async function deleteFullBlocks(ground: any, indexes: number[]): Promise<void> {
  if (indexes.length === 0) {
    return
  }
  const sql = `
  DELETE FROM blocks WHERE index IN (${indexes.join(', ')});
  DELETE FROM receipts r
    USING transactions tx
    WHERE r.hash = tx.hash AND tx."blockIndex" IN (${indexes.join(', ')});
  DELETE FROM contracts c
    USING transactions tx
    WHERE c.transaction = tx.hash AND tx."blockIndex" IN (${indexes.join(', ')});
  DELETE FROM transaction_logs tl
    USING transactions tx
    WHERE tl.transaction = tx.hash AND tx."blockIndex" IN (${indexes.join(', ')});
  DELETE FROM transactions WHERE "blockIndex" IN (${indexes.join(', ')});
  `
  await ground.querySingle(sql)

}

export function getLastBlockIndex(ground: Modeler, currency: number): Promise<number | undefined> {
  const sql = `
  SELECT "blockIndex" FROM last_blocks WHERE currency = :currency
  `
  return ground.querySingle(sql, { currency }).then(
    (value: any) =>
      /* tslint:disable-next-line:radix */
      value && typeof value.blockIndex == 'string' ? parseInt(value.blockIndex) : undefined
  ) as any
}

export async function setLastBlockIndex(ground: Modeler, currency: number, block: number) {
  const sql = 'UPDATE last_blocks SET "blockIndex" = :block WHERE currency = :currency'
  return await ground.query(sql, {
    block,
    currency
  })
}

export function createIndexedLastBlockDao(ground: Modeler, currency: number): LastBlockDao {
  return {
    getLastBlock: () => getLastBlockIndex(ground, currency),
    setLastBlock: (blockIndex: number) => setLastBlockIndex(ground, currency, blockIndex)
  } as any
}

export async function saveValidationRecord(ground: Modeler, tableName: string, record: ValidationRecord): Promise<void> {
  await ground.query(`INSERT INTO "${tableName}" (id, pass, valid, "blockIndex", created) VALUES ('${record.id}', ${record.pass}, ${record.valid}, ${record.blockIndex}, NOW()) ON CONFLICT DO NOTHING;`)
  dogstatsd.increment(`eth.db.${tableName}`, 1)
}

export async function saveValidationRecords(ground: Modeler, trellis: Trellis, records: ValidationRecord[]): Promise<void> {
  await batchInsert(ground, trellis, records)
  dogstatsd.increment(`eth.db.${trellis.table.name}`, records.length)
}

export async function getEndBlock(ground: Modeler, step: number): Promise<number> {
  if (step < 0) return 0

  const highestBlock = await ground.querySingle('SELECT index FROM blocks ORDER BY index DESC LIMIT 1;')
  return parseInt(highestBlock.index, 10)
}