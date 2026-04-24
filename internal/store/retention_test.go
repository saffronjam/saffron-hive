package store

import (
	"context"
	"errors"
	"log/slog"
	"sync/atomic"
	"testing"
	"time"
)

type fakePruner struct {
	settings    map[string]string
	pruneCalls  atomic.Int64
	pruneReturn int64
	pruneErr    error
	cutoffs     chan time.Time
}

func newFakePruner(setting string) *fakePruner {
	f := &fakePruner{
		settings: map[string]string{},
		cutoffs:  make(chan time.Time, 8),
	}
	if setting != "" {
		f.settings["retention.days"] = setting
	}
	return f
}

func (f *fakePruner) GetSetting(_ context.Context, key string) (Setting, error) {
	v, ok := f.settings[key]
	if !ok {
		return Setting{}, errors.New("not found")
	}
	return Setting{Key: key, Value: v}, nil
}

func (f *fakePruner) Prune(_ context.Context, cutoff time.Time) (int64, error) {
	f.pruneCalls.Add(1)
	select {
	case f.cutoffs <- cutoff:
	default:
	}
	return f.pruneReturn, f.pruneErr
}

func TestRunRetentionRunsFirstPruneAfterStartupDelay(t *testing.T) {
	p := newFakePruner("7")
	p.pruneReturn = 3

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	done := make(chan struct{})
	go func() {
		RunRetention(ctx, slog.Default(), p, RetentionConfig{
			SettingKey:   "retention.days",
			DefaultDays:  30,
			Label:        "test",
			StartupDelay: 10 * time.Millisecond,
			Interval:     50 * time.Millisecond,
		})
		close(done)
	}()

	select {
	case cutoff := <-p.cutoffs:
		expected := 7 * 24 * time.Hour
		delta := time.Since(cutoff) - expected
		if delta < -time.Second || delta > time.Second {
			t.Fatalf("cutoff far from now-7d: delta=%v", delta)
		}
	case <-time.After(500 * time.Millisecond):
		t.Fatal("first prune never ran")
	}

	cancel()
	select {
	case <-done:
	case <-time.After(500 * time.Millisecond):
		t.Fatal("goroutine did not exit after cancel")
	}
}

func TestRunRetentionFallsBackToDefaultOnMissingSetting(t *testing.T) {
	p := newFakePruner("") // no setting stored

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go RunRetention(ctx, slog.Default(), p, RetentionConfig{
		SettingKey:   "retention.days",
		DefaultDays:  14,
		Label:        "test",
		StartupDelay: 5 * time.Millisecond,
		Interval:     50 * time.Millisecond,
	})

	select {
	case cutoff := <-p.cutoffs:
		expected := 14 * 24 * time.Hour
		delta := time.Since(cutoff) - expected
		if delta < -time.Second || delta > time.Second {
			t.Fatalf("cutoff far from now-14d: delta=%v", delta)
		}
	case <-time.After(500 * time.Millisecond):
		t.Fatal("first prune never ran")
	}
}

func TestRunRetentionSkipsWhenDaysZero(t *testing.T) {
	p := newFakePruner("0")

	ctx, cancel := context.WithTimeout(context.Background(), 80*time.Millisecond)
	defer cancel()

	done := make(chan struct{})
	go func() {
		RunRetention(ctx, slog.Default(), p, RetentionConfig{
			SettingKey:   "retention.days",
			DefaultDays:  0,
			Label:        "test",
			StartupDelay: 5 * time.Millisecond,
			Interval:     10 * time.Millisecond,
		})
		close(done)
	}()

	<-done
	if p.pruneCalls.Load() > 0 {
		t.Fatalf("expected no prune when days<=0, got %d", p.pruneCalls.Load())
	}
}

func TestRunRetentionExitsImmediatelyOnCancelledContext(t *testing.T) {
	p := newFakePruner("7")

	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	done := make(chan struct{})
	go func() {
		RunRetention(ctx, slog.Default(), p, RetentionConfig{
			SettingKey:   "retention.days",
			DefaultDays:  7,
			Label:        "test",
			StartupDelay: time.Hour,
			Interval:     time.Hour,
		})
		close(done)
	}()

	select {
	case <-done:
	case <-time.After(200 * time.Millisecond):
		t.Fatal("did not exit promptly on cancelled ctx")
	}
	if p.pruneCalls.Load() != 0 {
		t.Fatalf("expected 0 prune calls when ctx was pre-cancelled, got %d", p.pruneCalls.Load())
	}
}
