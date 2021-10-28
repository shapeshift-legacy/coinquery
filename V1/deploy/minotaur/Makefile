##############
#### VARS ####
##############

DOMAIN = coinquery
COMMIT = $$(git rev-parse --short HEAD)

MINO_CONTAINER = minotaur
MINO_IMAGE = $(DOMAIN)/$(MINO_CONTAINER):dev
MINO_WORKDIR = /home/cqdev/

MINO = docker run --rm \
	--env MINOTAUR_RPC_SERVER=${GETH_SERVER} \
	--env MINOTAUR_HOST=${MINOTAUR_HOST} \
	--env MINOTAUR_DB_NAME=${MINOTAUR_DB_NAME} \
	--env MINOTAUR_USERNAME=${MINOTAUR_USERNAME} \
	--env MINOTAUR_PASSWORD=${MINOTAUR_PASSWORD} \
   --name $(MINO_CONTAINER) \
   $(MINO_IMAGE)

MINO_DEV = docker run -it --rm \
	--env MINOTAUR_RPC_SERVER=${GETH_SERVER} \
	--env MINOTAUR_HOST=${MINOTAUR_HOST} \
	--env MINOTAUR_DB_NAME=${MINOTAUR_DB_NAME} \
	--env QUERY_MINOTAUR_USERNAME=${MINOTAUR_USERNAME} \
	--env MINOTAUR_PASSWORD=${MINOTAUR_PASSWORD} \
   --name $(MINO_CONTAINER) \
   $(MINO_IMAGE)

#####################################
##### MINOTAUR BUILD COMMANDS #######
#####################################

# Initializes the database schema.  Only needs to be done once on database creation
.PHONY: init
init:
	psql -f ./ethereum-explorer-db.sql postgres://$(MINOTAUR_USERNAME):$(MINOTAUR_PASSWORD)@$(MINOTAUR_HOST)/$(MINOTAUR_DB_NAME)

.PHONY: minotaur
minotaur:
	docker build \
        --build-arg COMMIT=$(COMMIT) \
        --build-arg GITLAB_USERNAME=$(GITLAB_USERNAME) \
        --build-arg GITLAB_PASSWORD=$(GITLAB_PASSWORD) \
        -t $(MINO_IMAGE) \
        -f Dockerfile .

.PHONY: run
run:
	$(MINO)

# Open shell on already running test container
.PHONY: shell-attach
shell-attach:
	docker exec --workdir $(MINO_WORKDIR) -it $(MINO_CONTAINER) bash

.PHONY: shell
shell:
	$(MINO_DEV) bash
