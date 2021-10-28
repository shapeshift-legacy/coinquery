// +build unit

package main

import (
	_ "net/http/pprof"
	"os"
	"reflect"
	"sync"
	"testing"
	"time"

	"github.com/shapeshift-legacy/coinquery/V2/pkg/blockchain/utxo"
)

func TestMain(m *testing.M) {
	os.Exit(m.Run())
}

// doneTimeout is a helper function which will send a timeout signal if the waitgroup
// wait doesn't complete before "timeout".
func doneTimeout(wg *sync.WaitGroup, timeout time.Duration) <-chan bool {
	t := make(chan bool, 1)
	go func() { time.Sleep(timeout * time.Second); t <- true }()
	go func() { wg.Wait(); t <- false }()
	return t
}

// TODO decide if this even needs to be tested. Considering it modifies
// global state it seems hard to test to me
func TestIndexer_setStartBlock(t *testing.T) {
	type fields struct {
		startBlock int
		db         Database
		syncTip    bool
	}
	tests := []struct {
		name   string
		fields fields
		want   int
	}{
		{
			name: "SyncTip true",
			fields: fields{
				startBlock: 0,
				db:         newMockPostgres(nil),
				syncTip:    true,
			},
			want: 69,
		},
		{
			name: "SyncTip true, Database error",
			fields: fields{
				startBlock: 10,
				db: newMockPostgres(&mockPostgres{
					lastBlockFunc: func() (*utxo.Block, error) {
						return nil, nil
					},
				}),
				syncTip: true,
			},
			want: 0,
		},
		{
			name: "SyncTip false",
			fields: fields{
				startBlock: 9,
				db:         newMockPostgres(nil),
				syncTip:    false,
			},
			want: 9,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			idxr := &Indexer{
				startBlock: tt.fields.startBlock,
				syncTip:    tt.fields.syncTip,
				db:         tt.fields.db,
			}

			idxr.setStartBlock()
			got := idxr.startBlock

			if tt.want != got {
				t.Errorf("setStartBlock() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestIndexer_setEndBlock(t *testing.T) {
	type fields struct {
		endBlock int
		bc       Blockchain
		syncTip  bool
	}
	tests := []struct {
		name   string
		fields fields
		want   int
	}{
		{
			name: "SyncTip true",
			fields: fields{
				endBlock: 5,
				bc:       newMockBlockchain(nil),
				syncTip:  true,
			},
			want: 9,
		},
		{
			name: "SyncTip false",
			fields: fields{
				endBlock: 5,
				bc:       newMockBlockchain(nil),
				syncTip:  false,
			},
			want: 5,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			idxr := &Indexer{
				endBlock: tt.fields.endBlock,
				syncTip:  tt.fields.syncTip,
				bc:       tt.fields.bc,
			}

			idxr.setEndBlock()
			got := idxr.endBlock

			if tt.want != got {
				t.Errorf("setEndBlock() = %v, want %v", got, tt.want)
			}
		})
	}
}

//func TestIndexer_processMempool(t *testing.T) {
//	type fields struct {
//		bc       Blockchain
//		doneChan chan struct{}
//		errChan  chan error
//	}
//	tests := []struct {
//		name   string
//		fields fields
//		want   [][]string
//	}{
//		{
//			name: "Success",
//			fields: fields{
//				bc:       newMockBlockchain(nil),
//				doneChan: nil,
//				errChan:  nil,
//			},
//			want: [][]string{[]string{"1"}, []string{"2"}, []string{"3"}},
//		},
//	}
//	for _, tt := range tests {
//		t.Run(tt.name, func(t *testing.T) {
//			idxr := &Indexer{
//				bc:       tt.fields.bc,
//				doneChan: tt.fields.doneChan,
//				errChan:  tt.fields.errChan,
//			}
//
//			gotChan := make(chan []string)
//			go idxr.processMempool(gotChan)
//
//			got := [][]string{}
//			for g := range gotChan {
//				got = append(got, g)
//			}
//
//			if !reflect.DeepEqual(tt.want, got) {
//				t.Errorf("processMempool() = %v, want %v", got, tt.want)
//			}
//		})
//	}
//}

func TestIndexer_processBlockHeights(t *testing.T) {
	type fields struct {
		bc         Blockchain
		syncTip    bool
		startBlock int
		endBlock   int
		batchSize  int
		doneChan   chan struct{}
	}
	tests := []struct {
		name   string
		fields fields
		want   [][]int
	}{
		{
			name: "Success",
			fields: fields{
				bc:         newMockBlockchain(nil),
				syncTip:    false,
				startBlock: 0,
				endBlock:   4,
				batchSize:  2,
				doneChan:   nil,
			},
			want: [][]int{[]int{0, 1}, []int{2, 3}, []int{4}},
		},
		{
			name: "Update End Blocks",
			fields: fields{
				bc:         newMockBlockchain(nil),
				syncTip:    true,
				startBlock: 0,
				endBlock:   8,
				batchSize:  3,
				doneChan:   nil,
			},
			want: [][]int{[]int{0, 1, 2}, []int{3, 4, 5}, []int{6, 7, 8}, []int{9}},
		},
		{
			name: "Done Case",
			fields: fields{
				bc:         newMockBlockchain(nil),
				syncTip:    false,
				startBlock: 0,
				endBlock:   20,
				batchSize:  10,
				doneChan:   make(chan struct{}),
			},
			want: [][]int{[]int{0, 1, 2, 3, 4, 5, 6, 7, 8, 9}},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			idxr := &Indexer{
				bc:         tt.fields.bc,
				syncTip:    tt.fields.syncTip,
				startBlock: tt.fields.startBlock,
				endBlock:   tt.fields.endBlock,
				batchSize:  tt.fields.batchSize,
				doneChan:   tt.fields.doneChan,
			}

			got := [][]int{}
			gotChan := make(chan interface{})
			go idxr.processBlockHeights(gotChan)

			// test done channel if it is not nil
			if idxr.doneChan != nil {
				if g, ok := <-gotChan; ok {
					got = append(got, g.([]int))
				}
				close(idxr.doneChan)
				time.Sleep(200 * time.Millisecond)
				if g, ok := <-gotChan; ok {
					got = append(got, g.([]int))
				}
			}

			for g := range gotChan {
				got = append(got, g.([]int))
			}

			if !reflect.DeepEqual(tt.want, got) {
				t.Errorf("processBlockHeights() = %v, want %v", got, tt.want)
			}
		})
	}
}

// TestIndexer_getBlocks tests that when given blockHeights into the val channel
// it will return an array containing that number of blocks with their block info
func TestIndexer_getBlocks(t *testing.T) {
	type fields struct {
		bc       Blockchain
		doneChan chan struct{}
	}
	type args struct {
		blocks chan []*utxo.Block
		val    chan interface{}
	}
	tests := []struct {
		name         string
		fields       fields
		args         args
		pipelineSeed []int
	}{
		{
			name: "Success",
			fields: fields{
				bc:       newMockBlockchain(nil),
				doneChan: nil,
			},
			args: args{
				blocks: make(chan []*utxo.Block),
				val:    make(chan interface{}),
			},
			pipelineSeed: []int{1, 2, 3},
		},
		{
			name: "Done Case",
			fields: fields{
				bc:       newMockBlockchain(nil),
				doneChan: make(chan struct{}),
			},
			args: args{
				blocks: make(chan []*utxo.Block),
				val:    make(chan interface{}),
			},
			pipelineSeed: []int{1, 2, 3},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			idxr := &Indexer{
				bc:       tt.fields.bc,
				doneChan: tt.fields.doneChan,
			}

			go func() { tt.args.val <- tt.pipelineSeed }()

			var wg sync.WaitGroup
			wg.Add(1)
			go func() {
				idxr.getBlocks(tt.args.blocks, tt.args.val)
				wg.Done()
			}()

			// test done channel if it is not nil
			if idxr.doneChan != nil {
				close(idxr.doneChan)
				timeout := doneTimeout(&wg, 2)

				select {
				case to := <-timeout:
					if to {
						t.Error("Closing done channel did not kill process before timeout")
					}
					return
				}
			}

			want := len(tt.pipelineSeed)
			got := len(<-tt.args.blocks)
			if want != got {
				t.Errorf("getBlocks() = %v, want %v", got, want)
			}
		})
	}
}

func TestIndexer_orderBlock(t *testing.T) {
	type fields struct {
		doneChan chan struct{}
	}
	type args struct {
		blocks chan []*utxo.Block
	}
	tests := []struct {
		name       string
		fields     fields
		args       args
		seedBlocks []*utxo.Block
		want       *utxo.Block
	}{
		{
			name: "Success",
			fields: fields{
				doneChan: nil,
			},
			args: args{
				blocks: make(chan []*utxo.Block),
			},
			seedBlocks: []*utxo.Block{
				&utxo.Block{BlockHeader: utxo.BlockHeader{Height: 5}},
				&utxo.Block{BlockHeader: utxo.BlockHeader{Height: 3}},
				&utxo.Block{BlockHeader: utxo.BlockHeader{Height: 0}},
			},
			want: &utxo.Block{BlockHeader: utxo.BlockHeader{Height: 0}},
		},
		{
			name: "Done",
			fields: fields{
				doneChan: make(chan struct{}),
			},
			args: args{
				blocks: make(chan []*utxo.Block),
			},
			seedBlocks: []*utxo.Block{
				&utxo.Block{BlockHeader: utxo.BlockHeader{Height: 5}},
				&utxo.Block{BlockHeader: utxo.BlockHeader{Height: 3}},
				&utxo.Block{BlockHeader: utxo.BlockHeader{Height: 0}},
			},
			want: &utxo.Block{BlockHeader: utxo.BlockHeader{Height: 0}},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			idxr := &Indexer{
				startBlock: 0,
				doneChan:   tt.fields.doneChan,
			}

			go func() { tt.args.blocks <- tt.seedBlocks }()

			gotChan := make(chan *utxo.Block)
			go idxr.orderBlock(gotChan, tt.args.blocks)

			if idxr.doneChan != nil {
				close(idxr.doneChan)

				timeout := make(chan bool, 1)
				go func() { time.Sleep(2 * time.Second); timeout <- true }()
				go func() {
					// defer takes longer to close than we thought :-O
					// TODO remove sleep PARKER
					time.Sleep(200 * time.Millisecond)
					if _, ok := <-gotChan; !ok {
						timeout <- false
					}
				}()

				select {
				case to := <-timeout:
					if to {
						t.Error("Closing done channel did not kill process before timeout")
					}
					return
				}
			}

			got := <-gotChan
			if tt.want.Height != got.Height {
				t.Error("wanted", tt.want.Height, "got", got.Height)
			}
		})
	}
}

func TestIndexer_writeBlock(t *testing.T) {
	type fields struct {
		db       Database
		doneChan chan struct{}
	}
	type args struct {
		blocks chan *utxo.Block
	}
	tests := []struct {
		name     string
		fields   fields
		args     args
		testFunc func(b *utxo.Block) (int, error)
		want     *txResult
	}{
		{
			name: "Success",
			fields: fields{
				db:       newMockPostgres(nil),
				doneChan: nil,
			},
			args: args{
				blocks: make(chan *utxo.Block),
			},
			want: &txResult{
				tx:      &utxo.Tx{Hex: "1234"},
				index:   0,
				blockId: 0,
			},
		},
		{
			name: "Done Case",
			fields: fields{
				db:       newMockPostgres(nil),
				doneChan: make(chan struct{}),
			},
			args: args{
				blocks: make(chan *utxo.Block),
			},
			want: &txResult{
				tx:      &utxo.Tx{Hex: "1234"},
				index:   0,
				blockId: 1,
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			idxr := &Indexer{
				db:       tt.fields.db,
				doneChan: tt.fields.doneChan,
			}

			gotChan := make(chan *txResult)
			go idxr.writeBlock(gotChan, tt.args.blocks)
			insertBlock := &utxo.Block{
				BlockHeader: utxo.BlockHeader{},
				Txs:         []utxo.Tx{utxo.Tx{Hex: "1234"}},
			}
			tt.args.blocks <- insertBlock

			// test done channel if it is not nil
			if idxr.doneChan != nil {
				close(idxr.doneChan)

				timeout := make(chan bool, 1)
				go func() { time.Sleep(2 * time.Second); timeout <- true }()
				go func() {
					// defer takes longer to close than we thought :-O
					// TODO remove sleep PARKER
					time.Sleep(200 * time.Millisecond)
					if _, ok := <-gotChan; !ok {
						timeout <- false
					}
				}()

				select {
				case to := <-timeout:
					if to {
						t.Error("Closing done channel did not kill process before timeout")
					}
					return
				}
			}

			got := <-gotChan

			if !reflect.DeepEqual(tt.want, got) {
				t.Error("want", tt.want.blockId, "but got", got.blockId)
			}
		})
	}
}

// TODO fix test to test default case. It's hard to test default case
func TestIndexer_writeTx(t *testing.T) {
	type fields struct {
		db       Database
		doneChan chan struct{}
	}
	type args struct {
		txs chan *txResult
	}
	tests := []struct {
		name   string
		fields fields
		args   args
	}{
		{
			name: "Success",
			fields: fields{
				db:       newMockPostgres(nil),
				doneChan: nil,
			},
			args: args{
				txs: make(chan *txResult),
			},
		},
		{
			name: "Done Case",
			fields: fields{
				db:       newMockPostgres(nil),
				doneChan: make(chan struct{}),
			},
			args: args{
				txs: make(chan *txResult),
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			doneSeed := make(chan struct{})
			idxr := &Indexer{
				db:       tt.fields.db,
				doneChan: tt.fields.doneChan,
			}

			tx := &utxo.Tx{Hash: "test123", TxID: "test123"}

			go func() { tt.args.txs <- &txResult{tx: tx}; close(doneSeed) }()

			var wg sync.WaitGroup
			wg.Add(1)
			go func() {
				idxr.writeTx(tt.args.txs)
				wg.Done()
			}()

			// test done channel if it is not nil
			if idxr.doneChan != nil {
				close(idxr.doneChan)
				tt.args.txs <- &txResult{tx: tx}
				timeout := doneTimeout(&wg, 2)

				select {
				case to := <-timeout:
					if to {
						t.Error("Closing done channel did not kill process before timeout")
					}
					return
				}
			}
			// without this writeTx exits before it actually can run....
			<-doneSeed
			close(tt.args.txs)
			wg.Wait()
		})
	}
}
