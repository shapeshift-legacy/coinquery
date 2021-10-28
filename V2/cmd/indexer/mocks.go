package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"testing"

	"github.com/shapeshift-legacy/coinquery/V2/pkg/blockchain/utxo"
)

// Path to json mock data for integration testing
var baseMockPath = "../../pkg/postgres/testdata/"

func getBlockFromJSON(fn string, t *testing.T) *utxo.Block {
	file, err := ioutil.ReadFile(baseMockPath + fn)
	if err != nil {
		t.Fatal(err)
	}

	var block utxo.Block
	json.Unmarshal(file, &block)

	return &block
}

// Mock blockchain implementation with mutable block "state" useful in testing forks.
// Edit which blocks are returned by the internal maps to simulate different network state
type mockStatefulBlockchain struct {
	currentHeight  int
	blocksByHash   map[string]*utxo.Block
	blocksByHeight map[int]*utxo.Block
}

// implements indexer.Blockchain
func (m *mockStatefulBlockchain) GetBlocks(val interface{}) ([]*utxo.Block, error) {
	switch v := val.(type) {
	case []int:
		if b, ok := m.blocksByHeight[v[0]]; ok {
			return []*utxo.Block{b}, nil
		}
	case []string:
		if b, ok := m.blocksByHash[v[0]]; ok {
			return []*utxo.Block{b}, nil
		}
	}
	return []*utxo.Block{}, errors.New(fmt.Sprintf("No block for val: %v", val))
}

// implements indexer.Blockchain
func (m *mockStatefulBlockchain) setAtHeight(h int, b *utxo.Block) {
	m.currentHeight = h
	m.blocksByHeight[h] = b
}

// implements indexer.Blockchain
func (m *mockStatefulBlockchain) GetChainInfo() (*utxo.ChainInfo, error) {
	return &utxo.ChainInfo{Blocks: m.currentHeight}, nil
}

// implements indexer.Blockchain
func (m *mockStatefulBlockchain) GetMempool() ([]string, error) {
	return []string{}, nil
}

// implements indexer.Blockchain
func (m *mockStatefulBlockchain) GetRawTransactions(txids []string) ([]*utxo.Tx, error) {
	return []*utxo.Tx{}, nil
}

type mockBlockchain struct {
	getBlocksFunc          func(val interface{}) ([]*utxo.Block, error)
	getChainInfoFunc       func() (*utxo.ChainInfo, error)
	getMempoolFunc         func() ([]string, error)
	getRawTransactionsFunc func(txids []string) ([]*utxo.Tx, error)
}

func newMockBlockchain(mock *mockBlockchain) *mockBlockchain {
	getBlocks := func(val interface{}) ([]*utxo.Block, error) {
		var blocks []*utxo.Block
		switch val.(type) {
		case []int:
			for _, v := range val.([]int) {
				blocks = append(blocks, &utxo.Block{BlockHeader: utxo.BlockHeader{Height: v}})
			}
		case []string:
			for _, v := range val.([]string) {
				blocks = append(blocks, &utxo.Block{BlockHeader: utxo.BlockHeader{Hash: v}})
			}
		}
		return blocks, nil
	}
	getChainInfo := func() (*utxo.ChainInfo, error) {
		return &utxo.ChainInfo{Blocks: 9}, nil
	}
	getMempool := func() ([]string, error) {
		return []string{"1", "2", "3"}, nil
	}
	getRawTransactions := func(txids []string) ([]*utxo.Tx, error) {
		var txs []*utxo.Tx
		for _, t := range txids {
			txs = append(txs, &utxo.Tx{TxID: t})
		}
		return txs, nil
	}

	if mock != nil {
		if mock.getBlocksFunc != nil {
			getBlocks = mock.getBlocksFunc
		}
		if mock.getChainInfoFunc != nil {
			getChainInfo = mock.getChainInfoFunc
		}
		if mock.getMempoolFunc != nil {
			getMempool = mock.getMempoolFunc
		}
		if mock.getRawTransactionsFunc != nil {
			getRawTransactions = mock.getRawTransactionsFunc
		}
	}

	return &mockBlockchain{
		getBlocksFunc:          getBlocks,
		getChainInfoFunc:       getChainInfo,
		getMempoolFunc:         getMempool,
		getRawTransactionsFunc: getRawTransactions,
	}
}

func (m *mockBlockchain) GetBlocks(val interface{}) ([]*utxo.Block, error) {
	return m.getBlocksFunc(val)
}

func (m *mockBlockchain) GetChainInfo() (*utxo.ChainInfo, error) {
	return m.getChainInfoFunc()
}

func (m *mockBlockchain) GetMempool() ([]string, error) {
	return m.getMempoolFunc()
}

func (m *mockBlockchain) GetRawTransactions(txids []string) ([]*utxo.Tx, error) {
	return m.getRawTransactionsFunc(txids)
}

type mockPostgres struct {
	insertBlockFunc func(b *utxo.Block, recover bool) (int, error)
	lastBlockFunc   func() (*utxo.Block, error)
	getBlockFunc    func(val interface{}) (*utxo.Block, error)
	insertTxFunc    func(tx *utxo.Tx, txIndex int, blockId int) error
}

func newMockPostgres(mock *mockPostgres) *mockPostgres {
	insertBlock := func(b *utxo.Block, recover bool) (int, error) {
		return 0, nil
	}
	lastBlock := func() (*utxo.Block, error) {
		return &utxo.Block{BlockHeader: utxo.BlockHeader{Height: 69}}, nil
	}
	getBlock := func(val interface{}) (*utxo.Block, error) {
		return &utxo.Block{BlockHeader: utxo.BlockHeader{Height: 69}}, nil
	}
	insertTx := func(tx *utxo.Tx, txIndex int, blockId int) error {
		return nil
	}

	if mock != nil {
		if mock.insertBlockFunc != nil {
			insertBlock = mock.insertBlockFunc
		}
		if mock.lastBlockFunc != nil {
			lastBlock = mock.lastBlockFunc
		}
		if mock.getBlockFunc != nil {
			getBlock = mock.getBlockFunc
		}
		if mock.insertTxFunc != nil {
			insertTx = mock.insertTxFunc
		}
	}

	return &mockPostgres{
		insertBlockFunc: insertBlock,
		lastBlockFunc:   lastBlock,
		getBlockFunc:    getBlock,
		insertTxFunc:    insertTx,
	}
}

func (m *mockPostgres) InsertBlock(b *utxo.Block, recover bool) (int, error) {
	return m.insertBlockFunc(b, recover)
}
func (m *mockPostgres) LastBlock() (*utxo.Block, error) {
	return m.lastBlockFunc()
}
func (m *mockPostgres) GetBlock(val interface{}) (*utxo.Block, error) {
	return m.getBlockFunc(val)
}
func (m *mockPostgres) InsertTx(tx *utxo.Tx, txIndex int, blockId int) error {
	return m.insertTxFunc(tx, txIndex, blockId)
}
func (m *mockPostgres) Close() error {
	return nil
}
