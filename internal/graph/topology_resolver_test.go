package graph

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/99designs/gqlgen/graphql"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/graph/model"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func z2mInput(scheduleEnabled bool, hour, minute *int) model.Zigbee2MqttConfigInput {
	in := model.Zigbee2MqttConfigInput{
		Broker:              "mqtt.example.com:1883",
		Enabled:             true,
		ScanScheduleEnabled: scheduleEnabled,
	}
	if hour != nil {
		in.ScanHour = graphql.OmittableOf(hour)
	}
	if minute != nil {
		in.ScanMinute = graphql.OmittableOf(minute)
	}
	return in
}

func TestUpdateZigbee2MqttConfigScheduleRequiresTime(t *testing.T) {
	st := newMockStore()
	r := &Resolver{Store: st}

	_, err := (&mutationResolver{r}).UpdateZigbee2MqttConfig(context.Background(), z2mInput(true, nil, nil))
	if err == nil {
		t.Fatal("enabling the schedule without a time must fail")
	}

	hour, minute := 4, 30
	cfg, err := (&mutationResolver{r}).UpdateZigbee2MqttConfig(context.Background(), z2mInput(true, &hour, &minute))
	if err != nil {
		t.Fatalf("valid schedule rejected: %v", err)
	}
	if !cfg.ScanScheduleEnabled || cfg.ScanHour == nil || *cfg.ScanHour != 4 || cfg.ScanMinute == nil || *cfg.ScanMinute != 30 {
		t.Fatalf("schedule not round-tripped: %+v", cfg)
	}
}

func TestUpdateZigbee2MqttConfigScheduleRange(t *testing.T) {
	st := newMockStore()
	r := &Resolver{Store: st}

	badHour, minute := 24, 0
	if _, err := (&mutationResolver{r}).UpdateZigbee2MqttConfig(context.Background(), z2mInput(true, &badHour, &minute)); err == nil {
		t.Fatal("hour 24 must fail")
	}
	hour, badMinute := 4, 60
	if _, err := (&mutationResolver{r}).UpdateZigbee2MqttConfig(context.Background(), z2mInput(true, &hour, &badMinute)); err == nil {
		t.Fatal("minute 60 must fail")
	}
}

func TestUpdateZigbee2MqttConfigDisableKeepsStoredTime(t *testing.T) {
	st := newMockStore()
	hour, minute := int64(4), int64(30)
	st.zigbee2mqttCfg = &store.Zigbee2MQTTConfig{
		Broker:              "mqtt.example.com:1883",
		Enabled:             true,
		ScanScheduleEnabled: true,
		ScanHour:            &hour,
		ScanMinute:          &minute,
	}
	r := &Resolver{Store: st}

	cfg, err := (&mutationResolver{r}).UpdateZigbee2MqttConfig(context.Background(), z2mInput(false, nil, nil))
	if err != nil {
		t.Fatalf("disable: %v", err)
	}
	if cfg.ScanScheduleEnabled {
		t.Fatal("schedule must be off")
	}
	if cfg.ScanHour == nil || *cfg.ScanHour != 4 || cfg.ScanMinute == nil || *cfg.ScanMinute != 30 {
		t.Fatalf("disabling must keep the stored time, got %+v", cfg)
	}
	if st.zigbee2mqttCfg.ScanHour == nil || *st.zigbee2mqttCfg.ScanHour != 4 {
		t.Fatalf("stored time erased: %+v", st.zigbee2mqttCfg)
	}
}

func TestScanZigbee2MqttNetworkDelegates(t *testing.T) {
	st := newMockStore()
	ctrl := &mockIntegrationController{}
	r := &Resolver{Store: st, Zigbee2MQTT: ctrl}

	ok, err := (&mutationResolver{r}).ScanZigbee2MqttNetwork(context.Background())
	if err != nil || !ok {
		t.Fatalf("scan: ok=%v err=%v", ok, err)
	}
	if ctrl.scanRequested != 1 {
		t.Fatalf("controller not called, count=%d", ctrl.scanRequested)
	}

	ctrl.scanErr = errors.New("a network scan is already running")
	if _, err := (&mutationResolver{r}).ScanZigbee2MqttNetwork(context.Background()); err == nil {
		t.Fatal("controller error must propagate")
	}

	r.Zigbee2MQTT = nil
	if _, err := (&mutationResolver{r}).ScanZigbee2MqttNetwork(context.Background()); err == nil {
		t.Fatal("nil controller must error")
	}
}

func TestNetworkTopologiesQueryMaps(t *testing.T) {
	st := newMockStore()
	sensorID := device.DeviceID("0xsensor")
	scannedAt := time.Date(2026, 8, 12, 4, 0, 0, 0, time.UTC)
	st.topologies = []device.NetworkTopology{{
		Provider:  device.SourceZigbee2MQTT,
		ScannedAt: scannedAt,
		Nodes: []device.TopologyNode{
			{ID: "0xhub", Role: device.RoleHub},
			{ID: "0xsensor", DeviceID: &sensorID, Role: device.RoleLeaf},
		},
		Links: []device.TopologyLink{{
			Source: "0xsensor", Target: "0xhub", Kind: device.LinkParent,
			Quality: 0.69, RawQuality: 176, Stale: true, ObservedAt: scannedAt,
		}},
	}}
	r := &Resolver{Store: st}

	out, err := (&queryResolver{r}).NetworkTopologies(context.Background())
	if err != nil {
		t.Fatalf("query: %v", err)
	}
	if len(out) != 1 {
		t.Fatalf("want 1 topology, got %d", len(out))
	}
	topo := out[0]
	if topo.Provider != "zigbee2mqtt" || !topo.ScannedAt.Equal(scannedAt) {
		t.Fatalf("envelope: %+v", topo)
	}
	if len(topo.Nodes) != 2 || topo.Nodes[0].DeviceID != nil || topo.Nodes[1].DeviceID == nil {
		t.Fatalf("nodes: %+v", topo.Nodes)
	}
	link := topo.Links[0]
	if link.Kind != "parent" || !link.Stale || link.RawQuality != 176 {
		t.Fatalf("link: %+v", link)
	}
}
