package serve

import (
	"bytes"
	"compress/gzip"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func jsonHandler(body string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = io.WriteString(w, body)
	})
}

func TestGzipGraphQLCompressesLargeJSON(t *testing.T) {
	body := `{"data":{"devices":[` + strings.Repeat(`{"id":"x"},`, 500) + `null]}}`
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/graphql", nil)
	req.Header.Set("Accept-Encoding", "gzip")

	GzipGraphQL(jsonHandler(body)).ServeHTTP(rec, req)

	if got := rec.Header().Get("Content-Encoding"); got != "gzip" {
		t.Fatalf("Content-Encoding = %q, want gzip", got)
	}
	if rec.Body.Len() >= len(body) {
		t.Errorf("compressed length %d, want less than %d", rec.Body.Len(), len(body))
	}

	zr, err := gzip.NewReader(bytes.NewReader(rec.Body.Bytes()))
	if err != nil {
		t.Fatalf("gzip reader: %v", err)
	}
	got, err := io.ReadAll(zr)
	if err != nil {
		t.Fatalf("read: %v", err)
	}
	if string(got) != body {
		t.Errorf("round trip mismatch")
	}
}

func TestGzipGraphQLSkipsWithoutAcceptEncoding(t *testing.T) {
	body := `{"data":{"devices":[` + strings.Repeat(`{"id":"x"},`, 500) + `null]}}`
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/graphql", nil)

	GzipGraphQL(jsonHandler(body)).ServeHTTP(rec, req)

	if got := rec.Header().Get("Content-Encoding"); got != "" {
		t.Errorf("Content-Encoding = %q, want empty", got)
	}
	if rec.Body.String() != body {
		t.Errorf("body was altered")
	}
}

func TestGzipGraphQLSkipsSmallResponses(t *testing.T) {
	body := `{"data":{"setupStatus":{"needsSetup":false}}}`
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/graphql", nil)
	req.Header.Set("Accept-Encoding", "gzip")

	GzipGraphQL(jsonHandler(body)).ServeHTTP(rec, req)

	if got := rec.Header().Get("Content-Encoding"); got != "" {
		t.Errorf("Content-Encoding = %q, want empty for a %d byte body", got, len(body))
	}
	if rec.Body.String() != body {
		t.Errorf("body was altered")
	}
}

// A WebSocket handshake must reach the inner handler with the original
// ResponseWriter: the graphql-ws transport hijacks the connection, which a
// wrapped writer would not support.
func TestGzipGraphQLPassesWebSocketUpgradeThrough(t *testing.T) {
	var got http.ResponseWriter
	inner := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		got = w
	})

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/graphql", nil)
	req.Header.Set("Accept-Encoding", "gzip")
	req.Header.Set("Upgrade", "websocket")
	req.Header.Set("Connection", "Upgrade")

	GzipGraphQL(inner).ServeHTTP(rec, req)

	if got == nil {
		t.Fatal("inner handler was not called")
	}
	if got != http.ResponseWriter(rec) {
		t.Error("inner handler received a wrapped ResponseWriter, which breaks the hijack")
	}
}
