package automation

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"github.com/expr-lang/expr/vm"
	"github.com/robfig/cron/v3"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/logging"
	"github.com/saffronjam/saffron-hive/internal/store"
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
	outgoingMap  map[NodeID][]NodeID
	conditions   map[NodeID]*vm.Program
}

var logger = logging.Named("automation")

// automationStore is the narrow subset of store methods the engine and action
// executor need. *store.DB satisfies it implicitly.
type automationStore interface {
	ListEnabledAutomations(ctx context.Context) ([]store.Automation, error)
	GetAutomationGraph(ctx context.Context, automationID string) (store.AutomationGraph, error)
	ListSceneActions(ctx context.Context, sceneID string) ([]store.SceneAction, error)
	ListSceneDevicePayloads(ctx context.Context, sceneID string) ([]store.SceneDevicePayload, error)
	UpdateAutomationLastFired(ctx context.Context, id string, firedAt time.Time) error
}

// Engine evaluates automation graphs against incoming events.
type Engine struct {
	bus      eventbus.EventBus
	reader   device.StateReader
	store    automationStore
	resolver device.TargetResolver
	executor *ActionExecutor
	now      func() time.Time

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
	cronByNode       map[NodeID]cron.EntryID

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
func NewEngine(bus eventbus.EventBus, reader device.StateReader, s automationStore, resolver device.TargetResolver, alarmSvc AlarmRaiser, runner EffectRunner) *Engine {
	return &Engine{
		bus:              bus,
		reader:           reader,
		store:            s,
		resolver:         resolver,
		executor:         NewActionExecutor(bus, reader, s, resolver, alarmSvc, runner),
		now:              time.Now,
		baseCtx:          context.Background(),
		triggers:         make(map[string][]compiledTrigger),
		graphs:           make(map[string]compiledGraph),
		triggerLastFired: make(map[string]map[NodeID]time.Time),
		cronByNode:       make(map[NodeID]cron.EntryID),
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

		domainGraph := mapStoreToDomain(graph)
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
			case TriggerManual:
				// fires only via FireManualTrigger; no event or cron registration
			default:
				triggersByEvent[ct.config.EventType] = append(triggersByEvent[ct.config.EventType], ct)
			}
		}
	}

	newCron := cron.New(cron.WithSeconds())
	cronByNode := make(map[NodeID]cron.EntryID)
	for _, ct := range scheduleTriggers {
		ct := ct // capture for closure
		entryID, err := newCron.AddFunc(ct.config.CronExpr, func() {
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
		cronByNode[ct.nodeID] = entryID
	}

	e.mu.Lock()
	oldCron := e.cron
	e.triggers = triggersByEvent
	e.graphs = graphs
	e.cron = newCron
	e.cronByNode = cronByNode
	e.mu.Unlock()

	if oldCron != nil {
		stopCtx := oldCron.Stop()
		<-stopCtx.Done()
	}
	newCron.Start()
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
}

// Run starts the event loop. It blocks until ctx is cancelled.
func (e *Engine) Run(ctx context.Context) error {
	e.baseCtx = ctx
	e.executor.SetBaseContext(ctx)

	if err := e.Reload(ctx); err != nil {
		return err
	}

	ch := e.bus.Subscribe(
		eventbus.EventDeviceStateChanged,
		eventbus.EventDeviceActionFired,
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
	triggers := e.triggers[string(event.Type)]
	graphs := e.graphs
	e.mu.RUnlock()

	now := e.now()
	env := buildEnv(e.reader, event, now)

	firedThisTick := make(map[string]map[NodeID]bool)

	for _, ct := range triggers {
		if _, ok := graphs[ct.graphID]; !ok {
			continue
		}

		if e.triggerInCooldown(ct.graphID, ct.nodeID, now, ct.config.CooldownMs) {
			e.cooldownSkips.Add(1)
			logger.Debug("trigger skipped: in cooldown",
				"automation_id", ct.graphID, "node_id", ct.nodeID, "cooldown_ms", ct.config.CooldownMs)
			continue
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
}

// FireManualTrigger fires a manual trigger node directly. Per-trigger cooldown
// still applies. Returns an error if the automation is not currently loaded
// (disabled or unknown) or the named node is not a manual trigger.
func (e *Engine) FireManualTrigger(_ context.Context, automationID string, nodeID NodeID) error {
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
	tc, ok := node.Config.(TriggerConfig)
	if !ok || tc.Kind != TriggerManual {
		return fmt.Errorf("node %q is not a manual trigger", nodeID)
	}

	now := e.now()
	if e.triggerInCooldown(automationID, nodeID, now, tc.CooldownMs) {
		return nil
	}
	e.recordTriggerFired(automationID, nodeID, now)

	env := buildScheduledEnv(e.reader, now)
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

	now := e.now()
	if e.triggerInCooldown(automationID, nodeID, now, tc.CooldownMs) {
		return
	}
	e.recordTriggerFired(automationID, nodeID, now)

	env := buildScheduledEnv(e.reader, now)
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

	// Two-tier reachability gate.
	//
	// forwardReachable: nodes downstream of a fired trigger. These are the
	// nodes the event actually drove. Operators and actions only fire when
	// they sit in this set — their "active" state is meaningful only as a
	// consequence of an event flowing through them.
	//
	// reachable: forwardReachable plus the ancestors of those nodes. The
	// backward pass pulls in inputs that operators in the forward set need
	// to evaluate (e.g. a side condition on an AND with a firing trigger
	// as its other input). Conditions in this expanded set get evaluated;
	// operators in this set but not in forwardReachable are NOT evaluated
	// and stay at their zero-value active=false. Without this distinction
	// a NOT pulled in purely for backward eval would invert a zero-value
	// trigger to true and propagate that bogus state down to a forward-
	// reachable action, firing it for an event it has no logical relation
	// to.
	forwardReachable := make(map[NodeID]bool)
	fwdQueue := make([]NodeID, 0, len(triggerResults))
	for id, fired := range triggerResults {
		if fired {
			forwardReachable[id] = true
			fwdQueue = append(fwdQueue, id)
		}
	}
	for len(fwdQueue) > 0 {
		id := fwdQueue[0]
		fwdQueue = fwdQueue[1:]
		for _, next := range cg.outgoingMap[id] {
			if !forwardReachable[next] {
				forwardReachable[next] = true
				fwdQueue = append(fwdQueue, next)
			}
		}
	}
	reachable := make(map[NodeID]bool, len(forwardReachable))
	for id := range forwardReachable {
		reachable[id] = true
	}
	backQueue := make([]NodeID, 0, len(reachable))
	for id := range reachable {
		backQueue = append(backQueue, id)
	}
	for len(backQueue) > 0 {
		id := backQueue[0]
		backQueue = backQueue[1:]
		for _, prev := range cg.incomingMap[id] {
			if !reachable[prev] {
				reachable[prev] = true
				backQueue = append(backQueue, prev)
			}
		}
	}

	anyActionFired := false

	for _, nodeID := range cg.topoOrder {
		if !reachable[nodeID] {
			continue
		}
		node := cg.nodes[nodeID]

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
				continue
			}
			active[nodeID] = result
			e.publishNodeActivation(cg.automationID, nodeID, result)

		case NodeOperator:
			if !forwardReachable[nodeID] {
				continue
			}
			opCfg, ok := node.Config.(OperatorConfig)
			if !ok {
				continue
			}
			incoming := cg.incomingMap[nodeID]
			nodeActive := evaluateOperator(opCfg.Kind, incoming, active)
			active[nodeID] = nodeActive
			e.publishNodeActivation(cg.automationID, nodeID, nodeActive)

		case NodeAction:
			incoming := cg.incomingMap[nodeID]
			anyActive := false
			for _, src := range incoming {
				if active[src] {
					anyActive = true
					break
				}
			}
			if anyActive {
				active[nodeID] = true
				e.publishNodeActivation(cg.automationID, nodeID, true)
				e.executeAction(node, cg.automationID)
				anyActionFired = true
			}
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
	case OperatorNot:
		if len(incoming) != 1 {
			return false
		}
		return !active[incoming[0]]
	default:
		return false
	}
}

func (e *Engine) executeAction(node Node, automationID string) {
	actionCfg, ok := node.Config.(ActionConfig)
	if !ok {
		return
	}
	actionCfg.AutomationID = automationID

	// Alarm actions are not target-scoped; they fire exactly once per
	// activation regardless of device/group/room membership. Run-effect
	// actions are also not fanned out: the runner accepts a group/room
	// target and re-resolves members at each iteration boundary.
	if actionCfg.ActionType == ActionRaiseAlarm || actionCfg.ActionType == ActionClearAlarm || actionCfg.ActionType == ActionRunEffect {
		e.executor.ExecuteGraphAction(actionCfg)
		return
	}

	deviceIDs := e.resolver.ResolveTargetDeviceIDs(
		e.baseCtx,
		device.TargetType(actionCfg.TargetType),
		actionCfg.TargetID,
	)

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
	nodeMap := make(map[NodeID]Node, len(g.Nodes))
	for _, n := range g.Nodes {
		nodeMap[n.ID] = n
	}

	incomingMap := make(map[NodeID][]NodeID, len(g.Nodes))
	outgoingMap := make(map[NodeID][]NodeID, len(g.Nodes))
	for _, e := range g.Edges {
		incomingMap[e.ToNodeID] = append(incomingMap[e.ToNodeID], e.FromNodeID)
		outgoingMap[e.FromNodeID] = append(outgoingMap[e.FromNodeID], e.ToNodeID)
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
		outgoingMap:  outgoingMap,
		conditions:   conditions,
	}

	return cg, triggers, nil
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

func mapStoreToDomain(sg store.AutomationGraph) AutomationGraph {
	g := AutomationGraph{
		ID:      sg.Automation.ID,
		Name:    sg.Automation.Name,
		Enabled: sg.Automation.Enabled,
	}

	for _, sn := range sg.Nodes {
		n := Node{
			ID:           NodeID(sn.ID),
			AutomationID: sn.AutomationID,
			Type:         NodeType(sn.Type),
			Config:       parseNodeConfig(NodeType(sn.Type), sn.Config),
			PositionX:    sn.PositionX,
			PositionY:    sn.PositionY,
		}
		g.Nodes = append(g.Nodes, n)
	}

	for _, se := range sg.Edges {
		g.Edges = append(g.Edges, Edge{
			AutomationID: se.AutomationID,
			FromNodeID:   NodeID(se.FromNodeID),
			ToNodeID:     NodeID(se.ToNodeID),
		})
	}

	return g
}

func parseNodeConfig(nodeType NodeType, configJSON string) NodeConfig {
	switch nodeType {
	case NodeTrigger:
		var raw struct {
			Kind       string `json:"kind"`
			EventType  string `json:"event_type"`
			FilterExpr string `json:"filter_expr"`
			CronExpr   string `json:"cron_expr"`
			GraceMs    int64  `json:"grace_ms"`
			CooldownMs int64  `json:"cooldown_ms"`
		}
		if err := json.Unmarshal([]byte(configJSON), &raw); err != nil {
			logger.Error("failed to parse trigger config", "error", err)
			return TriggerConfig{}
		}
		kind := TriggerKind(raw.Kind)
		if kind == "" {
			if raw.CronExpr != "" {
				kind = TriggerSchedule
			} else {
				kind = TriggerEvent
			}
		}
		if kind == TriggerManual {
			return TriggerConfig{Kind: TriggerManual, GraceMs: raw.GraceMs, CooldownMs: raw.CooldownMs}
		}
		return TriggerConfig{
			Kind:       kind,
			EventType:  raw.EventType,
			FilterExpr: raw.FilterExpr,
			CronExpr:   raw.CronExpr,
			GraceMs:    raw.GraceMs,
			CooldownMs: raw.CooldownMs,
		}
	case NodeCondition:
		var raw struct {
			Expr string `json:"expr"`
		}
		if err := json.Unmarshal([]byte(configJSON), &raw); err != nil {
			logger.Error("failed to parse condition config", "error", err)
			return ConditionConfig{}
		}
		return ConditionConfig{Expr: raw.Expr}
	case NodeOperator:
		var raw struct {
			Kind string `json:"kind"`
		}
		if err := json.Unmarshal([]byte(configJSON), &raw); err != nil {
			logger.Error("failed to parse operator config", "error", err)
			return OperatorConfig{}
		}
		return OperatorConfig{Kind: OperatorKind(raw.Kind)}
	case NodeAction:
		var raw struct {
			ActionType string `json:"action_type"`
			TargetType string `json:"target_type"`
			TargetID   string `json:"target_id"`
			Payload    string `json:"payload"`
		}
		if err := json.Unmarshal([]byte(configJSON), &raw); err != nil {
			logger.Error("failed to parse action config", "error", err)
			return ActionConfig{}
		}
		tt := TargetType(raw.TargetType)
		if tt == "" {
			tt = TargetDevice
		}
		return ActionConfig{
			ActionType: raw.ActionType,
			TargetType: tt,
			TargetID:   raw.TargetID,
			Payload:    raw.Payload,
		}
	default:
		return nil
	}
}
