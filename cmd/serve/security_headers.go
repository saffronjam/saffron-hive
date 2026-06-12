package serve

import (
	"crypto/sha256"
	"encoding/base64"
	"net/http"
	"net/url"
	"regexp"
	"strings"
)

// SecurityHeaders sets defence-in-depth HTTP response headers on every request
// served by the application. The values target a public deployment behind
// TLS-terminating nginx-ingress; localhost development is unaffected because
// browsers honour these headers identically.
//
// CSP is the load-bearing header: it pins script execution to same-origin and
// every inline script we ship (identified by sha256). The SvelteKit shell
// emits two inline blocks — the theme bootstrap and a per-build start script
// whose surrounding identifier changes every build — so both must be hashed
// dynamically at startup. An XSS would otherwise steal the JWT from
// localStorage; with CSP, injected scripts are denied execution.
func SecurityHeaders(inlineScriptHashes []string) func(http.Handler) http.Handler {
	scriptSrc := []string{"'self'"}
	for _, h := range inlineScriptHashes {
		if h == "" {
			continue
		}
		scriptSrc = append(scriptSrc, "'sha256-"+h+"'")
	}
	csp := strings.Join([]string{
		"default-src 'self'",
		"script-src " + strings.Join(scriptSrc, " "),
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data: blob:",
		"connect-src 'self' ws: wss:",
		"font-src 'self' data:",
		"frame-ancestors 'none'",
		"base-uri 'self'",
		"form-action 'self'",
	}, "; ")

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			h := w.Header()
			h.Set("Content-Security-Policy", csp)
			h.Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
			h.Set("X-Content-Type-Options", "nosniff")
			h.Set("Referrer-Policy", "strict-origin-when-cross-origin")
			h.Set("Permissions-Policy", "geolocation=(), camera=(), microphone=()")
			next.ServeHTTP(w, r)
		})
	}
}

// computeInlineScriptHashes scans the embedded SPA shell for inline script
// blocks and returns the sha256 (base64) hash of every non-empty one in
// source order. The strict CSP must list every inline script we ship; the
// SvelteKit build emits more than one (theme bootstrap + kit.start), and the
// kit.start body changes per build, so hashing must happen at startup
// against the bytes we are actually about to serve.
func computeInlineScriptHashes(indexHTML []byte) []string {
	re := regexp.MustCompile(`(?s)<script[^>]*>(.*?)</script>`)
	matches := re.FindAllSubmatch(indexHTML, -1)
	hashes := make([]string, 0, len(matches))
	for _, m := range matches {
		if len(m) < 2 {
			continue
		}
		body := m[1]
		if len(strings.TrimSpace(string(body))) == 0 {
			continue
		}
		sum := sha256.Sum256(body)
		hashes = append(hashes, base64.StdEncoding.EncodeToString(sum[:]))
	}
	return hashes
}

// originChecker returns a gorilla/websocket-compatible Origin check.
func originChecker(allowed []string) func(*http.Request) bool {
	set := make(map[string]struct{}, len(allowed))
	for _, o := range allowed {
		set[strings.TrimSpace(o)] = struct{}{}
	}
	return func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		if origin == "" {
			return false
		}
		if sameOrigin(r, origin) {
			return true
		}
		_, ok := set[origin]
		return ok
	}
}

func sameOrigin(r *http.Request, origin string) bool {
	u, err := url.Parse(origin)
	if err != nil {
		return false
	}
	if u.Scheme != "http" && u.Scheme != "https" {
		return false
	}
	return strings.EqualFold(u.Host, r.Host)
}
