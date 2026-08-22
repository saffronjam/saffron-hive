package deviceimage

import (
	"bytes"
	"context"
	"encoding/base64"
	"image"
	"image/color"
	"image/png"
	"net/http"
	"net/http/httptest"
	"net/url"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

type rewriteTransport struct {
	target *url.URL
	base   http.RoundTripper
}

func (t rewriteTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	clone := request.Clone(request.Context())
	clone.URL.Scheme = t.target.Scheme
	clone.URL.Host = t.target.Host
	return t.base.RoundTrip(clone)
}

func publicTestClient(t *testing.T, server *httptest.Server) *http.Client {
	t.Helper()
	target, err := url.Parse(server.URL)
	if err != nil {
		t.Fatal(err)
	}
	base := server.Client()
	client := *base
	client.Transport = rewriteTransport{target: target, base: base.Transport}
	return &client
}

func testPNG(t *testing.T) []byte {
	t.Helper()
	img := image.NewRGBA(image.Rect(0, 0, 2, 2))
	img.Set(0, 0, color.RGBA{R: 200, G: 80, B: 20, A: 255})
	var out bytes.Buffer
	if err := png.Encode(&out, img); err != nil {
		t.Fatal(err)
	}
	return out.Bytes()
}

func TestCacheAcceptsDataURIAndPersists(t *testing.T) {
	data := testPNG(t)
	candidate := "data:image/png;base64," + base64.StdEncoding.EncodeToString(data)
	source := Source{Candidates: []Candidate{{Value: candidate, Inline: true}}, Fingerprint: "v1"}
	cache := NewCacheWithClient(t.TempDir(), http.DefaultClient, time.Now)
	if err := cache.Init(); err != nil {
		t.Fatal(err)
	}
	first, err := cache.Get(context.Background(), "dev-1", source)
	if err != nil || first.ContentType != "image/png" || first.ETag == "" {
		t.Fatalf("first result = %#v, %v", first, err)
	}
	second, err := cache.Get(context.Background(), "dev-1", source)
	if err != nil || second.Path != first.Path || second.ETag != first.ETag {
		t.Fatalf("cached result = %#v, %v", second, err)
	}
}

func TestCacheCoalescesParallelFetches(t *testing.T) {
	data := testPNG(t)
	var requests atomic.Int32
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		requests.Add(1)
		time.Sleep(20 * time.Millisecond)
		_, _ = w.Write(data)
	}))
	defer server.Close()
	cache := NewCacheWithClient(t.TempDir(), publicTestClient(t, server), time.Now)
	source := Source{Candidates: []Candidate{{Value: "https://example.com/image.png"}}, Fingerprint: "v1"}
	var wg sync.WaitGroup
	for range 8 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if _, err := cache.Get(context.Background(), "dev-1", source); err != nil {
				t.Errorf("get: %v", err)
			}
		}()
	}
	wg.Wait()
	if got := requests.Load(); got != 1 {
		t.Fatalf("requests = %d, want 1", got)
	}
}

func TestCacheNegativeResultExpires(t *testing.T) {
	var now = time.Unix(1_700_000_000, 0)
	var requests atomic.Int32
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		requests.Add(1)
		http.Error(w, "missing", http.StatusNotFound)
	}))
	defer server.Close()
	cache := NewCacheWithClient(t.TempDir(), publicTestClient(t, server), func() time.Time { return now })
	source := Source{Candidates: []Candidate{{Value: "https://example.com/missing.png"}}, Fingerprint: "missing"}
	for range 2 {
		if _, err := cache.Get(context.Background(), "dev-1", source); err != ErrNotFound {
			t.Fatalf("error = %v", err)
		}
	}
	if got := requests.Load(); got != 1 {
		t.Fatalf("requests = %d, want 1", got)
	}
	now = now.Add(missingCacheTTL + time.Second)
	_, _ = cache.Get(context.Background(), "dev-1", source)
	if got := requests.Load(); got != 2 {
		t.Fatalf("requests after expiry = %d, want 2", got)
	}
}

func TestCacheRejectsPrivateRemoteAndSpoofedPayload(t *testing.T) {
	cache := NewCacheWithClient(t.TempDir(), http.DefaultClient, time.Now)
	private := Source{Candidates: []Candidate{{Value: "https://127.0.0.1/image.png"}}, Fingerprint: "private"}
	if _, err := cache.Get(context.Background(), "dev-1", private); err != ErrNotFound {
		t.Fatalf("private URL error = %v", err)
	}

	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "image/png")
		_, _ = w.Write([]byte("<svg></svg>"))
	}))
	defer server.Close()
	spoofed := NewCacheWithClient(t.TempDir(), publicTestClient(t, server), time.Now)
	if _, err := spoofed.Get(context.Background(), "dev-1", Source{Candidates: []Candidate{{Value: "https://example.com/device.png"}}, Fingerprint: "svg"}); err != ErrNotFound {
		t.Fatalf("spoofed payload error = %v", err)
	}
}
