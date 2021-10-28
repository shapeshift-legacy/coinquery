#! /bin/bash

# validate block to see missing transactions
go run cmd/validator/main.go -config $1 -coin $2 -start $3 -end $3

# wait for enter to continue
read -p "Press enter to recover missing transactions"

# recover block with missing transactions
go run cmd/indexer/main.go -config $1 -coin $2 -recover -start $3 -end $3

# validate again to verify recovery
go run cmd/validator/main.go -config $1 -coin $2 -start $3 -end $3
