package insight

import (
	"fmt"
	"sort"
	"strings"
	"sync"

	"github.com/btcsuite/btcd/chaincfg"
	"github.com/btcsuite/btcutil"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/cashaddr"

	_ "net/http/pprof"

	"github.com/pkg/errors"
	"github.com/shapeshift-legacy/coinquery/V2/internal/convert"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/postgres"
)

func (i *InsightServer) getTxs(txids []string) ([]*insightTx, error) {
	errChan := make(chan error, len(txids)*2)

	lb, err := i.db.LastBlock()
	if err != nil {
		return nil, errors.Wrapf(err, "failed to get transactions from txids: %s", txids)
	}

	var txwg sync.WaitGroup
	txwg.Add(len(txids))
	txs := make([]*insightTx, len(txids))
	go func() {
		for idx, id := range txids {
			go func(txid string, index int) {
				defer txwg.Done()

				inputsChan := make(chan *insightVin)
				outputsChan := make(chan *insightVout)

				defer close(inputsChan)
				defer close(outputsChan)

				tx, err := i.db.GetTxByTxID(txid)
				if err != nil {
					errChan <- errors.Wrapf(err, "failed to get transactions from txids: %v", txids)
					return
				}

				for j, _ := range tx.Inputs {
					go i.processTxInput(&tx.Inputs[j], inputsChan, errChan)
				}

				for j, _ := range tx.Outputs {
					go i.processTxOutput(tx.TxID, &tx.Outputs[j], outputsChan, errChan)
				}

				valueIn := int64(0)
				valueOut := int64(0)
				vins := []*insightVin{}
				vouts := []*insightVout{}
				for i := 0; i < len(tx.Inputs)+len(tx.Outputs); i++ {
					select {
					case vin := <-inputsChan:
						vins = append(vins, vin)
						valueIn += vin.ValueSat
					case vout := <-outputsChan:
						vouts = append(vouts, vout)

						sats, err := convert.ToSatoshi(vout.Value)
						if err != nil {
							errChan <- errors.Wrapf(err, "failed to parse value in transaction: %s\n vout: %v", txid, vout)
							return
						}

						valueOut += sats
					}
				}

				sort.Slice(vins, func(i, j int) bool {
					return vins[i].N < vins[j].N
				})

				sort.Slice(vouts, func(i, j int) bool {
					return vouts[i].N < vouts[j].N
				})

				ts, err := convert.ToUnixTimestamp(tx.Time)
				if err != nil {
					errChan <- errors.Wrapf(err, "failed to parse timestamp from transaction: %v", txid)
					return
				}

				confirmations := 0
				if tx.BlockHeight != -1 {
					confirmations = lb.Height - int(tx.BlockHeight) + 1
				}

				t := &insightTx{
					TxID:          tx.TxID,
					Hash:          tx.Hash,
					Version:       tx.Version,
					Size:          tx.Size,
					VSize:         tx.VSize,
					Weight:        tx.Weight,
					Locktime:      tx.Locktime,
					Vin:           vins,
					Vout:          vouts,
					BlockHash:     tx.BlockHash,
					BlockHeight:   tx.BlockHeight,
					Confirmations: confirmations,
					Time:          ts,
					ValueOut:      convert.ToBTC(valueOut),
				}

				if tx.BlockTime != "" {
					t.BlockTime = ts
				}

				if len(vins) == 1 && vins[0].Coinbase != "" {
					t.IsCoinBase = true
				} else {
					t.ValueIn = convert.ToBTC(valueIn)
					fees := convert.ToBTC(valueIn - valueOut) // converting for precision
					t.Fees = &fees
				}

				txs[index] = t
			}(id, idx)
		}

		txwg.Wait()
		close(errChan)
	}()

	for err := range errChan {
		return nil, err
	}

	sort.Slice(txs, func(i, j int) bool {
		return txs[i].BlockHeight > txs[j].BlockHeight
	})

	return txs, nil
}

func (i *InsightServer) processTxInput(vin *postgres.Input, inputsChan chan<- *insightVin, errChan chan<- error) {
	voutClause := fmt.Sprintf("AND output.vout = %d", vin.SpentVout)
	output, err := i.db.GetOutputsByTxID(vin.SpentTx, voutClause)
	if err != nil {
		errChan <- errors.Wrapf(err, "failed to process tx input: %v", vin)
		return
	}

	v := &insightVin{
		TxID: vin.SpentTx,
		N:    vin.Vin,
		ScriptSig: &ScriptSig{
			Hex: vin.Hex,
		},
		TxInWitness: vin.TxInWitness,
		Sequence:    vin.Sequence,
		Coinbase:    vin.Coinbase,
	}

	if vin.Coinbase == "" {
		v.Vout = &vin.SpentVout
	}

	if vin.Asm != "" {
		v.ScriptSig.Asm = &vin.Asm
	}

	if len(output) > 0 {
		sats := output[0].SatAmount
		btc := convert.ToBTC(sats)

		v.ValueSat = sats
		v.Value = btc

		addr, err := normalizeAddrFormat(output[0].Address)
		if err != nil {
			errChan <- errors.Wrapf(err, "failed to normalize address: %s", output[0].Address)
			return
		}

		v.Address = addr
	}

	inputsChan <- v
}

func (i *InsightServer) processTxOutput(txid string, vout *postgres.Output, outputsChan chan<- *insightVout, errChan chan<- error) {
	details := i.db.GetSpentTxDetails(txid, vout.Vout)

	btc := convert.ToBTC(vout.SatAmount)

	v := &insightVout{
		Value: fmt.Sprintf("%.8f", btc),
		N:     vout.Vout,
		ScriptPubKey: struct {
			Asm       string   `json:"asm"`
			Hex       string   `json:"hex"`
			ReqSigs   int      `json:"reqSigs,omitempty"`
			Addresses []string `json:"addresses,omitempty"`
			Type      string   `json:"type,omitempty"`
		}{
			Asm:     vout.Asm,
			Hex:     vout.Hex,
			ReqSigs: vout.ReqSigs,
		},
	}

	if vout.Address != "unsupported addr" {
		addr, err := normalizeAddrFormat(vout.Address)
		if err != nil {
			errChan <- errors.Wrapf(err, "failed to normalize address: %s", vout.Address)
		}

		v.ScriptPubKey.Addresses = []string{addr}
	}

	if vout.Type != "nulldata" {
		v.ScriptPubKey.Type = vout.Type
	}

	if details == nil {
		v.SpentTxID = nil
		v.SpentTxIndex = nil
		v.SpentTxBlockHeight = nil
	} else {
		v.SpentTxID = &details.SpentTxID
		v.SpentTxIndex = &details.SpentIndex
		v.SpentTxBlockHeight = &details.SpentHeight
	}

	outputsChan <- v
}

func (i *InsightServer) getUtxos(addrs []string) ([]*insightUtxo, error) {
	lb, err := i.db.LastBlock()
	if err != nil {
		return nil, errors.Wrapf(err, "failed to get utxos for addresses: %s", addrs)
	}

	outputs, err := i.db.GetUtxosByAddrs(addrs)
	if err != nil {
		return nil, errors.Wrapf(err, "failed to get utxos for addresses: %s", addrs)
	}

	utxos := []*insightUtxo{}
	for _, out := range outputs {
		ts, err := convert.ToUnixTimestamp(out.Timestamp)
		if err != nil {
			return nil, errors.Wrapf(err, "failed to parse timestamp from output: %v", out)
		}

		confirmations := 0
		if out.BlockHeight != -1 {
			confirmations = lb.Height - int(out.BlockHeight) + 1
		}

		addr, err := normalizeAddrFormat(out.Address)
		if err != nil {
			return nil, errors.Wrapf(err, "failed to normalize address: %s", out.Address)
		}

		utxo := &insightUtxo{
			Address:       addr,
			TxID:          out.TxID,
			Vout:          out.Vout,
			ScriptPubKey:  out.Hex,
			ReqSigs:       out.ReqSigs,
			Type:          out.Type,
			Amount:        convert.ToBTC(out.SatAmount),
			Satoshis:      out.SatAmount,
			Confirmations: confirmations,
			Timestamp:     ts,
			BlockHeight:   out.BlockHeight,
		}

		utxos = append(utxos, utxo)
	}

	sort.Slice(utxos, func(i, j int) bool {
		return utxos[i].BlockHeight > utxos[j].BlockHeight
	})

	return utxos, nil
}

// normalizeAddrFormat normalize addr format from DB to expected format in API
func normalizeAddrFormat(addr string) (string, error) {
	if strings.HasPrefix(addr, "bitcoincash:") {
		bytes, _, _, err := cashaddr.CheckDecodeCashAddress(addr)
		if err != nil {
			return "", errors.Wrapf(err, "failed to decode BCH cashaddr format from: %s", addr)
		}

		addrPKH, err := btcutil.NewAddressPubKeyHash(bytes, &chaincfg.MainNetParams)
		if err != nil {
			return "", errors.Wrap(err, "failed to create PKH address from bytes")
		}

		return addrPKH.EncodeAddress(), nil
	}

	return addr, nil
}
