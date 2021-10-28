package main

import (
	"flag"
	"fmt"
	"strconv"
	"sync"
	"time"

	"github.com/shapeshift-legacy/coinquery/V2/config"
	"github.com/shapeshift-legacy/coinquery/V2/internal/log"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/blockchain/utxo"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/postgres"
)

var (
	conf        = flag.String("config", "./config/local.json", "path to configuration json file")
	coin        = flag.String("coin", "", "coin to validate")
	deleteSize  = 1
	mempoolReqs = 15
	numDays     = -7
)

type txValidator struct {
	bc        *utxo.Blockchain
	db        *postgres.Database
	dbThreads int
	mempool   map[string]struct{}
	rwm       sync.RWMutex
}

func newTxValidator() *txValidator {
	c, err := config.Get(*conf)
	if err != nil {
		log.Fatal(err, "main")
	}

	cc, err := c.GetCoin(*coin)
	if err != nil {
		log.Fatal(err, "main")
	}

	dbConfig, err := c.GetDBConfig(config.ReadWrite, cc)
	if err != nil {
		log.Fatal(err, "main")
	}

	dbConn, err := postgres.New(dbConfig, *coin)
	if err != nil {
		log.Fatal(err, "main")
	}

	rpcConfig := c.GetRPCConfig(cc)
	chainConn := utxo.New(rpcConfig, *coin)

	return &txValidator{
		bc:        chainConn,
		db:        dbConn,
		dbThreads: dbConfig.Threads,
		mempool:   make(map[string]struct{}),
	}
}

// Validates pending transactions and deletes any that are invalid.
// An invalid transaction is one that has not been mined in a block and no longer appears in mempool.
// This can be due to a double spend attempt or a transaction being dropped from mempool.
func main() {
	flag.Parse()

	log.Initialize("coinquery-txvalidator", *coin)

	v := newTxValidator()

	// get mempool several times to fetch full set across all nodes in cluster
	var mwg sync.WaitGroup
	mwg.Add(mempoolReqs)
	for i := 0; i < mempoolReqs; i++ {
		go func() {
			defer mwg.Done()

			mempool, err := v.bc.GetMempool()
			if err != nil {
				log.Fatal(err, "main", "failed to get mempool")
			}

			v.buildMempool(mempool)
		}()
	}

	mwg.Wait()

	log.Infof("main", "mempool size: %d", len(v.mempool))

	value, err := v.db.Get("validatedTransaction")
	if err != nil {
		log.Warn(err, "main", "failed to get last validated transaction, starting from 0")
		value = "0"
	}

	log.Infof("main", "validating pending transactions from id: %s", value)

	id, err := strconv.Atoi(value)
	if err != nil {
		log.Fatal(err, "main", "failed to convert id")
	}

	limit := fmt.Sprintf("AND id >= %d", id)

	txs, err := v.db.GetPendingTxs(limit)
	if err != nil {
		log.Warn(err, "main", "failed to get pending transactions")
	}

	log.Infof("main", "pending txs: %d", len(txs))

	invalidIDs := []int{}
	for _, tx := range txs {
		if _, ok := v.mempool[tx.TxID]; !ok {
			invalidIDs = append(invalidIDs, tx.ID)
		}
	}

	log.Infof("main", "invalid transactions detected: %d", len(invalidIDs))

	// spin up threads to process deletion of invalid txs
	invalidIDsChan := make(chan []int)
	var dwg sync.WaitGroup
	dwg.Add(v.dbThreads)
	for i := 0; i < v.dbThreads; i++ {
		go func() {
			defer dwg.Done()

			for ids := range invalidIDsChan {
				err := v.db.DeleteInvalidTxs(ids)
				if err != nil {
					log.Warn(err, "main", "failed to handle invalid transactions")
				}
			}

		}()
	}

	// queue invalid ids to be processed by the delete threads in batches of deleteSize
	for i := 0; i < len(invalidIDs); i += deleteSize {
		high := i + deleteSize

		if high > len(invalidIDs) {
			high = len(invalidIDs)
		}

		invalidIDsChan <- invalidIDs[i:high]
	}

	// close channel and let pending traffic complete
	close(invalidIDsChan)

	// once all channels have been drained wait groups should close as well
	dwg.Wait()

	// transaction id from a block numDays ago
	id, err = v.db.GetTxAtBlockTime(time.Now().AddDate(0, 0, numDays))
	if err != nil {
		log.Warnf(err, "main", "failed to get next highest validated tx, using previous")
		return
	}

	v.db.Set("validatedTransaction", strconv.Itoa(id))
}

// buildMempool is a thread safe write to the mempool map
func (v *txValidator) buildMempool(mempool []string) {
	v.rwm.Lock()
	defer v.rwm.Unlock()

	for _, tx := range mempool {
		v.mempool[tx] = struct{}{}
	}
}
