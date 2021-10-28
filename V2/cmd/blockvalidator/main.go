package main

import (
	"flag"
	"fmt"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/shapeshift-legacy/coinquery/V2/config"
	"github.com/shapeshift-legacy/coinquery/V2/internal/log"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/blockchain/utxo"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/postgres"
)

var (
	coin             = flag.String("coin", "", "coin to validate")
	conf             = flag.String("config", "./config/local.json", "path to configuration json file")
	revalidateOffset = map[string]int{
		"bch":  10,
		"btc":  10,
		"dash": 50,
		"dgb":  250,
		"doge": 100,
		"ltc":  50,
	}
)

type blockValidator struct {
	bc *utxo.Blockchain
	// number of blocks that have been validated
	blocksValidated int
	// read write mutex to keep blocksValidated thread safe
	bvMutex    sync.RWMutex
	db         *postgres.Database
	dbThreads  int
	doneChan   chan struct{}
	rpcThreads int
	// block height to start validation at
	startBlock int
	// total number of blocks to be validated
	totalBlocks int
}

type blockResult struct {
	dbHash    string
	dbTxIds   []string
	nodeBlock *utxo.Block
}

type txResult struct {
	blockID int
	index   int
	*utxo.Tx
}

func newBlockValidator() *blockValidator {
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

	return &blockValidator{
		bc:         chainConn,
		db:         dbConn,
		dbThreads:  dbConfig.Threads,
		doneChan:   make(chan struct{}),
		rpcThreads: rpcConfig.Threads,
	}
}

func main() {
	flag.Parse()

	log.Initialize("coinquery-blockvalidator", *coin)

	v := newBlockValidator()

	blocksChan := make(chan *utxo.Block)
	resultChan := make(chan *blockResult)
	orderedResultsChan := make(chan *blockResult)
	repairChan := make(chan *utxo.Block)

	blockHeightsChan := v.generateBlockHeights()

	var rwg sync.WaitGroup
	rwg.Add(v.rpcThreads)
	for i := 0; i < v.rpcThreads; i++ {
		go func() {
			v.getBlock(blocksChan, blockHeightsChan)
			rwg.Done()
		}()
	}
	go func() {
		rwg.Wait()
		close(blocksChan)
	}()

	var dwg sync.WaitGroup
	dwg.Add(v.dbThreads)
	for i := 0; i < v.dbThreads; i++ {
		go func() {
			v.readBlock(resultChan, repairChan, blocksChan)
			dwg.Done()
		}()
	}
	go func() {
		dwg.Wait()
		close(resultChan)
	}()

	go v.orderResults(orderedResultsChan, resultChan)
	go v.checkResult(repairChan, orderedResultsChan)
	go v.repairBlock(repairChan)

	// log validation progress periodically
	go func() {
		ticker := time.NewTicker(2 * time.Minute)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				v.bvMutex.RLock()
				log.Infof("main", "blocks validated: %v", v.blocksValidated)
				log.Infof("main", "blocks left: %v", v.totalBlocks-v.blocksValidated)
				v.bvMutex.RUnlock()
			case <-v.doneChan:
				return
			}
		}
	}()

	// wait for doneChan to be closed to notify the block validation has completed
	<-v.doneChan

	log.Info("main", "finished validation")
}

// generateBlockHeights will queue up block heights from last validated block to current height in the database
func (v *blockValidator) generateBlockHeights() chan int {
	value, err := v.db.Get("validatedBlock")
	if err != nil {
		log.Fatal(err, "main", "failed to get start block")
	}

	v.startBlock, err = strconv.Atoi(value)
	if err != nil {
		log.Fatal(err, "main", "failed to convert block")
	}

	blk, err := v.db.LastBlock()
	if err != nil {
		log.Fatal(err, "main", "failed to get end block")
	}

	endBlock := blk.Height
	v.totalBlocks = endBlock - v.startBlock + 1

	log.Infof("main", "validating blocks %v to %v (total %v)", v.startBlock, endBlock, v.totalBlocks)

	// add all block heights to be validated to the buffered blockHeightsChan
	blockHeightsChan := make(chan int, v.totalBlocks)
	defer close(blockHeightsChan)
	for i := v.startBlock; i <= endBlock; i++ {
		blockHeightsChan <- i
	}

	return blockHeightsChan
}

// getBlock returns a node block at the specified height. Exit if no block is returned because we can't validate without a node block.
func (v *blockValidator) getBlock(blocksChan chan<- *utxo.Block, blockHeightsChan <-chan int) {
	for h := range blockHeightsChan {
		b, err := v.bc.GetBlocks([]int{h})
		if err != nil {
			log.Fatal(err, "main")
		}

		select {
		case blocksChan <- b[0]:
		case <-v.doneChan:
			return
		}
	}
}

// readBlock will get the database block at the same height as the nodeBlock and queue up a *blockResult that we can use to validate. If no block is found in the database the block will be repaired.
func (v *blockValidator) readBlock(resultChan chan<- *blockResult, repairChan chan<- *utxo.Block, blocksChan chan *utxo.Block) {
	for nodeBlock := range blocksChan {
		dbBlock, err := v.db.GetBlock(nodeBlock.Height)
		if err != nil {
			log.Fatal(err, "main", "failed to read block")
		}

		// TODO: if this fails often, look into how to requeue the block for validation
		dbTxHashes, err := v.db.GetTxHashesByBlockHash(dbBlock.Hash, "", "")
		if err != nil {
			log.Fatal(err, "main", "failed to read block")
		}

		r := &blockResult{
			dbHash:    dbBlock.Hash,
			dbTxIds:   dbTxHashes,
			nodeBlock: nodeBlock,
		}

		select {
		case resultChan <- r:
		case <-v.doneChan:
			return
		}
	}
}

// orderResults will ensure we validate blocks in order so we can continuously update validatedBlock metadata in case the process crashes and pick up from where we last left off
func (v *blockValidator) orderResults(orderedResultChan chan<- *blockResult, resultChan <-chan *blockResult) {
	defer close(orderedResultChan)

	nextBlock := v.startBlock
	results := make(map[int]*blockResult)

	for result := range resultChan {
		results[result.nodeBlock.Height] = result

		// process through as many ordered blocks as are available
		r, found := results[nextBlock]
		for found {
			select {
			case orderedResultChan <- r:
				delete(results, nextBlock)
				nextBlock++
			case <-v.doneChan:
				return
			}
			r, found = results[nextBlock]
		}
	}
}

// checkResult will validate each *blockResult and if the database does not match the node we will queue up the node block to be used to repair the database block
func (v *blockValidator) checkResult(repairChan chan<- *utxo.Block, orderedResultChan <-chan *blockResult) {
	for result := range orderedResultChan {
		nodeHeight := result.nodeBlock.Height
		nodeHash := result.nodeBlock.Hash
		dbHash := result.dbHash

		// mark block to be repaired and continue so we don't mark the block as valid
		if nodeHash != dbHash {
			err := fmt.Errorf("at block height: %d - blockhash want: %s, have: %s", nodeHeight, nodeHash, dbHash)
			log.Warnf(err, "main", "invalid block")
			go func(b utxo.Block) { repairChan <- &b }(*result.nodeBlock)
			continue
		}

		nodeTxCount := len(result.nodeBlock.Txs)
		dbTxCount := len(result.dbTxIds)

		// mark block to be repaired and continue so we don't mark the block as valid
		if nodeTxCount != dbTxCount {
			err := fmt.Errorf("at block height: %d - tx count want: %d, have: %d", nodeHeight, nodeTxCount, dbTxCount)
			log.Warnf(err, "main", "invalid block")

			// create a map of all txids we have stored in the db for current block
			txs := make(map[string]struct{}, dbTxCount)
			for _, id := range result.dbTxIds {
				txs[id] = struct{}{}
			}

			// find transactions that we are missing in the database
			missingTxs := []utxo.Tx{}
			for _, tx := range result.nodeBlock.Txs {
				if _, found := txs[tx.TxID]; !found {
					missingTxs = append(missingTxs, tx)
				}
			}

			// only include missing transactions for repair to increase performance
			result.nodeBlock.Txs = missingTxs
			go func(b utxo.Block) { repairChan <- &b }(*result.nodeBlock)

			continue
		}

		// consider block valid if checks pass
		v.blockValidated()
	}
}

// repairBlock will use the node block as the source of truth and update the database accordingly
func (v *blockValidator) repairBlock(repairChan chan *utxo.Block) {
	for nodeBlock := range repairChan {
		log.Infof("main", "repairing block: %d", nodeBlock.Height)
		log.Infof("main", "repairing transactions: %d", len(nodeBlock.Txs))

		rwm := sync.RWMutex{}
		failedRepair := false

		blockID, err := v.db.InsertBlock(nodeBlock, true)
		if err != nil {
			log.Warnf(err, "main", "retrying repair of block: %d", nodeBlock.Height)
			go func(b utxo.Block) { repairChan <- &b }(*nodeBlock)
			continue
		}

		// add all of the transactions to be repaired to a buffered channel to be processed concurrently below
		txsChan := make(chan txResult, len(nodeBlock.Txs))
		for i := range nodeBlock.Txs {
			txsChan <- txResult{blockID, i, &nodeBlock.Txs[i]}
		}
		close(txsChan)

		var twg sync.WaitGroup
		twg.Add(v.dbThreads)
		for i := 0; i < v.dbThreads; i++ {
			go func() {
				defer twg.Done()

				for tx := range txsChan {
					if tx.Hash == "" {
						tx.Hash = tx.TxID
					}

					// mark the repair as failed if we fail to insert a transaction so it can be requeued (thread safe)
					if err := v.db.InsertTx(tx.Tx, tx.index, tx.blockID); err != nil {
						log.Warn(err, "main", "failed to repair transaction")
						rwm.Lock()
						failedRepair = true
						rwm.Unlock()
					}
				}
			}()
		}
		go func(b utxo.Block) {
			twg.Wait()

			if failedRepair {
				log.Warnf(err, "main", "retrying repair of block: %v", b.Height)
				go func() { repairChan <- &b }()
				return
			}

			// consider block valid if repair succeeds
			log.Infof("main", "finished repairing block: %v", b.Height)
			v.blockValidated()
		}(*nodeBlock)
	}
}

// blocksValidated updates validatedBlock metadata and determines when validation has been completed
func (v *blockValidator) blockValidated() {
	v.bvMutex.Lock()
	defer v.bvMutex.Unlock()

	// update validatedBlock metadata up until offset so we can revalidate blocks to account for any reorgs
	if v.blocksValidated+revalidateOffset[strings.ToLower(*coin)] <= v.totalBlocks {
		validatedBlock := strconv.Itoa(v.startBlock + v.blocksValidated)

		// update validatedBlock metadata for next block validation job
		if err := v.db.Set("validatedBlock", validatedBlock); err != nil {
			log.Fatal(err, "main", "failed to update validatedBlock")
		}
	}

	v.blocksValidated++

	if v.blocksValidated == v.totalBlocks {
		close(v.doneChan)
	}
}
