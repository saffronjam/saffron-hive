package serve

import (
	"crypto/sha256"
	"encoding/base64"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestSecurityHeadersSetsExpectedKeys(t *testing.T) {
	hashes := []string{"hash-one", "hash-two"}
	next := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	rec := httptest.NewRecorder()
	SecurityHeaders(hashes)(next).ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/", nil))

	h := rec.Header()
	csp := h.Get("Content-Security-Policy")
	for _, want := range hashes {
		if !strings.Contains(csp, "sha256-"+want) {
			t.Errorf("CSP missing script hash %q: %q", want, csp)
		}
	}
	if !strings.Contains(csp, "frame-ancestors 'none'") {
		t.Errorf("CSP missing frame-ancestors: %q", csp)
	}
	want := map[string]string{
		"Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
		"X-Content-Type-Options":    "nosniff",
		"Referrer-Policy":           "strict-origin-when-cross-origin",
	}
	for k, v := range want {
		if got := h.Get(k); got != v {
			t.Errorf("header %s = %q, want %q", k, got, v)
		}
	}
}

func TestComputeInlineScriptHashesHashesEveryScript(t *testing.T) {
	first := "var theme = 'dark';"
	second := "kit.start(app);"
	html := []byte(`<html><head><script>` + first + `</script></head><body><script>` + second + `</script></body></html>`)
	got := computeInlineScriptHashes(html)
	if len(got) != 2 {
		t.Fatalf("got %d hashes, want 2", len(got))
	}
	sum1 := sha256.Sum256([]byte(first))
	sum2 := sha256.Sum256([]byte(second))
	want := []string{
		base64.StdEncoding.EncodeToString(sum1[:]),
		base64.StdEncoding.EncodeToString(sum2[:]),
	}
	for i, w := range want {
		if got[i] != w {
			t.Errorf("hash[%d] = %q, want %q", i, got[i], w)
		}
	}
}

func TestComputeInlineScriptHashesSkipsEmpty(t *testing.T) {
	html := []byte(`<html><script></script><script>var x = 1;</script></html>`)
	got := computeInlineScriptHashes(html)
	if len(got) != 1 {
		t.Fatalf("got %d hashes, want 1 (empty block skipped)", len(got))
	}
	sum := sha256.Sum256([]byte("var x = 1;"))
	if got[0] != base64.StdEncoding.EncodeToString(sum[:]) {
		t.Errorf("hashed the wrong script body: %q", got[0])
	}
}

func TestOriginCheckerRejectsMissingOrigin(t *testing.T) {
	check := originChecker([]string{"https://hive.saffronbun.com"})
	req := httptest.NewRequest(http.MethodGet, "/graphql", nil)
	if check(req) {
		t.Error("missing Origin must be rejected")
	}
}

func TestOriginCheckerAllowsListedOrigin(t *testing.T) {
	check := originChecker([]string{"https://hive.saffronbun.com", "https://other.example"})
	req := httptest.NewRequest(http.MethodGet, "/graphql", nil)
	req.Header.Set("Origin", "https://hive.saffronbun.com")
	if !check(req) {
		t.Error("listed origin rejected")
	}
}

func TestOriginCheckerRejectsUnlistedOrigin(t *testing.T) {
	check := originChecker([]string{"https://hive.saffronbun.com"})
	req := httptest.NewRequest(http.MethodGet, "/graphql", nil)
	req.Header.Set("Origin", "https://evil.example.com")
	if check(req) {
		t.Error("unlisted origin allowed")
	}
}
