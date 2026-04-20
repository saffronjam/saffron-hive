package auth

import (
	"errors"
	"testing"
	"time"
)

func TestSignParseRoundtrip(t *testing.T) {
	svc := NewService([]byte("test-secret"), time.Hour)
	tok, err := svc.Sign("user-1", "alice", "Alice")
	if err != nil {
		t.Fatalf("Sign: %v", err)
	}
	claims, err := svc.Parse(tok)
	if err != nil {
		t.Fatalf("Parse: %v", err)
	}
	if claims.UserID != "user-1" || claims.Username != "alice" || claims.Name != "Alice" {
		t.Errorf("claims = %+v, want {user-1 alice Alice}", claims)
	}
	if claims.ExpiresAt == nil {
		t.Fatal("ExpiresAt is nil")
	}
	if time.Until(claims.ExpiresAt.Time) <= 0 {
		t.Error("token expired immediately")
	}
}

func TestParseRejectsExpired(t *testing.T) {
	svc := NewService([]byte("s"), -time.Hour)
	tok, err := svc.Sign("u", "u", "U")
	if err != nil {
		t.Fatalf("Sign: %v", err)
	}
	if _, err := svc.Parse(tok); !errors.Is(err, ErrInvalidToken) {
		t.Errorf("Parse expired token: got %v, want ErrInvalidToken", err)
	}
}

func TestParseRejectsTamperedSignature(t *testing.T) {
	svcA := NewService([]byte("secret-a"), time.Hour)
	svcB := NewService([]byte("secret-b"), time.Hour)
	tok, err := svcA.Sign("u", "u", "U")
	if err != nil {
		t.Fatalf("Sign: %v", err)
	}
	if _, err := svcB.Parse(tok); !errors.Is(err, ErrInvalidToken) {
		t.Errorf("Parse cross-secret: got %v, want ErrInvalidToken", err)
	}
}
