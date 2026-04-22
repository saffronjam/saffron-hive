package store

import (
	"context"
	"fmt"
	"time"

	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// CreateAutomation inserts a new automation and returns it.
func (s *DB) CreateAutomation(ctx context.Context, params CreateAutomationParams) (Automation, error) {
	if err := s.q.CreateAutomation(ctx, sqlite.CreateAutomationParams{
		ID:              params.ID,
		Name:            params.Name,
		Enabled:         params.Enabled,
		CooldownSeconds: params.CooldownSeconds,
		CreatedBy:       params.CreatedBy,
	}); err != nil {
		return Automation{}, fmt.Errorf("create automation: %w", err)
	}
	return s.GetAutomation(ctx, params.ID)
}

// GetAutomation retrieves an automation by its ID.
func (s *DB) GetAutomation(ctx context.Context, id string) (Automation, error) {
	row, err := s.q.GetAutomation(ctx, id)
	if err != nil {
		return Automation{}, fmt.Errorf("get automation: %w", err)
	}
	return Automation{
		ID:              row.ID,
		Name:            row.Name,
		Icon:            row.Icon,
		Enabled:         row.Enabled,
		CooldownSeconds: row.CooldownSeconds,
		LastFiredAt:     row.LastFiredAt,
		CreatedAt:       row.CreatedAt,
		UpdatedAt:       row.UpdatedAt,
		CreatedBy:       userRefFromPtrs(row.CreatorID, row.CreatorUsername, row.CreatorName),
	}, nil
}

// ListAutomations returns all automations.
func (s *DB) ListAutomations(ctx context.Context) ([]Automation, error) {
	rows, err := s.q.ListAutomations(ctx)
	if err != nil {
		return nil, fmt.Errorf("list automations: %w", err)
	}
	var automations []Automation
	for _, r := range rows {
		automations = append(automations, Automation{
			ID:              r.ID,
			Name:            r.Name,
			Icon:            r.Icon,
			Enabled:         r.Enabled,
			CooldownSeconds: r.CooldownSeconds,
			LastFiredAt:     r.LastFiredAt,
			CreatedAt:       r.CreatedAt,
			UpdatedAt:       r.UpdatedAt,
			CreatedBy:       userRefFromPtrs(r.CreatorID, r.CreatorUsername, r.CreatorName),
		})
	}
	return automations, nil
}

// ListEnabledAutomations returns all automations where enabled is true.
func (s *DB) ListEnabledAutomations(ctx context.Context) ([]Automation, error) {
	rows, err := s.q.ListEnabledAutomations(ctx)
	if err != nil {
		return nil, fmt.Errorf("list enabled automations: %w", err)
	}
	var automations []Automation
	for _, r := range rows {
		automations = append(automations, Automation{
			ID:              r.ID,
			Name:            r.Name,
			Icon:            r.Icon,
			Enabled:         r.Enabled,
			CooldownSeconds: r.CooldownSeconds,
			LastFiredAt:     r.LastFiredAt,
			CreatedAt:       r.CreatedAt,
			UpdatedAt:       r.UpdatedAt,
			CreatedBy:       userRefFromPtrs(r.CreatorID, r.CreatorUsername, r.CreatorName),
		})
	}
	return automations, nil
}

// UpdateAutomation updates optional fields on an automation. Nil fields are left
// unchanged. SetIcon=true with Icon=nil clears the icon column; SetIcon=false
// leaves icon alone regardless of the Icon pointer.
func (s *DB) UpdateAutomation(ctx context.Context, id string, params UpdateAutomationParams) (Automation, error) {
	clearIcon := params.SetIcon && params.Icon == nil

	args := sqlite.UpdateAutomationFieldsParams{
		Name:    params.Name,
		Enabled: params.Enabled,
		ID:      id,
	}
	if params.SetIcon && params.Icon != nil {
		args.Icon = params.Icon
	}
	if params.CooldownSeconds != nil {
		v := *params.CooldownSeconds
		args.Cooldown = &v
	}
	if err := s.q.UpdateAutomationFields(ctx, args); err != nil {
		return Automation{}, fmt.Errorf("update automation: %w", err)
	}
	if clearIcon {
		if err := s.q.ClearAutomationIcon(ctx, id); err != nil {
			return Automation{}, fmt.Errorf("clear automation icon: %w", err)
		}
	}
	return s.GetAutomation(ctx, id)
}

// UpdateAutomationEnabled sets the enabled field of an automation.
func (s *DB) UpdateAutomationEnabled(ctx context.Context, id string, enabled bool) error {
	if err := s.q.UpdateAutomationEnabled(ctx, sqlite.UpdateAutomationEnabledParams{
		Enabled: enabled,
		ID:      id,
	}); err != nil {
		return fmt.Errorf("update automation enabled: %w", err)
	}
	return nil
}

// UpdateAutomationLastFired stamps last_fired_at on the given automation.
// Does not touch updated_at — "last edited" and "last fired" are distinct.
func (s *DB) UpdateAutomationLastFired(ctx context.Context, id string, firedAt time.Time) error {
	if err := s.q.UpdateAutomationLastFired(ctx, sqlite.UpdateAutomationLastFiredParams{
		LastFiredAt: &firedAt,
		ID:          id,
	}); err != nil {
		return fmt.Errorf("update automation last fired: %w", err)
	}
	return nil
}

// DeleteAutomation deletes an automation by its ID. Cascading deletes remove associated nodes and edges.
func (s *DB) DeleteAutomation(ctx context.Context, id string) error {
	if err := s.q.DeleteAutomation(ctx, id); err != nil {
		return fmt.Errorf("delete automation: %w", err)
	}
	return nil
}

// BatchDeleteAutomations deletes the automations with the given IDs. Returns
// the number of rows actually deleted; missing IDs are silently ignored.
func (s *DB) BatchDeleteAutomations(ctx context.Context, ids []string) (int64, error) {
	if len(ids) == 0 {
		return 0, nil
	}
	js, err := marshalStringArray(ids)
	if err != nil {
		return 0, fmt.Errorf("batch delete automations: %w", err)
	}
	n, err := s.q.BatchDeleteAutomations(ctx, js)
	if err != nil {
		return 0, fmt.Errorf("batch delete automations: %w", err)
	}
	return n, nil
}

// CreateAutomationNode inserts a new automation node.
func (s *DB) CreateAutomationNode(ctx context.Context, params CreateAutomationNodeParams) (AutomationNode, error) {
	if err := s.q.CreateAutomationNode(ctx, sqlite.CreateAutomationNodeParams{
		ID:           params.ID,
		AutomationID: params.AutomationID,
		Type:         params.Type,
		Config:       params.Config,
		PositionX:    params.PositionX,
		PositionY:    params.PositionY,
	}); err != nil {
		return AutomationNode{}, fmt.Errorf("create automation node: %w", err)
	}
	return AutomationNode{
		ID:           params.ID,
		AutomationID: params.AutomationID,
		Type:         params.Type,
		Config:       params.Config,
		PositionX:    params.PositionX,
		PositionY:    params.PositionY,
	}, nil
}

// ListAutomationNodes returns all nodes belonging to an automation.
func (s *DB) ListAutomationNodes(ctx context.Context, automationID string) ([]AutomationNode, error) {
	rows, err := s.q.ListAutomationNodes(ctx, automationID)
	if err != nil {
		return nil, fmt.Errorf("list automation nodes: %w", err)
	}
	var nodes []AutomationNode
	for _, r := range rows {
		nodes = append(nodes, AutomationNode{
			ID:           r.ID,
			AutomationID: r.AutomationID,
			Type:         r.Type,
			Config:       r.Config,
			PositionX:    r.PositionX,
			PositionY:    r.PositionY,
		})
	}
	return nodes, nil
}

// DeleteAutomationNode deletes an automation node by its ID.
func (s *DB) DeleteAutomationNode(ctx context.Context, id string) error {
	if err := s.q.DeleteAutomationNode(ctx, id); err != nil {
		return fmt.Errorf("delete automation node: %w", err)
	}
	return nil
}

// CreateAutomationEdge inserts a new automation edge.
func (s *DB) CreateAutomationEdge(ctx context.Context, params CreateAutomationEdgeParams) (AutomationEdge, error) {
	if err := s.q.CreateAutomationEdge(ctx, sqlite.CreateAutomationEdgeParams{
		ID:           params.ID,
		AutomationID: params.AutomationID,
		FromNodeID:   params.FromNodeID,
		ToNodeID:     params.ToNodeID,
	}); err != nil {
		return AutomationEdge{}, fmt.Errorf("create automation edge: %w", err)
	}
	return AutomationEdge{
		ID:           params.ID,
		AutomationID: params.AutomationID,
		FromNodeID:   params.FromNodeID,
		ToNodeID:     params.ToNodeID,
	}, nil
}

// ListAutomationEdges returns all edges belonging to an automation.
func (s *DB) ListAutomationEdges(ctx context.Context, automationID string) ([]AutomationEdge, error) {
	rows, err := s.q.ListAutomationEdges(ctx, automationID)
	if err != nil {
		return nil, fmt.Errorf("list automation edges: %w", err)
	}
	var edges []AutomationEdge
	for _, r := range rows {
		edges = append(edges, AutomationEdge{
			ID:           r.ID,
			AutomationID: r.AutomationID,
			FromNodeID:   r.FromNodeID,
			ToNodeID:     r.ToNodeID,
		})
	}
	return edges, nil
}

// DeleteAutomationEdge deletes an automation edge by its ID.
func (s *DB) DeleteAutomationEdge(ctx context.Context, id string) error {
	if err := s.q.DeleteAutomationEdge(ctx, id); err != nil {
		return fmt.Errorf("delete automation edge: %w", err)
	}
	return nil
}

// GetAutomationGraph loads a full automation graph (automation + nodes + edges).
func (s *DB) GetAutomationGraph(ctx context.Context, automationID string) (AutomationGraph, error) {
	a, err := s.GetAutomation(ctx, automationID)
	if err != nil {
		return AutomationGraph{}, fmt.Errorf("get automation graph: %w", err)
	}
	nodes, err := s.ListAutomationNodes(ctx, automationID)
	if err != nil {
		return AutomationGraph{}, fmt.Errorf("get automation graph nodes: %w", err)
	}
	edges, err := s.ListAutomationEdges(ctx, automationID)
	if err != nil {
		return AutomationGraph{}, fmt.Errorf("get automation graph edges: %w", err)
	}
	return AutomationGraph{
		Automation: a,
		Nodes:      nodes,
		Edges:      edges,
	}, nil
}
