## Snappy

- Periodically snapshot the volume of a given snapshot cluster.
- Provides an endpoint for retrieving the latest shapshot of a given chain-type.

### Logs 
[Example logs](https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#) for region `us-east-1`

* Errors reported: 
  - If instance is more than 20 blocks behind reference service
  - If instance invalid response  
  - If `stackCount` not set

### Deploy - Serverless CLI
1. Install Serverless Framework: 
https://serverless.com/ 

2. Set environment variables:  
`export AWS_ACCESS_KEY_ID={id}`  
`export AWS_SECRET_ACCESS_KEY={secret}`  
`export AWS_REGION={region}`  

### Linting
- `npm run linter [file]` to check errors
- `npm run linter [file] --fix` to fix any that can be auto-fixed

### make targets: 
* `make deploy` - deploy new stack to AWS 
* `make deploy function` - deploy `snapshot` function to existing stack 
* `make invoke` - invoke the `snapshot` once (typically for dev/debug) 
* `make log` - tail the logs 