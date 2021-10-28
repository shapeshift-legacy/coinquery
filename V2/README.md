[![CircleCI](https://circleci.com/gh/shapeshift-legacy/coinquery/tree/master.svg?style=svg&circle-token=0e63ce312a37063ae94da27ee58282aa80a9359d)](https://circleci.com/gh/shapeshift-legacy/coinquery/tree/master)

# CQ V2

## ARCHITECTURE 

![architecture-for-CQ-V2](images/CQ-V2.png?raw=true "architecture-for-CQ-V2")

## COIN SUPPORT

- BTC
- BTCTESTNET
- BCH
- DGB
- LTC

### ADDING COINS

- Add coin configuration using default values to getCoins function in infra/config.ts 
- Add coin configuration to config/<prod&&stage>.json 
- Get in touch with SRE so that they can provision a database to host this new coin
- Add schemaPrefix to pkg/postgres/postgres.go
- Add coin template to ingester-sql-ddl
- Run sqitch against new database to ensure schema is valid (see build/ingester-sql-ddl/README.md)

### INSTALL DEPENDENCIES
- Install ZMQ using your package manager of choice `brew install zmq`

### DEVELOPMENT

#### SETUP
- `cp sample.env .env` and add your AWS creds for KMS

#### RUNNING THE API
- `make dev-{ticker}` (lowercase ticker) will spin up your dev environment with the db deployed with sqitch (ingester-sql-ddl) and api service with hot reloading.
- `DB=stage make dev-{ticker}` to connect the api to the staging database

#### RUNNING THE INDEXER
- `go run cmd/indexer/indexer -coin [coin] -start [startBlock] -end [endBlock]` the `-sync` flag can be used to sync from last block in db

#### RUNNING THE MONITOR
- `go run cmd/monitor/main.go -config={absolute-path-to}/config.json -coin={coin}`

### View your GoDocs
- Run `make godoc`
- Open browser to `localhost:3000`
- Click `packages` button on top nav
- Click `Third party` link under `Packages`
- Navigate to `shapeshift-legacy` > `coinquery` > `V2` and you will see our packages

### PORTS

```
4000 => API
4001 => Monitor
```

### DEPLOYMENT 

- To change the coins deployed via circle-ci (and depending on what coins you want to deploy to which environment) update the `STAGE_COINS` and `PROD_COINS` env vars in circle-ci. Format is comma delimited - no spaces - all lowercase
    
    Prod coins
	```
	btc,bch,dgb,ltc
	```
 
   Stage coins
	```
	btc,bch,dgb,ltc
	```

- Make sure to create the following ECR repos for the new coin:
	- coinquery/{environment}-monitor-{coin}
	- coinquery/{environment}-indexer-{coin}
	- coinquery/{environment}-api-{coin}

### Profiling
- local builds have pprof support enabled by default that you can use to extract cpu and memory profiles
- some very basic memory and go-routine information can be found by navigating to `http://localhost:4000/debug/pprof/`
- To create a cpu or memory profile, activate profiling with the following command

	```
	go tool pprof -seconds 30 http://localhost:4000/debug/pprof/profile
	// Then proceed to put the server under load by making requests to the endpoints you care about
	```

- To interactively explore your generated profile

	```
	pprof -http localhost:8080 {profile_file_name}
	```

### Tests
- use make target `test` to run all unit tests and integration tests
- set `TEST_PATH` to only run tests in the specified directory. default all directories
- set `TIMEOUT` to specify a timeout limit. default 10m

#### Unit
- use the build tag `unit` for any unit test suits
- use `package_unit_test.go` for test file
- use make target `test-unit` to run all unit tests

#### Integration
- use the build tag `integration` for any unit test suits
- use `package_integration_test.go` for test file
- use make target `test-integration` to run all unit tests

#### Benchmarks
- use the build tag `benchmark` for any benchmark test suites
- use `package_bench_test.go` for test file
- use make target `test-bench` to run all benchmark tests
- set `BENCH_TIME` to a duration (1s for 1 second) or count (1x for 1 execution) for more granularity. default 1s
- update db uri in test as needed for db/api benchmarks
*note that using the default duration for benchmarks in the insight package will fail. use count in this case*

#### HTTP API LOAD TESTING
- `make attack` see ./vegeta/README.md for usage
