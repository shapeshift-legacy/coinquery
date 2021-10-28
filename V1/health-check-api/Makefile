########################## BSV  ##########################
BSV_PATH=./cmd/bsv-health-check
DOMAIN=coinquery
BSV_HEALTH_IMAGE=$(DOMAIN)/bsv-health-check

.PHONY: bsv-all
bsv-all: bsv-binary bsv-docker

.PHONY: bsv-binary
bsv-binary:
	cd $(BSV_PATH) && \
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

.PHONY: bsv-docker-image
bsv-docker:
	cd $(BSV_PATH) && \
	docker build -t $(BSV_HEALTH_IMAGE) .

.PHONY: bsv-docker-container
bsv-docker-container:
	docker run -p 3000:3000 --network my-net --env-file=$(BSV_PATH)/connection.env $(BSV_HEALTH_IMAGE)

########################## DASH  ##########################
DASH_PATH=./cmd/dash-health-check
DOMAIN=coinquery
DASH_HEALTH_IMAGE=$(DOMAIN)/dash-health-check

.PHONY: dash-all
dash-all: dash-binary dash-docker

.PHONY: dash-binary
dash-binary:
	cd $(DASH_PATH) && \
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

.PHONY: dash-docker-image
dash-docker:
	cd $(DASH_PATH) && \
	docker build -t $(DASH_HEALTH_IMAGE) .

.PHONY: dash-docker-container
dash-docker-container:
	docker run -p 3000:3000 --network my-net --env-file=$(DASH_PATH)/connection.env $(DASH_HEALTH_IMAGE)

########################## BTG  ##########################
BTG_PATH=./cmd/btg-health-check
DOMAIN=coinquery
BTG_HEALTH_IMAGE=$(DOMAIN)/btg-health-check

.PHONY: btg-all
btg-all: btg-binary btg-docker

.PHONY: btg-binary
btg-binary:
	cd $(BTG_PATH) && \
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

.PHONY: btg-docker-image
btg-docker:
	cd $(BTG_PATH) && \
	docker build -t $(BTG_HEALTH_IMAGE) .

.PHONY: btg-docker-container
btg-docker-container:
	docker run -p 3000:3000 --network my-net --env-file=$(BTG_PATH)/connection.env $(BTG_HEALTH_IMAGE)

########################## DOGE ##########################
DOGE_PATH=./cmd/doge-health-check
DOMAIN=coinquery
DOGE_HEALTH_IMAGE=$(DOMAIN)/doge-health-check

.PHONY: doge-all
doge-all: doge-binary doge-docker

.PHONY: doge-binary
doge-binary:
	cd $(DOGE_PATH) && \
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

.PHONY: doge-docker-image
doge-docker:
	cd $(DOGE_PATH) && \
	docker build -t $(DOGE_HEALTH_IMAGE) .

.PHONY: doge-docker-container
doge-docker-container:
	docker run -p 3000:3000 --network my-net --env-file=$(DOGE_PATH)/connection.env $(DOGE_HEALTH_IMAGE)

########################## ETH ##########################
ETH_PATH=./cmd/eth-health-check
DOMAIN=coinquery
ETH_HEALTH_IMAGE=$(DOMAIN)/eth-health-check

.PHONY: eth-all
eth-all: eth-binary eth-docker

.PHONY: eth-binary
eth-binary:
	cd $(ETH_PATH) && \
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

.PHONY: eth-docker
eth-docker:
	cd $(ETH_PATH) && \
	docker build -t $(ETH_HEALTH_IMAGE) .

.PHONY: eth-docker-container
eth-docker-container:
	docker run -p 3000:3000 --network proxy-net --env-file=$(ETH_PATH)/connection.env $(ETH_HEALTH_IMAGE)

########################## ZEC  ##########################
ZEC_PATH=./cmd/zec-health-check
DOMAIN=coinquery
ZEC_HEALTH_IMAGE=$(DOMAIN)/zec-health-check

.PHONY: zec-all
zec-all: zec-binary zec-docker

.PHONY: zec-binary
zec-binary:
	cd $(ZEC_PATH) && \
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

.PHONY: zec-docker-image
zec-docker:
	cd $(ZEC_PATH) && \
	docker build -t $(ZEC_HEALTH_IMAGE) .

.PHONY: zec-docker-container
zec-docker-container:
	docker run -p 3000:3000 --network my-net --env-file=$(ZEC_PATH)/connection.env $(ZEC_HEALTH_IMAGE)
