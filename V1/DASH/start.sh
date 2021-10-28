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

mv /home/cqdev/mynode/dash.conf /home/cqdev/.blockchain/
rm /home/cqdev/.blockchain/dashd.pid

# run application
/home/cqdev/node_modules/\@dashevo/dashcore-node/bin/dashcore-node start &
bitcore_pid="$!"
wait $bitcore_pid