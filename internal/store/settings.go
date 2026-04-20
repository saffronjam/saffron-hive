package store

import (
	"context"
	"fmt"

	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// GetSetting retrieves a single setting by key.
func (s *DB) GetSetting(ctx context.Context, key string) (Setting, error) {
	row, err := s.q.GetSetting(ctx, key)
	if err != nil {
		return Setting{}, fmt.Errorf("get setting %q: %w", key, err)
	}
	return Setting{Key: row.Key, Value: row.Value}, nil
}

// ListSettings returns all settings.
func (s *DB) ListSettings(ctx context.Context) ([]Setting, error) {
	rows, err := s.q.ListSettings(ctx)
	if err != nil {
		return nil, fmt.Errorf("list settings: %w", err)
	}
	var settings []Setting
	for _, r := range rows {
		settings = append(settings, Setting{Key: r.Key, Value: r.Value})
	}
	return settings, nil
}

// UpsertSetting inserts or updates a setting.
func (s *DB) UpsertSetting(ctx context.Context, key, value string) error {
	if err := s.q.UpsertSetting(ctx, sqlite.UpsertSettingParams{Key: key, Value: value}); err != nil {
		return fmt.Errorf("upsert setting %q: %w", key, err)
	}
	return nil
}
