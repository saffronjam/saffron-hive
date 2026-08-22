package auth

import (
	"encoding/base64"
	"strings"
	"testing"

	"golang.org/x/crypto/argon2"
	"golang.org/x/crypto/bcrypt"
)

func TestHashPasswordProducesRandomArgon2idHashes(t *testing.T) {
	first, err := HashPassword("hunter2")
	if err != nil {
		t.Fatalf("HashPassword(first): %v", err)
	}
	second, err := HashPassword("hunter2")
	if err != nil {
		t.Fatalf("HashPassword(second): %v", err)
	}
	if first == "hunter2" || strings.Contains(first, "hunter2") {
		t.Fatal("password hash contains plaintext")
	}
	if first == second {
		t.Fatal("two password hashes reused a salt")
	}
	const prefix = "$argon2id$v=19$m=19456,t=2,p=1$"
	if !strings.HasPrefix(first, prefix) || !strings.HasPrefix(second, prefix) {
		t.Fatalf("hashes do not use Hive Argon2id parameters: %q / %q", first, second)
	}
	if PasswordHashAlgorithm(first) != "argon2id" {
		t.Fatalf("PasswordHashAlgorithm(%q) did not identify Argon2id", first)
	}
	if PasswordNeedsRehash(first) {
		t.Fatal("fresh Argon2id hash should not need rehash")
	}
}

func TestVerifyPasswordArgon2id(t *testing.T) {
	hash, err := HashPassword("hunter2")
	if err != nil {
		t.Fatalf("HashPassword: %v", err)
	}
	if err := VerifyPassword(hash, "hunter2"); err != nil {
		t.Fatalf("VerifyPassword(correct): %v", err)
	}
	wrongErr := VerifyPassword(hash, "wrong")
	if wrongErr != errPasswordVerification {
		t.Fatalf("VerifyPassword(wrong) = %v, want common verification error", wrongErr)
	}
}

func TestVerifyPasswordAcceptsBoundedArgon2idParameters(t *testing.T) {
	hash := testArgon2idHash(t, "password", argon2Parameters{
		memory:      minArgon2Memory,
		iterations:  minArgon2Iterations,
		parallelism: 2,
		salt:        []byte("0123456789abcdef"),
		key:         make([]byte, 24),
	})
	if err := VerifyPassword(hash, "password"); err != nil {
		t.Fatalf("VerifyPassword: %v", err)
	}
	if !PasswordNeedsRehash(hash) {
		t.Fatal("non-current Argon2id parameters should need rehash")
	}
}

func TestVerifyPasswordRejectsMalformedArgon2id(t *testing.T) {
	validSalt := base64.RawStdEncoding.EncodeToString([]byte("0123456789abcdef"))
	validKey := base64.RawStdEncoding.EncodeToString(make([]byte, 32))
	cases := map[string]string{
		"empty":              "",
		"wrong algorithm":    "$argon2i$v=19$m=19456,t=2,p=1$" + validSalt + "$" + validKey,
		"wrong version":      "$argon2id$v=18$m=19456,t=2,p=1$" + validSalt + "$" + validKey,
		"missing field":      "$argon2id$v=19$m=19456,t=2,p=1$" + validSalt,
		"extra field":        "$argon2id$v=19$m=19456,t=2,p=1$" + validSalt + "$" + validKey + "$extra",
		"parameter order":    "$argon2id$v=19$t=2,m=19456,p=1$" + validSalt + "$" + validKey,
		"invalid parameter":  "$argon2id$v=19$m=x,t=2,p=1$" + validSalt + "$" + validKey,
		"invalid salt":       "$argon2id$v=19$m=19456,t=2,p=1$%%%$" + validKey,
		"invalid key":        "$argon2id$v=19$m=19456,t=2,p=1$" + validSalt + "$%%%",
		"padded base64":      "$argon2id$v=19$m=19456,t=2,p=1$" + validSalt + "==$" + validKey,
		"oversized encoding": strings.Repeat("x", maxEncodedPasswordHashLength+1),
	}
	for name, encoded := range cases {
		t.Run(name, func(t *testing.T) {
			if err := VerifyPassword(encoded, "password"); err != errPasswordVerification {
				t.Fatalf("VerifyPassword = %v, want common verification error", err)
			}
			if PasswordNeedsRehash(encoded) {
				t.Fatal("malformed hash must not be classified as rehashable")
			}
		})
	}
}

func TestVerifyPasswordRejectsArgon2idParameterBounds(t *testing.T) {
	validSalt := []byte("0123456789abcdef")
	validKey := make([]byte, 32)
	cases := map[string]argon2Parameters{
		"memory below":      {memory: minArgon2Memory - 1, iterations: 2, parallelism: 1, salt: validSalt, key: validKey},
		"memory above":      {memory: maxArgon2Memory + 1, iterations: 2, parallelism: 1, salt: validSalt, key: validKey},
		"iterations below":  {memory: argon2Memory, iterations: 0, parallelism: 1, salt: validSalt, key: validKey},
		"iterations above":  {memory: argon2Memory, iterations: maxArgon2Iterations + 1, parallelism: 1, salt: validSalt, key: validKey},
		"parallelism below": {memory: argon2Memory, iterations: 2, parallelism: 0, salt: validSalt, key: validKey},
		"parallelism above": {memory: argon2Memory, iterations: 2, parallelism: maxArgon2Parallelism + 1, salt: validSalt, key: validKey},
		"salt below":        {memory: argon2Memory, iterations: 2, parallelism: 1, salt: make([]byte, minArgon2SaltLength-1), key: validKey},
		"salt above":        {memory: argon2Memory, iterations: 2, parallelism: 1, salt: make([]byte, maxArgon2SaltLength+1), key: validKey},
		"derived key below": {memory: argon2Memory, iterations: 2, parallelism: 1, salt: validSalt, key: make([]byte, minArgon2KeyLength-1)},
		"derived key above": {memory: argon2Memory, iterations: 2, parallelism: 1, salt: validSalt, key: make([]byte, maxArgon2KeyLength+1)},
	}
	for name, params := range cases {
		t.Run(name, func(t *testing.T) {
			encoded := encodeArgon2id(params)
			if err := VerifyPassword(encoded, "password"); err != errPasswordVerification {
				t.Fatalf("VerifyPassword = %v, want common verification error", err)
			}
		})
	}
}

func TestVerifyPasswordBcryptCompatibility(t *testing.T) {
	generated, err := bcrypt.GenerateFromPassword([]byte("password"), 12)
	if err != nil {
		t.Fatalf("GenerateFromPassword: %v", err)
	}
	for _, prefix := range []string{"$2a$", "$2b$", "$2y$"} {
		hash := prefix + string(generated[4:])
		t.Run(prefix, func(t *testing.T) {
			if PasswordHashAlgorithm(hash) != "bcrypt" {
				t.Fatalf("PasswordHashAlgorithm(%q) did not identify bcrypt", hash)
			}
			if err := VerifyPassword(hash, "password"); err != nil {
				t.Fatalf("VerifyPassword(correct): %v", err)
			}
			if err := VerifyPassword(hash, "wrong"); err != errPasswordVerification {
				t.Fatalf("VerifyPassword(wrong) = %v, want common verification error", err)
			}
			if !PasswordNeedsRehash(hash) {
				t.Fatal("bcrypt hash should need rehash")
			}
		})
	}
}

func TestVerifyPasswordRejectsUnknownAlgorithm(t *testing.T) {
	if got := PasswordHashAlgorithm("pbkdf2:hash"); got != "unknown" {
		t.Fatalf("PasswordHashAlgorithm = %q, want unknown", got)
	}
	if err := VerifyPassword("pbkdf2:hash", "password"); err != errPasswordVerification {
		t.Fatalf("VerifyPassword = %v, want common verification error", err)
	}
	if PasswordNeedsRehash("pbkdf2:hash") {
		t.Fatal("unknown algorithm must not be classified as rehashable")
	}
}

func TestDummyPasswordHashUsesArgon2id(t *testing.T) {
	if PasswordHashAlgorithm(DummyPasswordHash) != "argon2id" {
		t.Fatalf("dummy hash algorithm = %q", PasswordHashAlgorithm(DummyPasswordHash))
	}
	if err := VerifyPassword(DummyPasswordHash, "not-the-random-seed"); err != errPasswordVerification {
		t.Fatalf("VerifyPassword(dummy) = %v, want common verification error", err)
	}
}

func BenchmarkHashPassword(b *testing.B) {
	b.ReportAllocs()
	for b.Loop() {
		if _, err := HashPassword("benchmark-password"); err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkVerifyPassword(b *testing.B) {
	hash, err := HashPassword("benchmark-password")
	if err != nil {
		b.Fatal(err)
	}
	b.ReportAllocs()
	b.ResetTimer()
	for b.Loop() {
		if err := VerifyPassword(hash, "benchmark-password"); err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkVerifyPasswordBcrypt(b *testing.B) {
	hash, err := bcrypt.GenerateFromPassword([]byte("benchmark-password"), 12)
	if err != nil {
		b.Fatal(err)
	}
	b.ReportAllocs()
	b.ResetTimer()
	for b.Loop() {
		if err := VerifyPassword(string(hash), "benchmark-password"); err != nil {
			b.Fatal(err)
		}
	}
}

func testArgon2idHash(t *testing.T, password string, params argon2Parameters) string {
	t.Helper()
	params.key = argon2.IDKey(
		[]byte(password),
		params.salt,
		params.iterations,
		params.memory,
		params.parallelism,
		uint32(len(params.key)),
	)
	return encodeArgon2id(params)
}
