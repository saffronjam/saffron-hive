package local

import (
	"bytes"
	"testing"
)

func TestAESECBRoundTrip(t *testing.T) {
	key := []byte("0123456789abcdef")
	for _, pt := range [][]byte{
		[]byte("a"),
		[]byte("exactly-16-bytes"),
		[]byte(`{"dps":{"110":true,"5":"low"}}`),
		{},
	} {
		ct, err := aesECBEncrypt(key, pt)
		if err != nil {
			t.Fatalf("encrypt: %v", err)
		}
		if len(ct)%16 != 0 {
			t.Fatalf("ciphertext not block-aligned: %d", len(ct))
		}
		got, err := aesECBDecrypt(key, ct)
		if err != nil {
			t.Fatalf("decrypt: %v", err)
		}
		if !bytes.Equal(got, pt) {
			t.Fatalf("round trip = %q, want %q", got, pt)
		}
	}
}

func TestAESECBBadLength(t *testing.T) {
	key := []byte("0123456789abcdef")
	if _, err := aesECBDecrypt(key, []byte("not-block-aligned")); err == nil {
		t.Fatal("expected error on non-block-aligned ciphertext")
	}
}
