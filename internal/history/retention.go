package history

import (
	"context"
	"strconv"
	"time"
)

const (
	// RetentionSettingKey is the settings-table key controlling how many days
	// of device state samples to keep. Missing or unparseable values fall back
	// to DefaultRetentionDays.
	RetentionSettingKey = "history.retention_days"
	// DefaultRetentionDays is the fallback window when the setting is absent
	// or malformed.
	DefaultRetentionDays  = 365
	defaultPruneInterval  = 6 * time.Hour
	defaultStartupSettleS = 30 * time.Second
)

// RunRetention prunes old device state samples on a fixed interval. Blocks
// until ctx is cancelled. The retention window is read from the settings
// table on every tick so the user can change it without a restart.
func RunRetention(ctx context.Context, s historyStore) {
	runRetentionWithInterval(ctx, s, defaultPruneInterval, defaultStartupSettleS)
}

func runRetentionWithInterval(ctx context.Context, s historyStore, interval, initialDelay time.Duration) {
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

func pruneOnce(ctx context.Context, s historyStore) {
	days := retentionDays(ctx, s)
	if days <= 0 {
		return
	}
	cutoff := time.Now().Add(-time.Duration(days) * 24 * time.Hour)
	n, err := s.PruneDeviceStateSamplesOlderThan(ctx, cutoff)
	if err != nil {
		logger.Error("prune device state samples failed", "error", err)
		return
	}
	if n > 0 {
		logger.Info("pruned device state samples", "count", n, "cutoff", cutoff, "retention_days", days)
	}
}

func retentionDays(ctx context.Context, s historyStore) int {
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
