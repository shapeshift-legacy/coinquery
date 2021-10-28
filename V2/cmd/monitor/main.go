package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/go-chi/chi"
	chiMiddleware "github.com/go-chi/chi/middleware"
	"github.com/go-chi/render"
	"github.com/shapeshift-legacy/coinquery/V2/config"
	"github.com/shapeshift-legacy/coinquery/V2/internal/log"
	"github.com/shapeshift-legacy/coinquery/V2/internal/middleware"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/blockchain/utxo"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/postgres"
)

var (
	conf = flag.String("config", "config/local.json", "path to configuration json file")
	coin = flag.String("coin", "", "coin for blockchain rpc")
)

var port = 8000
var monitorInterval = 30 * time.Second

type monitor struct {
	db *postgres.Database
	bc *utxo.Blockchain
}

func newMonitor() *monitor {
	c, err := config.Get(*conf)
	if err != nil {
		log.Fatal(err, "main")
	}

	cc, err := c.GetCoin(*coin)
	if err != nil {
		log.Fatal(err, "main")
	}

	dbConfig, err := c.GetDBConfig(config.ReadWrite, cc)
	if err != nil {
		log.Fatal(err, "main")
	}

	dbConn, err := postgres.New(dbConfig, *coin)
	if err != nil {
		log.Fatal(err, "main")
	}

	rpcConfig := c.GetRPCConfig(cc)
	chainConn := utxo.New(rpcConfig, *coin)

	return &monitor{
		db: dbConn,
		bc: chainConn,
	}
}

func main() {
	flag.Parse()

	log.Initialize("coinquery-monitor", *coin)

	m := newMonitor()

	defer func() {
		err := m.db.Close()
		if err != nil {
			log.Fatal(err, "main", "error closing db")
		}
	}()

	go func() {
		ticker := time.NewTicker(monitorInterval)

		for {
			select {
			case <-ticker.C:
				go m.compareHeights()
			}
		}
	}()

	r := chi.NewRouter()

	// Set up middleware
	r.Use(
		render.SetContentType(render.ContentTypeJSON), // set content-type headers as application/json

		middleware.Logger,                    // log api request calls
		chiMiddleware.DefaultCompress,        // compress results, mostly gzipping assets and json
		chiMiddleware.Recoverer,              // recover from panics without crashing server
		chiMiddleware.Timeout(3*time.Second), // Stop processing after 3 seconds
	)

	// Healthcheck endpoint
	r.Get("/ping", func(w http.ResponseWriter, r *http.Request) { render.JSON(w, r, "pong") })

	r.Route("/monitor", func(r chi.Router) {
		r.Route("/{coin}", func(r chi.Router) {
			r.Route("/notify", func(r chi.Router) {
				r.Post("/newBlock", m.newBlock)
			})
		})
	})

	log.Infof("main", "serving monitor on port: %d", port)

	if err := http.ListenAndServe(fmt.Sprintf(":%d", port), r); err != nil {
		log.Fatal(err, "main", "error serving application")
	}
}

func (m *monitor) newBlock(w http.ResponseWriter, r *http.Request) {
	b := struct {
		Height int `json:"height"`
	}{}

	if err := json.NewDecoder(r.Body).Decode(&b); err != nil {
		log.Error(err, "error decoding body from json")
	}

	log.Debugf("main", "newBlock: %v", b.Height)

	go m.handleOrphans()

	w.WriteHeader(http.StatusOK)
}

func (m *monitor) compareHeights() {
	lb, err := m.db.LastBlock()
	if err != nil {
		log.Warn(err, "main", "failed to compare heights")
		return
	}

	ci, err := m.bc.GetChainInfo()
	if err != nil {
		log.Warn(err, "main", "failed to compare heights")
		return
	}

	if lb.Height != ci.Blocks {
		err = fmt.Errorf("db (%v) != node (%v)", lb.Height, ci.Blocks)
		log.Errorf(err, "main", "coinquery is out of sync (https://%s.redacted.example.com/api/%s/info)", os.Getenv("ENVIRONMENT"), *coin)
	}
}

func (m *monitor) handleOrphans() {
	value, err := m.db.Get("orphanCount")
	if err != nil {
		log.Warn(err, "main", "failed to handle orphans")
		return
	}

	orphanCount, err := strconv.Atoi(value)
	if err != nil {
		log.Warn(err, "main", "failed to handle orphans")
		return
	}

	count, err := m.db.GetOrphanCount()
	if err != nil {
		log.Warn(err, "main", "failed to handle orphans")
		return
	}

	if count > orphanCount {
		log.Infof("main", "reorg detected with %d blocks orphaned since last check", count-orphanCount)

		if err := m.db.DeleteOrphans(); err != nil {
			log.Error(err, "main", "failed to handle orphans")
			return
		}

		if err := m.db.Set("orphanCount", strconv.Itoa(count)); err != nil {
			log.Error(err, "main", "failed to handle orphans")
			return
		}
	}
}
