package main

import (
	"flag"
	"log"
	_ "net/http/pprof"
	"time"

	"github.com/shapeshift-legacy/coinquery/V2/config"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/postgres"
)

var conf = flag.String("config", "./config/local.json", "path to configuration json file")
var coin = flag.String("coin", "btc", "coin that is syncing")

const waitSec = 10
const secondsPerHour = 3600

func main() {
	flag.Parse()

	c, err := config.Get(*conf)
	if err != nil {
		log.Fatalf("%+v\n", err)
	}

	cc, err := c.GetCoin(*coin)
	if err != nil {
		log.Fatal(err, "main")
	}

	dbConfig, err := c.GetDBConfig(config.ReadOnly, cc)
	if err != nil {
		log.Fatalf("%+v\n", err)
	}

	dbConn, err := postgres.New(dbConfig, *coin)
	if err != nil {
		log.Fatalf("%+v\n", err)
	}

	totalTx := 361000000
	prevCount := 0

	log.Println("Sync rate: calculating...")
	for {
		time.Sleep(waitSec * time.Second)

		txCount, err := dbConn.GetNumTransactions()
		if err != nil {
			log.Fatalf("%+v\n", err)
		}

		if txCount > totalTx {
			log.Printf("TXs synced: %d\n", txCount)
			log.Fatal(`Warning: current transaction count is higher than the max count expected.  Need to update max count (in source code) to match the current blockchain height`)
		}

		delta := txCount - prevCount
		if delta == 0 {
			log.Printf("Sync rate: %d TXs/sec, Total synced: %d TXs\n", 0, txCount)
			continue
		}

		rate := delta / waitSec
		eta := float32(totalTx-txCount) / float32(rate) / float32(secondsPerHour)
		log.Printf("Sync rate: %d TXs/sec, Total synced: %d TXs, ETA to db sync complete: %.2f hours\n", rate, txCount, eta)

		prevCount = txCount
	}
}
