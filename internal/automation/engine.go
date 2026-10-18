package automation

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/expr-lang/expr/vm"
	"github.com/robfig/cron/v3"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/logging"
	"github.com/saffronjam/saffron-hive/internal/store"
	"github.com/saffronjam/saffron-hive/internal/webhook"
)

type compiledTrigger struct {
	nodeID  NodeID
	graphID string
	config  TriggerConfig
	program *vm.Program // only for event triggers; nil for schedule triggers
}

type compiledGraph struct {
	automationID string
	nodes        map[NodeID]Node
	topoOrder    []NodeID
	incomingMap  map[NodeID][]NodeID
	conditions   map[NodeID]*vm.Program
}

var logger = logging.Named("automation")

// automationStore is the narrow subset of store methods the engine and action
// executor need. *store.DB satisfies it implicitly.
type automationStore interface {
	ListEnabledAutomations(ctx context.Context) ([]store.Automation, error)
	GetAutomationGraph(ctx context.Context, automationID string) (store.AutomationGraph, error)
	UpdateAutomationLastFired(ctx context.Context, id string, firedAt time.Time) error
	ResolveGroupIDByName(ctx context.Context, name string) (string, bool, error)
	ResolveRoomIDByName(ctx context.Context, name string) (string, bool, error)
	ResolveSceneIDByName(ctx context.Context, name string) (string, bool, error)
	GetScene(ctx context.Context, id string) (store.Scene, error)
	GetAutomationNodeState(ctx context.Context, automationID, nodeID, key string) (string, bool, error)
	SetAutomationNodeState(ctx context.Context, automationID, nodeID, key, value string) error
}

// Engine evaluates automation graphs against incoming events.
type Engine struct {
	bus       eventbus.EventBus
	reader    device.StateReader
	store     automationStore
	resolver  device.TargetResolver
	commander device.TargetCommander
	executor  *ActionExecutor
	scenes    SceneRunner
	changes   *changeTracker
	now       func() time.Time
	location  atomic.Pointer[time.Location]

	// baseCtx is set by Run to the caller's context and used by the background
	// goroutines spawned from event-driven fires (resolving targets, stamping
	// last-fired timestamps, raising alarms). Cancelling the Run context
	// propagates to every side-effect initiated by the engine.
	baseCtx context.Context

	mu               sync.RWMutex
	triggers         map[string][]compiledTrigger
	graphs           map[string]compiledGraph
	triggerLastFired map[string]map[NodeID]time.Time
	cron             *cron.Cron
	holds            map[holdKey]*holdState

	// afterFunc schedules hold-trigger timers; tests replace it to control time.
	afterFunc func(time.Duration, func()) func() bool

	// cooldownSkips counts how many trigger evaluations were suppressed by
	// an active cooldown (loop-prevention mechanism #2). Read via Stats().
	cooldownSkips atomic.Int64
}

// Stats is a snapshot of runtime counters exposed for observability.
type Stats struct {
	// CooldownSkips is the lifetime count of trigger evaluations skipped
	// because the trigger was in its cooldown window.
	CooldownSkips int64
	// StateMatchSkips is the lifetime count of set_device_state actions
	// suppressed because the device already matched the desired state.
	StateMatchSkips int64
}

// Stats returns a live snapshot of engine counters.
func (e *Engine) Stats() Stats {
	return Stats{
		CooldownSkips:   e.cooldownSkips.Load(),
		StateMatchSkips: e.executor.stateMatchSkips.Load(),
	}
}

// NewEngine creates a new automation Engine. alarmSvc may be nil in tests
// that don't exercise alarm actions; runner may be nil in tests that don't
// exercise run_effect or scene-payload effect dispatch.
func NewEngine(bus eventbus.EventBus, reader device.StateReader, s automationStore, resolver device.TargetResolver, alarmSvc AlarmRaiser, runner EffectRunner, scenes SceneRunner) *Engine {
	engine := &Engine{
		bus:              bus,
		reader:           reader,
		store:            s,
		resolver:         resolver,
		executor:         NewActionExecutor(bus, reader, s, resolver, alarmSvc, runner, scenes),
		scenes:           scenes,
		changes:          newChangeTracker(time.Now()),
		now:              time.Now,
		baseCtx:          context.Background(),
		triggers:         make(map[string][]compiledTrigger),
		graphs:           make(map[string]compiledGraph),
		triggerLastFired: make(map[string]map[NodeID]time.Time),
		holds:            make(map[holdKey]*holdState),
		afterFunc: func(d time.Duration, f func()) func() bool {
			return time.AfterFunc(d, f).Stop
		},
	}
	if commander, ok := resolver.(device.TargetCommander); ok {
		engine.commander = commander
	}
	return engine
}

// TimeZoneSettingKey is the setting holding the IANA time zone automations
// run in. Empty uses the process's local time.
const TimeZoneSettingKey = "timezone"

// LoadTimeZone resolves a time zone setting value; empty is nil.
func LoadTimeZone(name string) (*time.Location, error) {
	if name == "" {
		return nil, nil
	}
	location, err := time.LoadLocation(name)
	if err != nil {
		return nil, fmt.Errorf("unknown time zone %q", name)
	}
	return location, nil
}

// SetLocation sets the time zone that schedules, time windows and weekdays
// are evaluated in; nil uses the process's local time. Schedules pick it up
// on the next Reload.
func (e *Engine) SetLocation(location *time.Location) {
	e.location.Store(location)
}

// inLocation converts t to the configured time zone.
func (e *Engine) inLocation(t time.Time) time.Time {
	if location := e.location.Load(); location != nil {
		return t.In(location)
	}
	return t
}

func (e *Engine) localNow() time.Time {
	return e.inLocation(e.now())
}

func (e *Engine) cronLocation() *time.Location {
	if location := e.location.Load(); location != nil {
		return location
	}
	return time.Local
}

func (e *Engine) exprScope() exprScope {
	return exprScope{
		ctx:      e.baseCtx,
		reader:   e.reader,
		resolver: e.resolver,
		names:    e.store,
		scenes:   e.scenes,
		changes:  e.changes,
	}
}

// seedChanges records every device's current state as its starting value.
func (e *Engine) seedChanges() {
	now := e.now()
	for _, d := range e.reader.ListDevices() {
		if st, ok := e.reader.GetDeviceState(d.ID); ok && st != nil {
			e.changes.observe(d.ID, st, now)
		}
	}
}

// Reload loads enabled automation graphs from the store, replacing the current
// set. It stops any previous cron scheduler and starts a fresh one with all
// schedule triggers registered.
func (e *Engine) Reload(ctx context.Context) error {
	autos, err := e.store.ListEnabledAutomations(ctx)
	if err != nil {
		return err
	}

	triggersByEvent := make(map[string][]compiledTrigger)
	graphs := make(map[string]compiledGraph)
	var scheduleTriggers []compiledTrigger

	for _, a := range autos {
		graph, err := e.store.GetAutomationGraph(ctx, a.ID)
		if err != nil {
			logger.Warn("skipping automation, cannot load graph", "id", a.ID, "name", a.Name, "error", err)
			continue
		}

		domainGraph, err := mapStoreToDomain(graph)
		if err != nil {
			logger.Warn("skipping automation, macro error", "id", a.ID, "name", a.Name, "error", err)
			continue
		}
		cg, triggers, err := compileGraph(domainGraph)
		if err != nil {
			logger.Warn("skipping automation, compile error", "id", a.ID, "name", a.Name, "error", err)
			continue
		}

		graphs[a.ID] = cg

		for _, ct := range triggers {
			switch ct.config.Kind {
			case TriggerSchedule:
				scheduleTriggers = append(scheduleTriggers, ct)
			default:
				triggersByEvent[ct.config.EventType] = append(triggersByEvent[ct.config.EventType], ct)
			}
		}
	}

	newCron := cron.New(cron.WithSeconds(), cron.WithLocation(e.cronLocation()))
	for _, ct := range scheduleTriggers {
		ct := ct // capture for closure
		_, err := newCron.AddFunc(ct.config.CronExpr, func() {
			e.handleScheduledTrigger(ct.graphID, ct.nodeID)
		})
		if err != nil {
			logger.Warn("skipping schedule trigger, invalid cron expression",
				"automation_id", ct.graphID,
				"node_id", ct.nodeID,
				"cron_expr", ct.config.CronExpr,
				"error", err)
			continue
		}
	}

	e.mu.Lock()
	oldCron := e.cron
	e.triggers = triggersByEvent
	e.graphs = graphs
	e.cron = newCron
	e.mu.Unlock()

	if oldCron != nil {
		stopCtx := oldCron.Stop()
		<-stopCtx.Done()
	}
	newCron.Start()
	e.reconcileHolds(triggersByEvent)
	return nil
}

// Stop shuts down the cron scheduler. Intended for clean shutdown alongside ctx
// cancellation.
func (e *Engine) Stop() {
	e.mu.Lock()
	c := e.cron
	e.cron = nil
	e.mu.Unlock()
	if c != nil {
		stopCtx := c.Stop()
		<-stopCtx.Done()
	}
	e.stopHolds()
}

// Run starts the event loop. It blocks until ctx is cancelled.
func (e *Engine) Run(ctx context.Context) error {
	e.baseCtx = ctx
	e.executor.SetBaseContext(ctx)
	e.seedChanges()

	if err := e.Reload(ctx); err != nil {
		return err
	}

	ch := e.bus.Subscribe(
		eventbus.EventDeviceStateChanged,
		eventbus.EventDeviceActionFired,
		eventbus.EventDeviceAvailabilityChanged,
		eventbus.EventDeviceAdded,
		eventbus.EventDeviceRemoved,
		eventbus.EventWebhookReceived,
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
	triggers := e.triggers[string(event.Type)]
	graphs := e.graphs
	e.mu.RUnlock()

	now := e.localNow()
	if event.Type == eventbus.EventDeviceStateChanged {
		if change, ok := event.Payload.(device.DeviceStateChange); ok {
			e.changes.observe(device.DeviceID(event.DeviceID), &change.State, now)
		}
	}
	env := e.exprScope().env(&event, now)

	firedThisTick := make(map[string]map[NodeID]bool)

	for _, ct := range triggers {
		if _, ok := graphs[ct.graphID]; !ok {
			continue
		}
		if isHoldTrigger(ct) {
			continue
		}

		if e.triggerInCooldown(ct.graphID, ct.nodeID, now, ct.config.CooldownMs) {
			e.cooldownSkips.Add(1)
			logger.Debug("trigger skipped: in cooldown",
				"automation_id", ct.graphID, "node_id", ct.nodeID, "cooldown_ms", ct.config.CooldownMs)
			continue
		}

		if event.Type == eventbus.EventWebhookReceived {
			incoming, ok := event.Payload.(webhook.Event)
			if !ok || incoming.EndpointID != ct.config.EndpointID || !webhook.MatchFilters(incoming, ct.config.WebhookFilters) {
				continue
			}
		}

		result, err := evalExpr(ct.program, env)
		if err != nil {
			logger.Error("trigger eval error", "graph_id", ct.graphID, "node_id", ct.nodeID, "error", err)
			continue
		}
		if !result {
			continue
		}

		e.recordTriggerFired(ct.graphID, ct.nodeID, now)
		if firedThisTick[ct.graphID] == nil {
			firedThisTick[ct.graphID] = make(map[NodeID]bool)
		}
		firedThisTick[ct.graphID][ct.nodeID] = true
	}

	for graphID, freshFires := range firedThisTick {
		cg := graphs[graphID]
		triggerResults := e.combineWithGrace(cg, freshFires, now)
		if e.evaluateGraph(cg, env, triggerResults) {
			e.recordAutomationFired(graphID, now)
		}
	}

	e.updateHolds(event)
}

// FireTrigger injects a trigger node directly into its loaded automation graph.
// Per-trigger cooldown still applies. A trigger with a hold duration first
// counts down its hold, as if its condition had just become true.
func (e *Engine) FireTrigger(_ context.Context, automationID string, nodeID NodeID) error {
	e.mu.RLock()
	cg, ok := e.graphs[automationID]
	e.mu.RUnlock()
	if !ok {
		return fmt.Errorf("automation %q is not loaded (disabled or unknown)", automationID)
	}

	node, ok := cg.nodes[nodeID]
	if !ok {
		return fmt.Errorf("node %q not found in automation %q", nodeID, automationID)
	}
	if node.Type != NodeTrigger {
		return fmt.Errorf("node %q is not a trigger", nodeID)
	}
	tc, _ := node.Config.(TriggerConfig)
	if ct, ok := e.holdTrigger(automationID, nodeID); ok {
		e.startManualHold(ct)
		return nil
	}

	now := e.localNow()
	if e.triggerInCooldown(automationID, nodeID, now, tc.CooldownMs) {
		return nil
	}
	e.recordTriggerFired(automationID, nodeID, now)

	env := e.exprScope().env(nil, now)
	triggerResults := e.combineWithGrace(cg, map[NodeID]bool{nodeID: true}, now)
	if e.evaluateGraph(cg, env, triggerResults) {
		e.recordAutomationFired(automationID, now)
	}
	return nil
}

// handleScheduledTrigger is invoked by the cron scheduler when a schedule
// trigger fires. It behaves like handleEvent but skips event matching — the
// specific trigger node is known.
func (e *Engine) handleScheduledTrigger(automationID string, nodeID NodeID) {
	e.mu.RLock()
	cg, ok := e.graphs[automationID]
	e.mu.RUnlock()
	if !ok {
		return
	}

	node, ok := cg.nodes[nodeID]
	if !ok {
		return
	}
	tc, _ := node.Config.(TriggerConfig)

	now := e.localNow()
	if e.triggerInCooldown(automationID, nodeID, now, tc.CooldownMs) {
		return
	}
	e.recordTriggerFired(automationID, nodeID, now)

	env := e.exprScope().env(nil, now)
	triggerResults := e.combineWithGrace(cg, map[NodeID]bool{nodeID: true}, now)
	if e.evaluateGraph(cg, env, triggerResults) {
		e.recordAutomationFired(automationID, now)
	}
}

// combineWithGrace returns the set of triggers to treat as active for this
// evaluation: every trigger that fired this tick, plus every trigger in the
// same graph whose last-fire is still inside its grace window.
func (e *Engine) combineWithGrace(cg compiledGraph, freshFires map[NodeID]bool, now time.Time) map[NodeID]bool {
	e.mu.RLock()
	lastFired := e.triggerLastFired[cg.automationID]
	e.mu.RUnlock()

	active := make(map[NodeID]bool, len(freshFires))
	for id := range freshFires {
		active[id] = true
	}
	for _, n := range cg.nodes {
		if n.Type != NodeTrigger {
			continue
		}
		if active[n.ID] {
			continue
		}
		tc, ok := n.Config.(TriggerConfig)
		if !ok || tc.GraceMs <= 0 {
			continue
		}
		last, ok := lastFired[n.ID]
		if !ok {
			continue
		}
		if now.Sub(last) <= time.Duration(tc.GraceMs)*time.Millisecond {
			active[n.ID] = true
		}
	}
	return active
}

func (e *Engine) evaluateGraph(cg compiledGraph, env ExprEnv, triggerResults map[NodeID]bool) bool {
	active := make(map[NodeID]bool)
	for id, result := range triggerResults {
		active[id] = result
	}

	anyActionFired := false

	for _, nodeID := range cg.topoOrder {
		node := cg.nodes[nodeID]
		if node.Type != NodeTrigger && !evaluateOperator(OperatorOr, cg.incomingMap[nodeID], active) {
			continue
		}

		switch node.Type {
		case NodeTrigger:
			if active[nodeID] {
				e.publishNodeActivation(cg.automationID, nodeID, true)
			}

		case NodeCondition:
			prog, ok := cg.conditions[nodeID]
			if !ok {
				continue
			}
			result, err := evalExpr(prog, env)
			if err != nil {
				logger.Error("condition eval error", "graph_id", cg.automationID, "node_id", nodeID, "error", err)
				e.publishNodeActivation(cg.automationID, nodeID, false)
				continue
			}
			if node.Config.(ConditionConfig).Negate {
				result = !result
			}
			active[nodeID] = result
			e.publishNodeActivation(cg.automationID, nodeID, result)

		case NodeOperator:
			opCfg, ok := node.Config.(OperatorConfig)
			if !ok {
				continue
			}
			incoming := cg.incomingMap[nodeID]
			nodeActive := evaluateOperator(opCfg.Kind, incoming, active)
			active[nodeID] = nodeActive
			e.publishNodeActivation(cg.automationID, nodeID, nodeActive)

		case NodeAction:
			active[nodeID] = true
			e.publishNodeActivation(cg.automationID, nodeID, true)
			e.executeAction(node, cg.automationID)
			anyActionFired = true
		}
	}

	return anyActionFired
}

func evaluateOperator(kind OperatorKind, incoming []NodeID, active map[NodeID]bool) bool {
	switch kind {
	case OperatorAnd:
		if len(incoming) == 0 {
			return false
		}
		for _, src := range incoming {
			if !active[src] {
				return false
			}
		}
		return true
	case OperatorOr:
		for _, src := range incoming {
			if active[src] {
				return true
			}
		}
		return false
	default:
		return false
	}
}

func actionUsesTargetResolver(actionType string) bool {
	switch actionType {
	case ActionActivateScene, ActionCycleScenes, ActionRaiseAlarm, ActionClearAlarm, ActionRunEffect:
		return false
	default:
		return true
	}
}

func (e *Engine) executeAction(node Node, automationID string) {
	actionCfg, ok := node.Config.(ActionConfig)
	if !ok {
		return
	}
	actionCfg.AutomationID = automationID
	actionCfg.NodeID = node.ID
	if actionCfg.ActionType == ActionConfigureDevice && actionCfg.TargetType != TargetDevice {
		logger.Warn("configure_device requires a device target", "automation_id", automationID, "node_id", node.ID, "target_type", actionCfg.TargetType)
		return
	}

	// Scene, alarm, run-effect, and cycle-scenes actions are not target-scoped
	// through the action resolver. Each dispatches once per activation; scene
	// and cycle actions resolve their own scene targets, while effect runs
	// resolve their target at each iteration boundary.
	if !actionUsesTargetResolver(actionCfg.ActionType) {
		e.executor.ExecuteGraphAction(actionCfg)
		return
	}

	var deviceIDs []device.DeviceID
	if actionCfg.TargetType == TargetType(device.TargetExpression) {
		deviceIDs = device.EvaluateExpression(e.baseCtx, e.reader, e.resolver, actionCfg.TargetExpr)
	} else {
		deviceIDs = e.resolver.ResolveTargetDeviceIDs(
			e.baseCtx,
			device.TargetType(actionCfg.TargetType),
			actionCfg.TargetID,
		)
	}

	if actionCfg.ActionType == ActionToggleDeviceState {
		// Toggle on a group/room flips the aggregate, not each member: any
		// controllable member on => all off, all controllable members off =>
		// all on. Computing once and dispatching as set_device_state avoids
		// per-member flipping that
		// would scramble half-on rooms.
		anyOn, hasTarget := aggregateControllableOn(e.reader, deviceIDs)
		if !hasTarget {
			return
		}
		nextOn := !anyOn
		payload, _ := json.Marshal(map[string]any{"on": nextOn})
		if e.commander != nil && actionCfg.TargetType != TargetType(device.TargetExpression) {
			actionCfg.ActionType = ActionSetDeviceState
			actionCfg.Payload = string(payload)
			e.executor.executeTargetState(actionCfg, device.TargetType(actionCfg.TargetType), deviceIDs)
			return
		}
		for _, devID := range deviceIDs {
			e.executor.ExecuteGraphAction(ActionConfig{
				ActionType:   ActionSetDeviceState,
				TargetType:   TargetDevice,
				TargetID:     string(devID),
				Payload:      string(payload),
				AutomationID: automationID,
			})
		}
		return
	}

	if actionCfg.ActionType == ActionSetDeviceState && e.commander != nil && actionCfg.TargetType != TargetType(device.TargetExpression) {
		e.executor.executeTargetState(actionCfg, device.TargetType(actionCfg.TargetType), deviceIDs)
		return
	}

	for _, devID := range deviceIDs {
		perDevice := ActionConfig{
			ActionType:   actionCfg.ActionType,
			TargetType:   TargetDevice,
			TargetID:     string(devID),
			Payload:      actionCfg.Payload,
			AutomationID: automationID,
		}
		e.executor.ExecuteGraphAction(perDevice)
	}
}

func (e *Engine) publishNodeActivation(automationID string, nodeID NodeID, isActive bool) {
	e.bus.Publish(eventbus.Event{
		Type:      eventbus.EventAutomationNodeActivated,
		Timestamp: e.now(),
		Payload: NodeActivation{
			AutomationID: automationID,
			NodeID:       nodeID,
			Active:       isActive,
		},
	})
}

func (e *Engine) triggerInCooldown(automationID string, nodeID NodeID, now time.Time, cooldownMs int64) bool {
	if cooldownMs <= 0 {
		return false
	}
	e.mu.RLock()
	last, exists := e.triggerLastFired[automationID][nodeID]
	e.mu.RUnlock()
	if !exists {
		return false
	}
	return now.Before(last.Add(time.Duration(cooldownMs) * time.Millisecond))
}

func (e *Engine) recordTriggerFired(automationID string, nodeID NodeID, now time.Time) {
	e.mu.Lock()
	if e.triggerLastFired[automationID] == nil {
		e.triggerLastFired[automationID] = make(map[NodeID]time.Time)
	}
	e.triggerLastFired[automationID][nodeID] = now
	e.mu.Unlock()
}

func (e *Engine) recordAutomationFired(automationID string, now time.Time) {
	if err := e.store.UpdateAutomationLastFired(e.baseCtx, automationID, now); err != nil {
		logger.Warn("failed to persist last_fired_at", "automation_id", automationID, "error", err)
	}
}

func compileGraph(g AutomationGraph) (compiledGraph, []compiledTrigger, error) {
	validation := ValidateGraph(g)
	if !validation.Valid() {
		return compiledGraph{}, nil, validation.Errors[0]
	}

	nodeMap := make(map[NodeID]Node, len(g.Nodes))
	for _, n := range g.Nodes {
		nodeMap[n.ID] = n
	}

	incomingMap := make(map[NodeID][]NodeID, len(g.Nodes))
	for _, e := range g.Edges {
		incomingMap[e.ToNodeID] = append(incomingMap[e.ToNodeID], e.FromNodeID)
	}

	order, err := topoSort(g.Nodes, g.Edges)
	if err != nil {
		return compiledGraph{}, nil, err
	}

	var triggers []compiledTrigger
	conditions := make(map[NodeID]*vm.Program)
	for _, n := range g.Nodes {
		switch n.Type {
		case NodeTrigger:
			tc, ok := n.Config.(TriggerConfig)
			if !ok {
				continue
			}
			ct := compiledTrigger{
				nodeID:  n.ID,
				graphID: g.ID,
				config:  tc,
			}
			if tc.Kind == TriggerEvent {
				exprStr := tc.FilterExpr
				if exprStr == "" {
					exprStr = "true"
				}
				prog, err := compileExpr(exprStr)
				if err != nil {
					return compiledGraph{}, nil, fmt.Errorf("trigger %s: %w", n.ID, err)
				}
				ct.program = prog
			}
			triggers = append(triggers, ct)

		case NodeCondition:
			cc, ok := n.Config.(ConditionConfig)
			if !ok {
				continue
			}
			exprStr := cc.Expr
			if exprStr == "" {
				exprStr = "true"
			}
			prog, err := compileExpr(exprStr)
			if err != nil {
				return compiledGraph{}, nil, fmt.Errorf("condition %s: %w", n.ID, err)
			}
			conditions[n.ID] = prog
		}
	}

	cg := compiledGraph{
		automationID: g.ID,
		nodes:        nodeMap,
		topoOrder:    order,
		incomingMap:  incomingMap,
		conditions:   conditions,
	}

	return cg, triggers, nil
}

// Compilable reports whether the graph can be loaded by the automation engine.
func Compilable(g AutomationGraph) bool {
	_, _, err := compileGraph(g)
	return err == nil
}

func topoSort(nodes []Node, edges []Edge) ([]NodeID, error) {
	adj := make(map[NodeID][]NodeID, len(nodes))
	inDegree := make(map[NodeID]int, len(nodes))
	for _, n := range nodes {
		inDegree[n.ID] = 0
	}
	for _, e := range edges {
		adj[e.FromNodeID] = append(adj[e.FromNodeID], e.ToNodeID)
		inDegree[e.ToNodeID]++
	}

	var queue []NodeID
	for _, n := range nodes {
		if inDegree[n.ID] == 0 {
			queue = append(queue, n.ID)
		}
	}

	var order []NodeID
	for len(queue) > 0 {
		id := queue[0]
		queue = queue[1:]
		order = append(order, id)
		for _, neighbor := range adj[id] {
			inDegree[neighbor]--
			if inDegree[neighbor] == 0 {
				queue = append(queue, neighbor)
			}
		}
	}

	if len(order) != len(nodes) {
		return nil, fmt.Errorf("graph contains a cycle")
	}

	return order, nil
}

func mapStoreToDomain(sg store.AutomationGraph) (AutomationGraph, error) {
	g := AutomationGraph{
		ID:      sg.Automation.ID,
		Name:    sg.Automation.Name,
		Enabled: sg.Automation.Enabled,
	}
	defs, err := ParseDefinitions(sg.Automation.Definitions)
	if err != nil {
		return AutomationGraph{}, err
	}

	for _, sn := range sg.Nodes {
		config, err := defs.ParseNodeConfig(NodeType(sn.Type), sn.Config)
		if err != nil {
			return AutomationGraph{}, fmt.Errorf("node %s: %w", sn.ID, err)
		}
		g.Nodes = append(g.Nodes, Node{
			ID:           NodeID(sn.ID),
			AutomationID: sn.AutomationID,
			Type:         NodeType(sn.Type),
			Config:       config,
			PositionX:    sn.PositionX,
			PositionY:    sn.PositionY,
		})
	}

	for _, se := range sg.Edges {
		g.Edges = append(g.Edges, Edge{
			AutomationID: se.AutomationID,
			FromNodeID:   NodeID(se.FromNodeID),
			ToNodeID:     NodeID(se.ToNodeID),
		})
	}

	return g, nil
}

// ParseNodeConfig decodes a stored node config, expanding its macro
// references first.
func (d Definitions) ParseNodeConfig(nodeType NodeType, configJSON string) (NodeConfig, error) {
	expanded, err := d.ExpandNodeConfig(nodeType, configJSON)
	if err != nil {
		return nil, err
	}
	return parseNodeConfig(nodeType, expanded)
}

func parseNodeConfig(nodeType NodeType, configJSON string) (NodeConfig, error) {
	switch nodeType {
	case NodeTrigger:
		var raw struct {
			Kind           string               `json:"kind"`
			EventType      string               `json:"event_type"`
			FilterExpr     string               `json:"filter_expr"`
			CronExpr       string               `json:"cron_expr"`
			GraceMs        int64                `json:"grace_ms"`
			CooldownMs     int64                `json:"cooldown_ms"`
			HoldMs         int64                `json:"hold_ms"`
			HoldDeviceID   string               `json:"device_id"`
			EndpointID     string               `json:"endpoint_id"`
			WebhookFilters []webhook.FilterRule `json:"webhook_filters"`
		}
		if err := decodeNodeConfig(configJSON, &raw); err != nil {
			return nil, fmt.Errorf("invalid trigger config: %w", err)
		}
		kind := TriggerKind(raw.Kind)
		if kind == "" {
			if raw.CronExpr != "" {
				kind = TriggerSchedule
			} else {
				kind = TriggerEvent
			}
		}
		return TriggerConfig{
			Kind:           kind,
			EventType:      raw.EventType,
			FilterExpr:     raw.FilterExpr,
			CronExpr:       raw.CronExpr,
			GraceMs:        raw.GraceMs,
			CooldownMs:     raw.CooldownMs,
			HoldMs:         raw.HoldMs,
			HoldDeviceID:   raw.HoldDeviceID,
			EndpointID:     raw.EndpointID,
			WebhookFilters: raw.WebhookFilters,
		}, nil
	case NodeCondition:
		var raw struct {
			Expr   string `json:"expr"`
			Negate bool   `json:"negate"`
		}
		if err := decodeNodeConfig(configJSON, &raw); err != nil {
			return nil, fmt.Errorf("invalid condition config: %w", err)
		}
		return ConditionConfig{Expr: raw.Expr, Negate: raw.Negate}, nil
	case NodeOperator:
		var raw struct {
			Kind string `json:"kind"`
		}
		if err := decodeNodeConfig(configJSON, &raw); err != nil {
			return nil, fmt.Errorf("invalid operator config: %w", err)
		}
		return OperatorConfig{Kind: OperatorKind(raw.Kind)}, nil
	case NodeAction:
		var raw struct {
			ActionType string          `json:"action_type"`
			TargetType string          `json:"target_type"`
			TargetID   string          `json:"target_id"`
			TargetExpr []device.Clause `json:"target_expr"`
			Payload    string          `json:"payload"`
		}
		if err := decodeNodeConfig(configJSON, &raw); err != nil {
			return nil, fmt.Errorf("invalid action config: %w", err)
		}
		tt := TargetType(raw.TargetType)
		if tt == "" {
			tt = TargetDevice
		}
		return ActionConfig{
			ActionType: raw.ActionType,
			TargetType: tt,
			TargetID:   raw.TargetID,
			TargetExpr: raw.TargetExpr,
			Payload:    raw.Payload,
		}, nil
	default:
		return nil, fmt.Errorf("unknown node type %q", nodeType)
	}
}

func decodeNodeConfig[T any](raw string, value *T) error {
	if !strings.HasPrefix(strings.TrimSpace(raw), "{") {
		return fmt.Errorf("config must be a JSON object")
	}
	decoder := json.NewDecoder(strings.NewReader(raw))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(value); err != nil {
		return err
	}
	var trailing json.RawMessage
	if err := decoder.Decode(&trailing); err != io.EOF {
		return fmt.Errorf("config must contain one JSON object")
	}
	return nil
}

// ValidateNodeShape checks serialized types while allowing incomplete draft values.
func ValidateNodeShape(nodeType NodeType, raw string) error {
	var fields map[string]json.RawMessage
	if err := json.Unmarshal([]byte(raw), &fields); err != nil || fields == nil {
		return fmt.Errorf("config must be a JSON object")
	}
	if draft, ok := fields["draft"]; ok {
		if len(fields) != 1 {
			return fmt.Errorf("draft cannot include executable configuration")
		}
		var c AuthoringConfig
		if err := decodeNodeConfig(string(draft), &c); err != nil {
			return err
		}
		if !incompleteAuthoring(c) {
			return fmt.Errorf("draft must be incomplete")
		}
		_, err := CompileAuthoring(nodeType, c)
		return err
	}
	if _, ok := fields["use"]; ok {
		var ref struct {
			Use    string            `json:"use"`
			Negate bool              `json:"negate,omitempty"`
			Args   []json.RawMessage `json:"args"`
		}
		return decodeNodeConfig(raw, &ref)
	}
	config, err := parseNodeConfig(nodeType, raw)
	if err != nil {
		return err
	}
	if action, ok := config.(ActionConfig); ok && action.Payload != "" {
		var payload map[string]json.RawMessage
		if err := json.Unmarshal([]byte(action.Payload), &payload); err != nil || payload == nil {
			return fmt.Errorf("action payload must be a JSON object")
		}
	}
	return nil
}
