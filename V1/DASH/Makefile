##############
#### VARS ####
##############

DOMAIN = coinquery
COMMIT = $$(git rev-parse --short HEAD)

DASH_CONTAINER = dash-insight
DASH_IMAGE = $(DOMAIN)/$(DASH_CONTAINER):dev
DASH_WORKDIR = /home/dash

RUN_DASH = docker run --rm \
   -p 3001:3001 \
   --name $(DASH_CONTAINER) \
   $(DASH_IMAGE)

RUN_DASH_DEV = docker run -it --rm \
   -p 3001:3001 \
   -w $(DASH_WORKDIR) \
   --name $(DASH_CONTAINER) \
   $(DASH_IMAGE)

#############################
#### DASH BUILD COMMANDS #####
#############################

.PHONY: dash
dash:
	docker build --build-arg COMMIT=$(COMMIT) -t $(DASH_IMAGE) -f Dockerfile.dash .

.PHONY: run
run:
	$(RUN_DASH)

.PHONY: shell
shell:
	$(RUN_DASH_DEV) bash

.PHONY: shell-attach
shell-attach:
	docker exec -it $(DASH_CONTAINER) bash

.PHONY: kill
kill:
	-docker rm $$(docker ps -a --filter "ancestor=coinquery/dash:dev" -q)
