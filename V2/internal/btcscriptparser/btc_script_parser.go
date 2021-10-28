package btcscriptparser

import (
	"encoding/hex"

	"github.com/btcsuite/btcd/chaincfg"
	"github.com/btcsuite/btcutil"
	"github.com/pkg/errors"
)

// P2PKToAddress (PayToPubKey) retrieves the address from an output's hex locking script
func P2PKToAddress(outputScriptHex string) (string, error) {
	b, err := hex.DecodeString(outputScriptHex)
	if err != nil {
		return "", errors.New(err.Error())
	}
	addrPubKey := b[1 : len(b)-1] // strip pub key
	addrPubKeyStruct, err := btcutil.NewAddressPubKey(addrPubKey, &chaincfg.MainNetParams)
	if err != nil {
		return "", errors.Wrapf(err, "failed to create new p2pk address pub key from: %s", outputScriptHex)
	}
	addr := addrPubKeyStruct.AddressPubKeyHash()

	return addr.String(), nil
}

// P2PKHToAddress (PayToPubKeyHash) retrieves the address from an output's hex locking script
func P2PKHToAddress(outputScriptHex string) (string, error) {
	b, err := hex.DecodeString(outputScriptHex)
	if err != nil {
		return "", errors.New(err.Error())
	}
	pubKeyHash := b[3 : len(b)-2] // strip pub key hash
	addr, err := btcutil.NewAddressPubKeyHash(pubKeyHash, &chaincfg.MainNetParams)
	if err != nil {
		return "", errors.Wrapf(err, "failed to create new p2pkh address pub key hash from: %s", outputScriptHex)
	}

	return addr.String(), nil
}

// P2SHToAddress (PayToScriptHash) retrieves the address from an output's hex locking script
func P2SHToAddress(outputScriptHex string) (string, error) {
	b, err := hex.DecodeString(outputScriptHex)
	if err != nil {
		return "", errors.New(err.Error())
	}
	scriptHash := b[2 : len(b)-1] // strip script hash
	addr, err := btcutil.NewAddressScriptHashFromHash(scriptHash, &chaincfg.MainNetParams)
	if err != nil {
		return "", errors.Wrapf(err, "failed to create new p2sh address script hash from: %s", outputScriptHex)
	}

	return addr.String(), nil
}

// P2WPKHToAddress (PayToWitnessPubKeyHash) retrieves the address from an output's hex locking script
func P2WPKHToAddress(outputScriptHex string) (string, error) {
	b, err := hex.DecodeString(outputScriptHex)
	if err != nil {
		return "", errors.New(err.Error())
	}
	witnessProg := b[2:] // strip witness program
	addr, err := btcutil.NewAddressWitnessPubKeyHash(witnessProg, &chaincfg.MainNetParams)
	if err != nil {
		return "", errors.Wrapf(err, "failed to create new p2wpkh address witness pub key hash from: %s", outputScriptHex)
	}

	return addr.String(), nil
}

// P2WSHToAddress (PayToWitnessScriptHash) retrieves the address from an output's hex locking script
func P2WSHToAddress(outputScriptHex string) (string, error) {
	b, err := hex.DecodeString(outputScriptHex)
	if err != nil {
		return "", errors.New(err.Error())
	}
	witnessProg := b[2:] // strip witness program
	addr, err := btcutil.NewAddressWitnessScriptHash(witnessProg, &chaincfg.MainNetParams)
	if err != nil {
		return "", errors.Wrapf(err, "failed to create new p2wsh address witness script hash from: %s", outputScriptHex)
	}

	return addr.String(), nil
}
