package maintenance

import (
	"context"
	"log/slog"
	"time"

	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/logging"
)

var logger = logging.Named("maintenance")

const (
	evaluationInterval  = time.Minute
	eventCoalesceWindow = 250 * time.Millisecond
)

type runnerConfig struct {
	evaluationInterval  time.Duration
	eventCoalesceWindow time.Duration
}

// Run evaluates immediately, in response to relevant event batches, and once per minute.
func Run(ctx context.Context, service *Service, events <-chan eventbus.Event) {
	run(ctx, service.Evaluate, events, runnerConfig{
		evaluationInterval:  evaluationInterval,
		eventCoalesceWindow: eventCoalesceWindow,
	})
}

func run(
	ctx context.Context,
	evaluateSnapshot func(context.Context) error,
	events <-chan eventbus.Event,
	config runnerConfig,
) {
	evaluate(ctx, evaluateSnapshot)

	ticker := time.NewTicker(config.evaluationInterval)
	defer ticker.Stop()
	var eventTimer *time.Timer
	var eventTimerC <-chan time.Time
	defer func() {
		if eventTimer != nil {
			eventTimer.Stop()
		}
	}()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if eventTimer != nil {
				eventTimer.Stop()
				eventTimer = nil
				eventTimerC = nil
			}
			evaluate(ctx, evaluateSnapshot)
		case <-eventTimerC:
			eventTimer = nil
			eventTimerC = nil
			evaluate(ctx, evaluateSnapshot)
		case _, ok := <-events:
			if !ok {
				events = nil
				continue
			}
			if eventTimer == nil {
				eventTimer = time.NewTimer(config.eventCoalesceWindow)
				eventTimerC = eventTimer.C
			}
		}
	}
}

func evaluate(ctx context.Context, evaluateSnapshot func(context.Context) error) {
	if err := evaluateSnapshot(ctx); err != nil {
		logger.Warn("maintenance evaluation failed", slog.String("error", err.Error()))
	}
}
