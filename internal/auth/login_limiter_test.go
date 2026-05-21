package auth

import (
	"testing"
	"time"
)

func newTestLimiter(now func() time.Time) *LoginLimiter {
	return NewLoginLimiter(LoginLimiterConfig{
		RefillEvery: 2 * time.Second,
		Burst:       5,
		BackoffSchedule: []time.Duration{
			0,
			1 * time.Second,
			2 * time.Second,
			5 * time.Second,
		},
		IdleTTL: time.Minute,
		Now:     now,
	})
}

func TestLoginLimiterAllowsInitialBurst(t *testing.T) {
	now := time.Unix(1_000_000, 0)
	lim := newTestLimiter(func() time.Time { return now })

	for i := 0; i < 5; i++ {
		ok, _ := lim.Allow("1.1.1.1", "alice", now)
		if !ok {
			t.Fatalf("attempt %d denied within initial burst", i+1)
		}
	}
	ok, retry := lim.Allow("1.1.1.1", "alice", now)
	if ok {
		t.Fatal("6th attempt should have been rate-limited")
	}
	if retry <= 0 {
		t.Errorf("retry-after = %v, want positive", retry)
	}
}

func TestLoginLimiterBackoffEscalates(t *testing.T) {
	// First failure has zero backoff; subsequent failures push nextAllowedAt
	// out by the schedule entry corresponding to that failure count.
	now := time.Unix(1_000_000, 0)
	lim := NewLoginLimiter(LoginLimiterConfig{
		RefillEvery:     2 * time.Second,
		Burst:           5,
		BackoffSchedule: []time.Duration{0, 0, 5 * time.Second},
		IdleTTL:         time.Minute,
		Now:             func() time.Time { return now },
	})

	// First two failures: no floor.
	for i := 0; i < 2; i++ {
		ok, _ := lim.Allow("1.1.1.1", "alice", now)
		if !ok {
			t.Fatalf("attempt %d denied during the no-floor window", i+1)
		}
		lim.RecordFailure("1.1.1.1", "alice", now)
	}

	// Third failure triggers the 5-second floor.
	ok, _ := lim.Allow("1.1.1.1", "alice", now)
	if !ok {
		t.Fatal("third attempt denied before the floor took effect")
	}
	lim.RecordFailure("1.1.1.1", "alice", now)

	ok, retry := lim.Allow("1.1.1.1", "alice", now)
	if ok {
		t.Fatal("attempt during backoff floor should be denied")
	}
	if retry < 4*time.Second || retry > 6*time.Second {
		t.Errorf("backoff retry = %v, want ~5s", retry)
	}

	// After waiting past the floor, attempts proceed again — but the bucket
	// has been drained, so the rate-limiter itself takes over.
	after := now.Add(6 * time.Second)
	ok, _ = lim.Allow("1.1.1.1", "alice", after)
	if !ok {
		t.Error("attempt after the floor cleared should be allowed (token refill)")
	}
}

func TestLoginLimiterRecordSuccessResets(t *testing.T) {
	now := time.Unix(1_000_000, 0)
	lim := newTestLimiter(func() time.Time { return now })

	for i := 0; i < 5; i++ {
		_, _ = lim.Allow("1.1.1.1", "alice", now)
		lim.RecordFailure("1.1.1.1", "alice", now)
	}
	// Push into backoff.
	lim.RecordFailure("1.1.1.1", "alice", now)
	lim.RecordSuccess("1.1.1.1", "alice")

	ok, _ := lim.Allow("1.1.1.1", "alice", now)
	if !ok {
		t.Fatal("attempt after RecordSuccess should have been allowed")
	}
}

func TestLoginLimiterPerKeyIsolation(t *testing.T) {
	now := time.Unix(1_000_000, 0)
	lim := newTestLimiter(func() time.Time { return now })

	// Drain alice's bucket from one IP.
	for i := 0; i < 6; i++ {
		_, _ = lim.Allow("1.1.1.1", "alice", now)
	}

	// Bob from the same IP is unaffected.
	if ok, _ := lim.Allow("1.1.1.1", "bob", now); !ok {
		t.Error("bob should not be limited by alice's bucket")
	}
	// Alice from a different IP is unaffected.
	if ok, _ := lim.Allow("2.2.2.2", "alice", now); !ok {
		t.Error("alice from different IP should be independent")
	}
}

func TestLoginLimiterUsernameCaseInsensitive(t *testing.T) {
	now := time.Unix(1_000_000, 0)
	lim := newTestLimiter(func() time.Time { return now })

	for i := 0; i < 5; i++ {
		_, _ = lim.Allow("1.1.1.1", "Alice", now)
	}
	if ok, _ := lim.Allow("1.1.1.1", "alice", now); ok {
		t.Error("lowercase variant should share the bucket")
	}
	if ok, _ := lim.Allow("1.1.1.1", "  ALICE  ", now); ok {
		t.Error("padded variant should share the bucket")
	}
}

func TestLoginLimiterEvictsIdle(t *testing.T) {
	now := time.Unix(1_000_000, 0)
	lim := newTestLimiter(func() time.Time { return now })

	_, _ = lim.Allow("1.1.1.1", "alice", now)
	lim.evictIdle(now.Add(30 * time.Second))
	lim.mu.Lock()
	count := len(lim.entries)
	lim.mu.Unlock()
	if count != 1 {
		t.Fatalf("non-idle entry evicted: count = %d", count)
	}

	lim.evictIdle(now.Add(2 * time.Minute))
	lim.mu.Lock()
	count = len(lim.entries)
	lim.mu.Unlock()
	if count != 0 {
		t.Errorf("idle entry not evicted: count = %d", count)
	}
}
