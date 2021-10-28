#!/usr/bin/env bash

### overwrite these b4 COIN stack deployment
### ----------------------------------------

export AWS_ACCESS_KEY_ID= # can delete if you have aws.config setup
export AWS_SECRET_ACCESS_KEY= # can delete if you have aws.config setup
export REGION=us-east-1
export STACK_COUNT=001
export NUM_TASKS_N_INSTANCES=2
export NEEDS_SNAPSHOT=false
export IS_PROD=true

