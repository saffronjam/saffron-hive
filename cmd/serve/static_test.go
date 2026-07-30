package serve

import (
	"compress/gzip"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"testing/fstest"
)

func testStaticHandler(t *testing.T) http.Handler {
	t.Helper()
	fsys := fstest.MapFS{
		"index.html":                      {Data: []byte("<!doctype html><title>Hive</title>")},
		"service-worker.js":               {Data: []byte("export const version = 1;")},
		"manifest.webmanifest":            {Data: []byte(`{"name":"Saffron Hive"}`)},
		"favicon.ico":                     {Data: []byte("icon-bytes")},
		"_app/immutable/chunks/abc123.js": {Data: []byte(strings.Repeat("console.log('hive');", 64))},
	}
	h, err := newStaticHandler(fsys)
	if err != nil {
		t.Fatalf("newStaticHandler: %v", err)
	}
	return h
}

func get(t *testing.T, h http.Handler, target string, headers map[string]string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, target, nil)
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

func TestStaticCacheControlPerAssetClass(t *testing.T) {
	h := testStaticHandler(t)
	cases := map[string]string{
		"/_app/immutable/chunks/abc123.js": cacheImmutable,
		"/index.html":                      cacheRevalidate,
		"/service-worker.js":               cacheRevalidate,
		"/manifest.webmanifest":            cacheRevalidate,
		"/favicon.ico":                     cacheConservable,
	}
	for target, want := range cases {
		if got := get(t, h, target, nil).Header().Get("Cache-Control"); got != want {
			t.Errorf("%s Cache-Control = %q, want %q", target, got, want)
		}
	}
}

func TestStaticServesManifestMediaType(t *testing.T) {
	rec := get(t, testStaticHandler(t), "/manifest.webmanifest", nil)
	if got := rec.Header().Get("Content-Type"); got != "application/manifest+json" {
		t.Errorf("Content-Type = %q, want application/manifest+json", got)
	}
}

func TestStaticGzipsWhenAccepted(t *testing.T) {
	h := testStaticHandler(t)
	target := "/_app/immutable/chunks/abc123.js"

	plain := get(t, h, target, nil)
	if enc := plain.Header().Get("Content-Encoding"); enc != "" {
		t.Fatalf("Content-Encoding = %q without Accept-Encoding, want empty", enc)
	}

	zipped := get(t, h, target, map[string]string{"Accept-Encoding": "gzip, deflate"})
	if enc := zipped.Header().Get("Content-Encoding"); enc != "gzip" {
		t.Fatalf("Content-Encoding = %q, want gzip", enc)
	}
	if zipped.Body.Len() >= plain.Body.Len() {
		t.Errorf("gzip body %d bytes not smaller than identity %d", zipped.Body.Len(), plain.Body.Len())
	}
	if vary := zipped.Header().Get("Vary"); vary != "Accept-Encoding" {
		t.Errorf("Vary = %q, want Accept-Encoding", vary)
	}

	zr, err := gzip.NewReader(zipped.Body)
	if err != nil {
		t.Fatalf("gzip.NewReader: %v", err)
	}
	decoded, err := io.ReadAll(zr)
	if err != nil {
		t.Fatalf("read gzip body: %v", err)
	}
	if string(decoded) != plain.Body.String() {
		t.Error("gzip body does not decode to the identity body")
	}
}

func TestStaticRevalidatesWithEtag(t *testing.T) {
	h := testStaticHandler(t)

	first := get(t, h, "/index.html", nil)
	etag := first.Header().Get("ETag")
	if etag == "" {
		t.Fatal("ETag not set")
	}

	second := get(t, h, "/index.html", map[string]string{"If-None-Match": etag})
	if second.Code != http.StatusNotModified {
		t.Errorf("status = %d, want %d", second.Code, http.StatusNotModified)
	}
	if second.Body.Len() != 0 {
		t.Errorf("304 carried %d body bytes, want 0", second.Body.Len())
	}
}

// The gzip and identity encodings are distinct representations, so a client
// holding one must not be told the other is unchanged.
func TestStaticEtagVariesByEncoding(t *testing.T) {
	h := testStaticHandler(t)
	target := "/_app/immutable/chunks/abc123.js"

	plainEtag := get(t, h, target, nil).Header().Get("ETag")
	gzipEtag := get(t, h, target, map[string]string{"Accept-Encoding": "gzip"}).Header().Get("ETag")
	if plainEtag == gzipEtag {
		t.Fatalf("identity and gzip share ETag %q", plainEtag)
	}

	stale := get(t, h, target, map[string]string{"Accept-Encoding": "gzip", "If-None-Match": plainEtag})
	if stale.Code != http.StatusOK {
		t.Errorf("status = %d for identity ETag on a gzip request, want %d", stale.Code, http.StatusOK)
	}
}

func TestStaticFallsBackToShell(t *testing.T) {
	h := testStaticHandler(t)
	rec := get(t, h, "/scenes/kitchen", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}
	if !strings.Contains(rec.Body.String(), "<title>Hive</title>") {
		t.Errorf("client-side route did not receive the shell: %q", rec.Body.String())
	}
	if got := rec.Header().Get("Cache-Control"); got != cacheRevalidate {
		t.Errorf("shell Cache-Control = %q, want %q", got, cacheRevalidate)
	}
}

func TestStaticRejectsNonReadMethods(t *testing.T) {
	rec := httptest.NewRecorder()
	testStaticHandler(t).ServeHTTP(rec, httptest.NewRequest(http.MethodPost, "/", nil))
	if rec.Code != http.StatusMethodNotAllowed {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusMethodNotAllowed)
	}
}

func TestStaticHeadOmitsBody(t *testing.T) {
	rec := httptest.NewRecorder()
	testStaticHandler(t).ServeHTTP(rec, httptest.NewRequest(http.MethodHead, "/index.html", nil))
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}
	if rec.Body.Len() != 0 {
		t.Errorf("HEAD carried %d body bytes, want 0", rec.Body.Len())
	}
}
