package convert

import (
	"strconv"
	"strings"
	"time"

	"github.com/pkg/errors"
)

const (
	UtxoPrecision int = 8
)

// ToUnixTimestamp converts a RFC3339 timestamp into a unix timestamp
func ToUnixTimestamp(t string) (int64, error) {
	ts, err := time.Parse(time.RFC3339, t)
	if err != nil {
		return -1, errors.New(err.Error())
	}

	return ts.Unix(), nil
}

// ToSatoshi converts btc into sats
func ToSatoshi(btc string) (int64, error) {
	var val string

	s := strings.Split(btc, ".")
	b := strings.Replace(btc, ".", "", 1)

	if len(s) == 1 {
		val = b + strings.Repeat("0", UtxoPrecision)
	} else {
		val = b + strings.Repeat("0", UtxoPrecision-len(s[1]))
	}

	sats, err := strconv.ParseInt(val, 10, 64)
	if err != nil {
		return -1, errors.Wrapf(err, "failed to convert btc value: %v, into sats (int64)", btc)
	}

	return sats, nil
}

// ToBTC converts a satoshi value into a BTC value
func ToBTC(sats int64) float64 {
	return float64(sats) / 1e8
}
