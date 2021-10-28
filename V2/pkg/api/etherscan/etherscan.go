package etherscan

import (
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"

	"github.com/go-chi/render"
	"github.com/shapeshift-legacy/coinquery/V2/internal/log"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/blockchain/eth"
)

type response struct {
	Status  string      `json:"status"`
	Message string      `json:"message"`
	Result  interface{} `json:"result"`
}

func makeResponse(result interface{}) *response {
	return &response{
		Status:  "1",
		Message: "OK",
		Result:  result,
	}
}

// EtherscanServer wraps the eth rpc blockchain package
type EtherscanServer struct {
	bc *eth.Blockchain
}

// New returns a new EtherscanServer
func New(bc *eth.Blockchain) *EtherscanServer {
	return &EtherscanServer{
		bc: bc,
	}
}

// ActionRouter GET handler for /api?action={action} chooses correct handler based on action query param
func (e *EtherscanServer) ActionRouter(w http.ResponseWriter, r *http.Request) {
	action := r.URL.Query().Get("action")

	switch action {
	case "tokenbalance":
		e.TokenBalance(w, r)
		break
	case "balance":
		e.Balance(w, r)
		break
	case "eth_blockNumber":
		e.BlockNumber(w, r)
		break
	case "eth_gasPrice":
		e.GasPrice(w, r)
		break
	case "eth_getTransactionCount":
		e.TransactionCount(w, r)
		break
	case "eth_getTransactionByHash":
		e.TransactionByHash(w, r)
		break
	case "eth_sendRawTransaction":
		e.SendRawTransaction(w, r)
		break
	default:
		http.Error(w, "Action not supported", 404)
	}
}

// Info GET handler for /api/info gets node info
func (e *EtherscanServer) Info(w http.ResponseWriter, r *http.Request) {
	res, err := e.bc.GetParityInfo()
	if err != nil {
		log.Error(err, "server", "error resolving /info")
		http.Error(w, fmt.Sprintf("%v\n", err), 404)
		return
	}

	render.Respond(w, r, makeResponse(res))
}

// TokenBalance GET handler for /api?action=tokenbalance gets the token balance of address in contractAddress
func (e *EtherscanServer) TokenBalance(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		http.Error(w, "\"address\" parameter required", 400)
		return
	}

	contractAddress := r.URL.Query().Get("contractaddress")
	if address == "" {
		http.Error(w, "\"address\" parameter required", 400)
		return
	}

	res, err := e.bc.GetLatestTokenBalanceOfAddress(contractAddress, address)
	if err != nil {
		log.Error(err, "server", "error resolving /balance")
		http.Error(w, fmt.Sprintf("%v\n", err), 404)
		return
	}

	render.Respond(w, r, makeResponse(res.String()))
}

// Balance GET handler for /api?action=balance gets the balance of address
func (e *EtherscanServer) Balance(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		http.Error(w, "\"address\" parameter required", 400)
		return
	}

	res, err := e.bc.GetLatestBalance(address)
	if err != nil {
		log.Error(err, "server", "error resolving /balance")
		http.Error(w, fmt.Sprintf("%v\n", err), 404)
		return
	}

	render.Respond(w, r, makeResponse(res.String()))
}

// BlockNumber GET handler for /api?action=eth_blockNumber gets the latest block number
func (e *EtherscanServer) BlockNumber(w http.ResponseWriter, r *http.Request) {
	res, err := e.bc.GetLatestBlockNumber()
	if err != nil {
		log.Error(err, "server", "error resolving /eth_blockNumber")
		http.Error(w, fmt.Sprintf("%v\n", err), 404)
		return
	}

	render.Respond(w, r, makeResponse(res))
}

// GasPrice GET handler for /api?action=eth_gasPrice gets the current gas price
func (e *EtherscanServer) GasPrice(w http.ResponseWriter, r *http.Request) {
	res, err := e.bc.GetGasPrice()
	if err != nil {
		log.Error(err, "server", "error resolving /eth_gasPrice")
		http.Error(w, fmt.Sprintf("%v\n", err), 404)
		return
	}

	render.Respond(w, r, makeResponse(res))
}

// TransactionCount GET handler for /api?action=eth_getTransactionCount gets the latest transaction count for address
func (e *EtherscanServer) TransactionCount(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		http.Error(w, "\"address\" parameter required", 400)
		return
	}

	res, err := e.bc.GetLatestTransactionCount(address)
	if err != nil {
		log.Error(err, "server", "error resolving /eth_getTransactionCount")
		http.Error(w, fmt.Sprintf("%v\n", err), 404)
		return
	}

	render.Respond(w, r, makeResponse(res))
}

// TransactionByHash GET handler for /api?action=eth_getTransactionByHash gets the transaction details for a transaction hash
func (e *EtherscanServer) TransactionByHash(w http.ResponseWriter, r *http.Request) {
	hash := r.URL.Query().Get("hash")
	if hash == "" {
		http.Error(w, "\"hash\" parameter required", 400)
		return
	}

	res, err := e.bc.GetTransactionByHash(hash)
	if err != nil {
		log.Error(err, "server", "error resolving /eth_getTransactionByHash")
		http.Error(w, fmt.Sprintf("%v\n", err), 404)
		return
	}

	render.Respond(w, r, makeResponse(res))
}

// SendRawTransaction GET handler for /api?action=eth_sendRawTransaction publishes signed rawTx and returns tx hash
func (e *EtherscanServer) SendRawTransaction(w http.ResponseWriter, r *http.Request) {
	rawTx := r.URL.Query().Get("hex")
	if rawTx == "" {
		http.Error(w, "\"hex\" parameter required", 400)
		return
	}

	if _, err := hex.DecodeString(strings.Replace(rawTx, "0x", "", 1)); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	res, err := e.bc.SendRawTransaction(rawTx)
	if err != nil {
		log.Error(err, "server", "error resolving /eth_sendRawTransaction")
		http.Error(w, fmt.Sprintf("%v\n", err), 404)
		return
	}

	render.Respond(w, r, makeResponse(res))
}
