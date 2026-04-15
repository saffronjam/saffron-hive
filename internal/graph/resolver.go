package graph

import (
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

// AutomationReloader reloads automation rules after configuration changes.
type AutomationReloader interface {
	Reload() error
}

// Resolver is the root resolver that holds all dependencies required by the
// GraphQL query, mutation, and subscription resolvers.
type Resolver struct {
	StateReader        device.StateReader
	Store              store.Store
	EventBus           eventbus.EventBus
	AutomationReloader AutomationReloader
}
