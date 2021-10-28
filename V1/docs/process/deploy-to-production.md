# Process: Deploy to production

## Purpose of this doc
* Create a standard process for deployment of production stacks
* Easily identify production servers in event of a service issue.
* Protect production stack from accidental teardown 


## Deployment process
(Examples below use `ethereum`, `us-east-1`)
 
1. Create a [release](https://github.com/shapeshift-legacy/coinquery/releases)
of the service being deployed   

2. Deploy the stack using the deployment instructions [here](https://github.com/shapeshift-legacy/coinquery/blob/master/deploy/README.md)

4. Ensure that the [health monitor](https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions)
logs status of the new EC2 instances in cloudwatch: [example](https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logStream:group=/aws/lambda/ethsync-dev-ethsync)  

5. Enable termination protection on production stack.  Ex. Right click on stack [here](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks?filter=active)

6. Update the DNS record to point to the new stack
  * public url: [eth.redacted.example.com](https://eth.redacted.example.com)
  * private url (example): [<redacted>.eu-west-1.elb.amazonaws.com](<redacted>.eu-west-1.elb.amazonaws.com)  

### Notifications
Team is notified via slack message in a dedicated channel when:  
1. New release is made  
2. New production stack is deployed

### AWS Regions
Team may use different regions for production and staging but the architecture supports deploying to any region and eventually we expect to have services for a single coin deployed in multiple regions.  

Having duplicate services deployed in multiple regions mitigates AWS datacenter downtime in a given region. [Example](https://www.recode.net/2017/3/2/14792636/amazon-aws-internet-outage-cause-human-error-incorrect-command)


## Stack Naming
### `{serviceType}`-`{coin}`-`{stackNumber}`-`{deployLevel}`

### Examples
* `cq-eth-0001-prod ` : Ethereum production stack `0001`
* `cq-eth-0001-stage` : Ethereum staging stack `0001`
* `cq-eth-0001-dev  ` : Ethereum developer stack `0001`

### Details
* `serviceType`: 
  * always `cq`  
* `coin`: 
  * use ticker from Shapeshift [CoinCap](http://coincap.io/coins)
  * ex: `eth, bch, dash, zec`
* `stackNumber`: four digits
  * range: `0001` - `9999`
* `deployLevel`:  
  * ex: `prod, stage, dev, test`  
  
NOTE: Stack names limited to 32 characters by AWS. 

## Health monitoring
Health monitor only checks stacks/instances containing `prod` in the name

## Revision control
* Production code always deploys from the master branch, i.e.
[https://github.com/shapeshift-legacy/coinquery/tree/master](https://github.com/shapeshift-legacy/coinquery/tree/master)

* Deployed code is identified via the `commitHash` field in the `/info` endpoint 

## Definitions
**Stack** - A stack is a collection of AWS resources that you can manage as a single unit. In other words, you can create, update, or delete a collection of resources by creating, updating, or deleting stacks. All the resources in a stack are defined by the stack's AWS CloudFormation template

**Cluster** - An Amazon ECS cluster is a logical grouping of tasks or services. If you are running tasks or services that use the EC2 launch type, a cluster is also a grouping of container instances.  

**Pipeline** - AWS CodePipeline is a continuous integration and continuous delivery service for fast and reliable application and infrastructure updates. CodePipeline builds, tests, and deploys your code every time there is a code change, based on the release process models you define. 
