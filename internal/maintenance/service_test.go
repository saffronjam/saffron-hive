package maintenance

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store"
	"github.com/saffronjam/saffron-hive/internal/zigbeemetadata"
)

type memoryMaintenanceStore struct {
	mu       sync.Mutex
	acks     []store.MaintenanceAcknowledgement
	firmware []zigbeemetadata.Metadata
	config   *store.Zigbee2MQTTConfig
}

func (s *memoryMaintenanceStore) ListMaintenanceAcknowledgements(context.Context) ([]store.MaintenanceAcknowledgement, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	return append([]store.MaintenanceAcknowledgement(nil), s.acks...), nil
}

func (s *memoryMaintenanceStore) InsertMaintenanceAcknowledgements(_ context.Context, rows []store.InsertMaintenanceAcknowledgementParams) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, row := range rows {
		found := false
		for _, ack := range s.acks {
			if ack.TaskKey == row.TaskKey && ack.ConditionFingerprint == row.ConditionFingerprint {
				found = true
			}
		}
		if !found {
			s.acks = append(s.acks, store.MaintenanceAcknowledgement{
				TaskKey: row.TaskKey, ConditionFingerprint: row.ConditionFingerprint,
				CompletedAt: row.CompletedAt, CompletedBy: row.CompletedBy,
			})
		}
	}
	return nil
}

func (s *memoryMaintenanceStore) ResetMaintenanceAcknowledgements(_ context.Context, key string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	remaining := s.acks[:0]
	for _, ack := range s.acks {
		if ack.TaskKey != key {
			remaining = append(remaining, ack)
		}
	}
	s.acks = remaining
	return nil
}

func (s *memoryMaintenanceStore) DeleteMaintenanceAcknowledgementFingerprints(context.Context, string, []string) error {
	return nil
}

func (s *memoryMaintenanceStore) ListZigbeeFirmwareCandidates(context.Context) ([]zigbeemetadata.Metadata, error) {
	return append([]zigbeemetadata.Metadata(nil), s.firmware...), nil
}

func (s *memoryMaintenanceStore) GetZigbee2MQTTConfig(context.Context) (*store.Zigbee2MQTTConfig, error) {
	return s.config, nil
}

func TestBatteryEscalationAndRechargeCycle(t *testing.T) {
	ctx := context.Background()
	db := &memoryMaintenanceStore{}
	reader := device.NewMemoryStore()
	reader.Register(device.Device{ID: "sensor-1", FriendlyName: "Sensor", Source: device.SourceZigbee2MQTT, Type: device.Sensor})
	free := 0.5
	service := NewService(db, reader, NewBuffer(), "/data", func(string) (float64, error) { return free, nil })

	setBattery := func(value float64) {
		reader.UpdateDeviceState("sensor-1", device.DeviceState{Battery: &value})
		if err := service.Evaluate(ctx); err != nil {
			t.Fatal(err)
		}
	}
	setBattery(26)
	if len(service.Snapshot()) != 0 {
		t.Fatal("26% produced a task")
	}
	setBattery(25)
	first := service.Snapshot()
	if len(first) != 1 || first[0].ConditionFingerprint != "band:25" {
		t.Fatalf("25%% tasks = %+v", first)
	}
	if accepted, err := service.Complete(ctx, []string{first[0].ID, "stale"}, "user-1"); err != nil || len(accepted) != 1 {
		t.Fatalf("complete = %v, %v", accepted, err)
	}
	setBattery(20)
	second := service.Snapshot()
	if len(second) != 1 || second[0].ConditionFingerprint != "band:20" {
		t.Fatalf("20%% tasks = %+v", second)
	}
	if _, err := service.Complete(ctx, []string{second[0].ID}, "user-1"); err != nil {
		t.Fatal(err)
	}
	setBattery(25)
	if len(service.Snapshot()) != 0 {
		t.Fatal("strong acknowledgement did not suppress weaker band")
	}
	setBattery(10)
	if tasks := service.Snapshot(); len(tasks) != 1 || tasks[0].ConditionFingerprint != "band:10" {
		t.Fatalf("10%% tasks = %+v", tasks)
	}
	setBattery(50)
	setBattery(25)
	if tasks := service.Snapshot(); len(tasks) != 1 || tasks[0].ConditionFingerprint != "band:25" {
		t.Fatalf("fresh battery cycle tasks = %+v", tasks)
	}
}

func TestFirmwarePostureAndStorageRecurrence(t *testing.T) {
	ctx := context.Background()
	frontend := "https://z2m.example.com"
	state := "available"
	installed, latest := int64(1), int64(2)
	db := &memoryMaintenanceStore{
		config: &store.Zigbee2MQTTConfig{FrontendURL: &frontend},
		firmware: []zigbeemetadata.Metadata{{DeviceID: "sensor-1", OTA: zigbeemetadata.OTAStatus{
			State: &state, InstalledVersion: &installed, LatestVersion: &latest,
		}}},
	}
	reader := device.NewMemoryStore()
	reader.Register(device.Device{ID: "sensor-1", FriendlyName: "Sensor", Source: device.SourceZigbee2MQTT, Type: device.Sensor})
	posture := "abnormal"
	reader.UpdateDeviceState("sensor-1", device.DeviceState{DevicePosture: &posture})
	free := 0.09
	service := NewService(db, reader, NewBuffer(), "/data", func(string) (float64, error) { return free, nil })
	service.now = func() time.Time { return time.Unix(1_700_000_000, 0) }
	if err := service.Evaluate(ctx); err != nil {
		t.Fatal(err)
	}
	tasks := service.Snapshot()
	if len(tasks) != 3 || tasks[0].Kind != KindFirmware || tasks[1].Kind != KindPosture || tasks[2].Kind != KindStorage {
		t.Fatalf("initial tasks = %+v", tasks)
	}
	if tasks[0].ActionURL == nil || *tasks[0].ActionURL != "https://z2m.example.com/#/device/0/sensor-1/info" {
		t.Fatalf("firmware action URL = %v", tasks[0].ActionURL)
	}
	ids := []string{tasks[0].ID, tasks[1].ID, tasks[2].ID}
	if accepted, err := service.Complete(ctx, ids, "user-1"); err != nil || len(accepted) != 3 {
		t.Fatalf("complete all = %v, %v", accepted, err)
	}
	if len(service.Snapshot()) != 0 {
		t.Fatal("completed tasks remain visible")
	}

	latest = 3
	db.firmware[0].OTA.LatestVersion = &latest
	free = 0.04
	if err := service.Evaluate(ctx); err != nil {
		t.Fatal(err)
	}
	tasks = service.Snapshot()
	if len(tasks) != 2 || tasks[0].Kind != KindFirmware || tasks[1].ConditionFingerprint != "band:5" {
		t.Fatalf("escalated tasks = %+v", tasks)
	}

	posture = "normal"
	reader.UpdateDeviceState("sensor-1", device.DeviceState{DevicePosture: &posture})
	free = 0.13
	if err := service.Evaluate(ctx); err != nil {
		t.Fatal(err)
	}
	posture = "abnormal"
	reader.UpdateDeviceState("sensor-1", device.DeviceState{DevicePosture: &posture})
	if err := service.Evaluate(ctx); err != nil {
		t.Fatal(err)
	}
	foundPosture := false
	for _, task := range service.Snapshot() {
		foundPosture = foundPosture || task.Kind == KindPosture
	}
	if !foundPosture {
		t.Fatal("posture task did not return for a new abnormal cycle")
	}
}
