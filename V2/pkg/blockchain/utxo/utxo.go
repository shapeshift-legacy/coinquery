package utxo

import (
	"fmt"

	"github.com/pkg/errors"
	"github.com/shapeshift-legacy/coinquery/V2/config"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/http"
)

// Blockchain for indexing bitcoin blockchain node
type Blockchain struct {
	client *http.Client
	coin   string
}

// New creates a new JSONRPC client used to interact with the node
func New(r *config.RPC, c string) *Blockchain {
	return &Blockchain{
		client: http.NewClient(r),
		coin:   c,
	}
}

// GetChainInfo returns information about the blockchain and network
func (b *Blockchain) GetChainInfo() (*ChainInfo, error) {
	bi, err := b.GetBlockchainInfo()
	if err != nil {
		return nil, errors.Wrapf(err, "failed to get chain info")
	}

	ni, err := b.GetNetworkInfo()
	if err != nil {
		return nil, errors.Wrapf(err, "failed to get chain info")
	}

	ci := &ChainInfo{
		Chain:           bi.Chain,
		Blocks:          bi.Blocks,
		Headers:         bi.Headers,
		BestBlockHash:   bi.BestBlockHash,
		Difficulty:      string(bi.Difficulty),
		SizeOnDisk:      bi.SizeOnDisk,
		Version:         string(ni.Version),
		Subversion:      string(ni.Subversion),
		ProtocolVersion: string(ni.ProtocolVersion),
		Timeoffset:      ni.Timeoffset,
	}

	if len(bi.Warnings) > 0 {
		ci.Warnings = bi.Warnings + " "
	}
	if bi.Warnings != ni.Warnings {
		ci.Warnings += ni.Warnings
	}

	return ci, nil
}

// GetBlockchainInfo returns information about the connected blockchain node
func (b *Blockchain) GetBlockchainInfo() (*BlockchainInfo, error) {
	req := b.client.NewRPCRequest("getblockchaininfo")

	result := &BlockchainInfo{}

	if err := b.client.CallRPC(req, result); err != nil {
		return nil, errors.Wrap(err, "error calling GetBlockchainInfo")
	}

	return result, nil
}

// GetNetworkInfo returns information about the connected blockchain network
func (b *Blockchain) GetNetworkInfo() (*NetworkInfo, error) {
	req := b.client.NewRPCRequest("getnetworkinfo")

	result := &NetworkInfo{}

	if err := b.client.CallRPC(req, result); err != nil {
		return nil, errors.Wrap(err, "error calling GetNetworkInfo")
	}

	return result, nil
}

// GetChainTips returns information about all known tips in the block tree,
// including the main chain as well as orphaned branches
func (b *Blockchain) GetChainTips() ([]*ChainTip, error) {
	req := b.client.NewRPCRequest("getchaintips")

	result := []*ChainTip{}

	if err := b.client.CallRPC(req, &result); err != nil {
		return nil, errors.Wrap(err, "error calling GetChainTips")
	}

	return result, nil
}

// GetMempool returns an array of transaction hashes in the current mempool
func (b *Blockchain) GetMempool() ([]string, error) {
	req := b.client.NewRPCRequest("getrawmempool")

	result := []string{}

	if err := b.client.CallRPC(req, &result); err != nil {
		return nil, errors.Wrap(err, "error calling GetMempool")
	}

	return result, nil
}

// GetBlocks returns an array of verbose blocks using the array of heights
func (b *Blockchain) GetBlocks(val interface{}) ([]*Block, error) {
	var hashes []string
	var err error

	switch v := val.(type) {
	case []int:
		hashes, err = b.GetBlockHashes(val.([]int))
		if err != nil {
			return nil, errors.Wrapf(err, "failed to get block hashes")
		}
	case []string:
		hashes = val.([]string)
	default:
		return nil, fmt.Errorf("Blocks val must be of type []int or []string, instead of %T", v)
	}

	r, err := b.GetBlocksVerbose(hashes)
	if err != nil {
		return nil, errors.Wrapf(err, "failed to get verbose blocks")
	}

	return r, nil
}

// GetBlockHashes returns the block hashes of blocks at the specified heights
func (b *Blockchain) GetBlockHashes(heights []int) ([]string, error) {
	reqs := []*http.RPCRequest{}
	for _, h := range heights {
		req := b.client.NewRPCRequest("getblockhash", h)
		reqs = append(reqs, req)
	}

	results := []string{}

	if err := b.client.CallRPCBatch(reqs, &results); err != nil {
		return nil, errors.Wrapf(err, "error calling GetBlockHashes(%v)", heights)
	}

	return results, nil
}

// GetBlocksNormal returns blocks with provided hashes as an array of BlockInfo
func (b *Blockchain) GetBlocksNormal(hashes []string) ([]*BlockNormal, error) {
	var verbosity interface{}

	if b.coin == "doge" {
		verbosity = true
	} else {
		verbosity = 1
	}

	reqs := []*http.RPCRequest{}
	for _, h := range hashes {
		req := b.client.NewRPCRequest("getblock", h, verbosity)
		reqs = append(reqs, req)
	}

	results := []*BlockNormal{}

	if err := b.client.CallRPCBatch(reqs, &results); err != nil {
		return nil, errors.Wrapf(err, "error calling GetBlocksNormal(%v)", hashes)
	}

	return results, nil
}

// GetBlocksVerbose returns blocks with provided hashes as an array of Block
func (b *Blockchain) GetBlocksVerbose(hashes []string) ([]*Block, error) {
	if b.coin == "doge" {
		return b.GetBlocksVerboseDoge(hashes)
	}

	reqs := []*http.RPCRequest{}
	for _, h := range hashes {
		req := b.client.NewRPCRequest("getblock", h, 2)
		reqs = append(reqs, req)
	}

	results := []*Block{}

	if err := b.client.CallRPCBatch(reqs, &results); err != nil {
		return nil, errors.Wrapf(err, "error calling GetBlocksVerbose(%v)", hashes)
	}

	return results, nil
}

// GetBlocksVerboseDoge handles constructing verbose blocks for doge due to lack of verbose txs in block
func (b *Blockchain) GetBlocksVerboseDoge(hashes []string) ([]*Block, error) {
	results := []*Block{}

	blks, err := b.GetBlocksNormal(hashes)
	if err != nil {
		return nil, errors.Wrapf(err, "error calling GetBlocksVerbose(%v)", hashes)
	}

	for _, blk := range blks {
		if blk.Height == 0 {
			block := &Block{
				BlockHeader: blk.BlockHeader,
			}

			results = append(results, block)

			continue
		}

		txsP, err := b.GetRawTransactions(blk.Txs)
		if err != nil {
			return nil, errors.Wrapf(err, "error calling GetBlocksVerbose(%v)", hashes)
		}

		txs := []Tx{}
		for _, tx := range txsP {
			txs = append(txs, *tx)
		}

		block := &Block{
			BlockHeader: blk.BlockHeader,
			Txs:         txs,
		}

		results = append(results, block)
	}

	return results, nil
}

// GetRawTransactions returns the verbose transaction data for each hash
func (b *Blockchain) GetRawTransactions(hashes []string) ([]*Tx, error) {
	var reqs []*http.RPCRequest
	for _, hash := range hashes {
		req := b.client.NewRPCRequest("getrawtransaction", hash, true)
		reqs = append(reqs, req)
	}

	results := []*Tx{}

	if err := b.client.CallRPCBatch(reqs, &results); err != nil {
		return nil, errors.Wrapf(err, "error calling GetRawTransactions(%v)", hashes)
	}

	return results, nil
}

// SendRawTransaction broadcasts raw tx on the network
func (b *Blockchain) SendRawTransaction(rawtx string) (string, error) {
	req := b.client.NewRPCRequest("sendrawtransaction", rawtx)

	result := ""

	if err := b.client.CallRPC(req, &result); err != nil {
		return "", errors.Wrap(err, "error sending raw tx")
	}

	return result, nil
}
