package middleware

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"runtime"
	"strconv"
	"time"

	"github.com/shapeshift-legacy/coinquery/V2/internal/log"
)

type statusWriter struct {
	http.ResponseWriter
	status int
}

func newStatusWriter(w http.ResponseWriter) *statusWriter {
	return &statusWriter{w, http.StatusOK}
}

func (w *statusWriter) WriteHeader(status int) {
	w.status = status
	w.ResponseWriter.WriteHeader(status)
}

func Logger(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		req, err := httputil.DumpRequest(r, true)
		if err != nil {
			log.Warn(err, "logger", "failed to dump request")
		}

		sw := newStatusWriter(w)

		t := time.Now().UTC()

		h.ServeHTTP(sw, r)

		if sw.status != http.StatusOK {
			log.SetCustomFields(log.Fields{"method": r.Method, "statusCode": sw.status, "responseTime": fmt.Sprintf("%s", time.Since(t))})
			log.Error(nil, "logger", string(req))

			// TODO: Remove this after watchtower is done being debugged for 104 errors
			if sw.status == 104 {
				log.Error(nil, "logger", "Connection Reset By Peer Detected:", "Num active goroutines="+strconv.Itoa(runtime.NumGoroutine()))
			}
			return
		}

		path := r.URL.Path

		if path != "/ping" && path != "/favicon.ico" {
			log.SetCustomFields(log.Fields{"method": r.Method, "statusCode": sw.status, "responseTime": fmt.Sprintf("%s", time.Since(t))})
			log.Infof("logger", "%s from %s", r.URL.String(), r.RemoteAddr)
		}
	})
}
