DOGE_SERVER_STAGE = https://doge-stage.redacted.example.com/
DOGE_SERVER_PROD = https://doge.redacted.example.com/
DOGE_SERVER_DEV = http://localhost:3001/
DOGE_SERVER_TEST = https://doge-stage.redacted.example.com/

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
	@$(RUN_TEST) npm install

#############################
#### TEST COMMANDS ##########
#############################

# Run the build test environment against dev server (on local machine)
.PHONY: test-dev
test-dev:
	$(RUN_TEST) sh -c "COIN_QUERY_DOGE_SERVER=$(DOGE_SERVER_DEV) npm run tests"

.PHONY: test-stage
test-stage:
	$(RUN_TEST) sh -c "COIN_QUERY_DOGE_SERVER=$(DOGE_SERVER_STAGE) npm run tests"

.PHONY: test-prod
test-prod:
	$(RUN_TEST) sh -c "COIN_QUERY_DOGE_SERVER=$(DOGE_SERVER_PROD) npm run tests"

.PHONY: test-murder
test-murder:
	$(RUN_TEST) sh -c "COIN_QUERY_DOGE_SERVER=$(DOGE_SERVER_TEST) npm run test-doge-murder"
