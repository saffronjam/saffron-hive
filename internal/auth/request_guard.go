package auth

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http"
)

// MaxGraphQLRequestBytes caps a single /graphql POST body. Sized to comfortably
// hold the largest legitimate mutation in the schema (effect updates with many
// clip configs come closest, typically well under 100 KiB). Adjust upward only
// after measuring against the actual payload that needs more headroom.
const MaxGraphQLRequestBytes int64 = 256 << 10

// genericInvalidBodyResponse is the constant 400 response we emit for any body
// that fails to parse. It is intentionally opaque — gqlgen's default decoder
// echoes the raw request bytes back in its error string (`body:not-json`),
// which would leak request fragments into proxy access logs and any
// downstream error aggregators. Replacing the response at this layer means
// the raw bytes never reach gqlgen at all.
var genericInvalidBodyResponse = []byte(`{"errors":[{"message":"invalid request body","extensions":{"code":"BAD_REQUEST"}}]}` + "\n")

// RequestGuard wraps the GraphQL HTTP handler with two pre-decode checks:
//
//  1. Body size is capped via http.MaxBytesReader. Oversize bodies short-circuit
//     to 413 before any further work — a defence against memory-exhaustion
//     attacks that POST multi-megabyte payloads to /graphql.
//
//  2. The body is parsed as JSON once at this layer. Malformed bodies are
//     rejected with a generic 400 error that does not echo the request bytes
//     back to the client (or to anything logging the response).
//
// WebSocket upgrades and GET requests pass through untouched — they have no
// JSON body and their size is bounded by the HTTP server's own header limits.
// On success the body is replaced with a buffered reader over the validated
// bytes so the downstream gqlgen handler sees an unchanged stream.
func RequestGuard(maxBytes int64) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method == http.MethodGet || isWebSocketUpgrade(r) {
				next.ServeHTTP(w, r)
				return
			}

			r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
			buf, err := io.ReadAll(r.Body)
			if err != nil {
				var mbe *http.MaxBytesError
				if errors.As(err, &mbe) {
					http.Error(w, "request body too large", http.StatusRequestEntityTooLarge)
					return
				}
				writeInvalidBody(w)
				return
			}

			var probe json.RawMessage
			if err := json.Unmarshal(buf, &probe); err != nil {
				writeInvalidBody(w)
				return
			}

			r.Body = io.NopCloser(bytes.NewReader(buf))
			r.ContentLength = int64(len(buf))
			next.ServeHTTP(w, r)
		})
	}
}

func writeInvalidBody(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusBadRequest)
	_, _ = w.Write(genericInvalidBodyResponse)
}
