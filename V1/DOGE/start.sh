#!/bin/bash
dogecoin_pid=0
insight_pid=0
datadir=/home/cqdev/.blockchain/
cli_get_block_count="dogecoin-cli -datadir=$datadir -rpcuser=cqdev -rpcpassword= getblockcount"
echo "user: $(whoami)"
echo "running revision $COMMIT"

shutdown_delay=25

# SIGTERM-handler
term_handler() {
  echo "Received SIGTERM or SIGINT"
  echo "Waiting $shutdown_delay seconds for in flight API requests to complete..."
  sleep "$shutdown_delay"
  echo "Killing Doge node and Insight API"
  kill -2 "$insight_pid"
  wait "$insight_pid"
  kill -2 "$dogecoin_pid"
  wait "$dogecoin_pid"
  exit 130; # 128 + 2 -- SIGINT
}

# setup handlers
# execute the specified handler on SIGTERM
trap 'term_handler' SIGTERM
trap 'term_handler' SIGINT

mv /home/cqdev/insight-api-dogecoin/dogecoin.conf $datadir
rm /home/cqdev/.blockchain/dogecoind.pid

echo "Starting CoinQuery Dogecoin service!"
dogecoind -datadir=/home/cqdev/.blockchain &
dogecoin_pid="$!"

# get blockchain height from blockcypher
echo "getting latest blockheight from blockcypher.com..."
curl https://api.blockcypher.com/v1/doge/main > blockchain-info.json
refcount=$(jq '.height' blockchain-info.json)
# handle errors
re='^[0-9]+$'
if ! [[ $refcount =~ $re ]] ; then
   echo $refcount
   echo "error: invalid response from blockcypher, default to 232827"
   refcount=2426872
else
echo "blockchain height via blockcypher.com:"
fi

echo $refcount
echo "------------"

# get local block height
blockcount=$(eval $cli_get_block_count)
echo "local blockchain height:"
echo $blockcount

# wait until sync 100% before starting insight
while [[ "$blockcount" -eq "" || $blockcount -lt $refcount ]]
do
sleep 5
blockcount=$(eval $cli_get_block_count)
echo $blockcount
done

# start insight
echo $blockcount
echo "starting insight"
node --harmony /home/cqdev/insight-api-dogecoin/insight.js &
insight_pid="$!"
wait $insight_pid
