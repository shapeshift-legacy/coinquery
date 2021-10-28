# build & deploy

This project specifies the components necessary to run blockchain full nodes. A blockchain node is
deployed as a docker container alongside a proxy container. The container orchestration (setup/teardown) is controlled
by AWS ECS, running on top of a cluster of EC2 instances inside of a VPC (defined in the [network](https://github.com/shapeshift-legacy/coinquery/tree/master/network) stack)

Access to the full node is done via the proxy service, which is load-balanced using an AWS ALB (application load balancer).

More information on the proxy service and how to build/deploy it can be found in the [./proxy](proxy) directory.

## Enviornments

* Production `us-east-1` -Stack `coinquery-eth-001`
* Development `us-west-2`
* Stress Testing `ap-northeast-1`


## Prerequisites 
- aws-cli
- golang > 1.10
- node.js > 8

## Setup

1. The CloudFormation stack can be initialized in a new region via the `make init` command. This has already been done
for the production and staging clusters. The target region can be updated in the `init` command if a new stack
needs to be provisioned in a new region.

2. Prior to building the different coin stacks make sure to clone the `health-check-api` project in order to build the different docker images for each of the coins stacks.
-  `cd `echo $(go env GOPATH)` && git clone https://github.com/shapeshift-legacy/health-check-api && make all`


## UserData
- If you need to update `userdata.sh` be sure to push up to s3 before running a deploy so that it grabs the updated script. The bucket is `all-userdata-scripts/userdata.sh`.

# Deployment
0. Clone the network repo and run `$ make init REGION=<new-region>`
1. Create a Key Pair called `cq-aws-ssh` in AWS for given region under (EC2 > NETWORK & SECURITY > Key Pairs > Create Key Pair)
2. [Create repository for Elastic Cointainer Registry](https://us-west-2.console.aws.amazon.com/ecs/home?region=us-west-2#/repositories/create/new)
3. Run `$ make params` as follows:

	```
	
		AWS_ACCESS_KEY_ID=<redacted> \
		    
		AWS_SECRET_ACCESS_KEY=<redacted> \
		    
		make params \
		    
		STACK_COUNT=000 \
		    
		REGION=ap-northeast-1 \
		    
		ECS_REPO_URI=<redacted>.dkr.ecr.ap-northeast-1.amazonaws.com \
		    
		REGION_SSL=arn:aws:acm:sa-east-1:<redacted>:certificate/<redacted> \
		    
		GIT_USER=<redacted> \
		    
		GIT_PASS=<redacted>
		    
	```
4. [Create a certificate in certificate manager for a given region](https://us-west-2.console.aws.amazon.com/acm/home?region=us-west-2#/wizard/) make sure you specify the domain name that this will be given. Your domain owner must verify this SSL cert either by email, or adding a new CNAME that amazon specifies
5. `$ cp ./env-sample.sh ./env.sh`
6. Overwrite default parameters in `./deploy.sh`
7. `$ deploy.sh`

## Domain and SSL

0. create a cname from your domain provider of choice to the loadbalancer DNS endpoint.  After the stack deploys, this can be found under `load balancers` in the ec2 menu
1. make sure the SSL cert created in the previous step points at this same domain name
