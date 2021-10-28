// +build unit

package includes

import "testing"

func TestString(t *testing.T) {
	type args struct {
		ss []string
		es []string
	}
	tests := []struct {
		name string
		args args
		want bool
	}{
		{
			"False",
			args{[]string{"one", "two"}, []string{"none"}},
			false,
		},
		{
			"True",
			args{[]string{"one", "two"}, []string{"none", "two"}},
			true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := String(tt.args.ss, tt.args.es...); got != tt.want {
				t.Errorf("String() = %v, want %v", got, tt.want)
			}
		})
	}
}
