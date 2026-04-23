package store

import (
	"context"
	"testing"
)

func TestCreateAutomation(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	a, err := s.CreateAutomation(ctx, CreateAutomationParams{
		ID:      "auto-1",
		Name:    "Night Light",
		Enabled: true,
	})
	if err != nil {
		t.Fatalf("create automation: %v", err)
	}

	if a.ID != "auto-1" {
		t.Errorf("got ID %q, want %q", a.ID, "auto-1")
	}
	if a.Name != "Night Light" {
		t.Errorf("got Name %q, want %q", a.Name, "Night Light")
	}
	if !a.Enabled {
		t.Error("expected Enabled to be true")
	}
	if a.CreatedAt.IsZero() {
		t.Error("expected CreatedAt to be set")
	}
}

func TestCreateAutomationGraphAndRetrieve(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateAutomation(ctx, CreateAutomationParams{
		ID: "auto-1", Name: "Test Graph", Enabled: true,
	})
	if err != nil {
		t.Fatalf("create automation: %v", err)
	}

	_, err = s.CreateAutomationNode(ctx, CreateAutomationNodeParams{
		ID: "n1", AutomationID: "auto-1", Type: "trigger",
		Config: `{"event_type":"device.state_changed","condition_expr":"true"}`,
	})
	if err != nil {
		t.Fatalf("create node: %v", err)
	}

	_, err = s.CreateAutomationNode(ctx, CreateAutomationNodeParams{
		ID: "n2", AutomationID: "auto-1", Type: "action",
		Config: `{"action_type":"set_device_state","payload":"{\"on\":true}"}`,
	})
	if err != nil {
		t.Fatalf("create node: %v", err)
	}

	_, err = s.CreateAutomationEdge(ctx, CreateAutomationEdgeParams{
		ID: "e1", AutomationID: "auto-1", FromNodeID: "n1", ToNodeID: "n2",
	})
	if err != nil {
		t.Fatalf("create edge: %v", err)
	}

	graph, err := s.GetAutomationGraph(ctx, "auto-1")
	if err != nil {
		t.Fatalf("get graph: %v", err)
	}

	if graph.Automation.ID != "auto-1" {
		t.Errorf("got automation ID %q, want %q", graph.Automation.ID, "auto-1")
	}
	if len(graph.Nodes) != 2 {
		t.Fatalf("got %d nodes, want 2", len(graph.Nodes))
	}
	if len(graph.Edges) != 1 {
		t.Fatalf("got %d edges, want 1", len(graph.Edges))
	}
	if graph.Edges[0].FromNodeID != "n1" || graph.Edges[0].ToNodeID != "n2" {
		t.Errorf("edge from %q to %q, want n1->n2", graph.Edges[0].FromNodeID, graph.Edges[0].ToNodeID)
	}
}

func TestDeleteAutomationCascadesNodesAndEdges(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateAutomation(ctx, CreateAutomationParams{
		ID: "auto-1", Name: "Test", Enabled: true,
	})
	if err != nil {
		t.Fatalf("create automation: %v", err)
	}

	_, err = s.CreateAutomationNode(ctx, CreateAutomationNodeParams{
		ID: "n1", AutomationID: "auto-1", Type: "trigger",
		Config: `{"event_type":"device.state_changed"}`,
	})
	if err != nil {
		t.Fatalf("create node: %v", err)
	}

	_, err = s.CreateAutomationNode(ctx, CreateAutomationNodeParams{
		ID: "n2", AutomationID: "auto-1", Type: "action",
		Config: `{"action_type":"set_device_state","payload":"{}"}`,
	})
	if err != nil {
		t.Fatalf("create node: %v", err)
	}

	_, err = s.CreateAutomationEdge(ctx, CreateAutomationEdgeParams{
		ID: "e1", AutomationID: "auto-1", FromNodeID: "n1", ToNodeID: "n2",
	})
	if err != nil {
		t.Fatalf("create edge: %v", err)
	}

	if err := s.DeleteAutomation(ctx, "auto-1"); err != nil {
		t.Fatalf("delete: %v", err)
	}

	nodes, err := s.ListAutomationNodes(ctx, "auto-1")
	if err != nil {
		t.Fatalf("list nodes: %v", err)
	}
	if len(nodes) != 0 {
		t.Errorf("got %d nodes after delete, want 0", len(nodes))
	}

	edges, err := s.ListAutomationEdges(ctx, "auto-1")
	if err != nil {
		t.Fatalf("list edges: %v", err)
	}
	if len(edges) != 0 {
		t.Errorf("got %d edges after delete, want 0", len(edges))
	}
}

func TestListEnabledAutomations(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	for _, tc := range []struct {
		id      string
		enabled bool
	}{
		{"auto-1", true},
		{"auto-2", true},
		{"auto-3", false},
	} {
		_, err := s.CreateAutomation(ctx, CreateAutomationParams{
			ID: tc.id, Name: tc.id, Enabled: tc.enabled,
		})
		if err != nil {
			t.Fatalf("create automation %s: %v", tc.id, err)
		}
	}

	enabled, err := s.ListEnabledAutomations(ctx)
	if err != nil {
		t.Fatalf("list enabled: %v", err)
	}
	if len(enabled) != 2 {
		t.Fatalf("got %d enabled automations, want 2", len(enabled))
	}
}

func TestToggleAutomation(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateAutomation(ctx, CreateAutomationParams{
		ID: "auto-1", Name: "Test", Enabled: true,
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	if err := s.UpdateAutomationEnabled(ctx, "auto-1", false); err != nil {
		t.Fatalf("toggle: %v", err)
	}

	a, err := s.GetAutomation(ctx, "auto-1")
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if a.Enabled {
		t.Error("expected Enabled to be false")
	}
}

func TestDeleteAutomationNode(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateAutomation(ctx, CreateAutomationParams{
		ID: "auto-1", Name: "Test", Enabled: true,
	})
	if err != nil {
		t.Fatalf("create automation: %v", err)
	}

	_, err = s.CreateAutomationNode(ctx, CreateAutomationNodeParams{
		ID: "n1", AutomationID: "auto-1", Type: "trigger",
		Config: `{"event_type":"device.state_changed"}`,
	})
	if err != nil {
		t.Fatalf("create node: %v", err)
	}

	if err := s.DeleteAutomationNode(ctx, "n1"); err != nil {
		t.Fatalf("delete node: %v", err)
	}

	nodes, err := s.ListAutomationNodes(ctx, "auto-1")
	if err != nil {
		t.Fatalf("list nodes: %v", err)
	}
	if len(nodes) != 0 {
		t.Errorf("got %d nodes, want 0", len(nodes))
	}
}

func TestDeleteAutomationEdge(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateAutomation(ctx, CreateAutomationParams{
		ID: "auto-1", Name: "Test", Enabled: true,
	})
	if err != nil {
		t.Fatalf("create automation: %v", err)
	}

	_, err = s.CreateAutomationNode(ctx, CreateAutomationNodeParams{
		ID: "n1", AutomationID: "auto-1", Type: "trigger",
		Config: `{"event_type":"device.state_changed"}`,
	})
	if err != nil {
		t.Fatalf("create node n1: %v", err)
	}

	_, err = s.CreateAutomationNode(ctx, CreateAutomationNodeParams{
		ID: "n2", AutomationID: "auto-1", Type: "action",
		Config: `{"action_type":"set_device_state","payload":"{}"}`,
	})
	if err != nil {
		t.Fatalf("create node n2: %v", err)
	}

	_, err = s.CreateAutomationEdge(ctx, CreateAutomationEdgeParams{
		ID: "e1", AutomationID: "auto-1", FromNodeID: "n1", ToNodeID: "n2",
	})
	if err != nil {
		t.Fatalf("create edge: %v", err)
	}

	if err := s.DeleteAutomationEdge(ctx, "e1"); err != nil {
		t.Fatalf("delete edge: %v", err)
	}

	edges, err := s.ListAutomationEdges(ctx, "auto-1")
	if err != nil {
		t.Fatalf("list edges: %v", err)
	}
	if len(edges) != 0 {
		t.Errorf("got %d edges, want 0", len(edges))
	}
}
