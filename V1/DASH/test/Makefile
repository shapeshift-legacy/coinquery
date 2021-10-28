DASH_SERVER_STAGE = https://dash-stage.redacted.example.com/
DASH_SERVER_PROD = https://dash.redacted.example.com/
DASH_SERVER_DEV = http://localhost:3001/

.PHONY help:
help:
	@echo "\n \
    MAKE TARGETS $(PWD): \n \
    make deps \n \
    make test-dev \n \
    make test-stage \n \
    make test-prod"

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
	sh -c "COIN_QUERY_DASH_SERVER=$(DASH_SERVER_DEV) npm run tests"

.PHONY: test-stage
test-stage:
	sh -c "COIN_QUERY_DASH_SERVER=$(DASH_SERVER_STAGE) npm run tests"

.PHONY: test-prod
test-prod:
	sh -c "COIN_QUERY_DASH_SERVER=$(DASH_SERVER_PROD) npm run tests"
