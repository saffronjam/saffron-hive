// Package oui resolves IEEE MAC assignments from locally cached registries.
package oui

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/saffronjam/saffron-hive/internal/logging"
)

const (
	refreshAge       = 7 * 24 * time.Hour
	maxRegistryBytes = 64 << 20
)

var logger = logging.Named("oui")

type source struct {
	name string
	url  string
	bits uint8
}

var registrySources = []source{
	{name: "oui", url: "https://standards-oui.ieee.org/oui/oui.csv", bits: 24},
	{name: "mam", url: "https://standards-oui.ieee.org/oui28/mam.csv", bits: 28},
	{name: "oui36", url: "https://standards-oui.ieee.org/oui36/oui36.csv", bits: 36},
}

type entry struct {
	prefix uint64
	bits   uint8
	vendor string
}

type validators struct {
	ETag         string `json:"etag,omitempty"`
	LastModified string `json:"lastModified,omitempty"`
}

// Resolver provides concurrency-safe, local IEEE address lookups.
type Resolver struct {
	mu      sync.RWMutex
	entries map[string][]entry
	lookup  []entry
	dir     string
	client  *http.Client
	sources []source
	now     func() time.Time
}

// New creates a resolver whose registry cache lives below dataDir.
func New(dataDir string) *Resolver {
	dialer := &net.Dialer{Timeout: 5 * time.Second, KeepAlive: 30 * time.Second}
	return &Resolver{
		entries: make(map[string][]entry),
		dir:     filepath.Join(dataDir, "oui"),
		client: &http.Client{
			Timeout: 30 * time.Second,
			Transport: &http.Transport{
				Proxy: http.ProxyFromEnvironment, DialContext: dialer.DialContext,
				TLSHandshakeTimeout: 5 * time.Second, ResponseHeaderTimeout: 10 * time.Second,
			},
		},
		sources: append([]source(nil), registrySources...),
		now:     time.Now,
	}
}

// Load reads every valid cached registry synchronously.
func (r *Resolver) Load() error {
	if err := os.MkdirAll(r.dir, 0o755); err != nil {
		return fmt.Errorf("create OUI cache directory: %w", err)
	}
	var errs []error
	for _, src := range r.sources {
		file, err := os.Open(r.csvPath(src))
		if errors.Is(err, os.ErrNotExist) {
			continue
		}
		if err != nil {
			errs = append(errs, fmt.Errorf("open %s cache: %w", src.name, err))
			continue
		}
		entries, parseErr := parseRegistry(file, src.bits)
		_ = file.Close()
		if parseErr != nil {
			errs = append(errs, fmt.Errorf("parse %s cache: %w", src.name, parseErr))
			continue
		}
		r.replace(src.name, entries)
	}
	return errors.Join(errs...)
}

// Run refreshes stale registries without blocking startup and rechecks daily.
func (r *Resolver) Run(ctx context.Context) {
	r.refreshStale(ctx)
	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			r.refreshStale(ctx)
		}
	}
}

// Lookup returns the vendor for the longest matching MA-S, MA-M, or MA-L
// prefix in the local cache.
func (r *Resolver) Lookup(address string) (string, bool) {
	value, ok := parseAddress(address)
	if !ok {
		return "", false
	}
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, candidate := range r.lookup {
		if value>>(64-candidate.bits) == candidate.prefix {
			return candidate.vendor, true
		}
	}
	return "", false
}

func (r *Resolver) refreshStale(ctx context.Context) {
	for _, src := range r.sources {
		if ctx.Err() != nil {
			return
		}
		info, err := os.Stat(r.csvPath(src))
		if err == nil && r.now().Sub(info.ModTime()) < refreshAge {
			continue
		}
		if err := r.refreshSource(ctx, src); err != nil {
			logger.Warn("refresh IEEE registry failed", "registry", src.name, "error", err)
		}
	}
}

func (r *Resolver) refreshSource(ctx context.Context, src source) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, src.url, nil)
	if err != nil {
		return err
	}
	stored := r.readValidators(src)
	if stored.ETag != "" {
		req.Header.Set("If-None-Match", stored.ETag)
	}
	if stored.LastModified != "" {
		req.Header.Set("If-Modified-Since", stored.LastModified)
	}
	response, err := r.client.Do(req)
	if err != nil {
		return err
	}
	defer func() { _ = response.Body.Close() }()
	if response.StatusCode == http.StatusNotModified {
		now := r.now()
		return os.Chtimes(r.csvPath(src), now, now)
	}
	if response.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected HTTP status %s", response.Status)
	}
	limited := io.LimitReader(response.Body, maxRegistryBytes+1)
	data, err := io.ReadAll(limited)
	if err != nil {
		return err
	}
	if len(data) > maxRegistryBytes {
		return fmt.Errorf("registry exceeds %d bytes", maxRegistryBytes)
	}
	entries, err := parseRegistry(strings.NewReader(string(data)), src.bits)
	if err != nil {
		return err
	}
	if err := atomicWrite(r.csvPath(src), data, 0o644); err != nil {
		return err
	}
	metadata, err := json.Marshal(validators{
		ETag: response.Header.Get("ETag"), LastModified: response.Header.Get("Last-Modified"),
	})
	if err == nil {
		_ = atomicWrite(r.validatorsPath(src), metadata, 0o644)
	}
	r.replace(src.name, entries)
	logger.Info("refreshed IEEE registry", "registry", src.name, "entries", len(entries))
	return nil
}

func (r *Resolver) replace(name string, entries []entry) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.entries[name] = entries
	lookup := make([]entry, 0)
	for _, set := range r.entries {
		lookup = append(lookup, set...)
	}
	sort.Slice(lookup, func(i, j int) bool {
		if lookup[i].bits == lookup[j].bits {
			return lookup[i].prefix < lookup[j].prefix
		}
		return lookup[i].bits > lookup[j].bits
	})
	r.lookup = lookup
}

func (r *Resolver) readValidators(src source) validators {
	b, err := os.ReadFile(r.validatorsPath(src))
	if err != nil {
		return validators{}
	}
	var value validators
	if json.Unmarshal(b, &value) != nil {
		return validators{}
	}
	return value
}

func (r *Resolver) csvPath(src source) string {
	return filepath.Join(r.dir, src.name+".csv")
}

func (r *Resolver) validatorsPath(src source) string {
	return filepath.Join(r.dir, src.name+".headers.json")
}

func parseRegistry(reader io.Reader, bits uint8) ([]entry, error) {
	rows, err := csv.NewReader(reader).ReadAll()
	if err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return nil, fmt.Errorf("registry is empty")
	}
	headings := make(map[string]int, len(rows[0]))
	for i, heading := range rows[0] {
		headings[strings.TrimSpace(heading)] = i
	}
	assignmentColumn, assignmentOK := headings["Assignment"]
	vendorColumn, vendorOK := headings["Organization Name"]
	if !assignmentOK || !vendorOK {
		return nil, fmt.Errorf("registry columns are missing")
	}
	result := make([]entry, 0, len(rows)-1)
	for _, row := range rows[1:] {
		if assignmentColumn >= len(row) || vendorColumn >= len(row) {
			continue
		}
		assignment := strings.NewReplacer("-", "", ":", "", " ", "").Replace(row[assignmentColumn])
		if len(assignment)*4 != int(bits) {
			continue
		}
		prefix, err := strconv.ParseUint(assignment, 16, 64)
		vendor := strings.TrimSpace(row[vendorColumn])
		if err != nil || vendor == "" {
			continue
		}
		result = append(result, entry{prefix: prefix, bits: bits, vendor: vendor})
	}
	if len(result) == 0 {
		return nil, fmt.Errorf("registry has no valid assignments")
	}
	return result, nil
}

func parseAddress(address string) (uint64, bool) {
	cleaned := strings.NewReplacer("0x", "", "0X", "", ":", "", "-", "", " ", "").Replace(strings.TrimSpace(address))
	if len(cleaned) == 0 || len(cleaned) > 16 {
		return 0, false
	}
	value, err := strconv.ParseUint(cleaned, 16, 64)
	if err != nil {
		return 0, false
	}
	if len(cleaned) <= 12 {
		value <<= 16
	}
	return value, true
}

func atomicWrite(path string, data []byte, mode os.FileMode) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	tmp, err := os.CreateTemp(filepath.Dir(path), ".oui-*")
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
	if err := tmp.Chmod(mode); err != nil {
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
