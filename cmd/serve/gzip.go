package serve

import (
	"net/http"

	"github.com/klauspost/compress/gzhttp"

	"github.com/saffronjam/saffron-hive/internal/auth"
)

// MinGzipSize is the smallest response worth compressing. Below roughly a
// packet's worth of payload the header and CPU cost outweigh the saving.
const MinGzipSize = 1024

// GzipGraphQL compresses GraphQL responses for clients that accept it.
//
// WebSocket handshakes bypass the compressor entirely: gzhttp wraps the
// ResponseWriter, and the graphql-ws transport needs the original writer's
// http.Hijacker to take over the connection.
//
// Static assets are not routed through here — they are compressed once at
// startup and served with their own Content-Encoding.
func GzipGraphQL(next http.Handler) http.Handler {
	wrapper, err := gzhttp.NewWrapper(
		gzhttp.MinSize(MinGzipSize),
		gzhttp.ContentTypes([]string{"application/json", "application/graphql-response+json"}),
	)
	if err != nil {
		// The options above are constants, so this cannot fail at runtime;
		// falling through uncompressed is still correct if it ever does.
		return next
	}
	compressed := wrapper(next)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if auth.IsWebSocketUpgrade(r) {
			next.ServeHTTP(w, r)
			return
		}
		compressed.ServeHTTP(w, r)
	})
}
