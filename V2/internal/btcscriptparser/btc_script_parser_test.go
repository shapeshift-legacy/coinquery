// +build unit

package btcscriptparser

import (
	"reflect"
	"testing"
)

// Used when we need a valid hexidecimal number, but of the wrong size
const incorrectHex = "00aa11bb22"

func TestP2PKToAddress(t *testing.T) {
	type args struct {
		outputScriptHex string
	}

	tests := []struct {
		name    string
		args    args
		want    string
		wantErr bool
	}{
		{
			"test P2PK address 1",
			args{"21020e46e79a2a8d12b9b5d12c7a91adb4e454edfae43c0a0cb805427d2ac7613fd9ac"},
			"1P3rU1Nk1pmc2BiWC8dEy9bZa1ZbMp5jfg",
			false,
		},
		{
			"test P2PK address 2",
			args{"210259c646288580221fdf0e92dbeecaee214504fdc8bbdf4a3019d6ec18b7540424ac"},
			"1NDgxgLdvhNN1NHmtgkM6cXuncQZdTjyur",
			false,
		},
		{
			"test P2PK address 3",
			args{"21023cb3e593fb85c5659688528e9a4f1c4c7f19206edc7e517d20f794ba686fd6d6ac"},
			"13swCVuXeZhWkmwEXod83Mv2YWKVqYeMVS",
			false,
		},
		{
			"fail on decode string",
			args{"this_is_not_a_hexadecimal_number"},
			"",
			true,
		},
		{
			"fail on btcutil.NewAddressPubKey creation",
			args{incorrectHex},
			"",
			true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := P2PKToAddress(tt.args.outputScriptHex)
			if (err != nil) != tt.wantErr {
				t.Errorf("P2PKToAddress() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("P2PKToAddress() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestP2PKHToAddress(t *testing.T) {
	type args struct {
		outputScriptHex string
	}

	tests := []struct {
		name    string
		args    args
		want    string
		wantErr bool
	}{
		{
			"test P2PKH address 1",
			args{"76a9147d5672f867eb909668fd29c5538ee664da6eaa1088ac"},
			"1CRj2ZvzGYjsbtsq59548X7d3hpiBf9Pnc",
			false,
		},
		{
			"test P2PKH address 2",
			args{"76a914323b2a83aa38c636bb0a114db81c4d9f8845618b88ac"},
			"15abfXHpbQybWP34JUwHhV6kvNVPAA87Qt",
			false,
		},
		{
			"test P2PKH address 3",
			args{"76a9145d042414ead11f9c7fbebc44742a5b2230fd725888ac"},
			"19UpoZNMxcwYqQHaMN9KdufUd4Bs7Rymmw",
			false,
		},
		{
			"fail on decode string",
			args{"this_is_not_a_hexadecimal_number"},
			"",
			true,
		},
		{
			"fail on btcutil.NewAddressPubKeyHash creation",
			args{incorrectHex},
			"",
			true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := P2PKHToAddress(tt.args.outputScriptHex)
			if (err != nil) != tt.wantErr {
				t.Errorf("P2PKHToAddress() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("P2PKHToAddress() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestP2SHToAddress(t *testing.T) {
	type args struct {
		outputScriptHex string
	}

	tests := []struct {
		name    string
		args    args
		want    string
		wantErr bool
	}{
		{
			"test P2SH address 1",
			args{"a91461c6ad7f3e36be7635138703137e011a7d8bd89887"},
			"3Ac1UXCZF4QfFmEPHSYzyYPqAqawqV5rbn",
			false,
		},
		{
			"test P2SH address 2",
			args{"a914959008c6919eedb33f0c8ebdea70185630d9f1ae87"},
			"3FKq9oZuUL1nrF5jTv7kvQdLKXwagDDvsp",
			false,
		},
		{
			"test P2SH address 3",
			args{"a91418b74b06d81864bbaf2b58479404e6c4c2a2d75f87"},
			"33whiaE6fKEtVq6w94NxKpL4dGbfvzaLz4",
			false,
		},
		{
			"fail on decode string",
			args{"this_is_not_a_hexadecimal_number"},
			"",
			true,
		},
		{
			"fail on btcutil.NewAddressPubKeyHash creation",
			args{incorrectHex},
			"",
			true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := P2SHToAddress(tt.args.outputScriptHex)
			if (err != nil) != tt.wantErr {
				t.Errorf("P2SHToAddress() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("P2SHToAddress() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestP2WPKHToAddress(t *testing.T) {
	type args struct {
		outputScriptHex string
	}

	tests := []struct {
		name    string
		args    args
		want    string
		wantErr bool
	}{
		{
			"test P2WPKH address 1",
			args{"0014c6475858c266a2e75ae9c02958b644297fbbcb03"},
			"bc1qcer4skxzv63wwkhfcq543djy99lmhjcrtgckfz",
			false,
		},
		{
			"test P2WPKH address 2",
			args{"0014c252fc2378ac73aa9d4a9d350d366b52c4271848"},
			"bc1qcff0cgmc43e64822n56s6dnt2tzzwxzgkmx7j5",
			false,
		},
		{
			"test P2WPKH address 3",
			args{"001413482a2b503d722d1e75a1357c50ef2908ef0812"},
			"bc1qzdyz526s84ez68n45y6hc5809yyw7zqju4q5vd",
			false,
		},
		{
			"fail on decode string",
			args{"this_is_not_a_hexadecimal_number"},
			"",
			true,
		},
		{
			"fail on btcutil.NewAddressPubKeyHash creation",
			args{incorrectHex},
			"",
			true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := P2WPKHToAddress(tt.args.outputScriptHex)
			if (err != nil) != tt.wantErr {
				t.Errorf("P2WPKHToAddress() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("P2WPKHToAddress() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestP2WSHToAddress(t *testing.T) {
	type args struct {
		outputScriptHex string
	}

	tests := []struct {
		name    string
		args    args
		want    string
		wantErr bool
	}{
		{
			"test P2WPKH address 1",
			args{"0020701a8d401c84fb13e6baf169d59684e17abd9fa216c8cc5b9fc63d622ff8c58d"},
			"bc1qwqdg6squsna38e46795at95yu9atm8azzmyvckulcc7kytlcckxswvvzej",
			false,
		},
		{
			"test P2WPKH address 2",
			args{"0020f4daf61d4ae213922e758ed8450692d8e2517587671e852a3a86a7384f4dc146"},
			"bc1q7nd0v822ugfeytn43mvy2p5jmr39zav8vu0g2236s6nnsn6dc9rqut6ry2",
			false,
		},
		{
			"test P2WPKH address 3",
			args{"0020c0190d1ba3bd6e95236ef83594f3419216466726787b40ac8ab5abe81c171f65"},
			"bc1qcqvs6xarh4hf2gmwlq6efu6pjgtyveex0pa5pty2kk47s8qhrajstqyals",
			false,
		},
		{
			"fail on decode string",
			args{"this_is_not_a_hexadecimal_number"},
			"",
			true,
		},
		{
			"fail on btcutil.NewAddressPubKeyHash creation",
			args{incorrectHex},
			"",
			true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := P2WSHToAddress(tt.args.outputScriptHex)
			if (err != nil) != tt.wantErr {
				t.Errorf("P2WSHToAddress() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("P2WSHToAddress() = %v, want %v", got, tt.want)
			}
		})
	}
}
