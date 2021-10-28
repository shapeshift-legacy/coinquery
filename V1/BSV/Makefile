##############
#### VARS ####
##############

DOMAIN = coinquery
COMMIT = $$(git rev-parse --short HEAD)

BSV_INSIGHT_CONTAINER = bsv-insight
BSV_INSIGHT_IMAGE = $(DOMAIN)/$(BSV_INSIGHT_CONTAINER):dev
BSV_INSIGHT_WORKDIR = /home/cqdev/

BSV_INSIGHT = docker run --rm \
   -p 3001:3001 \
   --name $(BSV_INSIGHT_CONTAINER) \
	 --network my-net \
   $(BSV_INSIGHT_IMAGE)

BSV_INSIGHT_DEV = docker run -it --rm \
   -v $(PWD)/shared_volume:$(BSV_INSIGHT_WORKDIR)/shared_volume_host \
   -w $(BSV_INSIGHT_WORKDIR)/mynode \
   -p 3001:3001 \
   --name $(BSV_INSIGHT_CONTAINER) \
   $(BSV_INSIGHT_IMAGE)

#################################
#### BSV_INSIGHT BUILD COMMANDS #####
#################################

.PHONY: bsv
bsv:
	@docker build --build-arg COMMIT=$(COMMIT) -t $(BSV_INSIGHT_IMAGE) -f Dockerfile .

.PHONY: run
run:
	@$(BSV_INSIGHT)

# Open shell on already running test container
.PHONY: shell-attach
shell-attach:
	@docker exec --workdir $(BSV_INSIGHT_WORKDIR) -it $(BSV_INSIGHT_CONTAINER) bash

.PHONY: shell
shell:
	@$(BSV_INSIGHT_DEV) bash
