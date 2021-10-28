##############
#### VARS ####
##############

DOMAIN = coinquery
COMMIT = $$(git rev-parse --short HEAD)

BTG_INSIGHT_CONTAINER = btg-insight
BTG_INSIGHT_IMAGE = $(DOMAIN)/$(BTG_INSIGHT_CONTAINER):dev
BTG_INSIGHT_WORKDIR = /home/cqdev/

BTG_INSIGHT = docker run --rm \
   -p 3001:3001 \
   --name $(BTG_INSIGHT_CONTAINER) \
   --network my-net \
   $(BTG_INSIGHT_IMAGE)

BTG_INSIGHT_DEV = docker run -it --rm \
   -v $(PWD)/shared_volume:$(BTG_INSIGHT_WORKDIR)/shared_volume_host \
   -w $(BTG_INSIGHT_WORKDIR)/mynode \
   -p 3001:3001 \
   --name $(BTG_INSIGHT_CONTAINER) \
   --network my-net \
   $(BTG_INSIGHT_IMAGE)

#####################################
#### BTG_INSIGHT BUILD COMMANDS #####
#####################################

### NOTE:
### requires access to github.com/shapeshift-legacy/BTCGPU repo
clone:
	git clone git@github.com:shapeshift-legacy/BTCGPU.git bitcoin-gold

.PHONY: btg
btg: clone
	@docker build --build-arg COMMIT=$(COMMIT) -t $(BTG_INSIGHT_IMAGE) -f Dockerfile.btg .

.PHONY: run
run:
	@$(BTG_INSIGHT)

# Open shell on already running test container
.PHONY: shell-attach
shell-attach:
	@docker exec --workdir $(BTG_INSIGHT_WORKDIR) -it $(BTG_INSIGHT_CONTAINER) bash

.PHONY: shell
shell:
	@$(BTG_INSIGHT_DEV) bash
