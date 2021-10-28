/*

Prints out a SQL migration script from one Git commit to another

Example usage:

cd modules/ethereum

# Print a SQL diff between the two most recent commits
node scripts/db-diff

# Print a SQL diff between a specific commit and the most recent commit
node scripts/db-diff df216d1ed2e02e66de8b278c256f55ea18c539ce

# Print a SQL diff between two specific commits
node scripts/db-diff df216d1ed2e02e66de8b278c256f55ea18c539ce 7c60a086b53d8135791fb752576de316aa31d226

 */

require('source-map-support').install()
import { getLatestDiff, generateMigrationSql } from 'vineyard-ground/migration'
const diff = getLatestDiff('src/ethereum-explorer-schema.json', process.argv.slice(2))
const sql = generateMigrationSql(diff)
console.log('Sql Migration from', diff.firstCommit, 'to', diff.secondCommit)
console.log(sql)
