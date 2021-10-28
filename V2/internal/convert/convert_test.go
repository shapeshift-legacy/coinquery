// +build unit

package convert

import "testing"

func TestToUnixTimestamp(t *testing.T) {
	type args struct {
		t string
	}
	tests := []struct {
		name    string
		args    args
		want    int64
		wantErr bool
	}{
		{
			"Success",
			args{"2019-01-18T22:58:06Z"},
			1547852286,
			false,
		},
		{
			"Fail",
			args{"2009-01-09 02:54:25+00"},
			-1,
			true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ToUnixTimestamp(tt.args.t)
			if (err != nil) != tt.wantErr {
				t.Errorf("ToUnixTimestamp() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("ToUnixTimestamp() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestToBTC(t *testing.T) {
	sats := int64(69000000)
	want := 0.69

	got := ToBTC(sats)

	if got != want {
		t.Errorf("ToBTC() = %v, want %v", got, want)
	}
}

func TestToSatoshi(t *testing.T) {
	type args struct {
		btc string
	}
	tests := []struct {
		args    args
		want    int64
		wantErr bool
	}{
		{
			args:    args{"0.69"},
			want:    int64(69000000),
			wantErr: false,
		},
		{
			args:    args{"420"},
			want:    int64(42000000000),
			wantErr: false,
		},
		{
			args:    args{"12345678"},
			want:    int64(1234567800000000),
			wantErr: false,
		},
		{
			args:    args{"5.2"},
			want:    int64(520000000),
			wantErr: false,
		},
		{
			args:    args{".00000001"},
			want:    int64(1),
			wantErr: false,
		},
		{
			args:    args{"NotValid"},
			want:    int64(-1),
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			got, err := ToSatoshi(tt.args.btc)
			if (err != nil) != tt.wantErr {
				t.Errorf("ToSatoshi() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("ToSatoshi() = %v, want %v", got, tt.want)
			}
		})
	}
}
