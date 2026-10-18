package graph

import (
	"context"
	"fmt"
	"github.com/vektah/gqlparser/v2/gqlerror"

	"github.com/saffronjam/saffron-hive/internal/automation"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/graph/model"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func automationEdgeInputs(g store.AutomationGraph) []*model.AutomationEdgeInput {
	out := make([]*model.AutomationEdgeInput, 0, len(g.Edges))
	for _, e := range g.Edges {
		out = append(out, &model.AutomationEdgeInput{FromNodeID: e.FromNodeID, ToNodeID: e.ToNodeID})
	}
	return out
}

func compileAutomationNodes(nodes []*model.AutomationNodeInput) ([]store.CreateAutomationNodeParams, error) {
	ns := make([]store.CreateAutomationNodeParams, 0, len(nodes))
	for _, n := range nodes {
		config, err := automation.CompileAuthoring(automation.NodeType(n.Type), *n.Config)
		if err != nil {
			return nil, fmt.Errorf("node %s: %w", n.ID, err)
		}
		ns = append(ns, store.CreateAutomationNodeParams{ID: n.ID, Type: n.Type, Config: config, PositionX: n.PositionX, PositionY: n.PositionY})
	}
	return ns, nil
}

func automationGraphParams(nodes []store.CreateAutomationNodeParams, edges []*model.AutomationEdgeInput) ([]store.CreateAutomationNodeParams, []store.CreateAutomationEdgeParams) {
	es := make([]store.CreateAutomationEdgeParams, 0, len(edges))
	for _, e := range edges {
		es = append(es, store.CreateAutomationEdgeParams{FromNodeID: e.FromNodeID, ToNodeID: e.ToNodeID})
	}
	return nodes, es
}

func validateAutomationSave(ctx context.Context, s GraphStore, definitions string, nodes []store.CreateAutomationNodeParams, edges []*model.AutomationEdgeInput, enabled bool) error {
	ids := make(map[string]bool, len(nodes))
	for _, n := range nodes {
		if n.ID == "" || ids[n.ID] {
			return fmt.Errorf("node IDs must be non-empty and unique: %q", n.ID)
		}
		ids[n.ID] = true
		switch automation.NodeType(n.Type) {
		case automation.NodeTrigger, automation.NodeCondition, automation.NodeOperator, automation.NodeAction:
		default:
			return fmt.Errorf("node %s: unknown type %q", n.ID, n.Type)
		}
		if err := automation.ValidateNodeShape(automation.NodeType(n.Type), n.Config); err != nil {
			return fmt.Errorf("node %s: %w", n.ID, err)
		}
	}
	seen := map[[2]string]bool{}
	for _, e := range edges {
		key := [2]string{e.FromNodeID, e.ToNodeID}
		if !ids[e.FromNodeID] || !ids[e.ToNodeID] || seen[key] {
			return fmt.Errorf("invalid or duplicate edge %s -> %s", e.FromNodeID, e.ToNodeID)
		}
		seen[key] = true
	}
	if enabled {
		validation := automationValidation(ctx, s, definitions, nodes, edges)
		if !validation.Valid {
			return &gqlerror.Error{Message: "configuration is invalid", Extensions: map[string]any{"code": "CONFIGURATION_INVALID", "issues": validation.Issues}}
		}
		return nil
	}
	if _, err := automation.ParseDefinitions(definitions); err != nil {
		return err
	}
	return nil
}

func validateEntityReference(ctx context.Context, s GraphStore, kind, id string) error {
	var err error
	switch kind {
	case "device":
		_, err = s.GetDevice(ctx, device.DeviceID(id))
	case "room":
		_, err = s.GetRoom(ctx, id)
	case "group":
		_, err = s.GetGroup(ctx, id)
	default:
		return fmt.Errorf("unknown target type %q", kind)
	}
	if err != nil {
		return fmt.Errorf("%s %q not found: %w", kind, id, err)
	}
	return nil
}

func automationValidation(ctx context.Context, s GraphStore, definitions string, nodes []store.CreateAutomationNodeParams, edges []*model.AutomationEdgeInput) *model.ConfigurationValidation {
	result := &model.ConfigurationValidation{Valid: true, Issues: []*model.ConfigurationIssue{}}
	add := func(code, path string, id *string, message string) {
		result.Issues = append(result.Issues, &model.ConfigurationIssue{Code: code, Path: path, NodeID: id, Severity: "error", Message: message})
		result.Valid = false
	}
	defs, err := automation.ParseDefinitions(definitions)
	if err != nil {
		add("INVALID_DEFINITIONS", "definitions", nil, err.Error())
		return result
	}
	graph := automation.AutomationGraph{}
	for i, n := range nodes {
		config, err := defs.ParseNodeConfig(automation.NodeType(n.Type), n.Config)
		if err != nil {
			id := n.ID
			add("INVALID_NODE_CONFIG", fmt.Sprintf("nodes[%d].config", i), &id, err.Error())
		}
		graph.Nodes = append(graph.Nodes, automation.Node{ID: automation.NodeID(n.ID), Type: automation.NodeType(n.Type), Config: config})
	}
	for _, edge := range edges {
		graph.Edges = append(graph.Edges, automation.Edge{FromNodeID: automation.NodeID(edge.FromNodeID), ToNodeID: automation.NodeID(edge.ToNodeID)})
	}
	validation := automation.ValidateGraph(graph)
	for _, issue := range validation.Errors {
		var id *string
		path := "edges"
		if issue.NodeID != "" {
			value := string(issue.NodeID)
			id = &value
			for i, n := range nodes {
				if n.ID == value && issue.Field != "edges" {
					path = fmt.Sprintf("nodes[%d].config", i)
					break
				}
			}
		}
		add("INVALID_GRAPH", path, id, issue.Message)
	}
	for _, issue := range validation.Warnings {
		var id *string
		if issue.NodeID != "" {
			value := string(issue.NodeID)
			id = &value
		}
		result.Issues = append(result.Issues, &model.ConfigurationIssue{Code: "GRAPH_WARNING", Path: "nodes", NodeID: id, Severity: "warning", Message: issue.Message})
	}
	for i, node := range nodes {
		if _, err := defs.ParseNodeConfig(automation.NodeType(node.Type), node.Config); err != nil {
			continue
		}
		if err := validateAutomationReferences(ctx, s, definitions, []store.CreateAutomationNodeParams{node}); err != nil {
			id := node.ID
			add("INVALID_REFERENCE", fmt.Sprintf("nodes[%d].config", i), &id, err.Error())
		}
	}
	return result
}
