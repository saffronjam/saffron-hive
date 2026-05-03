package store

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// GetAutomationNodeState reads the persisted value for a node-state key. The
// found flag is false (with a nil error) when no row exists.
func (s *DB) GetAutomationNodeState(ctx context.Context, automationID, nodeID, key string) (string, bool, error) {
	value, err := s.q.GetAutomationNodeState(ctx, sqlite.GetAutomationNodeStateParams{
		AutomationID: automationID,
		NodeID:       nodeID,
		Key:          key,
	})
	if errors.Is(err, sql.ErrNoRows) {
		return "", false, nil
	}
	if err != nil {
		return "", false, fmt.Errorf("get automation node state: %w", err)
	}
	return value, true, nil
}

// AutomationNodeStateEntry is a single (node_id, key, value) row.
type AutomationNodeStateEntry struct {
	NodeID string
	Key    string
	Value  string
}

// ListAutomationNodeStateByAutomation returns every state row for the
// automation, across all nodes and keys. Used to attach runtime state to a
// graph response.
func (s *DB) ListAutomationNodeStateByAutomation(ctx context.Context, automationID string) ([]AutomationNodeStateEntry, error) {
	rows, err := s.q.ListAutomationNodeStateByAutomation(ctx, automationID)
	if err != nil {
		return nil, fmt.Errorf("list automation node state: %w", err)
	}
	out := make([]AutomationNodeStateEntry, len(rows))
	for i, r := range rows {
		out[i] = AutomationNodeStateEntry{NodeID: r.NodeID, Key: r.Key, Value: r.Value}
	}
	return out, nil
}

// SetAutomationNodeState upserts a node-state key/value pair.
func (s *DB) SetAutomationNodeState(ctx context.Context, automationID, nodeID, key, value string) error {
	if err := s.q.SetAutomationNodeState(ctx, sqlite.SetAutomationNodeStateParams{
		AutomationID: automationID,
		NodeID:       nodeID,
		Key:          key,
		Value:        value,
	}); err != nil {
		return fmt.Errorf("set automation node state: %w", err)
	}
	return nil
}

// DeleteAutomationNodeStateByAutomation clears every key for every node of an
// automation. Used to reset stateful nodes (e.g. cycle index) on enable
// transitions; the foreign-key cascade handles per-node deletion on graph
// replace.
func (s *DB) DeleteAutomationNodeStateByAutomation(ctx context.Context, automationID string) error {
	if err := s.q.DeleteAutomationNodeStateByAutomation(ctx, automationID); err != nil {
		return fmt.Errorf("delete automation node state: %w", err)
	}
	return nil
}
