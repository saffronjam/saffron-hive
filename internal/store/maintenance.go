package store

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// MaintenanceAcknowledgement is one completed condition cycle.
type MaintenanceAcknowledgement struct {
	TaskKey              string
	ConditionFingerprint string
	CompletedAt          time.Time
	CompletedBy          *string
}

// InsertMaintenanceAcknowledgementParams identifies a completed condition.
type InsertMaintenanceAcknowledgementParams struct {
	TaskKey              string
	ConditionFingerprint string
	CompletedAt          time.Time
	CompletedBy          *string
}

// ListMaintenanceAcknowledgements returns all durable completions.
func (s *DB) ListMaintenanceAcknowledgements(ctx context.Context) ([]MaintenanceAcknowledgement, error) {
	rows, err := s.q.ListMaintenanceAcknowledgements(ctx)
	if err != nil {
		return nil, fmt.Errorf("list maintenance acknowledgements: %w", err)
	}
	out := make([]MaintenanceAcknowledgement, 0, len(rows))
	for _, row := range rows {
		out = append(out, MaintenanceAcknowledgement{
			TaskKey: row.TaskKey, ConditionFingerprint: row.ConditionFingerprint,
			CompletedAt: row.CompletedAt, CompletedBy: row.CompletedBy,
		})
	}
	return out, nil
}

// InsertMaintenanceAcknowledgements stores a completion batch atomically.
func (s *DB) InsertMaintenanceAcknowledgements(ctx context.Context, rows []InsertMaintenanceAcknowledgementParams) error {
	return s.execTx(ctx, func(q *sqlite.Queries) error {
		for _, row := range rows {
			if err := q.InsertMaintenanceAcknowledgement(ctx, sqlite.InsertMaintenanceAcknowledgementParams{
				TaskKey: row.TaskKey, ConditionFingerprint: row.ConditionFingerprint,
				CompletedAt: row.CompletedAt, CompletedBy: row.CompletedBy,
			}); err != nil {
				return fmt.Errorf("insert maintenance acknowledgement: %w", err)
			}
		}
		return nil
	})
}

// ResetMaintenanceAcknowledgements removes every completion for a task cycle.
func (s *DB) ResetMaintenanceAcknowledgements(ctx context.Context, taskKey string) error {
	if _, err := s.q.DeleteMaintenanceAcknowledgementsByTaskKey(ctx, taskKey); err != nil {
		return fmt.Errorf("reset maintenance acknowledgements: %w", err)
	}
	return nil
}

// DeleteMaintenanceAcknowledgementFingerprints removes selected obsolete completions.
func (s *DB) DeleteMaintenanceAcknowledgementFingerprints(ctx context.Context, taskKey string, fingerprints []string) error {
	if len(fingerprints) == 0 {
		return nil
	}
	encoded, err := json.Marshal(fingerprints)
	if err != nil {
		return fmt.Errorf("encode maintenance fingerprints: %w", err)
	}
	if _, err := s.q.DeleteMaintenanceAcknowledgementsByFingerprints(ctx, sqlite.DeleteMaintenanceAcknowledgementsByFingerprintsParams{
		TaskKey: taskKey, FingerprintsJson: string(encoded),
	}); err != nil {
		return fmt.Errorf("delete maintenance acknowledgement fingerprints: %w", err)
	}
	return nil
}
