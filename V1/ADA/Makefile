##############
#### VARS ####
##############

DOMAIN = coinquery
COMMIT = $$(git rev-parse --short HEAD)
PWD = $$(pwd)

ADA_CONTAINER = ada
ADA_HOME = /cardano-sl
ADA_BUILD_CONTAINER = ada-build-container
ADA_IMAGE = $(DOMAIN)/$(ADA_CONTAINER):dev
ADA_IMAGE_BUILDER = $(DOMAIN)/$(ADA_BUILD_CONTAINER):dev
ADA_WORKDIR = /home/cqdev/
SHARED_VOLUME = shared_volume

ADA = docker run --rm \
   -p 8000:8000 \
   --name $(ADA_CONTAINER) \
   $(ADA_IMAGE)

ADA_DEV = docker run -it --rm \
   -p 8000:8000 \
   -v $(PWD)/$(SHARED_VOLUME):$(ADA_HOME)/$(SHARED_VOLUME) \
   --name $(ADA_CONTAINER) \
   $(ADA_IMAGE)

ADA_RUN_BUILDER = docker run -it --rm \
	  -v $(PWD)/$(SHARED_VOLUME):$(ADA_HOME)/$(SHARED_VOLUME) \
	  $(ADA_IMAGE_BUILDER)

#################################z
#### ADA BUILD COMMANDS #####
#################################

.PHONY: base
.PHONY: base
base:
	docker build -t $(ADA_IMAGE_BUILDER) -f Dockerfile.build .

.PHONY: build
build:
	$(ADA_RUN_BUILDER) ./copy.sh

.PHONY: load
load:
	@docker load --input $(PWD)/$(SHARED_VOLUME)/docker-image.tar.gz

.PHONY: ada
ada: base build load
	@docker build --build-arg COMMIT=$(COMMIT) -t $(ADA_IMAGE) -f Dockerfile.ada .

.PHONY: run
run:
	@$(ADA)

# Open shell on already running test container
.PHONY: shell-attach
shell-attach:
	@docker exec --workdir $(ADA_WORKDIR) -it $(ADA_IMAGE) sh

.PHONY: shell
shell:
	@$(ADA_DEV) sh
