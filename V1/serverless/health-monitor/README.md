# Health Monitor 
Periodically checks CoinQuery instances in a region and logs an error if health is compromised.

## Warnings

  - Instance not in state "running" (i.e. terminated, stopped)  
  - Invalid response from reference service 
  
## Errors 
 
  - Instance is more than `deltaBlocks` blocks behind reference service  
  - Invalid response from instance  

Incident reported to [OpsGenie](https://app.opsgenie.com/alert#/alert-genie) when an error is detected.  Team notifications per OpsGenie escalation policy settings which may include text messages, emails, OpsGenie mobile app.

| Coin  | Stacks Monitored | OpsGenie Incident  Key  | `deltaBlocks`    | Block Time | Reference Service                   |
|-------|------------------|-------------------------|------------------|------------|-------------------------------------|
| ZEC   | `*zec*`          | 1044                    | 2                | 2.5 min    | https://zcash.blockexplorer.com/api |
| DASH  | `*dash*`         | 1045                    | 8                | 2.5 min    | https://insight.dash.org/api        |
| BTG   | `*btg*`          | 1046                    | 4                | 10 min     | https://btgexplorer.com/api         |
| DOGE  | `*doge*`         | 1049                    | 20               | 1 min      | https://api.blockcypher.com         |

### Coins using Insight API (DASH, BTG, DOGE)
- Queries `/sync` endpoint once per minute.  Monitors clusters with names matching the string `*{coin}*`, for example `cq-bch-0016-prod-instance`.

## Deployment (HMON CLI) -- Recommended Method
1. Run `npm i` to install package dependencies

2. Rename `serverless-env-sample.sh` to `serverless-env.sh` and edit local environment variables.  
`export AWS_ACCESS_KEY_ID='id'`  
`export AWS_SECRET_ACCESS_KEY='secret'`  
`export AWS_REGION='region'` *AWS REGION FOR DEPLOYMENT*  
`export AWS_MONITOR_REGION='region:region'` *AWS REGION TO MONITOR HEALTH OF COIN INSTANCES. CAN SEPARATE MULTIPLE REGIONS WITH ':'*  
`export OPS_GENIE_API_KEY='api_key'` *get from [OpsGenie](https://app.opsgenie.com/teams/dashboard/009bd267-a55c-481e-af8c-0f08c3603b8e#/integrations)*  
`export OPS_GENIE_ENABLE={bool: true or false}`  

3. `source serverless-env.sh`

4. Interact with and deploy functions with hmon
`hmon --help` to view available commands

## Deployment (AWS Console) 

1. Go to [CodeBuild](https://console.aws.amazon.com/codebuild) for the appropriate region:

2. Run existing project -OR- create a new one

3. Create new project 
  * Project name: `health-monitor-deploy`
  * Source: 
    - Source provider: Github
    - Repository: https://github.com/shapeshift-legacy/coinquery.git
    - Path: coinquery/serverless/
  * Environment: 
    - Environment image: managed by AWS
    - OS: Ubuntu
    - Runtime: Node.js
    - Runtime version: nodejs
    - Buildspec: buildspec.yml (default)
  * Artifacts: 
    - Type: No artifacts
    - Cache: No Cache
  * Service role: 
    - Choose existing service role(`codebuild-health-monitor-deploy-service-role`)
  * VPC: 
    - No VPC
  * Advanced Settings:
    - Environment Variables:
      * Create in the IAM console or copy from another region (such as `us-east-1`)
        * `AWS_ACCESS_KEY_ID` - serverless user key id
        * `AWS_SECRET_ACCESS_KEY` - serverless user key
        * `AWS_REGION` - set by default
        * `AWS_MONITOR_REGION` - specify which region to monitor coin instances
        * `OPS_GENIE_API_KEY` - get from [OpsGenie](https://app.opsgenie.com/teams/dashboard/009bd267-a55c-481e-af8c-0f08c3603b8e#/integrations)
        * `OPS_GENIE_ENABLE` - bool: true or false

4.  Save and Build

### Mitigation 
Future work - remove unhealthy instance from active pool

### Errata
- Reports errors on instances that are initializing but not yet ready (e.g. a new stack deployment) 

### Testing
- Block number behind error 
- Invalid response error (coinquery instance)
  - Terminated instance
  - Initializing instance
- Invalid response error (reference service)
 
## Example Log messages 
 
### Normal 

``` 
2018-05-29 22:15:21.340 (-06:00)	1171a057-63c0-11e8-825f-8b3de37e0166	Health check of CoinQuery Bitcoin Gold instances in region: ap-northeast-1, with stack name: *btg*
2018-05-29 22:15:21.467 (-06:00)	1171a057-63c0-11e8-825f-8b3de37e0166	--------------------------------------------------------------------
2018-05-29 22:15:21.467 (-06:00)	1171a057-63c0-11e8-825f-8b3de37e0166	Instance ID: i-05c90f320edbb5cdc
2018-05-29 22:15:21.467 (-06:00)	1171a057-63c0-11e8-825f-8b3de37e0166	Instance Name: cq-btg-prod-900-instance
2018-05-29 22:15:22.292 (-06:00)	1171a057-63c0-11e8-825f-8b3de37e0166	BlockNumber (CoinQuery instance): 530841
2018-05-29 22:15:22.292 (-06:00)	1171a057-63c0-11e8-825f-8b3de37e0166	BlockNumber (https://btgexplorer.com/): 530841
2018-05-29 22:15:22.292 (-06:00)	1171a057-63c0-11e8-825f-8b3de37e0166	BlockNumber is within expected range of https://btgexplorer.com/
2018-05-29 22:15:22.293 (-06:00)	1171a057-63c0-11e8-825f-8b3de37e0166	--------------------------------------------------------------------
2018-05-29 22:15:22.293 (-06:00)	1171a057-63c0-11e8-825f-8b3de37e0166	Instance ID: i-0380b0bee23f1cad5
2018-05-29 22:15:22.293 (-06:00)	1171a057-63c0-11e8-825f-8b3de37e0166	Instance Name: cq-btg-prod-900-instance
2018-05-29 22:15:23.081 (-06:00)	1171a057-63c0-11e8-825f-8b3de37e0166	BlockNumber (CoinQuery instance): 530841
2018-05-29 22:15:23.081 (-06:00)	1171a057-63c0-11e8-825f-8b3de37e0166	BlockNumber (https://btgexplorer.com/): 530841
2018-05-29 22:15:23.081 (-06:00)	1171a057-63c0-11e8-825f-8b3de37e0166	BlockNumber is within expected range of https://btgexplorer.com/
2018-05-29 22:15:23.081 (-06:00)	1171a057-63c0-11e8-825f-8b3de37e0166	--------------------------------------------------------------------
2018-05-29 22:15:23.081 (-06:00)	1171a057-63c0-11e8-825f-8b3de37e0166	Instance ID: i-0930f61c1d95d2a69
2018-05-29 22:15:23.081 (-06:00)	1171a057-63c0-11e8-825f-8b3de37e0166	Instance Name: cq-btg-prod-900-snapshot-instance
2018-05-29 22:15:23.081 (-06:00)	1171a057-63c0-11e8-825f-8b3de37e0166	Snapshot node - not checking blocknumber
``` 
 
### Invalid response error 
 
``` 
Health check of CoinQuery Bitcoin Gold instances in region: ap-northeast-1, with stack name: *btg*
--------------------------------------------------------------------
Instance ID: i-05c90f320edbb5cdc
Instance Name: cq-btg-prod-900-instance
ERROR: Invalid response from endpoint http://redacted.example.com:3001/api/sync:
 Error: connect ECONNREFUSED redacted.example.com:3001
OpsGenie alerts disabled.  Set environment variable OPS_GENIE_ENABLE to "true" to enable
--------------------------------------------------------------------
``` 
 
### Block Number error 

``` 
2018-05-24 16:47:31.296 (-06:00)	71242774-5fa4-11e8-9b1c-1f5b54a17c65	Health check of CoinQuery DASH instances in region: ca-central-1, with stack name: *dash*
2018-05-24 16:47:31.770 (-06:00)	71242774-5fa4-11e8-9b1c-1f5b54a17c65	--------------------------------------------------------------------
2018-05-24 16:47:31.770 (-06:00)	71242774-5fa4-11e8-9b1c-1f5b54a17c65	Instance ID: i-06b15e7dd212836e8
2018-05-24 16:47:31.770 (-06:00)	71242774-5fa4-11e8-9b1c-1f5b54a17c65	Instance Name: cq-dash-p0000-prod-snapshot-instance
2018-05-24 16:47:32.565 (-06:00)	71242774-5fa4-11e8-9b1c-1f5b54a17c65	BlockNumber (CoinQuery instance): 874850
2018-05-24 16:47:32.565 (-06:00)	71242774-5fa4-11e8-9b1c-1f5b54a17c65	BlockNumber (https://insight.dash.org/): 875555
2018-05-24 16:47:32.565 (-06:00)	71242774-5fa4-11e8-9b1c-1f5b54a17c65	ERROR: CQ BlockNumber is 705 behind https://insight.dash.org/
2018-05-24 16:47:32.565 (-06:00)	71242774-5fa4-11e8-9b1c-1f5b54a17c65	ERROR: CQ BlockNumber is 705 behind https://insight.dash.org/
2018-05-24 16:47:34.715 (-06:00)	71242774-5fa4-11e8-9b1c-1f5b54a17c65	OpsGenie alert created, incident key: 1045
2018-05-24 16:47:34.715 (-06:00)	71242774-5fa4-11e8-9b1c-1f5b54a17c65	--------------------------------------------------------------------
``` 

### Other Services
Application Load Balancer checks the `/health` endpoint (Ethereum) or `/status` endpoint (coins using Insight API).  If it doesn't receive 200 responses, it stops sending traffic to the instance.  If this persists, the Auto-Scaling kills the instance and starts another.

### References
[Serverless framework](https://serverless.com/framework/docs/providers/aws/guide/intro/)  
[AWS Lambda functions](https://aws.amazon.com/documentation/lambda/)  
[OpsGenie API](https://docs.opsgenie.com/docs/opsgenie-nodejs-api)
