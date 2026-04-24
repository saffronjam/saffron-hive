package store

import (
	"context"
	"log/slog"
	"strconv"
	"time"
)

// RetentionPruner is the narrow surface RunRetention needs to read the window
// from settings and delete rows older than a cutoff.
type RetentionPruner interface {
	GetSetting(ctx context.Context, key string) (Setting, error)
	Prune(ctx context.Context, cutoff time.Time) (int64, error)
}

// RetentionConfig tunes the retention loop.
type RetentionConfig struct {
	// SettingKey is the settings-table row controlling the retention window
	// in days. Missing or unparseable values fall back to DefaultDays.
	SettingKey string
	// DefaultDays is the window used when the setting is absent or invalid.
	DefaultDays int
	// Label is a short human-readable name threaded into log messages, e.g.
	// "activity events" or "device state samples".
	Label string
	// StartupDelay gives the app time to finish hydration before the first
	// prune; defaults to 30 seconds when zero.
	StartupDelay time.Duration
	// Interval is the period between prune ticks; defaults to 6 hours when zero.
	Interval time.Duration
}

const (
	defaultRetentionStartupDelay = 30 * time.Second
	defaultRetentionInterval     = 6 * time.Hour
)

// RunRetention prunes rows older than the configured window on a fixed
// interval. Blocks until ctx is cancelled. The window is re-read from the
// settings table on every tick so the user can change it without a restart.
func RunRetention(ctx context.Context, logger *slog.Logger, p RetentionPruner, cfg RetentionConfig) {
	if cfg.StartupDelay <= 0 {
		cfg.StartupDelay = defaultRetentionStartupDelay
	}
	if cfg.Interval <= 0 {
		cfg.Interval = defaultRetentionInterval
	}

	timer := time.NewTimer(cfg.StartupDelay)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return
	case <-timer.C:
	}

	PruneOnce(ctx, logger, p, cfg)

	ticker := time.NewTicker(cfg.Interval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			PruneOnce(ctx, logger, p, cfg)
		}
	}
}

// PruneOnce reads the retention window from settings and calls Prune once.
// Exposed so packages with dedicated pruners (activity, history) can exercise
// their SQL directly in integration tests without spinning up a full loop.
func PruneOnce(ctx context.Context, logger *slog.Logger, p RetentionPruner, cfg RetentionConfig) {
	days := retentionDays(ctx, p, cfg)
	if days <= 0 {
		return
	}
	cutoff := time.Now().Add(-time.Duration(days) * 24 * time.Hour)
	n, err := p.Prune(ctx, cutoff)
	if err != nil {
		logger.Error("prune failed", "label", cfg.Label, "error", err)
		return
	}
	if n > 0 {
		logger.Info("pruned rows", "label", cfg.Label, "count", n, "cutoff", cutoff, "retention_days", days)
	}
}

func retentionDays(ctx context.Context, p RetentionPruner, cfg RetentionConfig) int {
	setting, err := p.GetSetting(ctx, cfg.SettingKey)
	if err != nil {
		return cfg.DefaultDays
	}
	n, err := strconv.Atoi(setting.Value)
	if err != nil || n <= 0 {
		return cfg.DefaultDays
	}
	return n
}
