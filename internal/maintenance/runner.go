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
	evaluationInterval = time.Minute
	startupSettle      = time.Minute
)

// Run evaluates after startup settlement, on relevant events, and once per minute.
func Run(ctx context.Context, service *Service, events <-chan eventbus.Event) {
	timer := time.NewTimer(startupSettle)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return
	case <-timer.C:
	}
	evaluate(ctx, service)
	ticker := time.NewTicker(evaluationInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			evaluate(ctx, service)
		case <-events:
			evaluate(ctx, service)
		}
	}
}

func evaluate(ctx context.Context, service *Service) {
	if err := service.Evaluate(ctx); err != nil {
		logger.Warn("maintenance evaluation failed", slog.String("error", err.Error()))
	}
}
