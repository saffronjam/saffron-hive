package automation

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/expr-lang/expr/vm"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

type compiledTrigger struct {
	nodeID  NodeID
	graphID string
	config  TriggerConfig
	program *vm.Program
}

type compiledGraph struct {
	automationID    string
	cooldownSeconds int
	nodes           map[NodeID]Node
	topoOrder       []NodeID
	incomingMap     map[NodeID][]NodeID
}

// Engine evaluates automation graphs against incoming events.
type Engine struct {
	bus      eventbus.EventBus
	reader   device.StateReader
	store    store.Store
	executor *ActionExecutor
	now      func() time.Time

	mu        sync.RWMutex
	triggers  map[string][]compiledTrigger
	graphs    map[string]compiledGraph
	cooldowns map[string]time.Time
}

// NewEngine creates a new automation Engine.
func NewEngine(bus eventbus.EventBus, reader device.StateReader, s store.Store) *Engine {
	return &Engine{
		bus:       bus,
		reader:    reader,
		store:     s,
		executor:  NewActionExecutor(bus, reader, s),
		now:       time.Now,
		triggers:  make(map[string][]compiledTrigger),
		graphs:    make(map[string]compiledGraph),
		cooldowns: make(map[string]time.Time),
	}
}

// Reload loads enabled automation graphs from the store, replacing the current set.
func (e *Engine) Reload(ctx context.Context) error {
	autos, err := e.store.ListEnabledAutomations(ctx)
	if err != nil {
		return err
	}

	triggersByEvent := make(map[string][]compiledTrigger)
	graphs := make(map[string]compiledGraph)

	for _, a := range autos {
		graph, err := e.store.GetAutomationGraph(ctx, a.ID)
		if err != nil {
			log.Printf("automation: skipping %s (%s): cannot load graph: %v", a.ID, a.Name, err)
			continue
		}

		domainGraph := mapStoreToDomain(graph)
		cg, triggers, err := compileGraph(domainGraph)
		if err != nil {
			log.Printf("automation: skipping %s (%s): compile error: %v", a.ID, a.Name, err)
			continue
		}

		graphs[a.ID] = cg

		for _, ct := range triggers {
			triggersByEvent[ct.config.EventType] = append(triggersByEvent[ct.config.EventType], ct)
		}
	}

	e.mu.Lock()
	e.triggers = triggersByEvent
	e.graphs = graphs
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
	triggers := e.triggers[string(event.Type)]
	graphs := e.graphs
	e.mu.RUnlock()

	now := e.now()

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

		env := buildEnv(e.reader, event, now)
		result, err := evalExpr(ct.program, env)
		if err != nil {
			log.Printf("automation: %s trigger %s eval error: %v", ct.graphID, ct.nodeID, err)
			continue
		}
		evaluatedGraphs[ct.graphID][ct.nodeID] = result
	}

	for graphID, triggerResults := range evaluatedGraphs {
		cg := graphs[graphID]
		if e.inCooldown(graphID, now, cg.cooldownSeconds) {
			continue
		}
		if e.evaluateGraph(cg, triggerResults) {
			e.recordFired(graphID, now)
		}
	}
}

func (e *Engine) evaluateGraph(cg compiledGraph, triggerResults map[NodeID]bool) bool {
	active := make(map[NodeID]bool)
	for id, result := range triggerResults {
		active[id] = result
	}

	anyActionFired := false

	for _, nodeID := range cg.topoOrder {
		node := cg.nodes[nodeID]

		switch node.Type {
		case NodeTrigger:
			if active[nodeID] {
				e.publishNodeActivation(cg.automationID, nodeID, true)
			}

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
			incoming := cg.incomingMap[nodeID]
			allSatisfied := len(incoming) > 0
			for _, src := range incoming {
				if !active[src] {
					allSatisfied = false
					break
				}
			}
			if allSatisfied {
				active[nodeID] = true
				e.publishNodeActivation(cg.automationID, nodeID, true)
				e.executeAction(node)
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

func (e *Engine) executeAction(node Node) {
	actionCfg, ok := node.Config.(ActionConfig)
	if !ok {
		return
	}

	switch actionCfg.TargetType {
	case TargetDevice:
		e.executor.ExecuteGraphAction(actionCfg)
	case TargetGroup:
		groupID := device.GroupID(actionCfg.TargetID)
		deviceIDs := e.reader.ResolveGroupDevices(groupID)
		for _, devID := range deviceIDs {
			perDevice := ActionConfig{
				ActionType: actionCfg.ActionType,
				TargetType: TargetDevice,
				TargetID:   string(devID),
				Payload:    actionCfg.Payload,
			}
			e.executor.ExecuteGraphAction(perDevice)
		}
	default:
		if actionCfg.TargetID != "" {
			e.executor.ExecuteGraphAction(actionCfg)
		}
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

func compileGraph(g AutomationGraph) (compiledGraph, []compiledTrigger, error) {
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
	for _, n := range g.Nodes {
		if n.Type != NodeTrigger {
			continue
		}
		tc, ok := n.Config.(TriggerConfig)
		if !ok {
			continue
		}
		exprStr := tc.ConditionExpr
		if exprStr == "" {
			exprStr = "true"
		}
		prog, err := compileExpr(exprStr)
		if err != nil {
			return compiledGraph{}, nil, fmt.Errorf("trigger %s: %w", n.ID, err)
		}
		triggers = append(triggers, compiledTrigger{
			nodeID:  n.ID,
			graphID: g.ID,
			config:  tc,
			program: prog,
		})
	}

	cg := compiledGraph{
		automationID:    g.ID,
		cooldownSeconds: g.CooldownSeconds,
		nodes:           nodeMap,
		topoOrder:       order,
		incomingMap:     incomingMap,
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
			EventType     string `json:"event_type"`
			ConditionExpr string `json:"condition_expr"`
		}
		if err := json.Unmarshal([]byte(configJSON), &raw); err != nil {
			log.Printf("automation: failed to parse trigger config: %v", err)
			return TriggerConfig{}
		}
		return TriggerConfig{
			EventType:     raw.EventType,
			ConditionExpr: raw.ConditionExpr,
		}
	case NodeOperator:
		var raw struct {
			Kind string `json:"kind"`
		}
		if err := json.Unmarshal([]byte(configJSON), &raw); err != nil {
			log.Printf("automation: failed to parse operator config: %v", err)
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
			log.Printf("automation: failed to parse action config: %v", err)
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
