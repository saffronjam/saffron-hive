package graph

import (
	"context"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/graph/model"
	"github.com/saffronjam/saffron-hive/internal/store"
)

// mockIntegrationController stands in for cmd/serve's adapterManager, which
// satisfies every integration interface with one value.
type mockIntegrationController struct {
	z2mEnabled    bool
	z2mConnected  bool
	tuyaOnline    bool
	scanRequested int
	scanStartedAt *time.Time
	scanErr       error
}

func (m *mockIntegrationController) ReconnectZigbee2MQTT(context.Context) error { return nil }

func (m *mockIntegrationController) TestZigbee2MQTT(context.Context, store.Zigbee2MQTTConfig) error {
	return nil
}

func (m *mockIntegrationController) Zigbee2MQTTConnected() bool { return m.z2mConnected }

func (m *mockIntegrationController) Zigbee2MQTTEnabled() bool { return m.z2mEnabled }

func (m *mockIntegrationController) ScanZigbee2MQTTNetwork(context.Context) error {
	m.scanRequested++
	return m.scanErr
}

func (m *mockIntegrationController) Zigbee2MQTTScanStartedAt(context.Context) *time.Time {
	return m.scanStartedAt
}

func (m *mockIntegrationController) ReconnectTuya(context.Context) error { return nil }

func (m *mockIntegrationController) TestTuya(context.Context, store.TuyaConfig) error { return nil }

func (m *mockIntegrationController) SyncTuya(context.Context) ([]device.Device, error) {
	return nil, nil
}

func (m *mockIntegrationController) TuyaConnected() bool { return m.tuyaOnline }

func integrationByProvider(t *testing.T, r *Resolver, provider string) *model.Integration {
	t.Helper()
	list, err := (&queryResolver{r}).Integrations(context.Background())
	if err != nil {
		t.Fatalf("integrations: %v", err)
	}
	for _, i := range list {
		if i.Provider == provider {
			return i
		}
	}
	t.Fatalf("provider %q missing from integrations, got %d entries", provider, len(list))
	return nil
}

func TestIntegrationsResolverReportsBothProviders(t *testing.T) {
	st := newMockStore()
	ctrl := &mockIntegrationController{}
	r := &Resolver{Store: st, Zigbee2MQTT: ctrl, Tuya: ctrl}

	list, err := (&queryResolver{r}).Integrations(context.Background())
	if err != nil {
		t.Fatalf("integrations: %v", err)
	}
	if len(list) != 2 {
		t.Fatalf("want 2 integrations, got %d", len(list))
	}
	if list[0].Provider != "zigbee2mqtt" || list[1].Provider != "tuya" {
		t.Fatalf("unexpected providers: %q, %q", list[0].Provider, list[1].Provider)
	}
	for _, i := range list {
		if i.Configured || i.Enabled || i.Connected {
			t.Errorf("%s should be unconfigured on an empty store, got %+v", i.Provider, i)
		}
	}
}

// TestIntegrationsResolverZigbee2MQTTStates walks the states the integrations
// page renders: unconfigured, configured-but-disabled, enabled-but-disconnected,
// and fully connected. `connected` must never be true while disabled.
func TestIntegrationsResolverZigbee2MQTTStates(t *testing.T) {
	cases := []struct {
		name           string
		cfg            *store.Zigbee2MQTTConfig
		enabled        bool
		connected      bool
		wantConfigured bool
		wantEnabled    bool
		wantConnected  bool
	}{
		{
			name: "no config",
			cfg:  nil,
		},
		{
			name: "empty broker is not configured",
			cfg:  &store.Zigbee2MQTTConfig{Broker: "", Enabled: true},
		},
		{
			name:           "configured but disabled",
			cfg:            &store.Zigbee2MQTTConfig{Broker: "mqtt.local:1883", Enabled: false},
			wantConfigured: true,
		},
		{
			name:           "enabled but broker unreachable",
			cfg:            &store.Zigbee2MQTTConfig{Broker: "mqtt.local:1883", Enabled: true},
			enabled:        true,
			wantConfigured: true,
			wantEnabled:    true,
		},
		{
			name:           "connected",
			cfg:            &store.Zigbee2MQTTConfig{Broker: "mqtt.local:1883", Enabled: true},
			enabled:        true,
			connected:      true,
			wantConfigured: true,
			wantEnabled:    true,
			wantConnected:  true,
		},
		{
			name:           "disabled config never reports connected",
			cfg:            &store.Zigbee2MQTTConfig{Broker: "mqtt.local:1883", Enabled: false},
			connected:      true,
			wantConfigured: true,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			st := newMockStore()
			st.zigbee2mqttCfg = tc.cfg
			ctrl := &mockIntegrationController{z2mEnabled: tc.enabled, z2mConnected: tc.connected}
			r := &Resolver{Store: st, Zigbee2MQTT: ctrl, Tuya: ctrl}

			got := integrationByProvider(t, r, "zigbee2mqtt")
			if got.Name != "Zigbee2MQTT" {
				t.Errorf("name = %q, want Zigbee2MQTT", got.Name)
			}
			if got.Configured != tc.wantConfigured {
				t.Errorf("configured = %v, want %v", got.Configured, tc.wantConfigured)
			}
			if got.Enabled != tc.wantEnabled {
				t.Errorf("enabled = %v, want %v", got.Enabled, tc.wantEnabled)
			}
			if got.Connected != tc.wantConnected {
				t.Errorf("connected = %v, want %v", got.Connected, tc.wantConnected)
			}
		})
	}
}

// TestIntegrationsResolverCountsDevicesBySource guards the single bucketing pass:
// each provider must count only its own devices.
func TestIntegrationsResolverCountsDevicesBySource(t *testing.T) {
	st := newMockStore()
	st.putDevice(device.Device{ID: "z1", Source: device.SourceZigbee2MQTT})
	st.putDevice(device.Device{ID: "z2", Source: device.SourceZigbee2MQTT})
	st.putDevice(device.Device{ID: "z3", Source: device.SourceZigbee2MQTT})
	st.putDevice(device.Device{ID: "t1", Source: device.SourceTuya})

	ctrl := &mockIntegrationController{}
	r := &Resolver{Store: st, Zigbee2MQTT: ctrl, Tuya: ctrl}

	if got := integrationByProvider(t, r, "zigbee2mqtt").DeviceCount; got != 3 {
		t.Errorf("zigbee2mqtt deviceCount = %d, want 3", got)
	}
	if got := integrationByProvider(t, r, "tuya").DeviceCount; got != 1 {
		t.Errorf("tuya deviceCount = %d, want 1", got)
	}
}

// TestIntegrationsResolverWithoutControllers covers the wiring used by the Go
// e2e harness, which builds a Resolver with no integration controllers.
func TestIntegrationsResolverWithoutControllers(t *testing.T) {
	st := newMockStore()
	st.zigbee2mqttCfg = &store.Zigbee2MQTTConfig{Broker: "mqtt.local:1883", Enabled: true}

	r := &Resolver{Store: st}
	got := integrationByProvider(t, r, "zigbee2mqtt")
	if !got.Enabled {
		t.Error("enabled should follow the stored config even without a controller")
	}
	if got.Connected {
		t.Error("connected must be false when no controller is wired")
	}
}
