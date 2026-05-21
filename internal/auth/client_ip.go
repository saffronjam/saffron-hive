package auth

import (
	"context"
	"net"
	"net/http"
	"strings"
)

// ClientIPMiddleware stashes the request's client IP on its context so
// resolvers can read it via ClientIPFromContext. When trustProxy is true the
// middleware reads X-Real-IP first, then the leftmost X-Forwarded-For entry
// (the conventional position of the original client in chains terminated by a
// reverse proxy). Otherwise it falls back to r.RemoteAddr unconditionally —
// the safer default for direct-internet deployments where the headers can be
// spoofed by the client.
func ClientIPMiddleware(trustProxy bool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := resolveClientIP(r, trustProxy)
			next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), ipCtxKey{}, ip)))
		})
	}
}

// ClientIPFromContext returns the client IP attached by ClientIPMiddleware.
// Returns an empty string when no middleware ran (which should never happen on
// the production handler chain but keeps callers safe in tests).
func ClientIPFromContext(ctx context.Context) string {
	ip, _ := ctx.Value(ipCtxKey{}).(string)
	return ip
}

type ipCtxKey struct{}

func resolveClientIP(r *http.Request, trustProxy bool) string {
	if trustProxy {
		if v := strings.TrimSpace(r.Header.Get("X-Real-IP")); v != "" {
			return v
		}
		if v := r.Header.Get("X-Forwarded-For"); v != "" {
			if idx := strings.Index(v, ","); idx >= 0 {
				v = v[:idx]
			}
			if v = strings.TrimSpace(v); v != "" {
				return v
			}
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
