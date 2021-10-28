##############
#### VARS ####
##############

DOMAIN = coinquery
COMMIT = $$(git rev-parse --short HEAD)

DOGE_ABE_CONTAINER = doge-insight
DOGE_ABE_IMAGE = $(DOMAIN)/$(DOGE_ABE_CONTAINER):dev
DOGE_ABE_WORKDIR = /home/cqdev

DOGE_ABE = docker run --rm \
   -p 3001:3001 \
   -p 8332:8332 \
   --volume doge-abe-blockchain-data:/home/cqdev/.bitcoin \
   --network my-net \
   --name $(DOGE_ABE_CONTAINER) \
   $(DOGE_ABE_IMAGE)

DOGE_ABE_DEV = docker run -it --rm \
   -v $(PWD)/shared_volume:$(DOGE_ABE_WORKDIR)/shared_volume_host \
   -w $(DOGE_ABE_WORKDIR) \
   -p 3001:3001 \
   --name $(DOGE_ABE_CONTAINER) \
   $(DOGE_ABE_IMAGE)

#####################################
#### DOGE_ABE BUILD COMMANDS #####
#####################################

.PHONY: doge
doge:
	docker build --build-arg COMMIT=$(COMMIT) -t $(DOGE_ABE_IMAGE) -f Dockerfile.doge .

.PHONY: run
run:
	$(DOGE_ABE)

# Open shell on already running test container
.PHONY: shell-attach
shell-attach:
	docker exec --workdir $(DOGE_ABE_WORKDIR) -it $(DOGE_ABE_CONTAINER) bash

.PHONY: shell
shell:
	$(DOGE_ABE_DEV) bash
