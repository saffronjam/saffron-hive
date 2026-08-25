package zigbeedocs

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/saffronjam/saffron-hive/internal/logging"
)

const (
	cacheVersion        = 1
	refreshAge          = 30 * 24 * time.Hour
	maxDocumentBytes    = 1 << 20
	documentRequestTime = 8 * time.Second
	documentAgent       = "Saffron-Hive/zigbee-device-docs"
	maxRedirects        = 3
	transientFailureAge = 5 * time.Minute
	statusAvailable     = "available"
	statusMissing       = "missing"
)

var (
	// ErrNotFound means Zigbee2MQTT has no documentation page for the model.
	ErrNotFound = errors.New("zigbee device documentation not found")
	// ErrTransient means the documentation source or local cache is temporarily unavailable.
	ErrTransient = errors.New("zigbee device documentation temporarily unavailable")
	logger       = logging.Named("zigbee_docs")
)

type cacheMetadata struct {
	Version       int       `json:"version"`
	Model         string    `json:"model"`
	Slug          string    `json:"slug"`
	Status        string    `json:"status"`
	ETag          string    `json:"etag,omitempty"`
	LastModified  string    `json:"lastModified,omitempty"`
	LastCheckedAt time.Time `json:"lastCheckedAt"`
}

type cachedEntry struct {
	metadata cacheMetadata
	document *Documentation
}

type flight struct {
	done     chan struct{}
	document *Documentation
	err      error
}

type transientFailure struct {
	err   error
	until time.Time
}

// Cache owns the persistent per-model Zigbee2MQTT documentation cache.
type Cache struct {
	dir        string
	client     *http.Client
	now        func() time.Time
	rawBaseURL string

	backgroundCtx    context.Context
	cancelBackground context.CancelFunc
	backgroundWG     sync.WaitGroup

	mu       sync.Mutex
	flights  map[string]*flight
	failures map[string]transientFailure
}

// NewCache constructs a cache using the public Zigbee2MQTT documentation source.
func NewCache(dir string) *Cache {
	return newCache(dir, secureHTTPClient(), time.Now, rawBaseURL)
}

func newCache(dir string, client *http.Client, now func() time.Time, baseURL string) *Cache {
	if now == nil {
		now = time.Now
	}
	backgroundCtx, cancel := context.WithCancel(context.Background())
	return &Cache{
		dir: dir, client: client, now: now, rawBaseURL: baseURL,
		backgroundCtx: backgroundCtx, cancelBackground: cancel,
		flights: map[string]*flight{}, failures: map[string]transientFailure{},
	}
}

// Init creates the cache root.
func (c *Cache) Init() error {
	return os.MkdirAll(c.dir, 0o755)
}

// Close cancels refreshes and releases idle upstream connections.
func (c *Cache) Close() {
	c.cancelBackground()
	c.backgroundWG.Wait()
	if closer, ok := c.client.Transport.(interface{ CloseIdleConnections() }); ok {
		closer.CloseIdleConnections()
	}
}

// Lookup returns cached documentation for model, fetching it when necessary.
func (c *Cache) Lookup(ctx context.Context, model string) (*Documentation, error) {
	model = normalizeText(model)
	slug := Slug(model)
	if slug == "" {
		return nil, ErrNotFound
	}
	entry, err := c.readEntry(model, slug)
	if err == nil {
		if c.now().Sub(entry.metadata.LastCheckedAt) < refreshAge {
			if entry.metadata.Status == statusMissing {
				return nil, ErrNotFound
			}
			return entry.document, nil
		}
		if entry.document != nil {
			if c.transientError(slug) == nil {
				c.refreshAsync(model, slug, entry)
			}
			return entry.document, nil
		}
	}
	if err := c.transientError(slug); err != nil {
		return nil, err
	}
	return c.fetchCoalesced(ctx, model, slug, entry)
}

func (c *Cache) transientError(slug string) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	failure, ok := c.failures[slug]
	if !ok {
		return nil
	}
	if !c.now().Before(failure.until) {
		delete(c.failures, slug)
		return nil
	}
	return failure.err
}

func (c *Cache) readEntry(model, slug string) (cachedEntry, error) {
	metadataBytes, err := os.ReadFile(c.metadataPath(slug))
	if err != nil {
		return cachedEntry{}, err
	}
	var metadata cacheMetadata
	if err := json.Unmarshal(metadataBytes, &metadata); err != nil {
		return cachedEntry{}, err
	}
	if metadata.Version != cacheVersion || metadata.Model != model || metadata.Slug != slug || metadata.LastCheckedAt.IsZero() {
		return cachedEntry{}, fmt.Errorf("invalid Zigbee documentation cache metadata")
	}
	entry := cachedEntry{metadata: metadata}
	if metadata.Status == statusMissing {
		return entry, nil
	}
	if metadata.Status != statusAvailable {
		return cachedEntry{}, fmt.Errorf("invalid Zigbee documentation cache status")
	}
	source, err := os.ReadFile(c.documentPath(slug))
	if err != nil {
		return cachedEntry{}, err
	}
	document, err := parseDocumentation(source)
	if err != nil {
		return cachedEntry{}, err
	}
	document.SourceURL = DefinitionURL(model)
	document.LastCheckedAt = metadata.LastCheckedAt
	entry.document = &document
	return entry, nil
}

func (c *Cache) fetchCoalesced(ctx context.Context, model, slug string, stale cachedEntry) (*Documentation, error) {
	c.mu.Lock()
	if active, ok := c.flights[slug]; ok {
		c.mu.Unlock()
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-active.done:
			return active.document, active.err
		}
	}
	active := &flight{done: make(chan struct{})}
	c.flights[slug] = active
	c.mu.Unlock()

	document, err := c.refresh(ctx, model, slug, stale)
	c.finishFlight(slug, active, document, err)
	return active.document, active.err
}

func (c *Cache) refreshAsync(model, slug string, stale cachedEntry) {
	c.mu.Lock()
	if _, ok := c.flights[slug]; ok {
		c.mu.Unlock()
		return
	}
	active := &flight{done: make(chan struct{})}
	c.flights[slug] = active
	c.backgroundWG.Add(1)
	c.mu.Unlock()

	go func() {
		defer c.backgroundWG.Done()
		document, err := c.refresh(c.backgroundCtx, model, slug, stale)
		if err != nil && !errors.Is(err, context.Canceled) {
			logger.Warn("refresh Zigbee device documentation failed", "model", model, "error", err)
		}
		c.finishFlight(slug, active, document, err)
	}()
}

func (c *Cache) finishFlight(slug string, active *flight, document *Documentation, err error) {
	c.mu.Lock()
	active.document = document
	active.err = err
	if err == nil || errors.Is(err, ErrNotFound) {
		delete(c.failures, slug)
	} else if !errors.Is(err, context.Canceled) {
		active.err = fmt.Errorf("%w: %v", ErrTransient, err)
		c.failures[slug] = transientFailure{err: active.err, until: c.now().Add(transientFailureAge)}
	}
	delete(c.flights, slug)
	close(active.done)
	c.mu.Unlock()
}

func (c *Cache) refresh(ctx context.Context, model, slug string, stale cachedEntry) (*Documentation, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL(c.rawBaseURL, slug), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", documentAgent)
	req.Header.Set("Accept", "text/markdown,text/plain;q=0.9")
	req.Header.Set("Accept-Encoding", "identity")
	if stale.document != nil {
		if stale.metadata.ETag != "" {
			req.Header.Set("If-None-Match", stale.metadata.ETag)
		}
		if stale.metadata.LastModified != "" {
			req.Header.Set("If-Modified-Since", stale.metadata.LastModified)
		}
	}
	response, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer func() { _ = response.Body.Close() }()

	now := c.now().UTC()
	if response.StatusCode == http.StatusNotModified && stale.document != nil {
		stale.metadata.LastCheckedAt = now
		if err := c.writeMetadata(slug, stale.metadata); err != nil {
			return nil, err
		}
		document := *stale.document
		document.LastCheckedAt = now
		return &document, nil
	}
	if response.StatusCode == http.StatusNotFound || response.StatusCode == http.StatusGone {
		metadata := cacheMetadata{
			Version: cacheVersion, Model: model, Slug: slug, Status: statusMissing, LastCheckedAt: now,
		}
		if err := c.writeMetadata(slug, metadata); err != nil {
			return nil, err
		}
		_ = os.Remove(c.documentPath(slug))
		return nil, ErrNotFound
	}
	if response.StatusCode != http.StatusOK {
		_, _ = io.CopyN(io.Discard, response.Body, 4096)
		return nil, fmt.Errorf("unexpected HTTP status %s", response.Status)
	}
	if response.Header.Get("Content-Encoding") != "" || response.ContentLength > maxDocumentBytes {
		return nil, fmt.Errorf("Zigbee documentation response exceeds limits")
	}
	source, err := io.ReadAll(io.LimitReader(response.Body, maxDocumentBytes+1))
	if err != nil {
		return nil, err
	}
	if len(source) == 0 || len(source) > maxDocumentBytes {
		return nil, fmt.Errorf("Zigbee documentation response exceeds limits")
	}
	document, err := parseDocumentation(source)
	if err != nil {
		return nil, err
	}
	metadata := cacheMetadata{
		Version: cacheVersion, Model: model, Slug: slug, Status: statusAvailable,
		ETag: response.Header.Get("ETag"), LastModified: response.Header.Get("Last-Modified"), LastCheckedAt: now,
	}
	if err := c.writeEntry(slug, source, metadata); err != nil {
		return nil, err
	}
	document.SourceURL = DefinitionURL(model)
	document.LastCheckedAt = now
	logger.Info("cached Zigbee device documentation", "model", model)
	return &document, nil
}

func (c *Cache) writeEntry(slug string, source []byte, metadata cacheMetadata) error {
	if err := atomicWrite(c.documentPath(slug), source); err != nil {
		return fmt.Errorf("write Zigbee documentation: %w", err)
	}
	return c.writeMetadata(slug, metadata)
}

func (c *Cache) writeMetadata(slug string, metadata cacheMetadata) error {
	data, err := json.Marshal(metadata)
	if err != nil {
		return err
	}
	if err := atomicWrite(c.metadataPath(slug), data); err != nil {
		return fmt.Errorf("write Zigbee documentation metadata: %w", err)
	}
	return nil
}

func (c *Cache) entryDir(slug string) string {
	sum := sha256.Sum256([]byte(slug))
	return filepath.Join(c.dir, hex.EncodeToString(sum[:]))
}

func (c *Cache) documentPath(slug string) string {
	return filepath.Join(c.entryDir(slug), "document.md")
}

func (c *Cache) metadataPath(slug string) string {
	return filepath.Join(c.entryDir(slug), "metadata.json")
}

func atomicWrite(path string, data []byte) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	tmp, err := os.CreateTemp(filepath.Dir(path), ".zigbee-doc-*")
	if err != nil {
		return err
	}
	tmpName := tmp.Name()
	ok := false
	defer func() {
		_ = tmp.Close()
		if !ok {
			_ = os.Remove(tmpName)
		}
	}()
	if err := tmp.Chmod(0o644); err != nil {
		return err
	}
	if _, err := tmp.Write(data); err != nil {
		return err
	}
	if err := tmp.Sync(); err != nil {
		return err
	}
	if err := tmp.Close(); err != nil {
		return err
	}
	if err := os.Rename(tmpName, path); err != nil {
		return err
	}
	ok = true
	return nil
}

func secureHTTPClient() *http.Client {
	dialer := &net.Dialer{Timeout: 5 * time.Second, KeepAlive: 30 * time.Second}
	return &http.Client{
		Timeout: documentRequestTime,
		Transport: &http.Transport{
			Proxy: http.ProxyFromEnvironment, DialContext: dialer.DialContext,
			TLSHandshakeTimeout: 5 * time.Second, ResponseHeaderTimeout: 5 * time.Second,
		},
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= maxRedirects {
				return errors.New("too many Zigbee documentation redirects")
			}
			if req.URL.Scheme != "https" || req.URL.Hostname() != "raw.githubusercontent.com" || req.URL.User != nil {
				return errors.New("invalid Zigbee documentation redirect")
			}
			return nil
		},
	}
}
