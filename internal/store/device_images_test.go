package store

import (
	"reflect"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/cleaning"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/zigbeemetadata"
)

func TestDeviceImageSourcesFromStoredIntegrationMetadata(t *testing.T) {
	s := newTestStore(t)
	for _, d := range []CreateDeviceParams{{ID: "zigbee", Source: device.SourceZigbee2MQTT}, {ID: "vacuum", Source: device.SourceDreame}, {ID: "other", Source: device.SourceTuya}} {
		if err := s.UpsertDevice(t.Context(), d); err != nil {
			t.Fatal(err)
		}
	}
	icon, model := "https://example.com/sensor.png", "sensor-model"
	if _, err := s.UpsertZigbeeBridgeMetadata(t.Context(), zigbeemetadata.Metadata{DeviceID: "zigbee", Definition: &zigbeemetadata.Definition{Icon: &icon, Model: &model}}); err != nil {
		t.Fatal(err)
	}
	if err := s.SaveCleaningSnapshot(t.Context(), cleaning.Snapshot{DeviceID: "vacuum", ImageSources: []string{"https://example.com/vacuum.png"}}); err != nil {
		t.Fatal(err)
	}
	for _, tc := range []struct {
		id   device.DeviceID
		want []string
	}{
		{"zigbee", []string{icon, "https://www.zigbee2mqtt.io/images/devices/sensor-model.png"}},
		{"vacuum", []string{"https://example.com/vacuum.png"}},
		{"other", nil},
	} {
		got, err := s.DeviceImageSources(t.Context(), tc.id)
		if err != nil || !reflect.DeepEqual(got, tc.want) {
			t.Fatalf("%s sources=%v error=%v", tc.id, got, err)
		}
	}
	if _, err := s.DeviceImageSources(t.Context(), "missing"); err == nil {
		t.Fatal("unknown device image accepted")
	}
}
