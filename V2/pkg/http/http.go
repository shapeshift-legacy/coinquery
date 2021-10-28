package http

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net"
	"net/http"
	"net/url"
	"time"

	"github.com/pkg/errors"
	"github.com/shapeshift-legacy/coinquery/V2/config"
	"github.com/shapeshift-legacy/coinquery/V2/internal/log"
	"github.com/shapeshift-legacy/coinquery/V2/internal/retry"
)

// Client configuration
type Client struct {
	HttpClient *http.Client
	BaseURL    *url.URL
	User       string
	Password   string
	Retry      *config.Retry
	ApiKey     string
}

// RPCRequest format of JSONRPC request
type RPCRequest struct {
	Version string      `json:"jsonrpc"`
	ID      int         `json:"id"`
	Method  string      `json:"method"`
	Params  interface{} `json:"params,omitempty"`
}

// RPCResponse format of JSONRPC response
type RPCResponse struct {
	ID     int         `json:"id"`
	Result interface{} `json:"result"`
	Error  *Status     `json:"error"`
}

// Status format of JSONRPC error or Rest status
type Status struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// Error to implement error interface
func (e *Status) Error() string {
	return fmt.Sprintf("%d: %s", e.Code, e.Message)
}

// NewClient configures and creates a new http client
func NewClient(r *config.RPC) *Client {
	transport := &http.Transport{
		Dial: (&net.Dialer{
			Timeout:   30 * time.Second, // Max time a dial will wait for connection to complete (0 = no timeout)
			KeepAlive: 0 * time.Second,  // Keep-alive period for active network connection (0 = not enabled)
		}).Dial,
		MaxIdleConns:        r.Threads,        // Max number of idle (keep-alive) connections accross all hosts (0 = DefaultMaxIdleConnsPerHost(2))
		MaxIdleConnsPerHost: r.Threads,        // Max number of idle (keep-alive) connection per host (0 = no limit)
		IdleConnTimeout:     90 * time.Second, // Max time and idle (keep-alive) connection will remain idle before closing (0 = no limit)
	}

	u, _ := url.Parse(r.URL)

	log.Info("http", "RPC client connected successfully")

	return &Client{
		HttpClient: &http.Client{
			Transport: transport,
			Timeout:   time.Duration(r.Timeout) * time.Second, // Time limit for requests made (0 = no limit)
		},
		BaseURL:  u,
		User:     r.User,
		Password: r.Password,
		Retry:    &r.Retry,
	}
}

// NewRPCRequest creates a new RPCRequest for JSONRPC
func (c *Client) NewRPCRequest(method string, params ...interface{}) *RPCRequest {
	return &RPCRequest{
		Version: "2.0",
		Method:  method,
		Params:  params,
	}
}

// SetApiKey set the api key
func (c *Client) SetApiKey(key string) {
	c.ApiKey = key
}

// CallRest will make a rest request with body and decode the response into v
func (c *Client) CallRest(method, path string, body interface{}, v interface{}) error {
	return retry.Backoff(c.Retry.Attempts, c.Retry.Sleep, func() error {
		httpReq, err := c.makeRequest(method, path, body)
		if err != nil {
			return errors.New(err.Error())
		}

		httpRes, err := c.HttpClient.Do(httpReq)
		if err != nil {
			return errors.New(err.Error())
		}
		defer httpRes.Body.Close()

		if httpRes.StatusCode < 200 || httpRes.StatusCode > 300 {
			b, err := ioutil.ReadAll(httpRes.Body)
			if err != nil {
				return errors.New(err.Error())
			}

			status := &Status{
				Code:    httpRes.StatusCode,
				Message: string(b),
			}

			return errors.New(status.Error())
		}

		if v != nil {
			d := json.NewDecoder(httpRes.Body)
			d.UseNumber()
			if err := d.Decode(&v); err != nil {
				return errors.Wrap(err, "failed to decode response body")
			}
		}

		return nil
	})
}

// CallRPC will make an rpc request with body and decode the response into v
func (c *Client) CallRPC(body interface{}, v interface{}) error {
	return retry.Backoff(c.Retry.Attempts, c.Retry.Sleep, func() error {
		httpReq, err := c.makeRequest("POST", "", body)
		if err != nil {
			return errors.New(err.Error())
		}

		httpRes, err := c.HttpClient.Do(httpReq)
		if err != nil {
			return errors.New(err.Error())
		}
		defer httpRes.Body.Close()

		r := &RPCResponse{
			Result: &v,
		}

		d := json.NewDecoder(httpRes.Body)
		d.UseNumber()
		if err := d.Decode(r); err != nil {
			return errors.Wrap(err, "failed to decode response body")
		}

		if r.Error != nil {
			return errors.New(r.Error.Error())
		}

		return nil
	})
}

// CallRPCBatch will make a batch rpc request with body and decode the response into v
func (c *Client) CallRPCBatch(body interface{}, v interface{}) error {
	return retry.Backoff(c.Retry.Attempts, c.Retry.Sleep, func() error {
		httpReq, err := c.makeRequest("POST", "", body)
		if err != nil {
			return errors.New(err.Error())
		}

		httpRes, err := c.HttpClient.Do(httpReq)
		if err != nil {
			return errors.New(err.Error())
		}
		defer httpRes.Body.Close()

		rs := []RPCResponse{}

		d := json.NewDecoder(httpRes.Body)
		d.UseNumber()
		if err := d.Decode(&rs); err != nil {
			return errors.Wrap(err, "failed to decode response body")
		}

		results := []interface{}{}
		for _, r := range rs {
			results = append(results, r.Result)

			if r.Error != nil {
				return errors.New(r.Error.Error())
			}
		}

		var buf io.ReadWriter
		buf = new(bytes.Buffer)
		if err := json.NewEncoder(buf).Encode(results); err != nil {
			return errors.Wrap(err, "failed to encode results")
		}

		if err := json.NewDecoder(buf).Decode(&v); err != nil {
			return errors.Wrap(err, "failed to decode results")
		}

		return nil
	})
}

// makeRequest will construct the http request for either rest or rpc
func (c *Client) makeRequest(method, path string, body interface{}) (*http.Request, error) {
	url := *c.BaseURL

	// add path to base url if there is one
	if path != "" {
		u, err := url.Parse(path)
		if err != nil {
			return nil, errors.Wrapf(err, "error parsing url path: %+v", path)
		}

		url = *c.BaseURL.ResolveReference(u)
		url.Path = c.BaseURL.Path + url.Path
	}

	q := url.Query()

	if c.ApiKey != "" {
		q.Add("api_key", c.ApiKey)
	}

	url.RawQuery = q.Encode()

	var buf io.ReadWriter
	if body != nil {
		buf = new(bytes.Buffer)
		if err := json.NewEncoder(buf).Encode(body); err != nil {
			return nil, errors.Wrapf(err, "error encoding request body: %+v", body)
		}
	}

	httpReq, err := http.NewRequest(method, url.String(), buf)
	if err != nil {
		errData := struct {
			method string
			path   string
			body   interface{}
		}{
			method: method,
			path:   path,
			body:   body,
		}

		return nil, errors.Wrapf(err, "error creating request: %+v", errData)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.SetBasicAuth(c.User, c.Password)
	httpReq.Close = true

	return httpReq, nil
}
