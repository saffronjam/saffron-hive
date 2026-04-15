package store

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/saffronjam/saffron-hive/internal/device"
)

// CreateAutomation inserts a new automation and returns it.
func (s *SQLiteStore) CreateAutomation(ctx context.Context, params CreateAutomationParams) (Automation, error) {
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO automations (id, name, enabled, trigger_event, condition_expr, cooldown_seconds) VALUES (?, ?, ?, ?, ?, ?)`,
		params.ID, params.Name, params.Enabled, params.TriggerEvent, params.ConditionExpr, params.CooldownSeconds,
	)
	if err != nil {
		return Automation{}, fmt.Errorf("create automation: %w", err)
	}
	return s.GetAutomation(ctx, params.ID)
}

// GetAutomation retrieves an automation by its ID.
func (s *SQLiteStore) GetAutomation(ctx context.Context, id string) (Automation, error) {
	row := s.db.QueryRowContext(ctx,
		`SELECT id, name, enabled, trigger_event, condition_expr, cooldown_seconds, created_at, updated_at FROM automations WHERE id = ?`, id,
	)
	return scanAutomation(row)
}

// ListAutomations returns all automations.
func (s *SQLiteStore) ListAutomations(ctx context.Context) ([]Automation, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, name, enabled, trigger_event, condition_expr, cooldown_seconds, created_at, updated_at FROM automations`,
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
		`SELECT id, name, enabled, trigger_event, condition_expr, cooldown_seconds, created_at, updated_at FROM automations WHERE enabled = true`,
	)
	if err != nil {
		return nil, fmt.Errorf("list enabled automations: %w", err)
	}
	defer func() { _ = rows.Close() }()
	return scanAutomations(rows)
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

// DeleteAutomation deletes an automation by its ID. Cascading deletes remove associated actions.
func (s *SQLiteStore) DeleteAutomation(ctx context.Context, id string) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM automations WHERE id = ?`, id)
	if err != nil {
		return fmt.Errorf("delete automation: %w", err)
	}
	return nil
}

// CreateAutomationAction inserts a new automation action.
func (s *SQLiteStore) CreateAutomationAction(ctx context.Context, params CreateAutomationActionParams) (AutomationAction, error) {
	var deviceID sql.NullString
	if params.DeviceID != nil {
		deviceID = sql.NullString{String: string(*params.DeviceID), Valid: true}
	}
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO automation_actions (id, automation_id, action_type, device_id, payload) VALUES (?, ?, ?, ?, ?)`,
		params.ID, params.AutomationID, params.ActionType, deviceID, params.Payload,
	)
	if err != nil {
		return AutomationAction{}, fmt.Errorf("create automation action: %w", err)
	}
	return AutomationAction{
		ID:           params.ID,
		AutomationID: params.AutomationID,
		ActionType:   params.ActionType,
		DeviceID:     params.DeviceID,
		Payload:      params.Payload,
	}, nil
}

// DeleteAutomationAction deletes an automation action by its ID.
func (s *SQLiteStore) DeleteAutomationAction(ctx context.Context, id string) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM automation_actions WHERE id = ?`, id)
	if err != nil {
		return fmt.Errorf("delete automation action: %w", err)
	}
	return nil
}

// ListAutomationActions returns all actions belonging to an automation.
func (s *SQLiteStore) ListAutomationActions(ctx context.Context, automationID string) ([]AutomationAction, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, automation_id, action_type, device_id, payload FROM automation_actions WHERE automation_id = ?`,
		automationID,
	)
	if err != nil {
		return nil, fmt.Errorf("list automation actions: %w", err)
	}
	defer func() { _ = rows.Close() }()
	var actions []AutomationAction
	for rows.Next() {
		var a AutomationAction
		var deviceID sql.NullString
		if err := rows.Scan(&a.ID, &a.AutomationID, &a.ActionType, &deviceID, &a.Payload); err != nil {
			return nil, fmt.Errorf("scan automation action: %w", err)
		}
		if deviceID.Valid {
			did := device.DeviceID(deviceID.String)
			a.DeviceID = &did
		}
		actions = append(actions, a)
	}
	return actions, rows.Err()
}

func scanAutomation(row *sql.Row) (Automation, error) {
	var a Automation
	err := row.Scan(&a.ID, &a.Name, &a.Enabled, &a.TriggerEvent, &a.ConditionExpr, &a.CooldownSeconds, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		return Automation{}, fmt.Errorf("scan automation: %w", err)
	}
	return a, nil
}

func scanAutomations(rows *sql.Rows) ([]Automation, error) {
	var automations []Automation
	for rows.Next() {
		var a Automation
		if err := rows.Scan(&a.ID, &a.Name, &a.Enabled, &a.TriggerEvent, &a.ConditionExpr, &a.CooldownSeconds, &a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan automation: %w", err)
		}
		automations = append(automations, a)
	}
	return automations, rows.Err()
}
