#!/bin/sh

cardano_pid=1
echo "user: $(whoami)"
echo "running revision $COMMIT"

# SIGTERM-handler
term_handler() {
  kill -2 "$cardano_pid"
  wait "$cardano_pid"
  exit 130; # 128 + 2 -- SIGINT
}

# setup handlers
# execute the specified handler on SIGTERM
trap 'term_handler' SIGTERM
trap 'term_handler' SIGINT

export CARDANO_STATE_DIR=/wallet

# run application
/bin/cardano-start &
cardano_pid="$!"
wait $cardano_pid
