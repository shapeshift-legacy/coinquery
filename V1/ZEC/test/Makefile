ZEC_SERVER_STAGE = https://zec-stage.redacted.example.com/
ZEC_SERVER_PROD = https://zec.redacted.example.com/
ZEC_SERVER_DEV = http://localhost:3001/

# Default 
all: deps test-prod

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
	$(RUN_TEST) sh -c "COIN_QUERY_ZEC_SERVER=$(ZEC_SERVER_DEV) npm run tests"

.PHONY: test-stage
test-stage:
	$(RUN_TEST) sh -c "COIN_QUERY_ZEC_SERVER=$(ZEC_SERVER_STAGE) npm run tests"

.PHONY: test-prod
test-prod:
	$(RUN_TEST) sh -c "COIN_QUERY_ZEC_SERVER=$(ZEC_SERVER_PROD) npm run tests"