package store

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
)

// GetMQTTConfig returns the MQTT configuration from the database.
// Returns nil if no configuration has been stored yet.
func (s *SQLiteStore) GetMQTTConfig(ctx context.Context) (*MQTTConfig, error) {
	row := s.db.QueryRowContext(ctx,
		`SELECT broker, username, password, use_wss FROM mqtt_config WHERE id = 1`,
	)

	var cfg MQTTConfig
	err := row.Scan(&cfg.Broker, &cfg.Username, &cfg.Password, &cfg.UseWSS)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get mqtt config: %w", err)
	}
	return &cfg, nil
}

// UpsertMQTTConfig inserts or replaces the singleton MQTT configuration row.
func (s *SQLiteStore) UpsertMQTTConfig(ctx context.Context, cfg MQTTConfig) error {
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO mqtt_config (id, broker, username, password, use_wss)
		 VALUES (1, ?, ?, ?, ?)
		 ON CONFLICT(id) DO UPDATE SET broker=excluded.broker, username=excluded.username, password=excluded.password, use_wss=excluded.use_wss`,
		cfg.Broker, cfg.Username, cfg.Password, cfg.UseWSS,
	)
	if err != nil {
		return fmt.Errorf("upsert mqtt config: %w", err)
	}
	return nil
}
