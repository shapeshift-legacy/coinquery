# ss_the_sql
ShapeShift - The Sequel!

This repo holds SQL DDL for creating ShapeShift's SQL database

It uses sqitch to automate the development of the DDL.

## Setup
1. Pre-requirements: Postgres can be run locally or with docker.
2. Install sqitch with dependencies (used to deploy stored procedures)
    1. `brew tap sqitchers/sqitch`
    2. `brew install sqitch --with-postgres-support`
3. Run the following commands in your postgres instance:
    - `CREATE USER indexer;`
    - `CREATE DATABASE indexer;`
    - `GRANT ALL PRIVILEGES ON DATABASE indexer TO indexer;`
    - `CREATE USER indexertest;`
    - `CREATE DATABASE indexertest;`
    - `GRANT ALL PRIVILEGES ON DATABASE indexertest TO indexertest;`
4. Install future for deploying to local database
    1. `pip install future` - if failed with error code 1, use `pip install --user future`

### Usage
Build the stored procedues with `./build.py`

### Deploying remotely
WARNING - THIS WILL DESTROY ANY DATA IN THE DATABASE UNDER THE COIN SCHEMA YOU ARE RUNNING IT IN.
1. Move into generated coin directory: `cd gen/{{COIN}}`
2. Update `sqitch.conf` to point to remote db
3. Status: `sqitch status` to see the changes that will be deployed
4. Deploy: `sqitch deploy` to deploy the changes

### Build image to modify schema on RDS instance
1. Update `template/common/txo/sqitch.conf` to point to cq-remote and add RDS DB credentials
2. Build image passing $COIN arg
3. Run image interactively in VPC that has permission to connect to RDS instance, run sqitch commands listed above in correct coin directory
