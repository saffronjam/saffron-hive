package store

import (
	"context"
	"strings"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/audit"
	"github.com/saffronjam/saffron-hive/internal/device"
)

func TestAuditCommittedChangeAttributionAndRollback(t *testing.T) {
	s := newTestStore(t)
	ctx := audit.WithOrigin(t.Context(), audit.Origin{ActorID: "u", ActorName: "Emil", Source: "human"})
	ctx, err := s.BeginAudit(ctx, "createRoom", "{}")
	if err != nil {
		t.Fatal(err)
	}
	_, err = s.CreateRoom(ctx, CreateRoomParams{ID: "room", Name: "Bedroom"})
	if err != nil {
		t.Fatal(err)
	}
	events, err := s.AuditEvents(ctx, AuditFilter{ReaderID: "u", EntityType: "rooms"})
	if err != nil || len(events) != 1 {
		t.Fatalf("events=%+v err=%v", events, err)
	}
	if events[0].ActorName != "Emil" || events[0].Before != "null" || !strings.Contains(events[0].After, "Bedroom") {
		t.Fatalf("event=%+v", events[0])
	}
	if _, err = s.db.Exec(`CREATE TRIGGER reject_audit BEFORE INSERT ON audit_events BEGIN SELECT RAISE(ABORT,'audit failure'); END`); err != nil {
		t.Fatal(err)
	}
	if _, err = s.CreateRoom(ctx, CreateRoomParams{ID: "blocked", Name: "Blocked"}); err == nil {
		t.Fatal("write survived audit failure")
	}
	if _, err = s.GetRoom(ctx, "blocked"); err == nil {
		t.Fatal("configuration committed without audit")
	}
}

func TestAuditSecretsAndEntityDeletion(t *testing.T) {
	s := newTestStore(t)
	if err := s.UpsertSetting(t.Context(), "jwt.secret", "jwt-private"); err != nil {
		t.Fatal(err)
	}
	if _, err := s.CreateUser(t.Context(), CreateUserParams{ID: "u", Username: "user", Name: "User", PasswordHash: "password-private"}); err != nil {
		t.Fatal(err)
	}
	if err := s.DeleteUser(t.Context(), "u"); err != nil {
		t.Fatal(err)
	}
	events, err := s.AuditEvents(t.Context(), AuditFilter{ReaderID: "viewer"})
	if err != nil {
		t.Fatal(err)
	}
	deleted := false
	for _, e := range events {
		if strings.Contains(e.Before+e.After, "jwt-private") || strings.Contains(e.Before+e.After, "password-private") {
			t.Fatal("credential stored in audit")
		}
		if e.EntityID == "u" && e.Action == "deleted" {
			deleted = true
		}
	}
	if !deleted {
		t.Fatal("deletion snapshot missing")
	}
}

func TestAuditPrivateAttemptsAndSharedCommittedChanges(t *testing.T) {
	s := newTestStore(t)
	owner := "owner"
	ctx := audit.WithOrigin(t.Context(), audit.Origin{ActorID: owner, ActorName: "Owner", Source: "assistant", OwnerID: &owner})
	ctx, err := s.BeginAudit(ctx, "createRoom", `{"name":"Private proposal"}`)
	if err != nil {
		t.Fatal(err)
	}
	if err := s.FinishAudit(ctx, "rejected"); err != nil {
		t.Fatal(err)
	}
	other, err := s.AuditEvents(ctx, AuditFilter{ReaderID: "other"})
	if err != nil || len(other) != 0 {
		t.Fatalf("private records leaked: %+v %v", other, err)
	}
	own, err := s.AuditEvents(ctx, AuditFilter{ReaderID: owner})
	if err != nil || len(own) != 2 {
		t.Fatalf("owner history missing: %+v %v", own, err)
	}
	if _, err := s.CreateRoom(ctx, CreateRoomParams{ID: "shared", Name: "Shared"}); err != nil {
		t.Fatal(err)
	}
	other, err = s.AuditEvents(context.Background(), AuditFilter{ReaderID: "other"})
	if err != nil || len(other) != 1 || other[0].Proposed != "{}" {
		t.Fatalf("shared change: %+v %v", other, err)
	}
}

func TestAuditTablesHaveExplicitCoverage(t *testing.T) {
	s := newTestStore(t)
	excluded := map[string]bool{"schema_migrations": true, "cleaning_tasks": true, "cleaning_snapshots": true, "cleaning_link_sets": true, "dreame_devices": true, "active_effects": true, "active_scene_runs": true, "active_scene_members": true, "network_topology_snapshots": true, "zigbee_device_metadata": true, "webhook_deliveries": true, "native_effect_observations": true, "activity_events": true, "automation_node_state": true, "assistant_conversations": true, "assistant_attachments": true, "device_state_samples": true, "localized_name_subjects": true, "audit_operations": true, "audit_events": true, "audit_write_context": true, "audit_watermark": true, "audit_run_targets": true}
	rows, err := s.db.Query(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND NOT EXISTS(SELECT 1 FROM sqlite_master t WHERE t.type='trigger' AND t.tbl_name=sqlite_master.name AND t.name LIKE 'audit_%_created')`)
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = rows.Close() }()
	for rows.Next() {
		var table string
		if err := rows.Scan(&table); err != nil {
			t.Fatal(err)
		}
		if !excluded[table] {
			t.Errorf("table %s has no audit classification", table)
		}
	}
	if err := rows.Err(); err != nil {
		t.Fatal(err)
	}
}

func TestAuditWatermarkSurvivesRetentionAndRunCountsStayGrouped(t *testing.T) {
	s := newTestStore(t)
	ctx, err := s.BeginAudit(t.Context(), "effectRun", "{}")
	if err != nil {
		t.Fatal(err)
	}
	id := audit.FromContext(ctx).OperationID
	delivery := device.OutputDelivery{DeviceID: "lamp", Origin: device.CommandOrigin{AuditID: id, Kind: device.OriginKindEffect}, Class: device.OutputForeground}
	for i := 0; i < 10; i++ {
		if err := s.RecordAuditDelivery(ctx, "command.dispatched", delivery); err != nil {
			t.Fatal(err)
		}
	}
	rows, err := s.AuditEvents(ctx, AuditFilter{ReaderID: "viewer", EntityType: "run_target"})
	if err != nil || len(rows) != 1 {
		t.Fatalf("run targets=%+v %v", rows, err)
	}
	if err := s.FinishAudit(ctx, "completed"); err != nil {
		t.Fatal(err)
	}
	rows, err = s.AuditEvents(ctx, AuditFilter{ReaderID: "viewer", EntityType: "run_summary"})
	if err != nil || len(rows) != 1 || !strings.Contains(rows[0].Details, `"dispatched":10`) {
		t.Fatalf("summary=%+v %v", rows, err)
	}
	before, err := s.AuditCursor(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := s.db.Exec(`DELETE FROM audit_events`); err != nil {
		t.Fatal(err)
	}
	after, err := s.AuditCursor(ctx)
	if err != nil || after != before {
		t.Fatalf("cursor reset %d -> %d, %v", before, after, err)
	}
}

func TestAuditEmbeddedConfigurationCredentials(t *testing.T) {
	s := newTestStore(t)
	_, err := s.CreateAutomation(t.Context(), CreateAutomationParams{ID: "automation", Name: "Safe", Definitions: `{"actions":{"configure":{"password":"nested-private"}}}`, Nodes: []CreateAutomationNodeParams{{ID: "a1", Type: "action", Config: `{"settings":[{"capability":"password","stringValue":"attribute-private"}]}`}}})
	if err != nil {
		t.Fatal(err)
	}
	rows, err := s.AuditEvents(t.Context(), AuditFilter{ReaderID: "u"})
	if err != nil {
		t.Fatal(err)
	}
	for _, row := range rows {
		if strings.Contains(row.Before+row.After, "private") {
			t.Fatalf("configuration credential leaked: %+v", row)
		}
	}
	rows, err = s.AuditEvents(t.Context(), AuditFilter{ReaderID: "u", EntityType: "automations", EntityID: "automation", Search: "Safe"})
	if err != nil || len(rows) != 2 {
		t.Fatalf("parent search omits graph edits: %+v %v", rows, err)
	}
}

func TestAuditRecoveryAndLateRunConfirmations(t *testing.T) {
	s := newTestStore(t)
	ctx, err := s.BeginAudit(audit.RunContext(t.Context(), "effect", "lost"), "effectRun", "{}")
	if err != nil {
		t.Fatal(err)
	}
	if err := s.RecoverAudit(ctx); err != nil {
		t.Fatal(err)
	}
	if err := s.RecordAuditState(ctx, "run:effect:lost", "lamp", device.DeviceState{On: device.Ptr(false)}, device.DeviceState{On: device.Ptr(true)}, device.OutputContinuous); err != nil {
		t.Fatal(err)
	}
	rows, err := s.AuditEvents(ctx, AuditFilter{ReaderID: "u"})
	if err != nil {
		t.Fatal(err)
	}
	interrupted, confirmed := false, false
	for _, row := range rows {
		interrupted = interrupted || row.Action == "interrupted"
		confirmed = confirmed || row.EntityType == "device_state" && row.Action == "confirmed"
	}
	if !interrupted || !confirmed {
		t.Fatalf("recovery or late outcome missing: %+v", rows)
	}
}

func TestAuditSystemFiltersIncludeNativeChanges(t *testing.T) {
	s := newTestStore(t)
	if _, err := s.CreateRoom(t.Context(), CreateRoomParams{ID: "system-room", Name: "System room"}); err != nil {
		t.Fatal(err)
	}
	rows, err := s.AuditEvents(t.Context(), AuditFilter{ReaderID: "u", Source: "system", Status: "succeeded"})
	if err != nil || len(rows) != 1 {
		t.Fatalf("native system change missing from filter: %+v %v", rows, err)
	}
}
