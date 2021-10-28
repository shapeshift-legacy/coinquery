// +build integration

package main

import (
	"log"
	"os"
	"testing"
	"time"

	"github.com/shapeshift-legacy/coinquery/V2/config"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/blockchain/utxo"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/postgres"
)

var db *postgres.Database

func mockIndexer() *Indexer {
	if err := cleanDatabase(); err != nil {
		log.Fatal(err)
	}

	return &Indexer{db: db}
}

func cleanDatabase() error {
	_, err := db.Exec(`
		DELETE FROM btc.output;
		DELETE FROM btc.input;
		DELETE FROM btc.transaction;
		DELETE FROM btc.block;
	`)

	return err
}

func TestMain(m *testing.M) {
	var err error

	conf := &config.DB{
		URI: "postgres://indexer@localhost:5432/indexer?sslmode=disable",
		BaseDB: config.BaseDB{
			MaxConns: 1,
			Timeout:  3,
		},
	}

	db, err = postgres.New(conf, "btc")
	if err != nil {
		log.Fatal(err)
	}

	cleanDatabase()
	result := m.Run()
	cleanDatabase()

	os.Exit(result)
}

func TestReorgForkSameHeight(t *testing.T) {
	idx := mockIndexer()

	bc := &mockStatefulBlockchain{
		blocksByHash:   make(map[string]*utxo.Block),
		blocksByHeight: make(map[int]*utxo.Block),
	}

	idx.bc = bc

	blockHashChan := make(chan interface{})
	txResultChan := make(chan *txResult)
	blockChan := make(chan *utxo.Block)

	go idx.syncToTip(blockChan, blockHashChan)
	go idx.writeBlock(txResultChan, blockChan)
	go idx.writeTx(txResultChan)

	// load start block
	blk9 := getBlockFromJSON("blk_reorg_09.json", t)
	bc.setAtHeight(9, blk9)
	idx.db.InsertBlock(blk9, false)

	// block 10 hash received from zmq, node height 10
	blk10 := getBlockFromJSON("blk_reorg_10.json", t)
	bc.setAtHeight(10, blk10)
	blockHashChan <- blk10.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	// block 11 hash received from zmq, node height 11
	blk11 := getBlockFromJSON("blk_reorg_11.json", t)
	bc.setAtHeight(11, blk11)
	blockHashChan <- blk11.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	// block 11a hash received from zmq, node height 11
	blk11a := getBlockFromJSON("blk_reorg_11a.json", t)
	bc.setAtHeight(11, blk11a)
	blockHashChan <- blk11a.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	assertNotOrphaned(t, loadBlocksByHash(t, idx.db.(*postgres.Database), blk10.Hash, blk11a.Hash))
	assertOrphaned(t, loadBlocksByHash(t, idx.db.(*postgres.Database), blk11.Hash))
}

func TestReorgForkNewTip(t *testing.T) {
	idx := mockIndexer()

	bc := &mockStatefulBlockchain{
		blocksByHash:   make(map[string]*utxo.Block),
		blocksByHeight: make(map[int]*utxo.Block),
	}

	idx.bc = bc

	blockHashChan := make(chan interface{})
	txResultChan := make(chan *txResult)
	blockChan := make(chan *utxo.Block)

	go idx.syncToTip(blockChan, blockHashChan)
	go idx.writeBlock(txResultChan, blockChan)
	go idx.writeTx(txResultChan)

	// load start block
	blk9 := getBlockFromJSON("blk_reorg_09.json", t)
	bc.setAtHeight(9, blk9)
	idx.db.InsertBlock(blk9, false)

	// block 10 hash received from zmq, node height 10
	// expect block 10 to be valid
	blk10 := getBlockFromJSON("blk_reorg_10.json", t)
	bc.setAtHeight(10, blk10)
	blockHashChan <- blk10.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	// block 11 hash received from zmq, node height 11
	// expect block 11 to be valid
	blk11 := getBlockFromJSON("blk_reorg_11.json", t)
	bc.setAtHeight(11, blk11)
	blockHashChan <- blk11.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	// block 11a hash received from zmq, node height 11
	// expect block 11 to be orphaned, and 11a to be valid
	blk11a := getBlockFromJSON("blk_reorg_11a.json", t)
	bc.setAtHeight(11, blk11a)
	blockHashChan <- blk11a.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	// block 12a hash received from zmq, node height 12
	// expect block 12a to be valid
	blk12a := getBlockFromJSON("blk_reorg_12a.json", t)
	bc.setAtHeight(12, blk12a)
	blockHashChan <- blk12a.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	assertNotOrphaned(t, loadBlocksByHash(t, idx.db.(*postgres.Database), blk10.Hash, blk11a.Hash, blk12a.Hash))
	assertOrphaned(t, loadBlocksByHash(t, idx.db.(*postgres.Database), blk11.Hash))

	// block 13a hash received from zmq, node height 13
	// expect block 13a to be valid
	blk13a := getBlockFromJSON("blk_reorg_13a.json", t)
	bc.setAtHeight(13, blk13a)
	blockHashChan <- blk13a.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	// block 12 hash received from zmq, node height still 13
	// expect block 12 to be rejected
	blk12 := getBlockFromJSON("blk_reorg_12.json", t)
	blockHashChan <- blk12.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	assertNotOrphaned(t, loadBlocksByHash(t, idx.db.(*postgres.Database), blk10.Hash, blk11a.Hash, blk12a.Hash, blk13a.Hash))
	assertOrphaned(t, loadBlocksByHash(t, idx.db.(*postgres.Database), blk11.Hash))
}

func TestReorgSkipBlock(t *testing.T) {
	idx := mockIndexer()

	bc := &mockStatefulBlockchain{
		blocksByHash:   make(map[string]*utxo.Block),
		blocksByHeight: make(map[int]*utxo.Block),
	}

	idx.bc = bc

	blockHashChan := make(chan interface{})
	txResultChan := make(chan *txResult)
	blockChan := make(chan *utxo.Block)

	go idx.syncToTip(blockChan, blockHashChan)
	go idx.writeBlock(txResultChan, blockChan)
	go idx.writeTx(txResultChan)

	// load start block
	blk9 := getBlockFromJSON("blk_reorg_09.json", t)
	bc.setAtHeight(9, blk9)
	idx.db.InsertBlock(blk9, false)

	// block 10 hash received from zmq, node height 10
	blk10 := getBlockFromJSON("blk_reorg_10.json", t)
	bc.setAtHeight(10, blk10)
	blockHashChan <- blk10.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	// seed intermediate blocks
	blk11 := getBlockFromJSON("blk_reorg_11.json", t)
	bc.setAtHeight(11, blk11)
	blk12 := getBlockFromJSON("blk_reorg_12.json", t)
	bc.setAtHeight(12, blk12)
	blk13 := getBlockFromJSON("blk_reorg_13.json", t)
	bc.setAtHeight(13, blk13)

	// block 14 hash received from zmq, node height 14
	// expect intermediate blocks to be added
	blk14 := getBlockFromJSON("blk_reorg_14.json", t)
	bc.setAtHeight(14, blk14)
	blockHashChan <- blk14.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	assertNotOrphaned(t, loadBlocksByHash(t, idx.db.(*postgres.Database), blk10.Hash, blk11.Hash, blk12.Hash, blk13.Hash, blk14.Hash))
}

func TestReorgDGB(t *testing.T) {
	idx := mockIndexer()

	bc := &mockStatefulBlockchain{
		blocksByHash:   make(map[string]*utxo.Block),
		blocksByHeight: make(map[int]*utxo.Block),
	}

	idx.bc = bc

	blockHashChan := make(chan interface{})
	txResultChan := make(chan *txResult)
	blockChan := make(chan *utxo.Block)

	go idx.syncToTip(blockChan, blockHashChan)
	go idx.writeBlock(txResultChan, blockChan)
	go idx.writeTx(txResultChan)

	// load start block
	blk9309131 := getBlockFromJSON("dgb_9309131.json", t)
	bc.setAtHeight(9309131, blk9309131)
	idx.db.InsertBlock(blk9309131, false)

	// block 9309132 hash received from zmq, node height 9309132
	blk9309132 := getBlockFromJSON("dgb_9309132.json", t)
	bc.setAtHeight(9309132, blk9309132)
	blockHashChan <- blk9309132.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	// block 9309133 hash received from zmq, node height 9309133
	blk9309133 := getBlockFromJSON("dgb_9309133.json", t)
	bc.setAtHeight(9309133, blk9309133)
	blockHashChan <- blk9309133.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	// seed intermediate blocks
	blk9309132a := getBlockFromJSON("dgb_9309132a.json", t)
	bc.setAtHeight(9309132, blk9309132a)
	blk9309133a := getBlockFromJSON("dgb_9309133a.json", t)
	bc.setAtHeight(9309133, blk9309133a)

	// block 9309134 hash received from zmq, node height 9309134
	blk9309134 := getBlockFromJSON("dgb_9309134.json", t)
	bc.setAtHeight(9309134, blk9309134)
	blockHashChan <- blk9309134.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	// block 9309135 hash received from zmq, node height 9309135
	blk9309135 := getBlockFromJSON("dgb_9309135.json", t)
	bc.setAtHeight(9309135, blk9309135)
	blockHashChan <- blk9309135.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	// block 9309136 hash received from zmq, node height 9309136
	blk9309136 := getBlockFromJSON("dgb_9309136.json", t)
	bc.setAtHeight(9309136, blk9309136)
	blockHashChan <- blk9309136.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	assertNotOrphaned(t, loadBlocksByHash(t, idx.db.(*postgres.Database), blk9309131.Hash, blk9309132a.Hash, blk9309133a.Hash, blk9309135.Hash, blk9309136.Hash))
	assertOrphaned(t, loadBlocksByHash(t, idx.db.(*postgres.Database), blk9309132.Hash, blk9309133.Hash))
}

func TestReorgDGB2(t *testing.T) {
	idx := mockIndexer()

	bc := &mockStatefulBlockchain{
		blocksByHash:   make(map[string]*utxo.Block),
		blocksByHeight: make(map[int]*utxo.Block),
	}

	idx.bc = bc

	blockHashChan := make(chan interface{})
	txResultChan := make(chan *txResult)
	blockChan := make(chan *utxo.Block)

	go idx.syncToTip(blockChan, blockHashChan)
	go idx.writeBlock(txResultChan, blockChan)
	go idx.writeTx(txResultChan)

	// load start block
	blk9468618 := getBlockFromJSON("dgb_9468618.json", t)
	bc.setAtHeight(9468618, blk9468618)
	idx.db.InsertBlock(blk9468618, false)

	// block 9468619 hash received from zmq, node height 9468619
	blk9468619 := getBlockFromJSON("dgb_9468619.json", t)
	bc.setAtHeight(9468619, blk9468619)
	blockHashChan <- blk9468619.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	// block 9468620 hash received from zmq, node height 9468620
	blk9468620 := getBlockFromJSON("dgb_9468620.json", t)
	bc.setAtHeight(9468620, blk9468620)
	blockHashChan <- blk9468620.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	// block 9468621 hash received from zmq, node height 9468621
	blk9468621 := getBlockFromJSON("dgb_9468621.json", t)
	bc.setAtHeight(9468621, blk9468621)
	blockHashChan <- blk9468621.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	// block 9468620a hash received from zmq, node height 9468620a
	blk9468620a := getBlockFromJSON("dgb_9468620a.json", t)
	bc.setAtHeight(9468620, blk9468620a)
	blockHashChan <- blk9468620a.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	// block 9468621a hash received from zmq, node height 9468621a
	blk9468621a := getBlockFromJSON("dgb_9468621a.json", t)
	bc.setAtHeight(9468621, blk9468621a)
	blockHashChan <- blk9468621a.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	// block 9468622 hash received from zmq, node height 9468622
	blk9468622 := getBlockFromJSON("dgb_9468622.json", t)
	bc.setAtHeight(9468622, blk9468622)
	blockHashChan <- blk9468622.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	assertNotOrphaned(t, loadBlocksByHash(t, idx.db.(*postgres.Database), blk9468618.Hash, blk9468619.Hash, blk9468620.Hash, blk9468621a.Hash, blk9468622.Hash))
	assertOrphaned(t, loadBlocksByHash(t, idx.db.(*postgres.Database), blk9468620a.Hash, blk9468621.Hash))

	blk, _ := idx.db.GetBlock(9468619)
	hash := "7d59abfdcc7b2a08286f50ec8d5988ff8f92d19fee9437d325b483d46fcad9f1"

	if blk.NextHash != hash {
		t.Errorf("Expected block 9468619's next_block_hash: %s to equal block 9468620's block_hash: %s", blk.NextHash, hash)
	}
}

func TestReorgDGB3(t *testing.T) {
	idx := mockIndexer()

	bc := &mockStatefulBlockchain{
		blocksByHash:   make(map[string]*utxo.Block),
		blocksByHeight: make(map[int]*utxo.Block),
	}

	idx.bc = bc

	blockHashChan := make(chan interface{})
	txResultChan := make(chan *txResult)
	blockChan := make(chan *utxo.Block)

	go idx.syncToTip(blockChan, blockHashChan)
	go idx.writeBlock(txResultChan, blockChan)
	go idx.writeTx(txResultChan)

	// load start block
	blk9468618 := getBlockFromJSON("dgb_9468618.json", t)
	bc.setAtHeight(9468618, blk9468618)
	idx.db.InsertBlock(blk9468618, false)

	// block 9468619 hash received from zmq, node height 9468619
	blk9468619 := getBlockFromJSON("dgb_9468619.json", t)
	bc.setAtHeight(9468619, blk9468619)
	blockHashChan <- blk9468619.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	// block 9468620 hash received from zmq, node height 9468620
	blk9468620 := getBlockFromJSON("dgb_9468620.json", t)
	bc.setAtHeight(9468620, blk9468620)
	blockHashChan <- blk9468620.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	// block 9468621a hash received from zmq, node height 9468621
	blk9468621a := getBlockFromJSON("dgb_9468621a.json", t)
	bc.setAtHeight(9468621, blk9468621a)
	blockHashChan <- blk9468621a.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	// block 9468621 hash received from zmq, node height 9468621
	blk9468621 := getBlockFromJSON("dgb_9468621.json", t)
	bc.setAtHeight(9468621, blk9468621)
	blockHashChan <- blk9468621.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	// block 9468622 hash received from zmq, node height 9468622
	blk9468622 := getBlockFromJSON("dgb_9468622.json", t)
	bc.setAtHeight(9468622, blk9468622)
	blockHashChan <- blk9468622.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	assertNotOrphaned(t, loadBlocksByHash(t, idx.db.(*postgres.Database), blk9468618.Hash, blk9468619.Hash, blk9468620.Hash, blk9468621a.Hash, blk9468622.Hash))
	assertOrphaned(t, loadBlocksByHash(t, idx.db.(*postgres.Database), blk9468621.Hash))

	blk, _ := idx.db.GetBlock(9468620)
	hash := "b8b181627f1095879f3cf8d8c72569a49b353a286cb635cc4f175502ec5b1b17"

	if blk.NextHash != hash {
		t.Errorf("Expected block 9468620's next_block_hash: %s to equal block 9468621a's block_hash: %s", blk.NextHash, hash)
	}
}

func TestReorgDGB3a(t *testing.T) {
	idx := mockIndexer()

	bc := &mockStatefulBlockchain{
		blocksByHash:   make(map[string]*utxo.Block),
		blocksByHeight: make(map[int]*utxo.Block),
	}

	idx.bc = bc

	blockHashChan := make(chan interface{})
	txResultChan := make(chan *txResult)
	blockChan := make(chan *utxo.Block)

	go idx.syncToTip(blockChan, blockHashChan)
	go idx.writeBlock(txResultChan, blockChan)
	go idx.writeTx(txResultChan)

	// load start block
	blk9468618 := getBlockFromJSON("dgb_9468618.json", t)
	bc.setAtHeight(9468618, blk9468618)
	idx.db.InsertBlock(blk9468618, false)

	// block 9468619 hash received from zmq, node height 9468619
	blk9468619 := getBlockFromJSON("dgb_9468619.json", t)
	bc.setAtHeight(9468619, blk9468619)
	blockHashChan <- blk9468619.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	// block 9468620 hash received from zmq, node height 9468620
	blk9468620 := getBlockFromJSON("dgb_9468620.json", t)
	bc.setAtHeight(9468620, blk9468620)
	blockHashChan <- blk9468620.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	// block 9468621a hash received from zmq, node height 9468621
	blk9468621a := getBlockFromJSON("dgb_9468621a.json", t)
	bc.setAtHeight(9468621, blk9468621a)
	blockHashChan <- blk9468621a.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	// seed intermediate block (stale)
	blk9468621 := getBlockFromJSON("dgb_9468621.json", t)
	bc.setAtHeight(9468621, blk9468621)

	// block 9468622 hash received from zmq, node height 9468622
	blk9468622 := getBlockFromJSON("dgb_9468622.json", t)
	bc.setAtHeight(9468622, blk9468622)
	blockHashChan <- blk9468622.Hash
	time.Sleep(100 * time.Millisecond) // time to insert block into db

	// seed intermediate block (main chain)
	bc.setAtHeight(9468621, blk9468621a)

	// block 9468623 hash received from zmq, node height 9468623
	blk9468623 := getBlockFromJSON("dgb_9468623.json", t)
	bc.setAtHeight(9468623, blk9468623)
	blockHashChan <- blk9468623.Hash
	time.Sleep(200 * time.Millisecond) // time to insert block into db

	assertNotOrphaned(t, loadBlocksByHash(t, idx.db.(*postgres.Database), blk9468618.Hash, blk9468619.Hash, blk9468620.Hash, blk9468621a.Hash, blk9468622.Hash, blk9468623.Hash))
	assertOrphaned(t, loadBlocksByHash(t, idx.db.(*postgres.Database), blk9468621.Hash))

	blk, _ := idx.db.GetBlock(9468620)
	hash := "b8b181627f1095879f3cf8d8c72569a49b353a286cb635cc4f175502ec5b1b17"

	if blk.NextHash != hash {
		t.Errorf("Expected block 9468620's next_block_hash: %s to equal block 9468621a's block_hash: %s", blk.NextHash, hash)
	}
}

func assertOrphaned(t *testing.T, blocks []*utxo.Block) {
	for _, b := range blocks {
		if !b.IsOrphan {
			t.Errorf("Expected block %d, %s to be orphaned but was NOT", b.Height, b.Hash)
		}
	}
}

func assertNotOrphaned(t *testing.T, blocks []*utxo.Block) {
	for _, b := range blocks {
		if b.IsOrphan {
			t.Errorf("Expected block %d, %s to be NOT orphaned but was", b.Height, b.Hash)
		}
	}
}

// reload blocks from the database by hash
func loadBlocksByHash(t *testing.T, conn *postgres.Database, hashes ...string) []*utxo.Block {
	blocks := make([]*utxo.Block, 0)
	for _, n := range hashes {
		b, err := conn.GetBlock(n)
		if err != nil {
			t.Fatalf("unable to fetch block %s from db", n)
			continue
		}
		blocks = append(blocks, b)
	}
	return blocks
}
