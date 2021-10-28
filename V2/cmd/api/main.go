package main

import (
	"flag"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi"
	chiMiddleware "github.com/go-chi/chi/middleware"
	"github.com/go-chi/cors"
	"github.com/go-chi/render"
	"github.com/shapeshift-legacy/coinquery/V2/config"
	"github.com/shapeshift-legacy/coinquery/V2/internal/log"
	"github.com/shapeshift-legacy/coinquery/V2/internal/middleware"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/api/etherscan"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/api/insight"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/api/server"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/blockchain/eth"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/blockchain/utxo"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/postgres"
)

var (
	port = 8000

	conf = flag.String("config", "./config/local.json", "path to configuration json file")
	coin = flag.String("coin", "btc", "coin for blockchain rpc")
)

func newBaseRouter() *chi.Mux {
	r := chi.NewRouter()

	cors := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300, // Maximum value not ignored by any of major browsers
	})

	// Set up base middleware
	r.Use(
		render.SetContentType(render.ContentTypeJSON), // set content-type headers as application/json

		middleware.Logger,                    // log api request calls
		chiMiddleware.DefaultCompress,        // compress results, mostly gzipping assets and json
		chiMiddleware.Recoverer,              // recover from panics without crashing server
		chiMiddleware.Timeout(3*time.Second), // Stop processing after 3 seconds
		chiMiddleware.Throttle(500),          // limit number of concurrently processed requests
		cors.Handler,                         // default cors rules
	)

	return r
}

func newETHRouter(bc *eth.Blockchain) *chi.Mux {
	e := etherscan.New(bc)

	r := newBaseRouter()

	// Set up extended middleware
	r.Use(
		middleware.Auth,            // require api key for authorization
		chiMiddleware.StripSlashes, // match paths with a trailing slash, strip it, and continue routing through the mux
	)

	// Favicon handler
	r.Get("/favicon.ico", func(w http.ResponseWriter, r *http.Request) { w.Write([]byte("fav")) })

	// AWS ECS health-check endpoint
	r.Get("/ping", func(w http.ResponseWriter, r *http.Request) { render.JSON(w, r, "pong") })

	// Restful Routes
	r.Route("/api", func(r chi.Router) {
		r.Get("/", e.ActionRouter)
		r.Get("/info", e.Info)
	})

	return r
}

func newUTXORouter(db *postgres.Database, bc *utxo.Blockchain, c *config.Config) *chi.Mux {
	s := server.New(bc, db, c)
	i := insight.New(bc, db, c)

	r := newBaseRouter()

	// only enable pprof in non-production environments, and disable StripSlashes for non-production environments
	// there is a documented problem when both StripSlashes and pprof are enabled at the same time
	if os.Getenv("ENVIRONMENT") == "prod" {
		r.Use(chiMiddleware.StripSlashes) // match paths with a trailing slash, strip it, and continue routing through the mux
	} else {
		// this middleware should only be used on non-production environments
		// to preserve compatability with keepkey client
		r.Use(middleware.APIKeyHarasser)

		r.Mount("/debug", chiMiddleware.Profiler())
	}

	// Favicon handler
	r.Get("/favicon.ico", func(w http.ResponseWriter, r *http.Request) { w.Write([]byte("fav")) })

	// AWS ECS health-check endpoint
	r.Get("/ping", func(w http.ResponseWriter, r *http.Request) { render.JSON(w, r, "pong") })

	// Restful Routes
	r.Route("/api", func(r chi.Router) {
		r.Route("/{coin}", func(r chi.Router) {
			r.Use(i.CoinCtx)
			r.Get("/info", s.Info)
		})

		// Insight endpoints
		r.Route("/insight", func(r chi.Router) {
			r.Route("/{coin}", func(r chi.Router) {
				r.Use(i.CoinCtx)
				r.Get("/status", i.Status)
				r.Get("/block/{blockHash}", i.BlockByBlockHash)
				r.Get("/tx/{txid}", i.TxByTxID)
				r.Get("/rawtx/{txid}", i.RawTxByTxID)
				r.Get("/txs", i.TxsByBlockHash)
				r.Group(func(r chi.Router) {
					r.Use(i.AddressesCtx)
					r.Use(i.BCHInterceptor)
					r.Get("/addrs/{addrs}/txs", i.TxHistoryByAddrs)
					r.Get("/addrs/{addrs}/utxo", i.UtxosByAddrs)
				})
				r.Post("/tx/send", i.SendRawTx)

				// support kk client redirect from v1 endpoint to cq v2
				r.Get("/api/status", i.Status)
				r.Get("/api/block/{blockHash}", i.BlockByBlockHash)
				r.Get("/api/tx/{txid}", i.TxByTxID)
				r.Get("/api/txs", i.TxsByBlockHash)
				r.Group(func(r chi.Router) {
					r.Use(i.AddressesCtx)
					r.Use(i.BCHInterceptor)
					r.Get("/api/addrs/{addrs}/txs", i.TxHistoryByAddrs)
					r.Get("/api/addrs/{addrs}/utxo", i.UtxosByAddrs)
				})
				r.Post("/api/tx/send", i.SendRawTx)
			})
		})
	})

	return r
}

func main() {
	flag.Parse()

	log.Initialize("coinquery-api", *coin)

	c, err := config.Get(*conf)
	if err != nil {
		log.Fatal(err, "main")
	}

	cc, err := c.GetCoin(*coin)
	if err != nil {
		log.Fatal(err, "main")
	}

	rpcConfig := c.GetRPCConfig(cc)

	var router *chi.Mux
	if *coin == "eth" || *coin == "ethrinkeby" || *coin == "ethropsten" {
		chainConn := eth.New(rpcConfig)
		router = newETHRouter(chainConn)
	} else {
		dbConfig, err := c.GetDBConfig(config.ReadOnly, cc)
		if err != nil {
			log.Fatal(err, "main")
		}

		dbConn, err := postgres.New(dbConfig, *coin)
		if err != nil {
			log.Fatal(err, "main")
		}

		defer func() {
			err := dbConn.Close()
			if err != nil {
				log.Fatal(err, "main", "error closing db")
			}
		}()

		chainConn := utxo.New(rpcConfig, *coin)
		router = newUTXORouter(dbConn, chainConn, c)
	}

	walkFunc := func(method string, route string, handler http.Handler, middlewares ...func(http.Handler) http.Handler) error {
		log.Debugf("main", "%s %s\n", method, route) // walk and print all the routes
		return nil
	}

	if err := chi.Walk(router, walkFunc); err != nil {
		log.Panicf(err, "main", "error walking through routes")
	}

	log.Infof("main", "Serving application on port: %d", port)

	if err := http.ListenAndServe(fmt.Sprintf(":%d", port), router); err != nil {
		log.Fatal(err, "main", "error serving application")
	}
}
