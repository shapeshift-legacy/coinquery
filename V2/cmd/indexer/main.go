package main

import (
	"flag"
	"fmt"
	_ "net/http/pprof"
	"os"
	"runtime/pprof"
	"sort"
	"sync"
	"time"

	"github.com/shapeshift-legacy/coinquery/V2/config"
	"github.com/shapeshift-legacy/coinquery/V2/internal/log"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/blockchain/utxo"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/http"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/postgres"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/zmq"
)

var (
	conf       = flag.String("config", "./config/local.json", "path to configuration json file")
	coin       = flag.String("coin", "", "coin to index")
	startBlock = flag.Int("start", 0, "block to start sync from")
	endBlock   = flag.Int("end", 0, "block to end sync from")
	syncTip    = flag.Bool("sync", false, "synchronizes until tip")
	debug      = flag.Bool("debug", false, "verbose debug output")
	cpuprofile = flag.String("cpuprofile", "", "write cpu profile to file")
	batchSize  = flag.Int("batch", 1, "rpc request batch size")
	recover    = flag.Bool("recover", false, "if set, allows to write blocks older than latest in database")
)

// Blockchain interface
type Blockchain interface {
	GetBlocks(val interface{}) ([]*utxo.Block, error)
	GetChainInfo() (*utxo.ChainInfo, error)
	GetMempool() ([]string, error)
	GetRawTransactions(txids []string) ([]*utxo.Tx, error)
}

// Database interface
type Database interface {
	LastBlock() (*utxo.Block, error)
	InsertBlock(b *utxo.Block, recover bool) (int, error)
	GetBlock(val interface{}) (*utxo.Block, error)
	InsertTx(tx *utxo.Tx, txIndex int, blockId int) error
	Close() error
}

// Indexer struct containing configuration and connections
type Indexer struct {
	dbThreads     int
	rpcThreads    int
	bc            Blockchain
	db            Database
	mq            *zmq.ZMQ
	monitor       *http.Client
	startBlock    int
	endBlock      int
	syncTip       bool
	batchSize     int
	recover       bool
	notifyMonitor bool
	doneChan      chan struct{}
	errChan       chan error
}

type txResult struct {
	tx      *utxo.Tx
	index   int
	blockId int
}

func newIndexer(c *config.Config, cc *config.Coin) *Indexer {
	doneChan := make(chan struct{})
	errChan := make(chan error)

	dbConfig, err := c.GetDBConfig(config.ReadWrite, cc)
	if err != nil {
		log.Fatal(err, "main")
	}

	dbConn, err := postgres.New(dbConfig, *coin)
	if err != nil {
		log.Fatal(err, "main")
	}

	mqConn := zmq.New(cc, doneChan, errChan)

	rpcConfig := c.GetRPCConfig(cc)
	chainConn := utxo.New(rpcConfig, *coin)

	monitorClient := http.NewClient(&config.RPC{
		CoinRPC: config.CoinRPC{
			URL: fmt.Sprintf("%s-monitor", *coin),
		},
	})

	return &Indexer{
		dbThreads:  dbConfig.Threads,
		rpcThreads: rpcConfig.Threads,
		bc:         chainConn,
		db:         dbConn,
		mq:         mqConn,
		monitor:    monitorClient,
		startBlock: *startBlock,
		endBlock:   *endBlock,
		syncTip:    *syncTip,
		batchSize:  *batchSize,
		recover:    *recover,
		doneChan:   doneChan,
		errChan:    errChan,
	}
}

func main() {
	flag.Parse()

	log.Initialize("coinquery-indexer", *coin)

	if *cpuprofile != "" {
		f, err := os.Create(*cpuprofile)
		if err != nil {
			log.Fatalf(err, "main", "failed to create cpuprofile file")
		}
		pprof.StartCPUProfile(f)
		defer pprof.StopCPUProfile()
	}

	c, err := config.Get(*conf)
	if err != nil {
		log.Fatal(err, "main")
	}

	cc, err := c.GetCoin(*coin)
	if err != nil {
		log.Fatal(err, "main")
	}

	idxr := newIndexer(c, cc)
	defer func() {
		err := idxr.db.Close()
		if err != nil {
			log.Fatal(err, "main", "error closing db")
		}
	}()

	log.Info("main", "start initial sync")
	idxr.initialSync()
	log.Info("main", "finished initial sync")

	if !idxr.recover && idxr.syncTip {
		err = idxr.mq.Connect()
		if err != nil {
			log.Fatal(err, "main")
		}

		idxr.staySynced()
	}
}

// setStartBlock sets startBlock to the last block in db or 0 if no blocks are in the db if syncTip is true,
// otherwise startBlock will be the value of the flag passed in, or default value if no flag is passed.
func (idxr *Indexer) setStartBlock() {
	if idxr.syncTip {
		blk, err := idxr.db.LastBlock()
		if err != nil {
			log.Fatal(err, "main", "failed to set start block")
		}

		if blk == nil {
			idxr.startBlock = 0
		} else {
			idxr.startBlock = int(blk.Height)
		}

		log.Info("main", "setting startBlock to: ", idxr.startBlock)
	}
}

// setEndBlock sets the endBlock to the current height of the blockchain if syncTip is true
// otherwise endBlock will be the value of the flag passed in, or equal to start if not provided
func (idxr *Indexer) setEndBlock() {
	if idxr.syncTip {
		info, err := idxr.bc.GetChainInfo()
		if err != nil {
			log.Fatal(err, "main", "failed to set end block")
		}

		idxr.endBlock = info.Blocks
		log.Info("main", "setting endBlock to: ", idxr.endBlock)
	} else if idxr.endBlock < idxr.startBlock {
		idxr.endBlock = idxr.startBlock
	}
}

// initialSync syncs the blockchain from start to end flags if syncTip is false
// otherwise it syncs from last block in db to tip of chain
func (idxr *Indexer) initialSync() {
	blockHeightsChan := make(chan interface{})
	txResultChan := make(chan *txResult)
	blocksChan := make(chan []*utxo.Block)
	orderedBlockChan := make(chan *utxo.Block)

	idxr.notifyMonitor = false

	idxr.setStartBlock()
	idxr.setEndBlock()

	go idxr.processBlockHeights(blockHeightsChan)

	var bwg sync.WaitGroup
	bwg.Add(idxr.rpcThreads)
	for i := 0; i < idxr.rpcThreads; i++ {
		go func() {
			idxr.getBlocks(blocksChan, blockHeightsChan)
			bwg.Done()
		}()
	}
	go func() {
		bwg.Wait()
		close(blocksChan)
	}()

	go idxr.orderBlock(orderedBlockChan, blocksChan)
	go idxr.writeBlock(txResultChan, orderedBlockChan)

	var twg sync.WaitGroup
	twg.Add(idxr.dbThreads)
	for i := 0; i < idxr.dbThreads; i++ {
		go func() {
			idxr.writeTx(txResultChan)
			twg.Done()
		}()
	}
	twg.Wait()
}

// staySynced will continue syncing broadcasted transactions and confirmed blocks as they are received from zmq and mempool
func (idxr *Indexer) staySynced() {
	mempoolTxChan := make(chan *utxo.MempoolTx)
	blockHashChan := make(chan interface{})
	txResultChan := make(chan *txResult)
	blockChan := make(chan *utxo.Block)
	signalMempoolChan := make(chan struct{})

	idxr.notifyMonitor = true

	go idxr.processMempool(mempoolTxChan, signalMempoolChan)

	idxr.mq.Start(blockHashChan, mempoolTxChan, signalMempoolChan)

	signalMempoolChan <- struct{}{} // signal for initial process of mempool

	for i := 0; i < idxr.rpcThreads; i++ {
		go idxr.getMempoolTxs(txResultChan, mempoolTxChan)
	}

	go idxr.syncToTip(blockChan, blockHashChan)
	go idxr.writeBlock(txResultChan, blockChan)

	for i := 0; i < idxr.dbThreads; i++ {
		go idxr.writeTx(txResultChan)
	}

	for err := range idxr.errChan {
		close(idxr.doneChan)
		log.Fatal(err, "main")
	}
}

// processMempool gets mempool tx hash array and write to mempoolTxChan when signalMempoolChan is signaled
func (idxr *Indexer) processMempool(mempoolTxChan chan<- *utxo.MempoolTx, signalMempoolChan <-chan struct{}) {
	for {
		select {
		case <-signalMempoolChan:
			txids, err := idxr.bc.GetMempool()
			if err != nil {
				idxr.errChan <- err
			}

			log.Info("main", "start mempool process: ", len(txids))
			for _, id := range txids {
				select {
				case mempoolTxChan <- &utxo.MempoolTx{Hash: id, Fails: 0}:
				case <-idxr.doneChan:
					return
				}
			}
			log.Info("main", "end mempool process")
		case <-idxr.doneChan:
			return
		}
	}
}

// getTransaction reads from mempoolTxChan to get a raw transaction and write to the txResultChan
func (idxr *Indexer) getMempoolTxs(txResultChan chan<- *txResult, mempoolTxChan chan *utxo.MempoolTx) {
	for mTx := range mempoolTxChan {
		txs, err := idxr.bc.GetRawTransactions([]string{mTx.Hash})
		if err != nil {
			if mTx.Fails < 10 {
				go func(mTx *utxo.MempoolTx) {
					mTx.Fails++
					mempoolTxChan <- mTx
				}(mTx)
			} else {
				log.Warn(err, "main")
			}

			continue
		}

		for _, tx := range txs {
			select {
			case txResultChan <- &txResult{tx: tx, index: -1, blockId: -1}:
			case <-idxr.doneChan:
				return
			}
		}
	}
}

// processBlockHeights writes block heights to the blockHeightsChan from startBlock to endBlock in arrays of batchSize
func (idxr *Indexer) processBlockHeights(blockHeightsChan chan<- interface{}) {
	defer close(blockHeightsChan)

	stopTickerChan := make(chan struct{})
	defer close(stopTickerChan)

	block := 0

	log.Info("main", "starting initial sync at block: ", idxr.startBlock)

	// Logs block sync status every 2 minutes, until stopTickerChan is close when function returns
	go func(b *int) {
		ticker := time.NewTicker(2 * time.Minute)
		for {
			select {
			case <-ticker.C:
				log.Info("main", "syncing block: ", *b)
			case <-stopTickerChan:
				return
			}
		}
	}(&block)

	for i := idxr.startBlock; i <= idxr.endBlock; i += idxr.batchSize {
		// Checks and updates endBlock to current node block height on final batch until caught up
		if i >= idxr.endBlock-idxr.batchSize && i <= idxr.endBlock {
			idxr.setEndBlock()
		}

		// Constructs heights array by batch size
		heights := make([]int, 0)
		for x := 0; x < idxr.batchSize; x++ {
			block = i + x
			if block > idxr.endBlock {
				break
			}
			heights = append(heights, block)
		}

		select {
		case blockHeightsChan <- heights:
		case <-idxr.doneChan:
			return
		}
	}
}

// getBlocks reads heights ([]int) or hashes([]string) from the valChan, get the blocks from rpc and writes them to the blocksChan
func (idxr *Indexer) getBlocks(blocksChan chan<- []*utxo.Block, valChan <-chan interface{}) {
	for v := range valChan {
		b, err := idxr.bc.GetBlocks(v)
		if err != nil {
			log.Fatal(err, "main")
		}

		select {
		case blocksChan <- b:
		case <-idxr.doneChan:
			return
		}
	}
}

// syncToTip is signaled by an incoming blockhash from zmq and will then sync all block from the last block in the
// db to the tip of chain. This logic will also handle reorg recovery as we will be returned the last non orphaned
// block from the db and sync current valid blocks from the node until tip.
func (idxr *Indexer) syncToTip(blockChan chan<- *utxo.Block, blockHashChan <-chan interface{}) {
	for range blockHashChan {
		info, err := idxr.bc.GetChainInfo()
		if err != nil {
			log.Fatal(err, "main", "failed to set end block")
		}

		lastBlock, err := idxr.db.LastBlock()
		if err != nil {
			log.Fatal(err, "main")
		}

		for i := int(lastBlock.Height); i <= info.Blocks; i++ {
			b, err := idxr.bc.GetBlocks([]int{i})
			if err != nil {
				log.Fatal(err, "main")
			}

			blockChan <- b[0]
		}
	}
}

// orderBlock sorts blocks read from the blocksChan in ascending order and writes them to orderedBlockChan
// since block order is not guaranteed due to concurrent fetching of blocks
func (idxr *Indexer) orderBlock(orderedBlockChan chan<- *utxo.Block, blocksChan <-chan []*utxo.Block) {
	defer close(orderedBlockChan)

	nextBlock := idxr.startBlock
	blockStore := []*utxo.Block{}

	for blks := range blocksChan {
		blockStore = append(blockStore, blks...)

		sort.Slice(blockStore, func(i, j int) bool {
			return blockStore[i].Height < blockStore[j].Height
		})

		blockSentCount := 0
		for i, block := range blockStore {
			if block.Height == nextBlock {
				select {
				case orderedBlockChan <- block:
					blockStore[i] = nil
					nextBlock = block.Height + 1
					blockSentCount++
					continue
				case <-idxr.doneChan:
					return
				}
			}
			break
		}

		blockStore = blockStore[blockSentCount:]
	}
}

// writeBlock inserts Block into db and then writes transactions to the txResultChan
func (idxr *Indexer) writeBlock(txResultChan chan<- *txResult, blockChan <-chan *utxo.Block) {
	defer close(txResultChan)

	for block := range blockChan {
		blockId, err := idxr.db.InsertBlock(block, idxr.recover)
		if err != nil {
			log.Fatal(err, "main")
		}

		for i := range block.Txs {
			select {
			case txResultChan <- &txResult{&block.Txs[i], i, blockId}:
			case <-idxr.doneChan:
				return
			}
		}

		if idxr.notifyMonitor {
			go idxr.monitor.CallRest("POST", fmt.Sprintf("monitor/%s/notify/newBlock", *coin), block, nil)
		}
	}
}

// writeTx inserts txResult into db
func (idxr *Indexer) writeTx(txs <-chan *txResult) {
	for tx := range txs {
		if tx.tx.Hash == "" {
			tx.tx.Hash = tx.tx.TxID
		}

		select {
		case <-idxr.doneChan:
			return
		default:
			if err := idxr.db.InsertTx(tx.tx, tx.index, tx.blockId); err != nil {
				log.Fatal(err, "main")
			}
		}
	}
}
