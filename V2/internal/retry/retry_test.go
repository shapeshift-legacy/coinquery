// +build unit

package retry

import (
	"fmt"
	"testing"
)

func Test_Simple(t *testing.T) {
	var attempt int
	type args struct {
		attempts int
		sleep    int64
		fn       func() error
	}
	tests := []struct {
		name    string
		args    args
		wantErr bool
	}{
		{
			name: "Success No Retry",
			args: args{
				attempts: 1,
				sleep:    0,
				fn: func() error {
					return nil
				},
			},
			wantErr: false,
		},
		{
			name: "Success With Retry",
			args: args{
				attempts: 3,
				sleep:    0,
				fn: func() error {
					attempt++
					if attempt < 3 {
						return fmt.Errorf("error")
					}
					return nil
				},
			},
			wantErr: false,
		},
		{
			name: "Retries failed with err",
			args: args{
				attempts: 3,
				sleep:    0,
				fn: func() error {
					attempt++
					if attempt <= 3 {
						return fmt.Errorf("error")
					}
					return nil
				},
			},
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			attempt = 0
			if err := Simple(tt.args.attempts, tt.args.sleep, tt.args.fn); (err != nil) != tt.wantErr {
				t.Errorf("Simple() error = %+v, wantErr %+v", err, tt.wantErr)
			}
		})
	}
}

func Test_Backoff(t *testing.T) {
	var attempt int
	type args struct {
		attempts int
		sleep    int64
		fn       func() error
	}
	tests := []struct {
		name    string
		args    args
		wantErr bool
	}{
		{
			name: "Success No Retry",
			args: args{
				attempts: 1,
				sleep:    1,
				fn: func() error {
					return nil
				},
			},
			wantErr: false,
		},
		{
			name: "Success With Retry",
			args: args{
				attempts: 1,
				sleep:    1,
				fn: func() error {
					attempt++
					if attempt < 1 {
						return fmt.Errorf("error")
					}
					return nil
				},
			},
			wantErr: false,
		},
		{
			name: "Retries failed with err",
			args: args{
				attempts: 1,
				sleep:    1,
				fn: func() error {
					attempt++
					if attempt <= 1 {
						return fmt.Errorf("error")
					}
					return nil
				},
			},
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			attempt = 0
			if err := Backoff(tt.args.attempts, tt.args.sleep, tt.args.fn); (err != nil) != tt.wantErr {
				t.Errorf("Backoff() error = %+v, wantErr %+v", err, tt.wantErr)
			}
		})
	}
}
