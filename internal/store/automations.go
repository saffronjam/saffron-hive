package store

import (
	"context"
	"database/sql"
	"fmt"
)

const automationSelectColumns = `a.id, a.name, a.icon, a.enabled, a.cooldown_seconds, a.created_at, a.updated_at, u.id, u.username, u.name`

const automationFromJoin = `FROM automations a LEFT JOIN users u ON u.id = a.created_by`

// CreateAutomation inserts a new automation and returns it.
func (s *SQLiteStore) CreateAutomation(ctx context.Context, params CreateAutomationParams) (Automation, error) {
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO automations (id, name, enabled, cooldown_seconds, created_by) VALUES (?, ?, ?, ?, ?)`,
		params.ID, params.Name, params.Enabled, params.CooldownSeconds, params.CreatedBy,
	)
	if err != nil {
		return Automation{}, fmt.Errorf("create automation: %w", err)
	}
	return s.GetAutomation(ctx, params.ID)
}

// GetAutomation retrieves an automation by its ID.
func (s *SQLiteStore) GetAutomation(ctx context.Context, id string) (Automation, error) {
	row := s.db.QueryRowContext(ctx,
		`SELECT `+automationSelectColumns+` `+automationFromJoin+` WHERE a.id = ?`, id,
	)
	return scanAutomation(row)
}

// ListAutomations returns all automations.
func (s *SQLiteStore) ListAutomations(ctx context.Context) ([]Automation, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT `+automationSelectColumns+` `+automationFromJoin,
	)
	if err != nil {
		return nil, fmt.Errorf("list automations: %w", err)
	}
	defer func() { _ = rows.Close() }()
	return scanAutomations(rows)
}

// ListEnabledAutomations returns all automations where enabled is true.
func (s *SQLiteStore) ListEnabledAutomations(ctx context.Context) ([]Automation, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT `+automationSelectColumns+` `+automationFromJoin+` WHERE a.enabled = true`,
	)
	if err != nil {
		return nil, fmt.Errorf("list enabled automations: %w", err)
	}
	defer func() { _ = rows.Close() }()
	return scanAutomations(rows)
}

// UpdateAutomation updates optional fields on an automation.
func (s *SQLiteStore) UpdateAutomation(ctx context.Context, id string, params UpdateAutomationParams) (Automation, error) {
	if params.Name != nil {
		if _, err := s.db.ExecContext(ctx,
			`UPDATE automations SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
			*params.Name, id,
		); err != nil {
			return Automation{}, fmt.Errorf("update automation name: %w", err)
		}
	}
	if params.SetIcon {
		var iconArg any
		if params.Icon != nil {
			iconArg = *params.Icon
		}
		if _, err := s.db.ExecContext(ctx,
			`UPDATE automations SET icon = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
			iconArg, id,
		); err != nil {
			return Automation{}, fmt.Errorf("update automation icon: %w", err)
		}
	}
	if params.Enabled != nil {
		if _, err := s.db.ExecContext(ctx,
			`UPDATE automations SET enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
			*params.Enabled, id,
		); err != nil {
			return Automation{}, fmt.Errorf("update automation enabled: %w", err)
		}
	}
	if params.CooldownSeconds != nil {
		if _, err := s.db.ExecContext(ctx,
			`UPDATE automations SET cooldown_seconds = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
			*params.CooldownSeconds, id,
		); err != nil {
			return Automation{}, fmt.Errorf("update automation cooldown: %w", err)
		}
	}
	return s.GetAutomation(ctx, id)
}

// UpdateAutomationEnabled sets the enabled field of an automation.
func (s *SQLiteStore) UpdateAutomationEnabled(ctx context.Context, id string, enabled bool) error {
	_, err := s.db.ExecContext(ctx,
		`UPDATE automations SET enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
		enabled, id,
	)
	if err != nil {
		return fmt.Errorf("update automation enabled: %w", err)
	}
	return nil
}

// DeleteAutomation deletes an automation by its ID. Cascading deletes remove associated nodes and edges.
func (s *SQLiteStore) DeleteAutomation(ctx context.Context, id string) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM automations WHERE id = ?`, id)
	if err != nil {
		return fmt.Errorf("delete automation: %w", err)
	}
	return nil
}

// CreateAutomationNode inserts a new automation node.
func (s *SQLiteStore) CreateAutomationNode(ctx context.Context, params CreateAutomationNodeParams) (AutomationNode, error) {
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO automation_nodes (id, automation_id, type, config) VALUES (?, ?, ?, ?)`,
		params.ID, params.AutomationID, params.Type, params.Config,
	)
	if err != nil {
		return AutomationNode{}, fmt.Errorf("create automation node: %w", err)
	}
	return AutomationNode{
		ID:           params.ID,
		AutomationID: params.AutomationID,
		Type:         params.Type,
		Config:       params.Config,
	}, nil
}

// ListAutomationNodes returns all nodes belonging to an automation.
func (s *SQLiteStore) ListAutomationNodes(ctx context.Context, automationID string) ([]AutomationNode, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, automation_id, type, config FROM automation_nodes WHERE automation_id = ?`,
		automationID,
	)
	if err != nil {
		return nil, fmt.Errorf("list automation nodes: %w", err)
	}
	defer func() { _ = rows.Close() }()
	var nodes []AutomationNode
	for rows.Next() {
		var n AutomationNode
		if err := rows.Scan(&n.ID, &n.AutomationID, &n.Type, &n.Config); err != nil {
			return nil, fmt.Errorf("scan automation node: %w", err)
		}
		nodes = append(nodes, n)
	}
	return nodes, rows.Err()
}

// DeleteAutomationNode deletes an automation node by its ID.
func (s *SQLiteStore) DeleteAutomationNode(ctx context.Context, id string) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM automation_nodes WHERE id = ?`, id)
	if err != nil {
		return fmt.Errorf("delete automation node: %w", err)
	}
	return nil
}

// CreateAutomationEdge inserts a new automation edge.
func (s *SQLiteStore) CreateAutomationEdge(ctx context.Context, params CreateAutomationEdgeParams) (AutomationEdge, error) {
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO automation_edges (id, automation_id, from_node_id, to_node_id) VALUES (?, ?, ?, ?)`,
		params.ID, params.AutomationID, params.FromNodeID, params.ToNodeID,
	)
	if err != nil {
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
func (s *SQLiteStore) ListAutomationEdges(ctx context.Context, automationID string) ([]AutomationEdge, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, automation_id, from_node_id, to_node_id FROM automation_edges WHERE automation_id = ?`,
		automationID,
	)
	if err != nil {
		return nil, fmt.Errorf("list automation edges: %w", err)
	}
	defer func() { _ = rows.Close() }()
	var edges []AutomationEdge
	for rows.Next() {
		var e AutomationEdge
		if err := rows.Scan(&e.ID, &e.AutomationID, &e.FromNodeID, &e.ToNodeID); err != nil {
			return nil, fmt.Errorf("scan automation edge: %w", err)
		}
		edges = append(edges, e)
	}
	return edges, rows.Err()
}

// DeleteAutomationEdge deletes an automation edge by its ID.
func (s *SQLiteStore) DeleteAutomationEdge(ctx context.Context, id string) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM automation_edges WHERE id = ?`, id)
	if err != nil {
		return fmt.Errorf("delete automation edge: %w", err)
	}
	return nil
}

// GetAutomationGraph loads a full automation graph (automation + nodes + edges).
func (s *SQLiteStore) GetAutomationGraph(ctx context.Context, automationID string) (AutomationGraph, error) {
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

func scanAutomation(row rowScanner) (Automation, error) {
	var a Automation
	var creatorID, creatorUsername, creatorName sql.NullString
	err := row.Scan(&a.ID, &a.Name, &a.Icon, &a.Enabled, &a.CooldownSeconds, &a.CreatedAt, &a.UpdatedAt, &creatorID, &creatorUsername, &creatorName)
	if err != nil {
		return Automation{}, fmt.Errorf("scan automation: %w", err)
	}
	a.CreatedBy = buildUserRef(creatorID, creatorUsername, creatorName)
	return a, nil
}

func scanAutomations(rows *sql.Rows) ([]Automation, error) {
	var automations []Automation
	for rows.Next() {
		a, err := scanAutomation(rows)
		if err != nil {
			return nil, err
		}
		automations = append(automations, a)
	}
	return automations, rows.Err()
}
