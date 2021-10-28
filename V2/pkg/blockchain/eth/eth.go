package eth

import (
	"bytes"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math/big"
	"strings"

	"github.com/pkg/errors"
	"github.com/shapeshift-legacy/coinquery/V2/config"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/http"
	"golang.org/x/crypto/sha3"
)

// Blockchain for indexing bitcoin blockchain node
type Blockchain struct {
	client *http.Client
}

// New creates a new Blockchain http client
func New(r *config.RPC) *Blockchain {
	return &Blockchain{
		client: http.NewClient(r),
	}
}

// GetInfo returns information about the parity node
func (b *Blockchain) GetParityInfo() (*json.RawMessage, error) {
	req := b.client.NewRPCRequest("parity_versionInfo")

	result := &json.RawMessage{}

	if err := b.client.CallRPC(req, result); err != nil {
		return nil, errors.Wrap(err, "error calling GetInfo")
	}

	return result, nil
}

// GetLatestBalance return the latest balance of address in wei
func (b *Blockchain) GetLatestBalance(address string) (*big.Int, error) {
	req := b.client.NewRPCRequest("eth_getBalance", address, "latest")

	var result string

	if err := b.client.CallRPC(req, &result); err != nil {
		return nil, errors.Wrap(err, "error calling GetLatestBalance")
	}

	i := new(big.Int)
	i.SetString(strings.Replace(result, "0x", "", 1), 16)

	return i, nil
}

// GetLatestBlockNumber returns the latest block number in hex string
func (b *Blockchain) GetLatestBlockNumber() (*string, error) {
	req := b.client.NewRPCRequest("eth_getBlockByNumber", "latest", false)

	result := &struct {
		Number string `json:"number"`
	}{}

	if err := b.client.CallRPC(req, result); err != nil {
		return nil, errors.Wrap(err, "error calling GetLatestBlockNumber")
	}

	return &result.Number, nil
}

// GetLatestTransactionCount returns the latest transaction count for address in hex string
func (b *Blockchain) GetLatestTransactionCount(address string) (*string, error) {
	req := b.client.NewRPCRequest("eth_getTransactionCount", address, "latest")

	var result string

	if err := b.client.CallRPC(req, &result); err != nil {
		return nil, errors.Wrap(err, "error calling GetLatestTransactionCount")
	}

	return &result, nil
}

// GetGasPrice retuns the gas price in hex string
func (b *Blockchain) GetGasPrice() (*string, error) {
	req := b.client.NewRPCRequest("eth_gasPrice")

	var result string

	if err := b.client.CallRPC(req, &result); err != nil {
		return nil, errors.Wrap(err, "error calling GetGasPrice")
	}

	return &result, nil
}

// GetLatestTokenBalanceOfAddress will return the latest balance of holder address at contractAddress in wei
func (b *Blockchain) GetLatestTokenBalanceOfAddress(contractAddress, address string) (*big.Int, error) {
	addressBytes, err := hex.DecodeString(strings.Replace(address, "0x", "", 1))
	if err != nil {
		return nil, errors.Wrapf(err, "error decoding string: %s", address)
	}

	d := sha3.NewLegacyKeccak256()
	d.Write([]byte("balanceOf(address)"))

	funcSelector := hex.EncodeToString(d.Sum(nil)[:4])
	addressParam := hex.EncodeToString(append(bytes.Repeat([]byte{0}, 12), addressBytes...))
	data := fmt.Sprintf("0x%s%s", funcSelector, addressParam)

	payload := struct {
		Data string `json:"data"`
		To   string `json:"to"`
	}{
		Data: data,
		To:   contractAddress,
	}

	req := b.client.NewRPCRequest("eth_call", payload, "latest")

	var result string

	if err := b.client.CallRPC(req, &result); err != nil {
		return nil, errors.Wrap(err, "error calling GetLatestTokenBalanceOfAddress")
	}

	i := new(big.Int)
	i.SetString(strings.Replace(result, "0x", "", 1), 16)

	return i, nil
}

// GetTransactionByHash retuns the transaction details for a ransaction hash
func (b *Blockchain) GetTransactionByHash(hash string) (*json.RawMessage, error) {
	req := b.client.NewRPCRequest("eth_getTransactionByHash", hash)

	result := &json.RawMessage{}

	if err := b.client.CallRPC(req, &result); err != nil {
		return nil, errors.Wrap(err, "error calling GetTransactionByHash")
	}

	return result, nil
}

// SendRawTransaction sends raw transaction string to the node and returns the transaction hash on success
func (b *Blockchain) SendRawTransaction(rawTx string) (*string, error) {
	if !strings.HasPrefix(rawTx, "0x") {
		rawTx = fmt.Sprintf("0x%s", rawTx)
	}

	req := b.client.NewRPCRequest("eth_sendRawTransaction", rawTx)

	var result string

	if err := b.client.CallRPC(req, &result); err != nil {
		return nil, errors.Wrap(err, "error calling SendRawTransaction")
	}

	return &result, nil
}
