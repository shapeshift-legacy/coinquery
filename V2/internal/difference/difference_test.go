// +build unit

package difference

import (
	"reflect"
	"testing"
)

func TestString(t *testing.T) {
	type args struct {
		a []string
		b []string
	}
	tests := []struct {
		name string
		args args
		want []string
	}{
		{
			"No Difference",
			args{[]string{"a", "b", "c"}, []string{"a", "b", "c"}},
			[]string{},
		},
		{
			"Difference 1",
			args{[]string{"a", "b"}, []string{"a", "b", "c"}},
			[]string{"c"},
		},
		{
			"Difference 2",
			args{[]string{"a", "b", "c"}, []string{"b", "c"}},
			[]string{"a"},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := String(tt.args.a, tt.args.b); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("String() = %v, want %v", got, tt.want)
			}
		})
	}
}
