package graph

import (
	"context"
	"fmt"
	"sync"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store"
)

type mockStateReader struct {
	mu       sync.RWMutex
	devices  []device.Device
	lights   map[device.DeviceID]*device.LightState
	sensors  map[device.DeviceID]*device.SensorState
	switches map[device.DeviceID]*device.SwitchState
}

func newMockStateReader() *mockStateReader {
	return &mockStateReader{
		lights:   make(map[device.DeviceID]*device.LightState),
		sensors:  make(map[device.DeviceID]*device.SensorState),
		switches: make(map[device.DeviceID]*device.SwitchState),
	}
}

func (m *mockStateReader) GetDevice(id device.DeviceID) (device.Device, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	for _, d := range m.devices {
		if d.ID == id {
			return d, true
		}
	}
	return device.Device{}, false
}

func (m *mockStateReader) GetLightState(id device.DeviceID) (*device.LightState, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	ls, ok := m.lights[id]
	return ls, ok
}

func (m *mockStateReader) GetSensorState(id device.DeviceID) (*device.SensorState, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	ss, ok := m.sensors[id]
	return ss, ok
}

func (m *mockStateReader) GetSwitchState(id device.DeviceID) (*device.SwitchState, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	sw, ok := m.switches[id]
	return sw, ok
}

func (m *mockStateReader) ListDevices() []device.Device {
	m.mu.RLock()
	defer m.mu.RUnlock()
	out := make([]device.Device, len(m.devices))
	copy(out, m.devices)
	return out
}

func (m *mockStateReader) addDevice(d device.Device) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.devices = append(m.devices, d)
}

func (m *mockStateReader) setLightState(id device.DeviceID, ls *device.LightState) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.lights[id] = ls
}

func (m *mockStateReader) setSensorState(id device.DeviceID, ss *device.SensorState) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.sensors[id] = ss
}

func (m *mockStateReader) setSwitchState(id device.DeviceID, sw *device.SwitchState) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.switches[id] = sw
}

type mockStore struct {
	mu                sync.RWMutex
	scenes            map[string]store.Scene
	sceneActions      map[string][]store.SceneAction
	automations       map[string]store.Automation
	automationActions map[string][]store.AutomationAction
	sensorReadings    []store.SensorReading

	createSceneCalled      bool
	deleteSceneCalled      bool
	createAutomationCalled bool
	deleteAutomationCalled bool
	toggleCalled           bool
}

func newMockStore() *mockStore {
	return &mockStore{
		scenes:            make(map[string]store.Scene),
		sceneActions:      make(map[string][]store.SceneAction),
		automations:       make(map[string]store.Automation),
		automationActions: make(map[string][]store.AutomationAction),
	}
}

func (m *mockStore) CreateDevice(_ context.Context, _ store.CreateDeviceParams) (device.Device, error) {
	return device.Device{}, nil
}

func (m *mockStore) GetDevice(_ context.Context, _ device.DeviceID) (device.Device, error) {
	return device.Device{}, nil
}

func (m *mockStore) ListDevices(_ context.Context) ([]device.Device, error) {
	return nil, nil
}

func (m *mockStore) ListDevicesBySource(_ context.Context, _ device.Source) ([]device.Device, error) {
	return nil, nil
}

func (m *mockStore) UpdateDevice(_ context.Context, _ store.UpdateDeviceParams) (device.Device, error) {
	return device.Device{}, nil
}

func (m *mockStore) DeleteDevice(_ context.Context, _ device.DeviceID) error {
	return nil
}

func (m *mockStore) RegisterZigbeeDevice(_ context.Context, _ store.RegisterZigbeeDeviceParams) (store.ZigbeeDevice, error) {
	return store.ZigbeeDevice{}, nil
}

func (m *mockStore) GetZigbeeDeviceByIEEEAddress(_ context.Context, _ string) (store.ZigbeeDevice, error) {
	return store.ZigbeeDevice{}, nil
}

func (m *mockStore) GetZigbeeDeviceByFriendlyName(_ context.Context, _ string) (store.ZigbeeDevice, error) {
	return store.ZigbeeDevice{}, nil
}

func (m *mockStore) CreateScene(_ context.Context, params store.CreateSceneParams) (store.Scene, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.createSceneCalled = true
	s := store.Scene{ID: params.ID, Name: params.Name}
	m.scenes[params.ID] = s
	return s, nil
}

func (m *mockStore) GetScene(_ context.Context, id string) (store.Scene, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	s, ok := m.scenes[id]
	if !ok {
		return store.Scene{}, fmt.Errorf("scene %q not found", id)
	}
	return s, nil
}

func (m *mockStore) ListScenes(_ context.Context) ([]store.Scene, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	var out []store.Scene
	for _, s := range m.scenes {
		out = append(out, s)
	}
	return out, nil
}

func (m *mockStore) DeleteScene(_ context.Context, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.deleteSceneCalled = true
	delete(m.scenes, id)
	delete(m.sceneActions, id)
	return nil
}

func (m *mockStore) CreateSceneAction(_ context.Context, params store.CreateSceneActionParams) (store.SceneAction, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	sa := store.SceneAction{
		ID:       params.ID,
		SceneID:  params.SceneID,
		DeviceID: params.DeviceID,
		Payload:  params.Payload,
	}
	m.sceneActions[params.SceneID] = append(m.sceneActions[params.SceneID], sa)
	return sa, nil
}

func (m *mockStore) ListSceneActions(_ context.Context, sceneID string) ([]store.SceneAction, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.sceneActions[sceneID], nil
}

func (m *mockStore) DeleteSceneAction(_ context.Context, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	for sceneID, actions := range m.sceneActions {
		var filtered []store.SceneAction
		for _, a := range actions {
			if a.ID != id {
				filtered = append(filtered, a)
			}
		}
		m.sceneActions[sceneID] = filtered
	}
	return nil
}

func (m *mockStore) CreateAutomation(_ context.Context, params store.CreateAutomationParams) (store.Automation, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.createAutomationCalled = true
	a := store.Automation{
		ID:              params.ID,
		Name:            params.Name,
		Enabled:         params.Enabled,
		TriggerEvent:    params.TriggerEvent,
		ConditionExpr:   params.ConditionExpr,
		CooldownSeconds: params.CooldownSeconds,
	}
	m.automations[params.ID] = a
	return a, nil
}

func (m *mockStore) GetAutomation(_ context.Context, id string) (store.Automation, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	a, ok := m.automations[id]
	if !ok {
		return store.Automation{}, fmt.Errorf("automation %q not found", id)
	}
	return a, nil
}

func (m *mockStore) ListAutomations(_ context.Context) ([]store.Automation, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	var out []store.Automation
	for _, a := range m.automations {
		out = append(out, a)
	}
	return out, nil
}

func (m *mockStore) ListEnabledAutomations(_ context.Context) ([]store.Automation, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	var out []store.Automation
	for _, a := range m.automations {
		if a.Enabled {
			out = append(out, a)
		}
	}
	return out, nil
}

func (m *mockStore) UpdateAutomationEnabled(_ context.Context, id string, enabled bool) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.toggleCalled = true
	a, ok := m.automations[id]
	if !ok {
		return fmt.Errorf("automation %q not found", id)
	}
	a.Enabled = enabled
	m.automations[id] = a
	return nil
}

func (m *mockStore) DeleteAutomation(_ context.Context, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.deleteAutomationCalled = true
	delete(m.automations, id)
	delete(m.automationActions, id)
	return nil
}

func (m *mockStore) CreateAutomationAction(_ context.Context, params store.CreateAutomationActionParams) (store.AutomationAction, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	aa := store.AutomationAction{
		ID:           params.ID,
		AutomationID: params.AutomationID,
		ActionType:   params.ActionType,
		DeviceID:     params.DeviceID,
		Payload:      params.Payload,
	}
	m.automationActions[params.AutomationID] = append(m.automationActions[params.AutomationID], aa)
	return aa, nil
}

func (m *mockStore) ListAutomationActions(_ context.Context, automationID string) ([]store.AutomationAction, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.automationActions[automationID], nil
}

func (m *mockStore) DeleteAutomationAction(_ context.Context, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	for autoID, actions := range m.automationActions {
		var filtered []store.AutomationAction
		for _, a := range actions {
			if a.ID != id {
				filtered = append(filtered, a)
			}
		}
		m.automationActions[autoID] = filtered
	}
	return nil
}

func (m *mockStore) InsertSensorReading(_ context.Context, _ store.InsertSensorReadingParams) (store.SensorReading, error) {
	return store.SensorReading{}, nil
}

func (m *mockStore) QuerySensorHistory(_ context.Context, q store.SensorHistoryQuery) ([]store.SensorReading, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	var out []store.SensorReading
	for _, r := range m.sensorReadings {
		if r.DeviceID != q.DeviceID {
			continue
		}
		if !q.From.IsZero() && r.RecordedAt.Before(q.From) {
			continue
		}
		if !q.To.IsZero() && r.RecordedAt.After(q.To) {
			continue
		}
		out = append(out, r)
		if q.Limit > 0 && len(out) >= q.Limit {
			break
		}
	}
	return out, nil
}

type mockReloader struct {
	mu     sync.Mutex
	called bool
}

func (m *mockReloader) Reload() error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.called = true
	return nil
}

func (m *mockReloader) wasCalled() bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.called
}
