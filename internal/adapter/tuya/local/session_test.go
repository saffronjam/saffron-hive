package local

import (
	"encoding/hex"
	"testing"
)

// TestDeriveSessionKey is a known-answer test: the expected session key was
// computed independently (python `cryptography`, AES-128-ECB, no padding) over
// (localNonce XOR remoteNonce) with the given key. It guards the v3.4
// session-key derivation against regressions.
func TestDeriveSessionKey(t *testing.T) {
	key := []byte("0123456789abcdef")
	lNonce := []byte("0123456789abcdef")
	rNonce := []byte("abcdef0123456789")
	want := "465ad66115cf0cb58482681d57f0133b"

	got, err := deriveSessionKey(key, lNonce, rNonce)
	if err != nil {
		t.Fatalf("derive: %v", err)
	}
	if hex.EncodeToString(got) != want {
		t.Fatalf("session key = %x, want %s", got, want)
	}
}
