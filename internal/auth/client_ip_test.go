package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestClientIPMiddlewareTrustsProxyHeaders(t *testing.T) {
	cases := []struct {
		name   string
		realIP string
		fwd    string
		remote string
		want   string
	}{
		{name: "x-real-ip wins", realIP: "203.0.113.5", fwd: "10.0.0.1", remote: "127.0.0.1:443", want: "203.0.113.5"},
		{name: "leftmost x-forwarded-for", fwd: "198.51.100.42, 10.0.0.1, 10.0.0.2", remote: "127.0.0.1:443", want: "198.51.100.42"},
		{name: "fall back to remote", remote: "192.0.2.1:1234", want: "192.0.2.1"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			var got string
			next := http.HandlerFunc(func(_ http.ResponseWriter, r *http.Request) {
				got = ClientIPFromContext(r.Context())
			})
			req := httptest.NewRequest(http.MethodGet, "/", nil)
			req.RemoteAddr = tc.remote
			if tc.realIP != "" {
				req.Header.Set("X-Real-IP", tc.realIP)
			}
			if tc.fwd != "" {
				req.Header.Set("X-Forwarded-For", tc.fwd)
			}
			ClientIPMiddleware(true)(next).ServeHTTP(httptest.NewRecorder(), req)
			if got != tc.want {
				t.Errorf("client IP = %q, want %q", got, tc.want)
			}
		})
	}
}

func TestClientIPMiddlewareIgnoresHeadersWhenUntrusted(t *testing.T) {
	var got string
	next := http.HandlerFunc(func(_ http.ResponseWriter, r *http.Request) {
		got = ClientIPFromContext(r.Context())
	})
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "192.0.2.1:1234"
	req.Header.Set("X-Real-IP", "203.0.113.5")
	req.Header.Set("X-Forwarded-For", "198.51.100.42")
	ClientIPMiddleware(false)(next).ServeHTTP(httptest.NewRecorder(), req)
	if got != "192.0.2.1" {
		t.Errorf("client IP = %q, want %q (must ignore spoofed headers)", got, "192.0.2.1")
	}
}
