// +build unit

package http

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"os"
	"reflect"
	"strings"
	"testing"

	"github.com/shapeshift-legacy/coinquery/V2/config"
)

var responseBody interface{}
var responseCode int

var httpServer *httptest.Server

func newConf(url, user, password string) *config.RPC {
	return &config.RPC{
		CoinRPC: config.CoinRPC{
			URL:      url,
			User:     user,
			Password: password,
		},
	}
}

func TestMain(m *testing.M) {
	httpServer = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		data, _ := ioutil.ReadAll(r.Body)
		defer r.Body.Close()

		if strings.Compare(strings.TrimSuffix(string(data), "\n"), `"invalid body"`) == 0 {
			w.Header().Set("Content-Length", "1")
		}

		w.WriteHeader(responseCode)

		fmt.Fprintf(w, responseBody.(string))
	}))
	defer httpServer.Close()

	os.Exit(m.Run())
}

func TestStatus_Error(t *testing.T) {
	tests := []struct {
		name   string
		status Status
		want   string
	}{
		{
			name:   "Error999",
			status: Status{Code: 999, Message: "Test Error"},
			want:   "999: Test Error",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.status.Error(); got != tt.want {
				t.Errorf("Status.Error() = %+v, want %+v", got, tt.want)
			}
		})
	}
}

func TestNewClient(t *testing.T) {
	type data struct {
		scheme   string
		host     string
		user     string
		password string
	}
	type args struct {
		c *config.RPC
	}
	tests := []struct {
		name string
		args args
		want data
	}{
		{
			name: "Http/Port",
			args: args{
				c: &config.RPC{
					CoinRPC: config.CoinRPC{
						URL:      "http://example.com:8000",
						User:     "user",
						Password: "",
					},
				},
			},
			want: data{
				scheme:   "http",
				host:     "example.com:8000",
				user:     "user",
				password: "",
			},
		},
		{
			name: "Http/Port",
			args: args{
				c: &config.RPC{
					CoinRPC: config.CoinRPC{
						URL:      "https://example.com",
						User:     "user",
						Password: "password",
					},
				},
			},
			want: data{
				scheme:   "https",
				host:     "example.com",
				user:     "user",
				password: "password",
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := NewClient(tt.args.c)
			got := data{
				scheme:   c.BaseURL.Scheme,
				host:     c.BaseURL.Host,
				user:     c.User,
				password: c.Password,
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("NewClient() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestClient_NewRPCRequest(t *testing.T) {
	type args struct {
		method string
		params []interface{}
	}
	tests := []struct {
		name string
		url  string
		args args
		want *RPCRequest
	}{
		{
			name: "No Parameter",
			url:  httpServer.URL,
			args: args{"info", []interface{}{}},
			want: &RPCRequest{
				Version: "2.0",
				ID:      0,
				Method:  "info",
				Params:  []interface{}{},
			},
		},
		{
			name: "Single Parameter",
			url:  httpServer.URL,
			args: args{"block", []interface{}{1000}},
			want: &RPCRequest{
				Version: "2.0",
				ID:      0,
				Method:  "block",
				Params:  []interface{}{1000},
			},
		},
		{
			name: "Multiple Parameters",
			url:  httpServer.URL,
			args: args{"hashes", []interface{}{"0", "1"}},
			want: &RPCRequest{
				Version: "2.0",
				ID:      0,
				Method:  "hashes",
				Params:  []interface{}{"0", "1"},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := NewClient(newConf(tt.url, "", ""))
			got := c.NewRPCRequest(tt.args.method, tt.args.params...)
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("CallRequest = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestClient_CallRest(t *testing.T) {
	type args struct {
		method string
		path   string
		code   int
		body   interface{}
		v      interface{}
	}
	tests := []struct {
		name    string
		url     string
		args    args
		want    interface{}
		wantErr bool
	}{
		{
			name: "Success",
			url:  httpServer.URL,
			args: args{
				method: "GET",
				path:   "",
				code:   200,
				body:   `{"foo":"bar"}`,
				v: &struct {
					Foo string `json:"foo"`
				}{},
			},
			want: &struct {
				Foo string `json:"foo"`
			}{Foo: "bar"},
			wantErr: false,
		},
		{
			name: "Error: Make Request",
			url:  httpServer.URL,
			args: args{
				method: "GET",
				path:   "%not_valid",
				code:   0,
				body:   nil,
				v:      nil,
			},
			want:    nil,
			wantErr: true,
		},
		{
			name: "Error: Do Request",
			url:  "",
			args: args{
				method: "GET",
				path:   "",
				code:   0,
				body:   nil,
				v:      nil,
			},
			want:    nil,
			wantErr: true,
		},
		{
			name: "Error: Status Code, Bad Body",
			url:  httpServer.URL,
			args: args{
				method: "GET",
				path:   "",
				code:   500,
				body:   "invalid body",
				v:      nil,
			},
			want:    nil,
			wantErr: true,
		},
		{
			name: "Error: Status Code",
			url:  httpServer.URL,
			args: args{
				method: "GET",
				path:   "",
				code:   500,
				body:   "",
				v:      nil,
			},
			want:    nil,
			wantErr: true,
		},
		{
			name: "Error: Decode",
			url:  httpServer.URL,
			args: args{
				method: "GET",
				path:   "",
				code:   200,
				body:   "unable to decode",
				v: &struct {
					Foo string `json:"foo"`
				}{},
			},
			want: &struct {
				Foo string `json:"foo"`
			}{},
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := NewClient(newConf(tt.url, "", ""))
			responseBody = tt.args.body
			responseCode = tt.args.code
			if err := c.CallRest(tt.args.method, tt.args.path, tt.args.body, tt.args.v); (err != nil) != tt.wantErr {
				t.Errorf("Client.CallRest() error = %+v, wantErr %+v", err, tt.wantErr)
			}
			if !reflect.DeepEqual(tt.args.v, tt.want) {
				t.Errorf("Client.CallRest() = %+v, want %+v", tt.args.v, tt.want)
			}
		})
	}
}

func TestClient_CallRPC(t *testing.T) {
	responseBody = ""
	type v struct {
		Foo string `json:"foo"`
	}
	type args struct {
		method string
		params []interface{}
		v      *v
	}
	tests := []struct {
		name    string
		url     string
		args    args
		body    string
		want    *v
		wantErr bool
	}{
		{
			name: "Success",
			url:  httpServer.URL,
			args: args{
				method: "test",
				params: nil,
				v:      &v{},
			},
			body: `{"jsonrpc":"2.0","result":{"foo":"bar"},"id":0}`,
			want: &v{
				Foo: "bar",
			},
			wantErr: false,
		},
		{
			name: "Error: Make Request",
			url:  httpServer.URL,
			args: args{
				method: "test",
				params: []interface{}{make(chan int)},
				v:      &v{},
			},
			body:    "",
			want:    &v{},
			wantErr: true,
		},
		{
			name: "Error: Do Request",
			url:  "",
			args: args{
				method: "test",
				params: nil,
				v:      nil,
			},
			body:    "",
			want:    nil,
			wantErr: true,
		},
		{
			name: "Error: Decode",
			url:  httpServer.URL,
			args: args{
				method: "test",
				params: nil,
				v:      &v{},
			},
			body:    "unable to decode",
			want:    &v{},
			wantErr: true,
		},
		{
			name: "Error: StatusCode",
			url:  httpServer.URL,
			args: args{
				method: "test",
				params: nil,
				v:      &v{},
			},
			body:    `{"jsonrpc":"2.0","error":{"code":999,"message":"Test Error"},"id":0}`,
			want:    &v{},
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := NewClient(newConf(tt.url, "", ""))
			requestBody := c.NewRPCRequest(tt.args.method, tt.args.params...)
			responseBody = tt.body
			if err := c.CallRPC(requestBody, tt.args.v); (err != nil) != tt.wantErr {
				t.Errorf("Client.CallRPC() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(tt.args.v, tt.want) {
				t.Errorf("Client.CallRPC() = %v, want %v", tt.args.v, tt.want)
			}
		})
	}
}

func TestClient_CallRPCBatch(t *testing.T) {
	responseBody = ""
	type v struct {
		Foo string `json:"foo"`
	}
	type args struct {
		method string
		params []interface{}
		v      []*v
	}
	tests := []struct {
		name    string
		url     string
		args    args
		body    string
		want    []*v
		wantErr bool
	}{
		{
			name: "Success",
			url:  httpServer.URL,
			args: args{
				method: "test",
				params: nil,
				v:      []*v{},
			},
			body: `[{"jsonrpc":"2.0","result":{"foo":"bar"},"id":0},{"jsonrpc":"2.0","result":{"foo":"baz"},"id":0}]`,
			want: []*v{
				&v{
					Foo: "bar",
				},
				&v{
					Foo: "baz",
				},
			},
			wantErr: false,
		},
		{
			name: "Error: Make Request",
			url:  httpServer.URL,
			args: args{
				method: "test",
				params: []interface{}{make(chan int)},
				v:      []*v{},
			},
			body:    "",
			want:    []*v{},
			wantErr: true,
		},
		{
			name: "Error: Do Request",
			url:  "",
			args: args{
				method: "test",
				params: nil,
				v:      nil,
			},
			body:    "",
			want:    nil,
			wantErr: true,
		},
		{
			name: "Error: Decode",
			url:  httpServer.URL,
			args: args{
				method: "test",
				params: nil,
				v:      []*v{},
			},
			body:    "unable to decode",
			want:    []*v{},
			wantErr: true,
		},
		{
			name: "Error: StatusCode",
			url:  httpServer.URL,
			args: args{
				method: "test",
				params: nil,
				v:      []*v{},
			},
			body:    `[{"jsonrpc":"2.0","result":"Success","id":0},{"jsonrpc":"2.0","error":{"code":999,"message":"Error"},"id":0}]`,
			want:    []*v{},
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := NewClient(newConf(tt.url, "", ""))
			requestBody := []*RPCRequest{
				c.NewRPCRequest(tt.args.method, tt.args.params...),
				c.NewRPCRequest(tt.args.method, tt.args.params...),
			}
			responseBody = tt.body

			if err := c.CallRPCBatch(requestBody, &tt.args.v); (err != nil) != tt.wantErr {
				t.Errorf("Client.CallRPC() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(tt.args.v, tt.want) {
				t.Errorf("Client.CallRPC() = %v, want %v", tt.args.v, tt.want)
			}
		})
	}
}
