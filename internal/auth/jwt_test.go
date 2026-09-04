package auth

import (
	"errors"
	"testing"
	"time"
)

func TestSignParseRoundtrip(t *testing.T) {
	svc := NewService([]byte("test-secret"), time.Hour)
	tok, err := svc.SignUser("user-1", "alice", "Alice", 0)
	if err != nil {
		t.Fatalf("Sign: %v", err)
	}
	claims, err := svc.Parse(tok)
	if err != nil {
		t.Fatalf("Parse: %v", err)
	}
	if claims.PrincipalID != "user-1" || claims.Username != "alice" || claims.Name != "Alice" {
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
	tok, err := svc.SignUser("u", "u", "U", 0)
	if err != nil {
		t.Fatalf("Sign: %v", err)
	}
	if _, err := svc.Parse(tok); !errors.Is(err, ErrInvalidToken) {
		t.Errorf("Parse expired token: got %v, want ErrInvalidToken", err)
	}
}

func TestSignParsePreservesTokenVersion(t *testing.T) {
	svc := NewService([]byte("s"), time.Hour)
	tok, err := svc.SignUser("u-1", "alice", "Alice", 7)
	if err != nil {
		t.Fatalf("Sign: %v", err)
	}
	claims, err := svc.Parse(tok)
	if err != nil {
		t.Fatalf("Parse: %v", err)
	}
	if claims.TokenVersion != 7 {
		t.Errorf("TokenVersion = %d, want 7", claims.TokenVersion)
	}
}

func TestParseRejectsTamperedSignature(t *testing.T) {
	svcA := NewService([]byte("secret-a"), time.Hour)
	svcB := NewService([]byte("secret-b"), time.Hour)
	tok, err := svcA.SignUser("u", "u", "U", 0)
	if err != nil {
		t.Fatalf("Sign: %v", err)
	}
	if _, err := svcB.Parse(tok); !errors.Is(err, ErrInvalidToken) {
		t.Errorf("Parse cross-secret: got %v, want ErrInvalidToken", err)
	}
}

func TestSignGuestCarriesGuestIdentityAndHardExpiry(t *testing.T) {
	svc := NewService([]byte("s"), time.Hour)
	hardExpiry := time.Now().Add(6 * time.Hour).Truncate(time.Second)
	tok, err := svc.SignGuest("guest-1", "Linnea", hardExpiry)
	if err != nil {
		t.Fatalf("SignGuest: %v", err)
	}
	claims, err := svc.Parse(tok)
	if err != nil {
		t.Fatalf("Parse: %v", err)
	}
	if !claims.Guest || claims.PrincipalID != "guest-1" || claims.Name != "Linnea" {
		t.Fatalf("guest claims = %+v", claims)
	}
	if claims.Username != "" || claims.ExpiresAt == nil || !claims.ExpiresAt.Time.Equal(hardExpiry) {
		t.Fatalf("guest claim details = %+v", claims)
	}
}
