// +build benchmark

package insight

import (
	"context"
	"fmt"
	"log"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/go-chi/chi"
	"github.com/shapeshift-legacy/coinquery/V2/config"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/postgres"
)

var server *InsightServer

func setChiURLParams(params map[string]string) context.Context {
	chiCtx := chi.NewRouteContext()

	for key, value := range params {
		chiCtx.URLParams.Add(key, value)
	}

	return context.WithValue(context.Background(), chi.RouteCtxKey, chiCtx)
}

func setURLParams(params map[string]string) context.Context {
	ctx := context.Background()

	for key, value := range params {
		ctx = context.WithValue(ctx, key, value)
	}

	return ctx
}

func TestMain(m *testing.M) {
	dbConf := &config.DB{
		URI: "postgres://indexer@localhost:5432/indexer?sslmode=disable",
		BaseDB: config.BaseDB{
			MaxConns: 1,
		},
	}

	db, err := postgres.New(dbConf, "btc")
	if err != nil {
		log.Fatal(err)
	}

	server = New(nil, db, nil)

	os.Exit(m.Run())
}

func BenchmarkStatus(b *testing.B) {
	r := httptest.NewRequest("GET", "http://api.test/status?q=getLastBlockHash", nil)
	w := httptest.NewRecorder()

	for i := 0; i < b.N; i++ {
		server.Status(w, r)
	}
}

func BenchmarkBlockByBlockHash(b *testing.B) {
	benchmarks := []struct {
		name      string
		blockHash string
	}{
		{
			name:      "1k Txs Block",
			blockHash: "0000000000000000000d919b307c1dd6d71c1b3fb1858f63d4d5e8b60744cc37",
		},
		{
			name:      "2k Txs Block",
			blockHash: "00000000000000000014ae020f1635c9ee5dd43c4c2d48194195d043cdeab445",
		},
		{
			name:      "3k Txs Block",
			blockHash: "0000000000000000000b9c20807fbfb5b414bfb1940efaf5b70db7cf607f78b3",
		},
		{
			name:      "4k Txs Block",
			blockHash: "000000000000000001c6ad568d454acc8105ff526c0d1924196f727dac22834e",
		},
		{
			name:      "5k Txs Block",
			blockHash: "000000000000000014474aec7c3a1ce014818d47d7d24d34ce2a2593dde1098f",
		},
	}
	for _, bt := range benchmarks {
		url := fmt.Sprintf("http://api.test/block/%s", bt.blockHash)

		r := httptest.NewRequest("GET", url, nil)
		w := httptest.NewRecorder()

		b.Run(bt.name, func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				params := map[string]string{
					"blockHash": bt.blockHash,
				}

				server.BlockByBlockHash(w, r.WithContext(setChiURLParams(params)))
			}
		})
	}
}

func BenchmarkTxByTxID(b *testing.B) {
	benchmarks := []struct {
		name string
		txid string
	}{
		{
			name: "1/1 input/output",
			txid: "29965335141a295369fad2bcba0176966e779156b78ee67b6f9e9bd33ac43feb",
		},
		{
			name: "100/1 input/output",
			txid: "311686149857928a44dfdb3c190ecffe1ba0e62578b06aaaa79ef1bd18866720",
		},
		{
			name: "1/100 input/output",
			txid: "d2b4c15eda3d7a9796e98b20418637b87682bb76022b8370cadbfe7b09106efe",
		},
		{
			name: "100/100 input/output",
			txid: "f60cc8045dc8fb10f2afe9c5ee617a3ee5865365b45eb378d1e1c929278aa70d",
		},
	}
	for _, bt := range benchmarks {
		url := fmt.Sprintf("http://api.test/tx/%s", bt.txid)

		r := httptest.NewRequest("GET", url, nil)
		w := httptest.NewRecorder()

		b.Run(bt.name, func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				params := map[string]string{
					"txid": bt.txid,
				}

				server.TxByTxID(w, r.WithContext(setChiURLParams(params)))
			}
		})
	}
}

func BenchmarkRawTxByTxID(b *testing.B) {
	benchmarks := []struct {
		name string
		txid string
	}{
		{
			name: "valid txid",
			txid: "c9601cfb710d1a357149bbd8f0ac8d0c25e78d2afe51e0d75b285e21d3f748e9",
		},
	}
	for _, bt := range benchmarks {
		url := fmt.Sprintf("http://api.test/rawtx/%s", bt.txid)

		r := httptest.NewRequest("GET", url, nil)
		w := httptest.NewRecorder()

		b.Run(bt.name, func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				params := map[string]string{
					"txid": bt.txid,
				}

				server.RawTxByTxID(w, r.WithContext(setChiURLParams(params)))
			}
		})
	}
}

func BenchmarkTxsByBlockHash(b *testing.B) {
	benchmarks := []struct {
		name      string
		blockHash string
	}{
		{
			name:      "1k Txs Block",
			blockHash: "0000000000000000000d919b307c1dd6d71c1b3fb1858f63d4d5e8b60744cc37",
		},
		{
			name:      "2k Txs Block",
			blockHash: "00000000000000000014ae020f1635c9ee5dd43c4c2d48194195d043cdeab445",
		},
		{
			name:      "3k Txs Block",
			blockHash: "0000000000000000000b9c20807fbfb5b414bfb1940efaf5b70db7cf607f78b3",
		},
		{
			name:      "4k Txs Block",
			blockHash: "000000000000000001c6ad568d454acc8105ff526c0d1924196f727dac22834e",
		},
		{
			name:      "5k Txs Block",
			blockHash: "000000000000000014474aec7c3a1ce014818d47d7d24d34ce2a2593dde1098f",
		},
	}
	for _, bt := range benchmarks {
		url := fmt.Sprintf("http://api.test/txs?block=%s", bt.blockHash)

		r := httptest.NewRequest("GET", url, nil)
		w := httptest.NewRecorder()

		b.Run(bt.name, func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				server.TxsByBlockHash(w, r)
			}
		})
	}
}

func BenchmarkTxHistoryByAddrs(b *testing.B) {
	benchmarks := []struct {
		name  string
		addrs string
	}{
		{
			name:  "Small Address",
			addrs: "bc1qvx4ara9g7jfcucz7s3k43wk6hma363l0e54vdd",
		},
		{
			name:  "Large Address",
			addrs: "336xGpGweq1wtY4kRTuA4w6d7yDkBU9czU",
		},
	}
	for _, bt := range benchmarks {
		url := fmt.Sprintf("http://api.test/addrs/%s/txs?from=%d&to=%d", bt.addrs, 0, 0)

		r := httptest.NewRequest("GET", url, nil)
		w := httptest.NewRecorder()

		b.Run(bt.name, func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				params := map[string]string{
					"addrs": bt.addrs,
				}

				server.TxHistoryByAddrs(w, r.WithContext(setURLParams(params)))
			}
		})
	}
}

func BenchmarkUtxosByAddrs(b *testing.B) {
	benchmarks := []struct {
		name  string
		addrs string
	}{
		{
			name:  "Small Address",
			addrs: "32MHMmESiEYaBeZrCbpxMu6UF7LKDLdBPX",
		},
		{
			name:  "Large Address",
			addrs: "3Nxwenay9Z8Lc9JBiywExpnEFiLp6Afp8v",
		},
	}
	for _, bt := range benchmarks {
		url := fmt.Sprintf("http://api.test/addrs/%s/utxos", bt.addrs)

		r := httptest.NewRequest("GET", url, nil)
		w := httptest.NewRecorder()

		b.Run(bt.name, func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				params := map[string]string{
					"addrs": bt.addrs,
				}

				server.UtxosByAddrs(w, r.WithContext(setURLParams(params)))
			}
		})
	}
}
