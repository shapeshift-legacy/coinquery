# Minotaur Development Documentation

## General Notes

* All config files need to be loaded with `require` instead of `import` so TypeScript won't throw an error if the file is missing.

## Linting
We are using [Tslint](https://github.com/palantir/tslint) with a custom config run through [Prettier](https://prettier.io). To see linting errors, make sure you have an appropriate `tslint` package for your IDE.

* Run the linter with `yarn lint`
* Correct all auto-fixable problems with `yarn lintfix`

## Resetting the Database
The `reset-ethereum-db` script is for use when working with a local, non-production database. The script resets the schema for the Ethereum database and uses `modules/ethereum/src/fixtures.ts` to populate default services and service state. See the [service](../../common/doc/service.md) documentation for more information on service structure. Run with

`node modules/ethereum/scripts/reset-ethereum-db`

## Generating Migrations
The `db-diff` script is used to generate migrations after changes to the database schema. It prints out a SQL migration script from one Git commit to another.

This script **must** be run from the `ethereum` directory:

`cd modules/ethereum`

* Print a SQL diff between the two most recent commits: 

  `node scripts/db-diff`

* Print a SQL diff between a specific commit and the most recent commit:

  `node scripts/db-diff df216d1ed2e02e66de8b278c256f55ea18c539ce`

* Print a SQL diff between two specific commits:

  `node scripts/db-diff df216d1ed2e02e66de8b278c256f55ea18c539ce 7c60a086b53d8135791fb752576de316aa31d226`