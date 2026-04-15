package automation

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/expr-lang/expr/vm"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

type compiledAutomation struct {
	automation store.Automation
	actions    []store.AutomationAction
	program    *vm.Program
}

// Engine evaluates automation rules against incoming events.
type Engine struct {
	bus      eventbus.EventBus
	reader   device.StateReader
	store    store.Store
	executor *ActionExecutor
	now      func() time.Time

	mu          sync.RWMutex
	automations []compiledAutomation
	cooldowns   map[string]time.Time
}

// NewEngine creates a new automation Engine.
func NewEngine(bus eventbus.EventBus, reader device.StateReader, s store.Store) *Engine {
	return &Engine{
		bus:       bus,
		reader:    reader,
		store:     s,
		executor:  NewActionExecutor(bus, reader, s),
		now:       time.Now,
		cooldowns: make(map[string]time.Time),
	}
}

// Reload loads enabled automations from the store, replacing the current set.
func (e *Engine) Reload(ctx context.Context) error {
	autos, err := e.store.ListEnabledAutomations(ctx)
	if err != nil {
		return err
	}

	var compiled []compiledAutomation
	for _, a := range autos {
		prog, err := compileExpr(a.ConditionExpr)
		if err != nil {
			log.Printf("automation: skipping %s (%s): compile error: %v", a.ID, a.Name, err)
			continue
		}

		actions, err := e.store.ListAutomationActions(ctx, a.ID)
		if err != nil {
			log.Printf("automation: skipping %s (%s): cannot load actions: %v", a.ID, a.Name, err)
			continue
		}

		compiled = append(compiled, compiledAutomation{
			automation: a,
			actions:    actions,
			program:    prog,
		})
	}

	e.mu.Lock()
	e.automations = compiled
	e.mu.Unlock()
	return nil
}

// Run starts the event loop. It blocks until ctx is cancelled.
func (e *Engine) Run(ctx context.Context) error {
	if err := e.Reload(ctx); err != nil {
		return err
	}

	ch := e.bus.Subscribe(
		eventbus.EventDeviceStateChanged,
		eventbus.EventDeviceAvailabilityChanged,
		eventbus.EventDeviceAdded,
		eventbus.EventDeviceRemoved,
	)
	defer e.bus.Unsubscribe(ch)

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case event := <-ch:
			e.handleEvent(event)
		}
	}
}

func (e *Engine) handleEvent(event eventbus.Event) {
	e.mu.RLock()
	automations := e.automations
	e.mu.RUnlock()

	now := e.now()

	for _, ca := range automations {
		if eventbus.EventType(ca.automation.TriggerEvent) != event.Type {
			continue
		}

		if e.inCooldown(ca.automation.ID, now, ca.automation.CooldownSeconds) {
			continue
		}

		env := buildEnv(e.reader, event, now)
		result, err := evalExpr(ca.program, env)
		if err != nil {
			log.Printf("automation: %s eval error: %v", ca.automation.ID, err)
			continue
		}
		if !result {
			continue
		}

		for _, action := range ca.actions {
			e.executor.Execute(action)
		}

		e.recordFired(ca.automation.ID, now)
	}
}

func (e *Engine) inCooldown(automationID string, now time.Time, cooldownSeconds int) bool {
	if cooldownSeconds <= 0 {
		return false
	}

	e.mu.RLock()
	lastFired, exists := e.cooldowns[automationID]
	e.mu.RUnlock()

	if !exists {
		return false
	}

	return now.Before(lastFired.Add(time.Duration(cooldownSeconds) * time.Second))
}

func (e *Engine) recordFired(automationID string, now time.Time) {
	e.mu.Lock()
	e.cooldowns[automationID] = now
	e.mu.Unlock()
}
