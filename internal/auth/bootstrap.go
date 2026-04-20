package auth

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/saffronjam/saffron-hive/internal/store"
)

const (
	// SettingJWTSecret is the settings-table key under which the JWT signing
	// secret is persisted. Generated once on first boot; never rotated
	// automatically — rotating forces all users to log in again.
	SettingJWTSecret = "jwt.secret"
	// SettingTokenTTLHours is the settings-table key for the token lifetime
	// in hours. Users may edit this; defaults to 24 hours.
	SettingTokenTTLHours = "auth.token_ttl_hours"

	defaultTTLHours = 24
	minTTLHours     = 1
	maxTTLHours     = 24 * 30 // 30 days

	secretByteLen = 32
)

// bootstrapStore is the narrow subset of store methods the auth bootstrap flow
// needs. *store.DB satisfies it implicitly.
type bootstrapStore interface {
	GetSetting(ctx context.Context, key string) (store.Setting, error)
	UpsertSetting(ctx context.Context, key, value string) error
}

// LoadOrInitSecret returns the JWT signing secret. On first boot, generates a
// cryptographically random 32-byte secret and persists it base64-encoded in
// the settings table.
func LoadOrInitSecret(ctx context.Context, s bootstrapStore) ([]byte, error) {
	setting, err := s.GetSetting(ctx, SettingJWTSecret)
	if err == nil {
		decoded, decErr := base64.StdEncoding.DecodeString(setting.Value)
		if decErr != nil {
			return nil, fmt.Errorf("decode jwt secret: %w", decErr)
		}
		return decoded, nil
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return nil, fmt.Errorf("load jwt secret: %w", err)
	}

	secret := make([]byte, secretByteLen)
	if _, err := rand.Read(secret); err != nil {
		return nil, fmt.Errorf("generate jwt secret: %w", err)
	}
	encoded := base64.StdEncoding.EncodeToString(secret)
	if err := s.UpsertSetting(ctx, SettingJWTSecret, encoded); err != nil {
		return nil, fmt.Errorf("persist jwt secret: %w", err)
	}
	return secret, nil
}

// LoadTTL returns the configured token lifetime, clamped to a sensible range.
// Unset/invalid values fall back to the default (24 hours).
func LoadTTL(ctx context.Context, s bootstrapStore) time.Duration {
	setting, err := s.GetSetting(ctx, SettingTokenTTLHours)
	if err != nil {
		return time.Duration(defaultTTLHours) * time.Hour
	}
	hours, err := strconv.Atoi(setting.Value)
	if err != nil || hours < minTTLHours {
		hours = defaultTTLHours
	}
	if hours > maxTTLHours {
		hours = maxTTLHours
	}
	return time.Duration(hours) * time.Hour
}
