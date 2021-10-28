
SERVER_STAGE = https://ada-stage.redacted.example.com/
SERVER_PROD = https://ada.redacted.example.com/
SERVER_DEV = http://localhost:3001/

.PHONY help:
help:
	@echo "\n \
    MAKE TARGETS $(PWD): \n \
    make deps \n \
    make test-dev \n \
    make test-stage \n \
    make test-prod \n \
    make tests-that-spend"

#############################
#### BUILD COMMANDS #########
#############################

# Install node packages for test environment
.PHONY: deps 
deps: 
	npm install

#############################
#### TEST COMMANDS ##########
#############################

# Run the build test environment against dev server (on local machine)
.PHONY: test-dev
test-dev:
	COIN_QUERY_SERVER=$(SERVER_DEV) npm run tests

.PHONY: test-stage
test-stage:
	COIN_QUERY_SERVER=$(SERVER_STAGE) npm run tests

.PHONY: test-prod
test-prod:
	COIN_QUERY_SERVER=$(SERVER_PROD) npm run tests
