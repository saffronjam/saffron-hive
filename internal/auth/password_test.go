package auth

import "testing"

func TestHashVerifyPassword(t *testing.T) {
	hash, err := HashPassword("hunter2")
	if err != nil {
		t.Fatalf("HashPassword: %v", err)
	}
	if hash == "hunter2" {
		t.Error("HashPassword returned plaintext")
	}
	if err := VerifyPassword(hash, "hunter2"); err != nil {
		t.Errorf("VerifyPassword: %v", err)
	}
	if err := VerifyPassword(hash, "wrong"); err == nil {
		t.Error("VerifyPassword accepted wrong password")
	}
}
