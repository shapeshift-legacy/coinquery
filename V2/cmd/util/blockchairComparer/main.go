package main

import (
	"bufio"
	"encoding/csv"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"sync"

	"github.com/shapeshift-legacy/coinquery/V2/config"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/postgres"
)

var (
	downloadFlag     = flag.Bool("download", false, "If enabled this will download a csv from blockchair for a given address")
	addressFlag      = flag.String("address", "3F3KVPrDX6MsBjKveQNBkkunKp1Uai2zvz", "Specific address to download data for.")
	csvPathFlag      = flag.String("csvPath", "./tmp.csv", "Path where to save data as csv.")
	dbServerAddrFlag = flag.String("dbServerAddr", "<redacted>.us-west-2.rds.amazonaws.com", "server address for database.")
	coinFlag         = flag.String("coin", "btc", "coin to validate")
	numDBReadersFlag = flag.Int("numDBReaders", 300, "Number of database readers reading conncurrently.")
)

func main() {
	flag.Parse()
	download := *downloadFlag
	addr := *addressFlag
	csvPath := *csvPathFlag
	dbServerAddr := *dbServerAddrFlag
	numDBReaders := *numDBReadersFlag

	addrURL := genAddrURL(addr)

	if download {
		fmt.Println("Downloading CSV from blockchair...")
		err := downloadFile(csvPath, addrURL)
		if err != nil {
			log.Fatal(err)
		}

		fmt.Println("Finished Downloading")
	}

	csvFile, err := os.Open(csvPath)
	if err != nil {
		log.Fatal(err)
	}

	dbConn, err := postgres.New(&config.DB{
		URI: fmt.Sprintf("indexer@%s:5432", dbServerAddr),
		BaseDB: config.BaseDB{
			MaxConns:        numDBReaders,
			MaxConnLifetime: 120,
			Threads:         numDBReaders,
			Retry: config.Retry{
				Attempts: 1,
			},
		},
	}, *coinFlag)

	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Starting csv compare against database...")
	var wg sync.WaitGroup
	count := 1
	reader := csv.NewReader(bufio.NewReader(csvFile))
	// read header info and ignore
	readCSVRow(reader)
	for {
		line, done := readCSVRow(reader)
		if done {
			break
		}

		wg.Add(1)
		go func(vout_txid, vin_txid string) {
			defer wg.Done()
			_, err := dbConn.GetTxByTxID(vout_txid)
			if err != nil {
				fmt.Printf("\t - %s in blockchair csv wasn't found in our database\n", vout_txid)
			}
			if vin_txid != "" {
				_, err = dbConn.GetTxByTxID(vin_txid)
				if err != nil {
					fmt.Printf("\t - %s in blockchair csv wasn't found in our database\n", vin_txid)
				}
			}
		}(line[0], line[4])

		// if this output is spent count its spent tx too
		if line[4] != "" {
			count += 1
		}
		count += 1
	}
	fmt.Printf("%d Transactions processing... including duplicates\n", count)
	wg.Wait()

	fmt.Println("Finished compare against database")
}

func genAddrURL(addr string) string {
	return fmt.Sprintf("https://api.blockchair.com/bitcoin/outputs?fields=transaction_hash,index,time,recipient,spending_transaction_hash,spending_index,spending_time&q=recipient(%s)&export=csv", addr)
}

// downloadFile will download a url to a local file. It's efficient because it will
// write as it downloads and not load the whole file into memory.
func downloadFile(filepath string, url string) error {
	// Create the file
	out, err := os.Create(filepath)
	if err != nil {
		return err
	}
	defer out.Close()

	// Get the data
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// Write the body to file
	_, err = io.Copy(out, resp.Body)
	if err != nil {
		return err
	}

	return nil
}

func readCSVRow(reader *csv.Reader) ([]string, bool) {
	line, err := reader.Read()
	if err == io.EOF {
		return nil, true
	} else if err != nil {
		log.Fatal(err)
	}
	return line, false
}
