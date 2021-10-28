# network

Core networking components for CoinQuery node deployments.

This CloudFormation (CFN) template defines a core VPC and subnets to host EC2 instances
running full node daemons. The VPC provides a private software defined networking stack
full node deployments can register firewall rules with to limit networking access
over a range of ports.

**The components in this repository are core components for the full node deployments. Attempts
to remove this stack from AWS while other deployments depend on it will fail, as expected.**

## Deployment

The components for this system are defined via an AWS CloudFormation template. Deployments to AWS are
made through the AWS CLI tool, utilizing the CFN API.

As per the agreement of the CoinQuery team, production deployments are made to the `us-west-1` region,
while development/staging deployments are made to the `us-west-2` region.

### Initialization

This step should only have to be run once when spinning up a new CoinQuery stack in a new AWS region.

```
$ make init
```

This will initialize the CloudFormation stack in the target region. After this step is complete,
it is expected that subsequent attempts will fail due to the stack already existing in the target region.

### Staging and Production Deployments

Regular deployments to the dev/prod regions can be made via

```
$ make deploy
```

This is will kick off a request to CloudFormation, and the deployment status can be
monitored on the CloudFormation dashboard.


### DRAFT -- Bastion Server -- DRAFT

 - how to deploy
make bastion-update REGION={region}

- uses elastic IPs
- deploys security group
- only access ec2 via bastion
 - how to update bastion server