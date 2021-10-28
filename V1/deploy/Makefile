USER_DATA_BUCKET=all-userdata-scripts
USER_DATA_SCRIPT=userdata.sh

ETH_COMMIT=$$(cd ../ETH && git rev-parse --short HEAD)
BSV_COMMIT=$$(cd ../BSV && git rev-parse --short HEAD)
ZEC_COMMIT=$$(cd ../ZEC && git rev-parse --short HEAD)
DASH_COMMIT=$$(cd ../DASH && git rev-parse --short HEAD)
BTG_COMMIT=$$(cd ../BTG && git rev-parse --short HEAD)
DOGE_COMMIT=$$(cd ../DOGE && git rev-parse --short HEAD)
MINO_COMMIT=$$(git rev-parse --short HEAD)
ADA_COMMIT=$$(cd ../ADA && git rev-parse --short HEAD)

###############################################
############### ETH VARIABLES #################
###############################################

ETH_STACK_NAME = cq-eth-$(STACK_COUNT)
GETH_NAME = coinquery/geth-proxy
GETH_IMAGE = coinquery/geth:dev
GETH_REPO_IMAGE = $(ECS_REPO_URI)/$(GETH_NAME):$(ETH_COMMIT)-geth

ETH_HEALTH_IMAGE = coinquery/eth-health-check:latest
ETH_HEALTH_REPO_IMAGE = $(ECS_REPO_URI)/coinquery/eth-health-check:$(ETH_COMMIT)-eth
PROXY_NAME = coinquery/geth-proxy
PROXY_IMAGE = $(PROXY_NAME):dev
PROXY_REPO_IMAGE = $(ECS_REPO_URI)/$(PROXY_NAME):$(ETH_COMMIT)-prox

################################################
############### PARITY VARIABLES ###############
################################################

PARITY_NAME = coinquery/parity-proxy
PARITY_IMAGE = coinquery/parity:dev
PARITY_STACK_NAME = cq-parity-$(STACK_COUNT)
PARITY_REPO_IMAGE = $(ECS_REPO_URI)/$(PARITY_NAME):$(ETH_COMMIT)-parity

###############################################
############### BSV VARIABLES #################
###############################################

BSV_STACK_NAME = cq-bsv-$(STACK_COUNT)
BSV_NAME = coinquery/bsv-insight
BSV_IMAGE = coinquery/bsv-insight:dev
BSV_HEALTH_IMAGE = coinquery/bsv-health-check:latest
BSV_REPO_IMAGE = $(ECS_REPO_URI)/$(BSV_NAME):$(BSV_COMMIT)-bsv
BSV_HEALTH_REPO_IMAGE = $(ECS_REPO_URI)/coinquery/bsv-health-check:$(BSV_COMMIT)-bsv

###############################################
############### ZEC VARIABLES #################
###############################################

ZEC_STACK_NAME = cq-zec-$(STACK_COUNT)
ZEC_NAME = coinquery/zec-insight
ZEC_IMAGE = coinquery/zec-insight:dev
ZEC_HEALTH_IMAGE = coinquery/zec-health-check:latest
ZEC_REPO_IMAGE = $(ECS_REPO_URI)/$(ZEC_NAME):$(ZEC_COMMIT)-zec
ZEC_HEALTH_REPO_IMAGE = $(ECS_REPO_URI)/coinquery/zec-health-check:$(ZEC_COMMIT)-zec

###############################################
############## DASH VARIABLES #################
###############################################

DASH_STACK_NAME = cq-dash-$(STACK_COUNT)
DASH_NAME = coinquery/dash-insight
DASH_IMAGE = coinquery/dash-insight:dev
DASH_HEALTH_IMAGE = coinquery/dash-health-check:latest
DASH_REPO_IMAGE = $(ECS_REPO_URI)/$(DASH_NAME):$(DASH_COMMIT)-dash
DASH_HEALTH_REPO_IMAGE = $(ECS_REPO_URI)/coinquery/dash-health-check:$(DASH_COMMIT)-dash

###############################################
############### MINO VARIABLES ################
###############################################

MINO_STACK_NAME = cq-minotaur-$(STACK_COUNT)
MINO_NAME = coinquery/minotaur
MINO_IMAGE = coinquery/minotaur:dev
MINO_REPO_IMAGE = $(ECS_REPO_URI)/$(MINO_NAME):$(MINO_COMMIT)-minotaur

#############################
#### GETH BUILD COMMANDS ####
#############################

.PHONY: geth-image
geth-image:
	@cd ../ETH && make geth-image-build

#################################
#### MINOTAUR BUILD COMMANDS ####
#################################

.PHONY: minotaur-image
minotaur-image:
	@cd ./minotaur && make minotaur

##############################
#### PROXY BUILD COMMANDS ####
##############################

.PHONY: proxy-image
proxy-image:
	@cd ../ETH && make proxy-docker-builder
	@cd ../ETH && make proxy-deps
	@cd ../ETH && make proxy
	@cd ../ETH && make proxy-docker-bin

# overwrites imagedefinitions.json during pipeline deploy
.PHONY: image-definitions
image-definitions:
	@printf '[{"name":"%s-proxy","imageUri":"%s"}]' $(NAME) $(PROXY_REPO_IMAGE) > ../ETH/imagedefinitions.json

# populates region specific paramter store
.PHONY: params
params:
	@aws --region $(REGION) ssm put-parameter --name "region" --value $(REGION) --type String --overwrite
	@aws --region $(REGION) ssm put-parameter --name "regionSSL" --value $(REGION_SSL) --type String --overwrite
	@aws --region $(REGION) ssm put-parameter --name "ecsRepoUri" --value $(ECS_REPO_URI) --type String --overwrite
	@aws --region $(REGION) ssm put-parameter --name "stackCount" --value $(STACK_COUNT) --type String --overwrite
	@aws --region $(REGION) ssm put-parameter --name "gituser" --value $(GIT_USER) --type String --overwrite
	@aws --region $(REGION) ssm put-parameter --name "gitpass" --value $(GIT_PASS) --type String --overwrite

############################
#### BSV BUILD COMMANDS ####
############################
.PHONY: bsv-image
bsv-image:
	@cd ../BSV && make bsv

############################
#### ZEC BUILD COMMANDS ####
############################
.PHONY: zec-image
zec-image:
	@cd ../ZEC && make zec

#############################
#### DASH BUILD COMMANDS ####
#############################
.PHONY: dash-image
dash-image:
	@cd ../DASH && make dash

###############################
#### PARITY BUILD COMMANDS ####
###############################
.PHONY: parity-image
parity-image:
	@cd ../ETH && make parity-image-build

#############################
#### AWS DEPLOY COMMANDS ####
#############################

.PHONY: proxy-deploy
proxy-deploy:
	@$$(aws ecr get-login --no-include-email --region $(REGION))
	@docker tag $(PROXY_IMAGE) $(PROXY_REPO_IMAGE)
	@docker push $(PROXY_REPO_IMAGE)
	@docker tag $(ETH_HEALTH_IMAGE) $(ETH_HEALTH_REPO_IMAGE)
	@docker push $(ETH_HEALTH_REPO_IMAGE)

.PHONY: geth-deploy
geth-deploy:
	@$$(aws ecr get-login --no-include-email --region $(REGION))
	@docker tag $(GETH_IMAGE) $(GETH_REPO_IMAGE)
	@docker push $(GETH_REPO_IMAGE)

.PHONY: bsv-deploy
bsv-deploy:
	@$$(aws ecr get-login --no-include-email --region $(REGION))
	@docker tag $(BSV_IMAGE) $(BSV_REPO_IMAGE)
	@docker push $(BSV_REPO_IMAGE)
	@docker tag $(BSV_HEALTH_IMAGE) $(BSV_HEALTH_REPO_IMAGE)
	@docker push $(BSV_HEALTH_REPO_IMAGE)

.PHONY: zec-deploy
zec-deploy:
	@$$(aws ecr get-login --no-include-email --region $(REGION))
	@docker tag $(ZEC_IMAGE) $(ZEC_REPO_IMAGE)
	@docker push $(ZEC_REPO_IMAGE)
	@docker tag $(ZEC_HEALTH_IMAGE) $(ZEC_HEALTH_REPO_IMAGE)
	@docker push $(ZEC_HEALTH_REPO_IMAGE)

.PHONY: dash-deploy
dash-deploy:
	@$$(aws ecr get-login --no-include-email --region $(REGION))
	@docker tag $(DASH_IMAGE) $(DASH_REPO_IMAGE)
	@docker push $(DASH_REPO_IMAGE)
	@docker tag $(DASH_HEALTH_IMAGE) $(DASH_HEALTH_REPO_IMAGE)
	@docker push $(DASH_HEALTH_REPO_IMAGE)

.PHONY: parity-deploy
parity-deploy:
	@$$(aws ecr get-login --no-include-email --region $(REGION))
	@docker tag $(PARITY_IMAGE) $(PARITY_REPO_IMAGE)
	@docker push $(PARITY_REPO_IMAGE)

.PHONY: minotaur-deploy
minotaur-deploy:
	@$$(aws ecr get-login --no-include-email --region $(REGION))
	@docker tag $(MINO_IMAGE) $(MINO_REPO_IMAGE)
	@docker push $(MINO_REPO_IMAGE)

.PHONY: PARITY-init
PARITY-init: parity-image parity-deploy proxy-image proxy-deploy
	@aws --region $(REGION) cloudformation create-stack \
		--stack-name $(PARITY_STACK_NAME) \
		--template-body file://eth-parity.json \
		--parameters \
			ParameterKey=ParityImage,ParameterValue=$(PARITY_REPO_IMAGE) \
			ParameterKey=ProxyImage,ParameterValue=$(PROXY_REPO_IMAGE) \
			ParameterKey=SSLCertificate,ParameterValue=$(REGION_SSL) \
			ParameterKey=IsProdConditon,ParameterValue="$(IS_PROD)" \
			ParameterKey=NumTasksNInstances,ParameterValue="$(NUM_TASKS_N_INSTANCES)" \
			ParameterKey=NeedsSnapshot,ParameterValue="$(NEEDS_SNAPSHOT)" \
			ParameterKey=ScriptBucket,ParameterValue="$(USER_DATA_BUCKET)" \
			ParameterKey=ScriptKey,ParameterValue="$(USER_DATA_SCRIPT)" \
			ParameterKey=VolumeSize,ParameterValue="500" \
		--capabilities CAPABILITY_IAM

.PHONY: GETH-init
GETH-init: geth-image geth-deploy proxy-image proxy-deploy
	@aws --region $(REGION) cloudformation create-stack \
		--stack-name $(ETH_STACK_NAME) \
		--template-body file://eth.yaml \
		--parameters \
			ParameterKey=ChainType,ParameterValue=$(CHAIN_TYPE) \
			ParameterKey=GethImage,ParameterValue=$(GETH_REPO_IMAGE) \
			ParameterKey=ProxyImage,ParameterValue=$(PROXY_REPO_IMAGE) \
			ParameterKey=ETHHealthCheckImage,ParameterValue="$(ETH_HEALTH_REPO_IMAGE)" \
			ParameterKey=SSLCertificate,ParameterValue=$(REGION_SSL) \
			ParameterKey=IsProdConditon,ParameterValue="$(IS_PROD)" \
			ParameterKey=MinotaurHost,ParameterValue="$(MINOTAUR_HOST)" \
			ParameterKey=MinotaurDatabase,ParameterValue="$(MINOTAUR_DB_NAME)" \
			ParameterKey=MinotaurUsername,ParameterValue="$(MINOTAUR_USERNAME)" \
			ParameterKey=MinotaurPassword,ParameterValue="$(MINOTAUR_PASSWORD)" \
			ParameterKey=ProxyHostNPort,ParameterValue="$(PROXY_HOST_N_PORT)" \
			ParameterKey=NumTasksNInstances,ParameterValue="$(NUM_TASKS_N_INSTANCES)" \
			ParameterKey=NeedsSnapshot,ParameterValue="$(NEEDS_SNAPSHOT)" \
			ParameterKey=GCMode,ParameterValue="$(GCMODE)" \
			ParameterKey=ScriptBucket,ParameterValue="$(USER_DATA_BUCKET)" \
			ParameterKey=ScriptKey,ParameterValue="$(USER_DATA_SCRIPT)" \
			ParameterKey=VolumeSize,ParameterValue=$(VOLUME_SIZE) \
		--capabilities CAPABILITY_IAM

.PHONY: BSV-init
BSV-init: bsv-image bsv-deploy
	@aws --region $(REGION) cloudformation create-stack \
		--stack-name $(BSV_STACK_NAME) \
		--template-body file://utxo-coin.yaml \
		--parameters \
			ParameterKey=ChainType,ParameterValue="BSV" \
			ParameterKey=Image,ParameterValue=$(BSV_REPO_IMAGE) \
			ParameterKey=HealthCheckImage,ParameterValue=$(BSV_HEALTH_REPO_IMAGE) \
			ParameterKey=SSLCertificate,ParameterValue=$(REGION_SSL) \
			ParameterKey=IsProdConditon,ParameterValue="$(IS_PROD)" \
			ParameterKey=RpcHostNPort,ParameterValue="$(RPC_HOST_N_PORT)" \
			ParameterKey=RpcUser,ParameterValue="$(RPC_USER)" \
			ParameterKey=RpcPass,ParameterValue="$(RPC_PASS)" \
			ParameterKey=InsightHostNPort,ParameterValue="$(INSIGHT_HOST_N_PORT)" \
			ParameterKey=NumTasksNInstances,ParameterValue="$(NUM_TASKS_N_INSTANCES)" \
			ParameterKey=NeedsSnapshot,ParameterValue="$(NEEDS_SNAPSHOT)" \
			ParameterKey=ScriptBucket,ParameterValue="$(USER_DATA_BUCKET)" \
			ParameterKey=ScriptKey,ParameterValue="$(USER_DATA_SCRIPT)" \
			ParameterKey=VolumeSize,ParameterValue="415" \
		--capabilities CAPABILITY_IAM

.PHONY: ZEC-init
ZEC-init: zec-image zec-deploy
	@aws --region $(REGION) cloudformation create-stack \
		--stack-name $(ZEC_STACK_NAME) \
		--template-body file://utxo-coin.yaml \
		--parameters \
			ParameterKey=ChainType,ParameterValue="ZEC" \
			ParameterKey=Image,ParameterValue=$(ZEC_REPO_IMAGE) \
			ParameterKey=HealthCheckImage,ParameterValue=$(ZEC_HEALTH_REPO_IMAGE) \
			ParameterKey=SSLCertificate,ParameterValue=$(REGION_SSL) \
			ParameterKey=IsProdConditon,ParameterValue="$(IS_PROD)" \
			ParameterKey=RpcHostNPort,ParameterValue="$(RPC_HOST_N_PORT)" \
			ParameterKey=RpcUser,ParameterValue="$(RPC_USER)" \
			ParameterKey=RpcPass,ParameterValue="$(RPC_PASS)" \
			ParameterKey=InsightHostNPort,ParameterValue="$(INSIGHT_HOST_N_PORT)" \
			ParameterKey=NumTasksNInstances,ParameterValue="$(NUM_TASKS_N_INSTANCES)" \
			ParameterKey=NeedsSnapshot,ParameterValue="$(NEEDS_SNAPSHOT)" \
			ParameterKey=ScriptBucket,ParameterValue="$(USER_DATA_BUCKET)" \
			ParameterKey=ScriptKey,ParameterValue="$(USER_DATA_SCRIPT)" \
			ParameterKey=VolumeSize,ParameterValue="600" \
		--capabilities CAPABILITY_IAM

.PHONY: DASH-init
DASH-init: dash-image dash-deploy
	@aws --region $(REGION) cloudformation create-stack \
		--stack-name $(DASH_STACK_NAME) \
		--template-body file://utxo-coin.yaml \
		--parameters \
			ParameterKey=ChainType,ParameterValue="DASH" \
			ParameterKey=Image,ParameterValue=$(DASH_REPO_IMAGE) \
			ParameterKey=HealthCheckImage,ParameterValue=$(DASH_HEALTH_REPO_IMAGE) \
			ParameterKey=SSLCertificate,ParameterValue=$(REGION_SSL) \
			ParameterKey=IsProdConditon,ParameterValue="$(IS_PROD)" \
			ParameterKey=RpcHostNPort,ParameterValue="$(RPC_HOST_N_PORT)" \
			ParameterKey=RpcUser,ParameterValue="$(RPC_USER)" \
			ParameterKey=RpcPass,ParameterValue="$(RPC_PASS)" \
			ParameterKey=InsightHostNPort,ParameterValue="$(INSIGHT_HOST_N_PORT)" \
			ParameterKey=NumTasksNInstances,ParameterValue="$(NUM_TASKS_N_INSTANCES)" \
			ParameterKey=NeedsSnapshot,ParameterValue="$(NEEDS_SNAPSHOT)" \
			ParameterKey=ScriptBucket,ParameterValue="$(USER_DATA_BUCKET)" \
			ParameterKey=ScriptKey,ParameterValue="$(USER_DATA_SCRIPT)" \
			ParameterKey=VolumeSize,ParameterValue="100" \
		--capabilities CAPABILITY_IAM

.PHONY: minotaur-init
minotaur-init: minotaur-image minotaur-deploy
	@aws --region $(REGION) cloudformation create-stack \
		--stack-name $(MINO_STACK_NAME) \
		--template-body file://minotaur.json \
		--parameters \
			ParameterKey=MinotaurImage,ParameterValue=$(MINO_REPO_IMAGE) \
			ParameterKey=IsProdConditon,ParameterValue="$(IS_PROD)" \
			ParameterKey=MinotaurHost,ParameterValue="$(MINOTAUR_HOST)" \
			ParameterKey=MinotaurDatabase,ParameterValue="$(MINOTAUR_DB_NAME)" \
			ParameterKey=MinotaurUsername,ParameterValue="$(MINOTAUR_USERNAME)" \
			ParameterKey=MinotaurPassword,ParameterValue="$(MINOTAUR_PASSWORD)" \
			ParameterKey=MinotaurRPCServer,ParameterValue="$(MINOTAUR_RPC_SERVER)" \
		--capabilities CAPABILITY_IAM


##############################################
############### BTG VARIABLES ################
##############################################

BTG_STACK_NAME = cq-btg-$(STACK_COUNT)
BTG_NAME = coinquery/btg-insight
BTG_IMAGE = coinquery/btg-insight:dev
BTG_REPO_IMAGE = $(ECS_REPO_URI)/$(BTG_NAME):$(BTG_COMMIT)-btg
BTG_HEALTH_IMAGE = coinquery/btg-health-check:latest
BTG_HEALTH_REPO_IMAGE = $(ECS_REPO_URI)/coinquery/btg-health-check:$(BTG_COMMIT)-btg

############################
#### BTG BUILD COMMANDS ####
############################

.PHONY: BTG-image
BTG-image:
	@cd ../BTG && make btg

.PHONY: BTG-deploy
BTG-deploy:
	@$$(aws ecr get-login --no-include-email --region $(REGION))
	@docker tag $(BTG_IMAGE) $(BTG_REPO_IMAGE)
	@docker push $(BTG_REPO_IMAGE)
	@docker tag $(BTG_HEALTH_IMAGE) $(BTG_HEALTH_REPO_IMAGE)
	@docker push $(BTG_HEALTH_REPO_IMAGE)

.PHONY: BTG-init
BTG-init: BTG-image BTG-deploy
	@aws --region $(REGION) cloudformation create-stack \
		--stack-name $(BTG_STACK_NAME) \
		--template-body file://utxo-coin.yaml \
		--parameters \
			ParameterKey=ChainType,ParameterValue="BTG" \
			ParameterKey=Image,ParameterValue=$(BTG_REPO_IMAGE) \
			ParameterKey=HealthCheckImage,ParameterValue=$(BTG_HEALTH_REPO_IMAGE) \
			ParameterKey=SSLCertificate,ParameterValue=$(REGION_SSL) \
			ParameterKey=IsProdConditon,ParameterValue="$(IS_PROD)" \
			ParameterKey=RpcHostNPort,ParameterValue="$(RPC_HOST_N_PORT)" \
			ParameterKey=RpcUser,ParameterValue="$(RPC_USER)" \
			ParameterKey=RpcPass,ParameterValue="$(RPC_PASS)" \
			ParameterKey=InsightHostNPort,ParameterValue="$(INSIGHT_HOST_N_PORT)" \
			ParameterKey=NumTasksNInstances,ParameterValue="$(NUM_TASKS_N_INSTANCES)" \
			ParameterKey=NeedsSnapshot,ParameterValue="$(NEEDS_SNAPSHOT)" \
			ParameterKey=ScriptBucket,ParameterValue="$(USER_DATA_BUCKET)" \
			ParameterKey=ScriptKey,ParameterValue="$(USER_DATA_SCRIPT)" \
			ParameterKey=VolumeSize,ParameterValue="600" \
		--capabilities CAPABILITY_IAM

##############################################
############### DOGE VARIABLES ################
##############################################

DOGE_STACK_NAME = cq-doge-$(STACK_COUNT)
DOGE_NAME = coinquery/doge-insight
DOGE_IMAGE = coinquery/doge-insight:dev
DOGE_HEALTH_IMAGE = coinquery/doge-health-check:latest
DOGE_REPO_IMAGE = $(ECS_REPO_URI)/$(DOGE_NAME):$(DOGE_COMMIT)-doge
DOGE_HEALTH_REPO_IMAGE = $(ECS_REPO_URI)/coinquery/doge-health-check:$(DOGE_COMMIT)-doge

############################
#### DOGE BUILD COMMANDS ####
############################

.PHONY: DOGE-image
DOGE-image:
	@cd ../DOGE && make doge

.PHONY: DOGE-deploy
DOGE-deploy:
	@$$(aws ecr get-login --no-include-email --region $(REGION))
	@docker tag $(DOGE_IMAGE) $(DOGE_REPO_IMAGE)
	@docker push $(DOGE_REPO_IMAGE)
	@$$(aws ecr get-login --no-include-email --region $(REGION))
	@docker tag $(DOGE_HEALTH_IMAGE) $(DOGE_HEALTH_REPO_IMAGE)
	@docker push $(DOGE_HEALTH_REPO_IMAGE)

.PHONY: DOGE-init
DOGE-init: DOGE-image DOGE-deploy
	@aws --region $(REGION) cloudformation create-stack \
		--stack-name $(DOGE_STACK_NAME) \
		--template-body file://utxo-coin.yaml \
		--parameters \
			ParameterKey=ChainType,ParameterValue="DOGE" \
			ParameterKey=Image,ParameterValue=$(DOGE_REPO_IMAGE) \
			ParameterKey=HealthCheckImage,ParameterValue=$(DOGE_HEALTH_REPO_IMAGE) \
			ParameterKey=SSLCertificate,ParameterValue=$(REGION_SSL) \
			ParameterKey=IsProdConditon,ParameterValue="$(IS_PROD)" \
			ParameterKey=RpcHostNPort,ParameterValue="$(RPC_HOST_N_PORT)" \
			ParameterKey=RpcUser,ParameterValue="$(RPC_USER)" \
			ParameterKey=RpcPass,ParameterValue="$(RPC_PASS)" \
			ParameterKey=InsightHostNPort,ParameterValue="$(INSIGHT_HOST_N_PORT)" \
			ParameterKey=NumTasksNInstances,ParameterValue="$(NUM_TASKS_N_INSTANCES)" \
			ParameterKey=NeedsSnapshot,ParameterValue="$(NEEDS_SNAPSHOT)" \
			ParameterKey=ScriptBucket,ParameterValue="$(USER_DATA_BUCKET)" \
			ParameterKey=ScriptKey,ParameterValue="$(USER_DATA_SCRIPT)" \
			ParameterKey=VolumeSize,ParameterValue="200" \
		--capabilities CAPABILITY_IAM

##############################################
############### ADA VARIABLES ################
##############################################

ADA_STACK_NAME = cq-ada-$(STACK_COUNT)
ADA_NAME = coinquery/ada
ADA_IMAGE = coinquery/ada:dev
ADA_REPO_IMAGE = $(ECS_REPO_URI)/$(ADA_NAME):$(ADA_COMMIT)-ada
ADA_HEALTH_IMAGE = coinquery/ada-health-check:latest
ADA_HEALTH_REPO_IMAGE = $(ECS_REPO_URI)/coinquery/ada-health-check:$(ADA_COMMIT)-ada

############################
#### ADA BUILD COMMANDS ####
############################

.PHONY: ADA-image
ADA-image:
	echo ${GITHUB_USER} : ${GITHUB_PASS}
	@cd ../ADA && GITHUB_USER=${GITHUB_USER} GITHUB_PASS=${GITHUB_PASS} make ada

.PHONY: ADA-deploy
ADA-deploy:
	@$$(aws ecr get-login --no-include-email --region $(REGION))
	@docker tag $(ADA_IMAGE) $(ADA_REPO_IMAGE)
	@docker push $(ADA_REPO_IMAGE)

.PHONY: ADA-init
ADA-init: ADA-image ADA-deploy
	@aws --region $(REGION) cloudformation create-stack \
		--stack-name $(ADA_STACK_NAME) \
		--template-body file://ada.yaml \
		--parameters \
			ParameterKey=ChainType,ParameterValue="ADA" \
			ParameterKey=Image,ParameterValue=$(ADA_REPO_IMAGE) \
			ParameterKey=SSLCertificate,ParameterValue=$(REGION_SSL) \
			ParameterKey=IsProdConditon,ParameterValue="$(IS_PROD)" \
			ParameterKey=VolumeSize,ParameterValue="20" \
			ParameterKey=NeedsSnapshot,ParameterValue="$(NEEDS_SNAPSHOT)" \
			ParameterKey=ScriptBucket,ParameterValue="$(USER_DATA_BUCKET)" \
			ParameterKey=ScriptKey,ParameterValue="$(USER_DATA_SCRIPT)" \
			ParameterKey=NumTasksNInstances,ParameterValue="$(NUM_TASKS_N_INSTANCES)" \
		--capabilities CAPABILITY_IAM
