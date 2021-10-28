#!/bin/bash
echo "Starting CoinQuery Minotaur service!"
echo "revision: $COMMIT"

exec node /home/cqdev/minotaur/modules/ethereum/scripts/eth-scan