package store

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// GetTuyaConfig returns the Tuya integration configuration from the database.
func (s *DB) GetTuyaConfig(ctx context.Context) (*TuyaConfig, error) {
	row, err := s.q.GetTuyaConfig(ctx)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get tuya config: %w", err)
	}
	return &TuyaConfig{
		AccessID:     row.AccessID,
		AccessSecret: row.AccessSecret,
		Region:       row.Region,
		Enabled:      row.Enabled,
	}, nil
}

// UpsertTuyaConfig inserts or replaces the singleton Tuya configuration row.
func (s *DB) UpsertTuyaConfig(ctx context.Context, cfg TuyaConfig) error {
	if err := s.q.UpsertTuyaConfig(ctx, sqlite.UpsertTuyaConfigParams{
		AccessID:     cfg.AccessID,
		AccessSecret: cfg.AccessSecret,
		Region:       cfg.Region,
		Enabled:      cfg.Enabled,
	}); err != nil {
		return fmt.Errorf("upsert tuya config: %w", err)
	}
	return nil
}

// DeleteTuyaConfig removes the Tuya integration configuration.
func (s *DB) DeleteTuyaConfig(ctx context.Context) error {
	if err := s.q.DeleteTuyaConfig(ctx); err != nil {
		return fmt.Errorf("delete tuya config: %w", err)
	}
	return nil
}
