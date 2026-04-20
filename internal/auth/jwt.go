package auth

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// ErrInvalidToken is returned when a JWT fails signature/format/expiry checks.
var ErrInvalidToken = errors.New("invalid token")

// Claims carries the authenticated user's identity across the JWT boundary.
// Username and Name are denormalized into the token so resolvers and the
// frontend can render attribution without an extra DB lookup on every request.
type Claims struct {
	UserID   string `json:"sub"`
	Username string `json:"username"`
	Name     string `json:"name"`
	jwt.RegisteredClaims
}

// Service signs and verifies HS256 JWTs backed by a symmetric secret.
type Service struct {
	secret []byte
	ttl    time.Duration
}

// NewService constructs a JWT service with the given secret and token lifetime.
func NewService(secret []byte, ttl time.Duration) *Service {
	return &Service{secret: secret, ttl: ttl}
}

// TTL returns the token lifetime currently configured on the service.
func (s *Service) TTL() time.Duration { return s.ttl }

// Sign produces a signed JWT for the given user.
func (s *Service) Sign(userID, username, name string) (string, error) {
	now := time.Now()
	claims := Claims{
		UserID:   userID,
		Username: username,
		Name:     name,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(s.ttl)),
		},
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := tok.SignedString(s.secret)
	if err != nil {
		return "", fmt.Errorf("sign token: %w", err)
	}
	return signed, nil
}

// Parse verifies a token's signature and expiry and returns its claims.
// Returns ErrInvalidToken wrapped with the underlying cause on failure.
func (s *Service) Parse(tokenString string) (Claims, error) {
	var claims Claims
	_, err := jwt.ParseWithClaims(tokenString, &claims, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method %v", t.Method.Alg())
		}
		return s.secret, nil
	})
	if err != nil {
		return Claims{}, fmt.Errorf("%w: %v", ErrInvalidToken, err)
	}
	return claims, nil
}
