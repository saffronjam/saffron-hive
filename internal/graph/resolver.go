package graph

import (
	"context"
	"log/slog"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/logging"
	"github.com/saffronjam/saffron-hive/internal/store"
)

// AutomationReloader reloads automation rules after configuration changes.
type AutomationReloader interface {
	Reload() error
}

// MQTTReconnector reconnects the MQTT adapter with the latest DB config.
type MQTTReconnector interface {
	Reconnect(ctx context.Context) error
}

// Resolver is the root resolver that holds all dependencies required by the
// GraphQL query, mutation, and subscription resolvers.
type Resolver struct {
	StateReader        device.StateReader
	Store              store.Store
	TargetResolver     device.TargetResolver
	EventBus           eventbus.EventBus
	AutomationReloader AutomationReloader
	LogBuffer          *logging.Buffer
	LevelVar           *slog.LevelVar
	Reconnector        MQTTReconnector
}
