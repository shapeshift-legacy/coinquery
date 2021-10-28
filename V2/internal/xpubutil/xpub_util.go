package xpubutil

import (
	"errors"
	"log"
	"sort"
	"strings"
	"sync"

	"github.com/btcsuite/btcd/chaincfg"
	"github.com/btcsuite/btcutil/hdkeychain"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/postgres"
)

// TODO: move prefixes to exported constants in a table somewhere
const (
	btcPrefix        = 0x00
	btcTestnetPrefix = 0x6f
	bchPrefix        = 0x00
	ltcPrefix        = 0x30
	dogePrefix       = 0x1e
	dashPrefix       = 0x4c
	receiveIndex     = 0
	changeIndex      = 1
)

// GenerateAddrs generates the addresses for a particular xpub
func GenerateAddrs(xpub string, ticker string, db *postgres.Database) []string {
	_, rk, ck := deriveKeys(xpub)
	prefix := p2pkhPrefix(ticker)

	// Check both the "receiving" bip44 path as well as the "change" bip44 path
	rkAddrs := deriveAddresses(rk, prefix, db)
	cdAddrs := deriveAddresses(ck, prefix, db)

	// Combine slices of active addresses
	addrs := append(rkAddrs, cdAddrs...)

	return addrs
}

func p2pkhPrefix(ticker string) byte {
	switch strings.ToUpper(ticker) {
	case "BTC":
		return btcPrefix
	case "BCH":
		return bchPrefix
	case "LTC":
		return ltcPrefix
	case "DOGE":
		return dogePrefix
	case "DASH":
		return dashPrefix
	default:
		log.Fatalf("Uknown prefix byte for address derivation for Ticker: %s\n", ticker)
	}
	return 0x00
}

func deriveAddresses(ek *hdkeychain.ExtendedKey, prefix byte, db *postgres.Database) []string {
	// Setup prefix byte
	cnfg := &chaincfg.Params{
		PubKeyHashAddrID: prefix,
	}

	type result struct {
		Index  int
		Active bool
		Addr   string
		Err    error
	}

	results := make([]*result, 0)
	numWorkers := 20
	currentBatch := numWorkers
	i := 0

	for {
		workerOutput := make(chan *result)
		hasActive := false

		var wg sync.WaitGroup
		wg.Add(numWorkers)

		for i < currentBatch {
			go func(i int) {
				// Generate children at a specific index and their addresses
				child := generateChild(ek, i)
				addr, err := child.Address(cnfg)
				if err != nil {
					log.Fatal(err)
				}

				txids, err := db.GetTxIDsByAddresses([]string{addr.String()}, "", "", "")

				// Mark address as either active or inactive
				addrActive := true
				if len(txids) == 0 {
					addrActive = false
				}

				// Send result to the workerOutput channel
				workerOutput <- &result{i, addrActive, addr.String(), err}

				wg.Done()
			}(i)

			i++
		}

		go func() {
			wg.Wait()
			close(workerOutput)
		}()

		currentBatch += numWorkers
		count := 0

		for o := range workerOutput {
			if o.Err != nil {
				log.Fatal(o.Err)
			}

			if o.Active {
				results = append(results, o)
				hasActive = true
			}

			count++
		}

		if !hasActive {
			break
		}
	}

	sort.Slice(results, func(i, j int) bool {
		return results[i].Index < results[j].Index
	})

	addrs := make([]string, len(results), len(results))
	for i, r := range results {
		addrs[i] = r.Addr
	}

	return addrs
}

// derive keys from an xpub
// assuming the xpub was derived from the following path "44'/CoinType'/Acct'"
// the three keys correspond to the following paths,
// accountKey "44'/CoinType'/Acct'"
// receivingKey "44'/CoinType'/Acct'/0
// changeKey "44'/CoinType'/Acct'/1
func deriveKeys(xpub string) (accountKey, receivingKey, changeKey *hdkeychain.ExtendedKey) {
	ek, err := xpubToEK(xpub)
	if err != nil {
		log.Fatal("Unable to parse xpub into extended key", err)
	}
	// Generate child keys for receiving and change addresses
	receivingKey = generateChild(ek, receiveIndex)
	changeKey = generateChild(ek, changeIndex)
	// The first return parameter would only be needed if this is extended to support eth
	// as the keepkey has that derivation path at 44'/60'/acct'
	return ek, receivingKey, changeKey
}

// convert xpub string to extended key
func xpubToEK(xpub string) (*hdkeychain.ExtendedKey, error) {
	ek, err := hdkeychain.NewKeyFromString(xpub)
	if err != nil {
		return ek, errors.New("Invalid XPUB: " + err.Error())
	}
	return ek, nil
}

// derive child key of a given extended key
func generateChild(ek *hdkeychain.ExtendedKey, n int) *hdkeychain.ExtendedKey {
	child, err := ek.Child(uint32(n))
	if err != nil {
		log.Fatal("Error generating child key")
	}
	return child
}
