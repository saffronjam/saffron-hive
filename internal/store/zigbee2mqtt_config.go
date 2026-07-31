package store

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// GetZigbee2MQTTConfig returns the Zigbee2MQTT integration configuration.
// Returns nil when the integration has not been configured.
func (s *DB) GetZigbee2MQTTConfig(ctx context.Context) (*Zigbee2MQTTConfig, error) {
	row, err := s.q.GetZigbee2MQTTConfig(ctx)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get zigbee2mqtt config: %w", err)
	}
	return &Zigbee2MQTTConfig{
		Broker:   row.Broker,
		Username: row.Username,
		Password: row.Password,
		UseWSS:   row.UseWss,
		Enabled:  row.Enabled,
	}, nil
}

// UpsertZigbee2MQTTConfig inserts or replaces the singleton Zigbee2MQTT
// configuration row.
func (s *DB) UpsertZigbee2MQTTConfig(ctx context.Context, cfg Zigbee2MQTTConfig) error {
	if err := s.q.UpsertZigbee2MQTTConfig(ctx, sqlite.UpsertZigbee2MQTTConfigParams{
		Broker:   cfg.Broker,
		Username: cfg.Username,
		Password: cfg.Password,
		UseWss:   cfg.UseWSS,
		Enabled:  cfg.Enabled,
	}); err != nil {
		return fmt.Errorf("upsert zigbee2mqtt config: %w", err)
	}
	return nil
}

// DeleteZigbee2MQTTConfig removes the Zigbee2MQTT integration configuration.
func (s *DB) DeleteZigbee2MQTTConfig(ctx context.Context) error {
	if err := s.q.DeleteZigbee2MQTTConfig(ctx); err != nil {
		return fmt.Errorf("delete zigbee2mqtt config: %w", err)
	}
	return nil
}
