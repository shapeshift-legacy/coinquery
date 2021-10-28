// +build benchmark

package postgres

import (
	"log"
	"os"
	"testing"

	"github.com/shapeshift-legacy/coinquery/V2/config"
)

var db *Database

func TestMain(m *testing.M) {
	var err error

	db, err = connectDB()
	if err != nil {
		log.Fatal(err)
	}

	os.Exit(m.Run())
}

func connectDB() (*Database, error) {
	dbConf := &config.DB{
		URI: "postgres://indexer@localhost:5432/indexer?sslmode=disable",
		BaseDB: config.BaseDB{
			MaxConns: 1,
		},
	}

	return New(dbConf, "btc")
}

func BenchmarkLastBlock(b *testing.B) {
	for i := 0; i < b.N; i++ {
		db.LastBlock()
	}
}

func BenchmarkGetBlock(b *testing.B) {
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
		b.Run(bt.name, func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				db.GetBlock(bt.blockHash)
			}
		})
	}
}

func BenchmarkGetTxHashesByBlockHash(b *testing.B) {
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
		b.Run(bt.name, func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				db.GetTxHashesByBlockHash(bt.blockHash, "", "")
			}
		})
	}
}

func BenchmarkGetTotalTxsByBlockHash(b *testing.B) {
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
		b.Run(bt.name, func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				db.GetTotalTxsByBlockHash(bt.blockHash)
			}
		})
	}
}

func BenchmarkGetSpentTxDetails(b *testing.B) {
	benchmarks := []struct {
		name string
		txid string
	}{
		{
			name: "",
			txid: "29965335141a295369fad2bcba0176966e779156b78ee67b6f9e9bd33ac43feb",
		},
		{
			name: "",
			txid: "311686149857928a44dfdb3c190ecffe1ba0e62578b06aaaa79ef1bd18866720",
		},
		{
			name: "",
			txid: "d2b4c15eda3d7a9796e98b20418637b87682bb76022b8370cadbfe7b09106efe",
		},
		{
			name: "",
			txid: "f60cc8045dc8fb10f2afe9c5ee617a3ee5865365b45eb378d1e1c929278aa70d",
		},
	}
	for _, bt := range benchmarks {
		b.Run(bt.name, func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				db.GetSpentTxDetails("bfeee296ede999d0eb04618f19b45393be476fb2660dbbc11d9aaf9aa94f13d2", 1)
			}
		})
	}
}

func BenchmarkGetUtxosByAddrs(b *testing.B) {
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
		b.Run(bt.name, func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				db.GetUtxosByAddrs([]string{bt.addrs})
			}
		})
	}
}

func BenchmarkGetOutputsByTxID(b *testing.B) {
	benchmarks := []struct {
		name string
		txid string
	}{
		{
			name: "1 output",
			txid: "29965335141a295369fad2bcba0176966e779156b78ee67b6f9e9bd33ac43feb",
		},
		{
			name: "100 outputs",
			txid: "d2b4c15eda3d7a9796e98b20418637b87682bb76022b8370cadbfe7b09106efe",
		},
	}
	for _, bt := range benchmarks {
		b.Run(bt.name, func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				db.GetOutputsByTxID(bt.txid, "")
			}
		})
	}
}

func BenchmarkGetTxIDsByAddresses(b *testing.B) {
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
		b.Run(bt.name, func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				db.GetTxIDsByAddresses([]string{bt.addrs}, "", "", "")
			}
		})
	}
}

func BenchmarkGetTotalTxsByAddresses(b *testing.B) {
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
		b.Run(bt.name, func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				db.GetTotalTxsByAddresses([]string{bt.addrs})
			}
		})
	}
}

func BenchmarkGetTxByTxID(b *testing.B) {
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
		b.Run(bt.name, func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				db.GetTxByTxID(bt.txid)
			}
		})
	}
}

func BenchmarkGetRawTxByTxID(b *testing.B) {
	benchmarks := []struct {
		name string
		txid string
	}{
		{
			name: "Valid tx",
			txid: "29965335141a295369fad2bcba0176966e779156b78ee67b6f9e9bd33ac43feb",
		},
	}
	for _, bt := range benchmarks {
		b.Run(bt.name, func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				db.GetRawTxByTxID(bt.txid)
			}
		})
	}
}

func BenchmarkGetInputsByTxID(b *testing.B) {
	benchmarks := []struct {
		name string
		txid string
	}{
		{
			name: "1 input",
			txid: "29965335141a295369fad2bcba0176966e779156b78ee67b6f9e9bd33ac43feb",
		},
		{
			name: "100 inputs",
			txid: "311686149857928a44dfdb3c190ecffe1ba0e62578b06aaaa79ef1bd18866720",
		},
	}
	for _, bt := range benchmarks {
		b.Run(bt.name, func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				db.GetInputsByTxID(bt.txid)
			}
		})
	}
}
