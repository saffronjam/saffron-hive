package history

import (
	"context"
	"time"

	"github.com/saffronjam/saffron-hive/internal/store"
)

const (
	// RetentionSettingKey is the settings-table key controlling how many
	// days of device state samples to keep. Missing or unparseable values
	// fall back to DefaultRetentionDays.
	RetentionSettingKey = "history.retention_days"
	// DefaultRetentionDays is the fallback window when the setting is
	// absent or malformed.
	DefaultRetentionDays = 365
)

// RunRetention prunes old device state samples on a fixed interval. Blocks
// until ctx is cancelled.
func RunRetention(ctx context.Context, s historyStore) {
	store.RunRetention(ctx, logger, historyPruner{s}, retentionConfig())
}

// PruneOnce runs a single retention pass. Intended for tests.
func PruneOnce(ctx context.Context, s historyStore) {
	store.PruneOnce(ctx, logger, historyPruner{s}, retentionConfig())
}

func retentionConfig() store.RetentionConfig {
	return store.RetentionConfig{
		SettingKey:  RetentionSettingKey,
		DefaultDays: DefaultRetentionDays,
		Label:       "device state samples",
	}
}

type historyPruner struct{ s historyStore }

func (h historyPruner) GetSetting(ctx context.Context, key string) (store.Setting, error) {
	return h.s.GetSetting(ctx, key)
}

func (h historyPruner) Prune(ctx context.Context, cutoff time.Time) (int64, error) {
	return h.s.PruneDeviceStateSamplesOlderThan(ctx, cutoff)
}
