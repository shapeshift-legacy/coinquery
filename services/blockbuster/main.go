package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"

	"github.com/shapeshift-legacy/coinquery/services/blockbuster/csv"
)

// Disclaimer: This was some side work done to help Danielle with auditing and
// at some point will become a proper story and have some real cycles spent
// on the code/functionality/testing. This is also very specific to btc and
// and knowing the amount of txs an address shows up in. Will update.

// To Use: For right now you update the address inside the top of main function
// and it when you run the program it will aggregate every txID that the address
// has ever been a part of. From there it will loop through the txIDs and make
// another call per txID to gather tx metadata. It does all of this concurrently.
// It will write any failed calls a log file so that you can have a record of ones
// to retry. Right now the best way is to loop over those failed txIDs and make
// synchronous calls. It writes the results to a csv file. This part is manual
// right now. We did this process successfully against a 32 instance (old insight
// style)stack. It seems tx calls fail when the tx is HUGE so the hope is that
// once V2 is implemented as it will be http only and not relying on underlying
// RPC calls.

// TxResponse - struct shape of response value needed from fetching txs by address
type TxResponse struct {
	// Transactions is slice of transaction IDs
	Transactions []string `json:"transactions"`
}

// TxDetailsResponse - struct shape of response value needed from fetching tx by txID
type TxDetailsResponse struct {
	// Time is in epoch
	Time int `json:"time"`
	Vins []struct {
		Addr string `json:"addr"`
	} `json:"vin"`
	Vouts []struct {
		ScriptPubKey struct {
			Addrs []string `json:"addresses"`
		} `json:"scriptPubKey"`
	} `json:"vout"`
}

// TxIDToEpoch pairs txs with their metadata
type TxIDToEpoch struct {
	TxID      string
	Epoch     int
	Vin       bool
	Vout      bool
	Addresses []string
}

// AuditAddr will eventually be a flag of sorts - it is the addr you want to audit
var AuditAddr = "1NSc6zAdG2NGbjPLQwAjAuqjHSoq5KECT7"
var txIds []string
var csvFormatted [][]string

func main() {
	httpClient := &http.Client{
		Timeout: time.Second * 180,
	}

	txCh := make(chan []string)
	url := "https://btc-stage.redacted.example.com/api/addr/" + AuditAddr

	var wg1 sync.WaitGroup
	for i := 0; i < 62000; i += 1000 {
		wg1.Add(1)
		go func(i int) {
			defer wg1.Done()
			fetchTx(url+"?from="+strconv.Itoa(i)+"&to="+strconv.Itoa(i+1000), txCh, httpClient)
		}(i)
	}

	go func() {
		wg1.Wait()
		close(txCh)
	}()

	for v := range txCh {
		txIds = append(txIds, v...)
	}

	jobs := make(chan string)
	txDetailCh := make(chan TxIDToEpoch)
	var wg2 sync.WaitGroup

	for i := 1; i <= 100; i++ {
		wg2.Add(1)
		go func() {
			defer wg2.Done()
			for v := range jobs {
				results := fetchTxDetails(v, httpClient)
				txDetailCh <- results
				time.Sleep(500 * time.Millisecond)
			}
		}()
	}

	done := make(chan struct{})

	go func() {
		for v := range txDetailCh {
			e := strconv.Itoa(v.Epoch)
			d := time.Unix(int64(v.Epoch), 0)
			csvSlice := []string{
				v.TxID,
				e,
				d.String(),
				strconv.FormatBool(v.Vin),
				strconv.FormatBool(v.Vout),
			}
			csvSlice = append(csvSlice, v.Addresses...)
			csvFormatted = append(csvFormatted, csvSlice)
		}
		done <- struct{}{}
	}()

	for _, v := range txIds {
		jobs <- v
	}

	close(jobs)
	wg2.Wait()
	close(txDetailCh)
	<-done

	csv.Generate(csvFormatted)
}

func fetchTx(url string, ch chan<- []string, httpClient *http.Client) {
	res, err := httpClient.Get(url)
	if err != nil {
		fmt.Println(err)
	}
	defer res.Body.Close()

	var data TxResponse
	decoder := json.NewDecoder(res.Body)
	err = decoder.Decode(&data)
	if err != nil {
		fmt.Println(err)
	}

	ch <- data.Transactions
}

func fetchTxDetails(txID string, httpClient *http.Client) TxIDToEpoch {
	txByID := "https://btc-stage.redacted.example.com/api/tx/" + txID

	req, err := http.NewRequest("GET", txByID, nil)
	if err != nil {
		fmt.Println(err)
	}
	req.Header.Set("Connection", "keep-alive")

	res, err := httpClient.Do(req)
	if err != nil {
		fmt.Println(err)
	}
	defer res.Body.Close()

	var data TxDetailsResponse
	decoder := json.NewDecoder(res.Body)
	err = decoder.Decode(&data)

	if err != nil {
		fmt.Println(err)
		f, err2 := os.OpenFile("logs", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
		if err2 != nil {
			log.Fatalf("error opening file: %v", err2)
		}
		defer f.Close()

		log.SetOutput(f)
		log.Println("ERROR: ", err, txID)
	}

	// Audit address found inside Vin(s)
	inVin := false
	// Audit address found inside Vouts(s)
	inVout := false
	// If Audit address found inside Vin(s) then this holds all the tx's output addrs
	var outputAddrs []string

	for _, vin := range data.Vins {
		if vin.Addr == AuditAddr {
			inVin = true
			for _, vout := range data.Vouts {
				outputAddrs = append(outputAddrs, vout.ScriptPubKey.Addrs...)
			}
			break
		}
	}

	for _, vout := range data.Vouts {
		if Contains(vout.ScriptPubKey.Addrs, AuditAddr) {
			inVout = true
			break
		}
	}

	return TxIDToEpoch{txID, data.Time, inVin, inVout, outputAddrs}
}

// Contains returns a boolean on whether an element is found inside a slice
func Contains(slice []string, s string) bool {
	for _, v := range slice {
		if s == v {
			return true
		}
	}
	return false
}
