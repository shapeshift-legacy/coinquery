package middleware

import (
	"net/http"
	"strings"
)

// apiKeyHarasserMiddleware harasses the caller if they are not using a distinct api key
// This middleware should only be used in staging environments to preserve compatability
// with the keepkey client
func APIKeyHarasser(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		apikey := r.URL.Query().Get("apikey")

		if strings.HasSuffix(apikey, "-local") {
			http.Error(w, "Please use a distinct 'apikey' for your request and try again", 420)
			return
		}

		h.ServeHTTP(w, r)
	})
}
