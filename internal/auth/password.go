// Package auth provides authentication primitives: password hashing, JWT
// signing/parsing, the request context user injection, and the HTTP middleware
// that enforces authentication for the GraphQL endpoint.
package auth

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

// bcryptCost is the bcrypt work factor used for password hashes.
const bcryptCost = 12

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
