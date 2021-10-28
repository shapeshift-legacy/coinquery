REGION = us-west-2

.PHONY: deploy
deploy:
	AWS_REGION=$(REGION) npm run deploy

.PHONY: deploy-function
deploy-function:
	npm run deploy-function

.PHONY: invoke
invoke:
	AWS_REGION=$(REGION) npm run invoke

.PHONY: getLatestSnapshot
getLatestSnapshot:
	AWS_REGION=$(REGION) npm run getLatestSnapshot 

.PHONY: log
log:
	AWS_REGION=$(REGION) npm run log 

.PHONY: clean
clean:
	serverless remove
