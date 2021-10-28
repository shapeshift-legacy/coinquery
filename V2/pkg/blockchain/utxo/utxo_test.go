// +build unit

package utxo

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"

	"github.com/shapeshift-legacy/coinquery/V2/config"
)

var requestChan = make(chan *RequestData, 1)

type RequestData struct {
	method string
	body   string
}

var responseBody = ""

var httpServer *httptest.Server
var u *url.URL
var b *Blockchain

func newConfig(_url, user, pass string) *config.RPC {
	u, _ = url.Parse(_url)

	return &config.RPC{
		CoinRPC: config.CoinRPC{
			URL:      u.String(),
			User:     user,
			Password: pass,
		},
		BaseRPC: config.BaseRPC{
			Threads: 0,
		},
	}
}

func getFixture(t *testing.T, name string) []byte {
	path := filepath.Join("testdata", name) // relative path
	bytes, err := ioutil.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	return bytes
}

func TestMain(m *testing.M) {
	httpServer = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		data, _ := ioutil.ReadAll(r.Body)
		defer r.Body.Close()

		requestChan <- &RequestData{r.Method, strings.TrimSuffix(string(data), "\n")}

		fmt.Fprintf(w, responseBody)
	}))
	defer httpServer.Close()

	conf := newConfig(httpServer.URL, "", "")

	b = New(conf, "btc")

	os.Exit(m.Run())
}

func TestNew(t *testing.T) {
	type args struct {
		conf *config.RPC
	}
	type client struct {
		baseURL  string
		user     string
		password string
	}
	tests := []struct {
		name string
		args args
		want *client
	}{
		{
			name: "Success",
			args: args{
				conf: newConfig(httpServer.URL, "test", "123"),
			},
			want: &client{
				baseURL:  u.String(),
				user:     "test",
				password: "123",
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			n := New(tt.args.conf, "btc")

			got := &client{
				baseURL:  n.client.BaseURL.String(),
				user:     n.client.User,
				password: n.client.Password,
			}

			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("New() = %+v, want %+v", got, tt.want)
			}
		})
	}
}

func TestBlockchain_GetBlockchainInfo(t *testing.T) {
	tests := []struct {
		name     string
		fixture  string
		wantReq  *RequestData
		wantData *BlockchainInfo
		wantErr  bool
	}{
		{
			name:    "Success",
			fixture: "blockchaininfo.fixture",
			wantReq: &RequestData{
				method: "POST",
				body:   `{"jsonrpc":"2.0","id":0,"method":"getblockchaininfo","params":null}`,
			},
			wantData: &BlockchainInfo{
				Chain:         "main",
				Blocks:        571367,
				Headers:       571367,
				BestBlockHash: "0000000000000000002927f512802d1ce8dc015e6766477d1362441f9f2eeb8c",
				Difficulty:    json.Number("6393023717201.863"),
				SizeOnDisk:    242477458931,
				Warnings:      "Warning: Unknown block versions being mined! It's possible unknown rules are in effect",
			},
			wantErr: false,
		},
		{
			name:    "Error",
			fixture: "error.fixture",
			wantReq: &RequestData{
				method: "POST",
				body:   `{"jsonrpc":"2.0","id":0,"method":"getblockchaininfo","params":null}`,
			},
			wantData: nil,
			wantErr:  true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			f := getFixture(t, tt.fixture)
			responseBody = string(f)
			gotData, err := b.GetBlockchainInfo()
			gotReq := <-requestChan
			if (err != nil) != tt.wantErr {
				t.Errorf("Blockchain.GetBlockchainInfo() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(gotReq, tt.wantReq) {
				t.Errorf("Blockchain.GetBlockchainInfo() = %+v, want %+v", gotReq, tt.wantReq)
			}
			if !reflect.DeepEqual(gotData, tt.wantData) {
				t.Errorf("Blockchain.GetBlockchainInfo() = %+v, want %+v", gotData, tt.wantData)
			}
		})
	}
}

func TestBlockchain_GetNetworkInfo(t *testing.T) {
	tests := []struct {
		name     string
		fixture  string
		wantReq  *RequestData
		wantData *NetworkInfo
		wantErr  bool
	}{
		{
			name:    "Success",
			fixture: "networkinfo.fixture",
			wantReq: &RequestData{
				method: "POST",
				body:   `{"jsonrpc":"2.0","id":0,"method":"getnetworkinfo","params":null}`,
			},
			wantData: &NetworkInfo{
				Version:         json.Number("170100"),
				Subversion:      "/Satoshi:0.17.1/",
				ProtocolVersion: json.Number("70015"),
				Timeoffset:      0,
				Warnings:        "Warning: Unknown block versions being mined! It's possible unknown rules are in effect",
			},
			wantErr: false,
		},
		{
			name:    "Error",
			fixture: "error.fixture",
			wantReq: &RequestData{
				method: "POST",
				body:   `{"jsonrpc":"2.0","id":0,"method":"getnetworkinfo","params":null}`,
			},
			wantData: nil,
			wantErr:  true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			f := getFixture(t, tt.fixture)
			responseBody = string(f)
			gotData, err := b.GetNetworkInfo()
			gotReq := <-requestChan
			if (err != nil) != tt.wantErr {
				t.Errorf("Blockchain.GetNetworkInfo() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(gotReq, tt.wantReq) {
				t.Errorf("Blockchain.GetNetworkInfo() = %+v, want %+v", gotReq, tt.wantReq)
			}
			if !reflect.DeepEqual(gotData, tt.wantData) {
				t.Errorf("Blockchain.GetNetworkInfo() = %+v, want %+v", gotData, tt.wantData)
			}
		})
	}
}

func TestBlockchain_GetChainTips(t *testing.T) {
	tests := []struct {
		name     string
		fixture  string
		wantReq  *RequestData
		wantData []*ChainTip
		wantErr  bool
	}{
		{
			name:    "Success",
			fixture: "chaintips.fixture",
			wantReq: &RequestData{
				method: "POST",
				body:   `{"jsonrpc":"2.0","id":0,"method":"getchaintips","params":null}`,
			},
			wantData: []*ChainTip{
				&ChainTip{
					Height:    571371,
					Hash:      "0000000000000000001fceaf2c437066b01025ff2ffd6d190e80609ccd9e3bc7",
					Branchlen: json.Number("0"),
					Status:    "active",
				},
			},
			wantErr: false,
		},
		{
			name:    "Error",
			fixture: "error.fixture",
			wantReq: &RequestData{
				method: "POST",
				body:   `{"jsonrpc":"2.0","id":0,"method":"getchaintips","params":null}`,
			},
			wantData: nil,
			wantErr:  true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			f := getFixture(t, tt.fixture)
			responseBody = string(f)
			gotData, err := b.GetChainTips()
			gotReq := <-requestChan
			if (err != nil) != tt.wantErr {
				t.Errorf("Blockchain.GetChainTips() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(gotReq, tt.wantReq) {
				t.Errorf("Blockchain.GetChainTips() = %+v, want %+v", gotReq, tt.wantReq)
			}
			if !reflect.DeepEqual(gotData, tt.wantData) {
				t.Errorf("Blockchain.GetChainTips() = %+v, want %+v", gotData, tt.wantData)
			}
		})
	}
}

func TestBlockchain_GetMempool(t *testing.T) {
	tests := []struct {
		name     string
		fixture  string
		wantReq  *RequestData
		wantData []string
		wantErr  bool
	}{
		{
			name:    "Success",
			fixture: "mempool.fixture",
			wantReq: &RequestData{
				method: "POST",
				body:   `{"jsonrpc":"2.0","id":0,"method":"getrawmempool","params":null}`,
			},
			wantData: []string{"0f4bc8b454bdd0fffb4f3066cab46d39a1304835675f5cd15c37f8d507dfe86a"},
			wantErr:  false,
		},
		{
			name:    "Error",
			fixture: "error.fixture",
			wantReq: &RequestData{
				method: "POST",
				body:   `{"jsonrpc":"2.0","id":0,"method":"getrawmempool","params":null}`,
			},
			wantData: nil,
			wantErr:  true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			f := getFixture(t, tt.fixture)
			responseBody = string(f)
			gotData, err := b.GetMempool()
			gotReq := <-requestChan
			if (err != nil) != tt.wantErr {
				t.Errorf("Blockchain.GetMempool() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(gotReq, tt.wantReq) {
				t.Errorf("Blockchain.GetMempool() = %+v, want %+v", gotReq, tt.wantReq)
			}
			if !reflect.DeepEqual(gotData, tt.wantData) {
				t.Errorf("Blockchain.GetMempool() = %+v, want %+v", gotData, tt.wantData)
			}
		})
	}
}

func TestBlockchain_GetBlockHashes(t *testing.T) {
	type args struct {
		heights []int
	}
	tests := []struct {
		name     string
		fixture  string
		args     args
		wantReq  *RequestData
		wantData []string
		wantErr  bool
	}{
		{
			name:    "Success",
			fixture: "blockhash.fixture",
			args: args{
				heights: []int{0},
			},
			wantReq: &RequestData{
				method: "POST",
				body:   `[{"jsonrpc":"2.0","id":0,"method":"getblockhash","params":[0]}]`,
			},
			wantData: []string{"000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"},
			wantErr:  false,
		},
		{
			name:    "Error",
			fixture: "error.fixture",
			args: args{
				heights: []int{0},
			},
			wantReq: &RequestData{
				method: "POST",
				body:   `[{"jsonrpc":"2.0","id":0,"method":"getblockhash","params":[0]}]`,
			},
			wantData: nil,
			wantErr:  true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			f := getFixture(t, tt.fixture)
			responseBody = string(f)
			gotData, err := b.GetBlockHashes(tt.args.heights)
			gotReq := <-requestChan
			if (err != nil) != tt.wantErr {
				t.Errorf("Blockchain.GetBlockHashes() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(gotReq, tt.wantReq) {
				t.Errorf("Blockchain.GetBlockHashes() = %+v, want %+v", gotReq, tt.wantReq)
			}
			if !reflect.DeepEqual(gotData, tt.wantData) {
				t.Errorf("Blockchain.GetBlockHashes() = %+v, want %+v", gotData, tt.wantData)
			}
		})
	}
}

func TestBlockchain_GetBlocksNormal(t *testing.T) {
	type args struct {
		hashes []string
	}
	tests := []struct {
		name     string
		fixture  string
		args     args
		wantReq  *RequestData
		wantData []*BlockNormal
		wantErr  bool
	}{
		{
			name:    "Success",
			fixture: "blocknormal.fixture",
			args: args{
				hashes: []string{"000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"},
			},
			wantReq: &RequestData{
				method: "POST",
				body:   `[{"jsonrpc":"2.0","id":0,"method":"getblock","params":["000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",1]}]`,
			},
			wantData: []*BlockNormal{
				&BlockNormal{
					BlockHeader: BlockHeader{
						Hash:         "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
						Height:       0,
						Time:         1231006505,
						MedianTime:   1231006505,
						Nonce:        2083236893,
						NextHash:     "00000000839a8e6886ab5951d76f411475428afc90947ee320161bbf18eb6048",
						Bits:         "1d00ffff",
						Difficulty:   "1",
						Chainwork:    "0000000000000000000000000000000000000000000000000000000100010001",
						Version:      1,
						VersionHex:   "00000001",
						MerkleRoot:   "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
						Size:         285,
						StrippedSize: 285,
						Weight:       1140,
						TxCount:      1,
					},
					Txs: []string{"4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b"},
				},
			},
			wantErr: false,
		},
		{
			name:    "Error",
			fixture: "error.fixture",
			args: args{
				hashes: []string{"000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"},
			},
			wantReq: &RequestData{
				method: "POST",
				body:   `[{"jsonrpc":"2.0","id":0,"method":"getblock","params":["000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",1]}]`,
			},
			wantData: nil,
			wantErr:  true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			f := getFixture(t, tt.fixture)
			responseBody = string(f)
			gotData, err := b.GetBlocksNormal(tt.args.hashes)
			gotReq := <-requestChan
			if (err != nil) != tt.wantErr {
				t.Errorf("Blockchain.GetBlocksNormal() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(gotReq, tt.wantReq) {
				t.Errorf("Blockchain.GetBlocksNormal() = %+v, want %+v", gotReq, tt.wantReq)
			}
			if !reflect.DeepEqual(gotData, tt.wantData) {
				t.Errorf("Blockchain.GetBlocksNormal() = %+v, want %+v", gotData, tt.wantData)
			}
		})
	}
}

func TestBlockchain_GetBlocksVerbose(t *testing.T) {
	type args struct {
		hashes []string
	}
	tests := []struct {
		name     string
		fixture  string
		args     args
		wantReq  *RequestData
		wantData []*Block
		wantErr  bool
	}{
		{
			name:    "Success",
			fixture: "blockverbose.fixture",
			args: args{
				hashes: []string{"000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"},
			},
			wantReq: &RequestData{
				method: "POST",
				body:   `[{"jsonrpc":"2.0","id":0,"method":"getblock","params":["000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",2]}]`,
			},
			wantData: []*Block{
				&Block{
					BlockHeader: BlockHeader{
						Hash:         "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
						Height:       0,
						Time:         1231006505,
						MedianTime:   1231006505,
						Nonce:        2083236893,
						NextHash:     "00000000839a8e6886ab5951d76f411475428afc90947ee320161bbf18eb6048",
						Bits:         "1d00ffff",
						Difficulty:   "1",
						Chainwork:    "0000000000000000000000000000000000000000000000000000000100010001",
						Version:      1,
						VersionHex:   "00000001",
						MerkleRoot:   "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
						Size:         285,
						StrippedSize: 285,
						Weight:       1140,
						TxCount:      1,
					},
					Txs: []Tx{
						Tx{
							TxID:     "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
							Hash:     "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
							Version:  1,
							Size:     204,
							VSize:    204,
							Weight:   816,
							Locktime: json.Number("0"),
							Vins: []Vin{
								Vin{
									Coinbase: "04ffff001d0104455468652054696d65732030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66207365636f6e64206261696c6f757420666f722062616e6b73",
									Sequence: 4294967295,
								},
							},
							Vouts: []Vout{
								Vout{
									Value: json.Number("50.0"),
									N:     0,
									ScriptPubKey: struct {
										Asm       string   `json:"asm"`
										Hex       string   `json:"hex"`
										ReqSigs   int      `json:"reqSigs"`
										Type      string   `json:"type"`
										Addresses []string `json:"addresses"`
									}{
										Asm:     "04678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f OP_CHECKSIG",
										Hex:     "4104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac",
										ReqSigs: 1,
										Type:    "pubkey",
										Addresses: []string{
											"1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
										},
									},
								},
							},
							Hex: "01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff4d04ffff001d0104455468652054696d65732030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66207365636f6e64206261696c6f757420666f722062616e6b73ffffffff0100f2052a01000000434104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac00000000",
						},
					},
				},
			},
			wantErr: false,
		},
		{
			name:    "Error",
			fixture: "error.fixture",
			args: args{
				hashes: []string{"000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"},
			},
			wantReq: &RequestData{
				method: "POST",
				body:   `[{"jsonrpc":"2.0","id":0,"method":"getblock","params":["000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",2]}]`,
			},
			wantData: nil,
			wantErr:  true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			f := getFixture(t, tt.fixture)
			responseBody = string(f)
			gotData, err := b.GetBlocksVerbose(tt.args.hashes)
			gotReq := <-requestChan
			if (err != nil) != tt.wantErr {
				t.Errorf("Blockchain.GetBlocksVerbose() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(gotReq, tt.wantReq) {
				t.Errorf("Blockchain.GetBlocksVerbose() = %+v, want %+v", gotReq, tt.wantReq)
			}
			if !reflect.DeepEqual(gotData, tt.wantData) {
				t.Errorf("Blockchain.GetBlocksVerbose() = %+v, want %+v", gotData, tt.wantData)
			}
		})
	}
}

func TestBlockchain_GetRawTransactions(t *testing.T) {
	type args struct {
		hashes []string
	}
	tests := []struct {
		name     string
		fixture  string
		args     args
		wantReq  *RequestData
		wantData []*Tx
		wantErr  bool
	}{
		{
			name:    "Success",
			fixture: "rawtransaction.fixture",
			args: args{
				hashes: []string{"4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b"},
			},
			wantReq: &RequestData{
				method: "POST",
				body:   `[{"jsonrpc":"2.0","id":0,"method":"getrawtransaction","params":["4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",true]}]`,
			},
			wantData: []*Tx{
				&Tx{
					TxID:     "0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098",
					Hash:     "0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098",
					Version:  1,
					Size:     134,
					VSize:    134,
					Weight:   536,
					Locktime: json.Number("0"),
					Vins: []Vin{
						Vin{
							Coinbase: "04ffff001d0104",
							Sequence: 4294967295,
						},
					},
					Vouts: []Vout{
						Vout{
							Value: json.Number("50.0"),
							N:     0,
							ScriptPubKey: struct {
								Asm       string   `json:"asm"`
								Hex       string   `json:"hex"`
								ReqSigs   int      `json:"reqSigs"`
								Type      string   `json:"type"`
								Addresses []string `json:"addresses"`
							}{
								Asm:     "0496b538e853519c726a2c91e61ec11600ae1390813a627c66fb8be7947be63c52da7589379515d4e0a604f8141781e62294721166bf621e73a82cbf2342c858ee OP_CHECKSIG",
								Hex:     "410496b538e853519c726a2c91e61ec11600ae1390813a627c66fb8be7947be63c52da7589379515d4e0a604f8141781e62294721166bf621e73a82cbf2342c858eeac",
								ReqSigs: 1,
								Type:    "pubkey",
								Addresses: []string{
									"12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX",
								},
							},
						},
					},
					Hex: "01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff0704ffff001d0104ffffffff0100f2052a0100000043410496b538e853519c726a2c91e61ec11600ae1390813a627c66fb8be7947be63c52da7589379515d4e0a604f8141781e62294721166bf621e73a82cbf2342c858eeac00000000",
				},
			},
			wantErr: false,
		},
		{
			name:    "Error",
			fixture: "error.fixture",
			args: args{
				hashes: []string{"4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b"},
			},
			wantReq: &RequestData{
				method: "POST",
				body:   `[{"jsonrpc":"2.0","id":0,"method":"getrawtransaction","params":["4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",true]}]`,
			},
			wantData: nil,
			wantErr:  true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			f := getFixture(t, tt.fixture)
			responseBody = string(f)
			gotData, err := b.GetRawTransactions(tt.args.hashes)
			gotReq := <-requestChan
			if (err != nil) != tt.wantErr {
				t.Errorf("Blockchain.GetRawTransactions() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(gotReq, tt.wantReq) {
				t.Errorf("Blockchain.GetRawTransactions() = %+v, want %+v", gotReq, tt.wantReq)
			}
			if !reflect.DeepEqual(gotData, tt.wantData) {
				t.Errorf("Blockchain.GetRawTransactions() = %+v, want %+v", gotData, tt.wantData)
			}
		})
	}
}
