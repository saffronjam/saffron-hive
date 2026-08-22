package deviceimage

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	_ "golang.org/x/image/webp"
)

const (
	maxImageBytes     = 5 << 20
	maxImageDimension = 4096
	missingCacheTTL   = time.Hour
	transientCacheTTL = 5 * time.Minute
	deviceImageAgent  = "Saffron-Hive/device-image"
	maxImageRedirects = 3
)

var (
	// ErrNotFound means every candidate is definitively unavailable.
	ErrNotFound = errors.New("device image not found")
	// ErrTransient means at least one candidate could not be checked reliably.
	ErrTransient = errors.New("device image temporarily unavailable")
)

// Result describes a validated cached image.
type Result struct {
	Path        string
	ContentType string
	ETag        string
}

type negativeEntry struct {
	err   error
	until time.Time
}

type flight struct {
	done   chan struct{}
	result Result
	err    error
}

// Cache owns the validated on-disk image cache.
type Cache struct {
	dir    string
	client *http.Client
	now    func() time.Time

	mu       sync.Mutex
	negative map[string]negativeEntry
	flights  map[string]*flight
}

// NewCache constructs a cache with an SSRF-hardened HTTP client.
func NewCache(dir string) *Cache {
	return NewCacheWithClient(dir, secureHTTPClient(), time.Now)
}

// NewCacheWithClient constructs an injectable cache for tests.
func NewCacheWithClient(dir string, client *http.Client, now func() time.Time) *Cache {
	if now == nil {
		now = time.Now
	}
	return &Cache{dir: dir, client: client, now: now, negative: map[string]negativeEntry{}, flights: map[string]*flight{}}
}

// Init creates the cache root.
func (c *Cache) Init() error {
	return os.MkdirAll(c.dir, 0o755)
}

// Close releases idle upstream connections held by the cache client.
func (c *Cache) Close() {
	if closer, ok := c.client.Transport.(interface{ CloseIdleConnections() }); ok {
		closer.CloseIdleConnections()
	}
}

// Get returns a validated cached image, fetching it when necessary.
func (c *Cache) Get(ctx context.Context, deviceID string, source Source) (Result, error) {
	if len(source.Candidates) == 0 || source.Fingerprint == "" {
		return Result{}, ErrNotFound
	}
	key := deviceID + "\x00" + source.Fingerprint
	if result, ok := c.cached(deviceID, source.Fingerprint); ok {
		return result, nil
	}

	c.mu.Lock()
	if entry, ok := c.negative[key]; ok && c.now().Before(entry.until) {
		c.mu.Unlock()
		return Result{}, entry.err
	}
	if active, ok := c.flights[key]; ok {
		c.mu.Unlock()
		select {
		case <-ctx.Done():
			return Result{}, ctx.Err()
		case <-active.done:
			return active.result, active.err
		}
	}
	active := &flight{done: make(chan struct{})}
	c.flights[key] = active
	c.mu.Unlock()

	result, err := c.fetchAndStore(ctx, deviceID, source)
	c.mu.Lock()
	active.result, active.err = result, err
	if errors.Is(err, ErrNotFound) {
		c.negative[key] = negativeEntry{err: err, until: c.now().Add(missingCacheTTL)}
	} else if errors.Is(err, ErrTransient) {
		c.negative[key] = negativeEntry{err: err, until: c.now().Add(transientCacheTTL)}
	} else if err == nil {
		delete(c.negative, key)
	}
	delete(c.flights, key)
	close(active.done)
	c.mu.Unlock()
	return result, err
}

func (c *Cache) cached(deviceID, fingerprint string) (Result, bool) {
	dir := c.versionDir(deviceID, fingerprint)
	for _, format := range []string{"png", "jpeg", "webp"} {
		path := filepath.Join(dir, "image."+format)
		data, err := os.ReadFile(path)
		if err != nil {
			continue
		}
		mime, _, err := validateImage(data)
		if err != nil {
			_ = os.Remove(path)
			continue
		}
		return Result{Path: path, ContentType: mime, ETag: contentHash(data)}, true
	}
	return Result{}, false
}

func (c *Cache) fetchAndStore(ctx context.Context, deviceID string, source Source) (Result, error) {
	transient := false
	for _, candidate := range source.Candidates {
		data, status, err := c.fetchCandidate(ctx, candidate)
		if err != nil {
			if errors.Is(err, ErrNotFound) {
				continue
			}
			transient = true
			continue
		}
		if status == http.StatusNotFound || status == http.StatusGone {
			continue
		}
		if status < 200 || status >= 300 {
			transient = true
			continue
		}
		mime, format, err := validateImage(data)
		if err != nil {
			continue
		}
		path, err := c.write(deviceID, source.Fingerprint, format, data)
		if err != nil {
			return Result{}, fmt.Errorf("cache device image: %w", err)
		}
		return Result{Path: path, ContentType: mime, ETag: contentHash(data)}, nil
	}
	if transient {
		return Result{}, ErrTransient
	}
	return Result{}, ErrNotFound
}

func (c *Cache) fetchCandidate(ctx context.Context, candidate Candidate) ([]byte, int, error) {
	if candidate.Inline {
		comma := strings.IndexByte(candidate.Value, ',')
		if comma < 0 {
			return nil, 0, ErrNotFound
		}
		decoded, err := base64.StdEncoding.DecodeString(candidate.Value[comma+1:])
		if err != nil || len(decoded) > maxImageBytes {
			return nil, 0, ErrNotFound
		}
		return decoded, http.StatusOK, nil
	}
	parsed, err := url.Parse(candidate.Value)
	if err != nil || validateRemoteURL(parsed) != nil {
		return nil, 0, ErrNotFound
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, parsed.String(), nil)
	if err != nil {
		return nil, 0, err
	}
	req.Header.Set("User-Agent", deviceImageAgent)
	req.Header.Set("Accept", "image/png,image/jpeg,image/webp")
	req.Header.Set("Accept-Encoding", "identity")
	resp, err := c.client.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer func() { _ = resp.Body.Close() }()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		_, _ = io.CopyN(io.Discard, resp.Body, 4096)
		return nil, resp.StatusCode, nil
	}
	if resp.Header.Get("Content-Encoding") != "" || resp.ContentLength > maxImageBytes {
		return nil, resp.StatusCode, ErrNotFound
	}
	data, err := io.ReadAll(io.LimitReader(resp.Body, maxImageBytes+1))
	if err != nil {
		return nil, resp.StatusCode, err
	}
	if len(data) > maxImageBytes {
		return nil, resp.StatusCode, ErrNotFound
	}
	return data, resp.StatusCode, nil
}

func (c *Cache) write(deviceID, fingerprint, format string, data []byte) (string, error) {
	dir := c.versionDir(deviceID, fingerprint)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}
	tmp, err := os.CreateTemp(dir, ".image-*")
	if err != nil {
		return "", err
	}
	tmpName := tmp.Name()
	cleanup := func() { _ = os.Remove(tmpName) }
	if _, err := tmp.Write(data); err != nil {
		_ = tmp.Close()
		cleanup()
		return "", err
	}
	if err := tmp.Sync(); err != nil {
		_ = tmp.Close()
		cleanup()
		return "", err
	}
	if err := tmp.Close(); err != nil {
		cleanup()
		return "", err
	}
	path := filepath.Join(dir, "image."+format)
	if err := os.Rename(tmpName, path); err != nil {
		cleanup()
		return "", err
	}
	deviceDir := filepath.Dir(dir)
	entries, _ := os.ReadDir(deviceDir)
	for _, entry := range entries {
		if entry.IsDir() && entry.Name() != filepath.Base(dir) {
			_ = os.RemoveAll(filepath.Join(deviceDir, entry.Name()))
		}
	}
	return path, nil
}

func (c *Cache) versionDir(deviceID, fingerprint string) string {
	return filepath.Join(c.dir, hashString(deviceID), hashString(fingerprint))
}

func validateImage(data []byte) (string, string, error) {
	if len(data) == 0 || len(data) > maxImageBytes {
		return "", "", ErrNotFound
	}
	config, format, err := image.DecodeConfig(bytes.NewReader(data))
	if err != nil || config.Width <= 0 || config.Height <= 0 || config.Width > maxImageDimension || config.Height > maxImageDimension {
		return "", "", ErrNotFound
	}
	switch format {
	case "png":
		return "image/png", format, nil
	case "jpeg":
		return "image/jpeg", format, nil
	case "webp":
		return "image/webp", format, nil
	default:
		return "", "", ErrNotFound
	}
}

func secureHTTPClient() *http.Client {
	dialer := &net.Dialer{Timeout: 4 * time.Second, KeepAlive: 30 * time.Second}
	transport := &http.Transport{
		Proxy: nil,
		DialContext: func(ctx context.Context, network, address string) (net.Conn, error) {
			host, port, err := net.SplitHostPort(address)
			if err != nil {
				return nil, err
			}
			addresses, err := net.DefaultResolver.LookupIPAddr(ctx, host)
			if err != nil {
				return nil, err
			}
			for _, address := range addresses {
				if publicIP(address.IP) {
					return dialer.DialContext(ctx, network, net.JoinHostPort(address.IP.String(), port))
				}
			}
			return nil, errors.New("image host has no public address")
		},
		DisableCompression:    true,
		ResponseHeaderTimeout: 5 * time.Second,
		TLSHandshakeTimeout:   5 * time.Second,
		IdleConnTimeout:       30 * time.Second,
	}
	client := &http.Client{Transport: transport, Timeout: 12 * time.Second}
	client.CheckRedirect = func(req *http.Request, via []*http.Request) error {
		if len(via) >= maxImageRedirects {
			return errors.New("too many image redirects")
		}
		return validateRemoteURL(req.URL)
	}
	return client
}

func validateRemoteURL(value *url.URL) error {
	if value == nil || value.Scheme != "https" || value.Hostname() == "" || value.User != nil {
		return errors.New("invalid image URL")
	}
	if ip := net.ParseIP(value.Hostname()); ip != nil && !publicIP(ip) {
		return errors.New("image URL is not public")
	}
	return nil
}

func publicIP(ip net.IP) bool {
	return ip != nil && ip.IsGlobalUnicast() && !ip.IsPrivate() && !ip.IsLoopback() && !ip.IsLinkLocalUnicast() && !ip.IsLinkLocalMulticast()
}

func contentHash(data []byte) string {
	return hashString(string(data))
}

func hashString(value string) string {
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}
