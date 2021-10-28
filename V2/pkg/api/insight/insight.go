package insight

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"

	"github.com/btcsuite/btcd/chaincfg"
	"github.com/btcsuite/btcutil"
	"github.com/go-chi/chi"
	"github.com/go-chi/render"
	"github.com/gorilla/schema"
	easyjson "github.com/mailru/easyjson"
	"github.com/pkg/errors"
	"github.com/shapeshift-legacy/coinquery/V2/config"
	"github.com/shapeshift-legacy/coinquery/V2/internal/log"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/api"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/blockchain/utxo"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/cashaddr"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/postgres"
)

type Coin string

const (
	DEFAULT_TXS           = 10
	MAX_TRANSACTIONS      = 50
	MAX_ADDRESSES         = 50
	BTC              Coin = "btc"
	BCH              Coin = "bch"
)

// InsightServer is a wrapper around server that holds insight only handlers
type InsightServer struct {
	bc     *utxo.Blockchain
	db     *postgres.Database
	config *config.Config
}

// New returns a new InsightServer
func New(bc *utxo.Blockchain, db *postgres.Database, c *config.Config) *InsightServer {
	return &InsightServer{
		bc:     bc,
		db:     db,
		config: c,
	}
}

// CoinCtx strips coin from url and places it on the ctx
func (i *InsightServer) CoinCtx(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		coin := chi.URLParam(r, "coin")

		if _, err := i.config.GetCoin(coin); err != nil {
			http.Error(w, fmt.Sprintf("invalid coin: [%s], must be one of the following: %v", coin, i.config.ListCoins()), 400)
			return
		}

		ctx := context.WithValue(r.Context(), "coin", coin)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// AddressesCtx strips addrs from url and places it on the ctx
func (i *InsightServer) AddressesCtx(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), "addrs", chi.URLParam(r, "addrs"))
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// BCHInterceptor converts BCH addresses to cashaddr format and replaces
// the stored context value. It is a noop for any not BCH addresses
func (i *InsightServer) BCHInterceptor(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		coin, _ := r.Context().Value("coin").(string)

		if Coin(coin) == BCH {
			addrs := splitAndTrim(chi.URLParam(r, "addrs"))
			cashAddrs := make([]string, 0)
			for _, addr := range addrs {
				decoded, err := btcutil.DecodeAddress(addr, &chaincfg.MainNetParams)
				if err != nil {
					log.Errorf(err, "insight", "unable to decode bch address %s", decoded)
				}

				// check encode and add prefix
				// TODO: Do we always assume P2PKH or does that need to be parameterized
				encoded := cashaddr.CheckEncodeCashAddress(decoded.ScriptAddress(), "bitcoincash", cashaddr.P2PKH)
				encoded = "bitcoincash:" + encoded
				cashAddrs = append(cashAddrs, encoded)
			}

			ctx := context.WithValue(r.Context(), "addrs", strings.Join(cashAddrs, ","))
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}

		next.ServeHTTP(w, r)
	})
}

// Status GET handler for insight/{coin}/status/q={param} gets status for param
func (i *InsightServer) Status(w http.ResponseWriter, r *http.Request) {
	queryParam := r.URL.Query().Get("q")

	switch queryParam {
	case "getLastBlockHash":
		dbLastBlock, err := i.db.LastBlock()
		if err != nil {
			log.Error(err, "insight", "error resolving /status/q=getLastBlockHash")
			http.Error(w, fmt.Sprintf("%v\n", err), 500)
			return
		}

		status := struct {
			SyncTipHash   string `json:"syncTipHash"`
			LastBlockHash string `json:"lastblockhash"`
		}{
			SyncTipHash:   dbLastBlock.Hash,
			LastBlockHash: dbLastBlock.Hash,
		}

		render.Respond(w, r, status)
	default:
		render.PlainText(w, r, "unknown query parameter")
	}
}

// BlockByBlockHash GET handler for insight/{coin}/block/{blockHash} gets a block by it's block hash
func (i *InsightServer) BlockByBlockHash(w http.ResponseWriter, r *http.Request) {
	blockHash := chi.URLParam(r, "blockHash")

	lb, err := i.db.LastBlock()
	if err != nil {
		log.Error(err, "insight", "error resolving /block/{blockHash}")
		http.Error(w, fmt.Sprintf("%v\n", err), 500)
		return
	}

	block, err := i.db.GetBlock(blockHash)
	if err != nil {
		log.Error(err, "insight", "error resolving /block/{blockHash}")
		http.Error(w, fmt.Sprintf("%v\n", err), 500)
		return
	}

	confirmations := lb.Height - block.Height + 1
	if block.IsOrphan {
		confirmations = -1
	}

	b := &insightBlock{
		Block:         block,
		Confirmations: confirmations,
	}
	// Marshal with easyjson instead of default marshaller
	if status, ok := r.Context().Value("status").(int); ok {
		w.WriteHeader(status)
	}
	_, _, err = easyjson.MarshalToHTTPResponseWriter(b, w)
	if err != nil {
		log.Error(err, "insight", "error marshalling /block/{blockHash}")
		http.Error(w, fmt.Sprintf("%v\n", err), 500)
		return
	}
}

// TxByTxID GET handler for insight/{coin}/tx/{txid} to get transaction details by txid
func (i *InsightServer) TxByTxID(w http.ResponseWriter, r *http.Request) {
	txid := chi.URLParam(r, "txid")

	txs, err := i.getTxs([]string{txid})
	if err != nil {
		log.Error(err, "insight", "error resolving /tx/{txid}")
		http.Error(w, fmt.Sprintf("%v\n", err), 500)
		return
	}

	render.Respond(w, r, txs[0])
}

// RawTxByTxID GET handler for insight/{coin}/rawtx/{txid} to get raw hex by txid
func (i *InsightServer) RawTxByTxID(w http.ResponseWriter, r *http.Request) {
	txid := chi.URLParam(r, "txid")

	rawTx, err := i.db.GetRawTxByTxID(txid)
	if err != nil {
		log.Error(err, "insight", "error resolving /rawtx/{txid}")
		http.Error(w, fmt.Sprintf("%v\n", err), 500)
		return
	}

	render.Respond(w, r, rawTx)
}

// TxsByBlockHash GET handler for /{coin}/txs/?block={blockHash}&pageNum={pageNum} to get paginated transactions by block hash
func (i *InsightServer) TxsByBlockHash(w http.ResponseWriter, r *http.Request) {
	const pageSize int = 100

	blockHash := r.URL.Query().Get("block")
	if blockHash == "" {
		http.Error(w, "Block hash or address expected", 400)
		return
	}

	pageNum, _ := strconv.Atoi(r.URL.Query().Get("pageNum"))

	limitClause := fmt.Sprintf("LIMIT %d", pageSize)
	offsetClause := fmt.Sprintf("OFFSET %d", pageNum*pageSize)

	txIds, err := i.db.GetTxHashesByBlockHash(blockHash, limitClause, offsetClause)
	if err != nil {
		log.Error(err, "insight", "error resolving /txs?block={blockHash}&pageNum={pageNum}")
		http.Error(w, fmt.Sprintf("%v\n", err), 500)
		return
	}

	txs, err := i.getTxs(txIds)
	if err != nil {
		log.Error(err, "insight", "error resolving /txs?block={blockHash}&pageNum={pageNum}")
		http.Error(w, fmt.Sprintf("%v\n", err), 500)
		return
	}

	total, err := i.db.GetTotalTxsByBlockHash(blockHash)
	totalPages := int(math.Floor(float64(total+pageSize-1)) / float64(pageSize))

	t := &insightTxsByBlock{
		PagesTotal: totalPages,
		Txs:        txs,
	}

	// Marshal with easyjson instead of default marshaller
	if status, ok := r.Context().Value("status").(int); ok {
		w.WriteHeader(status)
	}
	_, _, err = easyjson.MarshalToHTTPResponseWriter(t, w)
	if err != nil {
		log.Error(err, "insight", "error marshalling /block/{blockHash}")
		http.Error(w, fmt.Sprintf("%v\n", err), 500)
		return
	}
}

// SendRawTx POST handler for /{coin}/tx/send sends raw tx and returns txid
func (i *InsightServer) SendRawTx(w http.ResponseWriter, r *http.Request) {
	b := struct {
		RawTx string `json:"rawtx" schema:"rawtx"`
	}{}

	if err := decodeRequest(&b, r); err != nil {
		log.Warn(err, "insight", "error decoding request")
		http.Error(w, fmt.Sprintf("error decoding request: %v\n", err), 400)
		return
	}

	txid, err := i.bc.SendRawTransaction(b.RawTx)
	if err != nil {
		log.Error(err, "insight", "error resolving /tx/send")
		http.Error(w, fmt.Sprintf("%v\n", err), 500)
		return
	}

	t := struct {
		TxID string `json:"txid"`
	}{
		TxID: txid,
	}

	render.Respond(w, r, t)
}

// TxHistoryByAddrs GET handler for /{coin}/{addrs}/txs/?from={from}&to={to}
func (i *InsightServer) TxHistoryByAddrs(w http.ResponseWriter, r *http.Request) {
	addrs := r.Context().Value("addrs").(string)
	from := r.URL.Query().Get("from")
	to := r.URL.Query().Get("to")

	tp, err := api.TraditionalPagintion(from, to, DEFAULT_TXS, MAX_TRANSACTIONS)
	if err != nil {
		log.Error(err, "insight", "error setting pagination")
		http.Error(w, fmt.Sprintf("%v\n", err), 422)
		return
	}

	splitAddrs := splitAndTrim(addrs)

	txids, err := i.db.GetTxIDsByAddresses(splitAddrs, tp.LimitClause, "", tp.OffsetClause)
	if err != nil {
		log.Error(err, "insight", "error resolving /{addrs}/txs?from={from}&to={to}")
		http.Error(w, fmt.Sprintf("%v\n", err), 500)
		return
	}

	txs, err := i.getTxs(txids)
	if err != nil {
		log.Error(err, "insight", "error resolving /{addrs}/txs?from={from}&to={to}")
		http.Error(w, fmt.Sprintf("%v\n", err), 500)
		return
	}

	if len(txs) < tp.ToPage-tp.FromPage {
		tp.ToPage = tp.FromPage + len(txs)
	}

	totalCount, err := i.db.GetTotalTxsByAddresses(splitAddrs)
	if err != nil {
		log.Error(err, "insight", "error resolving /{addrs}/txs?from={from}&to={to}")
		http.Error(w, fmt.Sprintf("%v\n", err), 500)
		return
	}

	t := &insightTxHistoryByAddrs{
		TotalItems: totalCount,
		From:       tp.FromPage,
		To:         tp.ToPage,
		Txs:        txs,
	}
	// Marshal with easyjson instead of default marshaller
	if status, ok := r.Context().Value("status").(int); ok {
		w.WriteHeader(status)
	}
	_, _, err = easyjson.MarshalToHTTPResponseWriter(t, w)
	if err != nil {
		log.Error(err, "insight", "error marshalling /{addrs}/txs?from={from}&to={to}")
		http.Error(w, fmt.Sprintf("%v\n", err), 500)
		return
	}
}

// UtxosByAddrs GET handler for /{coin}/{addrs}/utxos
func (i *InsightServer) UtxosByAddrs(w http.ResponseWriter, r *http.Request) {
	addrs := r.Context().Value("addrs").(string)
	splitAddrs := splitAndTrim(addrs)
	if len(splitAddrs) > MAX_ADDRESSES {
		http.Error(w, fmt.Sprintf("You have requested %d addresses. Max: %d", len(splitAddrs), MAX_ADDRESSES), 422)
		return
	}

	outputs, err := i.getUtxos(splitAddrs)
	if err != nil {
		log.Error(err, "insight", "error resolving /{addrs}/utxos")
		http.Error(w, fmt.Sprintf("%v\n", err), 500)
		return
	}

	// Marshal with easyjson instead of default marshaller
	if status, ok := r.Context().Value("status").(int); ok {
		w.WriteHeader(status)
	}
	_, _, err = easyjson.MarshalToHTTPResponseWriter(insightUtxos(outputs), w)
	if err != nil {
		log.Error(err, "insight", "error marshalling /{addrs}/utxos")
		http.Error(w, fmt.Sprintf("%v\n", err), 500)
		return
	}
}

func decodeRequest(b interface{}, r *http.Request) error {
	if r.Header.Get("Content-type") == "application/x-www-form-urlencoded" {
		if err := r.ParseForm(); err != nil {
			return errors.Wrap(err, "error parsing form")
		}

		d := schema.NewDecoder()
		d.IgnoreUnknownKeys(true)

		if err := d.Decode(b, r.Form); err != nil {
			return errors.Wrap(err, "error decoding body from form")
		}
	} else {
		if err := json.NewDecoder(r.Body).Decode(b); err != nil {
			return errors.Wrap(err, "error decoding body from json")
		}
	}

	return nil
}

func splitAndTrim(str string) []string {
	ss := strings.Split(str, ",")

	for i := range ss {
		ss[i] = strings.TrimSpace(ss[i])
	}

	return ss
}
