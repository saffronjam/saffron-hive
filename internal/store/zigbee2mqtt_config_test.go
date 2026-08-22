package store

import (
	"context"
	"testing"
)

func TestZigbee2MQTTConfigRoundTrip(t *testing.T) {
	ctx := context.Background()
	s := newTestStore(t)

	cfg, err := s.GetZigbee2MQTTConfig(ctx)
	if err != nil {
		t.Fatalf("get on empty table: %v", err)
	}
	if cfg != nil {
		t.Fatalf("want nil config before anything is stored, got %+v", cfg)
	}

	want := Zigbee2MQTTConfig{
		Broker:   "mqtt.example.com:8883",
		Username: "hive",
		Password: "s3cret",
		UseWSS:   true,
		Enabled:  true,
	}
	if err := s.UpsertZigbee2MQTTConfig(ctx, want); err != nil {
		t.Fatalf("upsert: %v", err)
	}

	got, err := s.GetZigbee2MQTTConfig(ctx)
	if err != nil {
		t.Fatalf("get after upsert: %v", err)
	}
	if got == nil || *got != want {
		t.Fatalf("round trip mismatch: want %+v, got %+v", want, got)
	}
}

func TestZigbee2MQTTConfigFrontendURLRoundTrip(t *testing.T) {
	ctx := context.Background()
	s := newTestStore(t)
	frontendURL := "https://z2m.example.com"
	want := Zigbee2MQTTConfig{Broker: "mqtt.example.com:1883", FrontendURL: &frontendURL, Enabled: false}
	if err := s.UpsertZigbee2MQTTConfig(ctx, want); err != nil {
		t.Fatal(err)
	}
	got, err := s.GetZigbee2MQTTConfig(ctx)
	if err != nil || got == nil || got.FrontendURL == nil || *got.FrontendURL != frontendURL {
		t.Fatalf("frontend URL = %+v, %v", got, err)
	}
	want.FrontendURL = nil
	if err := s.UpsertZigbee2MQTTConfig(ctx, want); err != nil {
		t.Fatal(err)
	}
	got, err = s.GetZigbee2MQTTConfig(ctx)
	if err != nil || got == nil || got.FrontendURL != nil {
		t.Fatalf("cleared frontend URL = %+v, %v", got, err)
	}
}

// TestZigbee2MQTTConfigUpsertReplaces pins the singleton behaviour: a second
// upsert updates the one row rather than failing on the primary key, and every
// field including Enabled is overwritten.
func TestZigbee2MQTTConfigUpsertReplaces(t *testing.T) {
	ctx := context.Background()
	s := newTestStore(t)

	if err := s.UpsertZigbee2MQTTConfig(ctx, Zigbee2MQTTConfig{
		Broker:  "first.example.com:1883",
		Enabled: true,
	}); err != nil {
		t.Fatalf("first upsert: %v", err)
	}

	second := Zigbee2MQTTConfig{
		Broker:   "second.example.com:1883",
		Username: "u",
		Password: "p",
		UseWSS:   false,
		Enabled:  false,
	}
	if err := s.UpsertZigbee2MQTTConfig(ctx, second); err != nil {
		t.Fatalf("second upsert: %v", err)
	}

	got, err := s.GetZigbee2MQTTConfig(ctx)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if got == nil || *got != second {
		t.Fatalf("want %+v after replace, got %+v", second, got)
	}
}

func TestZigbee2MQTTConfigDelete(t *testing.T) {
	ctx := context.Background()
	s := newTestStore(t)

	if err := s.UpsertZigbee2MQTTConfig(ctx, Zigbee2MQTTConfig{
		Broker:  "mqtt.example.com:1883",
		Enabled: true,
	}); err != nil {
		t.Fatalf("upsert: %v", err)
	}
	if err := s.DeleteZigbee2MQTTConfig(ctx); err != nil {
		t.Fatalf("delete: %v", err)
	}

	got, err := s.GetZigbee2MQTTConfig(ctx)
	if err != nil {
		t.Fatalf("get after delete: %v", err)
	}
	if got != nil {
		t.Fatalf("want nil config after delete, got %+v", got)
	}

	if err := s.DeleteZigbee2MQTTConfig(ctx); err != nil {
		t.Fatalf("delete on empty table must be a no-op: %v", err)
	}
}

// TestZigbee2MQTTConfigScanSchedule pins that the scan time survives the
// schedule being switched off: hour and minute are independent columns, so
// disabling writes them back unchanged and re-enabling restores them.
func TestZigbee2MQTTConfigScanSchedule(t *testing.T) {
	ctx := context.Background()
	s := newTestStore(t)

	hour, minute := int64(4), int64(30)
	if err := s.UpsertZigbee2MQTTConfig(ctx, Zigbee2MQTTConfig{
		Broker:              "mqtt.example.com:1883",
		Enabled:             true,
		ScanScheduleEnabled: true,
		ScanHour:            &hour,
		ScanMinute:          &minute,
	}); err != nil {
		t.Fatalf("upsert with schedule: %v", err)
	}

	got, err := s.GetZigbee2MQTTConfig(ctx)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if !got.ScanScheduleEnabled || got.ScanHour == nil || *got.ScanHour != hour ||
		got.ScanMinute == nil || *got.ScanMinute != minute {
		t.Fatalf("schedule round trip mismatch: %+v", got)
	}

	off := *got
	off.ScanScheduleEnabled = false
	if err := s.UpsertZigbee2MQTTConfig(ctx, off); err != nil {
		t.Fatalf("upsert disabled: %v", err)
	}
	got, err = s.GetZigbee2MQTTConfig(ctx)
	if err != nil {
		t.Fatalf("get after disable: %v", err)
	}
	if got.ScanScheduleEnabled {
		t.Fatal("schedule must be off")
	}
	if got.ScanHour == nil || *got.ScanHour != hour || got.ScanMinute == nil || *got.ScanMinute != minute {
		t.Fatalf("disabling the schedule must keep the stored time, got %+v", got)
	}
}
