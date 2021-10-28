## Health Check API
Golang implementation of a health-check api. The purpose of this repository is to sit along side a node/insight container and compare the nodes block header count to insights blocks. The API either returns a 200 if blockHeader = insights blocks or a 202 for anything else. This will allow us to point our target-group health check at this end point and know if a node is ready to serve requests or not.

## Requirements
* Golang installed [Download here](https://golang.org/dl/)
  * make sure you have set GOPATH environment variable correctly and this project is in the correct workspace. Check [here](https://golang.org/doc/code.html) under workspaces and GOPATH environment variable to learn more about this.
* make sure you have [deps](https://github.com/golang/dep) installed `$ go get -u github.com/golang/dep/cmd/dep` . This is a golang dependency management tool
* docker if you are wanting to use the containerized version of this

## Project layout
TODO

## Building and running
1. make sure you have downloaded all dependencies with deps `$ dep ensure`
2. make sure you have a docker network called my-net created `$ docker network create my-net`
3. run `make dash-all` to build binary and create docker image
4. run `make dash-docker-container` to run the image as a container
  * if you want to test this against a node make sure to start the node container first with `--network my-net` flag
  * also, you can configure connection information inside of cmd/{cointype}-health-check/connection.env if you have custom settings on your node
5. after this you should be able to test against localhost. This API has 1 endpoint currently /healthcheck. `http://localhost:3000/healthcheck`
