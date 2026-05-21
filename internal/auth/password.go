// Package auth provides authentication primitives: password hashing, JWT
// signing/parsing, the request context user injection, and the HTTP middleware
// that enforces authentication for the GraphQL endpoint.
package auth

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

// bcryptCost is the bcrypt work factor used for password hashes.
const bcryptCost = 12

// DummyBcryptHash is a precomputed bcrypt hash used to equalise login timing
// on the no-such-user branch. The login resolver runs CompareHashAndPassword
// against this hash whenever the supplied username has no row, so the response
// takes the same ~150 ms as the real-user path. Without it, attackers learn
// which usernames exist by timing the difference between the short-circuited
// no-row return and the full bcrypt verify.
//
// Initialised at package load with a random plaintext at bcryptCost; the
// actual contents are irrelevant — only the work-factor budget matters.
var DummyBcryptHash string

func init() {
	var buf [32]byte
	if _, err := rand.Read(buf[:]); err != nil {
		panic("auth: rand.Read for dummy bcrypt seed: " + err.Error())
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(hex.EncodeToString(buf[:])), bcryptCost)
	if err != nil {
		panic("auth: bcrypt for dummy hash: " + err.Error())
	}
	DummyBcryptHash = string(hash)
}

// HashPassword produces a bcrypt hash of the given plaintext password.
func HashPassword(plain string) (string, error) {
	h, err := bcrypt.GenerateFromPassword([]byte(plain), bcryptCost)
	if err != nil {
		return "", fmt.Errorf("hash password: %w", err)
	}
	return string(h), nil
}

// VerifyPassword checks that plain matches the stored bcrypt hash.
// Returns nil on match, a non-nil error otherwise.
func VerifyPassword(hash, plain string) error {
	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain)); err != nil {
		return fmt.Errorf("verify password: %w", err)
	}
	return nil
}
