package nativeeffect

import (
	"context"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
	"github.com/saffronjam/saffron-hive/internal/zigbeemetadata"
)

type fakeStore struct {
	observations map[string]store.NativeEffectObservation
	metadata     map[device.DeviceID]zigbeemetadata.Metadata
}

func (s *fakeStore) key(deviceID device.DeviceID, name string) string {
	return string(deviceID) + "\x00" + name
}

func (s *fakeStore) GetNativeEffectObservation(_ context.Context, deviceID device.DeviceID, name string) (*store.NativeEffectObservation, error) {
	observation, ok := s.observations[s.key(deviceID, name)]
	if !ok {
		return nil, nil
	}
	return &observation, nil
}

func (s *fakeStore) ListNativeEffectObservations(_ context.Context) ([]store.NativeEffectObservation, error) {
	out := make([]store.NativeEffectObservation, 0, len(s.observations))
	for _, observation := range s.observations {
		out = append(out, observation)
	}
	return out, nil
}

func (s *fakeStore) UpsertNativeEffectObservation(_ context.Context, params store.UpsertNativeEffectObservationParams) (bool, error) {
	key := s.key(params.DeviceID, params.EffectName)
	current, exists := s.observations[key]
	if exists && current.Result == params.Result && current.EvidenceFingerprint == params.EvidenceFingerprint {
		return false, nil
	}
	s.observations[key] = store.NativeEffectObservation{
		DeviceID: params.DeviceID, EffectName: params.EffectName, Result: params.Result,
		EvidenceFingerprint: params.EvidenceFingerprint, ObservedAt: time.Now(),
	}
	return true, nil
}

func (s *fakeStore) DeleteNativeEffectObservation(_ context.Context, deviceID device.DeviceID, name string) error {
	delete(s.observations, s.key(deviceID, name))
	return nil
}

func (s *fakeStore) GetZigbeeDeviceMetadata(_ context.Context, id device.DeviceID) (*zigbeemetadata.Metadata, error) {
	metadata, ok := s.metadata[id]
	if !ok {
		return nil, nil
	}
	return &metadata, nil
}

func TestFirmwareEvidenceInvalidatesLearnedCompatibility(t *testing.T) {
	ctx := context.Background()
	bus := eventbus.NewChannelBus()
	reader := device.NewMemoryStore()
	reader.Register(device.Device{
		ID: "lamp", Source: device.SourceZigbee2MQTT, Type: device.Light,
		Capabilities: []device.Capability{{
			Name: device.CapEffect, Access: device.CapabilityAccessSet, Values: []string{"underwater"},
		}},
	})
	reader.Register(device.Device{ID: "hub", Source: device.SourceZigbee2MQTT, Type: device.Hub})
	firmwareA := "1.116.8"
	converterA := "25.5.0"
	st := &fakeStore{
		observations: make(map[string]store.NativeEffectObservation),
		metadata: map[device.DeviceID]zigbeemetadata.Metadata{
			"lamp": {DeviceID: "lamp", SoftwareBuildID: &firmwareA},
			"hub":  {DeviceID: "hub", BridgeInfo: &zigbeemetadata.BridgeInfo{ZigbeeHerdsmanConvertersVersion: &converterA}},
		},
	}
	service := New(bus, st, reader)
	lamp, _ := reader.GetDevice("lamp")

	service.persistResult(ctx, device.NativeEffectResult{
		DeviceID: "lamp", Name: "underwater", Status: device.NativeEffectRunConfirmed,
	})
	status, err := service.Status(ctx, lamp, "underwater")
	if err != nil || status != device.NativeEffectSupportConfirmed {
		t.Fatalf("learned status = %q, err=%v", status, err)
	}

	firmwareB := "1.122.2"
	metadata := st.metadata["lamp"]
	metadata.SoftwareBuildID = &firmwareB
	st.metadata["lamp"] = metadata
	service.invalidateEvidence(eventbus.Event{Type: eventbus.EventZigbeeMetadataUpdated, DeviceID: "lamp"})
	status, err = service.Status(ctx, lamp, "underwater")
	if err != nil || status != device.NativeEffectSupportUntested {
		t.Fatalf("status after firmware change = %q, err=%v", status, err)
	}
	if len(st.observations) != 0 {
		t.Fatalf("stale observations were retained: %+v", st.observations)
	}
}

func TestUnconfirmedResultIsNotLearned(t *testing.T) {
	reader := device.NewMemoryStore()
	reader.Register(device.Device{ID: "lamp", Source: device.SourceZigbee2MQTT, Type: device.Light})
	st := &fakeStore{observations: make(map[string]store.NativeEffectObservation), metadata: make(map[device.DeviceID]zigbeemetadata.Metadata)}
	service := New(eventbus.NewChannelBus(), st, reader)
	service.persistResult(context.Background(), device.NativeEffectResult{
		DeviceID: "lamp", Name: "blink", Status: device.NativeEffectRunUnconfirmed,
	})
	if len(st.observations) != 0 {
		t.Fatalf("unconfirmed result was persisted: %+v", st.observations)
	}
}
