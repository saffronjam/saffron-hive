package activity

import (
	"context"
	"strconv"
	"time"

	"github.com/saffronjam/saffron-hive/internal/store"
)

const (
	// RetentionSettingKey is the settings-table key that controls how many days
	// of activity history to keep. Missing or unparseable values fall back to
	// DefaultRetentionDays.
	RetentionSettingKey   = "activity.retention_days"
	DefaultRetentionDays  = 30
	defaultPruneInterval  = 6 * time.Hour
	defaultStartupSettleS = 30 * time.Second
)

// RunRetention prunes old activity events on a fixed interval. Blocks until
// ctx is cancelled. The retention window is read from the settings table on
// every tick so the user can change it without a restart.
func RunRetention(ctx context.Context, s store.Store) {
	runRetentionWithInterval(ctx, s, defaultPruneInterval, defaultStartupSettleS)
}

func runRetentionWithInterval(ctx context.Context, s store.Store, interval, initialDelay time.Duration) {
	// Give the app time to finish startup before the first prune so we don't
	// contend with hydration queries.
	timer := time.NewTimer(initialDelay)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return
	case <-timer.C:
	}

	pruneOnce(ctx, s)

	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			pruneOnce(ctx, s)
		}
	}
}

func pruneOnce(ctx context.Context, s store.Store) {
	days := retentionDays(ctx, s)
	if days <= 0 {
		return
	}
	cutoff := time.Now().Add(-time.Duration(days) * 24 * time.Hour)
	n, err := s.PruneActivityEventsOlderThan(ctx, cutoff)
	if err != nil {
		logger.Error("prune activity events failed", "error", err)
		return
	}
	if n > 0 {
		logger.Info("pruned activity events", "count", n, "cutoff", cutoff, "retention_days", days)
	}
}

func retentionDays(ctx context.Context, s store.Store) int {
	setting, err := s.GetSetting(ctx, RetentionSettingKey)
	if err != nil {
		return DefaultRetentionDays
	}
	n, err := strconv.Atoi(setting.Value)
	if err != nil || n <= 0 {
		return DefaultRetentionDays
	}
	return n
}
