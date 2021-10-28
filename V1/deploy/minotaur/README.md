
# CoinQuery - ETH transaction history service


The minotaur process reads data from a geth node and stores it in a Postgres database. CoinQuery uses this database to retrieve "normal", internal, and token transaction history.  There is also a table of addresses and their current balance.



### Block Diagram

```
+----------------+       +---------------+     +---------------+       +----------------+
|                |       |               |     |               |       |                |    Customer
|      geth      |  RPC  |    minotaur   | SQL |    Database   |  SQL  |     proxy      +-->   API
|                +-------+               +-----+   (Postgres)  +-------+                |
|                |       |               |     |               |       |                |
+-------+--------+       +---------------+     +---------------+       +----------------+
        |
    +---+---+
    |       |
    +-------+
    |       |
    +-------+
    |       |
    +-------+
    chaindata
```

### Credentials

The database is created using AWS RDS (relational database service).  Database credentials must be set as environment variables in the files below.  The credentials are stored in in 1Password:  

* `build/minotaur/env.sh` - for the database creation  
* `ethereum/env.sh` -  used when testing the proxy locally   
* `deploy/deploy.sh` - used by the deployed stack  
* AWS CodeBuild - PR validator  

### Dependencies
* PostgreSQL (psql) 10.1
* PSequel GUI interface or equivalent (for database inspection, debug)

### Build

* Location: `build/minotaur`  
 * Copy the file `env-sample.sh` to a local version called `env.sh` and update Gitlab and Minotaur credentials as needed.  
 * `source env.sh`    
 * `make minotaur` 


### Initialize 
These steps are only required for a new database

* Location: `build/minotaur`
* Load the schema:
 
```
psql -f ./ethereum-explorer-db.sql \ 
postgres://$(MINOTAUR_USERNAME):$(MINOTAUR_PASSWORD)@$(MINOTAUR_HOST)/$(MINOTAUR_DB_NAME) 
```

* Initialize the `last_blocks` table.  This is used by minotaur to keep track of the last block processed.  If these aren't set, minotaur will return to block 0 when it restarts or encounters an error.

```
INSERT INTO "last_blocks" ("currency","blockIndex","created","modified") VALUES (1, NULL, NOW(), NOW()); 
INSERT INTO "last_blocks" ("currency","blockIndex","created","modified") VALUES (2, NULL, NOW(), NOW()); 
INSERT INTO "currencies" ("id","name","created","modified") VALUES (DEFAULT, 'Bitcoin', NOW(), NOW()); 
INSERT INTO "currencies" ("id","name","created","modified") VALUES (DEFAULT, 'Ethereum', NOW(), NOW()); 
```

### Test

* Location: `ethereum/` 
 * Copy the file `env-sample.sh` to a local version called `env.sh` and update Minotaur credentials as needed.
* Location: `ethereum/test` 
 * `source ../env.sh`
 * `make test-dev`


### Deploy

* Location: `deploy`
 * Update Minotaur credentials as needed, see:`./deploy.sh MINOTAUR`


### PR Validator
The PR validator checks out the latest code from Github, builds and tests it.  It needs access to an external database and geth node.  Update the following environment variables at:
[AWS CodeBuild](https://us-west-2.console.aws.amazon.com/codebuild/home?region=us-west-2#/projects/cq_eth_pr_validator_build/view)

```
MINOTAUR_USERNAME=
MINOTAUR_PASSWORD=
MINOTAUR_HOST=
MINOTAUR_DB_NAME=
GETH_SERVER=
```

## Troubleshooting

If you run into issues populating the database, you can run this test query to verify that the database is operating normally and the schema is correct.

```
INSERT INTO "transactions" ("status", "txid", "to", "from", "amount", "fee", "gasPrice", "nonce", "currency", "timeReceived", "blockIndex", "created", "modified") 
VALUES (3, '0xcb9378977089c773c074045b20ede2cdcc3a6ff562f4e64b51b20c5205234525', 7, 8, 100000000000000000000, 21000000000000000, 1000000000000, 0, 2, '2015-08-07T03:43:03.000Z', 46194, NOW(), NOW()) ON CONFLICT DO NOTHING
```

## References

[Gitlab Repository - Ideas By Nature - Minotaur Service](https://gitlab.com/ideas-by-nature/labyrinth/minotaur.git)



