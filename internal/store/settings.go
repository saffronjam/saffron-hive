package store

import (
	"context"
	"fmt"
)

// GetSetting retrieves a single setting by key.
func (s *SQLiteStore) GetSetting(ctx context.Context, key string) (Setting, error) {
	row := s.db.QueryRowContext(ctx,
		`SELECT key, value FROM settings WHERE key = ?`, key,
	)
	var st Setting
	if err := row.Scan(&st.Key, &st.Value); err != nil {
		return Setting{}, fmt.Errorf("get setting %q: %w", key, err)
	}
	return st, nil
}

// ListSettings returns all settings.
func (s *SQLiteStore) ListSettings(ctx context.Context) ([]Setting, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT key, value FROM settings`)
	if err != nil {
		return nil, fmt.Errorf("list settings: %w", err)
	}
	defer func() { _ = rows.Close() }()

	var settings []Setting
	for rows.Next() {
		var st Setting
		if err := rows.Scan(&st.Key, &st.Value); err != nil {
			return nil, fmt.Errorf("list settings: scan: %w", err)
		}
		settings = append(settings, st)
	}
	return settings, rows.Err()
}

// UpsertSetting inserts or updates a setting.
func (s *SQLiteStore) UpsertSetting(ctx context.Context, key, value string) error {
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO settings (key, value) VALUES (?, ?)
		 ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
		key, value,
	)
	if err != nil {
		return fmt.Errorf("upsert setting %q: %w", key, err)
	}
	return nil
}
