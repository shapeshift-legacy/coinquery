package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/lib/pq"
	"github.com/pkg/errors"
	"github.com/shapeshift-legacy/coinquery/V2/config"
	"github.com/shapeshift-legacy/coinquery/V2/internal/convert"
	"github.com/shapeshift-legacy/coinquery/V2/internal/log"
	"github.com/shapeshift-legacy/coinquery/V2/internal/pretty"
	"github.com/shapeshift-legacy/coinquery/V2/internal/retry"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/blockchain/utxo"
)

// Database is our sweet database struct. Used for interacting with the database
type Database struct {
	DB
	prefix  schemaPrefix // schema prefix eg. btc, ltc
	sem     chan struct{}
	closing chan struct{} // signal monitor to terminate
	retry   config.Retry
	timeout time.Duration // timeout for autocancelling long running queries
}

// schemaPrefix is the table prefix for various coins
type schemaPrefix string

const (
	btc        schemaPrefix = "btc"
	bch        schemaPrefix = "bch"
	btctestnet schemaPrefix = "btctestnet"
	dgb        schemaPrefix = "dgb"
	ltc        schemaPrefix = "ltc"
	dash       schemaPrefix = "dash"
	doge       schemaPrefix = "doge"
)

// DB defines the interface that a database must implement
type DB interface {
	Exec(query string, args ...interface{}) (sql.Result, error)
	QueryRow(query string, args ...interface{}) *sql.Row
	QueryRowContext(ctx context.Context, query string, args ...interface{}) *sql.Row
	Query(query string, args ...interface{}) (*sql.Rows, error)
	QueryContext(ctx context.Context, query string, args ...interface{}) (*sql.Rows, error)
	Close() error
}

// Tx is shape of transaction for return from graphql and API rest interfaces
type Tx struct {
	ID          int      `json:"id,string"`
	TxID        string   `json:"txid"`
	Hash        string   `json:"hash"`
	Version     int      `json:"version"`
	Size        int      `json:"size"`
	VSize       int      `json:"vsize"`
	Weight      int      `json:"weight"`
	Locktime    int      `json:"locktime"`
	Inputs      []Input  `json:"vin"`
	Outputs     []Output `json:"vout"`
	BlockHash   string   `json:"blockhash"`
	BlockHeight int64    `json:"blockheight"`
	Time        string   `json:"time"`
	BlockTime   string   `json:"blocktime"`
	Cursor      string   `json:"cursor"`
	Mempool     bool     `json:"mempool"`
}

// PendingTx contains data to validate against mempool
type PendingTx struct {
	ID   int    `json:"id,string"`
	TxID string `json:"txid"`
}

// Input is utxo shape
type Input struct {
	Vin         int      `json:"vin"`
	SpentTx     string   `json:"spent_txid"`
	SpentVout   int      `json:"spent_vout"`
	Asm         string   `json:"asm"`
	Hex         string   `json:"hex"`
	Sequence    int      `json:"sequence"`
	TxInWitness []string `json:"txinwitness"`
	Coinbase    string   `json:"coinbase"`
}

// Output is utxo shape
type Output struct {
	Vout      int      `json:"vout"`
	SatAmount int64    `json:"amount"`
	Asm       string   `json:"asm"`
	Hex       string   `json:"hex"`
	ReqSigs   int      `json:"reqSigs"`
	Type      string   `json:"type"`
	Address   string   `json:"address"`
	Addresses []string `json:"addresses"`
}

// SpentTxDetails structure
type SpentTxDetails struct {
	SpentTxID   string `json:"spentTxId"`
	SpentIndex  int    `json:"spentIndex"`
	SpentHeight int64  `json:"spentHeight"`
}

// Utxo structure
type Utxo struct {
	Vout        int    `json:"vout"`
	Hex         string `json:"hex"`
	ReqSigs     int    `json:"reqSigs"`
	Type        string `json:"type"`
	Address     string `json:"address"`
	SatAmount   int64  `json:"amount"`
	TxID        string `json:"txid"`
	BlockHeight int64  `json:"height"`
	Timestamp   string `json:"ts"`
}

// RawTx structure
type RawTx struct {
	Hex string `json:"rawtx"`
}

// defaultDeadline returns a context set to expire after the databases default timeout setting.
// The cancelFunc should always be invoked when done to prevent a context leak
func (d *Database) defaultDeadline() (context.Context, context.CancelFunc) {
	if d.timeout > 0 {
		return context.WithTimeout(context.Background(), d.timeout)
	}

	return context.WithCancel(context.Background())
}

// compile replaces schema prefixes within a given query string
func compile(query string, prefix schemaPrefix) string {
	return strings.Replace(query, "_SCHEMA_", string(prefix), -1)
}

func schemaFromCoin(coin string) schemaPrefix {
	switch strings.ToUpper(coin) {
	case "BTC":
		return btc
	case "BCH":
		return bch
	case "BTCTESTNET":
		return btctestnet
	case "DGB":
		return dgb
	case "LTC":
		return ltc
	case "DASH":
		return dash
	case "DOGE":
		return doge
	default:
		return ""
	}
}

// monitor repeatedly pings the provided db and attempts to reconnect if the connection drops
func monitor(db *sql.DB, closing chan struct{}) {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if err := db.Ping(); err != nil {
				log.Warn(err, "postgres", "db failed to respond")
			}
		case <-closing:
			return
		}
	}
}

// New makes a new database using the connection string and returns it, otherwise returns the error
func New(dbConfig *config.DB, coin string) (*Database, error) {
	db, err := sql.Open("postgres", dbConfig.URI)
	if err != nil {
		return nil, errors.Wrap(err, "failed to open connection to db")
	}

	var prefix schemaPrefix
	if prefix = schemaFromCoin(coin); prefix == "" {
		return nil, errors.Wrap(fmt.Errorf("Coin: %s is unsupported", coin), "Invalid schema for given coin")
	}

	log.Info("postgres", "connected to db successfully")

	db.SetMaxOpenConns(dbConfig.MaxConns)
	db.SetMaxIdleConns(dbConfig.MaxConns / 2)
	db.SetConnMaxLifetime(time.Duration(dbConfig.MaxConnLifetime) * time.Second)

	if err := db.Ping(); err != nil {
		return nil, errors.Wrap(err, "failed to communicate with db")
	}

	// Start monitor go-routine
	closing := make(chan struct{})
	go monitor(db, closing)

	return &Database{
		DB:      db,
		sem:     make(chan struct{}, dbConfig.MaxConns),
		closing: closing,
		retry:   dbConfig.Retry,
		prefix:  prefix,
		timeout: time.Duration(dbConfig.Timeout) * time.Second,
	}, nil
}

// Close signals the monitor to stop and closes the underlying db connection
func (d *Database) Close() error {
	d.closing <- struct{}{}
	return d.DB.Close()
}

// Get returns the value of key
func (d *Database) Get(key string) (string, error) {
	query := compile(`
		SELECT
			value
		FROM
			_SCHEMA_.metadata
		WHERE
			key = $1;
		`, d.prefix)

	d.sem <- struct{}{} // Add token
	row := d.QueryRow(query, key)
	<-d.sem // Remove token

	var value string
	if err := row.Scan(&value); err != nil {
		return "", errors.Wrapf(err, "failed to get value for key: %s", key)
	}

	return value, nil
}

// Set inserts or updates key with value
func (d *Database) Set(key, value string) error {
	query := compile(`
		INSERT INTO _SCHEMA_.metadata(key, value)
		VALUES($1, $2)
		ON CONFLICT(key) DO UPDATE SET value = $2
	`, d.prefix)

	d.sem <- struct{}{} // Add token
	_, err := d.Exec(query, key, value)
	<-d.sem // Remove token

	if err != nil {
		return errors.Wrapf(err, "failed to set key: %s, with value: %s", key, value)
	}

	return nil
}

// GetOrphanCount returns the number of orphaned blocks in the db
func (d *Database) GetOrphanCount() (int, error) {
	query := compile(`
		SELECT
			COUNT(*)
		FROM
			_SCHEMA_.block
		WHERE
			is_orphaned = TRUE;
		`, d.prefix)

	d.sem <- struct{}{} // Add token
	row := d.QueryRow(query)
	<-d.sem // Remove token

	var count int
	if err := row.Scan(&count); err != nil {
		return 0, errors.Wrap(err, "failed to get orphan count")
	}

	return count, nil
}

// DeleteOrphans will delete all orphaned txs and associated inputs and outputs
func (d *Database) DeleteOrphans() error {
	return retry.Simple(d.retry.Attempts, 3, func() error {
		query := compile(`SELECT _SCHEMA_.delete_orphans()`, d.prefix)

		d.sem <- struct{}{} // Add token
		_, err := d.Exec(query)
		<-d.sem // Remove token

		if err != nil {
			return errors.Wrap(err, "failed to delete orphans")
		}

		return nil
	})
}

// GetNumTransactions returns the number of transactions in the db
func (d *Database) GetNumTransactions() (int, error) {
	query := compile(`
		SELECT
			n_live_tup AS EstimatedCount
		FROM
			pg_stat_user_tables
		WHERE
			schemaname = '_SCHEMA_'
			AND relname = 'transaction';
	`, d.prefix)

	ctx, cancel := d.defaultDeadline()
	defer cancel()

	d.sem <- struct{}{} // Add token
	row := d.QueryRowContext(ctx, query)
	<-d.sem // Remove token

	var count int
	if err := row.Scan(&count); err != nil {
		return 0, errors.Wrap(err, "failed to get transaction count")
	}

	return count, nil
}

// GetPendingTxs returns all pending transactions
func (d *Database) GetPendingTxs(limitClause string) ([]*PendingTx, error) {
	query := compile(
		fmt.Sprintf(`
		SELECT
			id,
			txid
		FROM
			_SCHEMA_.transaction
		WHERE
			block_id IS NULL
		%s
		ORDER BY id ASC;
	`, limitClause), d.prefix)

	d.sem <- struct{}{} // Add token
	rows, err := d.Query(query)
	<-d.sem // Remove token

	if err != nil {
		return nil, errors.Wrap(err, "failed to get pending transactions")
	}

	txs := []*PendingTx{}
	for rows.Next() {
		tx := &PendingTx{}

		err := rows.Scan(&tx.ID, &tx.TxID)
		if err != nil {
			return nil, errors.Wrap(err, "failed to scan row when retrieving pending transactions")
		}

		txs = append(txs, tx)
	}

	return txs, nil
}

// GetTxAtBlockTime returns the earliest inserted transaction at the block closest to date
func (d *Database) GetTxAtBlockTime(date time.Time) (int, error) {
	query := compile(`
		SELECT 
			id
		FROM
			_SCHEMA_.transaction
		WHERE block_id = (
			SELECT
				id
			FROM
				_SCHEMA_.block
			WHERE
				mined_time >= $1
			ORDER BY id ASC
			LIMIT 1
		)
		ORDER BY id ASC
		LIMIT 1;
	`, d.prefix)

	ctx, cancel := d.defaultDeadline()
	defer cancel()

	d.sem <- struct{}{} // Add token
	row := d.QueryRowContext(ctx, query, date)
	<-d.sem // Remove token

	var id int
	if err := row.Scan(&id); err != nil {
		return 0, errors.Wrap(err, "failed to get highest validated transaction")
	}

	return id, nil
}

// DeleteInvalidTxs removes invalid transactions and associated inputs/outputs
func (d *Database) DeleteInvalidTxs(ids []int) error {
	return retry.Simple(d.retry.Attempts, 3, func() error {
		query := compile(`SELECT _SCHEMA_.delete_invalid_txs($1)`, d.prefix)

		d.sem <- struct{}{} // Add token
		_, err := d.Exec(query, pq.Array(ids))
		<-d.sem // Remove token

		if err != nil {
			return errors.Wrapf(err, "failed to delete invalid txs: %v", ids)
		}

		return nil
	})
}

// InsertBlock inserts a utxo.Block into the database
func (d *Database) InsertBlock(b *utxo.Block, recover bool) (int, error) {
	var blockID int
	return blockID, retry.Simple(d.retry.Attempts, 3, func() error {
		blockObj := struct {
			utxo.BlockHeader
		}{
			BlockHeader: utxo.BlockHeader{
				Hash:         b.Hash,
				Height:       b.Height,
				Nonce:        b.Nonce,
				PrevHash:     b.PrevHash,
				NextHash:     b.NextHash,
				Bits:         b.Bits,
				Difficulty:   b.Difficulty,
				Chainwork:    b.Chainwork,
				Version:      b.Version,
				VersionHex:   b.VersionHex,
				MerkleRoot:   b.MerkleRoot,
				Size:         b.Size,
				StrippedSize: b.StrippedSize,
				Weight:       b.Weight,
				TxCount:      b.TxCount,
			},
		}

		blockBytes, err := json.Marshal(blockObj)
		if err != nil {
			return errors.Wrapf(err, "failed to marshal object: %+v", blockObj)
		}

		ctx, cancel := d.defaultDeadline()
		defer cancel()

		query := compile(`SELECT _SCHEMA_.block_insert($1, $2, $3, $4)`, d.prefix)
		d.sem <- struct{}{} // Add token
		row := d.QueryRowContext(
			ctx,
			query,
			blockBytes,
			time.Unix(int64(b.Time), 0),
			time.Unix(int64(b.MedianTime), 0),
			recover,
		)
		<-d.sem // Remove token

		if err := row.Scan(&blockID); err != nil {
			return errors.Wrapf(err, "failed to insert block: %+v", pretty.Print(blockObj))
		}

		return nil
	})
}

// LastBlock returns the last block added to the database
func (d *Database) LastBlock() (*utxo.Block, error) {
	query := compile(`
		SELECT
			block_hash,
			height
		FROM
			_SCHEMA_.block
		WHERE
			is_orphaned = FALSE
		ORDER BY
			height DESC
		LIMIT
			1;
		`, d.prefix)

	ctx, cancel := d.defaultDeadline()
	defer cancel()

	d.sem <- struct{}{} // Add token
	row := d.QueryRowContext(ctx, query)
	<-d.sem // Remove token

	b := &utxo.Block{}

	err := row.Scan(&b.Hash, &b.Height)
	switch {
	case err == sql.ErrNoRows:
		return nil, nil
	case err != nil:
		return nil, errors.Wrap(err, "failed to get last block")
	}

	return b, nil
}

// GetBlock returns a block at the specified height (int) or hash (string)
func (d *Database) GetBlock(val interface{}) (*utxo.Block, error) {
	ctx, cancel := d.defaultDeadline()
	defer cancel()

	var row *sql.Row

	switch v := val.(type) {
	case int:
		query := compile(`SELECT * FROM _SCHEMA_.block WHERE block.height = $1 AND is_orphaned = FALSE`, d.prefix)

		d.sem <- struct{}{} // Add token
		row = d.QueryRowContext(ctx, query, val.(int))
		<-d.sem // Remove token
	case string:
		query := compile(`SELECT * FROM _SCHEMA_.block WHERE block.block_hash = $1`, d.prefix)

		d.sem <- struct{}{} // Add token
		row = d.QueryRowContext(ctx, query, val.(string))
		<-d.sem // Remove token
	default:
		return nil, errors.New(fmt.Sprintf("Blocks val must be of type int or string, instead of %T", v))
	}

	var id int
	var t time.Time
	var mt time.Time
	b := &utxo.Block{}

	err := row.Scan(
		&id, &b.Hash, &b.Height, &t, &mt, &b.Nonce, &b.PrevHash, &b.NextHash, &b.Bits, &b.Difficulty, &b.Chainwork,
		&b.Version, &b.VersionHex, &b.MerkleRoot, &b.Size, &b.StrippedSize, &b.Weight, &b.TxCount, &b.IsOrphan,
	)
	if err != nil {
		return nil, errors.Wrapf(err, "failed to get block: %v", val)
	}

	b.Time = int(t.Unix())
	b.MedianTime = int(mt.Unix())

	return b, nil
}

// GetTxHashesByBlockHash gets tx hashes by block hash
func (d *Database) GetTxHashesByBlockHash(hash, limitClause, offsetClause string) ([]string, error) {
	query := compile(
		fmt.Sprintf(`
			SELECT
				transaction.txid
			FROM
				_SCHEMA_.transaction
				JOIN _SCHEMA_.block ON transaction.block_id = block.id
			WHERE
				block_hash = $1
				AND is_orphaned = FALSE
			%s
			%s;`, limitClause, offsetClause),
		d.prefix)

	ctx, cancel := d.defaultDeadline()
	defer cancel()

	d.sem <- struct{}{} // Add token
	rows, err := d.QueryContext(ctx, query, hash)
	<-d.sem // Remove token

	if err != nil {
		return nil, errors.Wrapf(err, "failed to get txhashes from block hash: %s", hash)
	}

	defer rows.Close()

	txids := []string{}
	for rows.Next() {
		var txid string

		if err := rows.Scan(&txid); err != nil {
			return nil, errors.Wrapf(err, "failed to scan row when retrieving txhash from block hash: %s", hash)
		}

		txids = append(txids, txid)
	}

	return txids, nil
}

// GetTotalTxsByBlockHash gets the total number of txs in a block
func (d *Database) GetTotalTxsByBlockHash(hash string) (int, error) {
	query := compile(`
		SELECT
			COUNT(*)
		FROM
			_SCHEMA_.transaction
			JOIN _SCHEMA_.block ON transaction.block_id = block.id
		WHERE
			block_hash = $1
			AND is_orphaned = FALSE;
	`, d.prefix)

	ctx, cancel := d.defaultDeadline()
	defer cancel()

	d.sem <- struct{}{} // Add token
	row := d.QueryRowContext(ctx, query, hash)
	<-d.sem // Remove token

	var txCount int
	if err := row.Scan(&txCount); err != nil {
		return txCount, errors.Wrapf(err, "failed to get total transaction count from block: %s", hash)
	}

	return txCount, nil
}

// GetSpentTxDetails returns spent details for a specific vout in a txid
func (d *Database) GetSpentTxDetails(txid string, vout int) *SpentTxDetails {
	query := compile(`
		SELECT
			transaction.txid,
			input.vin,
			block.height
		FROM
			_SCHEMA_.input
			JOIN _SCHEMA_.transaction ON input.transaction_id = transaction.id
			LEFT OUTER JOIN _SCHEMA_.block ON transaction.block_id = block.id
			AND block.is_orphaned = FALSE
		WHERE
			input.spent_txid = $1
			AND input.spent_vout = $2;
	`, d.prefix)

	ctx, cancel := d.defaultDeadline()
	defer cancel()

	d.sem <- struct{}{} // Add token
	row := d.QueryRowContext(ctx, query, txid, vout)
	<-d.sem // Remove token

	// sql.Null* Types for dealing with NULL refs in SQL
	var spentHeight sql.NullInt64

	details := &SpentTxDetails{}

	if err := row.Scan(&details.SpentTxID, &details.SpentIndex, &spentHeight); err != nil {
		return nil
	}

	if spentHeight.Valid {
		details.SpentHeight = spentHeight.Int64
	} else {
		details.SpentHeight = -1
	}

	return details
}

// GetUtxosByAddrs returns unspent outputs for a given address
func (d *Database) GetUtxosByAddrs(addrs []string) ([]*Utxo, error) {
	query := compile(`
		SELECT
			output.vout,
			output.hex,
			output.req_sigs,
			output.output_type,
			output.address,
			output.amount,
			transaction.txid,
			block.height,
			block.mined_time
		FROM
			_SCHEMA_.output
			JOIN _SCHEMA_.transaction ON output.transaction_id = transaction.id
			LEFT JOIN _SCHEMA_.block ON transaction.block_id = block.id
			AND block.is_orphaned = FALSE
		WHERE
			output.address = ANY($1)
			AND NOT EXISTS (
				SELECT
					*
				FROM
					_SCHEMA_.input
				WHERE
					input.spent_txid = transaction.txid
					AND input.spent_vout = output.vout
			);
	`, d.prefix)

	ctx, cancel := d.defaultDeadline()
	defer cancel()

	d.sem <- struct{}{} // Add token
	rows, err := d.QueryContext(ctx, query, pq.Array(addrs))
	<-d.sem // Remove token

	if err != nil {
		return nil, errors.Wrapf(err, "failed to get utxos from addresses: %s", addrs)
	}

	defer rows.Close()

	// sql.Null* Types for dealing with NULL refs in SQL
	var blockHeight sql.NullInt64
	var blockTime sql.NullString

	utxos := []*Utxo{}
	for rows.Next() {
		utxo := &Utxo{}

		err := rows.Scan(
			&utxo.Vout, &utxo.Hex, &utxo.ReqSigs, &utxo.Type, &utxo.Address,
			&utxo.SatAmount, &utxo.TxID, &blockHeight, &blockTime,
		)
		if err != nil {
			return nil, errors.Wrapf(err, "failed to scan row when retrieving utxos from addresses: %s", addrs)
		}

		if blockHeight.Valid {
			utxo.BlockHeight = blockHeight.Int64
		} else {
			utxo.BlockHeight = -1
		}

		if blockTime.Valid {
			utxo.Timestamp = blockTime.String
		} else {
			utxo.Timestamp = time.Now().Format(time.RFC3339)
		}

		utxos = append(utxos, utxo)
	}

	return utxos, nil
}

// GetOutputsByTxID returns a list of all transaction outputs from a txid
// The voutClause can specify searching outputs by vout number
func (d *Database) GetOutputsByTxID(txid string, voutClause string) ([]Output, error) {
	query := compile(fmt.Sprintf(`
		SELECT
			output.vout,
			output.asm,
			output.hex,
			output.address,
			output.amount,
			output.output_type,
			output.req_sigs
		FROM
			_SCHEMA_.output
			JOIN _SCHEMA_.transaction ON output.transaction_id = transaction.id
			LEFT JOIN _SCHEMA_.block ON transaction.block_id = block.id
			AND block.is_orphaned = FALSE
		WHERE
			transaction.txid = $1
			%s;
	`, voutClause), d.prefix)

	ctx, cancel := d.defaultDeadline()
	defer cancel()

	d.sem <- struct{}{} // Add token
	rows, err := d.QueryContext(ctx, query, txid)
	<-d.sem // Remove token

	if err != nil {
		return nil, errors.Wrapf(err, "failed to get outputs from txid: %s", txid)
	}

	defer rows.Close()

	vouts := []Output{}
	for rows.Next() {
		vout := Output{}

		err := rows.Scan(&vout.Vout, &vout.Asm, &vout.Hex, &vout.Address, &vout.SatAmount, &vout.Type, &vout.ReqSigs)
		if err != nil {
			return nil, errors.Wrapf(err, "failed to scan row when retrieving outputs from txid: %s", txid)
		}

		vouts = append(vouts, vout)
	}

	return vouts, nil
}

// GetTxIDsByAddresses returns a slice of txids given a slice holding an address or addresses
func (d *Database) GetTxIDsByAddresses(addrs []string, limitClause, whereClause, offsetClause string) ([]string, error) {
	query := compile(fmt.Sprintf(`
		SELECT
			transaction.id,
			transaction.txid
		FROM
			_SCHEMA_.transaction
			JOIN _SCHEMA_.output ON output.transaction_id = transaction.id
			LEFT JOIN _SCHEMA_.block ON transaction.block_id = block.id
			AND block.is_orphaned = FALSE
		WHERE
			output.address = ANY($1)
		%s
		UNION
		SELECT
			transaction.id,
			transaction.txid
		FROM
			_SCHEMA_.output
			JOIN (
				SELECT
					input.transaction_id AS vin_txid,
					input.spent_vout AS spent_vout,
					transaction.id AS spent_id
				FROM
					_SCHEMA_.input
					JOIN _SCHEMA_.transaction ON input.spent_txid = transaction.txid
			) AS inputs ON inputs.spent_id = output.transaction_id
			AND inputs.spent_vout = output.vout
			JOIN _SCHEMA_.transaction ON inputs.vin_txid = transaction.id
			LEFT JOIN _SCHEMA_.block ON transaction.block_id = block.id
			AND block.is_orphaned = FALSE
		WHERE
			output.address = ANY($1)
		%s
		ORDER BY
			id DESC
		%s
		%s;
	`, whereClause, whereClause, limitClause, offsetClause), d.prefix)

	ctx, cancel := d.defaultDeadline()
	defer cancel()

	d.sem <- struct{}{} // Add token
	rows, err := d.QueryContext(ctx, query, pq.Array(addrs))
	<-d.sem // Remove token

	if err != nil {
		return nil, errors.Wrapf(err, "failed to get tx details from addresses: %v", addrs)
	}

	defer rows.Close()

	txids := []string{}
	for rows.Next() {
		var txid, id string

		if err := rows.Scan(&id, &txid); err != nil {
			return nil, errors.Wrapf(err, "failed to scan row when retrieving tx details from address: %v", addrs)
		}

		txids = append(txids, txid)
	}

	return txids, nil
}

// GetTotalTxsByAddresses gets a total count of txs for a slice of address(es)
func (d *Database) GetTotalTxsByAddresses(addrs []string) (int, error) {
	query := compile(`
		SELECT
			COUNT(*)
		FROM (
			SELECT
				transaction.id
			FROM
				_SCHEMA_.transaction
				JOIN _SCHEMA_.output ON output.transaction_id = transaction.id
				LEFT JOIN _SCHEMA_.block ON transaction.block_id = block.id
				AND block.is_orphaned = FALSE
			WHERE
				output.address = ANY($1)
			UNION
			SELECT
				transaction.id
			FROM
				_SCHEMA_.output
				JOIN (
					SELECT
						input.transaction_id AS vin_txid,
						transaction.id AS spent_id,
						input.spent_vout AS spent_vout
					FROM
						_SCHEMA_.input
						JOIN _SCHEMA_.transaction ON input.spent_txid = transaction.txid
				) AS inputs ON inputs.spent_id = output.transaction_id
				AND inputs.spent_vout = output.vout
				JOIN _SCHEMA_.transaction ON inputs.vin_txid = transaction.id
				LEFT JOIN _SCHEMA_.block ON transaction.block_id = block.id
				AND block.is_orphaned = FALSE
			WHERE
				output.address = ANY($1)
		) AS COUNT;
	`, d.prefix)

	ctx, cancel := d.defaultDeadline()
	defer cancel()

	d.sem <- struct{}{} // Add token
	row := d.QueryRowContext(ctx, query, pq.Array(addrs))
	<-d.sem // Remove token

	var txCount int

	if err := row.Scan(&txCount); err != nil {
		return 0, errors.Wrapf(err, "failed to get total transaction count from addresses: %s", addrs)
	}

	return txCount, nil
}

// GetTxByTxID returns transaction full details including vins and vouts
// Error if more than one tx found for that txid
func (d *Database) GetTxByTxID(txid string) (*Tx, error) {
	query := compile(`
		SELECT
			transaction.id,
			transaction.txid,
			transaction.hash,
			transaction.version,
			transaction.size,
			transaction.v_size,
			transaction.weight,
			transaction.locktime,
			block.height,
			block.block_hash,
			block.mined_time
		FROM
			_SCHEMA_.transaction
			LEFT JOIN _SCHEMA_.block ON transaction.block_id = block.id
			AND block.is_orphaned = FALSE
		WHERE
			transaction.txid = $1;
	`, d.prefix)

	ctx, cancel := d.defaultDeadline()
	defer cancel()

	d.sem <- struct{}{} // Add token
	row := d.QueryRowContext(ctx, query, txid)
	<-d.sem // Remove token

	// sql.Null* Types for dealing with NULL refs in SQL
	var blockHeight sql.NullInt64
	var blockHash, blockTime sql.NullString

	tx := &Tx{}
	err := row.Scan(
		&tx.ID, &tx.TxID, &tx.Hash, &tx.Version, &tx.Size, &tx.VSize, &tx.Weight, &tx.Locktime,
		&blockHeight, &blockHash, &blockTime,
	)
	if err != nil {
		return nil, errors.Wrapf(err, "failed to get transaction from txid: %s", txid)
	}

	if blockHeight.Valid {
		tx.BlockHeight = blockHeight.Int64
	} else {
		tx.BlockHeight = -1
		tx.Mempool = true
	}

	if blockHash.Valid {
		tx.BlockHash = blockHash.String
	}

	if blockTime.Valid {
		tx.Time = blockTime.String
		tx.BlockTime = blockTime.String
	} else {
		tx.Time = time.Now().Format(time.RFC3339)
	}

	tx.Inputs, err = d.GetInputsByTxID(tx.TxID)
	if err != nil {
		return nil, errors.Wrapf(err, "failed to get transaction from txid: %s", txid)
	}

	tx.Outputs, err = d.GetOutputsByTxID(tx.TxID, "")
	if err != nil {
		return nil, errors.Wrapf(err, "failed to get transaction from txid: %s", txid)
	}

	return tx, nil
}

// GetRawTxByTxID gets the raw_transaction from the transaction table
func (d *Database) GetRawTxByTxID(txid string) (*RawTx, error) {
	query := compile(`
		SELECT
			raw_transaction
		FROM
			_SCHEMA_.transaction
		WHERE
			txid = $1;
	`, d.prefix)

	ctx, cancel := d.defaultDeadline()
	defer cancel()

	d.sem <- struct{}{} // Add token
	row := d.QueryRowContext(ctx, query, txid)
	<-d.sem // Remove token

	rawTx := &RawTx{}
	if err := row.Scan(&rawTx.Hex); err != nil {
		return nil, errors.Wrapf(err, "failed to get rawTx for txid: %s", txid)
	}

	return rawTx, nil
}

// GetInputsByTxID returns a list of transaction inputs
func (d *Database) GetInputsByTxID(txid string) ([]Input, error) {
	query := compile(`
		SELECT
			vin,
			spent_txid,
			spent_vout,
			asm,
			hex,
			sequence_num,
			tx_in_witness,
			coinbase
		FROM
			_SCHEMA_.input
			JOIN _SCHEMA_.transaction ON input.transaction_id = transaction.id
			LEFT JOIN _SCHEMA_.block ON transaction.block_id = block.id
			AND block.is_orphaned = FALSE
		WHERE
			transaction.txid = $1;
	`, d.prefix)

	ctx, cancel := d.defaultDeadline()
	defer cancel()

	d.sem <- struct{}{} // Add token
	rows, err := d.QueryContext(ctx, query, txid)
	<-d.sem // Remove token

	if err != nil {
		return nil, errors.Wrapf(err, "failed to get inputs from txid: %s", txid)
	}

	defer rows.Close()

	vins := []Input{}
	for rows.Next() {
		var txInWitness sql.NullString

		vin := Input{}

		err := rows.Scan(&vin.Vin, &vin.SpentTx, &vin.SpentVout, &vin.Asm, &vin.Hex, &vin.Sequence, &txInWitness, &vin.Coinbase)
		if err != nil {
			return nil, errors.Wrapf(err, "failed to scan row when retrieving inputs from txid: %s", txid)
		}

		if txInWitness.Valid {
			witness := []string{}
			str := txInWitness.String

			if str != "[]" {
				replacer := strings.NewReplacer("[", "", "]", "", " ", "", `"`, "")
				str = replacer.Replace(str)
				witness = strings.Split(str, ",")
			}

			vin.TxInWitness = witness
		}

		vins = append(vins, vin)
	}

	return vins, nil
}

// InsertTx inserts txs into the database, returns error if something bad happened
func (d *Database) InsertTx(tx *utxo.Tx, txIndex int, blockID int) error {
	txObj := struct {
		TxID     string      `json:"txid"`
		Hash     string      `json:"hash"`
		Version  int         `json:"version"`
		Size     int         `json:"size"`
		VSize    int         `json:"vsize"`
		Weight   int         `json:"weight"`
		Locktime json.Number `json:"locktime"`
		Inputs   []Input     `json:"inputs"`
		Outputs  []Output    `json:"outputs"`
	}{
		TxID:     tx.TxID,
		Hash:     tx.Hash,
		Version:  tx.Version,
		Size:     tx.Size,
		VSize:    tx.VSize,
		Weight:   tx.Weight,
		Locktime: tx.Locktime,
		Inputs:   make([]Input, 0),
		Outputs:  make([]Output, 0),
	}

	for i, in := range tx.Vins {
		input := Input{
			Vin:         i,
			SpentTx:     in.TxID,
			SpentVout:   in.Vout,
			Asm:         in.ScriptSig.Asm,
			Hex:         in.ScriptSig.Hex,
			TxInWitness: in.TxInWitness,
			Sequence:    in.Sequence,
			Coinbase:    in.Coinbase,
		}

		txObj.Inputs = append(txObj.Inputs, input)
	}

	for _, out := range tx.Vouts {
		// check to see if this is a single value address otherwise default to "unsupported addr"
		addr := "unsupported addr"
		if len(out.ScriptPubKey.Addresses) == 1 {
			addr = out.ScriptPubKey.Addresses[0]
		}

		sats, err := convert.ToSatoshi(out.Value.String())
		if err != nil {
			return errors.Wrapf(err,
				"failed to insert vout: %+v, in tx: %s, with txIndex: %d, and blockID: %d",
				pretty.Print(out), tx.TxID, txIndex, blockID,
			)
		}

		output := Output{
			Vout:      out.N,
			SatAmount: sats,
			Asm:       out.ScriptPubKey.Asm,
			Hex:       out.ScriptPubKey.Hex,
			ReqSigs:   out.ScriptPubKey.ReqSigs,
			Type:      out.ScriptPubKey.Type,
			Address:   addr,
			Addresses: out.ScriptPubKey.Addresses,
		}

		txObj.Outputs = append(txObj.Outputs, output)
	}

	txBytes, err := json.Marshal(txObj)
	if err != nil {
		return errors.Wrapf(err, "failed to marshal object: %+v", txObj)
	}

	return retry.Simple(d.retry.Attempts, 3, func() error {
		query := compile(`SELECT _SCHEMA_.transaction_insert($1, $2, $3, $4)`, d.prefix)

		d.sem <- struct{}{} // Add token
		_, err = d.Exec(query, blockID, txBytes, tx.Hex, txIndex)
		<-d.sem // Remove token

		if err != nil {
			return errors.Wrapf(err, "failed to insert transaction: %+v, with txIndex: %d, and blockID: %d", tx.TxID, txIndex, blockID)
		}

		return nil
	})
}
