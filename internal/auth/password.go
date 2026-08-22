// Package auth provides authentication primitives: password hashing, JWT
// signing/parsing, the request context user injection, and the HTTP middleware
// that enforces authentication for the GraphQL endpoint.
package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"golang.org/x/crypto/argon2"
	"golang.org/x/crypto/bcrypt"
)

const (
	argon2Memory      uint32 = 19 * 1024
	argon2Iterations  uint32 = 2
	argon2Parallelism uint8  = 1
	argon2SaltLength         = 16
	argon2KeyLength   uint32 = 32

	minArgon2Memory      uint32 = 8 * 1024
	maxArgon2Memory      uint32 = 64 * 1024
	minArgon2Iterations  uint32 = 1
	maxArgon2Iterations  uint32 = 10
	minArgon2Parallelism uint8  = 1
	maxArgon2Parallelism uint8  = 8
	minArgon2SaltLength         = 16
	maxArgon2SaltLength         = 64
	minArgon2KeyLength          = 16
	maxArgon2KeyLength          = 64

	maxEncodedPasswordHashLength = 512
)

var errPasswordVerification = errors.New("password verification failed")

type argon2Parameters struct {
	memory      uint32
	iterations  uint32
	parallelism uint8
	salt        []byte
	key         []byte
}

// DummyPasswordHash spends the same Argon2id work as a real credential when a
// login names a user that does not exist.
var DummyPasswordHash string

func init() {
	var seed [32]byte
	if _, err := rand.Read(seed[:]); err != nil {
		panic("auth: generate dummy password seed: " + err.Error())
	}
	hash, err := HashPassword(string(seed[:]))
	if err != nil {
		panic("auth: generate dummy password hash: " + err.Error())
	}
	DummyPasswordHash = hash
}

// HashPassword produces an Argon2id PHC string for the given password.
func HashPassword(plain string) (string, error) {
	salt := make([]byte, argon2SaltLength)
	if _, err := rand.Read(salt); err != nil {
		return "", fmt.Errorf("hash password: generate salt: %w", err)
	}
	key := argon2.IDKey(
		[]byte(plain),
		salt,
		argon2Iterations,
		argon2Memory,
		argon2Parallelism,
		argon2KeyLength,
	)
	return encodeArgon2id(argon2Parameters{
		memory:      argon2Memory,
		iterations:  argon2Iterations,
		parallelism: argon2Parallelism,
		salt:        salt,
		key:         key,
	}), nil
}

// VerifyPassword checks a password against a supported encoded hash. All
// mismatch and malformed-hash paths return the same error.
func VerifyPassword(encoded, plain string) error {
	switch PasswordHashAlgorithm(encoded) {
	case "argon2id":
		params, err := parseArgon2id(encoded)
		if err != nil {
			return errPasswordVerification
		}
		actual := argon2.IDKey(
			[]byte(plain),
			params.salt,
			params.iterations,
			params.memory,
			params.parallelism,
			uint32(len(params.key)),
		)
		if subtle.ConstantTimeCompare(actual, params.key) != 1 {
			return errPasswordVerification
		}
		return nil
	case "bcrypt":
		if err := bcrypt.CompareHashAndPassword([]byte(encoded), []byte(plain)); err != nil {
			return errPasswordVerification
		}
		return nil
	default:
		return errPasswordVerification
	}
}

// PasswordNeedsRehash reports whether a verified hash should be rewritten with
// Hive's Argon2id parameters.
func PasswordNeedsRehash(encoded string) bool {
	switch PasswordHashAlgorithm(encoded) {
	case "bcrypt":
		return true
	case "argon2id":
		params, err := parseArgon2id(encoded)
		if err != nil {
			return false
		}
		return params.memory != argon2Memory ||
			params.iterations != argon2Iterations ||
			params.parallelism != argon2Parallelism ||
			len(params.salt) != argon2SaltLength ||
			len(params.key) != int(argon2KeyLength)
	default:
		return false
	}
}

// PasswordHashAlgorithm identifies the supported encoding family without
// validating its contents.
func PasswordHashAlgorithm(encoded string) string {
	switch {
	case strings.HasPrefix(encoded, "$argon2id$"):
		return "argon2id"
	case strings.HasPrefix(encoded, "$2a$"),
		strings.HasPrefix(encoded, "$2b$"),
		strings.HasPrefix(encoded, "$2y$"):
		return "bcrypt"
	default:
		return "unknown"
	}
}

func encodeArgon2id(params argon2Parameters) string {
	return fmt.Sprintf(
		"$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
		argon2.Version,
		params.memory,
		params.iterations,
		params.parallelism,
		base64.RawStdEncoding.EncodeToString(params.salt),
		base64.RawStdEncoding.EncodeToString(params.key),
	)
}

func parseArgon2id(encoded string) (argon2Parameters, error) {
	if len(encoded) == 0 || len(encoded) > maxEncodedPasswordHashLength {
		return argon2Parameters{}, errPasswordVerification
	}
	parts := strings.Split(encoded, "$")
	if len(parts) != 6 || parts[0] != "" || parts[1] != "argon2id" || parts[2] != "v=19" {
		return argon2Parameters{}, errPasswordVerification
	}

	parameterParts := strings.Split(parts[3], ",")
	if len(parameterParts) != 3 ||
		!strings.HasPrefix(parameterParts[0], "m=") ||
		!strings.HasPrefix(parameterParts[1], "t=") ||
		!strings.HasPrefix(parameterParts[2], "p=") {
		return argon2Parameters{}, errPasswordVerification
	}
	memory, err := parseUint32(parameterParts[0][2:])
	if err != nil || memory < minArgon2Memory || memory > maxArgon2Memory {
		return argon2Parameters{}, errPasswordVerification
	}
	iterations, err := parseUint32(parameterParts[1][2:])
	if err != nil || iterations < minArgon2Iterations || iterations > maxArgon2Iterations {
		return argon2Parameters{}, errPasswordVerification
	}
	parallelism64, err := strconv.ParseUint(parameterParts[2][2:], 10, 8)
	if err != nil {
		return argon2Parameters{}, errPasswordVerification
	}
	parallelism := uint8(parallelism64)
	if parallelism < minArgon2Parallelism || parallelism > maxArgon2Parallelism {
		return argon2Parameters{}, errPasswordVerification
	}

	salt, err := base64.RawStdEncoding.Strict().DecodeString(parts[4])
	if err != nil || len(salt) < minArgon2SaltLength || len(salt) > maxArgon2SaltLength {
		return argon2Parameters{}, errPasswordVerification
	}
	key, err := base64.RawStdEncoding.Strict().DecodeString(parts[5])
	if err != nil || len(key) < minArgon2KeyLength || len(key) > maxArgon2KeyLength {
		return argon2Parameters{}, errPasswordVerification
	}

	return argon2Parameters{
		memory:      memory,
		iterations:  iterations,
		parallelism: parallelism,
		salt:        salt,
		key:         key,
	}, nil
}

func parseUint32(value string) (uint32, error) {
	parsed, err := strconv.ParseUint(value, 10, 32)
	return uint32(parsed), err
}
