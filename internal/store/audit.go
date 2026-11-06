package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/saffronjam/saffron-hive/internal/audit"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// AuditFilter selects retained events visible to a registered user.
type AuditFilter struct {
	Forward                                                                                     bool
	OperationID, ReaderID, EntityType, EntityID, ActorID, Source, Action, Since, Search, Status string
	After, Before                                                                               int64
	Limit                                                                                       int
}

// AuditEvent is a committed, sanitized change or operation outcome.
type AuditEvent struct {
	Sequence                                                                                                                          int64
	OperationID                                                                                                                       *string
	RecordedAt, EntityType, EntityID, EntityName, Action, Before, After, ActorID, ActorName, Source, Field, Status, Proposed, Details string
	ConversationID                                                                                                                    *string
	ParentOperationID, RunID, ActionID                                                                                                *string
}

func (s *DB) BeginAudit(ctx context.Context, field string, proposed string) (context.Context, error) {
	o := audit.FromContext(ctx)
	if o.OperationID == "" {
		o.OperationID = uuid.NewString()
	}
	if o.Source == "" {
		o.Source = "system"
	}
	if o.ActorName == "" {
		o.ActorName = o.Source
		if o.Source == "automation" {
			if automation, err := s.q.GetAutomation(ctx, o.ActorID); err == nil {
				o.ActorName = automation.Name
			}
		}
		if o.ActorName == "" {
			o.ActorName = "System"
		}
	}
	var args map[string]json.RawMessage
	_ = json.Unmarshal([]byte(proposed), &args)
	var id string
	for _, key := range []string{"id", "sceneId", "effectId", "automationId", "deviceId", "key"} {
		if json.Unmarshal(args[key], &id) == nil && id != "" {
			break
		}
	}
	if id == "" {
		var input map[string]json.RawMessage
		_ = json.Unmarshal(args["input"], &input)
		_ = json.Unmarshal(input["id"], &id)
	}
	if id == "" {
		switch field {
		case "updateCurrentUser", "setAvatar", "clearAvatar", "updateCurrentGuestLanguage", "changePassword", "signOutEverywhere":
			id = o.ActorID
		case "updateClaudeConfig", "updateTuyaConfig", "updateZigbee2MqttConfig":
			id = "1"
		}
	}
	before := json.RawMessage("null")
	if id != "" {
		snapshot, err := s.q.AuditSnapshot(ctx, sqlite.AuditSnapshotParams{EntityType: audit.EntityType(field), EntityID: id})
		if err == nil {
			before = audit.SanitizeSnapshot(json.RawMessage(snapshot))
		} else if !errors.Is(err, sql.ErrNoRows) {
			return ctx, err
		}
	}
	proposed = string(audit.Proposal(field, audit.Sanitize(json.RawMessage(proposed)), before))
	err := s.atomic(ctx, func(tx *DB) error {
		n, err := tx.q.BeginAuditOperation(ctx, sqlite.BeginAuditOperationParams{ID: o.OperationID, StartedAt: time.Now().UTC().Format(time.RFC3339Nano), ActorID: o.ActorID, ActorName: o.ActorName, Source: o.Source, Field: field, Proposed: proposed, OwnerID: o.OwnerID, ConversationID: o.ConversationID, RunID: o.RunID, ActionID: o.ActionID, ParentID: o.ParentID})
		if err != nil {
			return err
		}
		if n == 0 {
			existing, err := tx.q.GetAuditOrigin(ctx, o.OperationID)
			if err != nil {
				return err
			}
			o.ActorID = existing.ActorID
			o.ActorName = existing.ActorName
			o.Source = existing.Source
			o.OwnerID = existing.OwnerID
			o.ConversationID = existing.ConversationID
			o.RunID = existing.RunID
			o.ActionID = existing.ActionID
			o.ParentID = existing.ParentID
			return nil
		}
		return tx.q.AppendAuditEvent(ctx, sqlite.AppendAuditEventParams{OperationID: &o.OperationID, OwnerID: o.OwnerID, EntityType: "operation", EntityID: o.OperationID, EntityName: field, Action: "requested", BeforeJson: "null", AfterJson: "null"})
	})
	return audit.WithOrigin(ctx, o), err
}
func (s *DB) FinishAudit(ctx context.Context, status string) error {
	o := audit.FromContext(ctx)
	if o.OperationID == "" {
		return nil
	}
	return s.atomic(ctx, func(tx *DB) error {
		if o.Source == "human" && o.ActorID != "" {
			if err := tx.q.IdentifyAuditActor(ctx, sqlite.IdentifyAuditActorParams{ActorID: o.ActorID, ActorName: o.ActorName, ID: o.OperationID}); err != nil {
				return err
			}
		}
		if status == "failed" {
			changed, err := tx.q.CountAuditCommittedChanges(ctx, &o.OperationID)
			if err != nil {
				return err
			}
			if changed > 0 {
				status = "partial"
			}
		}
		n, err := tx.q.FinishAuditOperation(ctx, sqlite.FinishAuditOperationParams{ID: o.OperationID, Status: status, FinishedAt: auditFinishedAt(status)})
		if err != nil {
			return err
		}
		if n == 0 {
			return nil
		}
		if status == "stopped" || status == "completed" || status == "preempted" || status == "drift" || status == "interrupted" {
			if err := tx.flushAuditRun(ctx, o.OperationID); err != nil {
				return err
			}
		}
		owner := o.OwnerID
		if owner != nil {
			shared, err := tx.q.CountAuditSharedEvents(ctx, &o.OperationID)
			if err != nil {
				return err
			}
			if shared > 0 {
				owner = nil
			}
		}
		return tx.q.AppendAuditEvent(ctx, sqlite.AppendAuditEventParams{OwnerID: owner, OperationID: &o.OperationID, EntityType: "operation", EntityID: o.OperationID, EntityName: status, Action: status, BeforeJson: "null", AfterJson: "null"})
	})
}
func stringPointer(s string) *string { return &s }
func (s *DB) AuditEvents(ctx context.Context, f AuditFilter) ([]AuditEvent, error) {
	limit := f.Limit
	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}
	params := sqlite.AuditEventsParams{OperationID: f.OperationID, Status: f.Status, ReaderID: f.ReaderID, AfterSequence: f.After, BeforeSequence: f.Before, EntityType: f.EntityType, EntityID: f.EntityID, ActorID: f.ActorID, Source: f.Source, Action: f.Action, Since: f.Since, Search: f.Search, Lim: int64(limit)}
	var rows []sqlite.AuditEventsRow
	var err error
	if f.After > 0 || f.Forward {
		var replay []sqlite.ReplayAuditEventsRow
		replay, err = s.q.ReplayAuditEvents(ctx, sqlite.ReplayAuditEventsParams(params))
		for _, row := range replay {
			rows = append(rows, sqlite.AuditEventsRow(row))
		}
	} else {
		rows, err = s.q.AuditEvents(ctx, params)
	}
	out := make([]AuditEvent, 0, len(rows))
	for _, r := range rows {
		conversation := r.ConversationID
		if r.OwnerID == nil || *r.OwnerID != f.ReaderID {
			conversation = nil
		}
		if r.OwnerID != nil && *r.OwnerID != f.ReaderID {
			r.ParentID, r.RunID, r.ActionID = nil, nil, nil
		}
		out = append(out, AuditEvent{Sequence: r.Sequence, OperationID: r.OperationID, RecordedAt: r.RecordedAt, EntityType: r.EntityType, EntityID: r.EntityID, EntityName: r.EntityName, Action: r.Action, Before: r.BeforeJson, After: r.AfterJson, ActorID: r.ActorID, ActorName: r.ActorName, Source: r.Source, Field: r.Field, Status: r.Status, Proposed: r.Proposed, Details: r.DetailsJson, ConversationID: conversation, ParentOperationID: r.ParentID, RunID: r.RunID, ActionID: r.ActionID})
	}
	return out, err
}
func (s *DB) AuditCursor(ctx context.Context) (int64, error) { return s.q.AuditHighWater(ctx) }
func (s *DB) PruneAudit(ctx context.Context) error {
	cutoff := time.Now().UTC().Add(-90 * 24 * time.Hour).Format(time.RFC3339Nano)
	return s.atomic(ctx, func(tx *DB) error {
		if err := tx.q.PruneAuditEvents(ctx, cutoff); err != nil {
			return err
		}
		return tx.q.PruneAuditOperations(ctx, &cutoff)
	})
}

// AuditDiff returns field changes without interpreting persisted JSON as instructions.
func AuditDiff(e AuditEvent) []audit.Change {
	return audit.Diff(json.RawMessage(e.Before), json.RawMessage(e.After))
}

// RecordAuditDelivery records a physical-write outcome under its durable intent.
func (s *DB) RecordAuditDelivery(ctx context.Context, stage string, delivery device.OutputDelivery) error {
	if s.db != nil {
		return s.atomic(ctx, func(tx *DB) error { return tx.RecordAuditDelivery(ctx, stage, delivery) })
	}
	if delivery.Error != "" {
		delivery.Error = "delivery_failed"
	}
	raw, err := json.Marshal(delivery)
	if err != nil {
		return err
	}
	aggregate, err := s.aggregateAuditRun(ctx, delivery.Origin.AuditID, delivery.Class == device.OutputContinuous || delivery.Origin.Kind == device.OriginKindEffect)
	if err != nil {
		return err
	}
	if aggregate {
		var sent, confirmed, failed int64
		switch stage {
		case "command.dispatched":
			sent = 1
		case "command.confirmed":
			confirmed = 1
		case "command.failed", "command.rejected":
			failed = 1
		}
		return s.atomic(ctx, func(tx *DB) error {
			targets, err := tx.q.AuditRunTargets(ctx, delivery.Origin.AuditID)
			if err != nil {
				return err
			}
			known := false
			for _, target := range targets {
				if target.DeviceID == string(delivery.DeviceID) {
					known = true
					break
				}
			}
			if err := tx.q.UpsertAuditRunOutcome(ctx, sqlite.UpsertAuditRunOutcomeParams{OperationID: delivery.Origin.AuditID, DeviceID: string(delivery.DeviceID), Dispatched: sent, Confirmed: confirmed, Failed: failed, LastStatus: stage}); err != nil {
				return err
			}
			if known {
				return nil
			}
			return tx.q.AppendAuditEvent(ctx, sqlite.AppendAuditEventParams{OperationID: &delivery.Origin.AuditID, EntityType: "run_target", EntityID: string(delivery.DeviceID), EntityName: tx.auditDeviceName(ctx, delivery.DeviceID), Action: "started", BeforeJson: "null", AfterJson: "null"})
		})
	}
	return s.atomic(ctx, func(tx *DB) error {
		if err := tx.q.AppendAuditEvent(ctx, sqlite.AppendAuditEventParams{OperationID: &delivery.Origin.AuditID, EntityType: "delivery", EntityID: string(delivery.DeviceID), EntityName: tx.auditDeviceName(ctx, delivery.DeviceID), Action: stage, BeforeJson: "null", AfterJson: "null"}); err != nil {
			return err
		}
		return tx.q.SetAuditEventDetails(ctx, string(raw))
	})
}

func auditFinishedAt(status string) *string {
	if status == "pending" || status == "running" {
		return nil
	}
	return stringPointer(time.Now().UTC().Format(time.RFC3339Nano))
}
func (s *DB) RecoverAudit(ctx context.Context) error {
	return s.atomic(ctx, func(tx *DB) error {
		rows, err := tx.q.InterruptedAuditOperations(ctx)
		if err != nil {
			return err
		}
		for _, row := range rows {
			o := audit.Origin{OperationID: row.ID, OwnerID: row.OwnerID}
			if err := tx.FinishAudit(audit.WithOrigin(ctx, o), "interrupted"); err != nil {
				return err
			}
		}
		return nil
	})
}

// RecordAuditState preserves only device fields owned by a confirmed command.
func (s *DB) RecordAuditState(ctx context.Context, operation string, id device.DeviceID, before, after device.DeviceState, class device.OutputClass) error {
	if s.db != nil {
		return s.atomic(ctx, func(tx *DB) error { return tx.RecordAuditState(ctx, operation, id, before, after, class) })
	}
	a, err := json.Marshal(before)
	if err != nil {
		return err
	}
	b, err := json.Marshal(after)
	if err != nil {
		return err
	}
	aggregate, err := s.aggregateAuditRun(ctx, operation, class == device.OutputContinuous || strings.HasPrefix(operation, "run:effect:"))
	if err != nil {
		return err
	}
	if aggregate {
		return s.q.UpsertAuditRunState(ctx, sqlite.UpsertAuditRunStateParams{OperationID: operation, DeviceID: string(id), BeforeJson: string(a), AfterJson: string(b)})
	}
	return s.q.AppendAuditEvent(ctx, sqlite.AppendAuditEventParams{OperationID: &operation, EntityType: "device_state", EntityID: string(id), EntityName: s.auditDeviceName(ctx, id), Action: "confirmed", BeforeJson: string(a), AfterJson: string(b)})
}

func (s *DB) auditDeviceName(ctx context.Context, id device.DeviceID) string {
	if dev, err := s.GetDevice(ctx, id); err == nil {
		return dev.DisplayName()
	}
	return string(id)
}

func (s *DB) aggregateAuditRun(ctx context.Context, operation string, candidate bool) (bool, error) {
	if !candidate {
		return false, nil
	}
	run, err := s.q.GetAuditOrigin(ctx, operation)
	if err != nil {
		return false, err
	}
	return run.Status == "running", nil
}

func (s *DB) AuditFloor(ctx context.Context) (int64, error) { return s.q.AuditFloor(ctx) }

func (s *DB) auditAssistantActions(ctx context.Context, c AssistantConversation) error {
	var document struct {
		Actions []struct {
			Status    string `json:"status"`
			Operation struct {
				AuditID string `json:"auditId"`
			} `json:"operation"`
		} `json:"actions"`
	}
	if err := json.Unmarshal([]byte(c.Document), &document); err != nil {
		return err
	}
	for _, action := range document.Actions {
		if action.Operation.AuditID == "" {
			continue
		}
		status := ""
		switch action.Status {
		case "EXECUTING":
			status = "running"
		case "PENDING", "NEEDS_INPUT":
			status = "pending"
		case "COMPLETED":
			status = "succeeded"
		case "REJECTED":
			status = "rejected"
		case "STALE":
			status = "stale"
		case "FAILED":
			status = "failed"
		}
		if status != "" {
			owner := c.UserID
			origin := audit.Origin{OperationID: action.Operation.AuditID, OwnerID: &owner}
			if err := s.FinishAudit(audit.WithOrigin(ctx, origin), status); err != nil {
				return err
			}
		}
	}
	return nil
}

func (s *DB) flushAuditRun(ctx context.Context, operation string) error {
	targets, err := s.q.AuditRunTargets(ctx, operation)
	if err != nil {
		return err
	}
	for _, target := range targets {
		if err := s.q.AppendAuditEvent(ctx, sqlite.AppendAuditEventParams{OperationID: &operation, EntityType: "run_summary", EntityID: target.DeviceID, EntityName: s.auditDeviceName(ctx, device.DeviceID(target.DeviceID)), Action: "summary", BeforeJson: target.BeforeJson, AfterJson: target.AfterJson}); err != nil {
			return err
		}
		details, err := json.Marshal(struct {
			Dispatched int64  `json:"dispatched"`
			Confirmed  int64  `json:"confirmed"`
			Failed     int64  `json:"failed"`
			Status     string `json:"status"`
		}{target.Dispatched, target.Confirmed, target.Failed, target.LastStatus})
		if err != nil {
			return err
		}
		if err := s.q.SetAuditEventDetails(ctx, string(details)); err != nil {
			return err
		}
	}
	return nil
}
