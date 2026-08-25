package zigbeedocs

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

func TestCachePersistsAndSharesModels(t *testing.T) {
	var requests atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		requests.Add(1)
		response.Header().Set("ETag", `"one"`)
		_, _ = fmt.Fprint(response, deviceMarkdown("SNZB-02P", "SONOFF", "Sensor", "battery", "### Battery\nUses a CR2477 battery\n"))
	}))
	defer server.Close()

	dir := t.TempDir()
	now := time.Date(2026, 8, 24, 12, 0, 0, 0, time.UTC)
	cache := newCache(dir, server.Client(), func() time.Time { return now }, server.URL)
	t.Cleanup(cache.Close)
	if err := cache.Init(); err != nil {
		t.Fatal(err)
	}
	first, err := cache.Lookup(context.Background(), "SNZB-02P")
	if err != nil || first.BatteryType != "CR2477" {
		t.Fatalf("first lookup = %+v, %v", first, err)
	}
	second, err := cache.Lookup(context.Background(), "SNZB-02P")
	if err != nil || second.BatteryType != "CR2477" || requests.Load() != 1 {
		t.Fatalf("second lookup = %+v, %v; requests = %d", second, err, requests.Load())
	}

	restarted := newCache(dir, server.Client(), func() time.Time { return now }, server.URL)
	t.Cleanup(restarted.Close)
	if err := restarted.Init(); err != nil {
		t.Fatal(err)
	}
	third, err := restarted.Lookup(context.Background(), "SNZB-02P")
	if err != nil || third.BatteryType != "CR2477" || requests.Load() != 1 {
		t.Fatalf("restart lookup = %+v, %v; requests = %d", third, err, requests.Load())
	}
}

func TestCacheCoalescesColdFetches(t *testing.T) {
	var requests atomic.Int32
	release := make(chan struct{})
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		requests.Add(1)
		<-release
		_, _ = fmt.Fprint(response, deviceMarkdown("model", "vendor", "description", "battery", "### Battery\nUses a CR2032 battery.\n"))
	}))
	defer server.Close()
	cache := newCache(t.TempDir(), server.Client(), time.Now, server.URL)
	t.Cleanup(cache.Close)
	if err := cache.Init(); err != nil {
		t.Fatal(err)
	}

	const callers = 12
	results := make(chan error, callers)
	var ready sync.WaitGroup
	ready.Add(callers)
	for range callers {
		go func() {
			ready.Done()
			document, err := cache.Lookup(context.Background(), "model")
			if err == nil && document.BatteryType != "CR2032" {
				err = fmt.Errorf("battery type = %q", document.BatteryType)
			}
			results <- err
		}()
	}
	ready.Wait()
	close(release)
	for range callers {
		if err := <-results; err != nil {
			t.Fatal(err)
		}
	}
	if requests.Load() != 1 {
		t.Fatalf("requests = %d", requests.Load())
	}
}

func TestCacheServesStaleAndConditionallyRefreshes(t *testing.T) {
	now := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	mode := "initial"
	var requests atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		requests.Add(1)
		if mode == "not-modified" {
			if request.Header.Get("If-None-Match") != `"one"` {
				t.Errorf("If-None-Match = %q", request.Header.Get("If-None-Match"))
			}
			response.WriteHeader(http.StatusNotModified)
			return
		}
		response.Header().Set("ETag", `"one"`)
		_, _ = fmt.Fprint(response, deviceMarkdown("model", "vendor", "description", "battery", "### Battery\nUses a CR2450 battery.\n"))
	}))
	defer server.Close()
	cache := newCache(t.TempDir(), server.Client(), func() time.Time { return now }, server.URL)
	t.Cleanup(cache.Close)
	if err := cache.Init(); err != nil {
		t.Fatal(err)
	}
	if _, err := cache.Lookup(context.Background(), "model"); err != nil {
		t.Fatal(err)
	}

	now = now.Add(refreshAge + time.Hour)
	mode = "not-modified"
	stale, err := cache.Lookup(context.Background(), "model")
	if err != nil || stale.BatteryType != "CR2450" {
		t.Fatalf("stale lookup = %+v, %v", stale, err)
	}
	cache.backgroundWG.Wait()
	if requests.Load() != 2 {
		t.Fatalf("requests = %d", requests.Load())
	}
	fresh, err := cache.Lookup(context.Background(), "model")
	if err != nil || !fresh.LastCheckedAt.Equal(now) || requests.Load() != 2 {
		t.Fatalf("fresh lookup = %+v, %v; requests = %d", fresh, err, requests.Load())
	}
}

func TestCacheKeepsStaleDocumentOnRefreshFailure(t *testing.T) {
	now := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	mode := "ok"
	var requests atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		requests.Add(1)
		if mode == "error" {
			response.WriteHeader(http.StatusServiceUnavailable)
			return
		}
		_, _ = fmt.Fprint(response, deviceMarkdown("model", "vendor", "description", "battery", "### Battery\nUses a CR2032 battery.\n"))
	}))
	defer server.Close()
	cache := newCache(t.TempDir(), server.Client(), func() time.Time { return now }, server.URL)
	t.Cleanup(cache.Close)
	if err := cache.Init(); err != nil {
		t.Fatal(err)
	}
	if _, err := cache.Lookup(context.Background(), "model"); err != nil {
		t.Fatal(err)
	}
	now = now.Add(refreshAge + time.Hour)
	mode = "error"
	stale, err := cache.Lookup(context.Background(), "model")
	if err != nil || stale.BatteryType != "CR2032" {
		t.Fatalf("stale lookup = %+v, %v", stale, err)
	}
	cache.backgroundWG.Wait()
	stored, err := cache.readEntry("model", "model")
	if err != nil || stored.document.BatteryType != "CR2032" {
		t.Fatalf("stored document = %+v, %v", stored.document, err)
	}
	if _, err := cache.Lookup(context.Background(), "model"); err != nil {
		t.Fatalf("second stale lookup: %v", err)
	}
	if requests.Load() != 2 {
		t.Fatalf("requests during transient backoff = %d", requests.Load())
	}
}

func TestCacheBacksOffColdTransientFailures(t *testing.T) {
	now := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	var requests atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		requests.Add(1)
		response.WriteHeader(http.StatusServiceUnavailable)
	}))
	defer server.Close()
	cache := newCache(t.TempDir(), server.Client(), func() time.Time { return now }, server.URL)
	t.Cleanup(cache.Close)
	if err := cache.Init(); err != nil {
		t.Fatal(err)
	}
	for range 2 {
		if _, err := cache.Lookup(context.Background(), "model"); !errors.Is(err, ErrTransient) {
			t.Fatalf("lookup error = %v", err)
		}
	}
	if requests.Load() != 1 {
		t.Fatalf("requests during backoff = %d", requests.Load())
	}
	now = now.Add(transientFailureAge + time.Second)
	if _, err := cache.Lookup(context.Background(), "model"); !errors.Is(err, ErrTransient) {
		t.Fatalf("lookup after backoff error = %v", err)
	}
	if requests.Load() != 2 {
		t.Fatalf("requests after backoff = %d", requests.Load())
	}
}

func TestCacheCachesMissingPage(t *testing.T) {
	var requests atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		requests.Add(1)
		response.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()
	cache := newCache(t.TempDir(), server.Client(), time.Now, server.URL)
	t.Cleanup(cache.Close)
	if err := cache.Init(); err != nil {
		t.Fatal(err)
	}
	for range 2 {
		if _, err := cache.Lookup(context.Background(), "missing"); !errors.Is(err, ErrNotFound) {
			t.Fatalf("lookup error = %v", err)
		}
	}
	if requests.Load() != 1 {
		t.Fatalf("requests = %d", requests.Load())
	}
}

func TestCacheRejectsOversizedAndRecoversCorruptEntries(t *testing.T) {
	mode := "large"
	now := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		if mode == "large" {
			response.Header().Set("Content-Length", fmt.Sprint(maxDocumentBytes+1))
			return
		}
		_, _ = fmt.Fprint(response, deviceMarkdown("model", "vendor", "description", "battery", "### Battery\nUses a CR2032 battery.\n"))
	}))
	defer server.Close()
	cache := newCache(t.TempDir(), server.Client(), func() time.Time { return now }, server.URL)
	t.Cleanup(cache.Close)
	if err := cache.Init(); err != nil {
		t.Fatal(err)
	}
	if _, err := cache.Lookup(context.Background(), "model"); err == nil {
		t.Fatal("oversized document was accepted")
	}
	mode = "valid"
	now = now.Add(transientFailureAge + time.Second)
	if err := os.MkdirAll(cache.entryDir("model"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(cache.metadataPath("model"), []byte("not-json"), 0o644); err != nil {
		t.Fatal(err)
	}
	document, err := cache.Lookup(context.Background(), "model")
	if err != nil || document.BatteryType != "CR2032" {
		t.Fatalf("recovered lookup = %+v, %v", document, err)
	}
}

func TestSecureHTTPClientRestrictsRedirects(t *testing.T) {
	client := secureHTTPClient()
	allowed, err := http.NewRequest(http.MethodGet, "https://raw.githubusercontent.com/owner/repository/page.md", nil)
	if err != nil {
		t.Fatal(err)
	}
	if err := client.CheckRedirect(allowed, []*http.Request{{}}); err != nil {
		t.Fatalf("same-host redirect rejected: %v", err)
	}
	wrongHost, err := http.NewRequest(http.MethodGet, "https://example.com/page.md", nil)
	if err != nil {
		t.Fatal(err)
	}
	if err := client.CheckRedirect(wrongHost, []*http.Request{{}}); err == nil {
		t.Fatal("cross-host redirect was accepted")
	}
	if err := client.CheckRedirect(allowed, make([]*http.Request, maxRedirects)); err == nil {
		t.Fatal("redirect limit was not enforced")
	}
}
