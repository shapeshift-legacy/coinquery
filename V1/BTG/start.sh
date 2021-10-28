#!/bin/bash
bitcore_pid=1
echo "user: $(whoami)"
echo "running revision $COMMIT"

# SIGTERM-handler
term_handler() {
  kill -2 "$bitcore_pid"
  wait "$bitcore_pid"
  exit 130; # 128 + 2 -- SIGINT
}

# setup handlers
# execute the specified handler on SIGTERM
trap 'term_handler' SIGTERM
trap 'term_handler' SIGINT

mv /home/cqdev/mynode/bitcoin.conf /home/cqdev/.blockchain/
rm /home/cqdev/.blockchain/bgoldd.pid
rm /home/cqdev/.blockchain/bitcoind.pid

# run application
bitcore-node start &
bitcore_pid="$!"
wait $bitcore_pid