package store

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// GetMQTTConfig returns the MQTT configuration from the database.
// Returns nil if no configuration has been stored yet.
func (s *DB) GetMQTTConfig(ctx context.Context) (*MQTTConfig, error) {
	row, err := s.q.GetMQTTConfig(ctx)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get mqtt config: %w", err)
	}
	return &MQTTConfig{
		Broker:   row.Broker,
		Username: row.Username,
		Password: row.Password,
		UseWSS:   row.UseWss,
	}, nil
}

// UpsertMQTTConfig inserts or replaces the singleton MQTT configuration row.
func (s *DB) UpsertMQTTConfig(ctx context.Context, cfg MQTTConfig) error {
	if err := s.q.UpsertMQTTConfig(ctx, sqlite.UpsertMQTTConfigParams{
		Broker:   cfg.Broker,
		Username: cfg.Username,
		Password: cfg.Password,
		UseWss:   cfg.UseWSS,
	}); err != nil {
		return fmt.Errorf("upsert mqtt config: %w", err)
	}
	return nil
}
