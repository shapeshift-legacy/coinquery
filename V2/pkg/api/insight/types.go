//go:generate easyjson types.go

package insight

import "github.com/shapeshift-legacy/coinquery/V2/pkg/blockchain/utxo"

//easyjson:json
type insightTx struct {
	TxID          string         `json:"txid"`
	Hash          string         `json:"hash"`
	Version       int            `json:"version"`
	Size          int            `json:"size"`
	VSize         int            `json:"vsize"`
	Weight        int            `json:"weight"`
	Locktime      int            `json:"locktime"`
	Vin           []*insightVin  `json:"vin"`
	Vout          []*insightVout `json:"vout"`
	BlockHash     string         `json:"blockhash,omitempty"`
	BlockHeight   int64          `json:"blockheight"`
	Confirmations int            `json:"confirmations"`
	Time          int64          `json:"time"`
	BlockTime     int64          `json:"blocktime,omitempty"`
	IsCoinBase    bool           `json:"isCoinBase,omitempty"`
	ValueOut      float64        `json:"valueOut"`
	ValueIn       float64        `json:"valueIn,omitempty"`
	Fees          *float64       `json:"fees,omitempty"`
}

//easyjson:json
type ScriptSig struct {
	Asm *string `json:"asm"`
	Hex string  `json:"hex"`
}

//easyjson:json
type insightVin struct {
	TxID        string     `json:"txid,omitempty"`
	Vout        *int       `json:"vout,omitempty"`
	N           int        `json:"n"`
	ScriptSig   *ScriptSig `json:"scriptSig"`
	TxInWitness []string   `json:"txinwitness,omitempty"`
	Sequence    int        `json:"sequence"`
	Coinbase    string     `json:"coinbase,omitempty"`
	Address     string     `json:"addr,omitempty"`
	ValueSat    int64      `json:"valueSat,omitempty"`
	Value       float64    `json:"value,omitempty"`
}

//easyjson:json
type insightVout struct {
	Value        string `json:"value"`
	N            int    `json:"n"`
	ScriptPubKey struct {
		Asm       string   `json:"asm"`
		Hex       string   `json:"hex"`
		ReqSigs   int      `json:"reqSigs,omitempty"`
		Addresses []string `json:"addresses,omitempty"`
		Type      string   `json:"type,omitempty"`
	} `json:"scriptPubKey"`
	SpentTxID          *string `json:"spentTxId"`
	SpentTxIndex       *int    `json:"spentIndex"`
	SpentTxBlockHeight *int64  `json:"spentHeight"`
}

//easyjson:json
type insightBlock struct {
	*utxo.Block
	Confirmations int `json:"confirmations"`
}

//easyjson:json
type insightUtxos []*insightUtxo

//easyjson:json
type insightUtxo struct {
	Address       string  `json:"address"`
	TxID          string  `json:"txid"`
	Vout          int     `json:"vout"`
	ScriptPubKey  string  `json:"scriptPubKey"`
	ReqSigs       int     `json:"reqSigs,omitempty"`
	Type          string  `json:"type,omitempty"`
	Amount        float64 `json:"amount"`
	Satoshis      int64   `json:"satoshis"`
	BlockHeight   int64   `json:"blockheight"`
	Confirmations int     `json:"confirmations"`
	Timestamp     int64   `json:"ts"`
}

//easyjson:json
type insightTxHistoryByAddrs struct {
	TotalItems int          `json:"totalItems"`
	From       int          `json:"from"`
	To         int          `json:"to"`
	Txs        []*insightTx `json:"items"`
}

//easyjson:json
type insightTxsByBlock struct {
	PagesTotal int          `json:"pagesTotal"`
	Txs        []*insightTx `json:"txs"`
}
