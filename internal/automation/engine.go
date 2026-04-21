package automation

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"github.com/expr-lang/expr/vm"
	"github.com/robfig/cron/v3"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

type compiledTrigger struct {
	nodeID  NodeID
	graphID string
	config  TriggerConfig
	program *vm.Program // only for event triggers; nil for schedule triggers
}

type compiledGraph struct {
	automationID    string
	cooldownSeconds float64
	nodes           map[NodeID]Node
	topoOrder       []NodeID
	incomingMap     map[NodeID][]NodeID
	outgoingMap     map[NodeID][]NodeID
	conditions      map[NodeID]*vm.Program
}

var logger = slog.Default().With("pkg", "automation")

// automationStore is the narrow subset of store methods the engine and action
// executor need. *store.DB satisfies it implicitly.
type automationStore interface {
	ListEnabledAutomations(ctx context.Context) ([]store.Automation, error)
	GetAutomationGraph(ctx context.Context, automationID string) (store.AutomationGraph, error)
	ListSceneActions(ctx context.Context, sceneID string) ([]store.SceneAction, error)
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

	mu         sync.RWMutex
	triggers   map[string][]compiledTrigger
	graphs     map[string]compiledGraph
	cooldowns  map[string]time.Time
	cron       *cron.Cron
	cronByNode map[NodeID]cron.EntryID
}

// NewEngine creates a new automation Engine. alarmSvc may be nil in tests
// that don't exercise alarm actions.
func NewEngine(bus eventbus.EventBus, reader device.StateReader, s automationStore, resolver device.TargetResolver, alarmSvc AlarmRaiser) *Engine {
	return &Engine{
		bus:        bus,
		reader:     reader,
		store:      s,
		resolver:   resolver,
		executor:   NewActionExecutor(bus, reader, s, resolver, alarmSvc),
		now:        time.Now,
		triggers:   make(map[string][]compiledTrigger),
		graphs:     make(map[string]compiledGraph),
		cooldowns:  make(map[string]time.Time),
		cronByNode: make(map[NodeID]cron.EntryID),
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

	evaluatedGraphs := make(map[string]map[NodeID]bool)

	for _, ct := range triggers {
		cg, ok := graphs[ct.graphID]
		if !ok {
			continue
		}

		if e.inCooldown(ct.graphID, now, cg.cooldownSeconds) {
			continue
		}

		if evaluatedGraphs[ct.graphID] == nil {
			evaluatedGraphs[ct.graphID] = make(map[NodeID]bool)
		}

		result, err := evalExpr(ct.program, env)
		if err != nil {
			logger.Error("trigger eval error", "graph_id", ct.graphID, "node_id", ct.nodeID, "error", err)
			continue
		}
		evaluatedGraphs[ct.graphID][ct.nodeID] = result
	}

	for graphID, triggerResults := range evaluatedGraphs {
		cg := graphs[graphID]
		if e.inCooldown(graphID, now, cg.cooldownSeconds) {
			continue
		}
		if e.evaluateGraph(cg, env, triggerResults) {
			e.recordFired(graphID, now)
		}
	}
}

// FireManualTrigger fires a manual trigger node directly, bypassing the event
// bus and the automation's cooldown. It returns an error if the automation is
// not currently loaded (disabled or unknown) or the named node is not a
// manual trigger.
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
	env := buildScheduledEnv(e.reader, now)
	triggerResults := map[NodeID]bool{nodeID: true}
	if e.evaluateGraph(cg, env, triggerResults) {
		e.recordFired(automationID, now)
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

	now := e.now()
	if e.inCooldown(automationID, now, cg.cooldownSeconds) {
		return
	}

	env := buildScheduledEnv(e.reader, now)
	triggerResults := map[NodeID]bool{nodeID: true}
	if e.evaluateGraph(cg, env, triggerResults) {
		e.recordFired(automationID, now)
	}
}

func (e *Engine) evaluateGraph(cg compiledGraph, env ExprEnv, triggerResults map[NodeID]bool) bool {
	active := make(map[NodeID]bool)
	for id, result := range triggerResults {
		active[id] = result
	}

	// Reachable set: BFS from the triggers that actually fired. Activation
	// events are published only for these nodes so the live view doesn't light
	// up unrelated chains whose conditions/operators happen to evaluate along
	// the side. The firing logic below (active map, allSatisfied) is
	// independent of reachability — this gate is purely for visualization.
	reachable := make(map[NodeID]bool)
	queue := make([]NodeID, 0, len(triggerResults))
	for id, fired := range triggerResults {
		if fired {
			reachable[id] = true
			queue = append(queue, id)
		}
	}
	for len(queue) > 0 {
		id := queue[0]
		queue = queue[1:]
		for _, next := range cg.outgoingMap[id] {
			if !reachable[next] {
				reachable[next] = true
				queue = append(queue, next)
			}
		}
	}

	anyActionFired := false

	for _, nodeID := range cg.topoOrder {
		node := cg.nodes[nodeID]

		switch node.Type {
		case NodeTrigger:
			if active[nodeID] && reachable[nodeID] {
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
			if reachable[nodeID] {
				e.publishNodeActivation(cg.automationID, nodeID, result)
			}

		case NodeOperator:
			opCfg, ok := node.Config.(OperatorConfig)
			if !ok {
				continue
			}
			incoming := cg.incomingMap[nodeID]
			nodeActive := evaluateOperator(opCfg.Kind, incoming, active)
			active[nodeID] = nodeActive
			if reachable[nodeID] {
				e.publishNodeActivation(cg.automationID, nodeID, nodeActive)
			}

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
				if reachable[nodeID] {
					e.publishNodeActivation(cg.automationID, nodeID, true)
				}
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
	// activation regardless of device/group/room membership.
	if actionCfg.ActionType == ActionRaiseAlarm || actionCfg.ActionType == ActionClearAlarm {
		e.executor.ExecuteGraphAction(actionCfg)
		return
	}

	deviceIDs := e.resolver.ResolveTargetDeviceIDs(
		context.Background(),
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

func (e *Engine) inCooldown(automationID string, now time.Time, cooldownSeconds float64) bool {
	if cooldownSeconds <= 0 {
		return false
	}

	e.mu.RLock()
	lastFired, exists := e.cooldowns[automationID]
	e.mu.RUnlock()

	if !exists {
		return false
	}

	return now.Before(lastFired.Add(time.Duration(cooldownSeconds * float64(time.Second))))
}

func (e *Engine) recordFired(automationID string, now time.Time) {
	e.mu.Lock()
	e.cooldowns[automationID] = now
	e.mu.Unlock()

	if err := e.store.UpdateAutomationLastFired(context.Background(), automationID, now); err != nil {
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
		automationID:    g.ID,
		cooldownSeconds: g.CooldownSeconds,
		nodes:           nodeMap,
		topoOrder:       order,
		incomingMap:     incomingMap,
		outgoingMap:     outgoingMap,
		conditions:      conditions,
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
		ID:              sg.Automation.ID,
		Name:            sg.Automation.Name,
		Enabled:         sg.Automation.Enabled,
		CooldownSeconds: sg.Automation.CooldownSeconds,
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
			ID:           se.ID,
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
			Kind          string `json:"kind"`
			EventType     string `json:"event_type"`
			FilterExpr    string `json:"filter_expr"`
			ConditionExpr string `json:"condition_expr"` // legacy field for backward compat
			CronExpr      string `json:"cron_expr"`
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
			return TriggerConfig{Kind: TriggerManual}
		}
		filter := raw.FilterExpr
		if filter == "" {
			filter = raw.ConditionExpr
		}
		return TriggerConfig{
			Kind:       kind,
			EventType:  raw.EventType,
			FilterExpr: filter,
			CronExpr:   raw.CronExpr,
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
