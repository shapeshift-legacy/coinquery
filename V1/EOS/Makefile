
pull:
	docker pull eosio/eos:v1.4.0

run:
	docker run --name eosio \
		--publish 7777:7777 \
		--publish 127.0.0.1:5555:5555 \
		--volume /home/p/go/src/github.com/shapeshift-legacy/coinquery/EOS/contracts:/home/p/go/src/github.com/shapeshift-legacy/coinquery/EOS/contracts \
		--detach \
		eosio/eos \
		/bin/bash -c \
		"keosd --http-server-address=0.0.0.0:5555 & exec nodeos -e -p eosio --plugin eosio::producer_plugin --plugin eosio::chain_api_plugin --plugin eosio::history_plugin --plugin eosio::history_api_plugin --plugin eosio::http_plugin -d /mnt/dev/data --config-dir /mnt/dev/config --http-server-address=0.0.0.0:7777 --access-control-allow-origin=* --contracts-console --http-validate-host=false --filter-on='*'"

log:
	docker logs --tail 10 eosio

shell:
	docker exec -it eosio bash
