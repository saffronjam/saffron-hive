package local

import "fmt"

// localNonce is the client nonce used in the v3.4/v3.5 session-key negotiation.
// The device does not require randomness here; a fixed value matches the
// reference implementations.
var localNonce = []byte("0123456789abcdef")

// deriveSessionKey computes the v3.4 session key from the device local key and
// the two negotiation nonces: AES-ECB(localKey) over (localNonce XOR
// remoteNonce), single block, no padding.
func deriveSessionKey(localKey, lNonce, rNonce []byte) ([]byte, error) {
	if len(lNonce) != len(rNonce) {
		return nil, fmt.Errorf("nonce length mismatch: %d vs %d", len(lNonce), len(rNonce))
	}
	x := make([]byte, len(lNonce))
	for i := range x {
		x[i] = lNonce[i] ^ rNonce[i]
	}
	return aesECBEncryptRaw(localKey, x)
}
