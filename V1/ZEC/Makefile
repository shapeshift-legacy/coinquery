##############
#### VARS ####
##############

DOMAIN = coinquery
COMMIT = $$(git rev-parse --short HEAD)

CONTAINER = zec-insight
IMAGE = $(DOMAIN)/$(CONTAINER):dev
WORKDIR = /home/zcash

RUN = docker run --rm \
   -p 3001:3001 \
   --name $(CONTAINER) \
   --network my-net \
   $(IMAGE)

RUN_DEV = docker run -it --rm \
   -p 3001:3001 \
   -w $(WORKDIR) \
   --name $(CONTAINER) \
   --network my-net
   $(IMAGE)

#############################
#### ZEC BUILD COMMANDS #####
#############################

.PHONY: zec
zec:
	docker build --build-arg COMMIT=$(COMMIT) -t $(IMAGE) -f Dockerfile.zec .

.PHONY: run
run:
	-docker network create my-net
	$(RUN)

.PHONY: shell
shell:
	$(RUN_DEV) bash

.PHONY: shell-attach
shell-attach:
	docker exec -it $(CONTAINER) bash

.PHONY: kill
kill:
	-docker rm $$(docker ps -a --filter "ancestor=coinquery/zcash:dev" -q)
