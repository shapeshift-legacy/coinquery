package utxo

import "encoding/json"

// ChainInfo has some higher level information about the underlying node
type ChainInfo struct {
	Chain           string `json:"chain"`
	Blocks          int    `json:"blocks"`
	Headers         int    `json:"headers"`
	BestBlockHash   string `json:"bestblockhash"`
	Difficulty      string `json:"difficulty"`
	SizeOnDisk      int    `json:"size_on_disk"`
	Version         string `json:"version"`
	Subversion      string `json:"subversion"`
	ProtocolVersion string `json:"protocolversion"`
	Timeoffset      int    `json:"timeoffset"`
	Warnings        string `json:"warnings"`
}

// ChainTip contains details about blockchain branchs
type ChainTip struct {
	Height    int         `json:"height"`
	Hash      string      `json:"hash"`
	Branchlen json.Number `json:"branchlen"`
	Status    string      `json:"status"`
}

// BlockchainInfo contains data returned from getblockchaininfo
type BlockchainInfo struct {
	Chain         string      `json:"chain"`
	Blocks        int         `json:"blocks"`
	Headers       int         `json:"headers"`
	BestBlockHash string      `json:"bestblockhash"`
	Difficulty    json.Number `json:"difficulty"`
	SizeOnDisk    int         `json:"size_on_disk"`
	Warnings      string      `json:"warnings"`
}

// NetworkInfo contains data returned from getnetworkinfo
type NetworkInfo struct {
	Version         json.Number `json:"version"`
	Subversion      string      `json:"subversion"`
	ProtocolVersion json.Number `json:"protocolversion"`
	Timeoffset      int         `json:"timeoffset"`
	Warnings        string      `json:"warnings"`
}

// BlockHeader contains block data minus the transactions
type BlockHeader struct {
	Hash         string      `json:"hash"`
	Height       int         `json:"height"`
	Time         int         `json:"time"`
	MedianTime   int         `json:"mediantime"`
	Nonce        int         `json:"nonce"`
	PrevHash     string      `json:"previousblockhash"`
	NextHash     string      `json:"nextblockhash"`
	Bits         string      `json:"bits"`
	Difficulty   json.Number `json:"difficulty"`
	Chainwork    string      `json:"chainwork"`
	Version      int         `json:"version"`
	VersionHex   string      `json:"versionHex"`
	MerkleRoot   string      `json:"merkleroot"`
	Size         int         `json:"size"`
	StrippedSize int         `json:"strippedsize"`
	Weight       int         `json:"weight"`
	TxCount      int         `json:"nTx"`
	IsOrphan     bool        `json:"isOrphan"`
}

// Block contains the BlockHeader and array of verbose transactions
type Block struct {
	BlockHeader
	Txs []Tx `json:"tx,omitempty"`
}

// BlockNormal contains the BlockHeader and array of transaction ids
type BlockNormal struct {
	BlockHeader
	Txs []string `json:"tx"`
}

// Tx is a struct of a utxo transaction
type Tx struct {
	TxID     string      `json:"txid"`
	Hash     string      `json:"hash"`
	Version  int         `json:"version"`
	Size     int         `json:"size"`
	VSize    int         `json:"vsize"`
	Weight   int         `json:"weight"`
	Locktime json.Number `json:"locktime"`
	Vins     []Vin       `json:"vin"`
	Vouts    []Vout      `json:"vout"`
	Hex      string      `json:"hex"`
}

// Vin is struct of tx input
type Vin struct {
	TxID      string `json:"txid"`
	Vout      int    `json:"vout"`
	ScriptSig struct {
		Asm string `json:"asm"`
		Hex string `json:"hex"`
	} `json:"scriptSig"`
	TxInWitness []string `json:"txinwitness"`
	Sequence    int      `json:"sequence"`
	Coinbase    string   `json:"coinbase"`
}

// Vout is struct of tx output
type Vout struct {
	Value        json.Number `json:"value"`
	N            int         `json:"n"`
	ScriptPubKey struct {
		Asm       string   `json:"asm"`
		Hex       string   `json:"hex"`
		ReqSigs   int      `json:"reqSigs"`
		Type      string   `json:"type"`
		Addresses []string `json:"addresses"`
	} `json:"scriptPubKey"`
}

// MempoolTx contains the tx hash and fail count for mempool processing
type MempoolTx struct {
	Hash  string
	Fails int // number of times getting tx from blockchain failed
}
