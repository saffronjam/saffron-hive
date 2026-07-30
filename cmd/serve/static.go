package serve

import (
	"bytes"
	"compress/gzip"
	"crypto/sha256"
	"encoding/hex"
	"io/fs"
	"log/slog"
	"mime"
	"net/http"
	"path"
	"strconv"
	"strings"
)

const (
	shellFile        = "index.html"
	serviceWorker    = "service-worker.js"
	webManifest      = "manifest.webmanifest"
	immutablePrefix  = "_app/immutable/"
	cacheImmutable   = "public, max-age=31536000, immutable"
	cacheRevalidate  = "no-cache"
	cacheConservable = "public, max-age=86400"
)

// staticAsset is a single frontend file with its response metadata resolved
// once at startup. Both encodings are held in memory so serving costs nothing
// beyond a map lookup and a write.
type staticAsset struct {
	contentType  string
	cacheControl string
	etag         string
	gzipEtag     string
	body         []byte
	gzipBody     []byte
}

type staticHandler struct {
	assets map[string]*staticAsset
	shell  *staticAsset
}

// newStaticHandler reads every embedded frontend file, precomputing its content
// type, cache policy, entity tag and gzip encoding.
func newStaticHandler(fsys fs.FS) (http.Handler, error) {
	assets := make(map[string]*staticAsset)

	err := fs.WalkDir(fsys, ".", func(name string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		body, err := fs.ReadFile(fsys, name)
		if err != nil {
			return err
		}
		assets[name] = newStaticAsset(name, body)
		return nil
	})
	if err != nil {
		return nil, err
	}

	var gzipped, gzipBytes int
	for _, a := range assets {
		if a.gzipBody != nil {
			gzipped++
			gzipBytes += len(a.gzipBody)
		}
	}
	serveLogger.Info("frontend assets loaded",
		slog.Int("files", len(assets)),
		slog.Int("precompressed", gzipped),
		slog.Int("gzip_bytes", gzipBytes),
	)

	return &staticHandler{assets: assets, shell: assets[shellFile]}, nil
}

func newStaticAsset(name string, body []byte) *staticAsset {
	sum := sha256.Sum256(body)
	tag := hex.EncodeToString(sum[:16])

	a := &staticAsset{
		contentType:  contentTypeFor(name, body),
		cacheControl: cacheControlFor(name),
		etag:         `"` + tag + `"`,
		gzipEtag:     `"` + tag + `-gz"`,
		body:         body,
	}
	if compressible(a.contentType) {
		if gz, err := gzipBytes(body); err == nil && len(gz) < len(body) {
			a.gzipBody = gz
		}
	}
	return a
}

// cacheControlFor keys the policy off the build layout: everything Vite emits
// under _app/immutable/ is content-hashed, so its URL can never denote
// different bytes. The shell, the service worker and the manifest gate every
// update, so they revalidate on each load and rely on the entity tag to keep
// the response a 304.
func cacheControlFor(name string) string {
	switch {
	case strings.HasPrefix(name, immutablePrefix):
		return cacheImmutable
	case name == shellFile, name == serviceWorker, name == webManifest:
		return cacheRevalidate
	default:
		return cacheConservable
	}
}

// contentTypeFor resolves the media type by extension, falling back to content
// sniffing. The explicit entries cover types absent from Go's built-in table,
// which would otherwise depend on a system mime.types file that the deployment
// image does not carry.
func contentTypeFor(name string, body []byte) string {
	switch path.Ext(name) {
	case ".webmanifest":
		return "application/manifest+json"
	case ".ico":
		return "image/x-icon"
	case ".txt":
		return "text/plain; charset=utf-8"
	case ".map":
		return "application/json"
	}
	if ct := mime.TypeByExtension(path.Ext(name)); ct != "" {
		return ct
	}
	return http.DetectContentType(body)
}

func compressible(contentType string) bool {
	base := contentType
	if i := strings.IndexByte(base, ';'); i >= 0 {
		base = strings.TrimSpace(base[:i])
	}
	if strings.HasPrefix(base, "text/") {
		return true
	}
	switch base {
	case "application/javascript", "application/json", "application/manifest+json",
		"application/xml", "image/svg+xml":
		return true
	}
	return false
}

func gzipBytes(body []byte) ([]byte, error) {
	var buf bytes.Buffer
	zw, err := gzip.NewWriterLevel(&buf, gzip.BestCompression)
	if err != nil {
		return nil, err
	}
	if _, err := zw.Write(body); err != nil {
		return nil, err
	}
	if err := zw.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// ServeHTTP serves an embedded frontend asset, falling back to the SPA shell
// for any path that is not a file — required because SvelteKit runs with
// client-side routing (ssr=false), so URLs like /scenes must return index.html
// and let the app take over from there.
func (h *staticHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		w.Header().Set("Allow", "GET, HEAD")
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	name := strings.TrimPrefix(path.Clean(r.URL.Path), "/")
	asset, ok := h.assets[name]
	if !ok {
		asset = h.shell
	}
	if asset == nil {
		http.NotFound(w, r)
		return
	}

	body, etag := asset.body, asset.etag
	useGzip := asset.gzipBody != nil && acceptsGzip(r)
	if useGzip {
		body, etag = asset.gzipBody, asset.gzipEtag
	}

	head := w.Header()
	head.Set("Content-Type", asset.contentType)
	head.Set("Cache-Control", asset.cacheControl)
	head.Set("ETag", etag)
	head.Set("Vary", "Accept-Encoding")
	if useGzip {
		head.Set("Content-Encoding", "gzip")
	}

	if etagMatches(r.Header.Get("If-None-Match"), etag) {
		w.WriteHeader(http.StatusNotModified)
		return
	}

	head.Set("Content-Length", strconv.Itoa(len(body)))
	if r.Method == http.MethodHead {
		w.WriteHeader(http.StatusOK)
		return
	}
	if _, err := w.Write(body); err != nil {
		serveLogger.Debug("static asset write failed", slog.String("path", name), slog.Any("err", err))
	}
}

func acceptsGzip(r *http.Request) bool {
	for enc := range strings.SplitSeq(r.Header.Get("Accept-Encoding"), ",") {
		if name, _, _ := strings.Cut(enc, ";"); strings.TrimSpace(name) == "gzip" {
			return true
		}
	}
	return false
}

func etagMatches(header, etag string) bool {
	if header == "" {
		return false
	}
	for candidate := range strings.SplitSeq(header, ",") {
		candidate = strings.TrimSpace(candidate)
		if candidate == "*" || candidate == etag {
			return true
		}
	}
	return false
}
