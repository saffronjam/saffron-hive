package auth

import (
	"context"
	"strings"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

// LoginLimiter throttles login attempts per-(ip, username) and applies an
// exponential backoff floor once a key starts failing. Designed to neutralise
// two complementary attacks:
//
//   - Brute-force from a single attacker against a single account (the token
//     bucket caps short-term rate; the backoff floor punishes sustained
//     failure).
//   - Brute-force from a single attacker against many accounts (each
//     username keys an independent bucket, so spraying does not amortise).
//
// The limiter sits in front of the bcrypt verify so even successful guesses
// against a throttled key are refused until the backoff clears.
type LoginLimiter struct {
	mu      sync.Mutex
	entries map[string]*loginBucket
	now     func() time.Time

	refillEvery time.Duration
	burst       int
	backoff     []time.Duration
	idleTTL     time.Duration
}

type loginBucket struct {
	limiter          *rate.Limiter
	consecutiveFails int
	nextAllowedAt    time.Time
	lastTouched      time.Time
}

// LoginLimiterConfig captures the knobs we expose for testing. Defaults are
// applied by NewLoginLimiter — most callers should leave it zero-valued.
type LoginLimiterConfig struct {
	RefillEvery     time.Duration
	Burst           int
	BackoffSchedule []time.Duration
	IdleTTL         time.Duration
	Now             func() time.Time
}

var defaultBackoff = []time.Duration{
	0,
	1 * time.Second,
	2 * time.Second,
	5 * time.Second,
	10 * time.Second,
	30 * time.Second,
	60 * time.Second,
}

// NewLoginLimiter constructs a LoginLimiter with the given configuration. Any
// zero-valued field falls back to the production default.
func NewLoginLimiter(cfg LoginLimiterConfig) *LoginLimiter {
	if cfg.RefillEvery <= 0 {
		cfg.RefillEvery = 2 * time.Second
	}
	if cfg.Burst <= 0 {
		cfg.Burst = 5
	}
	if len(cfg.BackoffSchedule) == 0 {
		cfg.BackoffSchedule = defaultBackoff
	}
	if cfg.IdleTTL <= 0 {
		cfg.IdleTTL = 10 * time.Minute
	}
	if cfg.Now == nil {
		cfg.Now = time.Now
	}
	return &LoginLimiter{
		entries:     make(map[string]*loginBucket),
		now:         cfg.Now,
		refillEvery: cfg.RefillEvery,
		burst:       cfg.Burst,
		backoff:     cfg.BackoffSchedule,
		idleTTL:     cfg.IdleTTL,
	}
}

func (l *LoginLimiter) bucket(key string, now time.Time) *loginBucket {
	b, ok := l.entries[key]
	if !ok {
		b = &loginBucket{
			limiter:     rate.NewLimiter(rate.Every(l.refillEvery), l.burst),
			lastTouched: now,
		}
		l.entries[key] = b
	}
	b.lastTouched = now
	return b
}

// Allow reports whether a login attempt for (ip, username) may proceed at
// this moment, plus the retry-after duration if not. The caller is responsible
// for invoking RecordFailure / RecordSuccess afterwards depending on the
// outcome.
func (l *LoginLimiter) Allow(ip, username string, now time.Time) (bool, time.Duration) {
	key := makeKey(ip, username)
	l.mu.Lock()
	defer l.mu.Unlock()
	b := l.bucket(key, now)
	if now.Before(b.nextAllowedAt) {
		return false, b.nextAllowedAt.Sub(now)
	}
	if !b.limiter.AllowN(now, 1) {
		reserved := b.limiter.ReserveN(now, 1)
		delay := reserved.DelayFrom(now)
		reserved.Cancel()
		return false, delay
	}
	return true, 0
}

// RecordFailure advances the backoff schedule for (ip, username). Call once
// for every login attempt that did not produce a signed token — including
// throttled rejections.
func (l *LoginLimiter) RecordFailure(ip, username string, now time.Time) {
	key := makeKey(ip, username)
	l.mu.Lock()
	defer l.mu.Unlock()
	b := l.bucket(key, now)
	b.consecutiveFails++
	step := b.consecutiveFails - 1
	if step >= len(l.backoff) {
		step = len(l.backoff) - 1
	}
	delay := l.backoff[step]
	if delay > 0 {
		next := now.Add(delay)
		if next.After(b.nextAllowedAt) {
			b.nextAllowedAt = next
		}
	}
}

// RecordSuccess resets the bucket so a legitimate user is not throttled by
// past typos.
func (l *LoginLimiter) RecordSuccess(ip, username string) {
	key := makeKey(ip, username)
	l.mu.Lock()
	defer l.mu.Unlock()
	if b, ok := l.entries[key]; ok {
		b.consecutiveFails = 0
		b.nextAllowedAt = time.Time{}
		b.limiter = rate.NewLimiter(rate.Every(l.refillEvery), l.burst)
	}
}

// Run drives a periodic cleanup of entries idle longer than IdleTTL. Bounds
// memory growth under spray attacks where every guess uses a fresh key.
// Returns when ctx is cancelled.
func (l *LoginLimiter) Run(ctx context.Context) {
	tick := l.idleTTL / 2
	if tick <= 0 {
		tick = time.Minute
	}
	ticker := time.NewTicker(tick)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case t := <-ticker.C:
			l.evictIdle(t)
		}
	}
}

func (l *LoginLimiter) evictIdle(now time.Time) {
	l.mu.Lock()
	defer l.mu.Unlock()
	for k, b := range l.entries {
		if now.Sub(b.lastTouched) > l.idleTTL && now.After(b.nextAllowedAt) {
			delete(l.entries, k)
		}
	}
}

func makeKey(ip, username string) string {
	return ip + "|" + strings.ToLower(strings.TrimSpace(username))
}
