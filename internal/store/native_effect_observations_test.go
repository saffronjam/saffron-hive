package store

import (
	"context"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
)

func TestNativeEffectObservationLifecycle(t *testing.T) {
	ctx := context.Background()
	s := newTestStore(t)
	if _, err := s.CreateDevice(ctx, CreateDeviceParams{
		ID: "lamp", FriendlyName: "Lamp", Source: device.SourceZigbee2MQTT, Type: device.Light,
	}); err != nil {
		t.Fatalf("create device: %v", err)
	}

	observation, err := s.GetNativeEffectObservation(ctx, "lamp", "underwater")
	if err != nil || observation != nil {
		t.Fatalf("initial observation = %+v, err=%v", observation, err)
	}

	params := UpsertNativeEffectObservationParams{
		DeviceID: "lamp", EffectName: "underwater", Result: "confirmed", EvidenceFingerprint: "firmware-a",
	}
	changed, err := s.UpsertNativeEffectObservation(ctx, params)
	if err != nil || !changed {
		t.Fatalf("first upsert changed=%v err=%v", changed, err)
	}
	changed, err = s.UpsertNativeEffectObservation(ctx, params)
	if err != nil || changed {
		t.Fatalf("identical upsert changed=%v err=%v", changed, err)
	}

	params.Result = "unsupported"
	changed, err = s.UpsertNativeEffectObservation(ctx, params)
	if err != nil || !changed {
		t.Fatalf("updated upsert changed=%v err=%v", changed, err)
	}
	observation, err = s.GetNativeEffectObservation(ctx, "lamp", "underwater")
	if err != nil || observation == nil || observation.Result != "unsupported" {
		t.Fatalf("updated observation = %+v, err=%v", observation, err)
	}

	if err := s.DeleteNativeEffectObservation(ctx, "lamp", "underwater"); err != nil {
		t.Fatalf("delete observation: %v", err)
	}
	observation, err = s.GetNativeEffectObservation(ctx, "lamp", "underwater")
	if err != nil || observation != nil {
		t.Fatalf("deleted observation = %+v, err=%v", observation, err)
	}
}
