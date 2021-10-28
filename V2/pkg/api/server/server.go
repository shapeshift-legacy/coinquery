package server

import (
	"context"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"

	"github.com/go-chi/chi"
	"github.com/go-chi/render"
	"github.com/shapeshift-legacy/coinquery/V2/config"
	"github.com/shapeshift-legacy/coinquery/V2/internal/log"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/blockchain/utxo"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/postgres"
)

// Server will hold connection to the db as well as handlers
type Server struct {
	bc     *utxo.Blockchain
	db     *postgres.Database
	config *config.Config
}

// New returns a new Server
func New(bc *utxo.Blockchain, db *postgres.Database, c *config.Config) *Server {
	return &Server{
		bc:     bc,
		db:     db,
		config: c,
	}
}

// CoinCtx strips coin from url and places it on the ctx
func (i *Server) CoinCtx(next http.Handler) http.Handler {
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

// Info handler for /{coin}/info
func (i *Server) Info(w http.ResponseWriter, r *http.Request) {
	gvBytes, _ := ioutil.ReadFile("git-version")
	gv := strings.TrimSuffix(string(gvBytes), "\n")

	ci, err := i.bc.GetChainInfo()
	if err != nil {
		log.Error(err, "server", "error resolving /info")
		http.Error(w, fmt.Sprintf("%v\n", err), 404)
		return
	}

	ct, err := i.bc.GetChainTips()
	if err != nil {
		log.Error(err, "server", "error resolving /info")
		http.Error(w, fmt.Sprintf("%v\n", err), 404)
		return
	}

	b, err := i.db.LastBlock()
	if err != nil {
		log.Error(err, "server", "error resolving /info")
		http.Error(w, fmt.Sprintf("%v\n", err), 404)
		return
	}

	resp := struct {
		Version    string           `json:"version"`
		ChainInfo  *utxo.ChainInfo  `json:"chainInfo"`
		ChainTips  []*utxo.ChainTip `json:"chainTips"`
		SyncStatus struct {
			NodeHeight int     `json:"nodeHeight"`
			DBHeight   int     `json:"dbHeight"`
			Percent    float32 `json:"percent"`
		} `json:"syncStatus"`
	}{
		Version:   gv,
		ChainInfo: ci,
		ChainTips: ct,
		SyncStatus: struct {
			NodeHeight int     `json:"nodeHeight"`
			DBHeight   int     `json:"dbHeight"`
			Percent    float32 `json:"percent"`
		}{
			NodeHeight: ci.Blocks,
			DBHeight:   b.Height,
			Percent:    (float32(b.Height) / float32(ci.Blocks) * 100),
		},
	}

	render.Respond(w, r, resp)
}
