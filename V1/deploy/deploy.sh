#!/bin/bash

### Code (re)generated by go generate; DO NOT EDIT BY HAND;
### ------------------------------------------------------;
### Fri Jun  1 09:54:19 MDT 2018

source ./env.sh

######################## MAKEFILE PARAMETERS #######################
REGION=${REGION} # example) us-east-1
ECS_REPO_URI=<redacted>.dkr.ecr.$REGION.amazonaws.com
STACK_COUNT=${STACK_COUNT} # example) 9 (any integer will work)
NUM_TASKS_N_INSTANCES=${NUM_TASKS_N_INSTANCES} # for if IS_PROD == true, otherwise it overwrites this to 1 in makefile
NEEDS_SNAPSHOT=${NEEDS_SNAPSHOT}
IS_PROD=${IS_PROD}

# Minotaur - CoinQuery database - ETH transactions
MINOTAUR_USERNAME=cqdev
MINOTAUR_PASSWORD=
MINOTAUR_HOST=eth-db-stage.redacted.example.com
MINOTAUR_DB_NAME=eth_blocks
MINOTAUR_RPC_SERVER=http://redacted.example.com:8545

# Gitlab credentials to clone Minotaur from IBN repository
GITLAB_USERNAME=
GITLAB_PASSWORD=
####################################################################

case "$REGION" in
    (us-east-1)
        REGION_SSL=arn:aws:acm:us-east-1:<redacted>:certificate/<redacted>
        ;;
    (us-west-1)
        REGION_SSL=arn:aws:acm:us-west-1:<redacted>:certificate/<redacted>
        ;;
    (us-west-2)
        REGION_SSL=arn:aws:acm:us-west-2:<redacted>:certificate/<redacted>
        ;;
    (ap-northeast-1)
        REGION_SSL=arn:aws:acm:ap-northeast-1:<redacted>:certificate/<redacted>
        ;;
    (eu-west-1)
        REGION_SSL=arn:aws:acm:eu-west-1:<redacted>:certificate/<redacted>
        ;;
    (eu-west-2)
        REGION_SSL=arn:aws:acm:eu-west-2:<redacted>:certificate/<redacted>
        ;;
    (ca-central-1)
        REGION_SSL=arn:aws:acm:ca-central-1:<redacted>:certificate/<redacted>
        ;;
    (*)
        echo "Error: no stored wildcard cert for selected region, check the deploy script"
        exit 0
        ;;
esac

ETH(){
    REGION=$REGION \
    ECS_REPO_URI=$ECS_REPO_URI \
    REGION_SSL=$REGION_SSL \
    STACK_COUNT=$STACK_COUNT \
    IS_PROD=$IS_PROD \
    MINOTAUR_HOST=$MINOTAUR_HOST \
    MINOTAUR_DB_NAME=$MINOTAUR_DB_NAME \
    MINOTAUR_USERNAME=$MINOTAUR_USERNAME \
    MINOTAUR_PASSWORD=$MINOTAUR_PASSWORD \
    NUM_TASKS_N_INSTANCES=$NUM_TASKS_N_INSTANCES \
    NEEDS_SNAPSHOT=$NEEDS_SNAPSHOT \
    CHAIN_TYPE=GETH \
    GCMODE=full \
    VOLUME_SIZE=2000 \
    PROXY_HOST_N_PORT=http://localhost:8000 \
    make GETH-init
}

ETH_GETH_ARCHIVAL(){
    REGION=$REGION \
    ECS_REPO_URI=$ECS_REPO_URI \
    REGION_SSL=$REGION_SSL \
    STACK_COUNT=$STACK_COUNT \
    IS_PROD=$IS_PROD \
    MINOTAUR_HOST=$MINOTAUR_HOST \
    MINOTAUR_DB_NAME=$MINOTAUR_DB_NAME \
    MINOTAUR_USERNAME=$MINOTAUR_USERNAME \
    MINOTAUR_PASSWORD=$MINOTAUR_PASSWORD \
    NUM_TASKS_N_INSTANCES=$NUM_TASKS_N_INSTANCES \
    NEEDS_SNAPSHOT=$NEEDS_SNAPSHOT \
    CHAIN_TYPE=GETH_ARCHIVAL \
    GCMODE=archive \
    VOLUME_SIZE=2000 \
    PROXY_HOST_N_PORT=http://localhost:8000 \
    make GETH-init
}

BSV(){
    RPC_HOST_N_PORT=localhost:8332 \
    RPC_USER=cqdev \
    RPC_PASS=o892t2z8 \
    INSIGHT_HOST_N_PORT=http://localhost:3001 \
    NUM_TASKS_N_INSTANCES=$NUM_TASKS_N_INSTANCES \
    NEEDS_SNAPSHOT=$NEEDS_SNAPSHOT \
    make BSV-init REGION=$REGION ECS_REPO_URI=$ECS_REPO_URI REGION_SSL=$REGION_SSL STACK_COUNT=$STACK_COUNT IS_PROD=$IS_PROD
}

ETHPARITY(){
    NUM_TASKS_N_INSTANCES=$NUM_TASKS_N_INSTANCES \
    NEEDS_SNAPSHOT=$NEEDS_SNAPSHOT \
    make PARITY-init REGION=$REGION ECS_REPO_URI=$ECS_REPO_URI REGION_SSL=$REGION_SSL STACK_COUNT=$STACK_COUNT IS_PROD=$IS_PROD
}

ZEC(){
    RPC_HOST_N_PORT=localhost:8332 \
    RPC_USER=cqdev \
    RPC_PASS=o892t2z8 \
    INSIGHT_HOST_N_PORT=http://localhost:3001 \
    NUM_TASKS_N_INSTANCES=$NUM_TASKS_N_INSTANCES \
    NEEDS_SNAPSHOT=$NEEDS_SNAPSHOT \
    make ZEC-init REGION=$REGION ECS_REPO_URI=$ECS_REPO_URI REGION_SSL=$REGION_SSL STACK_COUNT=$STACK_COUNT IS_PROD=$IS_PROD
}

DASH(){
    RPC_HOST_N_PORT=localhost:8332 \
    RPC_USER=cqdev \
    RPC_PASS=o892t2z8 \
    INSIGHT_HOST_N_PORT=http://localhost:3001 \
    NUM_TASKS_N_INSTANCES=$NUM_TASKS_N_INSTANCES \
    NEEDS_SNAPSHOT=$NEEDS_SNAPSHOT \
    make DASH-init REGION=$REGION ECS_REPO_URI=$ECS_REPO_URI REGION_SSL=$REGION_SSL STACK_COUNT=$STACK_COUNT IS_PROD=$IS_PROD
}

BTG(){
    RPC_HOST_N_PORT=localhost:8332 \
    RPC_USER=cqdev \
    RPC_PASS=o892t2z8 \
    INSIGHT_HOST_N_PORT=http://localhost:3001 \
    NUM_TASKS_N_INSTANCES=$NUM_TASKS_N_INSTANCES \
    NEEDS_SNAPSHOT=$NEEDS_SNAPSHOT \
    make BTG-init REGION=$REGION ECS_REPO_URI=$ECS_REPO_URI REGION_SSL=$REGION_SSL STACK_COUNT=$STACK_COUNT IS_PROD=$IS_PROD
}

DOGE(){
    RPC_HOST_N_PORT=localhost:8332 \
    RPC_USER=cqdev \
    RPC_PASS=o892t2z8 \
    INSIGHT_HOST_N_PORT=http://localhost:3001 \
    NUM_TASKS_N_INSTANCES=$NUM_TASKS_N_INSTANCES \
    NEEDS_SNAPSHOT=$NEEDS_SNAPSHOT \
    make DOGE-init REGION=$REGION ECS_REPO_URI=$ECS_REPO_URI REGION_SSL=$REGION_SSL STACK_COUNT=$STACK_COUNT IS_PROD=$IS_PROD
}

MINOTAUR(){
    make minotaur-init \
    REGION=$REGION \
    ECS_REPO_URI=$ECS_REPO_URI \
    REGION_SSL=$REGION_SSL \
    STACK_COUNT=$STACK_COUNT \
    IS_PROD=$IS_PROD \
    MINOTAUR_HOST=$MINOTAUR_HOST \
    MINOTAUR_DB_NAME=$MINOTAUR_DB_NAME \
    MINOTAUR_USERNAME=$MINOTAUR_USERNAME \
    MINOTAUR_PASSWORD=$MINOTAUR_PASSWORD \
    MINOTAUR_RPC_SERVER=$MINOTAUR_RPC_SERVER \
    GITLAB_USERNAME=$GITLAB_USERNAME \
    GITLAB_PASSWORD=$GITLAB_PASSWORD
}

ADA(){
    RPC_HOST_N_PORT=localhost:8332 \
    RPC_USER=cqdev \
    RPC_PASS=o892t2z8 \
    NUM_TASKS_N_INSTANCES=$NUM_TASKS_N_INSTANCES \
    NEEDS_SNAPSHOT=$NEEDS_SNAPSHOT \
    make ADA-init REGION=$REGION ECS_REPO_URI=$ECS_REPO_URI REGION_SSL=$REGION_SSL STACK_COUNT=$STACK_COUNT IS_PROD=$IS_PROD
}

case "$1" in

    (ETH)
     ETH
    exit 0
    ;;

    (ETH_GETH_ARCHIVAL)
     ETH_GETH_ARCHIVAL
    exit 0
    ;;

    (BSV)
     BSV
    exit 0
    ;;

    (ETHPARITY)
     ETHPARITY
    exit 0
    ;;

    (ZEC)
     ZEC
    exit 0
    ;;

    (DASH)
     DASH
    exit 0
    ;;

    (BTG)
     BTG
    exit 0
    ;;

    (DOGE)
     DOGE
    exit 0
    ;;

    (MINOTAUR)
     MINOTAUR
    exit 0
    ;;

    (ADA)
     ADA
    exit 0
    ;;

    (*)
    echo "Please use deploy.sh <ETH | ETHPARITY | ZEC | BTG | DASH | DOGE | MINOTAUR | ADA >"
    exit 0
    ;;
esac
