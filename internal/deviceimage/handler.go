package deviceimage

import (
	"context"
	"errors"
	"net/http"
	"os"
	"strings"

	"github.com/saffronjam/saffron-hive/internal/device"
)

// Store is the data required to resolve a device image request.
type Store interface {
	DeviceImageSources(ctx context.Context, id device.DeviceID) ([]string, error)
}

// NewHandler serves authenticated, validated images from the cache.
func NewHandler(cache *Cache, store Store) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		id := strings.TrimPrefix(r.URL.Path, "/api/device-images/")
		if id == "" || strings.ContainsAny(id, "/\\") || strings.Contains(id, "..") {
			http.NotFound(w, r)
			return
		}
		sources, err := store.DeviceImageSources(r.Context(), device.DeviceID(id))
		if err != nil {
			http.NotFound(w, r)
			return
		}
		result, err := cache.Get(r.Context(), id, ResolveSource(sources))
		if errors.Is(err, ErrNotFound) {
			http.NotFound(w, r)
			return
		}
		if err != nil {
			http.Error(w, "device image temporarily unavailable", http.StatusServiceUnavailable)
			return
		}
		etag := `"` + result.ETag + `"`
		w.Header().Set("Content-Type", result.ContentType)
		w.Header().Set("ETag", etag)
		w.Header().Set("Cache-Control", "private, max-age=86400")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		if r.Header.Get("If-None-Match") == etag {
			w.WriteHeader(http.StatusNotModified)
			return
		}
		file, err := os.Open(result.Path)
		if err != nil {
			http.Error(w, "device image temporarily unavailable", http.StatusServiceUnavailable)
			return
		}
		defer func() { _ = file.Close() }()
		info, err := file.Stat()
		if err != nil {
			http.Error(w, "device image temporarily unavailable", http.StatusServiceUnavailable)
			return
		}
		http.ServeContent(w, r, "device-image", info.ModTime(), file)
	})
}
