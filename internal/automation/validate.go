package automation

import (
	"fmt"
	"strings"

	"github.com/robfig/cron/v3"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/webhook"
)

// ValidationError represents a structural problem found during graph validation.
type ValidationError struct {
	NodeID  NodeID
	Field   string
	Message string
}

func (e ValidationError) Error() string {
	if e.NodeID != "" {
		return fmt.Sprintf("node %s: %s", e.NodeID, e.Message)
	}
	return e.Message
}

// ValidationResult collects all errors and warnings produced by graph validation.
type ValidationResult struct {
	Errors   []ValidationError
	Warnings []ValidationError
}

// Valid returns true if no errors were found.
func (r ValidationResult) Valid() bool {
	return len(r.Errors) == 0
}

// ValidateGraph checks whether an AutomationGraph can be loaded by the engine.
// Every execution node must receive input along a path from a trigger.
// Edges must reference existing nodes and form a directed acyclic graph.
func ValidateGraph(g AutomationGraph) ValidationResult {
	var result ValidationResult

	nodeSet := make(map[NodeID]Node, len(g.Nodes))
	for _, n := range g.Nodes {
		if n.ID == "" {
			result.Errors = append(result.Errors, ValidationError{Message: "node ID is required"})
		}
		if _, exists := nodeSet[n.ID]; exists {
			result.Errors = append(result.Errors, ValidationError{NodeID: n.ID, Message: "duplicate node ID"})
		}
		nodeSet[n.ID] = n
	}

	incoming := make(map[NodeID]int, len(g.Nodes))
	outgoing := make(map[NodeID]int, len(g.Nodes))

	for _, e := range g.Edges {
		if _, ok := nodeSet[e.FromNodeID]; !ok {
			result.Errors = append(result.Errors, ValidationError{
				Message: fmt.Sprintf("edge %s->%s references non-existent source node %s", e.FromNodeID, e.ToNodeID, e.FromNodeID),
			})
		}
		if _, ok := nodeSet[e.ToNodeID]; !ok {
			result.Errors = append(result.Errors, ValidationError{
				Message: fmt.Sprintf("edge %s->%s references non-existent target node %s", e.FromNodeID, e.ToNodeID, e.ToNodeID),
			})
		}
		incoming[e.ToNodeID]++
		outgoing[e.FromNodeID]++
	}

	triggerCount := 0

	for _, n := range g.Nodes {
		in := incoming[n.ID]
		out := outgoing[n.ID]

		if n.Config == nil {
			result.Errors = append(result.Errors, ValidationError{NodeID: n.ID, Message: "node configuration is required"})
		}
		switch n.Type {
		case NodeTrigger:
			triggerCount++
			if in > 0 {
				result.Errors = append(result.Errors, ValidationError{
					NodeID:  n.ID,
					Message: "trigger node must not have incoming edges",
				})
			}
			if out == 0 && len(g.Edges) > 0 {
				result.Warnings = append(result.Warnings, ValidationError{
					NodeID:  n.ID,
					Message: "trigger node has no outgoing edges",
				})
			}
			if tc, ok := n.Config.(TriggerConfig); ok {
				switch tc.Kind {
				case TriggerSchedule:
					parser := cron.NewParser(cron.Second | cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow | cron.Descriptor)
					if _, err := parser.Parse(tc.CronExpr); err != nil {
						result.Errors = append(result.Errors, ValidationError{
							NodeID:  n.ID,
							Message: fmt.Sprintf("invalid cron expression %q: %v", tc.CronExpr, err),
						})
					}
				case "", TriggerEvent:
					if strings.TrimSpace(tc.EventType) == "" {
						result.Errors = append(result.Errors, ValidationError{NodeID: n.ID, Message: "event type is required"})
					}
				default:
					result.Errors = append(result.Errors, ValidationError{
						NodeID:  n.ID,
						Message: fmt.Sprintf("unknown trigger kind %q", tc.Kind),
					})
				}
				if tc.FilterExpr != "" {
					if err := ValidateExpression(tc.FilterExpr); err != nil {
						result.Errors = append(result.Errors, ValidationError{
							NodeID:  n.ID,
							Message: fmt.Sprintf("invalid filter expression: %v", err),
						})
					}
				}
				if err := ValidateTriggerHold(tc); err != nil {
					result.Errors = append(result.Errors, ValidationError{NodeID: n.ID, Message: err.Error()})
				}
				if tc.EventType == string(eventbus.EventWebhookReceived) {
					if tc.EndpointID == "" {
						result.Errors = append(result.Errors, ValidationError{NodeID: n.ID, Message: "incoming webhook trigger requires an endpoint"})
					}
					if err := webhook.ValidateFilters(tc.WebhookFilters); err != nil {
						result.Errors = append(result.Errors, ValidationError{NodeID: n.ID, Message: fmt.Sprintf("invalid webhook filters: %v", err)})
					}
				}
			}
		case NodeCondition:
			if out == 0 && len(g.Edges) > 0 {
				result.Warnings = append(result.Warnings, ValidationError{
					NodeID:  n.ID,
					Message: "condition node has no outgoing edges",
				})
			}
			if cc, ok := n.Config.(ConditionConfig); ok {
				if strings.TrimSpace(cc.Expr) == "" {
					result.Errors = append(result.Errors, ValidationError{NodeID: n.ID, Message: "condition expression is required"})
				}
				if err := ValidateExpression(cc.Expr); err != nil {
					result.Errors = append(result.Errors, ValidationError{
						NodeID:  n.ID,
						Message: fmt.Sprintf("invalid condition expression: %v", err),
					})
				}
			}
		case NodeAction:
			if cfg, ok := n.Config.(ActionConfig); ok {
				if err := ValidateAction(cfg); err != nil {
					result.Errors = append(result.Errors, ValidationError{NodeID: n.ID, Message: err.Error()})
				}
			}
			if out > 0 {
				result.Errors = append(result.Errors, ValidationError{
					NodeID:  n.ID,
					Message: "action node must not have outgoing edges",
				})
			}
		case NodeOperator:
			if cfg, ok := n.Config.(OperatorConfig); ok && cfg.Kind != OperatorAnd && cfg.Kind != OperatorOr {
				result.Errors = append(result.Errors, ValidationError{NodeID: n.ID, Message: "operator must be 'and' or 'or'"})
			}
			if out == 0 {
				result.Warnings = append(result.Warnings, ValidationError{
					NodeID:  n.ID,
					Message: "operator node has no outgoing edges",
				})
			}
		default:
			result.Errors = append(result.Errors, ValidationError{
				NodeID:  n.ID,
				Message: fmt.Sprintf("unknown node type %q", n.Type),
			})
		}
	}

	reachable := make(map[NodeID]bool, len(g.Nodes))
	adj := make(map[NodeID][]NodeID, len(g.Nodes))
	for _, edge := range g.Edges {
		adj[edge.FromNodeID] = append(adj[edge.FromNodeID], edge.ToNodeID)
	}
	var queue []NodeID
	for _, node := range g.Nodes {
		if node.Type == NodeTrigger {
			reachable[node.ID] = true
			queue = append(queue, node.ID)
		}
	}
	for len(queue) > 0 {
		id := queue[0]
		queue = queue[1:]
		for _, next := range adj[id] {
			if !reachable[next] {
				reachable[next] = true
				queue = append(queue, next)
			}
		}
	}
	for _, node := range g.Nodes {
		if node.Type == NodeTrigger {
			continue
		}
		if incoming[node.ID] == 0 {
			result.Errors = append(result.Errors, ValidationError{NodeID: node.ID, Field: "edges", Message: "node requires an incoming connection from a trigger path"})
		} else if !reachable[node.ID] {
			result.Errors = append(result.Errors, ValidationError{NodeID: node.ID, Field: "edges", Message: "node must be reachable from a trigger"})
		}
	}

	if cycle := detectCycle(g.Nodes, g.Edges); cycle != "" {
		result.Errors = append(result.Errors, ValidationError{
			Message: fmt.Sprintf("graph contains a cycle involving node %s", cycle),
		})
	}

	if triggerCount == 0 {
		result.Errors = append(result.Errors, ValidationError{
			Message: "automation has no trigger node; add an event or schedule trigger so the automation has something to run in response to",
		})
	}

	return result
}

func detectCycle(nodes []Node, edges []Edge) NodeID {
	adj := make(map[NodeID][]NodeID, len(nodes))
	for _, e := range edges {
		adj[e.FromNodeID] = append(adj[e.FromNodeID], e.ToNodeID)
	}

	const (
		white = 0
		gray  = 1
		black = 2
	)

	color := make(map[NodeID]int, len(nodes))
	for _, n := range nodes {
		color[n.ID] = white
	}

	var dfs func(NodeID) NodeID
	dfs = func(id NodeID) NodeID {
		color[id] = gray
		for _, neighbor := range adj[id] {
			switch color[neighbor] {
			case gray:
				return neighbor
			case white:
				if found := dfs(neighbor); found != "" {
					return found
				}
			}
		}
		color[id] = black
		return ""
	}

	for _, n := range nodes {
		if color[n.ID] == white {
			if found := dfs(n.ID); found != "" {
				return found
			}
		}
	}
	return ""
}
