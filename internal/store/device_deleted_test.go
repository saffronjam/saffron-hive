package store

import (
	"context"
	"strings"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
)

func TestDeviceDeletedRoundTrip(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()
	if _, err := s.CreateDevice(ctx, CreateDeviceParams{
		ID: "d-1", FriendlyName: "Lamp", Source: device.SourceZigbee2MQTT, Type: device.Light,
	}); err != nil {
		t.Fatalf("create device: %v", err)
	}

	deleted, err := s.MarkDeviceDeleted(ctx, "d-1")
	if err != nil {
		t.Fatalf("mark deleted: %v", err)
	}
	if !deleted.Deleted || !deleted.Disabled {
		t.Fatalf("deleted device = %+v", deleted)
	}
	ids, err := s.ListRuntimeDisabledDeviceIDs(ctx)
	if err != nil {
		t.Fatalf("list runtime-disabled ids: %v", err)
	}
	if len(ids) != 1 || ids[0] != "d-1" {
		t.Fatalf("runtime-disabled ids = %v", ids)
	}
	if _, err := s.SetDeviceDisabled(ctx, "d-1", false); err == nil || !strings.Contains(err.Error(), "restore") {
		t.Fatalf("enable deleted device error = %v", err)
	}

	restored, err := s.RestoreDevice(ctx, "d-1")
	if err != nil {
		t.Fatalf("restore device: %v", err)
	}
	if restored.Deleted || !restored.Disabled {
		t.Fatalf("restored device = %+v", restored)
	}
	if _, err := s.SetDeviceDisabled(ctx, "d-1", false); err != nil {
		t.Fatalf("enable restored device: %v", err)
	}
}

func TestDeviceDeletedSurvivesAdapterWrites(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()
	params := CreateDeviceParams{
		ID: "d-1", FriendlyName: "Lamp", Source: device.SourceZigbee2MQTT, Type: device.Light,
	}
	if _, err := s.CreateDevice(ctx, params); err != nil {
		t.Fatalf("create device: %v", err)
	}
	if _, err := s.MarkDeviceDeleted(ctx, "d-1"); err != nil {
		t.Fatalf("mark deleted: %v", err)
	}
	params.FriendlyName = "Renamed Lamp"
	if err := s.UpsertDevice(ctx, params); err != nil {
		t.Fatalf("upsert device: %v", err)
	}
	if _, err := s.UpdateDevice(ctx, UpdateDeviceParams{ID: "d-1", Available: true, Removed: true}); err != nil {
		t.Fatalf("update adapter fields: %v", err)
	}

	d, err := s.GetDevice(ctx, "d-1")
	if err != nil {
		t.Fatalf("get device: %v", err)
	}
	if !d.Deleted || !d.Disabled || d.FriendlyName != "Renamed Lamp" || !d.Removed {
		t.Fatalf("device after adapter writes = %+v", d)
	}
}

func TestBatchDeviceDeletedTransitions(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()
	for _, id := range []device.DeviceID{"d-1", "d-2", "d-3"} {
		if _, err := s.CreateDevice(ctx, CreateDeviceParams{
			ID: id, FriendlyName: string(id), Source: device.SourceZigbee2MQTT, Type: device.Light,
		}); err != nil {
			t.Fatalf("create %s: %v", id, err)
		}
	}

	changed, err := s.BatchMarkDevicesDeleted(ctx, []device.DeviceID{"d-1", "d-2", "d-2", "missing"})
	if err != nil {
		t.Fatalf("batch delete: %v", err)
	}
	if len(changed) != 2 {
		t.Fatalf("batch delete changed %d devices", len(changed))
	}
	changed, err = s.BatchMarkDevicesDeleted(ctx, []device.DeviceID{"d-1", "d-2"})
	if err != nil || len(changed) != 0 {
		t.Fatalf("idempotent batch delete = (%d, %v)", len(changed), err)
	}

	changed, err = s.BatchRestoreDevices(ctx, []device.DeviceID{"d-2", "d-3", "missing"})
	if err != nil {
		t.Fatalf("batch restore: %v", err)
	}
	if len(changed) != 1 || changed[0].ID != "d-2" || changed[0].Deleted || !changed[0].Disabled {
		t.Fatalf("batch restored devices = %+v", changed)
	}
}
