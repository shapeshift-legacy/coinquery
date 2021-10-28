// +build integration

package postgres

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"strings"
	"testing"
	"time"

	_ "github.com/lib/pq"
	"github.com/pkg/errors"
	"github.com/shapeshift-legacy/coinquery/V2/config"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/blockchain/utxo"
)

var db *Database

func cleanDatabase() error {
	db.timeout = 3 * time.Second

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
		URI:    "postgres://indexer@localhost:5432/indexer?sslmode=disable",
		BaseDB: config.BaseDB{MaxConns: 1},
	}

	db, err = New(conf, "btc")
	if err != nil {
		log.Fatal(err)
	}

	cleanDatabase()
	result := m.Run()
	cleanDatabase()

	os.Exit(result)
}

func getBlockFromJSON(path string, t *testing.T) *utxo.Block {
	file, err := ioutil.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}

	var block utxo.Block
	json.Unmarshal(file, &block)

	return &block
}

func TestDatabase_LastBlock(t *testing.T) {
	cleanDatabase()

	// It should return a nil error and nil block
	b, err := db.LastBlock()
	if err != nil {
		t.Errorf("LastBlock() = %v, want %v", err, nil)
	}
	if b != nil {
		t.Errorf("LastBlock() = %v, want %v", b, nil)
	}

	// Test with 1 block inserted
	_, err = db.InsertBlock(&utxo.Block{
		BlockHeader: utxo.BlockHeader{
			Height:   0,
			Hash:     "Hash0",
			PrevHash: "PrevHash0",
		},
	}, false)
	if err != nil {
		t.Fatalf("InsertBlock() = %v, want %v", err, nil)
	}

	b, err = db.LastBlock()
	if err != nil {
		t.Fatalf("LastBlock() = %v, want %v", err, nil)
	}

	if b.Height != 0 {
		t.Errorf("LastBlock() = %v, want %v", b.Height, 0)
	}

	// Test with 4 blocks inserted
	for i := 1; i < 4; i++ {
		_, err = db.InsertBlock(&utxo.Block{
			BlockHeader: utxo.BlockHeader{
				Height:   i,
				Hash:     fmt.Sprintf("Hash%v", i),
				PrevHash: fmt.Sprintf("Hash%v", i-1),
			},
		}, false)
		if err != nil {
			t.Fatalf("InsertBlock() = %v, want %v", err, nil)
		}
	}

	b, err = db.LastBlock()
	if err != nil {
		t.Fatalf("LastBlock() = %v, want %v", err, nil)
	}

	if b.Height != 3 {
		t.Errorf("LastBlock() = %v, want %v", b.Height, 3)
	}

}

func TestDatabase_Timeout(t *testing.T) {
	cleanDatabase()

	// Make the timeout too short to be completable in time
	db.timeout = 1 * time.Nanosecond

	// It should return "context deadline exceeded"
	_, err := db.InsertBlock(&utxo.Block{
		BlockHeader: utxo.BlockHeader{
			Height:   0,
			Hash:     "Hash0",
			PrevHash: "PrevHash0",
		},
	}, false)
	if err == nil || !strings.Contains(err.Error(), "context deadline exceeded") {
		t.Fatalf("Query should have timed out but didnt %s", err)
	}
}

func TestDatabase_GetBlock(t *testing.T) {
	cleanDatabase()

	// Test without any data in the database
	// It should return a sql.ErrNoRows
	_, err := db.GetBlock(0)
	if errors.Cause(err) != sql.ErrNoRows {
		t.Errorf("GetBlock() = %v, want %v", err, sql.ErrNoRows)
	}

	_, err = db.InsertBlock(&utxo.Block{
		BlockHeader: utxo.BlockHeader{
			Height:   0,
			Hash:     "Hash0",
			PrevHash: "PrevHash0",
		},
	}, false)
	if err != nil {
		t.Fatalf("InsertBlock() = %v, want %v", err, nil)
	}

	// Test with 1 block inserted
	b, err := db.GetBlock(0)
	if err != nil {
		t.Fatalf("GetBlock(%v) = %v, want %v", 0, err, nil)
	}

	if b.Height != 0 {
		t.Errorf("GetBlock(%v) = %v, want %v", 0, b.Height, 0)
	}

	// Test with 4 blocks inserted
	for i := 1; i < 4; i++ {
		_, err = db.InsertBlock(&utxo.Block{
			BlockHeader: utxo.BlockHeader{
				Height:   i,
				Hash:     fmt.Sprintf("Hash%v", i),
				PrevHash: fmt.Sprintf("Hash%v", i-1),
			},
		}, false)
		if err != nil {
			t.Fatalf("InsertBlock() = %v, want %v", err, nil)
		}
	}

	b, err = db.GetBlock(3)
	if err != nil {
		t.Fatalf("GetBlock(%v) = %v, want %v", 3, err, nil)
	}

	if b.Height != 3 {
		t.Errorf("GetBlock(%v) = %v, want %v", 3, b.Height, 3)
	}

	// Test using block hash
	b, err = db.GetBlock("Hash2")
	if err != nil {
		t.Fatalf("GetBlock(%v) = %v, want %v", "Hash2", err, nil)
	}

	if b.Hash != "Hash2" {
		t.Errorf("GetBlock(%v) = %v, want %v", 0, b.Hash, "Hash2")
	}
}

func TestDatabase_GetUtxosByAddrs(t *testing.T) {
	cleanDatabase()

	// Test with nothing in DB
	outputs, err := db.GetUtxosByAddrs([]string{"nothing in here"})
	if err != nil {
		t.Errorf("GetUtxosByAddrs() = %v, want %v", err, nil)
	}

	if len(outputs) != 0 {
		t.Errorf("GetUtxosByAddrs() = %v, want %v", len(outputs), 0)
	}

	// Test with 1 unspent output for address 1EYTGtG4LnFfiMvjJdsU7GMGCQvsRSjYhx.
	blk := getBlockFromJSON("./testdata/blk_100000_tx_fff252.json", t)

	id, err := db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}

	err = db.InsertTx(&blk.Txs[0], 0, id)
	if err != nil {
		t.Fatal(err)
	}

	addr := "1EYTGtG4LnFfiMvjJdsU7GMGCQvsRSjYhx"
	outputs, err = db.GetUtxosByAddrs([]string{addr})
	if err != nil {
		t.Errorf("GetUtxosByAddrs(%v) = %v, want %v", addr, err, nil)
	}

	if len(outputs) != 1 {
		t.Errorf("GetUtxosByAddrs(%v) = %v, want %v", addr, len(outputs), 1)
	}

	// Test with 2 addresses:
	// 1 unspent output for address 1EYTGtG4LnFfiMvjJdsU7GMGCQvsRSjYhx
	// 1 unspent output for address 1JqDybm2nWTENrHvMyafbSXXtTk5Uv5QAn
	addr1 := "1EYTGtG4LnFfiMvjJdsU7GMGCQvsRSjYhx"
	addr2 := "1JqDybm2nWTENrHvMyafbSXXtTk5Uv5QAn"

	outputs, err = db.GetUtxosByAddrs([]string{addr1, addr2})
	if err != nil {
		t.Errorf("GetUtxosByAddrs(%v) = %v, want %v", addr, err, nil)
	}

	if len(outputs) != 2 {
		t.Errorf("GetUtxosByAddrs(%v) = %v, want %v", addr, len(outputs), 1)
	}

	// Test spending output from address 1EYTGtG4LnFfiMvjJdsU7GMGCQvsRSjYhx.
	// Result should be 0 because output is spent.
	// We have to insert blocks in order because otherwise they will be orphaned.
	// Postgress will error with bad block hash.
	blk = getBlockFromJSON("./testdata/blk_100001_no_txs.json", t)

	_, err = db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}
	blk = getBlockFromJSON("./testdata/blk_100002_tx_220ebc.json", t)

	id, err = db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}

	err = db.InsertTx(&blk.Txs[0], 0, id)
	if err != nil {
		t.Fatal(err)
	}

	addr = "1EYTGtG4LnFfiMvjJdsU7GMGCQvsRSjYhx"
	outputs, err = db.GetUtxosByAddrs([]string{addr})
	if err != nil {
		t.Errorf("GetUtxosByAddrs(%v) = %v, want %v", addr, err, nil)
	}

	if len(outputs) != 0 {
		t.Errorf("GetUtxosByAddrs(%v) = %v, want %v", addr, len(outputs), 0)
	}
}

func TestDatabase_GetOutputsByTxID(t *testing.T) {
	cleanDatabase()

	// Test without anything in DB
	outputs, err := db.GetOutputsByTxID("nothing in here", "")
	if err != nil {
		t.Errorf("GetOutputsByTxID() = %v, want %v", err, nil)
	}

	if len(outputs) != 0 {
		t.Errorf("GetOutputsByTxID() = %v, want %v", len(outputs), 0)
	}
	// Test with 1 transaction 2 outputs
	blk := getBlockFromJSON("./testdata/blk_100000_tx_fff252.json", t)

	id, err := db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}

	err = db.InsertTx(&blk.Txs[0], 0, id)
	if err != nil {
		t.Fatal(err)
	}

	txid := "fff2525b8931402dd09222c50775608f75787bd2b87e56995a7bdd30f79702c4"
	outputs, err = db.GetOutputsByTxID(txid, "")
	if err != nil {
		t.Errorf("GetOutputsByTxID(%v) = %v, want %v", txid, err, nil)
	}

	if len(outputs) != 2 {
		t.Errorf("GetOutputsByTxID(%v) = %v, want %v", txid, len(outputs), 2)
	}
}

func TestDatabase_GetTxIDsByAddresses(t *testing.T) {
	cleanDatabase()

	// Test with nothing in DB
	outputs, err := db.GetTxIDsByAddresses([]string{"nothing in here"}, "", "", "")
	if err != nil {
		t.Errorf("GetTxIDsByAddresses() = %v, want %v", err, nil)
	}

	if len(outputs) != 0 {
		t.Errorf("GetTxIDsByAddresses() = %v, want %v", len(outputs), 0)
	}

	// Test with 1 transactions
	blk := getBlockFromJSON("./testdata/blk_100000_tx_fff252.json", t)

	id, err := db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}

	err = db.InsertTx(&blk.Txs[0], 0, id)
	if err != nil {
		t.Fatal(err)
	}

	addr1 := "1EYTGtG4LnFfiMvjJdsU7GMGCQvsRSjYhx"
	txs, err := db.GetTxIDsByAddresses([]string{addr1}, "", "", "")
	if err != nil {
		t.Errorf("GetTxIDsByAddresses(%v) = %v, want %v", addr1, err, nil)
	}

	if len(txs) != 1 {
		t.Errorf("GetTxIDsByAddresses(%v) = %v, want %v", addr1, len(txs), 1)
	}

	// Insert block 100001
	blk = getBlockFromJSON("./testdata/blk_100001_no_txs.json", t)
	_, err = db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}

	// Test with 2 transactions
	blk = getBlockFromJSON("./testdata/blk_100002_tx_220ebc.json", t)
	id, err = db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}

	err = db.InsertTx(&blk.Txs[0], 0, id)
	if err != nil {
		t.Fatal(err)
	}

	addr2 := "145crWADs13RVdAQFz1PHxV8FuifFtPBGi"
	txs, err = db.GetTxIDsByAddresses([]string{addr1, addr2}, "", "", "")
	if err != nil {
		t.Errorf("GetTxIDsByAddresses(%v, %v) = %v, want %v", addr1, addr2, err, nil)
	}

	if len(txs) != 2 {
		t.Errorf("GetTxIDsByAddresses(%v, %v) = %v, want %v", addr1, addr2, len(txs), 1)
	}
}

func TestDatabase_GetTxByTxID(t *testing.T) {
	cleanDatabase()

	// Test with nothing in DB
	tx, err := db.GetTxByTxID("nothing in here")
	if errors.Cause(err) != sql.ErrNoRows {
		t.Errorf("GetTXByTXID() = %v, want %v", err, sql.ErrNoRows)
	}

	// Test with 1 unspent output for address 1EYTGtG4LnFfiMvjJdsU7GMGCQvsRSjYhx.
	blk := getBlockFromJSON("./testdata/blk_100000_tx_fff252.json", t)

	id, err := db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}

	err = db.InsertTx(&blk.Txs[0], 0, id)
	if err != nil {
		t.Fatal(err)
	}

	txid := "fff2525b8931402dd09222c50775608f75787bd2b87e56995a7bdd30f79702c4"
	tx, err = db.GetTxByTxID(txid)
	if err != nil {
		t.Errorf("GetTxByTxID(%v) = %v, want %v", txid, err, nil)
	}

	if tx.TxID != txid {
		t.Errorf("GetTxByTxID(%v) = %v, want %v", txid, tx.TxID, txid)
	}
}

func TestDatabase_GetRawTxByTxID(t *testing.T) {
	cleanDatabase()

	// Test with nothing in DB
	_, err := db.GetRawTxByTxID("nothing in here")
	if errors.Cause(err) != sql.ErrNoRows {
		t.Errorf("GetRawTxByTxID() = %v, want %v", err, sql.ErrNoRows)
	}

	blk := getBlockFromJSON("./testdata/blk_100000_tx_fff252.json", t)

	id, err := db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}

	err = db.InsertTx(&blk.Txs[0], 0, id)
	if err != nil {
		t.Fatal(err)
	}

	txid := "fff2525b8931402dd09222c50775608f75787bd2b87e56995a7bdd30f79702c4"
	hex := "0100000001032e38e9c0a84c6046d687d10556dcacc41d275ec55fc00779ac88fdf357a187000000008c493046022100c352d3dd993a981beba4a63ad15c209275ca9470abfcd57da93b58e4eb5dce82022100840792bc1f456062819f15d33ee7055cf7b5ee1af1ebcc6028d9cdb1c3af7748014104f46db5e9d61a9dc27b8d64ad23e7383a4e6ca164593c2527c038c0857eb67ee8e825dca65046b82c9331586c82e0fd1f633f25f87c161bc6f8a630121df2b3d3ffffffff0200e32321000000001976a914c398efa9c392ba6013c5e04ee729755ef7f58b3288ac000fe208010000001976a914948c765a6914d43f2a7ac177da2c2f6b52de3d7c88ac00000000"
	rawTx, err := db.GetRawTxByTxID(txid)
	if err != nil {
		t.Errorf("GetRawTxByTxID(%v) = %v, want %v", txid, err, nil)
	}

	if rawTx.Hex != hex {
		t.Errorf("GetRawTxByTxID(%v) = %v, want %v", txid, hex, rawTx.Hex)
	}
}

func validateBlocks(validate func(b *utxo.Block) bool, blocks []*utxo.Block) []*utxo.Block {
	failures := make([]*utxo.Block, 0)
	for _, b := range blocks {
		if !validate(b) {
			failures = append(failures, b)
		}
	}
	return failures
}

// reload blocks from the database by hash
func loadBlocksByHash(t *testing.T, conn *Database, hashes ...string) []*utxo.Block {
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

func TestDatabase_ReorgTripleFork(t *testing.T) {
	cleanDatabase()

	// insert root then block A and B
	// insert A' and B'
	// insert A'' and B''
	// insert C'
	// insert C
	// Expect A', B', C', A'', B'' to be orphaned

	blk := getBlockFromJSON("./testdata/blk_reorg_10.json", t)
	h10 := blk.Hash
	_, err := db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}
	blk = getBlockFromJSON("./testdata/blk_reorg_11.json", t)
	h11 := blk.Hash
	_, err = db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}
	blk = getBlockFromJSON("./testdata/blk_reorg_12.json", t)
	h12 := blk.Hash
	_, err = db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}
	assertNotOrphaned(t, loadBlocksByHash(t, db, h10, h11, h12))

	// insert new block at same height as current tip
	blk = getBlockFromJSON("./testdata/blk_reorg_12a.json", t)
	h12a := blk.Hash
	_, err = db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}
	blk = getBlockFromJSON("./testdata/blk_reorg_11a.json", t)
	h11a := blk.Hash
	_, err = db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}
	assertNotOrphaned(t, loadBlocksByHash(t, db, h10, h11a))
	assertOrphaned(t, loadBlocksByHash(t, db, h11, h12, h12a))

	// third fork
	blk = getBlockFromJSON("./testdata/blk_reorg_12b.json", t)
	h12b := blk.Hash
	_, err = db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}
	blk = getBlockFromJSON("./testdata/blk_reorg_11b.json", t)
	h11b := blk.Hash
	_, err = db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}
	assertNotOrphaned(t, loadBlocksByHash(t, db, h10, h11b))
	assertOrphaned(t, loadBlocksByHash(t, db, h11, h11a, h12, h12a, h12b))

	// add new tip to fork chain
	blk = getBlockFromJSON("./testdata/blk_reorg_13a.json", t)
	h13a := blk.Hash
	_, err = db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}
	assertNotOrphaned(t, loadBlocksByHash(t, db, h10, h11a, h12a, h13a))
	assertOrphaned(t, loadBlocksByHash(t, db, h11, h12, h11b, h12b))

	// add new tip to original chain. Original chain should be un-orphaned
	blk = getBlockFromJSON("./testdata/blk_reorg_13.json", t)
	h13 := blk.Hash
	_, err = db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}
	assertNotOrphaned(t, loadBlocksByHash(t, db, h10, h11, h12, h13))
	assertOrphaned(t, loadBlocksByHash(t, db, h11a, h11b, h12a, h12b, h13a))
}

func TestDatabase_ReorgForkNewTip(t *testing.T) {
	cleanDatabase()

	// insert block A then insert B
	// insert C' and B' and D' then C
	// Expect A, B', C', D' to be not orphaned
	// Expect B to be orphaned
	// Expect C to be rejected and not inserted

	blk := getBlockFromJSON("./testdata/blk_reorg_10.json", t)
	h10 := blk.Hash
	_, err := db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}
	blk = getBlockFromJSON("./testdata/blk_reorg_11.json", t)
	h11 := blk.Hash
	_, err = db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}
	assertNotOrphaned(t, loadBlocksByHash(t, db, h10, h11))

	// insert new block above the tip with a different hash
	// the stored procedure will orphan the blocks on the non-fork side
	blk = getBlockFromJSON("./testdata/blk_reorg_12a.json", t)
	h12a := blk.Hash
	_, err = db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}
	assertNotOrphaned(t, loadBlocksByHash(t, db, h10))
	assertOrphaned(t, loadBlocksByHash(t, db, h11, h12a))

	// fill in gap on fork side
	blk = getBlockFromJSON("./testdata/blk_reorg_11a.json", t)
	h11a := blk.Hash
	_, err = db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}
	assertNotOrphaned(t, loadBlocksByHash(t, db, h10, h11a))
	assertOrphaned(t, loadBlocksByHash(t, db, h11, h12a))

	// add new tip on fork side. Entire fork side should be not orphaned
	blk = getBlockFromJSON("./testdata/blk_reorg_13a.json", t)
	h13a := blk.Hash
	_, err = db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}
	assertNotOrphaned(t, loadBlocksByHash(t, db, h10, h11a, h12a, h13a))
	assertOrphaned(t, loadBlocksByHash(t, db, h11))

	// add new pre-fork block below fork tip. Postgres should refuse to insert
	// because it is below the highest non-orphaned block
	blk = getBlockFromJSON("./testdata/blk_reorg_12.json", t)
	_, err = db.InsertBlock(blk, false)
	if err == nil {
		t.Fatalf("Expected block %v to fail to insert but succeeded", blk)
	}
	assertNotOrphaned(t, loadBlocksByHash(t, db, h10, h11a, h12a, h13a))
	assertOrphaned(t, loadBlocksByHash(t, db, h11))
}

func TestDatabase_ReorgForkSameHeight(t *testing.T) {
	cleanDatabase()

	// insert block A then insert B then B'
	// Expect A and B' to be not orphaned
	// Expect B to be orphaned

	blk := getBlockFromJSON("./testdata/blk_reorg_10.json", t)
	h10 := blk.Hash
	_, err := db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}
	blk = getBlockFromJSON("./testdata/blk_reorg_11.json", t)
	h11 := blk.Hash
	_, err = db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}
	assertNotOrphaned(t, loadBlocksByHash(t, db, h10, h11))

	// insert new block also at the tip with a different hash
	blk = getBlockFromJSON("./testdata/blk_reorg_11a.json", t)
	h11a := blk.Hash
	_, err = db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}
	assertNotOrphaned(t, loadBlocksByHash(t, db, h10, h11a))
	assertOrphaned(t, loadBlocksByHash(t, db, h11))
}

func TestDatabase_ReorgSkipBlock(t *testing.T) {
	cleanDatabase()

	// insert block X then insert X + 2
	// expected that the newest block is marked as orphaned
	// because we are missing an intermediate block
	blk := getBlockFromJSON("./testdata/blk_reorg_10.json", t)
	h10 := blk.Hash

	_, err := db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}
	blk = getBlockFromJSON("./testdata/blk_reorg_12.json", t)
	h12 := blk.Hash
	_, err = db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}
	assertNotOrphaned(t, loadBlocksByHash(t, db, h10))
	assertOrphaned(t, loadBlocksByHash(t, db, h12))

	// insert a new block on top of the orphaned tip. Both should be orphaned
	blk = getBlockFromJSON("./testdata/blk_reorg_13.json", t)
	h13 := blk.Hash
	_, err = db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}
	assertNotOrphaned(t, loadBlocksByHash(t, db, h10))
	assertOrphaned(t, loadBlocksByHash(t, db, h12, h13))

	// insert missing block
	// everything below the missing block should not be orphaned
	// everything above should still be orphaned
	blk = getBlockFromJSON("./testdata/blk_reorg_11.json", t)
	h11 := blk.Hash
	_, err = db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}
	assertOrphaned(t, loadBlocksByHash(t, db, h12, h13))
	assertNotOrphaned(t, loadBlocksByHash(t, db, h10, h11))

	// re-add the tip block and everything should not be orphaned
	blk = getBlockFromJSON("./testdata/blk_reorg_14.json", t)
	h14 := blk.Hash
	_, err = db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}
	assertNotOrphaned(t, loadBlocksByHash(t, db, h10, h11, h12, h13, h14))

}

func TestDatabase_GetInputsByTxID(t *testing.T) {
	cleanDatabase()

	// Test with nothing in DB
	inputs, err := db.GetInputsByTxID("nothing in here")
	if err != nil {
		t.Errorf("GetInputsByTxID() = %v, want %v", err, nil)
	}

	if len(inputs) != 0 {
		t.Errorf("GetTXIDsByAddress() = %v, want %v", len(inputs), 0)
	}

	// Test with 1 unspent output for address 1EYTGtG4LnFfiMvjJdsU7GMGCQvsRSjYhx.
	blk := getBlockFromJSON("./testdata/blk_100002_tx_220ebc.json", t)

	id, err := db.InsertBlock(blk, false)
	if err != nil {
		t.Fatal(err)
	}

	err = db.InsertTx(&blk.Txs[0], 0, id)
	if err != nil {
		t.Fatal(err)
	}

	txid := "220ebc64e21abece964927322cba69180ed853bb187fbc6923bac7d010b9d87a"
	inputs, err = db.GetInputsByTxID(txid)
	if err != nil {
		t.Errorf("GetInputsByTxID(%v) = %v, want %v", txid, err, nil)
	}

	if len(inputs) != 2 {
		t.Errorf("GetInputsByTxID(%v) = %v, want %v", txid, len(inputs), 2)
	}
}
