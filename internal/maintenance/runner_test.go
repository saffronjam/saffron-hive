package maintenance

import (
	"context"
	"sync/atomic"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

func TestRunnerEvaluatesImmediatelyAndCoalescesEvents(t *testing.T) {
	ctx, cancel := context.WithCancel(t.Context())
	events := make(chan eventbus.Event, 8)
	var evaluations atomic.Int32
	done := make(chan struct{})

	go func() {
		defer close(done)
		run(ctx, func(context.Context) error {
			evaluations.Add(1)
			return nil
		}, events, runnerConfig{
			evaluationInterval:  time.Hour,
			eventCoalesceWindow: 10 * time.Millisecond,
		})
	}()

	waitForEvaluations(t, &evaluations, 1)
	events <- eventbus.Event{}
	events <- eventbus.Event{}
	events <- eventbus.Event{}
	waitForEvaluations(t, &evaluations, 2)
	time.Sleep(25 * time.Millisecond)
	if got := evaluations.Load(); got != 2 {
		t.Fatalf("event burst produced %d evaluations, want 2 including startup", got)
	}

	events <- eventbus.Event{}
	waitForEvaluations(t, &evaluations, 3)
	cancel()
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("runner did not stop after cancellation")
	}
}

func TestRunnerEvaluatesPeriodically(t *testing.T) {
	ctx, cancel := context.WithCancel(t.Context())
	defer cancel()
	var evaluations atomic.Int32

	go run(ctx, func(context.Context) error {
		evaluations.Add(1)
		return nil
	}, make(chan eventbus.Event), runnerConfig{
		evaluationInterval:  10 * time.Millisecond,
		eventCoalesceWindow: time.Hour,
	})

	waitForEvaluations(t, &evaluations, 2)
}

func waitForEvaluations(t *testing.T, evaluations *atomic.Int32, want int32) {
	t.Helper()
	deadline := time.Now().Add(time.Second)
	for time.Now().Before(deadline) {
		if evaluations.Load() >= want {
			return
		}
		time.Sleep(time.Millisecond)
	}
	t.Fatalf("evaluations = %d, want at least %d", evaluations.Load(), want)
}
