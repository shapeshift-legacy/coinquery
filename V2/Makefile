DB ?= local
TEST_PATH ?= ./...
BENCH_TIME ?= 1s
TIMEOUT ?= 10m

# Docker targets

.PHONY: dev-btc dev-bch dev-btctestnet dev-dgb dev-ltc dev-dash dev-doge

dev-btc dev-bch dev-btctestnet dev-dgb dev-ltc dev-dash dev-doge:
	COIN=$(subst dev-,,$@) \
	ENVIRONMENT=${DB} \
	docker-compose -f build/coinquery/utxo/docker-compose.yml up --build

.PHONY: dev-eth

dev-eth:
	docker-compose -f build/coinquery/eth/docker-compose.yml up --build

# Go targets

.PHONY: build test test-unit test-integration test-bench clean godoc generate

build:
	go build ./...

test: test-unit test-integration

test-unit:
	go test -v -cover -count=1 -tags=unit ${TEST_PATH}

test-integration:
	go test -v -cover -count=1 -p=1 -tags=integration ${TEST_PATH}

test-bench:
	go test -timeout=${TIMEOUT} -run=NONE -bench=. -benchtime=${BENCH_TIME} -tags=benchmark ${TEST_PATH}

clean:
	go clean ./...

godoc:
	@ godoc -http=:3000

generate:
	go generate ./...

# Misc targets

.PHONY: test-attack

test-attack:
	cd ./vegeta && HOST=stage make attack