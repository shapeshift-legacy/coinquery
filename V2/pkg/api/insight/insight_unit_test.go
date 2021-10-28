// +build unit

package insight

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/go-chi/chi"
)

func TestMain(m *testing.M) {
	os.Exit(m.Run())
}

func Test_CoinCtx(t *testing.T) {
	t.Skip()
	s := InsightServer{}

	want := "btc"

	w := httptest.NewRecorder()
	r, _ := http.NewRequest("GET", "/", nil)

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("coin", want)
	r = r.WithContext(context.WithValue(r.Context(), chi.RouteCtxKey, rctx))
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		got := chi.URLParam(r, "coin")
		if got != want {
			t.Errorf("Failed to pass want name, got: %v / expected: %v", got, want)
		}
	})

	h := s.CoinCtx(handler)
	h.ServeHTTP(w, r)
	res := w.Result()
	if res.StatusCode != http.StatusOK {
		t.Errorf("Expected /{coin}/.. request to be 200 OK but got: %v instead", res.StatusCode)
	}
}

func Test_normalizeAddrFormat(t *testing.T) {
	type args struct {
		addr string
	}
	tests := []struct {
		args    args
		want    string
		wantErr bool
	}{
		{
			args:    args{addr: "bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a"},
			want:    "1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu",
			wantErr: false,
		},
		{
			args:    args{addr: "3P3QsMVK89JBNqZQv5zMAKG8FK3kJM4rjt"},
			want:    "3P3QsMVK89JBNqZQv5zMAKG8FK3kJM4rjt",
			wantErr: false,
		},
		{
			args:    args{addr: "bitcoincash:qpm2q2sznhks23z7629mms6s4cwef74vcwvy22gdx6a"},
			want:    "",
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			got, err := normalizeAddrFormat(tt.args.addr)
			if (err != nil) != tt.wantErr {
				t.Errorf("normalizeAddrFormat() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("normalizeAddrFormat() = %v, want %v", got, tt.want)
			}
		})
	}
}
