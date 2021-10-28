package config

import (
	"encoding/json"
	"io/ioutil"
	"os"

	"github.com/pkg/errors"
)

// Config type definition for all config variables
type Config struct {
	DB    BaseDB  `json:"db"`
	RPC   BaseRPC `json:"rpc"`
	Coins []Coin  `json:"coins"`
}

// Coin type definition for coin rpc and zmq config variables
type Coin struct {
	Name string  `json:"name"`
	RPC  CoinRPC `json:"rpc"`
	ZMQ  ZMQ     `json:"zmq"`
	DB   CoinDB  `json:"db"`
}

// DB type definition to group BaseDB and CoinDB and URI config variables
type DB struct {
	URI string
	BaseDB
	CoinDB
}

// BaseDB type definition for db configuration
type BaseDB struct {
	MaxConns        int   `json:"maxConns"`
	MaxConnLifetime int64 `json:"maxConnLifetime"` // in seconds
	Threads         int   `json:"threads"`
	Retry           Retry `json:"retry"`
	Timeout         int64 `json:"timeout"` // in seconds
}

// CoinDB type definition for coin db endpoints
type CoinDB struct {
	ReadOnly  string `json:"readonly"`
	ReadWrite string `json:"readwrite"`
}

// RPC type definition to group BaseRPC and CoinRPC config variables
type RPC struct {
	BaseRPC
	CoinRPC
}

// BaseRPC type definition for base rpc configuration
type BaseRPC struct {
	Threads int   `json:"threads"`
	Timeout int   `json:"timeout"`
	Retry   Retry `json:"retry"`
}

// CoinRPC type definition for coin rpc configuration
type CoinRPC struct {
	URL      string `json:"url"`
	User     string `json:"user"`
	Password string `json:"password"`
}

// Retry type definition for retry attempts
type Retry struct {
	Attempts int   `json:"attempts"`
	Sleep    int64 `json:"sleep,omitempty"` // in seconds
}

// ZMQ type definition for zmq configuration
type ZMQ struct {
	Timeout       int64    `json:"timeout"` // in seconds
	SubURL        string   `json:"subUrl"`
	Subscriptions []string `json:"subs"`
}

// Get returns all config variables from the config specified by the path arguement
func Get(path string) (*Config, error) {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return nil, errors.New(err.Error())
	}

	jsonFile, err := os.Open(path)
	if err != nil {
		return nil, errors.New(err.Error())
	}

	data, err := ioutil.ReadAll(jsonFile)
	if err != nil {
		return nil, errors.New(err.Error())
	}

	c := &Config{}
	if err := json.Unmarshal(data, c); err != nil {
		return nil, errors.New(err.Error())
	}

	return c, nil
}

// DatabaseType represents which db endpoint to be used
type DatabaseType int

// The defined database types are as follows
const (
	ReadOnly DatabaseType = iota
	ReadWrite
)

// String take the enum index and print out the associated name
func (a DatabaseType) String() string {
	return []string{"ReadOnly", "ReadWrite"}[a]
}

// GetDBConfig will return a DB that consists of the BaseDB along with the specified CoinDB
func (c *Config) GetDBConfig(db DatabaseType, cc *Coin) (*DB, error) {
	switch db {
	case ReadOnly:
		return &DB{
			URI:    cc.DB.ReadOnly,
			BaseDB: c.DB,
		}, nil
	case ReadWrite:
		return &DB{
			URI:    cc.DB.ReadWrite,
			BaseDB: c.DB,
		}, nil
	default:
		return nil, errors.Errorf("unable to find db configuration for type: '%s'", db)
	}
}

// GetRPCConfig will return RPC that consists of the BaseRPC along with the specified CoinRPC
func (c *Config) GetRPCConfig(cc *Coin) *RPC {
	return &RPC{
		BaseRPC: c.RPC,
		CoinRPC: cc.RPC,
	}
}

// GetCoin returns the configuration of a coin
func (c *Config) GetCoin(coin string) (*Coin, error) {
	for _, v := range c.Coins {
		if v.Name == coin {
			return &v, nil
		}
	}

	return nil, errors.Errorf("unable to find configuration for coin: '%s'", coin)
}

// ListCoins returns a list of available coins
func (c *Config) ListCoins() []string {
	coins := []string{}
	for _, v := range c.Coins {
		coins = append(coins, v.Name)
	}

	return coins
}
