package activity

import (
	"context"
	"time"

	"github.com/saffronjam/saffron-hive/internal/store"
)

const (
	// RetentionSettingKey is the settings-table key that controls how many
	// days of activity history to keep. Missing or unparseable values fall
	// back to DefaultRetentionDays.
	RetentionSettingKey = "activity.retention_days"
	// DefaultRetentionDays is the retention window used when the setting is
	// absent or malformed.
	DefaultRetentionDays = 30
)

// RunRetention prunes old activity events on a fixed interval. Blocks until
// ctx is cancelled.
func RunRetention(ctx context.Context, s activityStore) {
	store.RunRetention(ctx, logger, activityPruner{s}, retentionConfig())
}

// PruneOnce runs a single retention pass. Intended for tests.
func PruneOnce(ctx context.Context, s activityStore) {
	store.PruneOnce(ctx, logger, activityPruner{s}, retentionConfig())
}

func retentionConfig() store.RetentionConfig {
	return store.RetentionConfig{
		SettingKey:  RetentionSettingKey,
		DefaultDays: DefaultRetentionDays,
		Label:       "activity events",
	}
}

type activityPruner struct{ s activityStore }

func (a activityPruner) GetSetting(ctx context.Context, key string) (store.Setting, error) {
	return a.s.GetSetting(ctx, key)
}

func (a activityPruner) Prune(ctx context.Context, cutoff time.Time) (int64, error) {
	return a.s.PruneActivityEventsOlderThan(ctx, cutoff)
}
